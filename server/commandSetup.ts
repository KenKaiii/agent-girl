/**
 * Command Setup - Automatically copies slash commands to session directories
 */

import * as fs from 'fs';
import * as path from 'path';
import { getBinaryDir } from './startup';

/**
 * Setup slash commands for a session by copying template .md files
 * Creates .claude/commands/ directory in session's working directory
 * and populates it with shared + mode-specific commands
 * Also copies mode-specific CLAUDE.md to working directory root
 */
export function setupSessionCommands(workingDir: string, mode: string): void {
  const commandsDir = path.join(workingDir, '.claude', 'commands');

  // Create .claude/commands/ directory
  if (!fs.existsSync(commandsDir)) {
    fs.mkdirSync(commandsDir, { recursive: true });
  }

  // Get the app's base directory (works in both dev and release)
  const baseDir = getBinaryDir();

  // Copy shared commands (available in all modes)
  const sharedCommandsDir = path.join(baseDir, 'server', 'commands', 'shared');
  if (fs.existsSync(sharedCommandsDir)) {
    const sharedFiles = fs.readdirSync(sharedCommandsDir).filter(f => f.endsWith('.md'));
    for (const file of sharedFiles) {
      const sourcePath = path.join(sharedCommandsDir, file);
      const destPath = path.join(commandsDir, file);
      fs.copyFileSync(sourcePath, destPath);
    }
  }

  // Copy mode-specific commands
  const modeCommandsDir = path.join(baseDir, 'server', 'commands', mode);
  if (fs.existsSync(modeCommandsDir)) {
    const modeFiles = fs.readdirSync(modeCommandsDir).filter(f => f.endsWith('.md'));
    for (const file of modeFiles) {
      const sourcePath = path.join(modeCommandsDir, file);
      const destPath = path.join(commandsDir, file);
      fs.copyFileSync(sourcePath, destPath);
    }
  }

  // Copy mode-specific CLAUDE.md to working directory root
  const templateClaudeFile = path.join(baseDir, 'server', 'templates', mode, 'CLAUDE.md');
  const destClaudeFile = path.join(workingDir, 'CLAUDE.md');

  // Only copy if template exists and destination doesn't exist (don't overwrite user's CLAUDE.md)
  if (fs.existsSync(templateClaudeFile) && !fs.existsSync(destClaudeFile)) {
    fs.copyFileSync(templateClaudeFile, destClaudeFile);
  }
}

/**
 * Get count of available commands for a session
 */
export function getCommandCount(workingDir: string): number {
  const commandsDir = path.join(workingDir, '.claude', 'commands');

  if (!fs.existsSync(commandsDir)) {
    return 0;
  }

  const files = fs.readdirSync(commandsDir);
  return files.filter(f => f.endsWith('.md')).length;
}
