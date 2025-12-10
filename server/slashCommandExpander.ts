import fs from 'fs';
import path from 'path';

/**
 * Built-in Claude Code commands that are handled by the SDK
 * These don't need .md files and are passed through unchanged
 */
export const BUILT_IN_COMMANDS = new Set(['clear', 'compact']);

/**
 * Server commands directory (where mode-specific commands live)
 */
const SERVER_COMMANDS_DIR = path.join(__dirname, 'commands');

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content: string): {
  description?: string;
  argumentHint?: string;
  body: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { body: content };
  }

  const [, frontmatter, body] = match;
  const parsed: Record<string, string> = {};

  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const trimmedKey = key.trim().replace(/-/g, '_'); // Convert kebab-case to snake_case
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, ''); // Remove quotes
      parsed[trimmedKey] = value;
    }
  });

  return {
    description: parsed.description,
    argumentHint: parsed.argument_hint,
    body: body.trim(),
  };
}

/**
 * Find command file in multiple locations
 * Priority: project .claude/commands/ > mode commands > shared commands
 */
function findCommandFile(commandName: string, workingDir: string, mode?: string): string | null {
  const searchPaths: string[] = [];

  // 1. Project-specific commands first
  searchPaths.push(path.join(workingDir, '.claude', 'commands', `${commandName}.md`));

  // 2. Mode-specific commands (if mode is provided)
  if (mode) {
    searchPaths.push(path.join(SERVER_COMMANDS_DIR, mode, `${commandName}.md`));
  }

  // 3. Search all mode folders
  const modeFolders = ['build', 'coder', 'general', 'spark', 'intense-research', 'unified'];
  for (const folder of modeFolders) {
    searchPaths.push(path.join(SERVER_COMMANDS_DIR, folder, `${commandName}.md`));
  }

  // 4. Shared commands
  searchPaths.push(path.join(SERVER_COMMANDS_DIR, 'shared', `${commandName}.md`));

  // Find first existing file
  for (const filePath of searchPaths) {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

/**
 * Expand slash command to full prompt
 * Returns null if not a slash command or command not found
 */
export function expandSlashCommand(
  message: string,
  workingDir: string,
  mode?: string
): string | null {
  // Check if message starts with slash command
  const commandMatch = message.match(/^\/([a-z-]+)(\s+(.*))?$/);
  if (!commandMatch) {
    return null; // Not a slash command
  }

  const [, commandName, , commandArgs = ''] = commandMatch;

  // Check if this is a built-in command (handled by SDK internally)
  if (BUILT_IN_COMMANDS.has(commandName)) {
    console.log(`✨ Built-in command detected: /${commandName}, passing through to SDK`);
    return message; // Return original message unchanged - SDK will handle it
  }

  // Find command file in multiple locations
  const commandFile = findCommandFile(commandName, workingDir, mode);

  if (!commandFile) {
    console.warn(`⚠️  Slash command not found: /${commandName}`);
    console.warn(`   Searched in: ${workingDir}/.claude/commands/ and server/commands/`);
    return null;
  }

  console.log(`✨ Found command: /${commandName} at ${commandFile}`);

  try {
    // Read command file
    const commandContent = fs.readFileSync(commandFile, 'utf-8');
    const { body } = parseFrontmatter(commandContent);

    // Replace $ARGUMENTS with actual arguments
    const expandedPrompt = body.replace(/\$ARGUMENTS/g, commandArgs.trim());
    return expandedPrompt;
  } catch (error) {
    console.error(`❌ Error expanding slash command /${commandName}:`, error);
    return null;
  }
}
