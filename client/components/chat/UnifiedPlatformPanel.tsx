/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  FileText,
  AlertTriangle,
  Book,
  Calculator,
  Database,
  GitBranch,
  Users,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

interface UnifiedPlatformPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandClick: (command: string) => void;
}

interface PlatformStatus {
  success: boolean;
  status: {
    platform: string;
    version: string;
    uptime: string;
    services: {
      api: string;
      database: string;
      scheduler: string;
      agents: string;
    };
    germanAutomations: {
      available: number;
      active: number;
    };
  };
}

const QUICK_COMMANDS = [
  {
    id: 'rechnung',
    name: 'Rechnung erstellen',
    description: '§14 UStG konforme Rechnung',
    icon: FileText,
    color: '#10B981',
    command: '/rechnung',
  },
  {
    id: 'mahnung',
    name: 'Zahlungserinnerung',
    description: '§286 BGB Mahnwesen',
    icon: AlertTriangle,
    color: '#F59E0B',
    command: '/mahnung',
  },
  {
    id: 'kassenbuch',
    name: 'Kassenbuch',
    description: 'GoBD konformes Kassenbuch',
    icon: Book,
    color: '#6366F1',
    command: '/kassenbuch',
  },
  {
    id: 'ust',
    name: 'USt-Voranmeldung',
    description: 'ELSTER Umsatzsteuer',
    icon: Calculator,
    color: '#EC4899',
    command: '/ust',
  },
  {
    id: 'datev',
    name: 'DATEV Export',
    description: 'Buchhaltungsexport',
    icon: Database,
    color: '#8B5CF6',
    command: '/datev',
  },
  {
    id: 'workflow',
    name: 'Workflows',
    description: 'DAG-basierte Aufgaben',
    icon: GitBranch,
    color: '#3B82F6',
    command: '/workflow list',
  },
  {
    id: 'agents',
    name: 'Agent Pool',
    description: 'Multi-Agent Koordination',
    icon: Users,
    color: '#14B8A6',
    command: '/agents list',
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'System-Dashboard',
    icon: Activity,
    color: '#EF4444',
    command: '/monitoring',
  },
];

export function UnifiedPlatformPanel({ isOpen, onClose, onCommandClick }: UnifiedPlatformPanelProps) {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('commands');

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/unified/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusIcon = (statusValue: string) => {
    if (statusValue === 'healthy' || statusValue === 'running') {
      return <CheckCircle className="size-4 text-green-500" />;
    } else if (statusValue === 'degraded') {
      return <Clock className="size-4 text-yellow-500" />;
    } else {
      return <XCircle className="size-4 text-red-500" />;
    }
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
      <div
        className="mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.98)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            background: 'linear-gradient(90deg, #A8D8FA 0%, #DAEFFF 50%, #A8D8FA 100%)',
            backgroundSize: '200% auto',
            animation: 'shimmer 3s linear infinite',
          }}
        >
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-gray-900" />
            <span className="font-bold text-gray-900">Unified Platform</span>
            {status && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/10 text-gray-800">
                v{status.status.version}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-black/10 transition"
            >
              <RefreshCw className={`size-4 text-gray-900 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/10 transition text-gray-900 font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Status Section */}
        {status && (
          <div className="px-4 py-3 border-b border-white/10">
            <button
              onClick={() => setExpandedSection(expandedSection === 'status' ? null : 'status')}
              className="w-full flex items-center justify-between text-white/90 hover:text-white transition"
            >
              <span className="text-sm font-medium">System Status</span>
              {expandedSection === 'status' ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            {expandedSection === 'status' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(status.status.services).map(([service, serviceStatus]) => (
                  <div
                    key={service}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5"
                  >
                    {getStatusIcon(serviceStatus)}
                    <span className="text-sm text-white/80 capitalize">{service}</span>
                  </div>
                ))}
                <div className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                  <CheckCircle className="size-4 text-green-500" />
                  <span className="text-sm text-white/80">
                    German Automations: {status.status.germanAutomations.available} available
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Commands */}
        <div className="px-4 py-3">
          <button
            onClick={() => setExpandedSection(expandedSection === 'commands' ? null : 'commands')}
            className="w-full flex items-center justify-between text-white/90 hover:text-white transition mb-3"
          >
            <span className="text-sm font-medium">Quick Commands</span>
            {expandedSection === 'commands' ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {expandedSection === 'commands' && (
            <div className="grid grid-cols-4 gap-2">
              {QUICK_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      onCommandClick(cmd.command);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg transition hover:scale-105"
                    style={{
                      backgroundColor: `${cmd.color}15`,
                      border: `1px solid ${cmd.color}30`,
                    }}
                  >
                    <Icon className="size-5" style={{ color: cmd.color }} />
                    <span className="text-xs text-white/90 font-medium text-center leading-tight">
                      {cmd.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-black/20 text-xs text-white/50 flex items-center justify-between">
          <span>Type /status for full platform status</span>
          <span>24/7 Autonomous Operation</span>
        </div>
      </div>
    </div>
  );
}
