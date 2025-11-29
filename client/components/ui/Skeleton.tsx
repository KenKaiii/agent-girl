/**
 * Skeleton Loading Components
 * Placeholder UI elements for loading states
 */

import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '0.25rem',
  className = '',
  style = {},
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
}

/**
 * Skeleton for chat list items in sidebar
 */
export function ChatItemSkeleton() {
  return (
    <div style={{
      padding: '0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <Skeleton width="70%" height="0.875rem" />
      <Skeleton width="40%" height="0.625rem" />
    </div>
  );
}

/**
 * Skeleton for sidebar chat list
 */
export function ChatListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {/* Group header skeleton */}
      <div style={{ padding: '0.5rem 0.75rem' }}>
        <Skeleton width="60px" height="0.7rem" />
      </div>
      {/* Chat items */}
      {Array.from({ length: count }).map((_, i) => (
        <ChatItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a single message
 */
export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      padding: '1rem',
      maxWidth: isUser ? '70%' : '100%',
      marginLeft: isUser ? 'auto' : 0,
    }}>
      {/* Avatar placeholder */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Skeleton width={24} height={24} borderRadius="50%" />
        <Skeleton width="80px" height="0.75rem" />
      </div>
      {/* Content lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', paddingLeft: '2rem' }}>
        <Skeleton width="100%" height="0.875rem" />
        <Skeleton width="90%" height="0.875rem" />
        <Skeleton width="75%" height="0.875rem" />
      </div>
    </div>
  );
}

/**
 * Skeleton for message list loading
 */
export function MessageListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} isUser={i % 2 === 0} />
      ))}
    </div>
  );
}

/**
 * Skeleton for search results
 */
export function SearchResultSkeleton() {
  return (
    <div style={{
      padding: '0.5rem',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '0.375rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.375rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <Skeleton width={6} height={6} borderRadius="50%" />
        <Skeleton width="100px" height="0.625rem" />
      </div>
      <Skeleton width="100%" height="0.75rem" />
      <Skeleton width="80%" height="0.75rem" />
    </div>
  );
}

/**
 * Skeleton for search results list
 */
export function SearchResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SearchResultSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for code block
 */
export function CodeBlockSkeleton() {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginTop: '0.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <Skeleton width="80px" height="0.75rem" />
        <Skeleton width="60px" height="0.75rem" />
      </div>
      {/* Code lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <Skeleton width="60%" height="0.75rem" />
        <Skeleton width="80%" height="0.75rem" />
        <Skeleton width="45%" height="0.75rem" />
        <Skeleton width="70%" height="0.75rem" />
        <Skeleton width="55%" height="0.75rem" />
      </div>
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function PageLoadingSkeleton() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'rgb(var(--bg-primary))',
    }}>
      {/* Sidebar skeleton */}
      <div style={{
        width: '280px',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {/* Logo */}
        <Skeleton width="120px" height="32px" />
        {/* New chat button */}
        <Skeleton width="100%" height="40px" borderRadius="0.5rem" />
        {/* Search */}
        <Skeleton width="100%" height="36px" borderRadius="0.5rem" />
        {/* Chat list */}
        <ChatListSkeleton count={6} />
      </div>

      {/* Main content skeleton */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          height: '56px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Skeleton width="200px" height="24px" />
          <Skeleton width="120px" height="32px" />
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MessageListSkeleton count={3} />
        </div>

        {/* Input area */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Skeleton width="100%" height="80px" borderRadius="0.5rem" />
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading spinner
 */
export function LoadingSpinner({ size = 16 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: '2px solid rgba(255,255,255,0.2)',
        borderTopColor: 'rgba(255,255,255,0.6)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

/**
 * Loading dots animation
 */
export function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          style={{
            width: '4px',
            height: '4px',
            backgroundColor: 'rgb(var(--text-secondary))',
            borderRadius: '50%',
            animation: 'pulse 1.4s ease-in-out infinite',
            animationDelay: `${delay}s`,
            opacity: 0.6,
          }}
        />
      ))}
    </span>
  );
}

// Add required CSS animation to global styles
export const skeletonStyles = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}

.skeleton {
  position: relative;
  overflow: hidden;
}
`;
