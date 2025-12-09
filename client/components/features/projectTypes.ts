/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Code2, Layers, Chrome, Terminal, Bot, MessageSquare, Smartphone, Server, Monitor } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ProjectType {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  featureCount: number;
}

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'Full-stack React framework with App Router',
    icon: Layers,
    gradient: 'linear-gradient(90deg, #A8C7FA 0%, #DAEEFF 25%, #ffffff 50%, #DAEEFF 75%, #A8C7FA 100%)',
    featureCount: 13,
  },
  {
    id: 'react',
    name: 'React',
    description: 'SPA with Vite or Create React App',
    icon: Code2,
    gradient: 'linear-gradient(90deg, #c4b5fd 0%, #ddd6fe 25%, #ffffff 50%, #ddd6fe 75%, #c4b5fd 100%)',
    featureCount: 2,
  },
  {
    id: 'python',
    name: 'Python',
    description: 'FastAPI or Django backend',
    icon: Terminal,
    gradient: 'linear-gradient(90deg, #86efac 0%, #bbf7d0 25%, #ffffff 50%, #bbf7d0 75%, #86efac 100%)',
    featureCount: 2,
  },
  {
    id: 'chrome-extension',
    name: 'Chrome Extension',
    description: 'Browser extension with Manifest V3',
    icon: Chrome,
    gradient: 'linear-gradient(90deg, #fde047 0%, #fef08a 25%, #ffffff 50%, #fef08a 75%, #fde047 100%)',
    featureCount: 2,
  },
  {
    id: 'discord-bot',
    name: 'Discord Bot',
    description: 'Discord.js bot with slash commands',
    icon: Bot,
    gradient: 'linear-gradient(90deg, #5865F2 0%, #7289DA 25%, #ffffff 50%, #7289DA 75%, #5865F2 100%)',
    featureCount: 6,
  },
  {
    id: 'slack-bot',
    name: 'Slack Bot',
    description: 'Slack Bolt app with workflows',
    icon: MessageSquare,
    gradient: 'linear-gradient(90deg, #E01E5A 0%, #ECB22E 25%, #ffffff 50%, #36C5F0 75%, #2EB67D 100%)',
    featureCount: 6,
  },
  {
    id: 'expo-mobile',
    name: 'Expo Mobile',
    description: 'React Native iOS/Android app',
    icon: Smartphone,
    gradient: 'linear-gradient(90deg, #4630EB 0%, #7C65FF 25%, #ffffff 50%, #7C65FF 75%, #4630EB 100%)',
    featureCount: 6,
  },
  {
    id: 'backend-api',
    name: 'Backend API',
    description: 'Hono API server',
    icon: Server,
    gradient: 'linear-gradient(90deg, #FF6600 0%, #FF8833 25%, #ffffff 50%, #FF8833 75%, #FF6600 100%)',
    featureCount: 6,
  },
  {
    id: 'tauri-desktop',
    name: 'Tauri Desktop',
    description: 'Cross-platform desktop app',
    icon: Monitor,
    gradient: 'linear-gradient(90deg, #FFC131 0%, #FFD84D 25%, #ffffff 50%, #FFD84D 75%, #FFC131 100%)',
    featureCount: 6,
  },
];
