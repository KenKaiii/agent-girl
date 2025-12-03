/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Annotation Canvas - Drawing overlay for preview panel
 * Allows users to draw rectangles, arrows, freehand marks to indicate
 * what they want the AI to edit on the website.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

export type AnnotationTool = 'select' | 'rect' | 'arrow' | 'freehand' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  tool: AnnotationTool;
  points: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

interface AnnotationCanvasProps {
  width: number;
  height: number;
  activeTool: AnnotationTool;
  annotations: Annotation[];
  onAnnotationsChange: (annotations: Annotation[]) => void;
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  color?: string;
  strokeWidth?: number;
  disabled?: boolean;
}

export function AnnotationCanvas({
  width,
  height,
  activeTool,
  annotations,
  onAnnotationsChange,
  selectedAnnotationId,
  onSelectAnnotation,
  color = '#3b82f6',
  strokeWidth = 3,
  disabled = false,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Draw all annotations
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw existing annotations
    for (const annotation of annotations) {
      const isSelected = annotation.id === selectedAnnotationId;
      drawAnnotation(ctx, annotation, isSelected);
    }

    // Draw current annotation being created
    if (isDrawing && currentPoints.length > 0) {
      const tempAnnotation: Annotation = {
        id: 'temp',
        tool: activeTool,
        points: currentPoints,
        color,
        strokeWidth,
      };

      if (activeTool === 'rect' && startPoint && currentPoints.length > 0) {
        const endPoint = currentPoints[currentPoints.length - 1];
        tempAnnotation.bounds = {
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y),
          width: Math.abs(endPoint.x - startPoint.x),
          height: Math.abs(endPoint.y - startPoint.y),
        };
        tempAnnotation.points = [startPoint, endPoint];
      }

      drawAnnotation(ctx, tempAnnotation, false);
    }
  }, [annotations, selectedAnnotationId, isDrawing, currentPoints, activeTool, color, strokeWidth, startPoint, width, height]);

  // Draw a single annotation
  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation, isSelected: boolean) => {
    ctx.save();
    ctx.strokeStyle = annotation.color;
    ctx.lineWidth = annotation.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isSelected) {
      ctx.shadowColor = annotation.color;
      ctx.shadowBlur = 8;
    }

    switch (annotation.tool) {
      case 'rect':
        drawRect(ctx, annotation);
        break;
      case 'arrow':
        drawArrow(ctx, annotation);
        break;
      case 'freehand':
        drawFreehand(ctx, annotation);
        break;
      case 'text':
        drawTextAnnotation(ctx, annotation, isSelected);
        break;
    }

    ctx.restore();
  };

  // Draw rectangle
  const drawRect = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    if (annotation.bounds) {
      const { x, y, width: w, height: h } = annotation.bounds;
      ctx.fillStyle = `${annotation.color}15`;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      // Draw corner handles
      const handleSize = 6;
      ctx.fillStyle = annotation.color;
      const corners = [
        { x, y },
        { x: x + w, y },
        { x, y: y + h },
        { x: x + w, y: y + h },
      ];
      for (const corner of corners) {
        ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
      }
    }
  };

  // Draw arrow
  const drawArrow = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    if (annotation.points.length < 2) return;

    const start = annotation.points[0];
    const end = annotation.points[annotation.points.length - 1];

    // Draw line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const headLength = 15;

    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  // Draw freehand
  const drawFreehand = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    if (annotation.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);

    // Use quadratic curves for smoother lines
    for (let i = 1; i < annotation.points.length - 1; i++) {
      const xc = (annotation.points[i].x + annotation.points[i + 1].x) / 2;
      const yc = (annotation.points[i].y + annotation.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(annotation.points[i].x, annotation.points[i].y, xc, yc);
    }

    // Last point
    const last = annotation.points[annotation.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  };

  // Draw text annotation
  const drawTextAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation, isSelected: boolean) => {
    if (!annotation.text || annotation.points.length === 0) return;

    const pos = annotation.points[0];
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = annotation.color;

    // Draw background
    const metrics = ctx.measureText(annotation.text);
    const padding = 6;
    const bgHeight = 22;

    ctx.fillStyle = isSelected ? `${annotation.color}30` : `${annotation.color}20`;
    ctx.fillRect(
      pos.x - padding,
      pos.y - bgHeight + padding,
      metrics.width + padding * 2,
      bgHeight
    );

    // Draw text
    ctx.fillStyle = annotation.color;
    ctx.fillText(annotation.text, pos.x, pos.y);
  };

  // Redraw on changes
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || activeTool === 'select') return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentPoints([pos]);
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const pos = getMousePos(e);

    if (activeTool === 'freehand') {
      setCurrentPoints(prev => [...prev, pos]);
    } else {
      // For rect and arrow, just update the end point
      setCurrentPoints(prev => prev.length > 0 ? [prev[0], pos] : [pos]);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (!isDrawing || currentPoints.length === 0) {
      setIsDrawing(false);
      return;
    }

    // Create new annotation
    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      tool: activeTool,
      points: currentPoints,
      color,
      strokeWidth,
    };

    // Calculate bounds for rect
    if (activeTool === 'rect' && startPoint && currentPoints.length > 1) {
      const endPoint = currentPoints[currentPoints.length - 1];
      newAnnotation.bounds = {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
      };
    }

    // Only add if meaningful size
    const isValidAnnotation =
      (activeTool === 'freehand' && currentPoints.length > 3) ||
      (activeTool === 'rect' && newAnnotation.bounds && newAnnotation.bounds.width > 5 && newAnnotation.bounds.height > 5) ||
      (activeTool === 'arrow' && currentPoints.length >= 2);

    if (isValidAnnotation) {
      onAnnotationsChange([...annotations, newAnnotation]);
      onSelectAnnotation(newAnnotation.id);
    }

    setIsDrawing(false);
    setCurrentPoints([]);
    setStartPoint(null);
  };

  // Handle click for text tool
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    if (activeTool === 'text') {
      const pos = getMousePos(e);
      const text = prompt('Enter annotation text:');
      if (text) {
        const newAnnotation: Annotation = {
          id: `annotation-${Date.now()}`,
          tool: 'text',
          points: [pos],
          color,
          strokeWidth,
          text,
        };
        onAnnotationsChange([...annotations, newAnnotation]);
        onSelectAnnotation(newAnnotation.id);
      }
    } else if (activeTool === 'select') {
      // Check if clicked on an annotation
      const pos = getMousePos(e);
      const clicked = annotations.find(a => isPointInAnnotation(pos, a));
      onSelectAnnotation(clicked?.id || null);
    }
  };

  // Check if point is inside annotation
  const isPointInAnnotation = (point: Point, annotation: Annotation): boolean => {
    if (annotation.bounds) {
      const { x, y, width: w, height: h } = annotation.bounds;
      return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h;
    }

    // For freehand/arrow, check proximity to any point
    return annotation.points.some(p =>
      Math.abs(p.x - point.x) < 10 && Math.abs(p.y - point.y) < 10
    );
  };

  // Handle key press for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        onAnnotationsChange(annotations.filter(a => a.id !== selectedAnnotationId));
        onSelectAnnotation(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, annotations, onAnnotationsChange, onSelectAnnotation]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 z-10"
      style={{
        cursor: activeTool === 'select' ? 'default' : 'crosshair',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    />
  );
}
