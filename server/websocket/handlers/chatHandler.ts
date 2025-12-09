/**
 * Chat Message Handler
 * Handles incoming chat messages and SDK streaming
 */

import type { ServerWebSocket } from "bun";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { HookInput, SDKCompactBoundaryMessage, PostToolUseHookInput, SessionStartHookInput, PreCompactHookInput, SubagentStartHookInput, SubagentStopHookInput } from "@anthropic-ai/claude-agent-sdk";
import { sessionDb } from "../../database";
import { getSystemPrompt, injectWorkingDirIntoAgents } from "../../systemPrompt";
import { loadModePrompt } from "../../modes";
import { AVAILABLE_MODELS } from "../../../client/config/models";
import { configureProvider } from "../../providers";
import { getMcpServers } from "../../mcpServers";
import { AGENT_REGISTRY } from "../../agents";
import { validateDirectory, getDefaultWorkingDirectory } from "../../directoryUtils";
import { saveImageToSessionPictures, saveFileToSessionFiles } from "../../imageUtils";
import { backgroundProcessManager } from "../../backgroundProcessManager";
import { loadUserConfig } from "../../userConfig";
import { parseApiError, getUserFriendlyMessage } from "../../utils/apiErrors";
import { ActivityTimeoutController } from "../../utils/timeout";
import { sessionStreamManager } from "../../sessionStreamManager";
import { expandSlashCommand } from "../../slashCommandExpander";
import { renameSessionFolderFromFirstMessage, updateSessionTitleFromFirstMessage } from "../../folderNaming";
import {
  updateSessionBudget,
  getSessionBudget,
  getBudgetSummary,
  AUTONOM_BUDGET_CONFIG,
  DEFAULT_BUDGET_CONFIG,
} from "../../utils/costTracker";
import { handleAutonomContinuation } from "../../utils/autonomChain";
import { createAskUserQuestionServer, setQuestionCallback } from "../../mcp/askUserQuestion";

interface ChatWebSocketData {
  type: 'hot-reload' | 'chat';
  sessionId?: string;
}

// Build model mapping from configuration
const MODEL_MAP: Record<string, { apiModelId: string; provider: string }> = {};
AVAILABLE_MODELS.forEach(model => {
  MODEL_MAP[model.id] = {
    apiModelId: model.apiModelId,
    provider: model.provider,
  };
});

/**
 * Type guard to check if a message is a compact boundary message
 */
function isCompactBoundaryMessage(message: unknown): message is SDKCompactBoundaryMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'system' &&
    'subtype' in message &&
    message.subtype === 'compact_boundary'
  );
}

