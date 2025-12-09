/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Code2, Layers, Chrome, Terminal, HelpCircle, MessageSquare, LayoutDashboard, Lock, CreditCard, Mail, Package, Shield, Database, Activity, FileUp, AlertCircle, BarChart3, FormInput, Server, Zap, Calendar, Layout, Bot, Puzzle, Monitor, Smartphone, Bell, MapPin, Camera, Home, Workflow, Globe, FileText, Play } from 'lucide-react';

interface FeaturesModalProps {
  onComplete: (prompt: string) => void;
  onClose: () => void;
}

// Tooltip Component (from Build Wizard)
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            backgroundColor: 'rgb(20, 22, 24)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px 16px',
            width: '420px',
            maxWidth: '90vw',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'rgb(229, 231, 235)',
            zIndex: 10000,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// Project type definitions
const PROJECT_TYPES = [
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

// Feature definitions per project type
const FEATURES_BY_TYPE: Record<string, Array<{
  id: string;
  name: string;
  description: string;
  tags: string[];
  template: string;
  icon: React.ElementType;
  tooltip: string;
  prompt: string;
}>> = {
  nextjs: [
    {
      id: 'ai-chatbot',
      name: 'AI Chatbot',
      description: 'Streaming AI chat with Vercel AI SDK',
      tags: ['AI', 'Chat', 'Streaming'],
      template: 'Vercel AI Chatbot',
      icon: MessageSquare,
      tooltip: 'Uses the official Vercel AI Chatbot template with streaming responses, chat history, and markdown support. No custom implementation needed - just clone the production-ready template.',
      prompt: `Implement AI Chatbot using Vercel's official AI Chatbot template.

IMPORTANT: Use the official, production-ready template - NOT custom code.

STEP 1: Analyze project structure
- Check package.json for existing dependencies and framework
- Identify project structure (app directory, pages directory, src prefix, etc.)
- Note existing routing and component organization patterns
- Verify this is a Next.js project (required for this template)

STEP 2: Clone the official Vercel AI Chatbot template
Run: npx create-next-app ai-chatbot --example https://github.com/vercel/ai-chatbot
This includes:
- Streaming chat UI with markdown support
- Chat history persistence
- Model switching (Claude, GPT, etc.)
- Pre-built components and API routes

STEP 3: Integrate into existing project
- Examine the template's file structure
- Copy API routes to match your project's API route location
- Copy chat components to your components directory
- Copy utilities to your utilities/lib directory
- Follow your project's existing folder organization patterns
- Merge dependencies into package.json without overwriting existing versions

STEP 4: Configure environment variables
- Add AI provider API keys to your environment file (match existing naming convention)
- Update configuration for preferred AI provider

STEP 5: Wire into existing app
- Import ChatInterface component following your import patterns
- Add to desired page/layout following your routing conventions
- Style to match existing design system if present

Expected result: Production-ready AI chat with streaming, history, and markdown rendering.`,
    },
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      description: 'Professional admin panel with shadcn/ui',
      tags: ['Admin', 'Dashboard', 'UI'],
      template: 'shadcn/ui Dashboard',
      icon: LayoutDashboard,
      tooltip: 'Builds a complete admin dashboard using shadcn/ui official blocks - not custom components. Includes stats cards, data tables, user management, and settings panels. All components are production-tested.',
      prompt: `Implement Admin Dashboard using shadcn/ui official dashboard blocks.

IMPORTANT: Use official shadcn/ui blocks - NOT custom implementations.

STEP 1: Analyze project setup
- Read package.json for existing dependencies
- Check if shadcn/ui is initialized (look for components.json)
- Identify your project's routing structure
- Note your component organization pattern

STEP 2: Initialize shadcn/ui if needed
- Run: npx shadcn@latest init
- Follow prompts and choose options that match your project setup

STEP 3: Install dashboard components
Run these commands sequentially:
- npx shadcn@latest add card
- npx shadcn@latest add table
- npx shadcn@latest add chart (if needed)
- npx shadcn@latest add dropdown-menu
- npx shadcn@latest add badge

STEP 4: Use official dashboard blocks
Visit: https://ui.shadcn.com/blocks
Choose blocks for:
- Dashboard overview (stats cards)
- Recent activity table
- User management
- Settings panels

STEP 5: Create admin layout following your project structure
- Analyze existing route structure to determine where admin section should live
- Create admin layout with sidebar following your project's layout patterns
- Create dashboard overview page following your routing conventions
- Add role-based access control if authentication is detected in the project
- Follow your project's existing naming and organization conventions

Expected result: Professional admin dashboard with reusable shadcn/ui components.`,
    },
    {
      id: 'auth-pages',
      name: 'Authentication Pages',
      description: 'Sign in, sign up, and profile pages',
      tags: ['Auth', 'UI', 'Security'],
      template: 'NextAuth Pages',
      icon: Lock,
      tooltip: 'Creates complete auth UI using official NextAuth or Clerk components. Detects what\'s already installed and uses the appropriate pre-built components - no custom forms to maintain.',
      prompt: `Implement Authentication Pages using official NextAuth or Clerk components.

IMPORTANT: Use official UI components from NextAuth/Clerk - NOT custom forms.

STEP 1: Detect existing auth setup
- Check package.json for next-auth or @clerk/nextjs
- Check environment files for NEXTAUTH_SECRET or CLERK_PUBLISHABLE_KEY
- Identify project routing structure

STEP 2A: If using NextAuth (next-auth detected)
- Use official NextAuth UI pages
- Create auth pages following your project's routing conventions
- Use built-in providers UI components
- Create profile page with session data

STEP 2B: If using Clerk (@clerk/nextjs detected)
- Use Clerk's pre-built components: SignIn, SignUp, UserProfile
- Create auth routes following Clerk's catch-all route pattern and your project structure
- Follow your existing routing conventions

STEP 2C: If NO auth detected
- Ask user: "Do you want to use NextAuth or Clerk?"
- Install chosen package
- Set up according to official docs
- Then proceed with Step 2A or 2B

STEP 3: Configure routes and middleware
- Locate or create middleware file following project conventions
- Update middleware for protected routes
- Add redirect logic after sign in
- Handle sign out flow

Expected result: Complete auth UI using official, maintained components.`,
    },
    {
      id: 'stripe-checkout',
      name: 'Stripe Checkout',
      description: 'Payment flow with Stripe integration',
      tags: ['Payments', 'Stripe', 'Checkout'],
      template: 'Stripe Next.js',
      icon: CreditCard,
      tooltip: 'Implements Stripe payments using their official Next.js template. Includes checkout sessions, webhook handling, and success/failure pages. All patterns follow Stripe best practices.',
      prompt: `Implement Stripe Checkout using Stripe's official Next.js template.

IMPORTANT: Use Stripe's official integration - NOT custom implementations.

STEP 1: Analyze project structure
- Read package.json for stripe and @stripe/stripe-js
- If missing: npm install stripe @stripe/stripe-js
- Identify API routes location and pattern
- Note environment file naming convention

STEP 2: Reference Stripe's official Next.js example
Visit: https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript
Clone patterns from official example and adapt to your project structure:
- Create checkout session API route in your API directory
- Create webhook handler API route in your API directory
- Create checkout page following your routing conventions
- Create success page following your routing conventions

STEP 3: Set up Stripe products and prices
- Use Stripe Dashboard or CLI to create products
- Copy price IDs to environment variables

STEP 4: Configure environment variables
Add to your environment file (match existing naming pattern):
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

STEP 5: Handle webhooks
- Set up webhook endpoint with Stripe CLI or Dashboard
- Handle payment_intent.succeeded event
- Update database with order/subscription status if database exists

Expected result: Complete payment flow with checkout, success handling, and webhooks.`,
    },
    {
      id: 'email-system',
      name: 'Email System',
      description: 'Transactional emails with Resend',
      tags: ['Email', 'Notifications'],
      template: 'Resend + react-email',
      icon: Mail,
      tooltip: 'Sets up professional email system using Resend (best deliverability) with react-email for beautiful templates. Uses official templates - no HTML email coding required.',
      prompt: `Implement Email System using Resend with react-email templates.

IMPORTANT: Use official Resend + react-email setup - NOT custom email builders.

STEP 1: Analyze project structure
- Read package.json for existing dependencies
- Install if missing: npm install resend react-email
- Identify where utilities/services are stored
- Note API routes location

STEP 2: Initialize react-email
Run: npx react-email init
This creates an emails directory with example templates and preview server.

STEP 3: Use official react-email templates
Choose from official examples at https://react.email/examples:
- Welcome email
- Password reset
- Order confirmation
- Newsletter
Copy and customize for your needs

STEP 4: Create email API route
- Create send-email API route in your API directory following project conventions
- Import Resend client
- Import email templates
- Send with proper error handling

STEP 5: Configure Resend
- Add RESEND_API_KEY to your environment file
- Verify domain in Resend dashboard
- Test with development mode

Expected result: Professional email system with beautiful templates and reliable delivery.`,
    },
    {
      id: 'file-storage',
      name: 'File Upload & Storage',
      description: 'Upload files with UploadThing or S3',
      tags: ['Storage', 'Upload', 'Files'],
      template: 'UploadThing Next.js',
      icon: FileUp,
      tooltip: 'Add file upload capabilities using UploadThing (easiest) or AWS S3 (most powerful). Handles image optimization, file validation, progress indicators, and cloud storage. Perfect for profile pictures, documents, or any user-uploaded content.',
      prompt: `Implement File Upload using UploadThing's official integration.

IMPORTANT: Use UploadThing's official setup - NOT custom S3 implementations.

STEP 1: Analyze project structure
- Read package.json for existing dependencies
- Install if missing: npm install uploadthing @uploadthing/react
- Identify API routes location
- Check if database exists for storing file metadata

STEP 2: Set up UploadThing configuration
Create UploadThing core configuration file in your API directory:
- Configure file types (image, video, pdf, etc.)
- Set max file sizes
- Add file validation rules
- Set up access control if authentication exists

STEP 3: Create upload API route
Create upload handler API route following your project's conventions:
- Import and export UploadThing handlers
- Connect to core configuration
- Handle upload events

STEP 4: Add upload component to UI
- Import UploadButton or UploadDropzone from @uploadthing/react
- Add to desired page following your routing structure
- Configure accepted file types
- Add upload progress indicator

STEP 5: Configure environment variables
Add to your environment file:
- UPLOADTHING_SECRET (from uploadthing.com dashboard)
- UPLOADTHING_APP_ID

STEP 6: Display uploaded files
- Store file URLs in database if available
- Display with appropriate image component (use framework's optimized image component if available)
- Add delete functionality if needed

Expected result: Working file upload with cloud storage, validation, and progress tracking.`,
    },
    {
      id: 'error-tracking',
      name: 'Error Tracking',
      description: 'Monitor production errors with Sentry',
      tags: ['Monitoring', 'Errors', 'Production'],
      template: 'Sentry Next.js',
      icon: AlertCircle,
      tooltip: 'Get notified when your app crashes with Sentry error monitoring. See exactly what went wrong, which users are affected, and get stack traces. Free tier includes 5,000 errors/month. Essential for production apps.',
      prompt: `Implement Error Tracking using Sentry's official SDK.

IMPORTANT: Use Sentry's official wizard - NOT manual setup.

STEP 1: Initialize Sentry for your framework
Run: npx @sentry/wizard@latest -i (wizard will detect your framework)
This automatically:
- Installs appropriate Sentry package
- Creates configuration files
- Updates build config with Sentry plugin
- Prompts for your Sentry DSN

STEP 2: Configure Sentry settings
The wizard creates configs, but customize:
- Set environment (development, staging, production)
- Configure sample rates for errors and traces
- Add release tracking with git commit SHA
- Set up source maps for production

STEP 3: Add custom error boundaries
- Locate or create error boundary components following your framework's conventions
- Use Sentry.captureException in catch blocks throughout your app
- Follow your project's error handling patterns

STEP 4: Configure environment variables
Add to your environment file (wizard should add these):
- SENTRY_DSN
- SENTRY_ORG
- SENTRY_PROJECT
- SENTRY_AUTH_TOKEN (for source maps upload)

STEP 5: Test error tracking
- Throw a test error in development
- Check Sentry dashboard for error report
- Verify stack traces are readable with source maps

Expected result: Production error monitoring with detailed stack traces and alerts.`,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Privacy-friendly analytics tracking',
      tags: ['Analytics', 'Metrics', 'Privacy'],
      template: 'Vercel Analytics',
      icon: BarChart3,
      tooltip: 'Track page views, user behavior, and performance metrics with privacy-friendly analytics. Choose Vercel Analytics (easiest), PostHog (most features), or Umami (self-hosted). No cookies, no tracking consent needed.',
      prompt: `Implement Analytics using privacy-friendly providers.

IMPORTANT: Use official analytics providers - NOT Google Analytics.

STEP 1: Choose analytics provider
Ask user: "Which analytics do you want?"
- Vercel Analytics (easiest if deploying to Vercel)
- PostHog (best for product analytics + feature flags)
- Umami (open source, self-hostable)

STEP 2: Install and configure chosen provider
Analyze project structure first:
- Identify root layout/app entry point
- Note environment file naming convention

For Vercel Analytics:
- Install: npm install @vercel/analytics
- Add Analytics component to root layout
- No additional config needed - auto-detects deployment

For PostHog:
- Install: npm install posthog-js posthog-node
- Create PostHog provider following your project structure
- Wrap app in provider with project API key
- Add pageview tracking and custom events

For Umami:
- Install: npm install @umami/next
- Add tracking script to root layout
- Self-host or use Umami Cloud

STEP 3: Add environment variables (if needed)
Add to your environment file:
- For PostHog: NEXT_PUBLIC_POSTHOG_KEY
- For Umami: NEXT_PUBLIC_UMAMI_ID

STEP 4: Track custom events (optional)
- Button clicks
- Form submissions
- Feature usage
- Add event tracking where needed following framework patterns

Expected result: Privacy-friendly analytics tracking pageviews and custom events.`,
    },
    {
      id: 'forms-validation',
      name: 'Forms & Validation',
      description: 'React Hook Form with Zod schemas',
      tags: ['Forms', 'Validation', 'UI'],
      template: 'shadcn/ui Form',
      icon: FormInput,
      tooltip: 'Build forms with automatic validation using React Hook Form + Zod. Prevents users from submitting bad data. Essential for login forms, contact forms, settings pages. Uses shadcn/ui form components for beautiful, accessible forms.',
      prompt: `Implement Forms with Validation using React Hook Form + Zod.

IMPORTANT: Use UI library form components if available - NOT custom form implementations.

STEP 1: Analyze project structure
- Read package.json for existing dependencies
- Install if missing: npm install react-hook-form @hookform/resolvers zod
- Check if shadcn/ui or other UI library is initialized
- Identify where components are stored

STEP 2: Install form components (if using shadcn/ui)
Run: npx shadcn@latest add form
This installs Form, FormField, FormItem, FormLabel, FormControl, FormMessage components.

STEP 3: Create Zod validation schema
Define schema for your form fields with appropriate validation rules.

STEP 4: Build form following project patterns
- Use useForm with zodResolver
- Follow your component structure patterns
- Use UI library form components if available
- Handle form submission with type-safe data

STEP 5: Add form to desired page
Identify appropriate location for the form:
- Contact form
- Settings/profile update
- Newsletter signup
- Feedback form
- Login/register (if not using auth provider)
Follow your routing and page conventions.

STEP 6: Add loading states and error handling
- Show loading spinner during submission
- Display success/error notifications (use existing toast/notification system if present)
- Disable form during submission

Expected result: Beautiful, accessible forms with client-side validation and error messages.`,
    },
    {
      id: 'api-routes',
      name: 'Protected API Routes',
      description: 'Secure API endpoints with rate limiting',
      tags: ['API', 'Backend', 'Security'],
      template: 'Next.js API Routes',
      icon: Server,
      tooltip: 'Create secure backend API endpoints for your app. Without this, your frontend can\'t communicate with your backend. Includes rate limiting to prevent abuse. Essential for any app that needs server-side logic or database access.',
      prompt: `Implement Protected API Routes with Rate Limiting.

IMPORTANT: Follow your framework's API route conventions.

STEP 1: Analyze existing setup
- Read package.json for auth and database packages
- Check if authentication is already configured
- Verify database connection exists
- Identify API routes location and pattern

STEP 2: Set up rate limiting with Upstash
Install: npm install @upstash/ratelimit @upstash/redis
Create rate limiting utility in your utilities/lib directory:
- Configure Redis connection
- Set rate limits (e.g., 10 requests per 10 seconds)
- Export ratelimit instance

STEP 3: Create protected API route pattern
Create example API route following your project's conventions:
- Check authentication (if auth exists in project)
- Apply rate limiting
- Validate request data with Zod
- Perform database operations (if database exists)
- Return JSON response with proper error handling

STEP 4: Add middleware for authentication
If authentication detected in project:
- Import auth session handler
- Check if user is authenticated
- Return 401 if not authenticated
- Attach user info to request

STEP 5: Create example CRUD endpoints
Create API routes following your project's routing patterns:
- List endpoint (with pagination)
- Create endpoint
- Get single item endpoint
- Update endpoint
- Delete endpoint

STEP 6: Configure environment variables
Add to your environment file:
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
(Free tier: 10,000 requests/day)

Expected result: Secure API endpoints with rate limiting and proper error handling.`,
    },
    {
      id: 'background-jobs',
      name: 'Background Jobs',
      description: 'Async tasks with Upstash QStash',
      tags: ['Jobs', 'Queue', 'Async'],
      template: 'Upstash QStash',
      icon: Zap,
      tooltip: 'Run long tasks in the background without blocking users. Perfect for sending bulk emails, processing videos, generating reports, AI tasks. Tasks continue even if user closes browser. Prevents timeouts on slow operations.',
      prompt: `Implement Background Jobs using Upstash QStash.

IMPORTANT: Use Upstash QStash official SDK - NOT custom queue implementations.

STEP 1: Analyze project structure
- Install: npm install @upstash/qstash
- Identify where utilities/services are stored
- Note API routes location

STEP 2: Set up QStash client
Create QStash client in your utilities/lib directory:
- Import Client from @upstash/qstash
- Initialize with QSTASH_TOKEN
- Export qstash instance

STEP 3: Create job handler API route
Create job handler API route following your project's conventions:
- Verify request is from QStash (signature verification)
- Parse job payload
- Execute job logic
- Return 200 on success for retry logic

STEP 4: Create job publisher function
Create job publisher utility in your utilities directory:
- Function to publish jobs to QStash
- Accepts job name and payload
- Returns job ID for tracking

STEP 5: Add common background jobs
Examples based on your project needs:
- Send welcome email after signup
- Process uploaded images/videos
- Generate PDF reports
- Run AI processing tasks
- Send scheduled notifications

STEP 6: Configure environment variables
Add to your environment file:
- QSTASH_TOKEN
- QSTASH_CURRENT_SIGNING_KEY
- QSTASH_NEXT_SIGNING_KEY
(Get from Upstash console)

STEP 7: Test job execution
- Trigger a job from your app
- Check QStash dashboard for job status
- Verify job handler receives and processes correctly
- Test retry logic for failures

Expected result: Background job system that runs async tasks reliably with retries.`,
    },
    {
      id: 'booking-calendar',
      name: 'Booking & Calendar',
      description: 'Schedule appointments with Cal.com',
      tags: ['Booking', 'Calendar', 'Scheduling'],
      template: 'Cal.com Embed',
      icon: Calendar,
      tooltip: 'Let users book time with you for appointments, consultations, meetings. Perfect for coaches, consultants, service businesses, SaaS demos. Handles time zones, availability, reminders automatically. Like Calendly but open-source.',
      prompt: `Implement Booking System using Cal.com.

IMPORTANT: Use Cal.com's official embed or API - NOT custom calendar implementations.

STEP 1: Choose Cal.com integration type
Ask user: "How do you want to integrate Cal.com?"
- Embed (easiest - just add iframe, no backend needed)
- Self-hosted (full control, requires Docker)
- API integration (most flexible, requires Cal.com API)

STEP 2A: If Embed chosen (recommended)
- Create Cal.com account at cal.com
- Create event type (e.g., "30 min consultation")
- Get embed code from Cal.com dashboard
- Identify where to add booking page in your routing structure
- Create booking page following your project's conventions
- Add Cal.com embed code to the page

STEP 2B: If API integration chosen
Install: npm install @calcom/api
- Set up Cal.com API key
- Create booking form with custom UI following your component patterns
- Use API to check availability
- Create bookings programmatically

STEP 3: Add email confirmations
- Cal.com automatically sends confirmation emails
- Customize email templates in Cal.com dashboard
- Add calendar invites (.ics files)

STEP 4: Configure calendar sync
- Connect Google Calendar, Outlook, or iCal
- Sync availability automatically
- Prevent double-bookings

STEP 5: Add to navigation
- Add booking link to your navigation/header/footer following your layout patterns
- Create dedicated booking page in appropriate location
- Add booking CTA to relevant pages

Expected result: Professional booking system with automatic scheduling and email confirmations.`,
    },
    {
      id: 'landing-page',
      name: 'Landing Page Components',
      description: 'Pre-built marketing sections',
      tags: ['Marketing', 'Landing', 'UI'],
      template: 'shadcn/ui Blocks',
      icon: Layout,
      tooltip: 'Get ready-made sections for your marketing pages: hero sections, pricing tables, testimonials, feature grids, CTAs, FAQs. Saves days of work. Perfect for SaaS landing pages, product launches, portfolios. Copy-paste and customize.',
      prompt: `Implement Landing Page using UI component blocks.

IMPORTANT: Use official UI library blocks if available - NOT custom landing page builders.

STEP 1: Analyze project setup
- Check if shadcn/ui or other UI library is initialized
- If using shadcn/ui and not initialized: npx shadcn@latest init
- Identify your routing structure for landing page

STEP 2: Browse available UI blocks (if using shadcn/ui)
Visit: https://ui.shadcn.com/blocks
Available blocks:
- Hero sections (multiple variants)
- Feature sections (grid, cards, list)
- Pricing tables (monthly/yearly toggle)
- Testimonials (carousel, grid)
- FAQ sections (accordion)
- CTA sections (various styles)
- Stats/metrics sections
- Newsletter signup forms

STEP 3: Install required components
If using shadcn/ui, install:
- npx shadcn@latest add card
- npx shadcn@latest add button
- npx shadcn@latest add accordion
- npx shadcn@latest add tabs
- npx shadcn@latest add badge

STEP 4: Create landing page structure
Identify appropriate location in your routing structure:
- Hero section (with CTA)
- Features section (3-column grid)
- Pricing section (if relevant)
- Testimonials section
- FAQ section
- Final CTA section

STEP 5: Copy and customize blocks
If using shadcn/ui:
- Visit ui.shadcn.com/blocks
- Click "View Code" on desired blocks
- Copy and paste into your page
- Customize text, images, colors
Otherwise, build sections following your component patterns.

STEP 6: Optimize for SEO
- Add proper meta tags following framework conventions
- Use semantic HTML
- Add alt text to images
- Optimize Core Web Vitals

Expected result: Professional landing page with modern design using production-ready components.`,
    },
  ],
  react: [
    {
      id: 'component-library',
      name: 'Component Library',
      description: 'shadcn/ui components for React',
      tags: ['UI', 'Components'],
      template: 'shadcn/ui React',
      icon: Package,
      tooltip: 'Initializes shadcn/ui specifically for React (non-Next.js). Works with both Vite and CRA. Get copy-paste components with full TypeScript support and dark mode out of the box.',
      prompt: `Implement Component Library using shadcn/ui for React.

IMPORTANT: Use official shadcn/ui React setup - NOT random component libraries.

STEP 1: Analyze project structure
- Read package.json to detect build tool (Vite vs Create React App)
- Check if React 18+ is installed
- Check if shadcn/ui is already initialized (look for components.json)
- Check if Tailwind CSS is configured (look for tailwind.config.js/ts)
- Identify your component organization pattern (src/components vs components)
- Note your app entry point location (main.tsx, index.tsx, App.tsx, etc.)

STEP 2: Install dependencies if missing
For Vite projects:
- If no Tailwind: npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
- Ensure vite.config dependencies are present

For CRA projects:
- If no Tailwind: npm install -D tailwindcss && npx tailwindcss init
- Configure CRACO if needed for Tailwind support

STEP 3: Initialize shadcn/ui for React
If components.json doesn't exist:
Run: npx shadcn@latest init
When prompted:
- Choose your detected build tool (Vite or CRA)
- Choose your CSS approach (Tailwind recommended)
- Set components directory following your existing pattern
- Configure path aliases to match your setup

STEP 4: Install essential components
Run sequentially:
- npx shadcn@latest add button
- npx shadcn@latest add card
- npx shadcn@latest add dialog
- npx shadcn@latest add form
- npx shadcn@latest add input
- npx shadcn@latest add select

STEP 5: Set up theming
- Locate or create your global CSS file (App.css, index.css, globals.css, etc.)
- Add CSS variables for theming following shadcn's CSS variable pattern
- Add dark mode support if needed:
  - Create theme provider component in your components directory
  - Wrap app in provider at your entry point following your project structure

STEP 6: Verify installation
- Import a component (e.g., Button) in your App component
- Test that styling and functionality work
- Verify dark mode toggle if implemented

Expected result: Full component library ready to use with copy-paste components and theme support.`,
    },
    {
      id: 'auth-clerk',
      name: 'Clerk Authentication',
      description: 'Complete auth UI with Clerk',
      tags: ['Auth', 'Security'],
      template: 'Clerk React',
      icon: Shield,
      tooltip: 'Adds complete authentication using Clerk\'s official React components. Get social logins, user management, and beautiful UI with zero backend work. Perfect for React SPAs.',
      prompt: `Implement Authentication using Clerk's official React components.

IMPORTANT: Use Clerk's official components - NOT custom auth forms.

STEP 1: Analyze project setup
- Read package.json to check if @clerk/clerk-react is installed
- Identify your app entry point (main.tsx, index.tsx, App.tsx, etc.)
- Check if routing library is installed (react-router-dom, wouter, etc.)
- Note your environment variable prefix (VITE_ for Vite, REACT_APP_ for CRA)
- Identify your component organization pattern

STEP 2: Install Clerk if missing
Run: npm install @clerk/clerk-react

STEP 3: Configure Clerk provider
Locate your app entry point (the file that renders the root component):
- Import ClerkProvider from @clerk/clerk-react
- Wrap your root component with ClerkProvider
- Add publishable key from environment variable using your detected prefix:
  - Vite: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  - CRA: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY

STEP 4: Set up Clerk components
Import Clerk's pre-built components:
- SignIn component for sign in UI
- SignUp component for sign up UI
- UserButton component for user menu
- SignedIn and SignedOut components for conditional rendering

STEP 5: Create auth routes
Analyze your routing setup:

If using React Router:
- Create sign-in route following your route organization pattern
- Create sign-up route following your route organization pattern
- Add SignIn component to sign-in route
- Add SignUp component to sign-up route

If using Wouter or other routing library:
- Follow that library's route creation pattern
- Create appropriate routes for sign-in and sign-up

If NO routing library detected:
- Create auth pages as separate components in your components directory
- Add navigation logic following your existing patterns

STEP 6: Add protected route logic
If routing library detected:
- Create protected route wrapper component
- Use useAuth() hook from Clerk to check authentication
- Redirect to sign-in if not authenticated
- Wrap protected routes with this component

STEP 7: Configure environment variables
Add to your environment file (match existing naming convention):
For Vite (.env):
- VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

For CRA (.env):
- REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...

STEP 8: Add user menu to navigation
- Locate your navigation/header component
- Import UserButton from @clerk/clerk-react
- Add UserButton component following your layout patterns
- Use SignedIn/SignedOut for conditional rendering

Expected result: Complete auth system with social logins, user management, and beautiful UI with zero backend work.`,
    },
  ],
  python: [
    {
      id: 'fastapi-sqlalchemy',
      name: 'FastAPI + SQLAlchemy',
      description: 'REST API with database ORM',
      tags: ['API', 'Database', 'ORM'],
      template: 'FastAPI SQLAlchemy',
      icon: Database,
      tooltip: 'Creates production-ready REST API following FastAPI\'s official SQL tutorial. Includes proper session management, migrations with Alembic, and CRUD operations following best practices.',
      prompt: `Implement FastAPI with SQLAlchemy using official patterns.

IMPORTANT: Follow official FastAPI SQL tutorial - NOT custom implementations.

STEP 1: Analyze project structure
- Read requirements.txt or pyproject.toml for existing dependencies
- Identify project organization pattern (flat structure, /app directory, /src directory, etc.)
- Check if using async or sync SQLAlchemy
- Note where modules are typically stored (root level, subdirectories, etc.)
- Look for existing database configuration files

STEP 2: Install dependencies if missing
- pip install fastapi[all]
- pip install sqlalchemy
- pip install alembic

STEP 3: Follow FastAPI SQL tutorial structure
Reference: https://fastapi.tiangolo.com/tutorial/sql-databases/
Create modules following your project's organization pattern:
- Database module (DB session and engine configuration)
- Models module (SQLAlchemy ORM models)
- Schemas module (Pydantic validation schemas)
- CRUD module (database operations)
- Main application file (FastAPI app initialization)

STEP 4: Set up database configuration
Create database module in your project structure:
- Configure SQLAlchemy engine and session
- Add async support if project uses async patterns
- Configure connection pooling
- Set database URL from environment variables

STEP 5: Create models and migrations
Create models module following your project organization:
- Define SQLAlchemy models with appropriate relationships
- Initialize Alembic: alembic init alembic
- Configure alembic.ini with your database URL
- Create first migration: alembic revision --autogenerate -m "Initial migration"
- Apply migration: alembic upgrade head

STEP 6: Create CRUD endpoints
Create API routes following your project structure:
- GET /items - list with pagination
- POST /items - create new item
- GET /items/{id} - retrieve single item
- PUT /items/{id} - update item
- DELETE /items/{id} - delete item
- Use dependency injection for database sessions
- Add proper error handling and status codes

STEP 7: Add environment configuration
Create or update environment file:
- DATABASE_URL (e.g., sqlite:///./app.db or postgresql://...)
- Configure connection pooling parameters if needed

Expected result: Production-ready REST API with SQLAlchemy ORM following FastAPI best practices and your project's organization.`,
    },
    {
      id: 'fastapi-auth',
      name: 'JWT Authentication',
      description: 'Secure auth with OAuth2 pattern',
      tags: ['Auth', 'Security', 'JWT'],
      template: 'FastAPI Auth',
      icon: Lock,
      tooltip: 'Implements secure JWT authentication using FastAPI\'s official OAuth2 security tutorial. Includes password hashing with bcrypt, token generation, and protected endpoints.',
      prompt: `Implement authentication using official FastAPI OAuth2 pattern.

IMPORTANT: Follow FastAPI security docs - NOT custom JWT implementations.

STEP 1: Analyze project structure
- Check requirements.txt or pyproject.toml for existing dependencies
- Identify where modules are organized (flat, /app, /src, etc.)
- Check if database/ORM is already configured
- Note existing patterns for utilities and security modules

STEP 2: Install dependencies if missing
- pip install python-jose[cryptography]
- pip install passlib[bcrypt]
- pip install python-multipart

STEP 3: Follow FastAPI Security tutorial
Reference: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
Create modules following your project organization:
- Security module (password hashing, JWT token creation/verification)
- Authentication module (login endpoints, OAuth2 scheme)
- User model (if not already exists in your models)

STEP 4: Create security utilities
Create security module in your project structure:
- Password hashing with passlib and bcrypt
- JWT token creation with python-jose
- JWT token verification and decoding
- OAuth2PasswordBearer dependency for token extraction

STEP 5: Implement User model and database integration
If database exists in project:
- Add User model with hashed_password field to your models module
- Create user table migration with Alembic
- Add user CRUD operations to appropriate module

If no database:
- Create in-memory user store for development
- Document that production needs database integration

STEP 6: Create authentication endpoints
Create auth routes following your project's API structure:
- POST /token - login endpoint, returns JWT access token
- POST /register - user registration with password hashing
- GET /users/me - get current authenticated user (protected endpoint)
- Use OAuth2PasswordRequestForm for login

STEP 7: Add authentication dependency
Create reusable authentication dependency:
- get_current_user function that verifies JWT token
- Extracts user from token payload
- Returns user or raises 401 Unauthorized
- Add to protected routes with Depends(get_current_user)

STEP 8: Configure environment variables
Add to environment file:
- SECRET_KEY (generate with: openssl rand -hex 32)
- ALGORITHM (e.g., HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES (e.g., 30)

STEP 9: Protect existing routes
- Add get_current_user dependency to routes that need authentication
- Add optional authentication where needed
- Implement role-based access control if required

Expected result: Secure JWT authentication system following FastAPI OAuth2 patterns, integrated with your project structure.`,
    },
  ],
  'chrome-extension': [
    {
      id: 'react-popup',
      name: 'React Popup Extension',
      description: 'Chrome extension with React popup',
      tags: ['React', 'Popup', 'UI'],
      template: 'Chrome Extension React',
      icon: Chrome,
      tooltip: 'Creates a Chrome extension popup using React and Manifest V3. Properly configured for extension APIs with chrome.storage, chrome.tabs, and proper build setup.',
      prompt: `Create Chrome Extension with React popup using official Manifest V3.

IMPORTANT: Use Manifest V3 official structure - NOT deprecated Manifest V2.

STEP 1: Analyze project structure
- Check package.json for existing dependencies and build tools
- Detect if using WXT framework, Plasmo, or vanilla setup
- Identify build configuration (Vite, Webpack, or other bundler)
- Note project organization patterns and directory structure
- Verify Chrome Extension requirements are present

STEP 2: Set up extension framework following project conventions
If WXT detected:
- Use WXT's built-in React support and conventions
- Follow WXT's directory structure for popup
- Leverage WXT's auto-generated manifest

If Plasmo detected:
- Use Plasmo's popup component conventions
- Follow Plasmo's file-based routing patterns
- Leverage Plasmo's auto-configuration

If vanilla setup:
- Create public/assets directory for manifest and icons following extension conventions
- Create popup directory in your source folder
- Set up build configuration for extension output
- Configure bundler to output popup.html

STEP 3: Create Manifest V3 configuration
Follow official Manifest V3 spec in appropriate location:
- manifest_version: 3 (required)
- action with default_popup pointing to popup HTML
- permissions array (storage, activeTab as needed)
- background service_worker if needed
- Adapt paths to match your build output structure

STEP 4: Build React popup component
- Create popup entry point following your project structure
- Keep bundle size small (target under 1MB)
- Use Chrome Extension APIs appropriately
- Add chrome.storage for data persistence
- Add chrome.tabs for tab interaction if needed
- Add chrome.runtime for messaging if needed

STEP 5: Configure build process
Adapt to your build setup:
- Configure bundler output for extension format
- Ensure popup.html is generated correctly
- Set up icon assets in appropriate directory
- Configure source maps for development

STEP 6: Test extension
- Build project using your build command
- Load unpacked extension in chrome://extensions
- Enable Developer mode
- Test popup functionality
- Verify Chrome APIs work correctly

Expected result: Working Chrome extension with React popup following Manifest V3 standards.`,
    },
    {
      id: 'content-script',
      name: 'Content Script Injection',
      description: 'Inject scripts into web pages',
      tags: ['Content Script', 'Injection'],
      template: 'Content Scripts V3',
      icon: Activity,
      tooltip: 'Implements content script injection using Manifest V3 content_scripts declaration. Properly isolated from page JavaScript with shadow DOM support for UI injection.',
      prompt: `Implement Content Script injection using Manifest V3.

IMPORTANT: Use Manifest V3 content_scripts - NOT deprecated executeScript.

STEP 1: Analyze project structure
- Check if using WXT framework, Plasmo, or vanilla Chrome extension setup
- Identify existing build configuration and bundler
- Note how other extension components are organized
- Check manifest configuration location
- Verify project's script compilation setup

STEP 2: Configure content script in manifest
Locate manifest configuration (manifest.json or framework config):
- Add content_scripts declaration
- Configure matches patterns for target URLs (all_urls or specific domains)
- Set js and css file paths matching your build output
- Configure run_at timing (document_start, document_end, or document_idle)
- Set world property if needed (ISOLATED or MAIN)

STEP 3: Create content script file
Create content script in appropriate source directory:
- Runs in isolated JavaScript environment by default
- Has full access to page DOM
- Cannot access page JavaScript variables directly
- Configure TypeScript if project uses it
- Follow your project's file naming conventions

STEP 4: Implement messaging between content and background
Set up bidirectional communication:
- Use chrome.runtime.sendMessage for content to background
- Use chrome.tabs.sendMessage for background to content
- Add proper error handling for disconnected contexts
- Handle async message responses correctly

STEP 5: Add UI injection if needed
For injecting custom UI elements:
- Create shadow DOM for style isolation
- Attach shadow root to prevent CSS conflicts
- Inject custom elements or components
- Handle dynamic content loading
- Clean up on page unload

STEP 6: Configure required permissions
Update manifest permissions as needed:
- activeTab for current tab access
- scripting for dynamic injection API
- host_permissions for specific domains
- Match patterns for automatic injection

STEP 7: Build and test
- Build project using your build command
- Reload extension in chrome://extensions
- Test content script injection on target pages
- Verify messaging works correctly
- Check developer console for errors

Expected result: Content script properly injecting into web pages with Manifest V3 compliance.`,
    },
  ],
  'discord-bot': [
    {
      id: 'add-slash-command',
      name: 'Add Slash Command',
      description: 'Create a new Discord slash command',
      tags: ['Commands', 'Interactions'],
      template: 'Discord.js v14',
      icon: Zap,
      tooltip: 'Adds a new slash command to your Discord bot using Discord.js v14 patterns. Automatically registers the command with Discord API and handles interactions.',
      prompt: `Add a new slash command to your Discord bot following Discord.js v14 best practices.

IMPORTANT: Use Discord.js v14 slash command patterns - NOT deprecated message commands.

STEP 1: Analyze existing bot structure
- Check package.json to verify discord.js version (v14+ required)
- Identify command handler pattern (folder organization: commands/category, commands/single-file, or registry pattern)
- Check for existing slash command registration code
- Note your project's file organization conventions
- Identify where Discord client is initialized

STEP 2: Detect command registration approach
If command folder structure exists:
- Follow existing folder categorization (e.g., commands/utility/, commands/moderation/)
- Use existing command export pattern

If single-file pattern exists:
- Add to existing commands file following the established structure

If no commands exist:
- Create commands directory with category-based organization
- Set up command registry and loader

STEP 3: Create slash command file
Follow your project structure and create command with:
- SlashCommandBuilder for command definition
- Command name, description, and options
- Required permissions check
- Error handling wrapper
- Interaction reply patterns (ephemeral, deferred, follow-ups)

STEP 4: Register command with Discord
Ensure command is registered with Discord API:
- Add to command collection in client
- Include in deploy-commands script or auto-registration
- Set appropriate guild/global scope
- Configure required permissions

STEP 5: Test command
- Restart bot to load new command
- Verify command appears in Discord's slash command autocomplete
- Test command execution and error handling
- Check for proper permission enforcement

Expected result: Working slash command that follows your bot's architecture and Discord.js v14 standards.`,
    },
    {
      id: 'add-button-interaction',
      name: 'Add Button/Select Menu',
      description: 'Interactive components for Discord messages',
      tags: ['Interactions', 'UI'],
      template: 'Discord.js Components',
      icon: Activity,
      tooltip: 'Implements buttons, select menus, and modals using Discord.js v14 MessageComponents. Handles interaction responses and maintains state across interactions.',
      prompt: `Add interactive components (buttons, select menus, modals) to your Discord bot.

IMPORTANT: Use Discord.js v14 MessageComponent patterns with proper interaction handlers.

STEP 1: Analyze bot structure
- Check how existing interactions are handled (interaction handlers, events)
- Identify message building patterns in your codebase
- Note how ActionRowBuilder and ButtonBuilder are imported
- Check for existing component interaction listeners

STEP 2: Create component builder
Follow your project conventions to create:
- ActionRowBuilder for component layout
- ButtonBuilder for buttons (primary, secondary, success, danger, link styles)
- StringSelectMenuBuilder for select menus
- ModalBuilder for modal dialogs
- Proper custom IDs for interaction tracking

STEP 3: Implement interaction handler
Detect and follow existing pattern or create new:
- Listen for interactionCreate event
- Filter by interaction type (isButton, isStringSelectMenu, isModalSubmit)
- Parse custom IDs to route to correct handler
- Implement interaction response (reply, update, showModal)
- Add error handling and timeout management

STEP 4: Add state management if needed
If components require persistent state:
- Use custom ID encoding (encode data in customId)
- Or implement temporary cache (Map with TTL)
- Or integrate with your existing database

STEP 5: Test interactions
- Send message with components
- Click buttons and verify responses
- Test select menus and modals
- Verify proper error handling
- Check for memory leaks with large custom ID maps

Expected result: Fully functional interactive components following Discord.js v14 best practices.`,
    },
    {
      id: 'add-event-handler',
      name: 'Add Event Handler',
      description: 'Handle Discord events (messages, joins, etc.)',
      tags: ['Events', 'Automation'],
      template: 'Discord.js Events',
      icon: Bell,
      tooltip: 'Creates event handlers for Discord gateway events like messageCreate, guildMemberAdd, messageReactionAdd, etc. Properly typed and error-handled.',
      prompt: `Add an event handler to your Discord bot using Discord.js v14 event patterns.

IMPORTANT: Use proper event typing and follow Discord.js v14 gateway event structure.

STEP 1: Analyze event structure
- Check for existing events directory/pattern
- Identify event registration approach (client.on vs event files)
- Note error handling patterns
- Check project conventions for event organization

STEP 2: Choose event to implement
Common events:
- messageCreate - New messages (use for non-slash command features)
- guildMemberAdd - New member joins
- guildMemberRemove - Member leaves
- messageReactionAdd - Reaction added to message
- messageDelete - Message deleted (moderation log)
- channelCreate/Update/Delete - Channel changes
- voiceStateUpdate - Voice channel activity

STEP 3: Create event handler file
Follow your project structure:
- Create event file in events directory
- Export event name and execute function
- Add proper TypeScript typing for event parameters
- Implement event-specific logic
- Add error handling and logging

STEP 4: Register event listener
If using event folder pattern:
- Ensure event loader automatically registers it
- Verify event emitter is properly attached

If using direct client.on:
- Add event listener in main bot file following existing pattern

STEP 5: Test event handling
- Trigger the event in Discord (send message, add reaction, join server, etc.)
- Verify handler executes correctly
- Check error logging
- Test edge cases (missing permissions, deleted resources, etc.)

Expected result: Robust event handler that follows your bot's architecture and handles errors gracefully.`,
    },
    {
      id: 'add-permissions',
      name: 'Add Permission System',
      description: 'Role-based access control for commands',
      tags: ['Security', 'Permissions'],
      template: 'Discord.js Permissions',
      icon: Shield,
      tooltip: 'Implements permission checking for commands using Discord native permissions, role-based checks, or custom database permissions. Ensures commands are restricted to authorized users.',
      prompt: `Implement permission system for your Discord bot commands.

IMPORTANT: Choose appropriate permission strategy based on bot complexity.

STEP 1: Analyze existing setup
- Check if any permission checking exists
- Identify database usage (if custom permissions needed)
- Note admin/moderator role configuration
- Review command structure for adding permission checks

STEP 2: Choose permission strategy
Option A - Discord Native Permissions (simplest):
- Use SlashCommandBuilder.setDefaultMemberPermissions()
- Leverage Discord's built-in permission system
- Commands auto-hidden for unauthorized users

Option B - Role-Based Permissions:
- Check member roles in command handler
- Define role hierarchy in config
- Flexible for multiple permission levels

Option C - Custom Database Permissions:
- Store user/role permissions in database
- Most flexible but requires database setup
- Good for complex permission systems

STEP 3: Implement permission checking
Follow chosen strategy:
- Add permission check middleware/wrapper
- Return user-friendly error messages
- Log permission denials
- Handle edge cases (DM commands, missing roles, etc.)

STEP 4: Update existing commands
- Add permission metadata to command definitions
- Wrap execute functions with permission checks
- Update command registration with permission flags

STEP 5: Test permission enforcement
- Test as authorized user (should work)
- Test as unauthorized user (should deny gracefully)
- Test permission escalation/de-escalation
- Verify proper error messages

Expected result: Secure permission system that prevents unauthorized command usage.`,
    },
    {
      id: 'add-database',
      name: 'Add Database Integration',
      description: 'Persist data with SQLite/MongoDB/PostgreSQL',
      tags: ['Database', 'Storage'],
      template: 'Database Integration',
      icon: Database,
      tooltip: 'Integrates database for persisting bot data (user profiles, economy, settings). Includes connection pooling, migrations, and proper error handling.',
      prompt: `Integrate database into your Discord bot for data persistence.

IMPORTANT: Choose database based on scale and hosting requirements.

STEP 1: Analyze requirements
- Check if database already exists in project
- Identify data to persist (user data, guild settings, economy, etc.)
- Consider hosting environment (local, VPS, cloud)
- Review project dependencies

STEP 2: Choose database
SQLite (best for small bots, simple setup):
- File-based, no separate server
- Good for <100 servers
- Use better-sqlite3 package

MongoDB (good for flexible schemas):
- Document database, JSON-like storage
- Good for rapidly changing data models
- Use mongoose package

PostgreSQL (best for production):
- Relational database, strong typing
- Good for complex queries and large scale
- Use pg package or Prisma ORM

STEP 3: Set up database connection
Follow your project structure:
- Create database connection module
- Add connection pooling
- Implement graceful shutdown
- Add environment variables for connection string
- Handle connection errors

STEP 4: Create data models/schemas
Define schemas for your data:
- User profiles (userId, guildId, data)
- Guild settings (guildId, config)
- Economy/points (userId, balance, inventory)
- Custom bot-specific models

STEP 5: Implement database operations
Create helper functions:
- CRUD operations (Create, Read, Update, Delete)
- Transaction support for complex operations
- Query builders for common patterns
- Error handling and validation

STEP 6: Integrate into commands
Update commands to use database:
- Load user/guild data at command start
- Update data based on command logic
- Save changes to database
- Handle concurrent access

STEP 7: Test database operations
- Test CRUD operations
- Verify data persistence across restarts
- Test concurrent access (multiple commands simultaneously)
- Check error handling (connection loss, invalid data)

Expected result: Reliable database integration with proper error handling and connection management.`,
    },
    {
      id: 'add-bot-feature',
      name: 'Add Bot Feature Module',
      description: 'Economy, leveling, moderation, or music system',
      tags: ['Features', 'Systems'],
      template: 'Bot Features',
      icon: Puzzle,
      tooltip: 'Adds complete feature modules like economy system (currency, shop, inventory), leveling (XP, ranks), moderation tools (warn, ban, mute), or music player (queue, controls).',
      prompt: `Add a complete feature module to your Discord bot (economy, leveling, moderation, or music).

IMPORTANT: Use battle-tested libraries for complex features - don't reinvent the wheel.

STEP 1: Analyze bot capabilities
- Check existing features to avoid conflicts
- Identify database availability
- Review command structure
- Note your project organization

STEP 2: Choose feature to implement
Economy System:
- Virtual currency commands (balance, daily, transfer)
- Shop system (buy, sell, inventory)
- Database for user balances
- Use economy library or implement custom

Leveling System:
- XP on messages/voice activity
- Level-up notifications
- Leaderboard commands
- Role rewards for levels

Moderation Tools:
- Warn/ban/kick/mute commands
- Moderation log channel
- Auto-mod (spam detection, bad words)
- Case management system

Music Player:
- Use discord-player or distube library
- Play/pause/skip/queue commands
- Playlist support
- Volume controls

STEP 3: Install required dependencies
Economy: No external lib needed, use database
Leveling: canvacord for rank cards (optional)
Moderation: Discord.js permissions (built-in)
Music: @discord-player/extractor, discord-player

STEP 4: Implement feature module
Follow your project structure:
- Create feature directory (e.g., features/economy/)
- Implement core logic in separate files
- Create commands for feature
- Add database models if needed
- Implement event handlers if needed (levelingmessageCreate, music: voiceStateUpdate)

STEP 5: Configure and integrate
- Add configuration options to config file
- Wire up commands to command handler
- Register events if feature uses them
- Add permissions to administrative commands

STEP 6: Test feature thoroughly
- Test all commands individually
- Test concurrent operations (multiple users)
- Test edge cases (insufficient balance, invalid input)
- Verify persistence (data saved correctly)
- Check performance impact

Expected result: Fully functional feature module that integrates seamlessly with your bot architecture.`,
    },
  ],
  'slack-bot': [
    {
      id: 'add-slash-command-slack',
      name: 'Add Slack Slash Command',
      description: 'Create a new Slack slash command',
      tags: ['Commands', 'Interactions'],
      template: 'Slack Bolt',
      icon: Zap,
      tooltip: 'Adds a slash command to your Slack bot using Bolt framework. Handles command registration, acknowledgment, and response patterns.',
      prompt: `Add a new slash command to your Slack bot using Slack Bolt framework.

IMPORTANT: Use Slack Bolt command patterns with proper acknowledgment and response flow.

STEP 1: Analyze existing bot structure
- Check package.json for @slack/bolt version
- Identify command handler pattern (listeners folder, single file, or inline)
- Note your project's organization conventions
- Check where Slack app initialization happens
- Review existing slash commands for patterns

STEP 2: Register command in Slack App
Before coding, ensure command is registered in Slack App settings:
- Go to api.slack.com/apps → Your App → Slash Commands
- Click "Create New Command"
- Set command name (e.g., /standup)
- Add description and usage hint
- Set Request URL (your bot's endpoint)
- Save and note the command name

STEP 3: Create command handler
Follow your project structure:
- Create command listener file if using folder organization
- Use app.command('/command-name', handler) pattern
- Implement proper acknowledgment (await ack())
- Handle command parameters from command.text
- Implement business logic
- Send response (ephemeral or in-channel)

STEP 4: Implement response patterns
Choose appropriate response method:
- await ack() immediately (required within 3 seconds)
- Use respond() for deferred responses
- Use say() to post messages to channel
- Use client.chat.postMessage for advanced options
- Add error handling for all API calls

STEP 5: Test command
- Restart Slack bot to load command handler
- In Slack workspace, type /your-command
- Verify command appears in autocomplete
- Test command execution and response
- Check error handling with invalid input
- Verify ephemeral vs public messages work correctly

Expected result: Working Slack slash command that follows Bolt patterns and handles responses properly.`,
    },
    {
      id: 'add-shortcut-slack',
      name: 'Add Shortcut (Message/Global)',
      description: 'Message shortcuts and global shortcuts',
      tags: ['Shortcuts', 'Interactions'],
      template: 'Slack Shortcuts',
      icon: Zap,
      tooltip: 'Implements message shortcuts (context menu on messages) or global shortcuts (lightning bolt menu). Handles shortcut invocation and modal/message responses.',
      prompt: `Add shortcuts to your Slack bot using Bolt framework patterns.

IMPORTANT: Register shortcuts in Slack App settings before implementing handlers.

STEP 1: Analyze bot structure
- Check existing shortcut handlers
- Note project organization (listeners folder vs inline)
- Review Bolt app initialization
- Check for existing modal/view patterns

STEP 2: Choose shortcut type
Message Shortcut (appears on message context menu):
- Right-click on any message to trigger
- Receives message content and metadata
- Good for: "Create task from message", "Translate", "Save to notes"

Global Shortcut (appears in lightning bolt menu):
- Accessible from message compose area
- No message context, but can open modal
- Good for: "Create poll", "Start standup", "Quick note"

STEP 3: Register shortcut in Slack App
- Go to api.slack.com/apps → Your App → Interactivity & Shortcuts
- Click "Create New Shortcut"
- Choose type (message or global)
- Set callback ID (e.g., 'create_task_shortcut')
- Add name and description
- Save shortcut

STEP 4: Implement shortcut handler
Follow your project structure:
Message Shortcut:
- Use app.shortcut('callback_id', handler)
- Access message content from shortcut.message
- Acknowledge with await ack()
- Process message data
- Respond with modal or message

Global Shortcut:
- Use app.shortcut('callback_id', handler)
- Acknowledge with await ack()
- Open modal with await client.views.open()
- Handle view submission separately

STEP 5: Implement modal if needed
If shortcut opens modal:
- Define modal view with blocks
- Handle view_submission event
- Extract input values
- Perform action (save data, post message, etc.)
- Close modal or show errors

STEP 6: Test shortcut
- Restart bot to load handler
- For message shortcut: right-click any message, find shortcut in menu
- For global shortcut: click lightning bolt icon, find shortcut
- Test shortcut invocation
- Verify modal opens/closes correctly
- Test error handling

Expected result: Working Slack shortcut that integrates with your bot and provides useful functionality.`,
    },
    {
      id: 'add-block-kit-modal',
      name: 'Add Block Kit Modal',
      description: 'Interactive modals with Block Kit UI',
      tags: ['UI', 'Block Kit', 'Modals'],
      template: 'Slack Block Kit',
      icon: Layout,
      tooltip: 'Creates interactive modals using Slack Block Kit components (input blocks, select menus, buttons). Handles view submissions and updates.',
      prompt: `Implement Block Kit modal for your Slack bot.

IMPORTANT: Use Block Kit Builder (api.slack.com/block-kit-builder) to design and test modals.

STEP 1: Analyze bot structure
- Check existing modal patterns in codebase
- Review how views are opened (client.views.open)
- Note how view_submission is handled
- Check project organization for view definitions

STEP 2: Design modal with Block Kit Builder
Visit api.slack.com/block-kit-builder:
- Design modal layout with blocks
- Add input blocks (plain_text_input, select menus, etc.)
- Add sections with text and accessories
- Set modal title, submit button text, close button text
- Test modal appearance in Block Kit Builder
- Export JSON once satisfied

STEP 3: Create modal trigger
Modal can be opened from:
- Slash command (app.command)
- Shortcut (app.shortcut)
- Button click (app.action)
- Any handler that has access to client

Implement trigger:
- Call await client.views.open({ trigger_id, view })
- Pass trigger_id from triggering interaction
- Pass view with modal blocks

STEP 4: Implement view submission handler
Handle form submission:
- Use app.view('callback_id', handler)
- Extract values from view.state.values
- Validate input (return errors if invalid)
- Perform action (save to database, post message, call API)
- Return success response or errors

STEP 5: Handle dynamic updates (optional)
If modal needs to update based on user input:
- Use app.action() for interactive elements
- Call client.views.update() to refresh modal
- Update blocks based on selected values
- Maintain state across updates

STEP 6: Test modal flow
- Trigger modal opening from command/shortcut
- Verify modal appears with correct layout
- Fill out form with valid data → should succeed
- Fill out form with invalid data → should show errors
- Test all interactive elements (selects, buttons)
- Verify data is processed correctly

Expected result: Polished Block Kit modal with proper validation and error handling.`,
    },
    {
      id: 'add-event-subscription',
      name: 'Add Event Subscription',
      description: 'Listen to Slack events (messages, reactions, etc.)',
      tags: ['Events', 'Automation'],
      template: 'Slack Events',
      icon: Bell,
      tooltip: 'Subscribes to Slack events like message.channels, app_mention, reaction_added, etc. Implements event handlers with proper filtering and response patterns.',
      prompt: `Add event subscription to your Slack bot for automated responses.

IMPORTANT: Subscribe to events in Slack App settings before implementing handlers.

STEP 1: Analyze bot setup
- Check existing event handlers
- Note project organization for events
- Review Bolt app initialization
- Check event subscriptions in Slack App settings

STEP 2: Choose events to subscribe
Common events:
- message.channels / message.im - Messages in channels/DMs
- app_mention - @bot mentions
- reaction_added / reaction_removed - Emoji reactions
- member_joined_channel / member_left_channel - Membership changes
- app_home_opened - User opens app home tab

STEP 3: Subscribe to events in Slack App
- Go to api.slack.com/apps → Your App → Event Subscriptions
- Enable Event Subscriptions (set Request URL if not set)
- Click "Subscribe to bot events"
- Add events (e.g., message.channels, app_mention)
- Save Changes and reinstall app to workspace

STEP 4: Implement event handler
Follow your project structure:
- Use app.event('event_name', handler)
- No need to ack() for events (auto-acknowledged)
- Access event data from event parameter
- Implement filtering logic (ignore bots, specific channels, etc.)
- Perform action (respond, save data, etc.)
- Add error handling

STEP 5: Implement response logic
Common patterns:
Message events:
- Filter out bot messages (event.bot_id)
- Check channel type or channel ID
- Process message text
- Respond with say() or client.chat.postMessage()

Mention events:
- Parse mention from event.text
- Implement command routing or NLP
- Respond in thread or channel

Reaction events:
- Check reaction type (emoji)
- Get original message
- Perform action based on reaction

STEP 6: Test event handling
- Trigger event in Slack (send message, add reaction, etc.)
- Verify bot responds correctly
- Check filtering works (ignores correct messages)
- Test error handling
- Verify no rate limit issues with high-volume events

Expected result: Robust event handler that responds appropriately to Slack events without unnecessary noise.`,
    },
    {
      id: 'add-app-home',
      name: 'Add App Home Tab',
      description: 'Custom home tab with Block Kit UI',
      tags: ['App Home', 'UI', 'Block Kit'],
      template: 'Slack App Home',
      icon: Home,
      tooltip: 'Creates a custom App Home tab with Block Kit UI. Displays dynamic content, handles button interactions, and updates view.',
      prompt: `Implement App Home tab for your Slack bot with Block Kit UI.

IMPORTANT: Enable App Home in Slack App settings before implementing.

STEP 1: Analyze bot setup
- Check if App Home is enabled in Slack App settings
- Review existing app_home_opened handlers
- Note project organization
- Check for existing Block Kit view patterns

STEP 2: Enable App Home in Slack App
- Go to api.slack.com/apps → Your App → App Home
- Enable Home Tab
- Optionally enable Messages Tab
- Subscribe to app_home_opened event in Event Subscriptions
- Reinstall app to workspace

STEP 3: Design App Home UI with Block Kit
Use Block Kit Builder (api.slack.com/block-kit-builder):
- Choose "App Home" as surface
- Add sections with user-specific info
- Add buttons for actions
- Add dividers and context blocks
- Design layout for empty states
- Export JSON once satisfied

STEP 4: Implement app_home_opened handler
Create event handler:
- Use app.event('app_home_opened', handler)
- Get user ID from event.user
- Fetch user-specific data (from database, API, etc.)
- Build dynamic view blocks based on data
- Publish view with client.views.publish()
- Handle errors gracefully

STEP 5: Implement button interactions
If home tab has buttons:
- Use app.action('button_action_id', handler)
- Acknowledge with await ack()
- Perform action (update data, trigger workflow, etc.)
- Update home tab view with client.views.publish()
- Show confirmation or updated state

STEP 6: Implement dynamic updates
Update home tab when data changes:
- Create helper function to build home view
- Call client.views.publish() with user_id and view
- Update after: button clicks, events, external triggers
- Ensure view always shows current state

STEP 7: Test App Home
- Open your bot in Slack sidebar
- Click Home tab
- Verify content loads correctly
- Test button interactions
- Verify view updates dynamically
- Test empty states and error states

Expected result: Polished App Home tab with dynamic content and interactive buttons.`,
    },
    {
      id: 'add-workflow-step',
      name: 'Add Workflow Step',
      description: 'Custom step for Workflow Builder',
      tags: ['Workflows', 'Automation'],
      template: 'Slack Workflows',
      icon: Workflow,
      tooltip: 'Creates a custom Workflow Builder step that users can add to their workflows. Implements step configuration, execution, and output variables.',
      prompt: `Add a custom Workflow Step to your Slack bot for Workflow Builder.

IMPORTANT: Enable Workflow Steps in Slack App settings and use proper step lifecycle handlers.

STEP 1: Analyze bot setup
- Check if Workflow Steps are enabled in Slack App settings
- Review existing workflow step patterns
- Note project organization
- Check Bolt version (requires @slack/bolt v3+)

STEP 2: Enable Workflow Steps in Slack App
- Go to api.slack.com/apps → Your App → Workflow Steps
- Enable Workflow Steps feature
- Reinstall app to workspace
- Verify bot has workflows:write scope

STEP 3: Design workflow step
Define step purpose and I/O:
- Input variables (from previous steps or user configuration)
- Output variables (for subsequent steps)
- Configuration UI (what users see when adding step)
- Execution logic (what happens when workflow runs)

Example: "Create Task" step
- Inputs: task_title, task_description, assignee
- Outputs: task_id, task_url
- Config UI: Form with title/description inputs
- Execution: Create task in project management tool

STEP 4: Implement step configuration
Handle step edit modal:
- Use app.step().edit() for configuration UI
- Build modal with Block Kit inputs
- Save configuration to step context
- Handle view_submission with app.step().save()
- Extract and validate inputs
- Save inputs to step configuration

STEP 5: Implement step execution
Handle workflow step execution:
- Use app.step().execute() for runtime logic
- Access inputs from step.inputs
- Perform action (API call, database operation, etc.)
- Set output variables with complete.outputs
- Call complete() on success
- Call fail() on error with error message

STEP 6: Register workflow step
Register step with Bolt:
- Use app.step('step_callback_id', { edit, save, execute })
- Set callback_id in all step lifecycle methods
- Ensure consistent data flow across edit → save → execute

STEP 7: Test workflow step
- Open Workflow Builder in Slack
- Create new workflow
- Add your custom step (should appear in list)
- Configure step inputs
- Add output variables to subsequent steps
- Test workflow execution
- Verify outputs are passed correctly

Expected result: Functional custom Workflow Step that integrates with Slack Workflow Builder.`,
    },
  ],
  'expo-mobile': [
    {
      id: 'add-authentication-expo',
      name: 'Add Authentication',
      description: 'User login with Supabase/Clerk/Firebase',
      tags: ['Auth', 'Security'],
      template: 'Expo Auth',
      icon: Lock,
      tooltip: 'Integrates authentication using Supabase, Clerk, or Firebase. Includes login screens, secure token storage, and protected route patterns.',
      prompt: `Add authentication to your Expo mobile app.

IMPORTANT: Use official Expo-compatible auth providers for best mobile experience.

STEP 1: Analyze existing app structure
- Check package.json for existing auth dependencies
- Identify navigation setup (Expo Router vs React Navigation)
- Review project organization (screens folder, components, etc.)
- Check for existing AsyncStorage or SecureStore usage
- Note TypeScript usage and type patterns

STEP 2: Choose auth provider
Supabase Auth (recommended - open source, full-featured):
- Email/password, magic link, OAuth providers
- Use @supabase/supabase-js
- Secure session management
- Works with Supabase backend

Clerk (easiest - pre-built UI):
- Use @clerk/clerk-expo
- Pre-built authentication screens
- Social logins, phone number auth
- Hosted authentication

Firebase Auth (Google ecosystem):
- Use @react-native-firebase/auth
- Email, phone, social providers
- Integrates with Firebase services

STEP 3: Install dependencies
For Supabase:
- npm install @supabase/supabase-js
- npm install expo-secure-store (for token storage)
- npm install @react-native-async-storage/async-storage

For Clerk:
- npm install @clerk/clerk-expo
- npx expo install expo-secure-store

For Firebase:
- npm install @react-native-firebase/app @react-native-firebase/auth

STEP 4: Set up auth provider
Follow provider docs and your project structure:
- Create auth context/provider file
- Initialize auth client with API keys
- Implement auth state management (user session)
- Set up secure token storage (SecureStore)
- Add auth state listener
- Expose auth methods (signIn, signUp, signOut)

STEP 5: Create authentication screens
Following your navigation setup:
- Create Login screen with email/password inputs
- Create Sign Up screen with validation
- Add OAuth buttons if using social login
- Implement loading states and error handling
- Add "Forgot Password" flow
- Style screens to match app design

STEP 6: Implement protected routes
Based on your navigation:
If using Expo Router:
- Use (auth) and (app) route groups
- Redirect unauthenticated users to login
- Use useAuth hook in layouts

If using React Navigation:
- Create separate auth and app navigators
- Conditionally render based on auth state
- Implement navigation reset on login/logout

STEP 7: Test authentication flow
- Test sign up with new account
- Test login with existing account
- Test logout and session persistence
- Test app restart (should stay logged in)
- Test token refresh
- Test error cases (invalid credentials, network errors)

Expected result: Complete authentication system with secure token storage and protected routes.`,
    },
    {
      id: 'add-navigation-screen',
      name: 'Add Navigation Screen',
      description: 'New screen with Expo Router or React Navigation',
      tags: ['Navigation', 'Screens'],
      template: 'Expo Navigation',
      icon: MapPin,
      tooltip: 'Adds a new screen to your app using Expo Router (file-based) or React Navigation. Includes proper routing, navigation params, and screen options.',
      prompt: `Add a new screen to your Expo app with proper navigation.

IMPORTANT: Follow your app's navigation pattern (Expo Router vs React Navigation).

STEP 1: Analyze navigation setup
- Check if using Expo Router (app directory) or React Navigation
- Review existing screen structure and naming conventions
- Note navigation patterns (tabs, stack, drawer)
- Check for existing screen templates
- Review navigation type definitions if using TypeScript

STEP 2: Create new screen component
Follow your project structure:
- Create screen file in appropriate directory
- Implement screen component with proper TypeScript types
- Add screen-specific UI and logic
- Handle navigation params if needed
- Implement loading and error states
- Follow existing screen patterns (hooks, styling, layout)

STEP 3: Register screen in navigation
If using Expo Router:
- Create file in app/ directory (e.g., app/settings.tsx)
- File path becomes route (automatic)
- Use Stack.Screen or Tabs.Screen in _layout.tsx for options
- Export default component from file

If using React Navigation:
- Import screen in navigator file
- Add Screen to Navigator (Tab, Stack, or Drawer)
- Configure screen options (title, header, etc.)
- Define param types in navigation types

STEP 4: Implement navigation to new screen
Add navigation triggers:
- From other screens: navigation.navigate('ScreenName', { params })
- From tabs: automatic if added to TabNavigator
- From buttons/links: onPress handlers
- Deep linking: configure URL pattern if needed

STEP 5: Configure screen options
Customize screen appearance:
- Screen title and header style
- Header buttons (back, save, etc.)
- Tab bar icon and label (if tab screen)
- Drawer icon and label (if drawer screen)
- Transition animations
- Gestures (swipe back, etc.)

STEP 6: Test navigation
- Navigate to screen from various entry points
- Test with different params
- Test back navigation
- Test deep links (if configured)
- Test on both iOS and Android
- Verify screen options render correctly

Expected result: New screen properly integrated into app navigation with correct routing and options.`,
    },
    {
      id: 'add-native-feature',
      name: 'Add Native Feature',
      description: 'Camera, location, notifications, or biometrics',
      tags: ['Native', 'Permissions'],
      template: 'Expo APIs',
      icon: Camera,
      tooltip: 'Integrates native device features using Expo APIs. Handles permissions, implements capture/access logic, and manages platform differences.',
      prompt: `Add a native device feature to your Expo app (camera, location, notifications, or biometrics).

IMPORTANT: Use Expo APIs for cross-platform compatibility and easier setup.

STEP 1: Analyze app requirements
- Determine which native feature to implement
- Check existing permissions handling patterns
- Review app.json/app.config.js for existing plugins
- Note project organization for feature modules
- Check for existing Expo API usage

STEP 2: Choose feature and install package
Camera:
- expo install expo-camera expo-image-picker
- For taking photos/videos and selecting from library

Location:
- expo install expo-location
- For GPS coordinates, address, geofencing

Push Notifications:
- expo install expo-notifications expo-device
- For local and push notifications

Biometric Authentication:
- expo install expo-local-authentication
- For fingerprint, Face ID, face unlock

STEP 3: Configure app permissions
Update app.json or app.config.js:
Camera: Add camera and media library permissions
Location: Add location permissions (foreground/background)
Notifications: Add notification permissions
Biometrics: Permissions usually handled automatically

Add permission descriptions (iOS):
- NSCameraUsageDescription
- NSLocationWhenInUseUsageDescription
- NSUserNotificationsUsageDescription

STEP 4: Implement permission request flow
Follow your project structure:
- Create feature module/hook
- Request permissions on feature access
- Handle permission denied gracefully
- Show rationale before requesting (Android best practice)
- Add settings button if permission permanently denied
- Check permission status before each use

STEP 5: Implement feature logic
Camera:
- Launch camera with Camera API or ImagePicker
- Configure camera options (front/back, quality)
- Handle captured image/video
- Implement preview and retake flow

Location:
- Request location with desired accuracy
- Implement location updates or single request
- Handle location errors (disabled, denied)
- Display location on map if needed

Notifications:
- Set up notification channel (Android)
- Schedule local notifications
- Handle notification taps
- Configure push notifications with EAS

Biometrics:
- Check device capability
- Authenticate user with biometric
- Fall back to PIN/password if unavailable
- Secure sensitive operations

STEP 6: Handle platform differences
- Test feature on both iOS and Android
- Implement platform-specific UI if needed
- Handle different permission flows
- Account for device variations (no biometric sensor, etc.)

STEP 7: Test native feature
- Test on physical devices (simulators may not support all features)
- Test permission flows (grant, deny, deny-then-grant)
- Test feature functionality
- Test error cases (location disabled, camera unavailable)
- Verify app.json configuration applied

Expected result: Native feature working reliably with proper permissions and error handling.`,
    },
    {
      id: 'add-backend-integration',
      name: 'Add Backend Integration',
      description: 'Connect to API (REST or GraphQL)',
      tags: ['API', 'Data'],
      template: 'Expo API Integration',
      icon: Globe,
      tooltip: 'Integrates backend API using fetch, axios, or Apollo Client. Implements data fetching, caching, error handling, and auth token injection.',
      prompt: `Integrate backend API into your Expo app.

IMPORTANT: Choose API client based on backend type (REST vs GraphQL).

STEP 1: Analyze app and backend
- Identify backend type (REST, GraphQL)
- Check for existing API client setup
- Review authentication implementation (need auth tokens?)
- Note data fetching patterns in existing code
- Check for state management (Redux, Zustand, etc.)

STEP 2: Choose API client
For REST APIs:
- Use native fetch() (no dependencies)
- Or install axios for advanced features
- expo install axios

For GraphQL APIs:
- Install Apollo Client: npm install @apollo/client graphql
- Or use urql for lighter alternative: npm install urql graphql

STEP 3: Set up API client
Follow your project structure:
REST with fetch/axios:
- Create API client module (e.g., lib/api.ts)
- Configure base URL (use environment variables)
- Add default headers (Content-Type, etc.)
- Implement auth token injection
- Add request/response interceptors for auth

GraphQL with Apollo:
- Create Apollo Client instance
- Configure GraphQL endpoint
- Add auth link for token injection
- Wrap app with ApolloProvider
- Enable caching if needed

STEP 4: Implement API methods
Create typed API methods:
- Define request/response types
- Implement CRUD operations (GET, POST, PUT, DELETE)
- Add error handling and type guards
- Implement retry logic for failed requests
- Add timeout configuration

For GraphQL:
- Define queries and mutations
- Use useQuery and useMutation hooks
- Implement optimistic updates
- Configure cache policies

STEP 5: Integrate with UI
Update screens to use API:
- Replace mock data with API calls
- Implement loading states
- Handle errors with user-friendly messages
- Add pull-to-refresh for lists
- Implement pagination for long lists
- Cache data appropriately

STEP 6: Handle offline scenarios
Add offline support:
- Cache API responses
- Queue failed requests
- Show cached data when offline
- Sync when online again
- Use NetInfo to detect connectivity

STEP 7: Test API integration
- Test all API methods (CRUD operations)
- Test with slow network (throttling)
- Test offline behavior
- Test authentication token expiry and refresh
- Test error cases (404, 500, network errors)
- Verify data updates reflect in UI

Expected result: Reliable backend integration with proper error handling, caching, and offline support.`,
    },
    {
      id: 'add-data-storage',
      name: 'Add Data Storage',
      description: 'Local storage with SQLite or AsyncStorage',
      tags: ['Storage', 'Database'],
      template: 'Expo Storage',
      icon: Database,
      tooltip: 'Implements local data persistence using SQLite (structured data) or AsyncStorage (key-value). Includes data models, queries, and sync patterns.',
      prompt: `Add local data storage to your Expo app.

IMPORTANT: Choose storage type based on data complexity (SQLite for structured, AsyncStorage for simple key-value).

STEP 1: Analyze storage needs
- Determine data to store (user preferences, cache, offline data)
- Assess data structure complexity
- Check for existing storage usage
- Consider sync requirements (local-only vs sync with backend)
- Review performance requirements

STEP 2: Choose storage solution
AsyncStorage (simple key-value):
- expo install @react-native-async-storage/async-storage
- Good for: settings, tokens, simple cache
- Limitations: No queries, no relationships

SQLite (structured database):
- expo install expo-sqlite
- Good for: complex data, relationships, queries
- Use with Drizzle ORM or raw SQL

SecureStore (encrypted):
- Built-in with Expo
- Good for: tokens, sensitive data
- Limited storage (2KB per key on iOS)

STEP 3: Set up storage client
Follow your project structure:
For AsyncStorage:
- Create storage utility module
- Implement get/set/remove methods
- Add JSON serialization for objects
- Add type-safe wrappers

For SQLite:
- Create database initialization
- Define schema and migrations
- Create database connection helper
- Implement database operations (CRUD)

STEP 4: Implement data models
Define data structures:
- Create TypeScript interfaces
- Implement serialization/deserialization
- Add validation logic
- Create repository pattern (optional)

For SQLite:
- Create tables with migrations
- Define foreign keys and indexes
- Implement query builders
- Add transaction support

STEP 5: Integrate storage into app
Update app to use storage:
- Load data on app startup
- Persist data on changes
- Implement auto-save patterns
- Add data migration for schema changes
- Handle storage errors gracefully

STEP 6: Implement sync patterns (if needed)
If syncing with backend:
- Implement conflict resolution
- Add sync status tracking
- Queue changes while offline
- Sync on app launch and periodically
- Handle partial sync failures

STEP 7: Test storage operations
- Test CRUD operations
- Test data persistence across app restarts
- Test large data sets (performance)
- Test storage quotas and limits
- Test migrations
- Test concurrent access
- Test storage errors (full disk, etc.)

Expected result: Reliable local storage with proper error handling and data integrity.`,
    },
    {
      id: 'add-analytics-expo',
      name: 'Add Analytics',
      description: 'Track events with Expo Analytics or PostHog',
      tags: ['Analytics', 'Tracking'],
      template: 'Expo Analytics',
      icon: BarChart3,
      tooltip: 'Implements analytics tracking for user behavior, screens, and events. Includes Expo Analytics (built-in) or PostHog for advanced features.',
      prompt: `Add analytics tracking to your Expo app.

IMPORTANT: Choose analytics provider based on privacy requirements and feature needs.

STEP 1: Analyze tracking needs
- Identify events to track (screen views, button clicks, etc.)
- Determine user properties to track
- Check privacy requirements (GDPR, CCPA)
- Review existing tracking code
- Consider budget (free vs paid)

STEP 2: Choose analytics provider
Expo Analytics (built-in, privacy-friendly):
- No installation needed (built into Expo)
- Basic event tracking
- Privacy-focused (minimal data)
- Free

PostHog (open source, full-featured):
- npm install posthog-react-native
- Self-hosted or cloud
- Session replay, feature flags
- Free tier available

Firebase Analytics:
- npm install @react-native-firebase/analytics
- Integrates with Firebase ecosystem
- Free, good iOS/Android insights

Mixpanel:
- npm install mixpanel-react-native
- Advanced funnel analytics
- Paid after free tier

STEP 3: Set up analytics SDK
Follow your project structure:
- Create analytics utility module
- Initialize analytics SDK with API key
- Configure tracking preferences (userId, properties)
- Add consent management (opt-in/opt-out)
- Add environment-based tracking (disable in dev)

STEP 4: Implement screen tracking
Auto-track screen views:
If using Expo Router:
- Use useSegments or onNavigationStateChange
- Track screen name automatically

If using React Navigation:
- Use navigation state change listener
- Extract screen name from route
- Track screen view events

STEP 5: Implement event tracking
Add tracking for key events:
- Button clicks (sign up, purchase, share)
- Form submissions
- Feature usage (search, filter, etc.)
- Errors and crashes
- Time spent on screens
- User flows (multi-step processes)

Create typed track function:
- Define event names as constants
- Type event properties
- Add validation for required properties

STEP 6: Implement user identification
Track user identity:
- Call identify() on login with userId
- Set user properties (email, name, plan, etc.)
- Update properties on changes
- Reset identity on logout

STEP 7: Test analytics
- Verify events appear in dashboard
- Test event properties are correct
- Test user identification
- Test opt-out functionality
- Test in development mode (should not track)
- Verify no PII is tracked (if privacy-focused)

Expected result: Complete analytics setup tracking user behavior while respecting privacy preferences.`,
    },
  ],
  'backend-api': [
    {
      id: 'add-api-route',
      name: 'Add API Route',
      description: 'Create new REST endpoint',
      tags: ['API', 'Routes'],
      template: 'Hono API',
      icon: Server,
      tooltip: 'Adds a new API route/endpoint to your Hono server. Includes request validation, error handling, and response formatting.',
      prompt: `Add a new API route to your Hono backend.

IMPORTANT: Follow your project's routing pattern (modular, single-file, or file-based).

STEP 1: Analyze existing API structure
- Check package.json for Hono version
- Identify routing pattern (app.get inline, separate route files, or file-based routing)
- Review existing route definitions
- Note middleware usage (validation, auth, etc.)
- Check error handling patterns
- Review response formatting conventions

STEP 2: Design API endpoint
Define endpoint specifications:
- HTTP method (GET, POST, PUT, PATCH, DELETE)
- URL path (e.g., /api/users/:id)
- Request format (query params, body, path params)
- Response format (success, error)
- Authentication requirements
- Rate limiting needs

STEP 3: Create route handler
Follow your project structure:
If using modular routing:
- Create route file in routes directory
- Define route handlers
- Export router instance
- Import and mount in main app

If using single-file:
- Add route directly to main app file
- Group related routes together

If using file-based routing:
- Create file in routes directory (e.g., users.ts)
- File path becomes route automatically

STEP 4: Implement request validation
Add input validation:
- Use Zod, TypeBox, or custom validation
- Validate query params, body, headers
- Return 400 Bad Request for invalid input
- Type request/response with Hono's generic types
- Document expected request format

STEP 5: Implement route logic
Add business logic:
- Extract validated input
- Perform operations (database, external API, etc.)
- Handle errors gracefully
- Format response consistently
- Add appropriate status codes
- Include error messages for debugging

STEP 6: Add middleware
Apply relevant middleware:
- Authentication (JWT verification, API key check)
- Authorization (role/permission check)
- Rate limiting (prevent abuse)
- CORS (if needed for specific route)
- Request logging

STEP 7: Test API route
- Test with valid request (should succeed)
- Test with invalid request (should return 400)
- Test authentication (if protected)
- Test rate limiting (if applied)
- Test error cases (database error, etc.)
- Verify response format matches spec
- Test with different HTTP methods

Expected result: Working API route with proper validation, error handling, and middleware.`,
    },
    {
      id: 'add-auth-middleware',
      name: 'Add Authentication Middleware',
      description: 'JWT, API Key, or Basic Auth',
      tags: ['Auth', 'Security', 'Middleware'],
      template: 'Hono Auth',
      icon: Shield,
      tooltip: 'Implements authentication middleware for protecting routes. Supports JWT tokens, API keys, or Basic Auth with proper error handling.',
      prompt: `Add authentication middleware to your Hono API.

IMPORTANT: Choose auth strategy based on API consumers (JWT for SPAs/mobile, API keys for server-to-server).

STEP 1: Analyze API requirements
- Identify API consumers (web app, mobile, other servers)
- Check existing auth implementation
- Review environment variables for secrets
- Note protected vs public routes
- Check for existing middleware patterns

STEP 2: Choose authentication strategy
JWT (best for user authentication):
- Install: npm install hono/jwt
- Stateless, contains user info
- Short-lived access tokens
- Refresh token pattern

API Key (best for server-to-server):
- Store keys in database or env
- Simple Bearer token in header
- Per-client keys
- Easy to revoke

Basic Auth (simple, less secure):
- Username:password in header
- Base64 encoded
- Good for internal APIs only

STEP 3: Set up auth configuration
Follow your project structure:
For JWT:
- Store secret in environment variable
- Configure token expiration
- Define JWT payload structure
- Create token generation utility

For API Key:
- Store valid keys in database or config
- Define key validation logic
- Implement key rotation strategy

STEP 4: Create auth middleware
Implement middleware following Hono patterns:
- Extract auth token from header (Authorization: Bearer <token>)
- Validate token format
- Verify token (JWT signature, API key lookup)
- Extract user/client info
- Attach to context (c.set('user', user))
- Return 401 Unauthorized on failure
- Include WWW-Authenticate header in response

STEP 5: Apply middleware to routes
Protect specific routes:
- Apply to individual routes: app.get('/protected', authMiddleware, handler)
- Apply to route groups: app.route('/api/private', privateRoutes)
- Mix public and protected routes
- Document which routes require auth

STEP 6: Implement token generation (if JWT)
Create login/token endpoint:
- Validate user credentials
- Generate JWT with payload (userId, email, roles)
- Set appropriate expiration
- Return token to client
- Optionally implement refresh tokens

STEP 7: Test authentication
- Test protected route without token (should return 401)
- Test with invalid token (should return 401)
- Test with valid token (should succeed)
- Test with expired token (should return 401)
- Test token extraction from different header formats
- Verify user info accessible in route handlers

Expected result: Secure authentication middleware protecting API routes from unauthorized access.`,
    },
    {
      id: 'add-database-model',
      name: 'Add Database Model',
      description: 'ORM model with migrations',
      tags: ['Database', 'ORM'],
      template: 'Hono Database',
      icon: Database,
      tooltip: 'Creates database model/schema with ORM (Prisma, Drizzle, TypeORM). Includes migrations, relations, and CRUD operations.',
      prompt: `Add a database model to your Hono API.

IMPORTANT: Use ORM for type safety and easier migrations (Drizzle recommended for performance).

STEP 1: Analyze database setup
- Check existing database connection
- Identify ORM in use (Prisma, Drizzle, TypeORM, or raw SQL)
- Review existing models for patterns
- Note migration strategy
- Check database type (PostgreSQL, MySQL, SQLite)

STEP 2: Design data model
Define model structure:
- Table name and columns
- Data types for each field
- Constraints (unique, not null, default)
- Indexes for query performance
- Relationships (one-to-many, many-to-many)
- Timestamps (createdAt, updatedAt)

STEP 3: Create model definition
Follow your ORM pattern:
For Prisma:
- Add model to schema.prisma
- Define fields with @ decorators
- Run: npx prisma migrate dev --name add_model
- Regenerate client: npx prisma generate

For Drizzle:
- Create schema file in db/schema/
- Define table with column types
- Export schema
- Run migrations: npm run db:push

For TypeORM:
- Create entity class with decorators
- Define columns with @Column()
- Add relations with @ManyToOne(), etc.
- Generate migration: npm run typeorm migration:generate

STEP 4: Implement CRUD operations
Create repository or service layer:
- Create: Insert new records with validation
- Read: Query by ID, list with pagination, search
- Update: Update existing records, handle partial updates
- Delete: Soft delete (mark as deleted) or hard delete
- Add error handling for all operations
- Return typed results

STEP 5: Add model relations (if needed)
Define relationships:
- One-to-many (User → Posts)
- Many-to-one (Post → User)
- Many-to-many (Posts ↔ Tags)
- Configure cascade delete if appropriate
- Add eager/lazy loading options
- Test relation queries

STEP 6: Create API endpoints for model
Wire model to routes:
- GET /models - List all (with pagination)
- GET /models/:id - Get single by ID
- POST /models - Create new
- PUT/PATCH /models/:id - Update existing
- DELETE /models/:id - Delete
- Add request validation
- Handle 404 for not found

STEP 7: Test database operations
- Test each CRUD operation
- Test with invalid data (should fail validation)
- Test relations (fetch related data)
- Test edge cases (duplicate unique field, etc.)
- Test database constraints
- Verify migrations applied correctly

Expected result: Type-safe database model with CRUD operations and proper migrations.`,
    },
    {
      id: 'add-validation-schema',
      name: 'Add Validation Schema',
      description: 'Zod or TypeBox request validation',
      tags: ['Validation', 'Type Safety'],
      template: 'Hono Validation',
      icon: Shield,
      tooltip: 'Implements request validation using Zod or TypeBox. Provides type-safe validation, error messages, and automatic type inference.',
      prompt: `Add request validation to your Hono API routes.

IMPORTANT: Use Zod or TypeBox for type-safe validation with excellent TypeScript integration.

STEP 1: Analyze validation needs
- Check existing validation patterns
- Review routes that need validation
- Identify validation library in use (Zod, TypeBox, or none)
- Note error response format
- Check TypeScript configuration

STEP 2: Choose validation library
Zod (most popular, great DX):
- npm install zod
- npm install @hono/zod-validator
- Great error messages
- Easy to use

TypeBox (fastest, JSON Schema):
- npm install @sinclair/typebox
- Faster runtime validation
- Generates JSON Schema

STEP 3: Define validation schemas
Create schema definitions:
- Define schema for request body
- Define schema for query params
- Define schema for path params
- Add constraints (min, max, email, regex, etc.)
- Add custom error messages
- Export schemas for reuse

Example (Zod):
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().int().min(18).optional(),
});

STEP 4: Apply validation middleware
Use Hono's validation middleware:
For Zod:
- Import: import { zValidator } from '@hono/zod-validator'
- Apply: app.post('/users', zValidator('json', CreateUserSchema), handler)
- Access validated data: c.req.valid('json')

For TypeBox:
- Similar pattern with @hono/typebox-validator

STEP 5: Handle validation errors
Configure error responses:
- Validation middleware auto-returns 400 on error
- Customize error format if needed
- Include field-specific error messages
- Return structured error response
- Log validation failures for debugging

STEP 6: Infer types from schemas
Use TypeScript type inference:
- Export types: type CreateUser = z.infer<typeof CreateUserSchema>
- Use in handler: (c: Context<{ Variables: { user: CreateUser } }>)
- Get type-safe access to validated data
- No need to manually define types

STEP 7: Test validation
- Test with valid data (should succeed)
- Test with invalid data types (should return 400)
- Test with missing required fields (should return 400)
- Test constraint violations (min/max, email format, etc.)
- Verify error messages are helpful
- Check TypeScript types are inferred correctly

Expected result: Type-safe request validation with clear error messages and automatic type inference.`,
    },
    {
      id: 'add-rate-limiting',
      name: 'Add Rate Limiting',
      description: 'Prevent API abuse with rate limits',
      tags: ['Security', 'Middleware'],
      template: 'Hono Rate Limiting',
      icon: Shield,
      tooltip: 'Implements rate limiting to prevent API abuse. Uses Upstash Redis or in-memory store with configurable limits per endpoint.',
      prompt: `Add rate limiting to your Hono API to prevent abuse.

IMPORTANT: Use Upstash Redis for production (distributed) or in-memory for development (single instance).

STEP 1: Analyze rate limiting needs
- Identify endpoints to protect (public APIs, auth endpoints)
- Determine rate limits (requests per minute/hour)
- Check for existing rate limiting
- Decide on storage (Redis, in-memory, database)
- Review middleware patterns

STEP 2: Choose rate limiting strategy
Upstash Redis (recommended for production):
- npm install @upstash/redis @upstash/ratelimit
- Distributed across instances
- Persistent rate limit counters
- Multiple algorithms (fixed window, sliding window, token bucket)

In-Memory (development only):
- No dependencies
- Simple Map-based storage
- Lost on restart
- Not shared across instances

STEP 3: Set up rate limiter
Configure rate limiter:
For Upstash:
- Create Upstash Redis database
- Get UPSTASH_REDIS_REST_URL and TOKEN from dashboard
- Store in environment variables
- Initialize Ratelimit with Redis client
- Choose algorithm and window

For in-memory:
- Create Map to store request counts
- Implement sliding window algorithm
- Clean up old entries periodically

STEP 4: Create rate limit middleware
Implement middleware:
- Extract identifier (IP address, user ID, API key)
- Check rate limit for identifier
- If exceeded: return 429 Too Many Requests
- If allowed: increment counter and continue
- Add rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- Differentiate limits by route or user tier

STEP 5: Apply rate limiting to routes
Protect specific endpoints:
- Apply to all routes: app.use('*', rateLimitMiddleware)
- Apply to specific routes: app.post('/auth/login', strictRateLimit, handler)
- Different limits for different routes (auth: 5/min, API: 100/hour)
- Exempt certain users (premium tier, internal services)

STEP 6: Configure rate limit response
Customize 429 response:
- Include retry-after header (seconds until reset)
- Return clear error message
- Log rate limit violations
- Consider implementing adaptive rate limiting
- Add CAPTCHA for severe abuse

STEP 7: Test rate limiting
- Send requests within limit (should succeed)
- Exceed rate limit (should return 429)
- Wait for window reset (should succeed again)
- Test different identifiers (IP, user ID)
- Verify rate limit headers are correct
- Test across multiple instances (if using Redis)

Expected result: Effective rate limiting preventing API abuse while allowing legitimate traffic.`,
    },
    {
      id: 'add-api-docs',
      name: 'Add API Documentation',
      description: 'OpenAPI/Swagger or Scalar docs',
      tags: ['Documentation', 'OpenAPI'],
      template: 'Hono API Docs',
      icon: FileText,
      tooltip: 'Generates interactive API documentation using OpenAPI/Swagger or Scalar. Auto-generates docs from route definitions and validation schemas.',
      prompt: `Add API documentation to your Hono backend.

IMPORTANT: Use Scalar for modern docs or Swagger for wider compatibility.

STEP 1: Analyze documentation needs
- Review existing routes and endpoints
- Check for existing API documentation
- Identify validation schemas (can auto-generate from Zod)
- Determine doc format (OpenAPI 3.0, Swagger 2.0)
- Check if using Hono's OpenAPI plugin

STEP 2: Choose documentation tool
Scalar (modern, beautiful):
- npm install @scalar/hono-api-reference
- Modern UI with dark mode
- Interactive API playground
- Works with OpenAPI 3.0+

Swagger UI (traditional):
- npm install @hono/swagger-ui
- Industry standard
- Wide ecosystem support
- Familiar interface

STEP 3: Set up OpenAPI spec
If using Hono OpenAPI:
- npm install @hono/zod-openapi
- Create OpenAPIHono instance
- Define routes with .openapi() method
- Specify request/response schemas
- Add route descriptions and tags

Manual OpenAPI spec:
- Create openapi.json or openapi.yaml
- Define paths, operations, schemas
- Document request/response formats
- Add authentication schemes

STEP 4: Generate docs from schemas
Auto-generate from Zod schemas:
- Convert Zod schemas to OpenAPI schemas
- Use zod-openapi for automatic conversion
- Define reusable components
- Add examples to schemas
- Document validation rules

STEP 5: Add documentation endpoint
Mount docs UI:
For Scalar:
import { apiReference } from '@scalar/hono-api-reference'
app.get('/docs', apiReference({
  spec: { url: '/openapi.json' }
}))

For Swagger:
import { swaggerUI } from '@hono/swagger-ui'
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

STEP 6: Enhance documentation
Improve doc quality:
- Add endpoint descriptions
- Provide request examples
- Document error responses
- Add authentication instructions
- Include rate limit info
- Group endpoints with tags

STEP 7: Test documentation
- Visit /docs endpoint
- Verify all routes are documented
- Test interactive API playground
- Try authenticated requests
- Check error response examples
- Verify schemas are accurate

Expected result: Comprehensive, interactive API documentation accessible to developers.`,
    },
  ],
  'tauri-desktop': [
    {
      id: 'add-system-tray',
      name: 'Add System Tray',
      description: 'System tray icon with menu',
      tags: ['Native', 'UI'],
      template: 'Tauri System Tray',
      icon: Monitor,
      tooltip: 'Adds system tray icon with context menu. Allows app to run in background with quick actions accessible from tray.',
      prompt: `Add system tray icon and menu to your Tauri desktop app.

IMPORTANT: System tray provides background operation and quick access to app functions.

STEP 1: Analyze app requirements
- Check existing Tauri configuration
- Review tauri.conf.json for system tray settings
- Identify desired tray menu items
- Note Rust backend organization
- Check for existing Tauri plugins

STEP 2: Configure system tray in tauri.conf.json
Add system tray configuration:
{
  "tauri": {
    "systemTray": {
      "iconPath": "icons/tray-icon.png",
      "iconAsTemplate": true  // macOS: adapt to dark/light mode
    }
  }
}

STEP 3: Create tray icons
Prepare icon assets:
- Create tray icon (usually 22x22px or 32x32px)
- PNG with transparency
- Simple, monochrome design for best visibility
- Place in src-tauri/icons/ directory
- Create separate icons for different states if needed

STEP 4: Implement tray menu in Rust
Update src-tauri/src/main.rs:
- Import SystemTray and SystemTrayMenu
- Create menu items (show, hide, settings, quit)
- Build SystemTray with menu
- Handle tray events (menu item clicks)
- Show/hide main window on click
- Implement quit action

Example:
use tauri::{SystemTray, SystemTrayMenu, SystemTrayMenuItem, CustomMenuItem};

let tray_menu = SystemTrayMenu::new()
  .add_item(CustomMenuItem::new("show", "Show"))
  .add_item(CustomMenuItem::new("quit", "Quit"));

STEP 5: Handle tray events
Implement event handler:
- Listen for system_tray_event
- Match on menu item IDs
- Show/hide window
- Execute app functions
- Update tray icon if needed (different states)
- Handle double-click on tray icon

STEP 6: Implement tray icon updates (optional)
Dynamic icon changes:
- Update icon based on app state
- Use app.tray_handle().set_icon()
- Change icon for notifications
- Badge icon with unread count (macOS)
- Animate icon for activity

STEP 7: Test system tray
- Verify tray icon appears on startup
- Test each menu item
- Test show/hide window
- Test quit from tray
- Test on Windows, macOS, Linux (different behaviors)
- Verify icon visibility (light/dark themes)
- Test with app minimized
- Verify app can run without window

Expected result: Functional system tray allowing app to run in background with quick access to key features.`,
    },
    {
      id: 'add-native-dialog',
      name: 'Add Native Dialog',
      description: 'File picker, save dialog, message box',
      tags: ['Native', 'UI'],
      template: 'Tauri Dialogs',
      icon: FileText,
      tooltip: 'Implements native OS dialogs for file selection, saving files, and showing messages. Uses platform-native UI for better user experience.',
      prompt: `Add native dialogs to your Tauri desktop app.

IMPORTANT: Use Tauri's dialog API for platform-native file pickers and message boxes.

STEP 1: Analyze dialog requirements
- Identify needed dialog types (file open, save, message, confirm)
- Check existing Tauri commands
- Review file system access needs
- Note frontend framework (React, Vue, Svelte)
- Check tauri.conf.json allowlist permissions

STEP 2: Configure dialog permissions
Update tauri.conf.json:
{
  "tauri": {
    "allowlist": {
      "dialog": {
        "all": false,
        "open": true,
        "save": true,
        "message": true,
        "ask": true,
        "confirm": true
      }
    }
  }
}

STEP 3: Implement file open dialog
Use from frontend:
import { open } from '@tauri-apps/api/dialog';

// Select single file
const selected = await open({
  multiple: false,
  filters: [{
    name: 'Images',
    extensions: ['png', 'jpg', 'jpeg']
  }]
});

// Select multiple files
const files = await open({ multiple: true });

// Select directory
const dir = await open({ directory: true });

STEP 4: Implement file save dialog
Save file with dialog:
import { save } from '@tauri-apps/api/dialog';

const filePath = await save({
  defaultPath: 'document.txt',
  filters: [{
    name: 'Text',
    extensions: ['txt', 'md']
  }]
});

// Write file after getting path
if (filePath) {
  await writeFile({ path: filePath, contents: data });
}

STEP 5: Implement message dialogs
Show messages to user:
import { message, ask, confirm } from '@tauri-apps/api/dialog';

// Info message
await message('Operation completed', 'Success');

// Ask yes/no question
const yes = await ask('Are you sure?', 'Confirm');

// Confirm with OK/Cancel
const confirmed = await confirm('Delete file?', { type: 'warning' });

STEP 6: Create dialog helper utilities
Wrap dialogs for easier use:
- Create useDialog hook (React) or composable (Vue)
- Add error handling
- Set default dialog options
- Add loading states
- Type dialog responses
- Centralize dialog styling/theming

STEP 7: Test dialogs
- Test file open dialog (single, multiple, directory)
- Test file save dialog with different extensions
- Test message dialogs (info, warning, error)
- Test ask/confirm dialogs
- Test cancellation (user clicks cancel)
- Test on all target platforms (Windows, macOS, Linux)
- Verify file path format is correct

Expected result: Native OS dialogs for file operations and user messages with platform-appropriate UI.`,
    },
    {
      id: 'add-file-system',
      name: 'Add File System Access',
      description: 'Read/write files from Rust backend',
      tags: ['File System', 'Backend'],
      template: 'Tauri FS',
      icon: Database,
      tooltip: 'Implements secure file system access through Tauri commands. Allows reading, writing, and managing files with proper permissions.',
      prompt: `Add file system access to your Tauri desktop app.

IMPORTANT: Use Tauri's fs API or Rust commands for secure file operations.

STEP 1: Analyze file system needs
- Identify file operations needed (read, write, list, delete)
- Determine access scope (app directory, user documents, arbitrary paths)
- Check security requirements
- Review tauri.conf.json fs permissions
- Note whether to use fs API or Rust commands

STEP 2: Configure file system permissions
Update tauri.conf.json:
{
  "tauri": {
    "allowlist": {
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "removeFile": true,
        "scope": ["$APPDATA/*", "$DOCUMENT/*"]
      }
    }
  }
}

STEP 3: Use frontend fs API (simple operations)
Import and use fs API:
import { readTextFile, writeTextFile, readDir, createDir } from '@tauri-apps/api/fs';
import { appDataDir } from '@tauri-apps/api/path';

// Read text file
const content = await readTextFile('config.json', { dir: BaseDirectory.AppData });

// Write file
await writeTextFile('config.json', JSON.stringify(data), { dir: BaseDirectory.AppData });

// Read directory
const entries = await readDir('', { dir: BaseDirectory.AppData });

STEP 4: Create Rust commands (advanced operations)
Implement in src-tauri/src/main.rs:
- Create #[tauri::command] functions
- Implement file operations with std::fs
- Add error handling with Result<T, String>
- Handle path validation
- Add permission checks

Example:
#[tauri::command]
fn read_app_file(filename: String) -> Result<String, String> {
  let app_dir = /* get app data dir */;
  let path = app_dir.join(filename);
  fs::read_to_string(path).map_err(|e| e.to_string())
}

STEP 5: Register Rust commands
Add commands to Tauri builder:
fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      read_app_file,
      write_app_file,
      list_files
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

STEP 6: Call Rust commands from frontend
Invoke commands:
import { invoke } from '@tauri-apps/api/tauri';

const content = await invoke('read_app_file', { filename: 'data.json' });
await invoke('write_app_file', { filename: 'data.json', content: '{}' });

STEP 7: Test file operations
- Test reading existing files
- Test writing new files
- Test reading directories
- Test creating directories
- Test error handling (file not found, permission denied)
- Test path traversal protection
- Test with different file encodings
- Verify scope restrictions work

Expected result: Secure file system access with proper error handling and permission checks.`,
    },
    {
      id: 'add-auto-updater',
      name: 'Add Auto-Updater',
      description: 'Automatic app updates',
      tags: ['Updates', 'Distribution'],
      template: 'Tauri Updater',
      icon: Play,
      tooltip: 'Implements automatic updates using Tauri updater. Checks for updates, downloads, and installs new versions with user consent.',
      prompt: `Add automatic updates to your Tauri desktop app.

IMPORTANT: Requires code signing and update manifest hosting for production.

STEP 1: Analyze update requirements
- Check current Tauri version (updater in 1.0+)
- Determine update frequency (on startup, background check)
- Plan update manifest hosting (GitHub Releases, S3, custom server)
- Review code signing setup
- Note target platforms

STEP 2: Configure updater in tauri.conf.json
Enable and configure updater:
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.myapp.com/{{target}}/{{current_version}}"
      ],
      "dialog": true,  // Show update dialog
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}

STEP 3: Set up code signing
Generate signing keys:
- Run: tauri signer generate
- Save private key securely (never commit)
- Add public key to tauri.conf.json
- Set TAURI_PRIVATE_KEY env variable for CI/CD
- Configure per-platform signing (Windows, macOS)

STEP 4: Create update manifest
Host update.json file:
{
  "version": "1.2.0",
  "notes": "Bug fixes and improvements",
  "pub_date": "2024-01-15T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "SIGNATURE_HERE",
      "url": "https://releases.myapp.com/MyApp_1.2.0_x64_en-US.msi.zip"
    },
    "darwin-aarch64": {
      "signature": "SIGNATURE_HERE",
      "url": "https://releases.myapp.com/MyApp_1.2.0_aarch64.app.tar.gz"
    }
  }
}

STEP 5: Implement update check
Check for updates from frontend:
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';

try {
  const { shouldUpdate, manifest } = await checkUpdate();
  if (shouldUpdate) {
    // Show update prompt
    const install = confirm(\`Update available: \${manifest?.version}\`);
    if (install) {
      await installUpdate();
      await relaunch();  // Restart app
    }
  }
} catch (error) {
  console.error('Update check failed:', error);
}

STEP 6: Implement update UI
Create update flow:
- Check on app startup (or periodically)
- Show update notification
- Display release notes
- Show download progress
- Handle update errors
- Allow user to skip/postpone
- Implement silent updates (optional)

STEP 7: Test updater
- Build app with version 1.0.0
- Create update manifest for version 1.1.0
- Test update check (should find update)
- Test update installation
- Verify app relaunches with new version
- Test update cancellation
- Test with no updates available
- Test signature verification
- Test on all target platforms

Expected result: Reliable auto-update system that keeps users on the latest version with minimal friction.`,
    },
    {
      id: 'add-ipc-command',
      name: 'Add IPC Command',
      description: 'Frontend-backend communication',
      tags: ['IPC', 'Backend'],
      template: 'Tauri Commands',
      icon: Zap,
      tooltip: 'Creates Tauri command for frontend-backend communication. Implements type-safe IPC with Rust functions callable from JavaScript.',
      prompt: `Add a new IPC command to your Tauri app for frontend-backend communication.

IMPORTANT: Tauri commands enable secure communication between frontend and Rust backend.

STEP 1: Analyze IPC needs
- Identify operation to implement (computation, system access, etc.)
- Check existing commands for patterns
- Review src-tauri/src/main.rs command registration
- Note whether command needs app state access
- Consider async requirements

STEP 2: Create Rust command function
Implement in src-tauri/src/main.rs or separate module:
- Use #[tauri::command] attribute
- Define function with appropriate parameters
- Return Result<T, String> for error handling
- Add async if needed (async fn)
- Implement business logic
- Handle errors gracefully

Example:
#[tauri::command]
async fn greet(name: String) -> Result<String, String> {
  if name.is_empty() {
    return Err("Name cannot be empty".to_string());
  }
  Ok(format!("Hello, {}!", name))
}

STEP 3: Register command with Tauri
Add to invoke_handler:
fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      greet,
      // other commands...
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

STEP 4: Add command with app state (if needed)
Access app state in command:
use tauri::State;

struct AppState {
  db: Mutex<Database>
}

#[tauri::command]
async fn save_data(
  data: String,
  state: State<'_, AppState>
) -> Result<(), String> {
  let db = state.db.lock().unwrap();
  db.save(&data).map_err(|e| e.to_string())
}

// Register state in main()
.manage(AppState { db: Mutex::new(Database::new()) })

STEP 5: Call command from frontend
Invoke command with typed parameters:
import { invoke } from '@tauri-apps/api/tauri';

try {
  const result = await invoke<string>('greet', { name: 'World' });
  console.log(result);  // "Hello, World!"
} catch (error) {
  console.error('Command failed:', error);
}

STEP 6: Add TypeScript types for commands
Create types for type safety:
// src/types/tauri-commands.ts
export interface GreetParams {
  name: string;
}

export async function greet(params: GreetParams): Promise<string> {
  return invoke('greet', params);
}

STEP 7: Test IPC command
- Test with valid input (should succeed)
- Test with invalid input (should return error)
- Test async operations (should handle properly)
- Test error handling
- Verify TypeScript types work
- Test with app state access (if applicable)
- Check performance with heavy operations

Expected result: Type-safe IPC command enabling secure frontend-backend communication.`,
    },
    {
      id: 'add-local-database-tauri',
      name: 'Add Local Database',
      description: 'SQLite embedded database',
      tags: ['Database', 'Storage'],
      template: 'Tauri Database',
      icon: Database,
      tooltip: 'Integrates SQLite database for local data storage. Implements schema, migrations, and queries accessible via Tauri commands.',
      prompt: `Add SQLite database to your Tauri desktop app.

IMPORTANT: Use rusqlite for SQLite access from Rust backend with type safety.

STEP 1: Analyze database requirements
- Identify data to store (settings, cache, user data)
- Design database schema (tables, columns, relations)
- Determine query patterns
- Check existing database code
- Review src-tauri/Cargo.toml dependencies

STEP 2: Add SQLite dependencies
Update src-tauri/Cargo.toml:
[dependencies]
rusqlite = { version = "0.30", features = ["bundled"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

Run: cargo build (to install dependencies)

STEP 3: Create database module
Create src-tauri/src/database.rs:
- Define connection initialization
- Implement table creation (schema)
- Add migration logic
- Create CRUD functions
- Handle connection pooling
- Add error types

Example:
use rusqlite::{Connection, Result};

pub fn init_db() -> Result<Connection> {
  let conn = Connection::open("app.db")?;
  conn.execute(
    "CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )",
    [],
  )?;
  Ok(conn)
}

STEP 4: Add database to app state
Manage database connection in main.rs:
use std::sync::Mutex;
use tauri::State;

struct AppState {
  db: Mutex<Connection>
}

fn main() {
  let conn = init_db().expect("Failed to initialize database");

  tauri::Builder::default()
    .manage(AppState { db: Mutex::new(conn) })
    // ...
}

STEP 5: Create database commands
Implement Tauri commands for CRUD:
#[tauri::command]
async fn create_user(
  name: String,
  email: String,
  state: State<'_, AppState>
) -> Result<i64, String> {
  let db = state.db.lock().unwrap();
  db.execute(
    "INSERT INTO users (name, email) VALUES (?1, ?2)",
    [&name, &email],
  ).map_err(|e| e.to_string())?;
  Ok(db.last_insert_rowid())
}

#[tauri::command]
async fn get_users(state: State<'_, AppState>) -> Result<Vec<User>, String> {
  let db = state.db.lock().unwrap();
  let mut stmt = db.prepare("SELECT id, name, email FROM users")
    .map_err(|e| e.to_string())?;
  let users = stmt.query_map([], |row| {
    Ok(User {
      id: row.get(0)?,
      name: row.get(1)?,
      email: row.get(2)?,
    })
  }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| e.to_string())?;
  Ok(users)
}

STEP 6: Call database commands from frontend
Use commands in UI:
import { invoke } from '@tauri-apps/api/tauri';

interface User {
  id: number;
  name: string;
  email: string;
}

// Create user
const userId = await invoke<number>('create_user', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Get all users
const users = await invoke<User[]>('get_users');

STEP 7: Test database operations
- Test database initialization
- Test create operations
- Test read operations (single, list)
- Test update operations
- Test delete operations
- Test with invalid data (constraint violations)
- Test concurrent access
- Verify data persistence across app restarts

Expected result: Functional embedded SQLite database accessible from frontend via type-safe commands.`,
    },
  ],
};

