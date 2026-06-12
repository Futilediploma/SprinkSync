import React, { useCallback, useEffect, useRef, useState } from "react";
import { exportPipeSketchPdf } from "./exportPdf";
import { ThreadedFittingRenderer } from "./threadedFittingRenderer";

import type { WeldedOutlet } from "./WeldedOutletForm";
import type { ThreadedFitting } from "../types";

interface PipeSketchProps {
  pipeType: string;
  pipetag: string;
  qty?: number;
  length: number;
  diameter: number | string;
  fittingsEndPipeLabel1: string;
  fittingsEndPipeLabel2: string;
  threadedFittings?: ThreadedFitting[];
  outlets?: WeldedOutlet[];
  showExportButton?: boolean;
  hideSummaryText?: boolean;
  editableOutlets?: boolean;
  editableLength?: boolean;
  minLength?: number;
  onOutletLocationPreview?: (index: number, location: number) => void;
  onOutletLocationCommit?: (index: number, location: number) => void;
  onLengthPreview?: (length: number) => void;
  onLengthCommit?: (length: number) => void;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

function formatFabDimension(totalInches: number): string {
  if (!Number.isFinite(totalInches)) return "0-0";

  const feet = Math.floor(totalInches / 12);
  const inchesOnly = totalInches - feet * 12;
  const eighths = Math.round(inchesOnly * 8);
  const wholeInches = Math.floor(eighths / 8);
  const fracNum = eighths % 8;

  if (fracNum === 0) {
    return `${feet}-${wholeInches}`;
  }

  const divisor = gcd(fracNum, 8);
  const num = fracNum / divisor;
  const den = 8 / divisor;

  return `${feet}-${wholeInches} ${num}/${den}`;
}

function formatLengthLabel(totalInches: number): string {
  if (!Number.isFinite(totalInches)) return "0'-0\"";

  const feet = Math.floor(totalInches / 12);
  const inchesOnly = totalInches - feet * 12;
  const eighths = Math.round(inchesOnly * 8);
  const wholeInches = Math.floor(eighths / 8);
  const fracNum = eighths % 8;

  if (fracNum === 0) {
    return `${feet}'-${wholeInches}"`;
  }

  const divisor = gcd(fracNum, 8);
  const num = fracNum / divisor;
  const den = 8 / divisor;

  return `${feet}'-${wholeInches} ${num}/${den}"`;
}

function normalizePipeType(pipeType: string): string {
  const cleaned = pipeType.replace(/_/g, " ").toUpperCase();
  if (cleaned.startsWith("SCHEDULE ")) {
    return cleaned.replace("SCHEDULE", "SCH");
  }
  return cleaned;
}

function pipeDescription(diameter: number | string, pipeType: string): string {
  return `${diameter} DOM BLK ${normalizePipeType(pipeType)}`;
}

function isThreadedPipeType(pipeType: string): boolean {
  return pipeType.trim().toLowerCase() === "threaded pipe";
}

function threadedPipeDescription(diameter: number | string): string {
  return `${diameter} THREADED PIPE`;
}

function endPrepCode(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("cut groov")) return "CC";
  if (normalized.includes("roll groov")) return "GRV";
  if (normalized.includes("groov")) return "GRV";
  if (normalized.includes("thread")) return "T";
  if (normalized.includes("weld")) return "W";
  return "P";
}

function threadedEndCode(label: string): string {
  const normalized = label.toLowerCase();
  if (!normalized.trim() || normalized === "none") return "THD";
  if (normalized.includes("90") || normalized.includes("elbow")) return "90";
  if (normalized.includes("tee")) return "TEE";
  if (normalized.includes("cap")) return "CAP";
  if (normalized.includes("coupling")) return "CPL";
  if (normalized.includes("union")) return "UN";
  if (normalized.includes("plug")) return "PLG";
  return "FIT";
}

function fittingKind(label: string): "none" | "elbow" | "tee" | "cap" | "coupling" | "union" | "plug" | "generic" {
  const normalized = label.toLowerCase().trim();
  if (!normalized || normalized === "none") return "none";
  if (normalized.includes("90") || normalized.includes("elbow")) return "elbow";
  if (normalized.includes("tee")) return "tee";
  if (normalized.includes("cap")) return "cap";
  if (normalized.includes("coupling")) return "coupling";
  if (normalized.includes("union")) return "union";
  if (normalized.includes("plug")) return "plug";
  return "generic";
}

