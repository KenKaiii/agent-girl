/**
 * Projects Panel Component
 *
 * Browse, manage, and sync projects from all connected providers
 * - View all projects from Vercel, Netlify, Cloudflare
 * - Download, duplicate, delete projects
 * - View deployment history and rollback
 * - Local sync with git versioning
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Cloud,
  Server,
  RefreshCw,
  ExternalLink,
  Download,
  Copy,
  Trash2,
  History,
  RotateCcw,
  Search,
  Filter,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Globe,
  GitBranch,
  Clock,
  MoreVertical,
  FolderDown,
  AlertTriangle
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  platform: 'vercel' | 'netlify' | 'cloudflare';
  url?: string;
  createdAt: string;
  updatedAt: string;
  framework?: string;
  repo?: string;
  deployments?: number;
  latestDeployment?: {
    id: string;
    url: string;
    state: string;
    createdAt: string;
  };
}

interface Deployment {
  id: string;
  url?: string;
  state: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

interface PlatformStatus {
  vercel: { installed: boolean; authenticated: boolean; hasToken?: boolean };
  netlify: { installed: boolean; authenticated: boolean; hasToken?: boolean };
  cloudflare: { installed: boolean; authenticated: boolean; hasToken?: boolean };
  hetzner: { configured: boolean; host?: string };
}

interface ProjectsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject?: (projectPath: string) => void;
}

type PlatformFilter = 'all' | 'vercel' | 'netlify' | 'cloudflare';

export function ProjectsPanel({ isOpen, onClose, onOpenProject }: ProjectsPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus | null>(null);

  // Filters
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected project
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loadingDeployments, setLoadingDeployments] = useState(false);

  // Actions
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Modals
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');
  const [duplicateName, setDuplicateName] = useState('');

  // Load platform status
  const loadPlatformStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/deploy/status');
      const data = await res.json();
      setPlatformStatus(data);
    } catch {
      console.error('Failed to load platform status');
    }
  }, []);

  // Load projects
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = platformFilter === 'all'
        ? '/api/deploy/projects'
        : `/api/deploy/projects?platform=${platformFilter}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setProjects(data.projects);
      } else {
        setError(data.message || 'Fehler beim Laden der Projekte');
      }
    } catch (err) {
      setError('Verbindungsfehler');
    } finally {
      setIsLoading(false);
    }
  }, [platformFilter]);

  // Load deployments for selected project
  const loadDeployments = useCallback(async (project: Project) => {
    setLoadingDeployments(true);
    try {
      const res = await fetch(`/api/deploy/projects/${project.id}/deployments?platform=${project.platform}`);
      const data = await res.json();
      if (data.success) {
        setDeployments(data.deployments || []);
      }
    } catch {
      console.error('Failed to load deployments');
    } finally {
      setLoadingDeployments(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPlatformStatus();
      loadProjects();
    }
  }, [isOpen, loadPlatformStatus, loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadDeployments(selectedProject);
    }
  }, [selectedProject, loadDeployments]);

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.platform.toLowerCase().includes(query) ||
        p.framework?.toLowerCase().includes(query) ||
        p.url?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get connected platforms count
  const connectedPlatforms = platformStatus
    ? [
        platformStatus.vercel.authenticated || platformStatus.vercel.hasToken,
        platformStatus.netlify.authenticated || platformStatus.netlify.hasToken,
        platformStatus.cloudflare.authenticated || platformStatus.cloudflare.hasToken
      ].filter(Boolean).length
    : 0;

  // Actions
  const handleDownload = async () => {
    if (!selectedProject || !downloadPath) return;

    setActionInProgress('download');
    setActionResult(null);

    try {
      const res = await fetch('/api/deploy/projects/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedProject.platform,
          projectId: selectedProject.id,
          targetPath: downloadPath
        })
      });

      const data = await res.json();
      setActionResult({ success: data.success, message: data.message });

      if (data.success && onOpenProject && data.path) {
        onOpenProject(data.path);
      }
    } catch {
      setActionResult({ success: false, message: 'Download fehlgeschlagen' });
    } finally {
      setActionInProgress(null);
      setShowDownloadModal(false);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedProject || !duplicateName) return;

    setActionInProgress('duplicate');
    setActionResult(null);

    try {
      const res = await fetch('/api/deploy/projects/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedProject.platform,
          projectId: selectedProject.id,
          newName: duplicateName
        })
      });

      const data = await res.json();
      setActionResult({ success: data.success, message: data.message });

      if (data.success) {
        loadProjects(); // Refresh list
      }
    } catch {
      setActionResult({ success: false, message: 'Duplikation fehlgeschlagen' });
    } finally {
      setActionInProgress(null);
      setShowDuplicateModal(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    setActionInProgress('delete');
    setActionResult(null);

    try {
      const res = await fetch(`/api/deploy/projects/${selectedProject.id}?platform=${selectedProject.platform}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      setActionResult({ success: data.success, message: data.message });

      if (data.success) {
        setSelectedProject(null);
        loadProjects();
      }
    } catch {
      setActionResult({ success: false, message: 'Löschen fehlgeschlagen' });
    } finally {
      setActionInProgress(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    if (!selectedProject) return;

    setActionInProgress('rollback');
    setActionResult(null);

    try {
      const res = await fetch('/api/deploy/projects/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedProject.platform,
          projectId: selectedProject.id,
          deploymentId
        })
      });

      const data = await res.json();
      setActionResult({ success: data.success, message: data.message });

      if (data.success) {
        loadDeployments(selectedProject);
      }
    } catch {
      setActionResult({ success: false, message: 'Rollback fehlgeschlagen' });
    } finally {
      setActionInProgress(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'vercel':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L24 22H0L12 1Z" />
          </svg>
        );
      case 'netlify':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.934 8.519a1.044 1.044 0 0 1 .303.23l2.349-1.045-2.192-2.171-.491 2.954z" />
          </svg>
        );
      case 'cloudflare':
        return <Cloud className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Heute';
    if (days === 1) return 'Gestern';
    if (days < 7) return `vor ${days} Tagen`;
    return date.toLocaleDateString('de-DE');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Meine Projekte</h2>
              <p className="text-sm text-white/70">
                {connectedPlatforms} Provider verbunden · {projects.length} Projekte
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadProjects}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Projekte suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
            {(['all', 'vercel', 'netlify', 'cloudflare'] as const).map((platform) => (
              <button
                key={platform}
                onClick={() => setPlatformFilter(platform)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  platformFilter === platform
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {platform === 'all' ? 'Alle' : platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Projects List */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <XCircle className="w-12 h-12 text-red-400 mb-2" />
                <p>{error}</p>
                <button
                  onClick={loadProjects}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Erneut versuchen
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FolderOpen className="w-12 h-12 mb-2 opacity-50" />
                <p>Keine Projekte gefunden</p>
                {connectedPlatforms === 0 && (
                  <p className="text-sm mt-2">Verbinde zuerst einen Provider im Deploy-Menü</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProjects.map((project) => (
                  <button
                    key={`${project.platform}-${project.id}`}
                    onClick={() => setSelectedProject(project)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      selectedProject?.id === project.id && selectedProject?.platform === project.platform
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`
                        flex items-center justify-center w-10 h-10 rounded-lg
                        ${project.platform === 'vercel' ? 'bg-black text-white' : ''}
                        ${project.platform === 'netlify' ? 'bg-teal-500 text-white' : ''}
                        ${project.platform === 'cloudflare' ? 'bg-orange-500 text-white' : ''}
                      `}>
                        {getPlatformIcon(project.platform)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                            {project.name}
                          </span>
                          {project.framework && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                              {project.framework}
                            </span>
                          )}
                        </div>
                        {project.url && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {project.url.replace('https://', '')}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(project.updatedAt)}
                          </span>
                          {project.repo && (
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {project.repo.split('/').pop()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Details */}
          <div className="w-1/2 overflow-y-auto bg-gray-50 dark:bg-gray-800/30">
            {selectedProject ? (
              <div className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span className={`
                      flex items-center justify-center w-14 h-14 rounded-xl
                      ${selectedProject.platform === 'vercel' ? 'bg-black text-white' : ''}
                      ${selectedProject.platform === 'netlify' ? 'bg-teal-500 text-white' : ''}
                      ${selectedProject.platform === 'cloudflare' ? 'bg-orange-500 text-white' : ''}
                    `}>
                      {getPlatformIcon(selectedProject.platform)}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                        {selectedProject.name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{selectedProject.platform}</p>
                    </div>
                  </div>

                  {selectedProject.url && (
                    <a
                      href={selectedProject.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Öffnen
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button
                    onClick={() => {
                      setDownloadPath(`~/Projects/${selectedProject.name}`);
                      setShowDownloadModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    <FolderDown className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-medium">Herunterladen</span>
                  </button>
                  <button
                    onClick={() => {
                      setDuplicateName(`${selectedProject.name}-copy`);
                      setShowDuplicateModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    <Copy className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-medium">Duplizieren</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-medium">Löschen</span>
                  </button>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Erstellt</p>
                    <p className="text-sm font-medium">{formatDate(selectedProject.createdAt)}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Aktualisiert</p>
                    <p className="text-sm font-medium">{formatDate(selectedProject.updatedAt)}</p>
                  </div>
                  {selectedProject.framework && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">Framework</p>
                      <p className="text-sm font-medium capitalize">{selectedProject.framework}</p>
                    </div>
                  )}
                  {selectedProject.repo && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">Repository</p>
                      <p className="text-sm font-medium truncate">{selectedProject.repo}</p>
                    </div>
                  )}
                </div>

                {/* Deployments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Deployment-Verlauf
                    </h4>
                    {loadingDeployments && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  </div>

                  {deployments.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">
                      Keine Deployments gefunden
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {deployments.slice(0, 5).map((deployment, idx) => (
                        <div
                          key={deployment.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`
                              w-2 h-2 rounded-full
                              ${deployment.state === 'ready' || deployment.state === 'success' ? 'bg-green-500' : ''}
                              ${deployment.state === 'error' || deployment.state === 'failed' ? 'bg-red-500' : ''}
                              ${deployment.state === 'building' || deployment.state === 'pending' ? 'bg-yellow-500' : ''}
                            `} />
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {idx === 0 ? 'Aktuell' : `v${deployments.length - idx}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(deployment.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {deployment.url && (
                              <a
                                href={deployment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </a>
                            )}
                            {idx > 0 && (
                              <button
                                onClick={() => handleRollback(deployment.id)}
                                disabled={actionInProgress === 'rollback'}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Rollback zu dieser Version"
                              >
                                <RotateCcw className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Result */}
                {actionResult && (
                  <div className={`
                    mt-4 p-3 rounded-lg flex items-center gap-2
                    ${actionResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    }
                  `}>
                    {actionResult.success ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <p className="text-sm">{actionResult.message}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FolderOpen className="w-16 h-16 mb-4 opacity-30" />
                <p>Wähle ein Projekt aus</p>
              </div>
            )}
          </div>
        </div>

        {/* Download Modal */}
        {showDownloadModal && selectedProject && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Projekt herunterladen</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Wohin soll <strong>{selectedProject.name}</strong> heruntergeladen werden?
              </p>
              <input
                type="text"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                placeholder="~/Projects/mein-projekt"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 bg-white dark:bg-gray-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDownload}
                  disabled={actionInProgress === 'download' || !downloadPath}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {actionInProgress === 'download' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Herunterladen'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Modal */}
        {showDuplicateModal && selectedProject && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Projekt duplizieren</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Name für das neue Projekt:
              </p>
              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="neues-projekt"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 bg-white dark:bg-gray-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={actionInProgress === 'duplicate' || !duplicateName}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionInProgress === 'duplicate' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Duplizieren'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && selectedProject && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </span>
                <h3 className="text-lg font-semibold">Projekt löschen?</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Bist du sicher, dass du <strong>{selectedProject.name}</strong> löschen möchtest?
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionInProgress === 'delete'}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionInProgress === 'delete' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Löschen'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsPanel;
