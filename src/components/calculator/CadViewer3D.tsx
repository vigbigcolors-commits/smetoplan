'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  RotateCcw,
  Eye,
  Layers,
  Box,
  Compass,
  Grid,
  Move3d,
  Hand,
  Maximize2,
  Minimize2,
  Printer,
  Camera,
} from 'lucide-react';
import type { DimensionState, RebarSpec, StructureType, UnitSystem } from '@/lib/types';

interface CadViewer3DProps {
  structureType: StructureType;
  dimensions: DimensionState;
  rebarSpec: RebarSpec;
  unitSystem: UnitSystem;
  soilPressureKpa: number;
}

export const CadViewer3D: React.FC<CadViewer3DProps> = ({
  structureType,
  dimensions,
  rebarSpec,
  unitSystem,
  soilPressureKpa,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'isometric' | 'top_wireframe' | 'cross_section'>('isometric');
  const [interactionMode, setInteractionMode] = useState<'orbit' | 'pan'>('orbit');
  const [rotationX, setRotationX] = useState<number>(35);
  const [rotationY, setRotationY] = useState<number>(-45);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragType, setDragType] = useState<'orbit' | 'pan' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showRebars, setShowRebars] = useState<boolean>(true);

  const unitLabel = unitSystem === 'imperial' ? 'фут' : 'м';

  // Attach non-passive native wheel listener to block page scrolling when zooming over canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      setZoom((prev) => Math.max(0.3, Math.min(4.0, prev + delta)));
    };

    canvas.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheelNative);
    };
  }, []);

  // Handle Mouse / Touch Dragging for 3D Orbiting and Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const isPan = interactionMode === 'pan' || e.button === 1 || e.button === 2 || e.shiftKey;
    setDragType(isPan ? 'pan' : 'orbit');
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragType) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (dragType === 'pan') {
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    } else {
      setRotationY((prev) => prev - dx * 0.5);
      setRotationX((prev) => Math.max(5, Math.min(85, prev + dy * 0.5)));
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const isPan = interactionMode === 'pan';
      setDragType(isPan ? 'pan' : 'orbit');
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      setDragType('pan');
      setIsDragging(true);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setDragStart({ x: midX, y: midY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragType) return;
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - dragStart.x;
      const dy = e.touches[0].clientY - dragStart.y;
      if (dragType === 'pan') {
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      } else {
        setRotationY((prev) => prev - dx * 0.5);
        setRotationX((prev) => Math.max(5, Math.min(85, prev + dy * 0.5)));
      }
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = midX - dragStart.x;
      const dy = midY - dragStart.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: midX, y: midY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const handleResetView = () => {
    setRotationX(35);
    setRotationY(-45);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setInteractionMode('orbit');
  };

  // Camera View Presets
  const applyPreset = (preset: 'iso' | 'top' | 'front' | 'side') => {
    setPan({ x: 0, y: 0 });
    setZoom(1.0);
    if (preset === 'iso') {
      setViewMode('isometric');
      setRotationX(35);
      setRotationY(-45);
    } else if (preset === 'top') {
      setViewMode('top_wireframe');
      setRotationX(85);
      setRotationY(0);
    } else if (preset === 'front') {
      setViewMode('isometric');
      setRotationX(12);
      setRotationY(0);
    } else if (preset === 'side') {
      setViewMode('isometric');
      setRotationX(12);
      setRotationY(-90);
    }
  };

  // Export / Print Canvas directly
  const handlePrintCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Чертеж CAD 3D - ${structureType.toUpperCase()}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0b132b; color: #fff; font-family: monospace; }
            img { max-width: 95vw; max-height: 85vh; border: 2px solid #38bdf8; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .header { margin-bottom: 12px; text-align: center; }
            h1 { margin: 0 0 4px 0; font-size: 20px; color: #38bdf8; }
            p { margin: 0; font-size: 12px; color: #94a3b8; }
            @media print {
              body { background: white; color: black; }
              img { border: 1px solid #000; }
              h1 { color: #000; }
              p { color: #333; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ИНЖЕНЕРНЫЙ ЧЕРТЕЖ 3D МОДЕЛИ</h1>
            <p>Объект: ${structureType.toUpperCase()} | Размеры: ${dimensions.length}x${dimensions.width}x${dimensions.depth} ${unitLabel}</p>
          </div>
          <img src="${dataUrl}" alt="CAD Drawing" />
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `cad-model-${structureType}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI crisp drawing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear with dark blueprint/CAD background
    ctx.fillStyle = '#0B132B'; // Rich Blueprint Navy
    ctx.fillRect(0, 0, width, height);

    // Draw CAD Grid Lines (offset by pan)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = Math.max(12, 24 * zoom);
    const offsetX = (pan.x % gridSize + gridSize) % gridSize;
    const offsetY = (pan.y % gridSize + gridSize) % gridSize;

    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Exact viewport center offset by user panning
    const centerX = width / 2 + pan.x;
    const centerY = height / 2 + pan.y;

    // Dimensions normalized for viewport (uniform XY scale — no shear)
    const scale =
      (Math.min(width, height) / (Math.max(dimensions.length, dimensions.width) * 1.8)) *
      zoom;
    const L = dimensions.length * scale;
    const W = dimensions.width * scale;
    // Keep thickness readable so the slab reads as a 3D box, not a flat skewed plate
    const H = Math.max(32, dimensions.depth * scale * 4);

    const halfL = L / 2;
    const halfW = W / 2;
    const halfH = H / 2;

    // Convert angles to radians
    const radX = (rotationX * Math.PI) / 180;
    const radY = (rotationY * Math.PI) / 180;

    /**
     * Rigid body orbit (Y then X) + orthographic projection.
     * Opposite edges of a rectangle stay parallel — a parallelogram on screen
     * is correct, not a bug. Do not apply non-uniform screen scale.
     */
    const project3D = (x: number, y: number, z: number) => {
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);

      // Rotate around Y (yaw)
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // Rotate around X (pitch)
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      return {
        px: centerX + x1,
        py: centerY - y2,
        depth: z2,
      };
    };

    // Draw coordinate axis crosshairs at bottom corner of object
    const origin = project3D(-halfL * 1.15, -halfH, -halfW * 1.15);
    const axisX = project3D(-halfL * 1.15 + L * 0.25, -halfH, -halfW * 1.15);
    const axisY = project3D(-halfL * 1.15, -halfH + H * 0.6, -halfW * 1.15);
    const axisZ = project3D(-halfL * 1.15, -halfH, -halfW * 1.15 + W * 0.25);

    ctx.lineWidth = 1.5;
    // X-axis Red
    ctx.strokeStyle = '#EF4444';
    ctx.beginPath(); ctx.moveTo(origin.px, origin.py); ctx.lineTo(axisX.px, axisX.py); ctx.stroke();
    // Y-axis Green
    ctx.strokeStyle = '#22C55E';
    ctx.beginPath(); ctx.moveTo(origin.px, origin.py); ctx.lineTo(axisY.px, axisY.py); ctx.stroke();
    // Z-axis Blue
    ctx.strokeStyle = '#3B82F6';
    ctx.beginPath(); ctx.moveTo(origin.px, origin.py); ctx.lineTo(axisZ.px, axisZ.py); ctx.stroke();

    if (viewMode === 'top_wireframe') {
      // 2D Top View Plan
      const marginX = (width - L) / 2 + pan.x;
      const marginY = (height - W) / 2 + pan.y;

      // Concrete outline
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(marginX, marginY, L, W);
      ctx.strokeRect(marginX, marginY, L, W);

      // Rebar grid lines
      if (showRebars) {
        ctx.strokeStyle = '#FF5A00'; // Safety Orange
        ctx.lineWidth = 1;
        const step = Math.max(15, (rebarSpec.spacingMm / 200) * 20 * zoom);
        for (let x = marginX + step; x < marginX + L; x += step) {
          ctx.beginPath(); ctx.moveTo(x, marginY); ctx.lineTo(x, marginY + W); ctx.stroke();
        }
        for (let y = marginY + step; y < marginY + W; y += step) {
          ctx.beginPath(); ctx.moveTo(marginX, y); ctx.lineTo(marginX + L, y); ctx.stroke();
        }
      }

      // 2D Dimensions
      if (showDimensions) {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`L = ${dimensions.length.toFixed(2)} ${unitLabel}`, marginX + L / 2, marginY - 10);
        ctx.fillText(`W = ${dimensions.width.toFixed(2)} ${unitLabel}`, marginX - 25, marginY + W / 2);
      }
      return;
    }

    if (viewMode === 'cross_section') {
      // Cross-Section Cut
      const secW = width * 0.7 * Math.min(1.5, zoom);
      const secH = Math.max(60, dimensions.depth * 180 * Math.min(1.5, zoom));
      const startX = (width - secW) / 2 + pan.x;
      const startY = height / 2 - secH / 2 + pan.y;

      // Soil Layer
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(startX - 20, startY + secH, secW + 40, 60);
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText('ГРУНТОВОЕ ОСНОВАНИЕ (ДАВЛЕНИЕ ~' + soilPressureKpa + ' кПа)', startX, startY + secH + 35);

      // Gravel/Sand Bed
      ctx.fillStyle = '#334155';
      ctx.fillRect(startX, startY + secH - 12, secW, 12);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(startX, startY + secH - 12, secW, 12);

      // Concrete Cross Section
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.fillRect(startX, startY, secW, secH);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, secW, secH);

      // Rebar circles in cross section
      if (showRebars) {
        const dots = 12;
        ctx.fillStyle = '#FF5A00';
        for (let i = 0; i <= dots; i++) {
          const x = startX + 20 + (i * (secW - 40)) / dots;
          // Top layer
          ctx.beginPath(); ctx.arc(x, startY + 15, (rebarSpec.diameterMm / 2) * zoom, 0, Math.PI * 2); ctx.fill();
          // Bottom layer
          if (rebarSpec.layers > 1) {
            ctx.beginPath(); ctx.arc(x, startY + secH - 15, (rebarSpec.diameterMm / 2) * zoom, 0, Math.PI * 2); ctx.fill();
          }
        }
        // Stirrups wire frame
        ctx.strokeStyle = '#FF5A00';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(startX + 15, startY + 10, secW - 30, secH - 20);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.fillText(`ПОПЕРЕЧНЫЙ СРЕЗ: ТОЛЩИНА H = ${dimensions.depth.toFixed(2)} ${unitLabel}`, startX, startY - 15);
      return;
    }

    // --- 3D Isometric / Stress Heatmap Rendering ---
    // 8 Corner Vertices of Concrete Block centered at origin (0, 0, 0)
    const vertices = [
      project3D(-halfL, -halfH, -halfW),       // 0: Bottom-Back-Left
      project3D(halfL, -halfH, -halfW),        // 1: Bottom-Back-Right
      project3D(halfL, -halfH, halfW),         // 2: Bottom-Front-Right
      project3D(-halfL, -halfH, halfW),        // 3: Bottom-Front-Left
      project3D(-halfL, halfH, -halfW),        // 4: Top-Back-Left
      project3D(halfL, halfH, -halfW),         // 5: Top-Back-Right
      project3D(halfL, halfH, halfW),          // 6: Top-Front-Right
      project3D(-halfL, halfH, halfW),         // 7: Top-Front-Left
    ];

    // Faces definition
    type Face = {
      name: string;
      indices: number[];
      color: string;
      avgDepth: number;
    };
    const faces: Face[] = [
      { name: 'bottom', indices: [0, 1, 2, 3], color: 'rgba(15, 23, 42, 0.85)', avgDepth: 0 },
      { name: 'back', indices: [0, 1, 5, 4], color: 'rgba(30, 41, 59, 0.65)', avgDepth: 0 },
      { name: 'left', indices: [0, 3, 7, 4], color: 'rgba(51, 65, 85, 0.65)', avgDepth: 0 },
      { name: 'right', indices: [1, 2, 6, 5], color: 'rgba(71, 85, 105, 0.65)', avgDepth: 0 },
      { name: 'front', indices: [3, 2, 6, 7], color: 'rgba(100, 116, 139, 0.45)', avgDepth: 0 },
      { name: 'top', indices: [4, 5, 6, 7], color: 'rgba(56, 189, 248, 0.28)', avgDepth: 0 },
    ];

    faces.forEach((f) => {
      f.avgDepth = f.indices.reduce((sum, idx) => sum + vertices[idx].depth, 0) / 4;
    });
    faces.sort((a, b) => a.avgDepth - b.avgDepth);

    // Draw Ground Grid Shadow under slab
    ctx.beginPath();
    const g0 = project3D(-halfL * 1.25, -halfH - 3, -halfW * 1.25);
    const g1 = project3D(halfL * 1.25, -halfH - 3, -halfW * 1.25);
    const g2 = project3D(halfL * 1.25, -halfH - 3, halfW * 1.25);
    const g3 = project3D(-halfL * 1.25, -halfH - 3, halfW * 1.25);
    ctx.moveTo(g0.px, g0.py); ctx.lineTo(g1.px, g1.py); ctx.lineTo(g2.px, g2.py); ctx.lineTo(g3.px, g3.py);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.fill();

    // Draw 3D Rebar Grid BEFORE front faces so rebar sits INSIDE translucent glass concrete
    if (showRebars) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FF5A00'; // Glowing Safety Orange

      const rebarMargin = Math.min(10, H * 0.2);
      const rebarYBottom = -halfH + rebarMargin;
      const rebarYTop = halfH - rebarMargin;

      const gridStepX = Math.max(12, (rebarSpec.spacingMm / 200) * 24);
      const gridStepZ = Math.max(12, (rebarSpec.spacingMm / 200) * 24);

      // Bottom Rebar Layer
      for (let x = -halfL + 8; x <= halfL - 8; x += gridStepX) {
        const p1 = project3D(x, rebarYBottom, -halfW + 8);
        const p2 = project3D(x, rebarYBottom, halfW - 8);
        ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
      }
      for (let z = -halfW + 8; z <= halfW - 8; z += gridStepZ) {
        const p1 = project3D(-halfL + 8, rebarYBottom, z);
        const p2 = project3D(halfL - 8, rebarYBottom, z);
        ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
      }

      // Top Rebar Layer (if double mesh)
      if (rebarSpec.layers > 1) {
        for (let x = -halfL + 8; x <= halfL - 8; x += gridStepX) {
          const p1 = project3D(x, rebarYTop, -halfW + 8);
          const p2 = project3D(x, rebarYTop, halfW - 8);
          ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
        }
        for (let z = -halfW + 8; z <= halfW - 8; z += gridStepZ) {
          const p1 = project3D(-halfL + 8, rebarYTop, z);
          const p2 = project3D(halfL - 8, rebarYTop, z);
          ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
        }

        // Vertical stirrup pins connecting top and bottom layers
        ctx.strokeStyle = 'rgba(255, 90, 0, 0.7)';
        ctx.lineWidth = 1;
        for (let x = -halfL + 12; x <= halfL - 12; x += gridStepX * 2) {
          for (let z = -halfW + 12; z <= halfW - 12; z += gridStepZ * 2) {
            const pb = project3D(x, rebarYBottom, z);
            const pt = project3D(x, rebarYTop, z);
            ctx.beginPath(); ctx.moveTo(pb.px, pb.py); ctx.lineTo(pt.px, pt.py); ctx.stroke();
          }
        }
      }
    }

    // Render 3D Faces
    faces.forEach((f) => {
      ctx.beginPath();
      const p0 = vertices[f.indices[0]];
      ctx.moveTo(p0.px, p0.py);
      for (let i = 1; i < f.indices.length; i++) {
        const p = vertices[f.indices[i]];
        ctx.lineTo(p.px, p.py);
      }
      ctx.closePath();
      ctx.fillStyle = f.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Sharp architectural wireframe — all 12 edges once (silhouette reads as a box)
    {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ];
      ctx.lineJoin = 'round';
      edges.forEach(([a, b]) => {
        const pa = vertices[a];
        const pb = vertices[b];
        const midDepth = (pa.depth + pb.depth) / 2;
        ctx.beginPath();
        ctx.moveTo(pa.px, pa.py);
        ctx.lineTo(pb.px, pb.py);
        ctx.strokeStyle =
          midDepth > 0 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(125, 211, 252, 0.95)';
        ctx.lineWidth = midDepth > 0 ? 1 : 1.75;
        ctx.stroke();
      });
    }

    // Dimension Annotations — offset perpendicular to edge in screen space
    if (showDimensions) {
      const annotateEdge = (
        a: { px: number; py: number },
        b: { px: number; py: number },
        label: string,
        outwardSign: number
      ) => {
        const dx = b.px - a.px;
        const dy = b.py - a.py;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 16 * outwardSign;
        const ny = (dx / len) * 16 * outwardSign;
        ctx.strokeStyle = '#7DD3FC';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.px + nx, a.py + ny);
        ctx.lineTo(b.px + nx, b.py + ny);
        ctx.stroke();
        // end ticks
        ctx.beginPath();
        ctx.moveTo(a.px + nx * 0.4, a.py + ny * 0.4);
        ctx.lineTo(a.px + nx, a.py + ny);
        ctx.moveTo(b.px + nx * 0.4, b.py + ny * 0.4);
        ctx.lineTo(b.px + nx, b.py + ny);
        ctx.stroke();
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(label, (a.px + b.px) / 2 + nx * 1.35, (a.py + b.py) / 2 + ny * 1.35);
      };

      annotateEdge(
        vertices[3],
        vertices[2],
        `L = ${dimensions.length.toFixed(2)} ${unitLabel}`,
        1
      );
      annotateEdge(
        vertices[2],
        vertices[1],
        `W = ${dimensions.width.toFixed(2)} ${unitLabel}`,
        1
      );
      annotateEdge(
        vertices[3],
        vertices[7],
        `H = ${dimensions.depth.toFixed(2)} ${unitLabel}`,
        -1
      );
    }
  }, [
    dimensions,
    rebarSpec,
    rotationX,
    rotationY,
    zoom,
    pan,
    viewMode,
    showDimensions,
    showRebars,
    unitSystem,
    soilPressureKpa,
    unitLabel,
  ]);

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#0B132B] overflow-hidden flex flex-col justify-between select-none'
          : 'relative w-full h-[480px] bg-[#0B132B] rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col justify-between select-none'
      }`}
    >
      {/* Top CAD Viewport Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/60 text-xs text-slate-200 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono font-semibold text-sky-300 uppercase tracking-wider">
            <Move3d className="w-4 h-4" />
            3D / чертёж
          </span>
          <span className="hidden sm:inline-block bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono text-[10px]">
            {structureType.toUpperCase()}
          </span>
        </div>

        {/* View Modes */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
          <button
            onClick={() => setViewMode('isometric')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
              viewMode === 'isometric'
                ? 'bg-[#1F5A8E] text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="3D Изометрический вид"
          >
            <Box className="w-3.5 h-3.5" />
            3D Вид
          </button>
          <button
            onClick={() => setViewMode('top_wireframe')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
              viewMode === 'top_wireframe'
                ? 'bg-[#1F5A8E] text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="2D Чертеж и план сверху"
          >
            <Grid className="w-3.5 h-3.5" />
            2D План
          </button>
          <button
            onClick={() => setViewMode('cross_section')}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
              viewMode === 'cross_section'
                ? 'bg-[#1F5A8E] text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Поперечный разрез"
          >
            <Layers className="w-3.5 h-3.5" />
            Разрез
          </button>
        </div>

        {/* Visibility Toggles & Export Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`p-1.5 rounded transition cursor-pointer ${
              showDimensions ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Размеры"
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRebars(!showRebars)}
            className={`p-1.5 rounded transition cursor-pointer ${
              showRebars ? 'bg-slate-800 text-orange-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Арматура"
          >
            <Eye className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-700 my-auto mx-1" />

          {/* Download PNG Snapshot */}
          <button
            onClick={handleDownloadSnapshot}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition cursor-pointer"
            title="Сохранить снимoк чертежа (PNG)"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Print Only Canvas */}
          <button
            onClick={handlePrintCanvas}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition cursor-pointer"
            title="Печать 3D модели / чертежа"
          >
            <Printer className="w-4 h-4 text-sky-400" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded transition cursor-pointer"
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full touch-none ${
          interactionMode === 'pan'
            ? 'cursor-grab active:cursor-grabbing'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300 font-mono shadow-lg">
        <div className="flex items-center gap-2">
          {/* Tool Mode Buttons (Rotate / Pan) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setInteractionMode('orbit')}
              className={`px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold transition cursor-pointer ${
                interactionMode === 'orbit'
                  ? 'bg-[#1F5A8E] text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Режим Вращения (Зажмите ЛКМ)"
            >
              <Move3d className="w-3 h-3" />
              Вращение
            </button>
            <button
              onClick={() => setInteractionMode('pan')}
              className={`px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold transition cursor-pointer ${
                interactionMode === 'pan'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Режим Сдвига (Зажмите ЛКМ или ПКМ)"
            >
              <Hand className="w-3 h-3" />
              Pan (Сдвиг)
            </button>
          </div>

          {/* Quick Camera Angles / Presets */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px]">
            <button
              onClick={() => applyPreset('iso')}
              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
              title="Изометрия"
            >
              3D
            </button>
            <button
              onClick={() => applyPreset('top')}
              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
              title="Вид сверху"
            >
              Сверху
            </button>
            <button
              onClick={() => applyPreset('front')}
              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
              title="Вид спереди"
            >
              Спереди
            </button>
            <button
              onClick={() => applyPreset('side')}
              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
              title="Вид сбоку"
            >
              Сбоку
            </button>
          </div>

          <span className="hidden lg:inline text-[10px] text-slate-400">
            | ПКМ / Shift = Pan | Колесо = Масштаб
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetView}
            className="px-2 py-1 rounded text-[10px] font-semibold uppercase transition cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1"
            title="Сбросить вид"
          >
            <RotateCcw className="w-3 h-3" />
            Сброс
          </button>
        </div>
      </div>
    </div>
  );
};

