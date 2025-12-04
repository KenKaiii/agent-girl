/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Local Data Manager - Manages sensitive data that stays local
 * For Impressum, Datenschutz, addresses, contact info etc.
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  Edit3,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Shield,
  User,
  Globe,
} from 'lucide-react';

export interface LocalDataField {
  id: string;
  category: 'business' | 'contact' | 'legal' | 'custom';
  label: string;
  value: string;
  placeholder: string;
  icon?: React.ReactNode;
  isMultiline?: boolean;
}

interface LocalDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  fields: LocalDataField[];
  onFieldsChange: (fields: LocalDataField[]) => void;
}

// Default field templates
const DEFAULT_FIELD_TEMPLATES: Omit<LocalDataField, 'id' | 'value'>[] = [
  // Business
  { category: 'business', label: 'Company Name', placeholder: 'Musterfirma GmbH', icon: <Building2 size={14} /> },
  { category: 'business', label: 'Managing Director', placeholder: 'Max Mustermann', icon: <User size={14} /> },
  { category: 'business', label: 'Tax ID', placeholder: 'DE123456789', icon: <FileText size={14} /> },
  { category: 'business', label: 'Commercial Register', placeholder: 'HRB 12345, Amtsgericht Berlin', icon: <FileText size={14} /> },
  // Contact
  { category: 'contact', label: 'Street Address', placeholder: 'Musterstraße 123', icon: <MapPin size={14} /> },
  { category: 'contact', label: 'City & ZIP', placeholder: '12345 Berlin', icon: <MapPin size={14} /> },
  { category: 'contact', label: 'Email', placeholder: 'kontakt@example.de', icon: <Mail size={14} /> },
  { category: 'contact', label: 'Phone', placeholder: '+49 30 12345678', icon: <Phone size={14} /> },
  { category: 'contact', label: 'Website', placeholder: 'www.example.de', icon: <Globe size={14} /> },
  // Legal
  { category: 'legal', label: 'Data Protection Officer', placeholder: 'Name des Datenschutzbeauftragten', icon: <Shield size={14} /> },
  { category: 'legal', label: 'Regulatory Authority', placeholder: 'Aufsichtsbehörde', icon: <Shield size={14} /> },
];

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  business: { label: 'Business Info', description: 'Company registration details' },
  contact: { label: 'Contact Details', description: 'Address and contact information' },
  legal: { label: 'Legal / Compliance', description: 'Data protection and legal requirements' },
  custom: { label: 'Custom Fields', description: 'Your custom data fields' },
};

const STORAGE_KEY = 'agent-girl-local-data';

export function LocalDataManager({
  isOpen,
  onClose,
  fields,
  onFieldsChange,
}: LocalDataManagerProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LocalDataField[];
        onFieldsChange(parsed);
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [onFieldsChange]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
  }, [fields]);

  const updateField = (id: string, value: string) => {
    onFieldsChange(fields.map(f => f.id === id ? { ...f, value } : f));
  };

  const deleteField = (id: string) => {
    onFieldsChange(fields.filter(f => f.id !== id));
  };

  const addFieldFromTemplate = (template: Omit<LocalDataField, 'id' | 'value'>) => {
    const newField: LocalDataField = {
      ...template,
      id: `field-${Date.now()}`,
      value: '',
    };
    onFieldsChange([...fields, newField]);
    setEditingFieldId(newField.id);
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const newField: LocalDataField = {
      id: `custom-${Date.now()}`,
      category: 'custom',
      label: newFieldLabel,
      value: '',
      placeholder: 'Enter value...',
    };
    onFieldsChange([...fields, newField]);
    setNewFieldLabel('');
    setEditingFieldId(newField.id);
  };

  // Group fields by category
  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, LocalDataField[]>);

  // Get unused templates
  const usedLabels = new Set(fields.map(f => f.label));
  const availableTemplates = DEFAULT_FIELD_TEMPLATES.filter(t => !usedLabels.has(t.label));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
        style={{
          background: '#111114',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(34, 197, 94, 0.15)' }}
            >
              <Lock size={20} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Local Data Manager</h2>
              <p className="text-xs text-gray-500">Sensitive data that stays on your device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Existing Fields by Category */}
          {(['business', 'contact', 'legal', 'custom'] as const).map((category) => {
            const categoryFields = groupedFields[category] || [];
            const categoryInfo = CATEGORY_LABELS[category];

            if (categoryFields.length === 0 && category !== 'custom') return null;

            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium text-white">{categoryInfo.label}</h3>
                  <span className="text-xs text-gray-500">{categoryInfo.description}</span>
                </div>
                <div className="space-y-2">
                  {categoryFields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-3 p-3 rounded-lg group"
                      style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      {field.icon && (
                        <div className="text-gray-500">{field.icon}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                        {editingFieldId === field.id ? (
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => updateField(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            autoFocus
                            onBlur={() => setEditingFieldId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingFieldId(null)}
                            className="w-full bg-transparent text-sm text-white outline-none"
                            style={{ borderBottom: '1px solid #3b82f6' }}
                          />
                        ) : (
                          <div
                            className="text-sm cursor-pointer hover:text-blue-400 transition-colors truncate"
                            style={{ color: field.value ? '#fff' : '#666' }}
                            onClick={() => setEditingFieldId(field.id)}
                          >
                            {field.value || field.placeholder}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingFieldId(field.id)}
                          className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteField(field.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Custom Field (only in custom category) */}
                  {category === 'custom' && (
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="Add custom field..."
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#fff',
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
                      />
                      <button
                        onClick={addCustomField}
                        disabled={!newFieldLabel.trim()}
                        className="p-2 rounded-lg transition-all"
                        style={{
                          background: newFieldLabel.trim() ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                          color: newFieldLabel.trim() ? '#fff' : '#3b82f6',
                          opacity: newFieldLabel.trim() ? 1 : 0.5,
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add from Templates */}
          {availableTemplates.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Add Fields</h3>
              <div className="flex flex-wrap gap-2">
                {availableTemplates.map((template, i) => (
                  <button
                    key={i}
                    onClick={() => addFieldFromTemplate(template)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/10"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#888',
                    }}
                  >
                    <Plus size={12} />
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <p className="text-xs text-green-500/70 flex items-center gap-1">
            <Lock size={12} />
            All data is stored locally in your browser
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-blue-600 hover:bg-blue-500 text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for using local data in components
export function useLocalData() {
  const [fields, setFields] = useState<LocalDataField[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFields(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
  }, []);

  const getFieldValue = (label: string): string | undefined => {
    return fields.find(f => f.label === label)?.value;
  };

  const getAllFieldsAsObject = (): Record<string, string> => {
    return fields.reduce((acc, field) => {
      if (field.value) {
        acc[field.label] = field.value;
      }
      return acc;
    }, {} as Record<string, string>);
  };

  return {
    fields,
    setFields,
    getFieldValue,
    getAllFieldsAsObject,
  };
}
