/**
 * Component Generation Form
 * Form for generating custom components with AI.
 */

import React, { useState } from 'react';
import { Wand2, Code2, FileCode, TestTube, BookOpen } from 'lucide-react';
import type { ComponentGenerationOptions } from '../../hooks/useComponents';

interface ComponentFormProps {
  onGenerate: (options: ComponentGenerationOptions) => Promise<void>;
  isGenerating: boolean;
  projectPath?: string;
  selectedPreset?: string | null;
}

type Framework = 'react' | 'astro' | 'vue' | 'svelte';
type Styling = 'tailwind' | 'css' | 'scss';

export function ComponentForm({ onGenerate, isGenerating, projectPath, selectedPreset }: ComponentFormProps) {
  const [name, setName] = useState(selectedPreset || '');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState<Framework>('react');
  const [typescript, setTypescript] = useState(true);
  const [styling, setStyling] = useState<Styling>('tailwind');
  const [generateTests, setGenerateTests] = useState(false);
  const [generateStorybook, setGenerateStorybook] = useState(false);

  // Update name when preset changes
  React.useEffect(() => {
    if (selectedPreset) {
      setName(selectedPreset);
    }
  }, [selectedPreset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    await onGenerate({
      name: name.trim(),
      description: description.trim(),
      framework,
      typescript,
      projectPath,
      styling,
      generateTests,
      generateStorybook,
    });
  };

  const frameworks: { value: Framework; label: string; icon: string }[] = [
    { value: 'react', label: 'React', icon: '⚛️' },
    { value: 'astro', label: 'Astro', icon: '🚀' },
    { value: 'vue', label: 'Vue', icon: '💚' },
    { value: 'svelte', label: 'Svelte', icon: '🔥' },
  ];

  const stylings: { value: Styling; label: string }[] = [
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'css', label: 'Plain CSS' },
    { value: 'scss', label: 'SCSS' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Component Name */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgb(209, 213, 219)', marginBottom: '6px' }}>
          Komponenten-Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. UserProfileCard"
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
          required
        />
      </div>

      {/* Description */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgb(209, 213, 219)', marginBottom: '6px' }}>
          Beschreibung
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beschreibe die Komponente... z.B. 'Eine Profilkarte mit Avatar, Name, Bio und Social Links'"
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgb(30, 32, 34)',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
          }}
          required
        />
      </div>

      {/* Framework Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgb(209, 213, 219)', marginBottom: '8px' }}>
          Framework
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {frameworks.map((fw) => (
            <button
              key={fw.value}
              type="button"
              onClick={() => setFramework(fw.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: '2px solid',
                borderColor: framework === fw.value ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: framework === fw.value ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
                color: framework === fw.value ? 'white' : 'rgb(156, 163, 175)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              <span>{fw.icon}</span>
              {fw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Styling Selection */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgb(209, 213, 219)', marginBottom: '8px' }}>
          Styling
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {stylings.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyling(s.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '2px solid',
                borderColor: styling === s.value ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                backgroundColor: styling === s.value ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
                color: styling === s.value ? 'white' : 'rgb(156, 163, 175)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={typescript}
            onChange={(e) => setTypescript(e.target.checked)}
            style={{ accentColor: 'rgb(168, 199, 250)' }}
          />
          <Code2 style={{ width: '16px', height: '16px', color: 'rgb(156, 163, 175)' }} />
          <span style={{ fontSize: '13px', color: 'rgb(209, 213, 219)' }}>TypeScript</span>
        </label>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={generateTests}
            onChange={(e) => setGenerateTests(e.target.checked)}
            style={{ accentColor: 'rgb(168, 199, 250)' }}
          />
          <TestTube style={{ width: '16px', height: '16px', color: 'rgb(156, 163, 175)' }} />
          <span style={{ fontSize: '13px', color: 'rgb(209, 213, 219)' }}>Tests generieren</span>
        </label>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={generateStorybook}
            onChange={(e) => setGenerateStorybook(e.target.checked)}
            style={{ accentColor: 'rgb(168, 199, 250)' }}
          />
          <BookOpen style={{ width: '16px', height: '16px', color: 'rgb(156, 163, 175)' }} />
          <span style={{ fontSize: '13px', color: 'rgb(209, 213, 219)' }}>Storybook Story</span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isGenerating || !name.trim() || !description.trim()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 20px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: isGenerating ? 'rgb(75, 85, 99)' : 'rgb(168, 199, 250)',
          color: isGenerating ? 'rgb(156, 163, 175)' : 'rgb(20, 22, 24)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          transition: 'all 200ms',
        }}
      >
        {isGenerating ? (
          <>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              borderTopColor: 'rgb(20, 22, 24)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            Generiere...
          </>
        ) : (
          <>
            <Wand2 style={{ width: '16px', height: '16px' }} />
            Komponente generieren
          </>
        )}
      </button>
    </form>
  );
}

export default ComponentForm;