function fittingDirection(label: string): "up" | "down" {
  const normalized = label.toLowerCase();
  if (normalized.includes("down")) return "down";
  return "up";
}

function fallbackThreadedFittingFromLabel(label: string, location: number, diameter: number | string): ThreadedFitting | null {
  const kind = fittingKind(label);
  if (kind === "none") return null;

  const type = (() => {
    if (kind === "elbow") return "threadedelbow90";
    if (kind === "tee") return "threadedtee";
    if (kind === "cap") return "threadedcap";
    if (kind === "coupling") return "threadedcoupling";
    if (kind === "union") return "threadedunion";
    if (kind === "plug") return "threadedplug";
    return "threadedelbow90";
  })();

  return {
    type,
    location,
    direction: kind === "elbow" || kind === "tee" ? fittingDirection(label) : undefined,
    size: String(diameter),
  };
}

function outletDirectionVector(direction: string): { dx: number; dy: number } {
  switch (String(direction)) {
    case "1":
      return { dx: 0, dy: -1 };
    case "2":
      return { dx: 0.72, dy: -0.72 };
    case "3":
      return { dx: 0, dy: 1 };
    case "4":
      return { dx: -0.72, dy: 0.72 };
    case "5":
      return { dx: 0.72, dy: -0.72 };
    case "6":
      return { dx: 0.72, dy: 0.72 };
    case "7":
      return { dx: -0.72, dy: 0.72 };
    case "8":
      return { dx: -0.72, dy: -0.72 };
    default:
      return { dx: 0, dy: -1 };
  }
}

function parseNominalInches(value: number | string): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const cleaned = String(value)
    .replace(/"/g, "")
    .trim();

  if (!cleaned) return 0;

  const mixed = cleaned.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    return denominator ? whole + numerator / denominator : whole;
  }

  const fraction = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator ? numerator / denominator : 0;
  }

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : 0;
}

function outletScale(outletSize: string, mainDiameter: number | string): number {
  const outletDiameter = parseNominalInches(outletSize);
  const pipeDiameter = parseNominalInches(mainDiameter);

  if (!outletDiameter || !pipeDiameter) return 1;

  const relative = outletDiameter / pipeDiameter;
  return Math.max(0.62, Math.min(1.65, 0.55 + relative * 1.45));
}

function snapToEighth(inches: number): number {
  return Math.round(inches * 8) / 8;
}

function clampPipeLength(length: number, minLength: number): number {
  const nextMin = Math.max(1, snapToEighth(minLength));
  return Math.max(nextMin, snapToEighth(length));
}

function getRenderedPipeLength(length: number, availableLength: number): number {
  const fullStickLength = 252;
  const minVisibleLength = 72;
  const referenceLength = Math.max(fullStickLength, length, 1);
  const proportionalLength = (Math.max(length, 1) / referenceLength) * availableLength;

  return Math.max(minVisibleLength, Math.min(availableLength, proportionalLength));
}

