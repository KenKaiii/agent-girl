/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * ComponentLibrary - Drag & Drop Component System (shadcn/ui inspired)
 * Features: Pre-built components, drag & drop, instant insert, AI variations
 */

import React, { useState, useCallback } from 'react';
import {
  Layout,
  Type,
  Image,
  Square,
  Grid3X3,
  List,
  CreditCard,
  MessageSquare,
  Star,
  Users,
  ArrowRight,
  Menu,
  Search,
  ChevronDown,
  Plus,
  Sparkles,
  Copy,
  Check,
  GripVertical,
  X,
  Zap,
  Target,
} from 'lucide-react';

// Component categories
type ComponentCategory =
  | 'layout'
  | 'typography'
  | 'media'
  | 'forms'
  | 'cards'
  | 'navigation'
  | 'marketing'
  | 'social'
  | 'smart';

// Component definition
interface UIComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  icon: React.ReactNode;
  preview: string; // ASCII preview or emoji
  code: string; // Astro/HTML code
  variants?: string[]; // AI can generate variants
  shadcn?: boolean; // Uses shadcn/ui
  popular?: boolean;
}

// Pre-built Components Library
const COMPONENTS: UIComponent[] = [
  // Smart Sections (Auto-optimized with unique IDs)
  {
    id: 'smart-hero',
    name: 'Smart Hero',
    category: 'smart',
    icon: <Zap size={16} />,
    preview: '┌─────────────────┐\n│ ⚡ SMART HERO  │\n│   Auto-Effects  │\n│   Unique IDs    │\n└─────────────────┘',
    code: `<!-- Smart Hero: Auto-generated unique IDs, soft shadows, modern effects -->
<section id="sec-{random}-hero" class="py-24 lg:py-32 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <div id="_c{random}" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h1 id="swift-peak-{random}" class="text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        Headline hier
      </h1>
      <p id="s_{random}" class="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        Beschreibender Text für deine Hero Section mit modernen Effekten.
      </p>
      <div class="flex justify-center gap-4">
        <a href="#" class="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium shadow-[0_4px_20px_rgba(59,130,246,0.5)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.6)] hover:-translate-y-1 transition-all duration-300">
          Get Started
        </a>
        <a href="#" class="px-8 py-4 border border-gray-300 dark:border-gray-600 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Learn More
        </a>
      </div>
    </div>
  </div>
</section>`,
    variants: ['Healthcare', 'Fintech', 'E-commerce', 'SaaS', 'Creative'],
    popular: true,
  },
  {
    id: 'smart-features',
    name: 'Smart Features',
    category: 'smart',
    icon: <Target size={16} />,
    preview: '┌────┬────┬────┐\n│ ⚡ │ ⚡ │ ⚡ │\n│Glass│Lift│Glow │\n└────┴────┴────┘',
    code: `<!-- Smart Features: Glassmorphism cards, hover lift, unique IDs -->
<section id="bold-flow-{random}" class="py-20 lg:py-28 bg-gray-50 dark:bg-gray-900">
  <div id="_f{random}" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 id="calm-wave-{random}" class="text-3xl lg:text-4xl font-bold mb-4">Unsere Features</h2>
      <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Alles was du brauchst, perfekt optimiert.
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Feature Card with Glass Effect -->
      <div id="el_swift_{random}" class="p-6 rounded-2xl backdrop-blur-md bg-white/60 dark:bg-gray-800/60 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300">
        <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center mb-4">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Blitzschnell</h3>
        <p class="text-gray-600 dark:text-gray-400">Optimiert für PageSpeed 90+.</p>
      </div>
      <!-- Repeat with different random IDs -->
    </div>
  </div>
</section>`,
    variants: ['3 Columns', '4 Columns', 'With Icons', 'With Images'],
    popular: true,
  },
  {
    id: 'smart-testimonials',
    name: 'Smart Testimonials',
    category: 'smart',
    icon: <Zap size={16} />,
    preview: '┌─────────────┐\n│ ⚡ "Quote" │\n│  Neumorphic │\n│  ⭐⭐⭐⭐⭐  │\n└─────────────┘',
    code: `<!-- Smart Testimonials: Neumorphic design, subtle shadows -->
<section id="zen-drift-{random}" class="py-20 lg:py-28 bg-gray-100 dark:bg-gray-800">
  <div id="_t{random}" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 id="pure-bloom-{random}" class="text-3xl font-bold text-center mb-12">Was Kunden sagen</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div id="s_{random}" class="p-6 rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#1a1a2e,-8px_-8px_16px_#2d2d44] hover:scale-[1.02] transition-transform duration-200">
        <div class="flex gap-1 mb-4">
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          <!-- Repeat 5 stars -->
        </div>
        <p class="text-gray-700 dark:text-gray-300 mb-4">"Absolut genial! Hat meine Produktivität verdoppelt."</p>
        <div class="flex items-center gap-3">
          <img src="/avatar.jpg" alt="" class="w-10 h-10 rounded-full" />
          <div>
            <div class="font-medium">Max Mustermann</div>
            <div class="text-sm text-gray-500">CEO, Example Corp</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
    variants: ['Carousel', 'Grid', 'Single Featured', 'With Video'],
  },
  {
    id: 'smart-cta',
    name: 'Smart CTA',
    category: 'smart',
    icon: <Zap size={16} />,
    preview: '┌─────────────────┐\n│ ⚡ GRADIENT CTA │\n│   Glow Effect   │\n│   [ Button ]    │\n└─────────────────┘',
    code: `<!-- Smart CTA: Animated gradient, glow effects -->
<section id="nova-spark-{random}" class="py-20 lg:py-28 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-[length:200%_auto] animate-gradient relative overflow-hidden">
  <div class="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5"></div>
  <div id="_cta{random}" class="max-w-4xl mx-auto px-4 text-center relative z-10">
    <h2 id="bold-pulse-{random}" class="text-3xl lg:text-4xl font-bold text-white mb-4">
      Bereit durchzustarten?
    </h2>
    <p class="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
      Starte noch heute kostenlos und erlebe den Unterschied.
    </p>
    <div class="flex justify-center gap-4">
      <a href="#" class="px-8 py-4 bg-white text-blue-600 rounded-xl font-medium hover:ring-2 hover:ring-white/50 hover:ring-offset-2 hover:ring-offset-blue-600 transition-all duration-200">
        Kostenlos starten
      </a>
      <a href="#" class="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-medium hover:bg-white/10 transition-colors">
        Demo buchen
      </a>
    </div>
  </div>
</section>`,
    variants: ['Simple', 'With Stats', 'Split Layout', 'Dark Theme'],
  },
  {
    id: 'smart-pricing',
    name: 'Smart Pricing',
    category: 'smart',
    icon: <Zap size={16} />,
    preview: '┌────┬────┬────┐\n│ $9 │$29 │$99 │\n│ ⚡ │ ⚡ │ ⚡ │\n└────┴────┴────┘',
    code: `<!-- Smart Pricing: Soft shadows, border glow on hover -->
<section id="wise-edge-{random}" class="py-20 lg:py-28">
  <div id="_p{random}" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 id="keen-glow-{random}" class="text-3xl font-bold mb-4">Einfache Preise</h2>
      <p class="text-gray-600 max-w-xl mx-auto">Wähle den Plan der zu dir passt.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <div id="s_{random}" class="p-8 rounded-2xl bg-white border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:border-blue-400/50 transition-all duration-300">
        <h3 class="text-xl font-semibold mb-2">Starter</h3>
        <div class="mb-6"><span class="text-4xl font-bold">€9</span><span class="text-gray-500">/mo</span></div>
        <ul class="space-y-3 mb-8 text-gray-600">
          <li class="flex items-center gap-2">✓ 5 Projekte</li>
          <li class="flex items-center gap-2">✓ Basic Support</li>
        </ul>
        <button class="w-full py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors">Auswählen</button>
      </div>
      <!-- Pro plan with highlighted styling -->
      <div id="el_pure_{random}" class="p-8 rounded-2xl bg-blue-600 text-white shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:-translate-y-2 transition-all duration-300 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">BELIEBT</div>
        <h3 class="text-xl font-semibold mb-2">Pro</h3>
        <div class="mb-6"><span class="text-4xl font-bold">€29</span><span class="text-white/70">/mo</span></div>
        <ul class="space-y-3 mb-8 text-white/80">
          <li class="flex items-center gap-2">✓ Unbegrenzte Projekte</li>
          <li class="flex items-center gap-2">✓ Priority Support</li>
        </ul>
        <button class="w-full py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-100 transition-colors">Auswählen</button>
      </div>
    </div>
  </div>
</section>`,
    variants: ['2 Plans', '3 Plans', 'With Toggle', 'Enterprise'],
    popular: true,
  },
  // Layout
  {
    id: 'hero-centered',
    name: 'Hero Centered',
    category: 'layout',
    icon: <Layout size={16} />,
    preview: '┌─────────────────┐\n│    HEADLINE    │\n│   Subheadline  │\n│   [ Button ]   │\n└─────────────────┘',
    code: `<section class="py-24 px-4 text-center">
  <h1 class="text-5xl font-bold mb-4">Headline hier</h1>
  <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
    Beschreibender Text für deine Hero Section
  </p>
  <a href="#" class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
    Get Started
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
    </svg>
  </a>
</section>`,
    variants: ['Mit Bild', 'Mit Video', 'Split Layout', 'Dark Mode'],
    popular: true,
  },
  {
    id: 'hero-split',
    name: 'Hero Split',
    category: 'layout',
    icon: <Grid3X3 size={16} />,
    preview: '┌────────┬────────┐\n│ TEXT   │ IMAGE  │\n│ [CTA]  │        │\n└────────┴────────┘',
    code: `<section class="py-24 px-4">
  <div class="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    <div>
      <h1 class="text-5xl font-bold mb-6">Dein Titel hier</h1>
      <p class="text-xl text-gray-600 mb-8">
        Beschreibung deines Produkts oder Services.
      </p>
      <div class="flex gap-4">
        <a href="#" class="px-6 py-3 bg-blue-600 text-white rounded-lg">Primary</a>
        <a href="#" class="px-6 py-3 border border-gray-300 rounded-lg">Secondary</a>
      </div>
    </div>
    <div class="relative aspect-square rounded-2xl bg-gray-100 overflow-hidden">
      <img src="/placeholder.jpg" alt="" class="w-full h-full object-cover" />
    </div>
  </div>
</section>`,
    popular: true,
  },
  // Cards
  {
    id: 'card-feature',
    name: 'Feature Card',
    category: 'cards',
    icon: <CreditCard size={16} />,
    preview: '┌─────────────┐\n│ 🎯 Title   │\n│ Description │\n│ Learn more →│\n└─────────────┘',
    code: `<div class="p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition">
  <div class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  </div>
  <h3 class="text-lg font-semibold mb-2">Feature Titel</h3>
  <p class="text-gray-600 mb-4">
    Kurze Beschreibung des Features und warum es wichtig ist.
  </p>
  <a href="#" class="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
    Mehr erfahren
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
    </svg>
  </a>
</div>`,
    shadcn: true,
    popular: true,
  },
  {
    id: 'card-pricing',
    name: 'Pricing Card',
    category: 'cards',
    icon: <CreditCard size={16} />,
    preview: '┌─────────────┐\n│   PLAN      │\n│   €99/mo    │\n│ ✓ Feature 1 │\n│ [ Select ]  │\n└─────────────┘',
    code: `<div class="p-8 rounded-2xl bg-white border-2 border-blue-600 shadow-xl relative">
  <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
    BELIEBT
  </div>
  <h3 class="text-xl font-semibold mb-2">Pro Plan</h3>
  <div class="mb-6">
    <span class="text-4xl font-bold">€99</span>
    <span class="text-gray-500">/Monat</span>
  </div>
  <ul class="space-y-3 mb-8">
    <li class="flex items-center gap-2">
      <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      Unbegrenzte Projekte
    </li>
    <li class="flex items-center gap-2">
      <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      Priority Support
    </li>
  </ul>
  <button class="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
    Plan auswählen
  </button>
</div>`,
    shadcn: true,
  },
  {
    id: 'card-testimonial',
    name: 'Testimonial',
    category: 'cards',
    icon: <MessageSquare size={16} />,
    preview: '┌─────────────┐\n│ "Quote..."  │\n│ 👤 Name    │\n│ ⭐⭐⭐⭐⭐ │\n└─────────────┘',
    code: `<div class="p-6 rounded-xl bg-gray-50">
  <div class="flex gap-1 mb-4">
    ${[1,2,3,4,5].map(() => '<svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>').join('')}
  </div>
  <p class="text-gray-700 mb-4">
    "Das beste Tool das ich je benutzt habe. Hat meine Produktivität verdoppelt!"
  </p>
  <div class="flex items-center gap-3">
    <img src="/avatar.jpg" alt="" class="w-10 h-10 rounded-full" />
    <div>
      <div class="font-medium">Max Mustermann</div>
      <div class="text-sm text-gray-500">CEO, Example Corp</div>
    </div>
  </div>
</div>`,
  },
  // Navigation
  {
    id: 'navbar',
    name: 'Navigation Bar',
    category: 'navigation',
    icon: <Menu size={16} />,
    preview: '┌────────────────────────┐\n│ Logo │ Nav │ Nav │ CTA│\n└────────────────────────┘',
    code: `<nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <a href="/" class="text-xl font-bold">Logo</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-gray-600 hover:text-gray-900">Features</a>
      <a href="#" class="text-gray-600 hover:text-gray-900">Pricing</a>
      <a href="#" class="text-gray-600 hover:text-gray-900">About</a>
    </div>
    <div class="flex items-center gap-4">
      <a href="#" class="text-gray-600 hover:text-gray-900">Login</a>
      <a href="#" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Get Started
      </a>
    </div>
  </div>
</nav>`,
    popular: true,
  },
  {
    id: 'footer',
    name: 'Footer',
    category: 'navigation',
    icon: <Layout size={16} />,
    preview: '┌────────────────────────┐\n│ Links │ Links │ Social │\n│    © 2025 Company     │\n└────────────────────────┘',
    code: `<footer class="bg-gray-900 text-gray-400 py-16">
  <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
    <div>
      <h4 class="text-white font-semibold mb-4">Produkt</h4>
      <ul class="space-y-2">
        <li><a href="#" class="hover:text-white">Features</a></li>
        <li><a href="#" class="hover:text-white">Pricing</a></li>
        <li><a href="#" class="hover:text-white">FAQ</a></li>
      </ul>
    </div>
    <div>
      <h4 class="text-white font-semibold mb-4">Unternehmen</h4>
      <ul class="space-y-2">
        <li><a href="#" class="hover:text-white">Über uns</a></li>
        <li><a href="#" class="hover:text-white">Blog</a></li>
        <li><a href="#" class="hover:text-white">Karriere</a></li>
      </ul>
    </div>
    <div>
      <h4 class="text-white font-semibold mb-4">Legal</h4>
      <ul class="space-y-2">
        <li><a href="#" class="hover:text-white">Impressum</a></li>
        <li><a href="#" class="hover:text-white">Datenschutz</a></li>
        <li><a href="#" class="hover:text-white">AGB</a></li>
      </ul>
    </div>
    <div>
      <h4 class="text-white font-semibold mb-4">Newsletter</h4>
      <div class="flex gap-2">
        <input type="email" placeholder="Email" class="flex-1 px-3 py-2 bg-gray-800 rounded-lg" />
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg">→</button>
      </div>
    </div>
  </div>
  <div class="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-gray-800 text-center">
    © 2025 Company. Alle Rechte vorbehalten.
  </div>
</footer>`,
  },
  // Marketing
  {
    id: 'features-grid',
    name: 'Features Grid',
    category: 'marketing',
    icon: <Grid3X3 size={16} />,
    preview: '┌────┬────┬────┐\n│ F1 │ F2 │ F3 │\n├────┼────┼────┤\n│ F4 │ F5 │ F6 │\n└────┴────┴────┘',
    code: `<section class="py-24 px-4">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-3xl font-bold mb-4">Unsere Features</h2>
      <p class="text-gray-600 max-w-2xl mx-auto">
        Alles was du brauchst, um erfolgreich zu sein.
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Repeat for each feature -->
      <div class="p-6 rounded-xl bg-white border hover:shadow-lg transition">
        <div class="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold mb-2">Feature Name</h3>
        <p class="text-gray-600">Beschreibung des Features.</p>
      </div>
    </div>
  </div>
</section>`,
    popular: true,
  },
  {
    id: 'cta-banner',
    name: 'CTA Banner',
    category: 'marketing',
    icon: <ArrowRight size={16} />,
    preview: '┌─────────────────────────┐\n│  Ready to start? [CTA] │\n└─────────────────────────┘',
    code: `<section class="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-3xl font-bold text-white mb-4">
      Bereit durchzustarten?
    </h2>
    <p class="text-white/80 mb-8">
      Starte noch heute kostenlos und sieh selbst, wie einfach es ist.
    </p>
    <div class="flex justify-center gap-4">
      <a href="#" class="px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition">
        Kostenlos starten
      </a>
      <a href="#" class="px-8 py-3 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition">
        Demo buchen
      </a>
    </div>
  </div>
</section>`,
  },
  // Forms
  {
    id: 'contact-form',
    name: 'Contact Form',
    category: 'forms',
    icon: <MessageSquare size={16} />,
    preview: '┌─────────────┐\n│ Name: _____ │\n│ Email: ____ │\n│ [Senden]    │\n└─────────────┘',
    code: `<form class="max-w-lg mx-auto p-8 rounded-2xl bg-white shadow-xl">
  <h3 class="text-2xl font-bold mb-6">Kontaktiere uns</h3>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium mb-1">Name</label>
      <input type="text" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Email</label>
      <input type="email" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" />
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Nachricht</label>
      <textarea rows="4" class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition resize-none"></textarea>
    </div>
    <button type="submit" class="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
      Nachricht senden
    </button>
  </div>
</form>`,
    shadcn: true,
  },
];

// Category metadata
const CATEGORIES: Record<ComponentCategory, { label: string; icon: React.ReactNode }> = {
  smart: { label: 'Smart', icon: <Zap size={14} /> },
  layout: { label: 'Layout', icon: <Layout size={14} /> },
  typography: { label: 'Text', icon: <Type size={14} /> },
  media: { label: 'Media', icon: <Image size={14} /> },
  forms: { label: 'Forms', icon: <Square size={14} /> },
  cards: { label: 'Cards', icon: <CreditCard size={14} /> },
  navigation: { label: 'Navigation', icon: <Menu size={14} /> },
  marketing: { label: 'Marketing', icon: <Star size={14} /> },
  social: { label: 'Social', icon: <Users size={14} /> },
};

interface ComponentLibraryProps {
  onInsertComponent: (component: UIComponent) => void;
  onGenerateVariant: (component: UIComponent, variant: string) => void;
  onClose?: () => void;
}

// Component Card with Drag
function ComponentCard({
  component,
  onInsert,
  onVariant,
}: {
  component: UIComponent;
  onInsert: () => void;
  onVariant: (variant: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showVariants, setShowVariants] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(component.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="group relative p-3 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('component', JSON.stringify(component));
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      {/* Popular badge */}
      {component.popular && (
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
      )}

      {/* shadcn badge */}
      {component.shadcn && (
        <div className="absolute top-2 right-2 text-[8px] px-1 py-0.5 rounded bg-white/10 text-gray-400">
          shadcn
        </div>
      )}

      {/* Icon and name */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-gray-400 group-hover:text-white transition-colors">
          {component.icon}
        </div>
        <span className="text-xs font-medium text-white truncate">
          {component.name}
        </span>
      </div>

      {/* Preview */}
      <pre className="text-[8px] text-gray-600 font-mono whitespace-pre overflow-hidden mb-2 h-12">
        {component.preview}
      </pre>

      {/* Actions (show on hover) */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {component.variants && component.variants.length > 0 && (
          <button
            onClick={() => setShowVariants(!showVariants)}
            className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white"
            title="Varianten"
          >
            <Sparkles size={10} />
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white"
          title="Code kopieren"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
        </button>
        <button
          onClick={onInsert}
          className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
          title="Einfügen"
        >
          <Plus size={10} />
        </button>
      </div>

      {/* Variants dropdown */}
      {showVariants && component.variants && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded-lg bg-gray-900 border border-white/10 z-10">
          <div className="text-[10px] text-gray-500 mb-1">AI Varianten:</div>
          <div className="flex flex-wrap gap-1">
            {component.variants.map((v, i) => (
              <button
                key={i}
                onClick={() => {
                  onVariant(v);
                  setShowVariants(false);
                }}
                className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ComponentLibrary({
  onInsertComponent,
  onGenerateVariant,
  onClose,
}: ComponentLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = COMPONENTS.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-64 h-full flex flex-col bg-gray-950 border-r border-white/10">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Komponenten</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="p-2 flex flex-wrap gap-1 border-b border-white/10">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-white/10 text-white'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          Alle
        </button>
        {(Object.keys(CATEGORIES) as ComponentCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
              selectedCategory === cat
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {CATEGORIES[cat].icon}
            {CATEGORIES[cat].label}
          </button>
        ))}
      </div>

      {/* Components list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-xs">
            Keine Komponenten gefunden
          </div>
        ) : (
          filteredComponents.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onInsert={() => onInsertComponent(component)}
              onVariant={(v) => onGenerateVariant(component, v)}
            />
          ))
        )}
      </div>

      {/* Footer tip */}
      <div className="p-2 border-t border-white/10">
        <div className="text-[10px] text-gray-600 text-center">
          <GripVertical size={10} className="inline mr-1" />
          Drag & Drop in den Editor
        </div>
      </div>
    </div>
  );
}

export { COMPONENTS };
export type { UIComponent, ComponentCategory };