export async function handleChatMessage(
  ws: ServerWebSocket<ChatWebSocketData>,
  data: Record<string, unknown>,
  activeQueries: Map<string, unknown>
): Promise<void> {
  const { content, sessionId, model, timezone, isAutonomMode } = data;

  if (!content || !sessionId) {
    ws.send(JSON.stringify({ type: 'error', error: 'Missing content or sessionId' }));
    return;
  }

  // Get session for working directory access
  const session = sessionDb.getSession(sessionId as string);
  if (!session) {
    console.error('❌ Session not found:', sessionId);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Session not found'
    }));
    return;
  }

  // ✅ FIX #9: Update session permission mode based on client's isAutonomMode flag
  if (typeof isAutonomMode === 'boolean') {
    session.permission_mode = isAutonomMode ? 'autonom' : 'default';
  }

  let workingDir = session.working_directory;

  // Process attachments (images and files)
  const imagePaths: string[] = [];
  const filePaths: string[] = [];

  // Check if content is an array (contains blocks like text/image/file)
  const contentIsArray = Array.isArray(content);
  if (contentIsArray) {
    const contentBlocks = content as Array<Record<string, unknown>>;

    // Extract and save images and files
    for (const block of contentBlocks) {
      // Handle images
      if (block.type === 'image' && typeof block.source === 'object') {
        const source = block.source as Record<string, unknown>;
        if (source.type === 'base64' && typeof source.data === 'string') {
          // Save image to pictures folder
          const base64Data = `data:${source.media_type || 'image/png'};base64,${source.data}`;
          const imagePath = saveImageToSessionPictures(base64Data, sessionId as string, workingDir);
          imagePaths.push(imagePath);
        }
      }

      // Handle document files
      if (block.type === 'document' && typeof block.data === 'string' && typeof block.name === 'string') {
        const filePath = saveFileToSessionFiles(block.data as string, block.name as string, sessionId as string, workingDir);
        filePaths.push(filePath);
      }
    }
  }

  // Log attachments if any were saved
  if (imagePaths.length > 0 || filePaths.length > 0) {
    console.log(`📎 Attachments: ${imagePaths.length} image(s), ${filePaths.length} file(s)`);
  }

  // Extract text content for prompt
  let promptText = typeof content === 'string' ? content : '';
  if (Array.isArray(content)) {
    // Extract text blocks from content array
    const textBlocks = (content as Array<Record<string, unknown>>)
      .filter(b => b.type === 'text')
      .map(b => b.text as string);
    promptText = textBlocks.join('\n');
  }

  // Check for special built-in commands that need server-side handling
  const trimmedPrompt = promptText.trim();

  // Handle /compact command - show loading state while compacting
  if (trimmedPrompt === '/compact') {
    console.log('🗜️ /compact command detected - sending loading message');

    // Send loading message to client
    ws.send(JSON.stringify({
      type: 'compact_loading',
      sessionId: sessionId,
    }));
    // Continue to SDK - it will handle the actual compaction
  }

  // Handle /clear command - clear AI context but keep visual chat history
  if (trimmedPrompt === '/clear') {
    console.log('🧹 /clear command detected - clearing AI context (keeping visual history)');

    // Add system message to mark context boundary in chat history
    sessionDb.addMessage(sessionId as string, 'user', '/clear');
    sessionDb.addMessage(
      sessionId as string,
      'assistant',
      JSON.stringify([{
        type: 'text',
        text: '--- Context cleared. The AI will not remember previous messages ---'
      }])
    );

    // Clear SDK session ID to force fresh start (no resume from transcript)
    sessionDb.updateSdkSessionId(sessionId as string, null);

    // Abort current SDK subprocess if exists
    const wasAborted = sessionStreamManager.abortSession(sessionId as string);
    if (wasAborted) {
      console.log('🛑 Aborted existing SDK subprocess for clean start');
      sessionStreamManager.cleanupSession(sessionId as string, 'clear_command');
    }

    // Send context cleared message as assistant_message so client can render it
    ws.send(JSON.stringify({
      type: 'assistant_message',
      content: '--- Context cleared. The AI will not remember previous messages ---',
      sessionId: sessionId,
    }));

    ws.send(JSON.stringify({
      type: 'result',
      success: true,
      sessionId: sessionId,
    }));

    return; // Don't send to SDK
  }

  // Save user message to database (stringify if array)
  const contentForDb = typeof content === 'string' ? content : JSON.stringify(content);
  sessionDb.addMessage(sessionId as string, 'user', contentForDb);

  // Expand slash commands if detected
  if (trimmedPrompt.startsWith('/')) {
    const expandedPrompt = expandSlashCommand(trimmedPrompt, workingDir);
    if (expandedPrompt) {
      promptText = expandedPrompt;
    } else {
      console.warn(`⚠️  Slash command not found: ${promptText}`);
    }
  }

  // Inject attachment paths into prompt if any
  if (imagePaths.length > 0 || filePaths.length > 0) {
    const attachmentLines: string[] = [];
    imagePaths.forEach(p => attachmentLines.push(`[Image attached: ${p}]`));
    filePaths.forEach(p => attachmentLines.push(`[File attached: ${p}]`));
    promptText = attachmentLines.join('\n') + '\n\n' + promptText;
  }

  // Check if this is a new session or continuing existing
  const isNewStream = !sessionStreamManager.hasStream(sessionId as string);

  // Rename folder and update title from first message (for new sessions with default names)
  if (isNewStream && promptText) {
    const baseDir = getDefaultWorkingDirectory();

    // Try to rename folder based on content
    const folderRenameResult = await renameSessionFolderFromFirstMessage(
      sessionId as string,
      promptText,
      baseDir
    );

    if (folderRenameResult.success && folderRenameResult.newFolderName) {
      console.log(`📁 Folder renamed from first message: ${folderRenameResult.newFolderName}`);
      // Update workingDir to the new path after rename
      workingDir = `${baseDir}/${folderRenameResult.newFolderName}`;
    }

    // Try to update title from first message
    const titleUpdateResult = await updateSessionTitleFromFirstMessage(
      sessionId as string,
      promptText
    );

    if (titleUpdateResult.success) {
      console.log(`📝 Title updated from first message: ${titleUpdateResult.newTitle}`);

      // Notify client of title update
      ws.send(JSON.stringify({
        type: 'session_title_updated',
        sessionId: sessionId,
        newTitle: titleUpdateResult.newTitle,
      }));
    }
  }

  // ✅ FIX #10: Force Opus 4.5 for AUTONOM mode (most powerful model for complex chains)
  let selectedModel = model as string;
  if (session.permission_mode === 'autonom') {
    selectedModel = 'opus'; // Force Opus 4.5 for maximum capability during autonomous execution
    console.log(`🔧 AUTONOM MODE: Using Opus 4.5 for autonomous execution (overriding selected model)`);
  }

  // Get model configuration
  const modelConfig = MODEL_MAP[selectedModel] || MODEL_MAP['sonnet'];
  const { apiModelId, provider } = modelConfig;

  // Handle model switching - prepend context summary for continuity
  const modelSwitched = session.last_model && session.last_model !== model;
  if (modelSwitched) {
    const contextSummary = sessionDb.getContextSummary(sessionId as string);
    if (contextSummary) {
      console.log(`🔄 Model switched from ${session.last_model} to ${model} - adding context summary`);
      promptText = `${contextSummary}\n\n---\n\n${promptText}`;
    } else {
      console.log(`🔄 Model switched from ${session.last_model} to ${model}`);
    }

    // Clear SDK session ID to force fresh subprocess (no resume with different model)
    sessionDb.updateSdkSessionId(sessionId as string, null);
  }

  // Update the model being used
  sessionDb.updateProgress(sessionId as string, { model: model as string });

  // Configure provider (sets ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY env vars)
  const providerType = provider as 'anthropic' | 'z-ai' | 'moonshot';

  // Validate API key before proceeding (OAuth takes precedence over API key)
  try {
    await configureProvider(providerType);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Provider configuration error:', errorMessage);
    ws.send(JSON.stringify({
      type: 'error',
      message: errorMessage
    }));
    return;
  }

  // Get MCP servers for this provider (model-specific filtering for GLM)
  const mcpServers = getMcpServers(providerType, apiModelId);

  // Minimal request logging - one line summary
  // Note: At this point we haven't checked history yet, so we use isNewStream for subprocess status
  console.log(`📨 [${apiModelId} @ ${provider}] Session: ${sessionId?.toString().substring(0, 8)} (${session.mode} mode) ${isNewStream ? '🆕 NEW SUBPROCESS' : '♻️ CONTINUE SUBPROCESS'}`);

  // Validate working directory (only log on failure)
  const validation = validateDirectory(workingDir);
  if (!validation.valid) {
    console.error('❌ Working directory invalid:', validation.error);
    ws.send(JSON.stringify({
      type: 'error',
      message: `Working directory error: ${validation.error}`
    }));
    return;
  }

  // Warn if on WSL with Windows filesystem (10-20x performance penalty)
  if (process.platform === 'linux' && workingDir.startsWith('/mnt/')) {
    console.warn('⚠️  WARNING: Working directory is on Windows filesystem (WSL)');
    console.warn(`   Path: ${workingDir}`);
    console.warn('   This causes 10-20x slower file I/O operations');
    console.warn('   Move project to Linux filesystem (~/projects/) for better performance');
  }

  // For existing streams: Update WebSocket, enqueue message, and return
  // Background response loop is already running
  if (!isNewStream) {
    sessionStreamManager.updateWebSocket(sessionId as string, ws);
    sessionStreamManager.sendMessage(sessionId as string, promptText);
    return; // Background loop handles response
  }

  // For NEW streams: Spawn SDK and start background response processing
  try {

    // Load user configuration
    const userConfig = loadUserConfig();

    // Build query options with provider-specific system prompt (including agent list)
    // Add working directory context to system prompt AND all agent prompts
    let baseSystemPrompt = getSystemPrompt(providerType, AGENT_REGISTRY, userConfig, timezone as string | undefined, session.mode);

    // If autonom mode is active, prepend the autonomous execution prompt and initialize budget
    if (session.permission_mode === 'autonom') {
      const autonomPrompt = loadModePrompt('autonom');
      if (autonomPrompt) {
        baseSystemPrompt = `${autonomPrompt}\n\n---\n\n${baseSystemPrompt}`;
        console.log('🚀 AUTONOM MODE ACTIVE - Injecting autonomous execution prompt');

        // Initialize budget with autonom-specific limits ($50 max, 2M tokens)
        const budget = getSessionBudget(sessionId as string, AUTONOM_BUDGET_CONFIG);
        console.log(`💰 AUTONOM BUDGET INITIALIZED: $${budget.config.maxCostPerSession} max, ${budget.config.maxTokensPerSession.toLocaleString()} tokens max`);
      }
    } else {
      // Initialize default budget for regular sessions ($10 max)
      getSessionBudget(sessionId as string, DEFAULT_BUDGET_CONFIG);
    }

    const systemPromptWithContext = `${baseSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ENVIRONMENT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORKING DIRECTORY: ${workingDir}

When creating files for this session, use the WORKING DIRECTORY path above.
All file paths should be relative to this directory or use absolute paths within it.
Run bash commands with the understanding that this is your current working directory.
`;

    // Inject working directory context into all custom agent prompts
    const agentsWithWorkingDir = injectWorkingDirIntoAgents(AGENT_REGISTRY, workingDir);

    // Capture stderr output for better error messages
    let stderrOutput = '';

    // Check if we have SDK session ID from previous subprocess
    // Use efficient COUNT query instead of fetching all messages
    const messageCount = sessionDb.getMessageCount(sessionId as string);
    const isFirstMessage = messageCount === 1; // Only current message, no prior

    // Log resume decision
    if (!isFirstMessage && session.sdk_session_id) {
      console.log(`📋 Using resume with SDK session ID: ${session.sdk_session_id}`);
    } else if (!isFirstMessage) {
      console.log(`⚠️ No SDK session ID stored, cannot use resume`);
    }

    const queryOptions: Record<string, unknown> = {
      model: apiModelId,
      systemPrompt: systemPromptWithContext,
      permissionMode: 'bypassPermissions', // Always spawn with bypass - then switch if needed
      // Use SDK's internal session ID for resume (if available from previous subprocess)
      ...(isFirstMessage || !session.sdk_session_id ? {} : { resume: session.sdk_session_id }),
      includePartialMessages: true,
      agents: agentsWithWorkingDir, // Register custom agents with working dir context
      cwd: workingDir, // Set working directory for all tool executions
      settingSources: ['project'], // Load Skills from .claude/skills/ and agents from .claude/agents/
      // Let SDK manage its own subprocess spawning - don't override executable
      // abortController will be added after stream creation

      // Capture stderr from SDK's bundled CLI for debugging and error context
      stderr: (data: string) => {
        const trimmedData = data.trim();

        // Skip logging the massive system prompt dump from CLI spawn command
        if (trimmedData.includes('Spawning Claude Code process:') && trimmedData.includes('--system-prompt')) {
          return; // Skip this line entirely
        }

        console.error(`🔴 SDK CLI stderr [${provider}/${apiModelId}]:`, trimmedData);

        // Only capture lines that look like actual errors, not debug output or command echoes
        const lowerData = trimmedData.toLowerCase();
        const isActualError =
          lowerData.includes('error:') ||
          lowerData.includes('error ') ||
          lowerData.includes('invalid api key') ||
          lowerData.includes('authentication') ||
          lowerData.includes('unauthorized') ||
          lowerData.includes('permission') ||
          lowerData.includes('forbidden') ||
          lowerData.includes('credit') ||
          lowerData.includes('insufficient') ||
          lowerData.includes('quota') ||
          lowerData.includes('billing') ||
          lowerData.includes('rate limit') ||
          lowerData.includes('failed') ||
          lowerData.includes('401') ||
          lowerData.includes('403') ||
          lowerData.includes('429') ||
          (lowerData.includes('status') && (lowerData.includes('4') || lowerData.includes('5'))); // 4xx/5xx errors

        if (isActualError) {
          // Only keep actual error messages, limit to 300 chars
          stderrOutput = (stderrOutput + '\n' + trimmedData).slice(-300);
        }
      },
    };

    // Enable extended thinking for Anthropic and Moonshot models
    // Z.AI's Anthropic-compatible API doesn't support maxThinkingTokens parameter
    if (providerType === 'anthropic' || providerType === 'moonshot') {
      queryOptions.maxThinkingTokens = 10000;
      console.log('🧠 Extended thinking enabled with maxThinkingTokens:', queryOptions.maxThinkingTokens);
    } else {
      console.log('⚠️ Extended thinking not supported for provider:', providerType);
    }

    // SDK automatically uses its bundled CLI at @anthropic-ai/claude-agent-sdk/cli.js
    // No need to specify pathToClaudeCodeExecutable - the SDK handles this internally

    // Add MCP servers including our custom AskUserQuestion tool
    // The SDK doesn't expose AskUserQuestion in programmatic mode, so we provide it via MCP
    const askUserQuestionServer = createAskUserQuestionServer(sessionId as string);
    queryOptions.mcpServers = {
      ...mcpServers,
      'ask-user-question': askUserQuestionServer,
    };

    // Set up question callback to send questions to frontend via WebSocket
    setQuestionCallback((toolId: string, questions: unknown[], questionSessionId: string) => {
      sessionStreamManager.safeSend(
        questionSessionId,
        JSON.stringify({
          type: 'ask_user_question',
          toolId,
          questions,
          sessionId: questionSessionId,
        })
      );
    });

    // Add PreToolUse hook to intercept background Bash commands and long-running commands
    queryOptions.hooks = {
      PreToolUse: [{
        hooks: [async (input: HookInput, toolUseID: string | undefined) => {
          // PreToolUse hook has tool_name and tool_input properties
          type PreToolUseInput = HookInput & { tool_name: string; tool_input: Record<string, unknown> };

          if (input.hook_event_name !== 'PreToolUse') return {};

          const { tool_name, tool_input } = input as PreToolUseInput;

          if (tool_name !== 'Bash') return {};

          const bashInput = tool_input as Record<string, unknown>;
          const command = bashInput.command as string;
          const description = bashInput.description as string | undefined;
          const bashId = toolUseID || `bg-${Date.now()}`;

          // Detect long-running commands (install, build, test)
          const isInstallCommand = /\b(npm|bun|yarn|pnpm)\s+(install|i|add)\b/i.test(command);
          const isBuildCommand = /\b(npm|bun|yarn|pnpm)\s+(run\s+)?(build|compile)\b/i.test(command);
          const isTestCommand = /\b(npm|bun|yarn|pnpm)\s+(run\s+)?test\b/i.test(command);
          const isLongRunningCommand = isInstallCommand || isBuildCommand || isTestCommand;

          // Handle long-running commands with monitored background execution
          if (isLongRunningCommand && bashInput.run_in_background !== true) {
            const commandType = isInstallCommand ? 'install' : isBuildCommand ? 'build' : 'test';

            // Spawn background process
            const { pid } = await backgroundProcessManager.spawn(command, workingDir, bashId, sessionId as string, description);

            console.log(`📦 Running ${commandType} (PID ${pid}): ${command.slice(0, 50)}${command.length > 50 ? '...' : ''}`);

            // Save long-running command to database immediately
            const longRunningCommandBlock = {
              type: 'long_running_command',
              bashId,
              command,
              commandType,
              output: '',
              status: 'running',
            };
            const dbMessage = sessionDb.addMessage(
              sessionId as string,
              'assistant',
              JSON.stringify([longRunningCommandBlock])
            );

            // Notify client that long-running command started
            ws.send(JSON.stringify({
              type: 'long_running_command_started',
              bashId,
              command,
              commandType,
              description,
              startedAt: Date.now(),
            }));

            let accumulatedOutput = '';

            try {
              // Wait for completion with output streaming
              const result = await backgroundProcessManager.waitForCompletion(bashId, {
                timeout: 600000, // 10 minutes
                hangTimeout: 120000, // 2 minutes no output = hang
                onOutput: (chunk) => {
                  // Accumulate output
                  accumulatedOutput += chunk;

                  // Update database with accumulated output
                  sessionDb.updateMessage(
                    dbMessage.id,
                    JSON.stringify([{
                      ...longRunningCommandBlock,
                      output: accumulatedOutput,
                    }])
                  );

                  // Stream output to client
                  ws.send(JSON.stringify({
                    type: 'command_output_chunk',
                    bashId,
                    output: chunk,
                  }));
                },
              });

              // Log and notify completion
              console.log(`✅ Command completed (exit ${result.exitCode}): ${command.slice(0, 50)}${command.length > 50 ? '...' : ''}`);

              // Update database with final status
              sessionDb.updateMessage(
                dbMessage.id,
                JSON.stringify([{
                  ...longRunningCommandBlock,
                  output: accumulatedOutput || result.output,
                  status: 'completed',
                }])
              );

              ws.send(JSON.stringify({
                type: 'long_running_command_completed',
                bashId,
                exitCode: result.exitCode,
              }));


              // Return the actual output to Claude
              return {
                decision: 'approve' as const,
                updatedInput: {
                  command: `cat <<'EOF'\n${result.output}\nEOF`,
                  description,
                },
              };
            } catch (error) {
              console.error(`❌ Long-running command failed:`, error);

              // Update database with error status
              sessionDb.updateMessage(
                dbMessage.id,
                JSON.stringify([{
                  ...longRunningCommandBlock,
                  output: accumulatedOutput || (error instanceof Error ? error.message : String(error)),
                  status: 'failed',
                }])
              );

              // Notify error
              ws.send(JSON.stringify({
                type: 'long_running_command_failed',
                bashId,
                error: error instanceof Error ? error.message : String(error),
              }));

              // Return error to Claude
              return {
                decision: 'approve' as const,
                updatedInput: {
                  command: `echo "Error: ${error instanceof Error ? error.message : String(error)}" >&2 && exit 1`,
                  description,
                },
              };
            }
          }

          // Handle regular background commands (e.g., dev servers)
          if (bashInput.run_in_background === true) {

            // Check if this specific command is already running for this session
            const existingProcess = backgroundProcessManager.findExistingProcess(sessionId as string, command);

            if (existingProcess) {
              // Check if the process is actually still alive
              try {
                // kill -0 doesn't kill the process, just checks if it exists
                process.kill(existingProcess.pid, 0);
                // Process is alive, block duplicate
                return {
                  decision: 'approve' as const,
                  updatedInput: {
                    command: `echo "✓ Command already running in background (PID ${existingProcess.pid}, started at ${new Date(existingProcess.startedAt).toLocaleTimeString()})"`,
                    description,
                  },
                };
              } catch {
                // Process is dead, remove from registry and allow respawn
                backgroundProcessManager.delete(existingProcess.bashId);
              }
            }

            // Spawn the process ourselves
            const { pid } = await backgroundProcessManager.spawn(command, workingDir, bashId, sessionId as string, description);

            console.log(`🚀 Background process spawned (PID ${pid}): ${command.slice(0, 50)}${command.length > 50 ? '...' : ''}`);

            // Notify the client
            ws.send(JSON.stringify({
              type: 'background_process_started',
              bashId,
              command,
              description,
              startedAt: Date.now(),
            }));

            // Replace the command with an echo so the SDK gets a successful result
            // This prevents the agent from retrying
            return {
              decision: 'approve' as const,
              updatedInput: {
                command: `echo "✓ Background server started (PID ${pid})"`,
                description,
              },
            };
          }

          // Not a special command, let it pass through
          return {};
        }],
      }],

      // PostToolUse hook - track tool results for progress and debugging
      PostToolUse: [{
        hooks: [async (input: HookInput) => {
          if (input.hook_event_name !== 'PostToolUse') return {};

          const { tool_name, tool_response } = input as PostToolUseHookInput;

          // Log tool completion
          console.log(`✅ Tool completed: ${tool_name}`);

          // Track specific tool results for progress updates
          if (tool_name === 'Write' || tool_name === 'Edit') {
            sessionDb.updateProgress(sessionId as string, {
              lastActivity: 'idle',
              resumeHint: 'File write completed',
            });
          } else if (tool_name === 'Bash') {
            // Check for test results or build output
            const response = String(tool_response || '');
            if (response.includes('PASS') || response.includes('passed')) {
              sessionDb.updateProgress(sessionId as string, {
                resumeHint: 'Tests passing',
              });
            } else if (response.includes('FAIL') || response.includes('failed')) {
              sessionDb.updateProgress(sessionId as string, {
                resumeHint: 'Tests failing - needs attention',
              });
            }
          }

          return {};
        }],
      }],

      // SessionStart hook - log session initialization
      SessionStart: [{
        hooks: [async (input: HookInput) => {
          if (input.hook_event_name !== 'SessionStart') return {};

          const { source } = input as SessionStartHookInput;
          console.log(`🚀 Session started (source: ${source}) for ${sessionId.toString().substring(0, 8)}`);

          // Track session start in database
          sessionDb.updateProgress(sessionId as string, {
            lastActivity: 'idle',
            resumeHint: `Session started (${source})`,
          });

          return {};
        }],
      }],

      // PreCompact hook - save progress before auto-compact
      PreCompact: [{
        hooks: [async (input: HookInput) => {
          if (input.hook_event_name !== 'PreCompact') return {};

          const { trigger } = input as PreCompactHookInput;
          console.log(`🗜️ Pre-compact (${trigger}) - saving progress for ${sessionId.toString().substring(0, 8)}`);

          // Save current progress state before compaction
          sessionDb.updateProgress(sessionId as string, {
            resumeHint: trigger === 'auto' ? 'Context auto-compacted' : 'Context manually compacted',
            lastActivity: 'idle',
          });

          // Notify client that compact is about to happen
          sessionStreamManager.safeSend(
            sessionId as string,
            JSON.stringify({
              type: 'pre_compact',
              trigger,
              sessionId: sessionId,
            })
          );

          return {};
        }],
      }],

      // SubagentStart hook - track sub-agent spawning
      SubagentStart: [{
        hooks: [async (input: HookInput) => {
          if (input.hook_event_name !== 'SubagentStart') return {};

          const { agent_id, agent_type } = input as SubagentStartHookInput;
          console.log(`🤖 Sub-agent started: ${agent_type} (${agent_id.substring(0, 8)})`);

          // Notify client of sub-agent start
          sessionStreamManager.safeSend(
            sessionId as string,
            JSON.stringify({
              type: 'subagent_start',
              agentId: agent_id,
              agentType: agent_type,
              sessionId: sessionId,
            })
          );

          return {};
        }],
      }],

      // SubagentStop hook - track sub-agent completion
      SubagentStop: [{
        hooks: [async (input: HookInput) => {
          if (input.hook_event_name !== 'SubagentStop') return {};

          const { agent_id } = input as SubagentStopHookInput;
          console.log(`✅ Sub-agent completed: ${agent_id.substring(0, 8)}`);

          // Notify client of sub-agent completion
          sessionStreamManager.safeSend(
            sessionId as string,
            JSON.stringify({
              type: 'subagent_stop',
              agentId: agent_id,
              sessionId: sessionId,
            })
          );

          return {};
        }],
      }],
    };

    // Create activity-based timeout controller with hang detection
    // Detects both total timeout (10min) and activity-based hangs (no output for 3min)
    const timeoutController = new ActivityTimeoutController({
      timeoutMs: 600000, // 10 minutes total
      warningMs: 300000,  // 5 minutes warning
      hangWarningMs: 90000,  // 1.5 minutes no activity = warning
      hangAbortMs: 180000,   // 3 minutes no activity = abort (agents stuck)
      onWarning: () => {
        console.log(`⚠️ [TIMEOUT] Warning: 5 minutes elapsed for session ${sessionId.toString().substring(0, 8)}`);
        sessionStreamManager.safeSend(
          sessionId as string,
          JSON.stringify({
            type: 'timeout_warning',
            message: 'AI is taking longer than usual...',
            elapsedSeconds: 300,
            sessionId: sessionId,
          })
        );
      },
      onTimeout: () => {
        console.log(`🔴 [TIMEOUT] Hard timeout reached (10min) for session ${sessionId.toString().substring(0, 8)}, aborting session`);

        const aborted = sessionStreamManager.abortSession(sessionId as string);

        if (aborted) {
          sessionStreamManager.safeSend(
            sessionId as string,
            JSON.stringify({
              type: 'error',
              message: 'Task timed out after 10 minutes. Please try breaking down your request into smaller steps.',
              errorType: 'timeout',
              sessionId: sessionId,
            })
          );

          sessionStreamManager.cleanupSession(sessionId as string, 'timeout');
          activeQueries.delete(sessionId as string);
        }
      },
      onHangWarning: (lastActivityType, silentMs) => {
        console.log(`⚠️ [HANG] No activity for ${Math.floor(silentMs / 1000)}s (last: ${lastActivityType}) - session ${sessionId.toString().substring(0, 8)}`);
        sessionStreamManager.safeSend(
          sessionId as string,
          JSON.stringify({
            type: 'hang_warning',
            message: `AI appears to be stuck (no output for ${Math.floor(silentMs / 1000)}s)...`,
            lastActivity: lastActivityType,
            silentSeconds: Math.floor(silentMs / 1000),
            sessionId: sessionId,
          })
        );
      },
      onHangAbort: (lastActivityType, silentMs) => {
        console.log(`🔴 [HANG] Aborting session ${sessionId.toString().substring(0, 8)} - no activity for ${Math.floor(silentMs / 1000)}s (last: ${lastActivityType})`);

        const aborted = sessionStreamManager.abortSession(sessionId as string);

        if (aborted) {
          sessionStreamManager.safeSend(
            sessionId as string,
            JSON.stringify({
              type: 'error',
              message: `Agent stopped responding (no activity for ${Math.floor(silentMs / 1000)}s). Try rephrasing or breaking down the task.`,
              errorType: 'hang',
              lastActivity: lastActivityType,
              sessionId: sessionId,
            })
          );

          sessionStreamManager.cleanupSession(sessionId as string, 'hang_detected');
          activeQueries.delete(sessionId as string);
        }
      },
    });

    // Set up output token limit callbacks (25000 token limit workaround)
    timeoutController.setOutputTokenCallbacks(
      (tokenCount) => {
        console.log(`⚠️ [OUTPUT TOKENS] Approaching limit: ${tokenCount}/25000 tokens`);
        sessionStreamManager.safeSend(
          sessionId as string,
          JSON.stringify({
            type: 'output_token_warning',
            message: `Response is getting long (${tokenCount} tokens). Consider asking for a summary.`,
            outputTokens: tokenCount,
            sessionId: sessionId,
          })
        );
      },
      (tokenCount) => {
        console.log(`🔴 [OUTPUT TOKENS] Limit reached: ${tokenCount}/25000 tokens - advising continuation`);
        sessionStreamManager.safeSend(
          sessionId as string,
          JSON.stringify({
            type: 'output_token_limit',
            message: `Output limit approaching (${tokenCount} tokens). The AI may stop mid-response. You can type "continue" to get more.`,
            outputTokens: tokenCount,
            sessionId: sessionId,
          })
        );
      }
    );

    // Retry configuration
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 2000;
    const BACKOFF_MULTIPLIER = 2;

    let attemptNumber = 0;
    let _lastError: unknown = null;

    // Retry loop
    while (attemptNumber < MAX_RETRIES) {
      attemptNumber++;

      try {
        // Only log retries (not first attempt)
        if (attemptNumber > 1) {
          console.log(`🔄 Retry attempt ${attemptNumber}/${MAX_RETRIES}`);
        }

        // Create AsyncIterable stream for this session (this creates the AbortController)
        const messageStream = sessionStreamManager.getOrCreateStream(sessionId as string);

        // Get AbortController from session stream manager (NOW it exists)
        const abortController = sessionStreamManager.getAbortController(sessionId as string);
        if (!abortController) {
          console.error('❌ No AbortController found for session:', sessionId);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Session initialization error'
          }));
          return;
        }

        // Add AbortController to query options
        queryOptions.abortController = abortController;

        // Spawn SDK with AsyncIterable stream (resume option loads history from transcript files)
        console.log(`🔄 [SDK] Spawning Claude SDK subprocess for session ${sessionId.toString().substring(0, 8)}...`);
        const spawnStart = Date.now();
        const result = query({
          prompt: messageStream,
          options: queryOptions
        });
        const spawnTime = Date.now() - spawnStart;
        console.log(`✅ [SDK] Subprocess spawned in ${spawnTime}ms for session ${sessionId.toString().substring(0, 8)}`);

        // Register query and store for mid-stream control
        sessionStreamManager.registerQuery(sessionId as string, result);
        activeQueries.set(sessionId as string, result);

        // Set active WebSocket for this session
        sessionStreamManager.updateWebSocket(sessionId as string, ws);

        // Enqueue current message (SDK loads history via resume option)
        sessionStreamManager.sendMessage(sessionId as string, promptText);

        // If session is in plan mode, immediately switch after spawn
        // (SDK always spawns with bypassPermissions to allow bidirectional mode switching)
        if (session.permission_mode === 'plan') {
          try {
            console.log('🔄 Switching to plan mode');
            await result.setPermissionMode('plan');
          } catch (error) {
            console.error('❌ Failed to set permission mode to plan:', error);
            // Continue with bypassPermissions as fallback
            console.warn('⚠️  Continuing with bypassPermissions mode');
          }
        }

        // Note: We don't fetch commands from SDK here because supportedCommands()
        // only returns built-in SDK commands, not custom .md files from .claude/commands/
        // Custom commands are loaded via REST API when session is switched

        // Start background response processing loop (non-blocking)
        // This loop runs continuously, processing responses for ALL messages in the session
        await processResponseLoop(
          result,
          sessionId as string,
          apiModelId,
          ws,
          timeoutController,
          activeQueries,
          session
        );

        break; // Exit retry loop

      } catch (error) {
        _lastError = error;
        console.error(`❌ Query attempt ${attemptNumber}/${MAX_RETRIES} failed:`, error);

        // Clean up failed session stream before retrying
        sessionStreamManager.cleanupSession(sessionId as string, 'retry_cleanup');
        activeQueries.delete(sessionId as string);

        // Parse error with stderr context for better error messages
        const parsedError = parseApiError(error, stderrOutput);
        console.log('📊 Parsed error:', {
          type: parsedError.type,
          message: parsedError.message,
          isRetryable: parsedError.isRetryable,
          requestId: parsedError.requestId,
          stderrContext: parsedError.stderrContext ? parsedError.stderrContext.slice(0, 100) + '...' : undefined,
        });

        // Check if error is retryable
        if (!parsedError.isRetryable) {
          console.error('❌ Non-retryable error, aborting:', parsedError.type);

          // Send error to client with specific error type
          ws.send(JSON.stringify({
            type: 'error',
            errorType: parsedError.type,
            message: getUserFriendlyMessage(parsedError),
            requestId: parsedError.requestId,
            sessionId: sessionId,
          }));

          // Clean up
          timeoutController.cancel();
          break; // Don't retry
        }

        // Check if we've exhausted retries
        if (attemptNumber >= MAX_RETRIES) {
          console.error('❌ Max retries reached, giving up');

          // Send final error to client
          ws.send(JSON.stringify({
            type: 'error',
            errorType: parsedError.type,
            message: getUserFriendlyMessage(parsedError),
            requestId: parsedError.requestId,
            sessionId: sessionId,
          }));

          // Clean up
          timeoutController.cancel();
          break;
        }

        // Calculate retry delay with exponential backoff
        let delayMs = INITIAL_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attemptNumber - 1);

        // Respect rate limit retry-after
        if (parsedError.type === 'rate_limit_error' && parsedError.retryAfterSeconds) {
          delayMs = parsedError.retryAfterSeconds * 1000;
        }

        // Cap at 16 seconds
        delayMs = Math.min(delayMs, 16000);

        // Notify client of retry
        ws.send(JSON.stringify({
          type: 'retry_attempt',
          attempt: attemptNumber,
          maxAttempts: MAX_RETRIES,
          delayMs: delayMs,
          errorType: parsedError.type,
          message: `Retrying... (attempt ${attemptNumber}/${MAX_RETRIES})`,
          sessionId: sessionId,
        }));

        // Wait before retrying
        console.log(`⏳ Waiting ${delayMs}ms before retry ${attemptNumber + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Continue to next iteration of retry loop
      }
    }

  } catch (error) {
    // This catch is for errors outside the retry loop (e.g., session validation)
    console.error('WebSocket handler error:', error);
    // No stderr context available here since this is before SDK initialization
    const parsedError = parseApiError(error);
    ws.send(JSON.stringify({
      type: 'error',
      errorType: parsedError.type,
      message: getUserFriendlyMessage(parsedError),
      sessionId: sessionId,
    }));
  }
}

// Split out the response processing loop to keep chatHandler under 1500 lines
async function processResponseLoop(
  result: unknown,
  sessionId: string,
  apiModelId: string,
  ws: ServerWebSocket<ChatWebSocketData>,
  timeoutController: ActivityTimeoutController,
  activeQueries: Map<string, unknown>,
  session: { permission_mode: string }
): Promise<void> {
  // Per-turn state (resets after each completion)
  let currentMessageContent: unknown[] = [];
  let currentTextResponse = '';
  let totalCharCount = 0;
  let currentMessageId: string | null = null; // Track DB message ID for incremental saves
  let exitPlanModeSentThisTurn = false; // Prevent duplicate plan modals
  let toolUseCount = 0; // Track number of tools executed (for hang detection logging)

  // Heartbeat every 30 seconds to prevent WebSocket idle timeout
  const heartbeatInterval = setInterval(() => {
    const elapsed = timeoutController.getElapsedSeconds();

    // Send keepalive through WebSocket to prevent Bun's idleTimeout from closing the connection
    sessionStreamManager.safeSend(
      sessionId,
      JSON.stringify({
        type: 'keepalive',
        elapsedSeconds: elapsed,
        sessionId: sessionId,
      })
    );
  }, 30000);

  try {
    // Stream the response - query() is an AsyncGenerator
    // Loop runs indefinitely, processing message after message
    for await (const message of result as AsyncIterable<unknown>) {
      // Only check timeout (don't reset yet - only reset on meaningful progress)
      timeoutController.checkTimeout();

      // Capture SDK's internal session ID from first system message
      if ((message as { type: string }).type === 'system' && (message as { subtype?: string }).subtype === 'init') {
        const initMsg = message as { session_id?: string; tools?: string[] };
        const sdkSessionId = initMsg.session_id;
        if (sdkSessionId && sdkSessionId !== sessionId) {
          sessionDb.updateSdkSessionId(sessionId, sdkSessionId);
        }
        // Log available tools for debugging
        if (initMsg.tools) {
          console.log(`🔧 SDK available tools (${initMsg.tools.length}):`, initMsg.tools.join(', '));
        }
        continue; // Skip further processing for system messages
      }

      // Detect compact boundary - conversation was compacted
      if (isCompactBoundaryMessage(message)) {
        const trigger = message.compact_metadata.trigger;
        const preTokens = message.compact_metadata.pre_tokens;

        if (trigger === 'auto') {
          console.log(`🗜️ Auto-compact: ${preTokens.toLocaleString()} tokens → summarized`);

          // Save divider message to database for auto-compact persistence
          sessionDb.addMessage(
            sessionId,
            'assistant',
            JSON.stringify([{
              type: 'text',
              text: `--- Auto-compact: Context reached limit (${preTokens.toLocaleString()} tokens). History was automatically summarized ---`
            }])
          );

          // For auto-compact: send notification that compaction is starting (no divider)
          // Claude will continue responding after compaction completes
          sessionStreamManager.safeSend(
            sessionId,
            JSON.stringify({
              type: 'compact_start',
              trigger: 'auto',
              preTokens: preTokens,
              sessionId: sessionId,
            })
          );
        } else {
          console.log(`🗜️ Manual compact: ${preTokens.toLocaleString()} tokens → summarized`);

          // Save divider message to database for persistence
          sessionDb.addMessage(
            sessionId,
            'assistant',
            JSON.stringify([{
              type: 'text',
              text: `--- History compacted. Previous messages were summarized to reduce token usage (${preTokens.toLocaleString()} tokens before compact) ---`
            }])
          );

          // For manual compact: send completion message to replace loading state
          sessionStreamManager.safeSend(
            sessionId,
            JSON.stringify({
              type: 'compact_complete',
              preTokens: preTokens,
              sessionId: sessionId,
            })
          );
        }

        continue; // Skip further processing for system messages
      }

      // Handle turn completion
      if ((message as { type: string }).type === 'result') {
        console.log(`✅ Turn completed: ${(message as { subtype: string }).subtype}`);

        // Reset timeout on turn completion (meaningful progress)
        timeoutController.reset();

        // Final save (if no content was saved incrementally)
        if (!currentMessageId) {
          if (currentMessageContent.length > 0) {
            sessionDb.addMessage(sessionId, 'assistant', JSON.stringify(currentMessageContent));
          } else if (currentTextResponse) {
            sessionDb.addMessage(sessionId, 'assistant', JSON.stringify([{ type: 'text', text: currentTextResponse }]));
          }
        }

        // Extract usage data and handle budget tracking...
        // (Implementation continues in part 2 due to length)

        // Send completion signal
        sessionStreamManager.safeSend(
          sessionId,
          JSON.stringify({ type: 'result', success: true, sessionId: sessionId })
        );

        // Update progress tracking
        sessionDb.updateProgress(sessionId, {
          lastActivity: 'idle',
          model: apiModelId,
        });

        // Cancel timeout for this turn
        timeoutController.cancel();

        // Reset state for next turn
        currentMessageContent = [];
        currentTextResponse = '';
        totalCharCount = 0;
        currentMessageId = null;
        exitPlanModeSentThisTurn = false;
        toolUseCount = 0;
        timeoutController.resetOutputTokens();

        // ✅ AUTONOM Mode: Check if should continue
        if (session.permission_mode === 'autonom') {
          console.log(`🔄 AUTONOM MODE: Checking if should continue to next step for session ${sessionId.substring(0, 8)}`);

          try {
            const shouldContinue = await handleAutonomContinuation(
              sessionId,
              sessionStreamManager,
              undefined
            );

            if (shouldContinue) {
              console.log(`✅ AUTONOM MODE: Continuing to next step, waiting for SDK response...`);
            } else {
              console.log(`🛑 AUTONOM MODE: Autonomous execution ended (max steps, budget, or timeout reached)`);
            }
          } catch (autonomError) {
            console.error(`❌ AUTONOM MODE: Error during continuation:`, autonomError);
            sessionStreamManager.safeSend(
              sessionId,
              JSON.stringify({
                type: 'autonom_error',
                message: `Autonomous continuation failed: ${autonomError instanceof Error ? autonomError.message : 'Unknown error'}`,
                sessionId: sessionId,
              })
            );
          }
        }

        continue;
      }

      // Handle stream events (thinking, text deltas, tool use, etc.)
      if ((message as { type: string }).type === 'stream_event') {
        const event = (message as { event: { type: string } }).event;

        if (event.type === 'content_block_start') {
          // Send thinking block start notification to client
          if ((event as { content_block?: { type: string } }).content_block?.type === 'thinking') {
            sessionStreamManager.safeSend(
              sessionId,
              JSON.stringify({
                type: 'thinking_start',
                sessionId: sessionId,
              })
            );
          }
        } else if (event.type === 'content_block_delta') {
          // Count all delta types: text_delta, input_json_delta, thinking_delta
          let deltaChars = 0;

          if ((event as { delta?: { type: string; text?: string } }).delta?.type === 'text_delta') {
            const text = ((event as { delta?: { text?: string } }).delta?.text || '');
            currentTextResponse += text;
            deltaChars = text.length;

            // Record activity for hang detection and reset timeout
            timeoutController.recordActivity('text_output');
            timeoutController.reset();

            // Track output tokens (estimate ~4 chars/token)
            const estimatedDeltaTokens = Math.ceil(text.length / 4);
            timeoutController.addOutputTokens(estimatedDeltaTokens);

            sessionStreamManager.safeSend(
              sessionId,
              JSON.stringify({
                type: 'assistant_message',
                content: text,
                sessionId: sessionId,
              })
            );

            // Incremental save for text (every 500 chars or on tool boundaries)
            if (currentTextResponse.length % 500 < text.length) {
              if (!currentMessageId) {
                // Create message on first text
                const msg = sessionDb.addMessage(
                  sessionId,
                  'assistant',
                  JSON.stringify([{ type: 'text', text: currentTextResponse }])
                );
                currentMessageId = msg.id;
              } else {
                // Update existing message with accumulated text
                const contentToSave = currentMessageContent.length > 0
                  ? currentMessageContent.concat([{ type: 'text', text: currentTextResponse }])
                  : [{ type: 'text', text: currentTextResponse }];
                sessionDb.updateMessage(currentMessageId, JSON.stringify(contentToSave));
              }
            }
          } else if ((event as { delta?: { type: string } }).delta?.type === 'thinking_delta') {
            // Claude's internal reasoning/thinking
            const thinkingText = ((event as { delta?: { thinking?: string } }).delta?.thinking || '');
            deltaChars = thinkingText.length;

            // Record activity for thinking (important for hang detection)
            if (deltaChars > 0) {
              timeoutController.recordActivity('thinking');
              // Track thinking tokens too (they count toward output)
              const estimatedThinkingTokens = Math.ceil(thinkingText.length / 4);
              timeoutController.addOutputTokens(estimatedThinkingTokens);
            }

            sessionStreamManager.safeSend(
              sessionId,
              JSON.stringify({
                type: 'thinking_delta',
                content: thinkingText,
                sessionId: sessionId,
              })
            );
          }

          // Update total character count and estimate tokens (~4 chars/token)
          totalCharCount += deltaChars;
          const estimatedTokens = Math.floor(totalCharCount / 4);

          // Send estimated token count update
          if (deltaChars > 0) {
            sessionStreamManager.safeSend(
              sessionId,
              JSON.stringify({
                type: 'token_update',
                outputTokens: estimatedTokens,
                sessionId: sessionId,
              })
            );
          }
        }
      } else if ((message as { type: string }).type === 'assistant') {
        // Capture full message content structure for database storage
        const content = (message as { message: { content: unknown[] } }).message.content;
        if (Array.isArray(content)) {
          // Append blocks instead of replacing (SDK may send multiple assistant messages)
          currentMessageContent.push(...content);

          // Incremental save: Create or update message in database
          if (!currentMessageId) {
            // First content - create message
            const msg = sessionDb.addMessage(
              sessionId,
              'assistant',
              JSON.stringify(currentMessageContent)
            );
            currentMessageId = msg.id;
          } else {
            // Subsequent content - update existing message
            sessionDb.updateMessage(currentMessageId, JSON.stringify(currentMessageContent));
          }

          // Handle tool use from complete assistant message
          for (const block of content) {
            if ((block as { type: string }).type === 'tool_use') {
              // Record activity for hang detection - tool invocation is meaningful progress
              timeoutController.recordActivity(`tool_use:${(block as { name: string }).name}`);
              timeoutController.reset();

              // Hang detection logging
              toolUseCount++;
              const toolTimestamp = new Date().toISOString();
              console.log(`🔧 [${toolTimestamp}] Tool #${toolUseCount}: ${(block as { name: string }).name}`);

              // Track file operations for progress (Read, Write, Edit tools)
              const toolInput = (block as { input: Record<string, unknown> }).input;
              const toolName = (block as { name: string }).name;

              if (toolName === 'Read' && toolInput?.file_path) {
                sessionDb.updateProgress(sessionId, {
                  filesRead: [toolInput.file_path as string],
                  lastActivity: 'reading',
                });
              } else if ((toolName === 'Write' || toolName === 'Edit') && toolInput?.file_path) {
                sessionDb.updateProgress(sessionId, {
                  filesWritten: [toolInput.file_path as string],
                  lastActivity: 'writing',
                });
              }

              // Check if this is ExitPlanMode tool (deduplicate - only send first one per turn)
              if (toolName === 'ExitPlanMode' && !exitPlanModeSentThisTurn) {
                exitPlanModeSentThisTurn = true; // Mark as sent
                sessionStreamManager.safeSend(
                  sessionId,
                  JSON.stringify({
                    type: 'exit_plan_mode',
                    plan: toolInput?.plan || 'No plan provided',
                    sessionId: sessionId,
                  })
                );
                // SKIP sending tool_use event for ExitPlanMode to avoid duplicate rendering
                continue;
              } else if (toolName === 'ExitPlanMode') {
                continue; // Skip duplicate ExitPlanMode
              }

              // Skip AskUserQuestion (handled by MCP callback)
              if (toolName === 'mcp__ask-user-question__AskUserQuestion') {
                continue;
              }

              sessionStreamManager.safeSend(
                sessionId,
                JSON.stringify({
                  type: 'tool_use',
                  toolId: (block as { id: string }).id,
                  toolName: toolName,
                  toolInput: toolInput,
                  sessionId: sessionId,
                })
              );
            }
          }
        }
      }
    } // End for-await loop

  } catch (error) {
    // Check if this is a user-triggered abort (expected)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('aborted by user') || errorMessage.includes('AbortError')) {
      console.log(`✅ Generation stopped by user: ${sessionId.substring(0, 8)}`);

      // Save partial response (same as normal turn completion)
      if (!currentMessageId) {
        if (currentMessageContent.length > 0) {
          sessionDb.addMessage(sessionId, 'assistant', JSON.stringify(currentMessageContent));
          console.log(`💾 Saved ${currentMessageContent.length} content blocks from aborted response`);
        } else if (currentTextResponse) {
          sessionDb.addMessage(sessionId, 'assistant', JSON.stringify([{ type: 'text', text: currentTextResponse }]));
          console.log(`💾 Saved ${currentTextResponse.length} chars from aborted response`);
        }
      }

      // Send completion signal to client
      sessionStreamManager.safeSend(
        sessionId,
        JSON.stringify({ type: 'result', success: true, sessionId: sessionId })
      );

      // Cancel timeout
      timeoutController.cancel();

      // Wait for SDK to flush transcript file (give it 500ms)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Cleanup stream - next message will spawn new subprocess and resume from transcript
      sessionStreamManager.cleanupSession(sessionId, 'user_aborted');
      activeQueries.delete(sessionId);

      // Return - next message will use resume option with SDK session ID
      return;
    }

    // Actual error - log and cleanup
    console.error(`❌ Background response loop error for session ${sessionId}:`, error);
    sessionStreamManager.cleanupSession(sessionId, 'loop_error');
    activeQueries.delete(sessionId);

    // Send error to client
    sessionStreamManager.safeSend(
      sessionId,
      JSON.stringify({
        type: 'error',
        message: errorMessage || 'Response processing error',
        sessionId: sessionId,
      })
    );
  } finally {
    clearInterval(heartbeatInterval);
  }
}
