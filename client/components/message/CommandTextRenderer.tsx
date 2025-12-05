/**
 * CommandTextRenderer - Parses text and renders slash commands as gradient pills
 * OPTIMIZED: Pre-compiled regex, early bailout, memoized parsing
 */

import React, { memo, useMemo } from 'react';
import { CommandPill } from './CommandPill';

interface CommandTextRendererProps {
  content: string;
}

// Pre-compiled regex at module level (runs once)
const COMMAND_REGEX = /(^|\s)(\/([a-z-]+))(?=\s|$)/gm;

// Quick check regex (no capturing groups = faster)
const HAS_COMMAND_REGEX = /(?:^|\s)\/[a-z-]+(?=\s|$)/m;

/**
 * Parse text and replace /commandname with CommandPill components
 * Handles /command at start of line or after space
 */
export const CommandTextRenderer = memo(function CommandTextRenderer({ content }: CommandTextRendererProps) {
  // Memoize the entire parsing result based on content
  const parts = useMemo(() => {
    // Early bailout: Quick check if any commands exist
    if (!HAS_COMMAND_REGEX.test(content)) {
      return null; // Signal to render plain text
    }

    const result: (string | React.ReactElement)[] = [];
    let lastIndex = 0;

    // Reset regex state for each parse
    COMMAND_REGEX.lastIndex = 0;

    let match;
    while ((match = COMMAND_REGEX.exec(content)) !== null) {
      const fullMatch = match[0];
      const leadingSpace = match[1];
      const commandName = match[3];
      const matchStart = match.index;
      const matchEnd = match.index + fullMatch.length;

      // Add text before command
      if (matchStart > lastIndex) {
        result.push(content.slice(lastIndex, matchStart));
      }

      // Add leading space if exists
      if (leadingSpace) {
        result.push(leadingSpace);
      }

      // Add command pill
      result.push(
        <CommandPill key={`cmd-${matchStart}`} commandName={commandName} />
      );

      lastIndex = matchEnd;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      result.push(content.slice(lastIndex));
    }

    return result;
  }, [content]);

  // Fast path: no commands found
  if (parts === null) {
    return <>{content}</>;
  }

  return <>{parts}</>;
});