const PipeSketch: React.FC<PipeSketchProps> = ({
  pipeType,
  pipetag,
  qty = 1,
  length,
  diameter,
  fittingsEndPipeLabel1,
  fittingsEndPipeLabel2,
  threadedFittings = [],
  outlets = [],
  showExportButton = false,
  hideSummaryText = false,
  editableOutlets = false,
  editableLength = false,
  minLength = 1,
  onOutletLocationPreview,
  onOutletLocationCommit,
  onLengthPreview,
  onLengthCommit,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const activeDragRef = useRef<{
    outletIndex: number;
    mode: "pointer" | "mouse" | "touch";
    pointerId?: number;
    lastClientX: number;
  } | null>(null);
  const activeLengthDragRef = useRef<{
    end: "left" | "right";
    mode: "pointer" | "mouse" | "touch";
    pointerId?: number;
    startClientX: number;
    lastClientX: number;
    startLength: number;
    startRenderedPipeLength: number;
  } | null>(null);
  const [draggingOutletIndex, setDraggingOutletIndex] = useState<number | null>(null);
  const [draggingPipeEnd, setDraggingPipeEnd] = useState<"left" | "right" | null>(null);
  const [hoveredOutletIndex, setHoveredOutletIndex] = useState<number | null>(null);
  const [hoveredPipeEnd, setHoveredPipeEnd] = useState<"left" | "right" | null>(null);
  const width = 480;
  const height = 275;
  const margin = 24;
  const dimensionY = 98;
  const pipeY = 186;
  const pipeHeight = 18;
  const pipeLength = width - 2 * margin;
  const isThreadedPipeSketch = isThreadedPipeType(pipeType);
  const rawRenderedPipeLength = getRenderedPipeLength(length, pipeLength);
  const rawRenderedMargin = (width - rawRenderedPipeLength) / 2;
  const renderedMargin = isThreadedPipeSketch ? Math.max(rawRenderedMargin, 52) : rawRenderedMargin;
  const renderedPipeLength = width - 2 * renderedMargin;
  const sortedOutlets = outlets
    .map((outlet, originalIndex) => ({ outlet, originalIndex }))
    .sort((a, b) => Number(a.outlet.location) - Number(b.outlet.location));
  const sketchOutlets = isThreadedPipeSketch ? [] : sortedOutlets;
  const segmentPositions = [0, ...sketchOutlets.map(o => Number(o.outlet.location)), length];
  const segmentLengths = segmentPositions.slice(0, -1).map((start, idx) => segmentPositions[idx + 1] - start);

  const xAt = (inches: number) => renderedMargin + Math.max(0, Math.min(inches / Math.max(length, 1), 1)) * renderedPipeLength;
  const inchesAtClientX = useCallback((clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return 0;

    const rect = svg.getBoundingClientRect();
    const viewBoxX = ((clientX - rect.left) / Math.max(rect.width, 1)) * width;
    const rawInches = ((viewBoxX - renderedMargin) / renderedPipeLength) * Math.max(length, 0);
    const clamped = Math.max(0, Math.min(rawInches, Math.max(length, 0)));
    return snapToEighth(clamped);
  }, [length, renderedMargin, renderedPipeLength]);
  const segmentCenters = segmentPositions.slice(0, -1).map((start, idx) => (xAt(start) + xAt(segmentPositions[idx + 1])) / 2);

  const leftPrepCode = isThreadedPipeSketch ? threadedEndCode(fittingsEndPipeLabel1) : endPrepCode(fittingsEndPipeLabel1);
  const rightPrepCode = isThreadedPipeSketch ? threadedEndCode(fittingsEndPipeLabel2) : endPrepCode(fittingsEndPipeLabel2);
  const sketchPipeDescription = isThreadedPipeSketch ? threadedPipeDescription(diameter) : pipeDescription(diameter, pipeType);
  const lengthHandleY = pipeY;
  const lengthHandleTopY = isThreadedPipeSketch ? pipeY + 1 : lengthHandleY - 12;
  const lengthHandleBottomY = isThreadedPipeSketch ? pipeY + 17 : lengthHandleY + pipeHeight + 12;
  const canDragOutlets = editableOutlets && length > 0 && !isThreadedPipeSketch;
  const canDragLength = editableLength && length > 0;
  const renderedThreadedFittings = isThreadedPipeSketch
    ? threadedFittings.length > 0
      ? threadedFittings
      : [
          fallbackThreadedFittingFromLabel(fittingsEndPipeLabel1, 0, diameter),
          fallbackThreadedFittingFromLabel(fittingsEndPipeLabel2, length, diameter),
        ].filter((fitting): fitting is ThreadedFitting => Boolean(fitting))
    : [];

  const lengthAtClientX = useCallback((clientX: number) => {
    const activeDrag = activeLengthDragRef.current;
    const svg = svgRef.current;
    if (!activeDrag || !svg) return clampPipeLength(length, minLength);

    const rect = svg.getBoundingClientRect();
    const viewBoxDelta = ((clientX - activeDrag.startClientX) / Math.max(rect.width, 1)) * width;
    const inchesDelta = (viewBoxDelta / Math.max(activeDrag.startRenderedPipeLength, 1)) * Math.max(activeDrag.startLength, 1);
    const nextLength = activeDrag.end === "right"
      ? activeDrag.startLength + inchesDelta
      : activeDrag.startLength - inchesDelta;

    return clampPipeLength(nextLength, minLength);
  }, [length, minLength]);

  const previewLengthDragAt = useCallback((clientX: number) => {
    const activeDrag = activeLengthDragRef.current;
    if (!canDragLength || !activeDrag) return;

    activeDrag.lastClientX = clientX;
    onLengthPreview?.(lengthAtClientX(clientX));
  }, [canDragLength, lengthAtClientX, onLengthPreview]);

  const finishLengthDragAt = useCallback((clientX: number) => {
    const activeDrag = activeLengthDragRef.current;
    if (!canDragLength || !activeDrag) return;

    const nextLength = lengthAtClientX(clientX);
    const svg = svgRef.current;
    if (
      activeDrag.mode === "pointer" &&
      activeDrag.pointerId !== undefined &&
      svg?.hasPointerCapture(activeDrag.pointerId)
    ) {
      svg.releasePointerCapture(activeDrag.pointerId);
    }

    activeLengthDragRef.current = null;
    setDraggingPipeEnd(null);
    onLengthPreview?.(nextLength);
    onLengthCommit?.(nextLength);
  }, [canDragLength, lengthAtClientX, onLengthCommit, onLengthPreview]);

  const cancelLengthDrag = useCallback(() => {
    const activeDrag = activeLengthDragRef.current;
    if (!activeDrag) return;

    const svg = svgRef.current;
    if (
      activeDrag.mode === "pointer" &&
      activeDrag.pointerId !== undefined &&
      svg?.hasPointerCapture(activeDrag.pointerId)
    ) {
      svg.releasePointerCapture(activeDrag.pointerId);
    }

    activeLengthDragRef.current = null;
    setDraggingPipeEnd(null);
  }, []);

  const previewDragAt = useCallback((clientX: number) => {
    const activeDrag = activeDragRef.current;
    if (!canDragOutlets || !activeDrag) return;

    activeDrag.lastClientX = clientX;
    onOutletLocationPreview?.(activeDrag.outletIndex, inchesAtClientX(clientX));
  }, [canDragOutlets, inchesAtClientX, onOutletLocationPreview]);

  const finishDragAt = useCallback((clientX: number) => {
    const activeDrag = activeDragRef.current;
    if (!canDragOutlets || !activeDrag) return;

    const nextLocation = inchesAtClientX(clientX);
    const svg = svgRef.current;
    if (
      activeDrag.mode === "pointer" &&
      activeDrag.pointerId !== undefined &&
      svg?.hasPointerCapture(activeDrag.pointerId)
    ) {
      svg.releasePointerCapture(activeDrag.pointerId);
    }

    activeDragRef.current = null;
    setDraggingOutletIndex(null);
    onOutletLocationPreview?.(activeDrag.outletIndex, nextLocation);
    onOutletLocationCommit?.(activeDrag.outletIndex, nextLocation);
  }, [canDragOutlets, inchesAtClientX, onOutletLocationCommit, onOutletLocationPreview]);

  const cancelDrag = useCallback(() => {
    const activeDrag = activeDragRef.current;
    if (!activeDrag) return;

    const svg = svgRef.current;
    if (
      activeDrag.mode === "pointer" &&
      activeDrag.pointerId !== undefined &&
      svg?.hasPointerCapture(activeDrag.pointerId)
    ) {
      svg.releasePointerCapture(activeDrag.pointerId);
    }

    activeDragRef.current = null;
    setDraggingOutletIndex(null);
  }, []);

  useEffect(() => {
    if (draggingOutletIndex === null && draggingPipeEnd === null) return;

    const handleWindowPointerMove = (event: PointerEvent) => {
      const activeDrag = activeDragRef.current;
      const activeLengthDrag = activeLengthDragRef.current;
      if (activeLengthDrag && activeLengthDrag.mode === "pointer" && activeLengthDrag.pointerId === event.pointerId) {
        event.preventDefault();
        previewLengthDragAt(event.clientX);
        return;
      }
      if (!activeDrag || activeDrag.mode !== "pointer" || activeDrag.pointerId !== event.pointerId) return;

      event.preventDefault();
      previewDragAt(event.clientX);
    };

    const handleWindowPointerUp = (event: PointerEvent) => {
      const activeDrag = activeDragRef.current;
      const activeLengthDrag = activeLengthDragRef.current;
      if (activeLengthDrag && activeLengthDrag.mode === "pointer" && activeLengthDrag.pointerId === event.pointerId) {
        event.preventDefault();
        finishLengthDragAt(event.clientX);
        return;
      }
      if (!activeDrag || activeDrag.mode !== "pointer" || activeDrag.pointerId !== event.pointerId) return;

      event.preventDefault();
      finishDragAt(event.clientX);
    };

    const handleWindowPointerCancel = (event: PointerEvent) => {
      const activeDrag = activeDragRef.current;
      const activeLengthDrag = activeLengthDragRef.current;
      if (activeLengthDrag && activeLengthDrag.mode === "pointer" && activeLengthDrag.pointerId === event.pointerId) {
        cancelLengthDrag();
        return;
      }
      if (!activeDrag || activeDrag.mode !== "pointer" || activeDrag.pointerId !== event.pointerId) return;

      cancelDrag();
    };

    const handleWindowMouseMove = (event: MouseEvent) => {
      const activeDrag = activeDragRef.current;
      const activeLengthDrag = activeLengthDragRef.current;
      if (activeLengthDrag && activeLengthDrag.mode === "mouse") {
        event.preventDefault();
        previewLengthDragAt(event.clientX);
        return;
      }
      if (!activeDrag || activeDrag.mode !== "mouse") return;

      event.preventDefault();
      previewDragAt(event.clientX);
    };

    const handleWindowMouseUp = (event: MouseEvent) => {
      const activeDrag = activeDragRef.current;
      const activeLengthDrag = activeLengthDragRef.current;
      if (activeLengthDrag && activeLengthDrag.mode === "mouse") {
        event.preventDefault();
        finishLengthDragAt(event.clientX);
        return;
      }
      if (!activeDrag || activeDrag.mode !== "mouse") return;

      event.preventDefault();
      finishDragAt(event.clientX);
    };

    const handleWindowTouchMove = (event: TouchEvent) => {
      const activeDrag = activeDragRef.current;
      const activeLengthDrag = activeLengthDragRef.current;
      if (activeLengthDrag && activeLengthDrag.mode === "touch") {
        const touch = event.touches[0];
        if (!touch) return;
        event.preventDefault();
        previewLengthDragAt(touch.clientX);
        return;
      }
      if (!activeDrag || activeDrag.mode !== "touch") return;

      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      previewDragAt(touch.clientX);
    };

    const handleWindowTouchEnd = () => {
      const activeDrag = activeDragRef.current;
      const activeLengthDrag = activeLengthDragRef.current;
      if (activeLengthDrag && activeLengthDrag.mode === "touch") {
        finishLengthDragAt(activeLengthDrag.lastClientX);
        return;
      }
      if (!activeDrag || activeDrag.mode !== "touch") return;

      finishDragAt(activeDrag.lastClientX);
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("touchmove", handleWindowTouchMove, { passive: false });
    window.addEventListener("touchend", handleWindowTouchEnd);
    window.addEventListener("touchcancel", cancelLengthDrag);
    window.addEventListener("touchcancel", cancelDrag);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleWindowTouchEnd);
      window.removeEventListener("touchcancel", cancelLengthDrag);
      window.removeEventListener("touchcancel", cancelDrag);
    };
  }, [cancelDrag, cancelLengthDrag, draggingOutletIndex, draggingPipeEnd, finishDragAt, finishLengthDragAt, previewDragAt, previewLengthDragAt]);

  const beginOutletDrag = (event: React.PointerEvent<SVGGElement>, outletIndex: number) => {
    if (!canDragOutlets || activeDragRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    activeDragRef.current = {
      outletIndex,
      mode: "pointer",
      pointerId: event.pointerId,
      lastClientX: event.clientX,
    };
    setDraggingOutletIndex(outletIndex);
    try {
      svgRef.current?.setPointerCapture(event.pointerId);
    } catch {
      // Window-level listeners continue the drag if SVG pointer capture is unavailable.
    }

    const nextLocation = inchesAtClientX(event.clientX);
    onOutletLocationPreview?.(outletIndex, nextLocation);
  };

  const beginOutletMouseDrag = (event: React.MouseEvent<SVGGElement>, outletIndex: number) => {
    if (!canDragOutlets || activeDragRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    activeDragRef.current = { outletIndex, mode: "mouse", lastClientX: event.clientX };
    setDraggingOutletIndex(outletIndex);
    onOutletLocationPreview?.(outletIndex, inchesAtClientX(event.clientX));
  };

  const beginOutletTouchDrag = (event: React.TouchEvent<SVGGElement>, outletIndex: number) => {
    if (!canDragOutlets || activeDragRef.current) return;

    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    event.stopPropagation();
    activeDragRef.current = { outletIndex, mode: "touch", lastClientX: touch.clientX };
    setDraggingOutletIndex(outletIndex);
    onOutletLocationPreview?.(outletIndex, inchesAtClientX(touch.clientX));
  };

  const previewOutletDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    const activeDrag = activeDragRef.current;
    if (!canDragOutlets || !activeDrag || activeDrag.pointerId !== event.pointerId) return;

    event.preventDefault();
    onOutletLocationPreview?.(activeDrag.outletIndex, inchesAtClientX(event.clientX));
  };

  const finishOutletDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    const activeDrag = activeDragRef.current;
    if (!canDragOutlets || !activeDrag || activeDrag.pointerId !== event.pointerId) return;

    event.preventDefault();
    const nextLocation = inchesAtClientX(event.clientX);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activeDragRef.current = null;
    setDraggingOutletIndex(null);
    onOutletLocationPreview?.(activeDrag.outletIndex, nextLocation);
    onOutletLocationCommit?.(activeDrag.outletIndex, nextLocation);
  };

  const cancelOutletDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    const activeDrag = activeDragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activeDragRef.current = null;
    setDraggingOutletIndex(null);
  };

  const beginLengthDrag = (event: React.PointerEvent<SVGGElement>, end: "left" | "right") => {
    if (!canDragLength || activeDragRef.current || activeLengthDragRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    activeLengthDragRef.current = {
      end,
      mode: "pointer",
      pointerId: event.pointerId,
      startClientX: event.clientX,
      lastClientX: event.clientX,
      startLength: length,
      startRenderedPipeLength: renderedPipeLength,
    };
    setDraggingPipeEnd(end);
    try {
      svgRef.current?.setPointerCapture(event.pointerId);
    } catch {
      // Window-level listeners continue the drag if SVG pointer capture is unavailable.
    }
    onLengthPreview?.(clampPipeLength(length, minLength));
  };

  const beginLengthMouseDrag = (event: React.MouseEvent<SVGGElement>, end: "left" | "right") => {
    if (!canDragLength || activeDragRef.current || activeLengthDragRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    activeLengthDragRef.current = {
      end,
      mode: "mouse",
      startClientX: event.clientX,
      lastClientX: event.clientX,
      startLength: length,
      startRenderedPipeLength: renderedPipeLength,
    };
    setDraggingPipeEnd(end);
    onLengthPreview?.(clampPipeLength(length, minLength));
  };

  const beginLengthTouchDrag = (event: React.TouchEvent<SVGGElement>, end: "left" | "right") => {
    if (!canDragLength || activeDragRef.current || activeLengthDragRef.current) return;

    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    event.stopPropagation();
    activeLengthDragRef.current = {
      end,
      mode: "touch",
      startClientX: touch.clientX,
      lastClientX: touch.clientX,
      startLength: length,
      startRenderedPipeLength: renderedPipeLength,
    };
    setDraggingPipeEnd(end);
    onLengthPreview?.(clampPipeLength(length, minLength));
  };

  const renderThreadedFitting = (fitting: ThreadedFitting, index: number) => (
    <ThreadedFittingRenderer
      key={`threaded-fitting-${index}`}
      fitting={fitting}
      x={xAt(fitting.location)}
      y={pipeY + pipeHeight / 2}
      isLeftEnd={fitting.location <= length / 2}
      index={index}
    />
  );

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 860,
        minWidth: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2vw 2vw 0 2vw',
        margin: '0 auto',
        touchAction: 'manipulation',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 760,
          minWidth: 0,
          background: 'transparent',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="auto"
          viewBox={`0 0 ${width} ${height}`}
          onPointerMove={previewOutletDrag}
          onPointerUp={finishOutletDrag}
          onPointerCancel={cancelOutletDrag}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            minWidth: 420,
            maxWidth: 760,
            aspectRatio: `${width} / ${height}`,
            margin: '0 auto 6px auto',
            touchAction: 'none',
          }}
        >
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(135)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#777" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="#f7f7f7" />

          <text x={margin} y={20} fontSize="7" fontWeight="700">MAIN I.D.</text>
          <text x={margin} y={36} fontSize="7">{pipetag || "-"}</text>

          <text x={margin} y={49} fontSize="7" fontWeight="700">QTY.</text>
          <text x={margin} y={60} fontSize="7">{qty}</text>

          <text x={margin + 96} y={20} fontSize="7" fontWeight="700">QUAN.</text>
          <text x={margin + 96} y={36} fontSize="7">1</text>

          <text x={margin + 146} y={20} fontSize="7" fontWeight="700">PIPE DESCRIPTION</text>
          <text x={margin + 146} y={36} fontSize="7">{sketchPipeDescription}</text>

          <text x={width - 192} y={20} fontSize="7" fontWeight="700">LENGTH</text>
          <text x={width - 192} y={36} fontSize="7">{formatLengthLabel(length)}</text>

          <text x={width - 120} y={20} fontSize="7" fontWeight="700">EP</text>
          <text x={width - 120} y={36} fontSize="7">{`${leftPrepCode}/${rightPrepCode}`}</text>

          <text x={width - 72} y={20} fontSize="7" fontWeight="700">COLOR</text>
          <text x={width - 72} y={36} fontSize="7">RED</text>

          {!hideSummaryText && (
            <text x={margin} y={70} fontSize="6" fill="#333">ARROW: ---&gt;</text>
          )}

          <line x1={renderedMargin} y1={dimensionY} x2={width - renderedMargin} y2={dimensionY} stroke="#111" strokeWidth="1.6" />
          <line x1={renderedMargin} y1={dimensionY - 8} x2={renderedMargin} y2={dimensionY + 8} stroke="#111" strokeWidth="1.6" />
          <line x1={width - renderedMargin} y1={dimensionY - 8} x2={width - renderedMargin} y2={dimensionY + 8} stroke="#111" strokeWidth="1.6" />

          {sketchOutlets.map(({ outlet, originalIndex }) => {
            const x = xAt(Number(outlet.location));
            return (
              <line key={`tick-${originalIndex}`} x1={x} y1={dimensionY - 8} x2={x} y2={dimensionY + 8} stroke="#111" strokeWidth="1.4" />
            );
          })}

          {segmentLengths.map((segLen, idx) => (
            <text key={`seg-${idx}`} x={segmentCenters[idx]} y={dimensionY - 14} textAnchor="middle" fontSize="6.7" fill="#111">
              {formatFabDimension(segLen)}
            </text>
          ))}

          <text x={renderedMargin - 8} y={dimensionY + 17} textAnchor="start" fontSize="6.7">0-0</text>

          {sketchOutlets.map(({ outlet, originalIndex }) => {
            const x = xAt(Number(outlet.location));
            return (
              <text key={`cum-${originalIndex}`} x={x} y={dimensionY + 17} textAnchor="middle" fontSize="6.7">
                {formatFabDimension(Number(outlet.location))}
              </text>
            );
          })}

          <text x={width - renderedMargin} y={dimensionY + 17} textAnchor="end" fontSize="6.7">
            {formatFabDimension(length)}
          </text>

          <text x={renderedMargin + 4} y={dimensionY - 4} textAnchor="start" fontSize="7.5" fontWeight="700">{leftPrepCode}</text>
          <text x={width - renderedMargin - 4} y={dimensionY - 4} textAnchor="end" fontSize="7.5" fontWeight="700">{rightPrepCode}</text>

          {isThreadedPipeSketch ? (
            <g>
              <rect
                x={renderedMargin}
                y={pipeY + 5}
                width={renderedPipeLength}
                height="8"
                fill="url(#hatch)"
                stroke="#111"
                strokeWidth="1.7"
              />
              {renderedThreadedFittings.map(renderThreadedFitting)}
            </g>
          ) : (
            <rect x={renderedMargin} y={pipeY} width={renderedPipeLength} height={pipeHeight} fill="url(#hatch)" stroke="#111" strokeWidth="2" />
          )}

          {canDragLength && (
            <>
              {(["left", "right"] as const).map((end) => {
                const x = end === "left" ? renderedMargin : width - renderedMargin;
                const isDragging = draggingPipeEnd === end;
                const isHighlighted = isDragging || hoveredPipeEnd === end;
                return (
                  <g
                    key={`pipe-end-${end}`}
                    onPointerDown={(event) => beginLengthDrag(event, end)}
                    onPointerEnter={() => setHoveredPipeEnd(end)}
                    onPointerLeave={() => setHoveredPipeEnd(null)}
                    onMouseDown={(event) => beginLengthMouseDrag(event, end)}
                    onTouchStart={(event) => beginLengthTouchDrag(event, end)}
                    style={{
                      cursor: isDragging ? 'ew-resize' : 'col-resize',
                      touchAction: 'none',
                    }}
                  >
                    <title>Drag to adjust pipe length</title>
                    <rect
                      x={x - 18}
                      y={lengthHandleY - 22}
                      width="36"
                      height={pipeHeight + 44}
                      fill="transparent"
                      pointerEvents="all"
                    />
                    <line
                      x1={x}
                      y1={lengthHandleTopY}
                      x2={x}
                      y2={lengthHandleBottomY}
                      stroke={isHighlighted ? "#1976d2" : "#111"}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </>
          )}

          {sketchOutlets.map(({ outlet, originalIndex }) => {
            const x = xAt(Number(outlet.location));
            const { dx, dy } = outletDirectionVector(outlet.direction);
            const scale = outletScale(outlet.size, diameter);
            const pipeCenterY = pipeY + pipeHeight / 2;
            const outletLength = 19 + scale * 9;
            const outletWidth = 5 + scale * 3.1;
            const outletAngle = Math.atan2(dy, dx) * 180 / Math.PI;
            const labelX = x + dx * (outletLength + 6);
            const labelY = pipeCenterY + dy * (outletLength + 6) + (dy === 0 ? 3 : 0);
            const isHighlighted = draggingOutletIndex === originalIndex || hoveredOutletIndex === originalIndex;
            return (
              <g
                key={`outlet-${originalIndex}`}
                onPointerDown={(event) => beginOutletDrag(event, originalIndex)}
                onPointerEnter={() => setHoveredOutletIndex(originalIndex)}
                onPointerLeave={() => setHoveredOutletIndex(null)}
                onMouseDown={(event) => beginOutletMouseDrag(event, originalIndex)}
                onTouchStart={(event) => beginOutletTouchDrag(event, originalIndex)}
                style={{
                  cursor: draggingOutletIndex === originalIndex ? 'grabbing' : canDragOutlets ? 'grab' : 'default',
                  touchAction: canDragOutlets ? 'none' : 'auto',
                }}
              >
                <title>Drag to reposition outlet</title>
                {canDragOutlets && (
                  <circle
                    cx={x}
                    cy={pipeCenterY}
                    r="24"
                    fill="transparent"
                    stroke="transparent"
                    pointerEvents="all"
                  />
                )}
                <rect
                  x={x - 1}
                  y={pipeCenterY - outletWidth / 2}
                  width={outletLength}
                  height={outletWidth}
                  rx={outletWidth / 2}
                  fill={isHighlighted ? "#1976d2" : "#111"}
                  transform={`rotate(${outletAngle} ${x} ${pipeCenterY})`}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={dx < 0 ? "end" : dx > 0 ? "start" : "middle"}
                  fontSize={Math.max(7, Math.min(9.5, 6.8 + scale))}
                  fontWeight="700"
                >
                  {outlet.size}
                </text>
              </g>
            );
          })}

          {isThreadedPipeSketch ? (
            <text x={margin} y={height - 14} fontSize="6" fontWeight="700">THREAD ENDS WITH MAKE-ON FITTINGS AS SHOWN</text>
          ) : (
            <>
              <text x={margin} y={height - 14} fontSize="6" fontWeight="700">STANDARD OUTLET: WELD P.O.L.</text>
              <text x={width - margin} y={height - 14} textAnchor="end" fontSize="6" fontWeight="700">
                TOTAL NUMBER OF WELDS: {sketchOutlets.length}
              </text>
            </>
          )}
        </svg>
      </div>
      {showExportButton && (
        <button
          style={{
            marginTop: 16,
            padding: '12px 28px',
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 18,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0001',
            width: '100%',
            maxWidth: 320,
            minWidth: 0,
            letterSpacing: 0.5,
            touchAction: 'manipulation',
          }}
          onClick={async () => {
            if (svgRef.current) {
              await exportPipeSketchPdf(svgRef.current, {
                pipeType,
                pipetag,
                length,
                diameter,
                outlets,
              });
            }
          }}
        >
          Export PDF
        </button>
      )}
    </div>
  );
};
export default PipeSketch;
