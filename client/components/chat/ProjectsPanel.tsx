/**
 * Agent Girl - Projects Panel
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Displays linked projects for the current session with status indicators
 * and quick actions (open preview, open folder, duplicate)
 */

import React, { memo, useCallback, useState } from 'react';
import {
  Globe,
  Hammer,
  Box,
  ExternalLink,
  FolderOpen,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Server,
} from 'lucide-react';
import type { Project, ProjectType, ProjectStatus } from '../../hooks/useSessionAPI';

interface ProjectsPanelProps {
  projects?: Project[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenPreview?: (url: string) => void;
  onOpenFolder?: (path: string) => void;
  onDuplicate?: (project: Project) => void;
  onRefresh?: (projectId: string) => void;
}

// Project type icons
const ProjectTypeIcon = memo(function ProjectTypeIcon({
  type,
  className = 'w-4 h-4'
}: {
  type: ProjectType;
  className?: string;
}) {
  switch (type) {
    case 'clone':
      return <Globe className={`${className} text-blue-400`} />;
    case 'build':
      return <Hammer className={`${className} text-orange-400`} />;
    case 'astro':
      return <Box className={`${className} text-purple-400`} />;
    case 'next':
      return <Box className={`${className} text-white`} />;
    case 'react':
      return <Box className={`${className} text-cyan-400`} />;
    default:
      return <Box className={`${className} text-gray-400`} />;
  }
});

// Status indicator
const StatusIndicator = memo(function StatusIndicator({
  status
}: {
  status: ProjectStatus;
}) {
  switch (status) {
    case 'creating':
    case 'building':
      return (
        <span className="flex items-center gap-1 text-[10px] text-yellow-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          {status === 'building' ? 'Building' : 'Creating'}
        </span>
      );
    case 'serving':
      return (
        <span className="flex items-center gap-1 text-[10px] text-green-400">
          <Server className="w-3 h-3" />
          Live
        </span>
      );
    case 'ready':
      return (
        <span className="flex items-center gap-1 text-[10px] text-blue-400">
          <CheckCircle className="w-3 h-3" />
          Ready
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1 text-[10px] text-red-400">
          <AlertCircle className="w-3 h-3" />
          Error
        </span>
      );
    default:
      return null;
  }
});

// Type badge
const TypeBadge = memo(function TypeBadge({ type }: { type: ProjectType }) {
  const colors: Record<ProjectType, string> = {
    clone: 'bg-blue-500/20 text-blue-300',
    build: 'bg-orange-500/20 text-orange-300',
    astro: 'bg-purple-500/20 text-purple-300',
    next: 'bg-white/20 text-white',
    react: 'bg-cyan-500/20 text-cyan-300',
    custom: 'bg-gray-500/20 text-gray-300',
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-medium ${colors[type]}`}>
      {type}
    </span>
  );
});

// Individual project item
const ProjectItem = memo(function ProjectItem({
  project,
  onOpenPreview,
  onOpenFolder,
  onDuplicate,
  onRefresh,
}: {
  project: Project;
  onOpenPreview?: (url: string) => void;
  onOpenFolder?: (path: string) => void;
  onDuplicate?: (project: Project) => void;
  onRefresh?: (projectId: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleOpenPreview = useCallback(() => {
    if (project.preview_url && onOpenPreview) {
      onOpenPreview(project.preview_url);
    }
  }, [project.preview_url, onOpenPreview]);

  const handleOpenFolder = useCallback(async () => {
    if (onOpenFolder) {
      onOpenFolder(project.path);
    } else {
      // Fallback: open via API
      try {
        await fetch('/api/open-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: project.path }),
        });
      } catch (err) {
        console.error('Failed to open folder:', err);
      }
    }
  }, [project.path, onOpenFolder]);

  const handleDuplicate = useCallback(() => {
    if (onDuplicate) {
      onDuplicate(project);
    }
  }, [project, onDuplicate]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh(project.id);
    }
  }, [project.id, onRefresh]);

  return (
    <div
      className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon */}
      <ProjectTypeIcon type={project.type} />

      {/* Name and info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/80 truncate font-medium">
            {project.name}
          </span>
          <TypeBadge type={project.type} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusIndicator status={project.status} />
          {project.source_url && (
            <span className="text-[10px] text-white/30 truncate max-w-[120px]">
              {new URL(project.source_url).hostname}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        {project.preview_url && (
          <button
            onClick={handleOpenPreview}
            className="p-1 rounded hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-colors"
            title={`Open preview: ${project.preview_url}`}
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={handleOpenFolder}
          className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
          title="Open in Finder"
        >
          <FolderOpen className="w-3 h-3" />
        </button>
        {onDuplicate && (
          <button
            onClick={handleDuplicate}
            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            title="Duplicate project"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
        {onRefresh && project.status !== 'serving' && (
          <button
            onClick={handleRefresh}
            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});

export function ProjectsPanel({
  projects,
  isCollapsed = true,
  onToggleCollapse,
  onOpenPreview,
  onOpenFolder,
  onDuplicate,
  onRefresh,
}: ProjectsPanelProps) {
  // Don't render if no projects
  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-white/10 bg-[#0d1117]">
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-white/40" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-white/40" />
        )}
        <Box className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs text-white/60 font-medium">
          Projects
        </span>
        <span className="text-[10px] text-white/30 bg-white/10 px-1.5 py-0.5 rounded-full">
          {projects.length}
        </span>
        <div className="flex-1" />
        {/* Show serving indicator in header if any project is live */}
        {projects.some(p => p.status === 'serving') && (
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        )}
      </button>

      {/* Expanded content */}
      {!isCollapsed && (
        <div className="border-t border-white/5 py-1 max-h-48 overflow-y-auto">
          {projects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              onOpenPreview={onOpenPreview}
              onOpenFolder={onOpenFolder}
              onDuplicate={onDuplicate}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsPanel;
