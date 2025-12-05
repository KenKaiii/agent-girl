/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * ImageEditor - Easy image replacement and editing
 * Features: Upload, URL input, drag & drop, basic adjustments
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Image,
  Upload,
  Link2,
  Trash2,
  RotateCcw,
  X,
  Check,
  ExternalLink,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import type { SelectedElement } from './ElementSelector';

interface ImageEditorProps {
  element: SelectedElement;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onImageChange: (selector: string, newSrc: string) => void;
  onClose: () => void;
}

// Get current image src from element
function getCurrentImageSrc(element: SelectedElement): string {
  // Try to extract src from innerHTML if it's an img element
  if (element.tagName === 'img') {
    const match = element.innerHTML.match(/src=["']([^"']+)["']/);
    return match ? match[1] : '';
  }
  // For background images, try to extract from computed styles
  // This is a simplified version - would need actual computed style for full support
  return '';
}

export function ImageEditor({ element, iframeRef, onImageChange, onClose }: ImageEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSrc = getCurrentImageSrc(element);

  // Apply image to iframe element
  const applyImage = useCallback(
    (src: string) => {
      if (!iframeRef.current) return;

      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (!iframeDoc) return;

        const el = iframeDoc.querySelector(element.selector) as HTMLImageElement;
        if (el) {
          if (element.tagName === 'img') {
            el.src = src;
          } else {
            // For divs with background-image
            el.style.backgroundImage = `url(${src})`;
          }
          onImageChange(element.selector, src);
        }
      } catch {
        setError('Konnte Bild nicht anwenden');
      }
    },
    [iframeRef, element.selector, element.tagName, onImageChange]
  );

  // Handle file upload
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Nur Bilddateien erlaubt');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Convert to data URL for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setPreviewSrc(dataUrl);
          setIsLoading(false);
        };
        reader.onerror = () => {
          setError('Fehler beim Lesen der Datei');
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        setError('Fehler beim Hochladen');
        setIsLoading(false);
      }
    },
    []
  );

  // Handle drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Handle URL input
  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    setError(null);

    // Validate URL by trying to load image
    const img = new window.Image();
    img.onload = () => {
      setPreviewSrc(urlInput);
      setIsLoading(false);
    };
    img.onerror = () => {
      setError('Bild konnte nicht geladen werden');
      setIsLoading(false);
    };
    img.src = urlInput;
  }, [urlInput]);

  // Apply preview to element
  const handleApply = useCallback(() => {
    if (previewSrc) {
      applyImage(previewSrc);
      setPreviewSrc(null);
    }
  }, [previewSrc, applyImage]);

  // Reset to original
  const handleReset = useCallback(() => {
    setPreviewSrc(null);
    setUrlInput('');
    setError(null);

    if (currentSrc) {
      applyImage(currentSrc);
    }
  }, [currentSrc, applyImage]);

  return (
    <div
      className="w-72 flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'rgba(17, 17, 20, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Image size={14} className="text-green-400" />
          <span className="text-sm font-medium text-white">Bild bearbeiten</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
            mode === 'upload' ? 'text-white bg-white/5 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Upload size={12} />
          Hochladen
        </button>
        <button
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
            mode === 'url' ? 'text-white bg-white/5 border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Link2 size={12} />
          URL
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Current/Preview image */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10">
          {previewSrc || currentSrc ? (
            <img src={previewSrc || currentSrc} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <Image size={32} />
            </div>
          )}
          {previewSrc && (
            <div className="absolute top-2 right-2 flex gap-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Vorschau
              </span>
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <RefreshCw size={20} className="text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all
              ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40 bg-white/5'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload size={20} className={isDragging ? 'text-blue-400' : 'text-gray-500'} />
              <div className="text-xs">
                <span className={isDragging ? 'text-blue-400' : 'text-gray-400'}>
                  Bild hierher ziehen
                </span>
                <br />
                <span className="text-gray-600">oder klicken zum Auswählen</span>
              </div>
            </div>
          </div>
        )}

        {/* URL mode */}
        {mode === 'url' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500/50 placeholder-gray-600"
              />
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim()}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Laden
              </button>
            </div>
            <p className="text-[10px] text-gray-600">
              Gib eine direkte Bild-URL ein (PNG, JPG, GIF, WebP, SVG)
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            onClick={() => window.open('https://unsplash.com', '_blank')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Unsplash öffnen"
          >
            <ExternalLink size={12} />
            Unsplash
          </button>
          <button
            onClick={() => window.open('https://pexels.com', '_blank')}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Pexels öffnen"
          >
            <ExternalLink size={12} />
            Pexels
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={handleReset}
          disabled={!previewSrc}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={12} />
          Zurücksetzen
        </button>
        <button
          onClick={handleApply}
          disabled={!previewSrc}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={12} />
          Anwenden
        </button>
      </div>
    </div>
  );
}
