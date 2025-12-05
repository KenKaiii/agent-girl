import React, { useLayoutEffect, useRef, memo } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid once
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#A8C7FA',
    primaryTextColor: '#DAEEFF',
    primaryBorderColor: 'rgba(168, 199, 250, 0.3)',
    lineColor: 'rgba(168, 199, 250, 0.5)',
    secondaryColor: 'rgba(168, 199, 250, 0.1)',
    background: 'transparent',
    mainBkg: 'rgba(168, 199, 250, 0.1)',
    secondBkg: 'rgba(168, 199, 250, 0.05)',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
  securityLevel: 'loose',
});

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram = memo(function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Debounce rendering to wait for streaming to complete
    const timeoutId = setTimeout(async () => {
      if (ref.current) {
        try {
          // Generate SVG using mermaid.render() API
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2)}`;
          const { svg } = await mermaid.render(id, chart);

          // Set innerHTML directly - React won't overwrite this
          ref.current.innerHTML = svg;
        } catch {
          // Invalid syntax - show as code
          if (ref.current) {
            ref.current.innerHTML = `<code class="text-sm text-white/80">${chart}</code>`;
          }
        }
      }
    }, 500); // 500ms delay to wait for text streaming to finish

    return () => clearTimeout(timeoutId);
  }, [chart]);

  return (
    <div
      ref={ref}
      className="my-3 p-4 border border-white/10 rounded-lg bg-black/20 overflow-x-auto"
    />
  );
});
