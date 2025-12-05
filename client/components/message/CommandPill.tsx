/**
 * CommandPill - Renders slash commands with gradient text color
 * Removed pill badge background wrapper
 */

import React, { memo } from 'react';

interface CommandPillProps {
  commandName: string;
}

/**
 * Hash command name to get consistent gradient (1-10)
 */
function getCommandGradientClass(commandName: string): string {
  let hash = 0;
  for (let i = 0; i < commandName.length; i++) {
    hash = ((hash << 5) - hash) + commandName.charCodeAt(i);
    hash = hash & hash;
  }
  const gradientNum = (Math.abs(hash) % 10) + 1;
  return `agent-gradient-${gradientNum}`;
}

export const CommandPill = memo(function CommandPill({ commandName }: CommandPillProps) {
  const gradientClass = getCommandGradientClass(commandName);

  return (
    <span className={gradientClass}>{commandName}</span>
  );
});
