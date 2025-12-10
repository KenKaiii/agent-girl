/**
 * Project Created Success
 * Shows success message and next steps after project creation.
 */

import React, { useState } from 'react';
import { Check, Copy, Terminal, Folder, ExternalLink, ArrowRight } from 'lucide-react';
import type { CreatedProject } from '../../hooks/useTemplates';

interface ProjectCreatedSuccessProps {
  project: CreatedProject;
  onOpenProject?: (path: string) => void;
  onCreateAnother: () => void;
}

export function ProjectCreatedSuccess({
  project,
  onOpenProject,
  onCreateAnother,
}: ProjectCreatedSuccessProps) {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyCommand = async (command: string, label: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommand(label);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const commands = [
    { label: 'Zum Projekt wechseln', command: `cd ${project.path}` },
    { label: 'Dependencies installieren', command: project.commands.install },
    { label: 'Entwicklungsserver starten', command: project.commands.dev },
    { label: 'Für Produktion bauen', command: project.commands.build },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Success Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Check style={{ width: '32px', height: '32px', color: 'rgb(34, 197, 94)' }} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'white', margin: '0 0 8px' }}>
          Projekt erfolgreich erstellt!
        </h3>
        <p style={{ fontSize: '14px', color: 'rgb(156, 163, 175)', margin: 0 }}>
          {project.name} wurde unter {project.path} erstellt
        </p>
      </div>

      {/* Project Info */}
      <div style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: 'rgb(38, 40, 42)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <Folder style={{ width: '20px', height: '20px', color: 'rgb(168, 199, 250)' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
              {project.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgb(107, 114, 128)', fontFamily: 'monospace' }}>
              {project.path}
            </div>
          </div>
        </div>

        {project.files.length > 0 && (
          <div style={{
            fontSize: '12px',
            color: 'rgb(156, 163, 175)',
            padding: '8px 12px',
            backgroundColor: 'rgb(30, 32, 34)',
            borderRadius: '6px',
          }}>
            {project.files.length} Dateien erstellt
          </div>
        )}
      </div>

      {/* Commands */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'rgb(209, 213, 219)',
          marginBottom: '12px',
        }}>
          <Terminal style={{ width: '16px', height: '16px' }} />
          Nächste Schritte
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {commands.map((cmd, index) => (
            <div
              key={cmd.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgb(30, 32, 34)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'rgba(168, 199, 250, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgb(168, 199, 250)',
                flexShrink: 0,
              }}>
                {index + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: 'rgb(156, 163, 175)', marginBottom: '2px' }}>
                  {cmd.label}
                </div>
                <code style={{
                  fontSize: '13px',
                  color: 'white',
                  fontFamily: 'monospace',
                }}>
                  {cmd.command}
                </code>
              </div>
              <button
                onClick={() => copyCommand(cmd.command, cmd.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: copiedCommand === cmd.label ? 'rgb(34, 197, 94)' : 'rgb(156, 163, 175)',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  flexShrink: 0,
                }}
              >
                {copiedCommand === cmd.label ? (
                  <Check style={{ width: '14px', height: '14px' }} />
                ) : (
                  <Copy style={{ width: '14px', height: '14px' }} />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {onOpenProject && (
          <button
            onClick={() => onOpenProject(project.path)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'rgb(168, 199, 250)',
              color: 'rgb(20, 22, 24)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            <ExternalLink style={{ width: '16px', height: '16px' }} />
            Projekt öffnen
          </button>
        )}
        <button
          onClick={onCreateAnother}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'transparent',
            color: 'rgb(156, 163, 175)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms',
          }}
        >
          <ArrowRight style={{ width: '16px', height: '16px' }} />
          Weiteres Projekt
        </button>
      </div>
    </div>
  );
}

export default ProjectCreatedSuccess;
