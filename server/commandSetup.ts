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
 */
export function setupSessionCommands(workingDir: string, mode: string): void {
  const commandsDir = path.join(workingDir, '.claude', 'commands');

  // Create .claude/commands/ directory
  if (!fs.existsSync(commandsDir)) {
    fs.mkdirSync(commandsDir, { recursive: true });
  }

  // Get the app's base directory (works in both dev and release)
  const baseDir = getBinaryDir();

  let copiedCount = 0;

  // Copy shared commands (available in all modes)
  const sharedCommandsDir = path.join(baseDir, 'server', 'commands', 'shared');
  if (fs.existsSync(sharedCommandsDir)) {
    const sharedFiles = fs.readdirSync(sharedCommandsDir).filter(f => f.endsWith('.md'));
    for (const file of sharedFiles) {
      const sourcePath = path.join(sharedCommandsDir, file);
      const destPath = path.join(commandsDir, file);
      fs.copyFileSync(sourcePath, destPath);
      copiedCount++;
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
      copiedCount++;
    }
  }

  // Only log if commands were actually copied (less noise)
  if (copiedCount > 0) {
    console.log(`📋 Loaded ${copiedCount} slash command${copiedCount === 1 ? '' : 's'} for ${mode} mode`);
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