export function FeaturesModal({ onComplete, onClose }: FeaturesModalProps) {
  const [step, setStep] = useState<'project-type' | 'feature-selection'>('project-type');
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleProjectTypeSelect = (typeId: string) => {
    setSelectedProjectType(typeId);
    setSelectedFeature(null); // Reset feature selection
    setStep('feature-selection');
  };

  const handleBack = () => {
    setStep('project-type');
    setSelectedFeature(null);
  };

  const handleFeatureSelect = (featureId: string) => {
    // Toggle selection (click again to deselect)
    setSelectedFeature(prev => prev === featureId ? null : featureId);
  };

  const handleGenerate = () => {
    if (!selectedProjectType || !selectedFeature) return;

    const features = FEATURES_BY_TYPE[selectedProjectType];
    const feature = features?.find(f => f.id === selectedFeature);

    if (!feature) return;

    onComplete(feature.prompt);
  };

  const currentFeatures = selectedProjectType ? FEATURES_BY_TYPE[selectedProjectType] || [] : [];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1152px', // max-w-6xl = 72rem = 1152px (same as Build Wizard)
          height: '90vh',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgb(20, 22, 24)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          aria-label="Close modal"
        >
          <X style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Spacer for close button */}
        <div style={{ height: '60px', flexShrink: 0 }} />

        {/* Step Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: '80px', // Space for fixed buttons
          }}
        >
          {step === 'project-type' ? (
            /* Project Type Selection - Build Wizard Style */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '20px 32px',
            }}>
              {/* Header */}
              <div style={{
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                }}>
                  <Package style={{ width: '32px', height: '32px', color: 'rgba(255, 255, 255, 0.8)' }} />
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px',
                }}>
                  What&apos;s your tech stack?
                </h2>
                <p style={{
                  color: 'rgb(156, 163, 175)',
                  fontSize: '14px',
                }}>
                  Select your project type to see available features
                </p>
              </div>

              {/* Template Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '700px',
                }}
              >
                {PROJECT_TYPES.map((type, index) => {
                  const Icon = type.icon;
                  const isHovered = hoveredType === type.id;

                  return (
                    <button
                      key={type.id}
                      onClick={() => handleProjectTypeSelect(type.id)}
                      onMouseEnter={() => setHoveredType(type.id)}
                      onMouseLeave={() => setHoveredType(null)}
                      className="promptCard waterfall"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        animationDelay: `${index * 80}ms`,
                        backgroundColor: 'rgb(38, 40, 42)',
                        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                        boxShadow: isHovered
                          ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 300ms',
                        position: 'relative',
                        zIndex: isHovered ? 10001 : 1,
                      }}
                    >
                      {/* Icon with gradient background */}
                      <div
                        style={{
                          marginBottom: '10px',
                          padding: '8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 'fit-content',
                          backgroundImage: type.gradient,
                          backgroundSize: '200% auto',
                          ...(isHovered ? {
                            animationName: 'shimmer',
                            animationDuration: '3s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                          } : {}),
                        }}
                      >
                        <div style={{ color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon style={{ width: '20px', height: '20px' }} />
                        </div>
                      </div>

                      {/* Template Name */}
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'white',
                        marginBottom: '4px',
                      }}>
                        {type.name}
                      </h3>

                      {/* Description */}
                      <p style={{
                        color: 'rgb(156, 163, 175)',
                        fontSize: '13px',
                        lineHeight: '1.5',
                      }}>
                        {type.description}
                      </p>

                      {/* Feature Count Badge */}
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{
                          fontSize: '11px',
                          color: 'rgb(107, 114, 128)',
                        }}>
                          {type.featureCount} feature{type.featureCount !== 1 ? 's' : ''}
                        </span>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            ...(isHovered ? {
                              backgroundImage: type.gradient,
                              backgroundSize: '200% auto',
                            } : {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            }),
                            color: isHovered ? '#000000' : 'rgb(156, 163, 175)',
                            transition: 'all 0.3s',
                          }}
                        >
                          Select
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Helper Text */}
              <p style={{
                marginTop: '16px',
                fontSize: '12px',
                color: 'rgb(107, 114, 128)',
                textAlign: 'center',
                maxWidth: '448px',
              }}>
                Each feature uses official templates and best-in-class tools.
                <br />
                Select your stack to see available features.
              </p>
            </div>
          ) : (
            /* Feature Selection */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              padding: '20px 32px',
            }}>
              {/* Header */}
              <div style={{
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px',
                }}>
                  Choose a Feature
                </h2>
                <p style={{
                  color: 'rgb(156, 163, 175)',
                  fontSize: '14px',
                }}>
                  Select one feature to implement using best-in-class tools
                </p>
              </div>

              {/* Features Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                width: '100%',
                maxWidth: '700px',
                margin: '0 auto 32px',
              }}>
                {currentFeatures.map((feature) => {
                  const FeatureIcon = feature.icon;
                  const isSelected = selectedFeature === feature.id;

                  return (
                    <button
                      key={feature.id}
                      onClick={() => handleFeatureSelect(feature.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: isSelected ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 200ms',
                      }}
                    >
                      {/* Icon and Title Row */}
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '8px' }}>
                        <div
                          style={{
                            flexShrink: 0,
                            padding: '6px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                            color: isSelected ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FeatureIcon style={{ width: '20px', height: '20px' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                              {feature.name}
                            </div>
                            <Tooltip text={feature.tooltip}>
                              <HelpCircle
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  color: 'rgb(107, 114, 128)',
                                  cursor: 'help',
                                  flexShrink: 0,
                                }}
                              />
                            </Tooltip>
                          </div>

                          {/* Template Badge */}
                          <div style={{ fontSize: '11px', color: 'rgb(156, 163, 175)' }}>
                            {feature.template}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div style={{ fontSize: '12px', color: 'rgb(209, 213, 219)', marginBottom: '12px', lineHeight: '1.5' }}>
                        {feature.description}
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {feature.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(168, 199, 250, 0.15)',
                              color: 'rgb(168, 199, 250)',
                              fontWeight: 500,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Action Buttons */}
        {step === 'feature-selection' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 32px',
              backgroundColor: 'rgb(20, 22, 24)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            <button
              onClick={handleBack}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ← Back
            </button>

            {selectedFeature && (
              <div style={{ fontSize: '13px', color: 'rgb(156, 163, 175)' }}>
                1 feature selected
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedFeature}
              className={selectedFeature ? 'send-button-active' : ''}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: selectedFeature ? 'pointer' : 'not-allowed',
                transition: 'all 200ms',
                ...(selectedFeature
                  ? {}
                  : {
                      backgroundColor: 'rgb(75, 85, 99)',
                      color: 'rgba(255, 255, 255, 0.4)',
                      border: 'none',
                    }),
              }}
            >
              Generate Implementation
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
