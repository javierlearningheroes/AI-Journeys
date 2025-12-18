
import React, { useEffect, useRef, useState } from "react";

interface IkigaiDiagramProps {
  activeSection: string;
  onSectionClick: (section: string) => void;
}

interface Circle {
  id: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
  label: string;
}

export const IkigaiDiagram: React.FC<IkigaiDiagramProps> = ({ activeSection, onSectionClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState({ text: "", x: 0, y: 0, visible: false });
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  const [baseImageData, setBaseImageData] = useState<ImageData | null>(null);

  const circles: Circle[] = [
    { id: "love", cx: 200, cy: 200, r: 200, color: "rgba(255, 111, 145, 0.6)", label: "Lo que amas" },
    { id: "skill", cx: 400, cy: 200, r: 200, color: "rgba(77, 171, 247, 0.6)", label: "En lo que eres bueno" },
    { id: "need", cx: 200, cy: 400, r: 200, color: "rgba(64, 192, 87, 0.6)", label: "Lo que el mundo necesita" },
    { id: "money", cx: 400, cy: 400, r: 200, color: "rgba(255, 212, 59, 0.6)", label: "Por lo que te pueden pagar" }
  ];

  const idOrder = ['love', 'skill', 'need', 'money'];

  const sectionLabels: Record<string, string> = {
    "basic": "Perfil Básico",
    "love": "Lo que amas",
    "skill": "En lo que eres bueno",
    "need": "Lo que el mundo necesita",
    "money": "Por lo que te pueden pagar",
    "love-skill": "Pasión",
    "love-need": "Misión",
    "skill-money": "Profesión",
    "need-money": "Vocación",
    "love-skill-need": "Personalidad",
    "love-skill-money": "Rareza",
    "skill-need-money": "Arquetipo",
    "love-need-money": "Carrera",
    "love-skill-need-money": "IKIGAI"
  };

  const createBaseDiagram = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, width, height);
    circles.forEach((circle) => {
      ctx.beginPath();
      const scaleW = width / 600;
      const scaleH = height / 600;
      ctx.arc(circle.cx * scaleW, circle.cy * scaleH, circle.r * Math.min(scaleW, scaleH), 0, 2 * Math.PI);
      ctx.fillStyle = circle.color;
      ctx.fill();
    });
    return ctx.getImageData(0, 0, width * dpr, height * dpr);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
    const baseImg = createBaseDiagram(ctx, canvasSize.width, canvasSize.height);
    setBaseImageData(baseImg);
  }, [canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Use contentRect to exclude padding and ensure the diagram fits
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height, 600);
        if (size > 0) {
          setCanvasSize({ width: size, height: size });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImageData) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    if (activeSection === 'basic' || !activeSection) {
      ctx.putImageData(baseImageData, 0, 0);
      return;
    }

    const width = canvasSize.width;
    const height = canvasSize.height;
    ctx.putImageData(baseImageData, 0, 0);

    const imgData = ctx.getImageData(0, 0, width * dpr, height * dpr);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i + 3] = Math.floor(data[i + 3] * 0.3);
    }
    ctx.putImageData(imgData, 0, 0);

    if (activeSection.includes('-')) {
      highlightIntersection(ctx, width, height, activeSection);
    } else {
      const circle = circles.find(c => c.id === activeSection);
      if (circle) highlightCircle(ctx, width, height, circle);
    }
  }, [activeSection, baseImageData, canvasSize]);

  const highlightCircle = (ctx: CanvasRenderingContext2D, width: number, height: number, circle: Circle) => {
    const dpr = window.devicePixelRatio || 1;
    const scaleW = width / 600;
    const scaleH = height / 600;
    const imageData = ctx.getImageData(0, 0, width * dpr, height * dpr);
    const data = imageData.data;
    const radius = circle.r * Math.min(scaleW, scaleH);
    const physicalWidth = width * dpr;
    const physicalHeight = height * dpr;

    for (let y = 0; y < physicalHeight; y++) {
      for (let x = 0; x < physicalWidth; x++) {
        const logicalX = x / dpr;
        const logicalY = y / dpr;
        const distanceToSelected = Math.hypot(logicalX - circle.cx * scaleW, logicalY - circle.cy * scaleH);

        if (distanceToSelected <= radius) {
          let isInOtherCircle = false;
          for (const otherCircle of circles) {
            if (otherCircle.id === circle.id) continue;
            if (Math.hypot(logicalX - otherCircle.cx * scaleW, logicalY - otherCircle.cy * scaleH) <= otherCircle.r * Math.min(scaleW, scaleH)) {
              isInOtherCircle = true;
              break;
            }
          }
          if (!isInOtherCircle) {
            const idx = (y * physicalWidth + x) * 4;
            if (data[idx + 3] > 0) data[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const highlightIntersection = (ctx: CanvasRenderingContext2D, width: number, height: number, intersection: string) => {
    const dpr = window.devicePixelRatio || 1;
    const intersectionIds = intersection.split('-');
    const intersectionCircles = circles.filter(c => intersectionIds.includes(c.id));
    const scaleW = width / 600;
    const scaleH = height / 600;
    const imageData = ctx.getImageData(0, 0, width * dpr, height * dpr);
    const data = imageData.data;
    const physicalWidth = width * dpr;
    const physicalHeight = height * dpr;

    for (let y = 0; y < physicalHeight; y++) {
      for (let x = 0; x < physicalWidth; x++) {
        const logicalX = x / dpr;
        const logicalY = y / dpr;
        let inAllIntersectionCircles = true;
        let inOtherCircle = false;

        for (const circle of intersectionCircles) {
          if (Math.hypot(logicalX - circle.cx * scaleW, logicalY - circle.cy * scaleH) > circle.r * Math.min(scaleW, scaleH)) {
            inAllIntersectionCircles = false;
            break;
          }
        }

        if (inAllIntersectionCircles) {
          for (const circle of circles) {
            if (intersectionIds.includes(circle.id)) continue;
            if (Math.hypot(logicalX - circle.cx * scaleW, logicalY - circle.cy * scaleH) <= circle.r * Math.min(scaleW, scaleH)) {
              inOtherCircle = true;
              break;
            }
          }
          if (!inOtherCircle || intersectionIds.length === 4) {
            const idx = (y * physicalWidth + x) * 4;
            if (data[idx + 3] > 0) data[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const getSectionAt = (x: number, y: number): string => {
    if (!canvasRef.current) return 'basic';
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const canvasX = (x - rect.left) * scaleX;
    const canvasY = (y - rect.top) * scaleY;
    const containingCircles = circles.filter(circle => {
      const distance = Math.hypot(canvasX - circle.cx * (canvasSize.width / 600), canvasY - circle.cy * (canvasSize.height / 600));
      return distance <= circle.r * Math.min(canvasSize.width / 600, canvasSize.height / 600);
    });
    if (containingCircles.length === 0) return 'basic';
    const sectionIds = containingCircles.map(c => c.id).sort((a, b) => idOrder.indexOf(a) - idOrder.indexOf(b));
    return sectionIds.join('-');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const section = getSectionAt(e.clientX, e.clientY);
    const tooltipText = sectionLabels[section] || "Volver al perfil";
    setTooltip({ text: tooltipText, x: e.clientX, y: e.clientY, visible: true });
    e.currentTarget.style.cursor = 'pointer';
  };

  const handleMouseLeave = () => setTooltip(prev => ({ ...prev, visible: false }));
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => onSectionClick(getSectionAt(e.clientX, e.clientY));

  return (
    <div className="ikigai-container relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="ikigai-canvas max-w-full"
      />
      {tooltip.visible && (
        <div
          className="ikigai-tooltip animate-in fade-in duration-200"
          style={{
            position: "fixed",
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            background: "rgba(15, 23, 42, 0.95)",
            // Corrected backdropBlur to backdropFilter as backdropBlur is not a standard React CSS property
            backdropFilter: "blur(4px)",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            zIndex: 100,
            pointerEvents: "none",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
