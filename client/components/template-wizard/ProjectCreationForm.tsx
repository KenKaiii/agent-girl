/**
 * Project Creation Form
 * Form for creating a new project from template.
 */

import React, { useState } from 'react';
import { FolderPlus, Folder, Package, User, FileText } from 'lucide-react';
import type { Template, TemplateCreationOptions } from '../../hooks/useTemplates';

interface ProjectCreationFormProps {
  template: Template;
  onSubmit: (options: TemplateCreationOptions) => Promise<void>;
  isCreating: boolean;
  defaultOutputPath?: string;
}

export function ProjectCreationForm({
  template,
  onSubmit,
  isCreating,
  defaultOutputPath = '/Users/master/Documents/projects',
}: ProjectCreationFormProps) {
  const [projectName, setProjectName] = useState(
    template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  );
  const [outputPath, setOutputPath] = useState(defaultOutputPath);
  const [authorName, setAuthorName] = useState('');
  const [description, setDescription] = useState('');
  const [installDeps, setInstallDeps] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !outputPath.trim()) return;

    await onSubmit({
      templateId: template.id,
      projectName: projectName.trim(),
      outputPath: outputPath.trim(),
      customizations: {
        name: projectName.trim(),
        description: description.trim() || undefined,
        author: authorName.trim() || undefined,
      },
      installDependencies: installDeps,
    });
  };

  const frameworkIcons: Record<string, string> = {
    astro: '🚀',
    nextjs: '▲',
    react: '⚛️',
    vue: '💚',
    svelte: '🔥',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Template Info */}
      <div style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: 'rgb(38, 40, 42)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: 'rgb(30, 32, 34)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>
            {frameworkIcons[template.framework] || '📦'}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
              {template.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgb(156, 163, 175)' }}>
              {template.framework} • {template.category}
            </div>
          </div>
        </div>
        <p style={{
          fontSize: '13px',
          color: 'rgb(156, 163, 175)',
          margin: '12px 0 0 0',
          lineHeight: 1.5,
        }}>
          {template.description}
        </p>
      </div>

      {/* Project Name */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'rgb(209, 213, 219)',
          marginBottom: '6px',
        }}>
          <Package style={{ width: '14px', height: '14px' }} />
          Projekt-Name
        </label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          placeholder="mein-projekt"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgb(30, 32, 34)',
            color: 'white',
            fontSize: '14px',
            fontFamily: 'monospace',
            outline: 'none',
          }}
          required
        />
        <div style={{ fontSize: '11px', color: 'rgb(107, 114, 128)', marginTop: '4px' }}>
          Nur Kleinbuchstaben, Zahlen und Bindestriche
        </div>
      </div>

      {/* Output Path */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 500,
          color: 'rgb(209, 213, 219)',
          marginBottom: '6px',
        }}>
          <Folder style={{ width: '14px', height: '14px' }} />
          Speicherort
        </label>
        <input
          type="text"
          value={outputPath}
          onChange={(e) => setOutputPath(e.target.value)}
          placeholder="/Users/name/projects"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgb(30, 32, 34)',
            color: 'white',
            fontSize: '14px',
            fontFamily: 'monospace',
            outline: 'none',
          }}
          required
        />
        <div style={{ fontSize: '11px', color: 'rgb(107, 114, 128)', marginTop: '4px' }}>
          Vollständiger Pfad: {outputPath}/{projectName}
        </div>
      </div>

      {/* Optional Fields */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'rgb(209, 213, 219)',
            marginBottom: '6px',
          }}>
            <User style={{ width: '14px', height: '14px' }} />
            Autor (optional)
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Dein Name"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgb(30, 32, 34)',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'rgb(209, 213, 219)',
            marginBottom: '6px',
          }}>
            <FileText style={{ width: '14px', height: '14px' }} />
            Beschreibung (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kurze Beschreibung"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgb(30, 32, 34)',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Options */}
      <div>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={installDeps}
            onChange={(e) => setInstallDeps(e.target.checked)}
            style={{ accentColor: 'rgb(168, 199, 250)' }}
          />
          <span style={{ fontSize: '13px', color: 'rgb(209, 213, 219)' }}>
            Dependencies automatisch installieren
          </span>
        </label>
        {template.dependencies && template.dependencies.length > 0 && (
          <div style={{
            fontSize: '11px',
            color: 'rgb(107, 114, 128)',
            marginTop: '8px',
            marginLeft: '24px',
          }}>
            Enthält: {template.dependencies.slice(0, 5).join(', ')}
            {template.dependencies.length > 5 && ` +${template.dependencies.length - 5} mehr`}
          </div>
        )}
      </div>

      {/* Features List */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: 'rgba(168, 199, 250, 0.05)',
        border: '1px solid rgba(168, 199, 250, 0.1)',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgb(168, 199, 250)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px',
        }}>
          Enthaltene Features
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {template.features.map((feature) => (
            <span
              key={feature}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(168, 199, 250, 0.1)',
                color: 'rgb(168, 199, 250)',
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isCreating || !projectName.trim() || !outputPath.trim()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '14px 20px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: isCreating ? 'rgb(75, 85, 99)' : 'rgb(168, 199, 250)',
          color: isCreating ? 'rgb(156, 163, 175)' : 'rgb(20, 22, 24)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isCreating ? 'not-allowed' : 'pointer',
          transition: 'all 200ms',
        }}
      >
        {isCreating ? (
          <>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              borderTopColor: 'rgb(20, 22, 24)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            Projekt wird erstellt...
          </>
        ) : (
          <>
            <FolderPlus style={{ width: '16px', height: '16px' }} />
            Projekt erstellen
          </>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}

export default ProjectCreationForm;
