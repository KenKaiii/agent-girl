/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useRef, useState, memo, useCallback } from 'react';
import { Play, Square } from 'lucide-react';

export const RadioPlayer = memo(function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Nightwave Plaza - Vaporwave/Synthwave radio for coding
  const streamUrl = 'https://radio.plaza.one/mp3';

  const handlePlay = useCallback(() => {
    // Create audio element on first play (user interaction required)
    if (!audioRef.current) {
      const audio = new Audio(streamUrl);
      audio.crossOrigin = 'anonymous'; // Enable CORS for streaming
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener('playing', () => {
        setIsPlaying(true);
      });

      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('error', (e) => {
        console.error('Radio stream error:', e);
        setIsPlaying(false);
      });
    }

    // Play the audio
    audioRef.current.play().catch((error) => {
      console.error('Failed to play radio:', error);
      setIsPlaying(false);
    });
  }, []);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return (
    <div className="flex items-center gap-3" style={{ pointerEvents: 'auto', cursor: 'default' }}>
      <span className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>Radio</span>

      {isPlaying ? (
        <button
          onClick={handleStop}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Stop radio"
          title="Stop Ambient Radio"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Square className="w-4 h-4" style={{ color: 'rgb(var(--text-secondary))', pointerEvents: 'none' }} />
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Play radio"
          title="Play Ambient Radio (chill focus)"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Play className="w-4 h-4" style={{ color: 'rgb(var(--text-secondary))', pointerEvents: 'none' }} />
        </button>
      )}
    </div>
  );
});
