import React, { useRef } from "react";
import { exportPipeSketchPdf } from "./exportPdf";

import type { WeldedOutlet } from "./WeldedOutletForm";

interface PipeSketchProps {
  pipeType: string;
  pipetag: string;
  length: number;
  diameter: number;
  fittingsEndPipeLabel1: string;
  fittingsEndPipeLabel2: string;
  outlets?: WeldedOutlet[];
  showExportButton?: boolean;
  hideSummaryText?: boolean;
}

// Utility to convert inches to feet-inches string (not used, but kept for future use)
// function formatFeetInches(inches: number) {
//   const feet = Math.floor(inches / 12);
//   const inch = +(inches % 12).toFixed(2);
//   return `${feet}'-${inch}${inch !== 1 ? '' : ''}`;
// }
// Helper to convert decimal inches to nearest fraction (1/16)
// Map for common unicode fractions up to 1/16
const unicodeFractions: Record<string, string> = {
  '1/16': '\u215B', // ⅛ (no 1/16 unicode, fallback to ⅛)
  '1/8': '\u215B', // ⅛
  '3/16': '3/16',
  '1/4': '\u00BC', // ¼
  '5/16': '5/16',
  '3/8': '\u215C', // ⅜
  '7/16': '7/16',
  '1/2': '\u00BD', // ½
  '9/16': '9/16',
  '5/8': '\u215D', // ⅝
  '11/16': '11/16',
  '3/4': '\u00BE', // ¾
  '13/16': '13/16',
  '7/8': '\u215E', // ⅞
  '15/16': '15/16',
};

function toFraction(inch: number) {
  const whole = Math.floor(inch);
  const frac = inch - whole;
  const denominator = 16;
  let numerator = Math.round(frac * denominator);
  // If the fractional part is less than 1/16, treat as whole inch
  if (frac < 1/16) {
    return `${whole}`;
  }
  if (numerator === denominator) {
    return `${whole + 1}`;
  }
  if (numerator === 0) {
    return `${whole}`;
  }
  // Reduce fraction
  let gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const divisor = gcd(numerator, denominator);
  const reducedNum = numerator / divisor;
  const reducedDen = denominator / divisor;
  const fracStr = `${reducedNum}/${reducedDen}`;
  // Use unicode if available
  const unicode = unicodeFractions[fracStr];
  if (unicode) {
    return whole === 0 ? `${eval(`'${unicode}'`)}` : `${whole}${eval(`'${unicode}'`)}`;
  }
  return whole === 0 ? `${fracStr}` : `${whole} ${fracStr}`;
}

function formatFeetInches(inches: number) {
  const feet = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${feet}' ${toFraction(inch)}"`;
}

const pipeColors: Record<string, string> = {
  schedule_10: '#b0bec5',
  schedule_40: '#90caf9',
  schedule_80: '#1976d2',
  copper: '#b87333',
  cpvc: '#ffe082',
  stainless_steel: '#cfd8dc',
  galvanized_steel: '#bdbdbd',
};

const PipeSketch: React.FC<PipeSketchProps> = ({ pipeType, pipetag, length, diameter, fittingsEndPipeLabel1, fittingsEndPipeLabel2, outlets = [], showExportButton = false, hideSummaryText = false }) => {
  // SVG dimensions
  const svgRef = useRef<SVGSVGElement>(null);
  // Responsive width: use 100% of parent, but set a max width
  const width = 480;
  const height = 275; // increased height for more space
  const margin = 30;
  const pipeY = 125; // move pipe down
  const pipeHeight = 16;
  const pipeLength = width - 2 * margin;
  const fillColor = pipeColors[pipeType] || '#e5e7eb';

  // Optionally, you could use 'length' to scale the pipe or display a label
  // Calculate segment values for multiple outlets
  // Sort outlets by location
  const sortedOutlets = [...outlets].sort((a, b) => Number(a.location) - Number(b.location));
  // Build array of segment start/end positions (in inches)
  const segmentPositions = [0, ...sortedOutlets.map(o => Number(o.location)), length];
  // Calculate segment lengths
  const segmentLengths = [];
  for (let i = 0; i < segmentPositions.length - 1; i++) {
    segmentLengths.push(segmentPositions[i+1] - segmentPositions[i]);
  }
  // Calculate x positions for each segment center
  const segmentCenters: number[] = [];
  for (let i = 0; i < segmentPositions.length - 1; i++) {
    const x1 = margin + (segmentPositions[i] / length) * pipeLength;
    const x2 = margin + (segmentPositions[i+1] / length) * pipeLength;
    segmentCenters.push((x1 + x2) / 2);
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 600,
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
          maxWidth: 480,
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
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            minWidth: 320,
            maxWidth: 480,
            aspectRatio: `${width} / ${height}`,
            margin: '0 auto 6px auto',
            touchAction: 'none',
          }}
        >
        {/* Background gradient */}
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e3f0ff" />
            <stop offset="100%" stopColor="#f0f6ff" />
          </linearGradient>
          <radialGradient id="pipe3d" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="60%" stopColor={fillColor} stopOpacity="1" />
            <stop offset="100%" stopColor="#888" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#bgGrad)" />
        {/* Pipe with 3D effect */}
        <rect x={margin} y={pipeY} width={pipeLength} height={pipeHeight} fill="url(#pipe3d)" stroke="#222" strokeWidth={2} rx={8} />
        {/* Welded Outlets */}
              {outlets.map((outlet, idx) => {
                // Map location (inches) to x position on pipe
                const loc = Number(outlet.location);
                const x = margin + Math.max(0, Math.min(loc / length, 1)) * pipeLength;
                const isBottom = ['3', '6', '7'].includes(String(outlet.direction));
                const isTop = ['1', '5', '8'].includes(String(outlet.direction));
                const isRightSide = String(outlet.direction) === "2";
                const isLeftSide = String(outlet.direction) === "4";
                if (isLeftSide) {
                  return (
                    <g key={idx}>
                      <line x1={x} y1={pipeY + 20} x2={x} y2={pipeY - 4} stroke="#222" strokeWidth={6} />
                      <line x1={x - 7} y1={pipeY + 36} x2={x} y2={pipeY + 20} stroke="#222" strokeWidth={1.5} />
                      <text x={x - 10} y={pipeY + pipeHeight + 34} textAnchor="middle" fontSize="13" fill="#333">
                          {outlet.size}"
                      </text>
                    </g>
                  );
                }
                if (isRightSide) {
                  return (
                    <g key={idx}>
                      <line x1={x} y1={pipeY + 20} x2={x} y2={pipeY - 4} stroke="#222" strokeWidth={6} />
                      <line x1={x + 7} y1={pipeY - 18} x2={x} y2={pipeY} stroke="#222" strokeWidth={1.5} />
                      <text x={x + 14} y={pipeY - 22} textAnchor="middle" fontSize="13" fill="#333">
                          {outlet.size}"
                      </text>
                    </g>
                  );
                }
                return (
                  <g key={idx}>
                    {isBottom ? (
                      <>
                      <line x1={x} y1={pipeY + 20} x2={x} y2={pipeY - 4} stroke="#222" strokeWidth={6} />
                      <line x1={x} y1={pipeY + pipeHeight} x2={x} y2={pipeY + pipeHeight + 35} stroke="#222" strokeWidth={1.5} />
                      <text x={x + 2} y={pipeY + pipeHeight + 47} textAnchor="middle" fontSize="13" fill="#333">
                        {outlet.size}"
                      </text>
                      </>
                    ) : isTop ? (
                      <>
                      <line x1={x} y1={pipeY + 20} x2={x} y2={pipeY - 4} stroke="#222" strokeWidth={6} />
                        <line x1={x} y1={pipeY - 27} x2={x} y2={pipeY - 0} stroke="#222" strokeWidth={1.5} />
                        <text x={x} y={pipeY - 30} textAnchor="middle" fontSize="13" fill="#333">
                          {outlet.size}"
                        </text>
                      </>
                    ) : null}
                  </g>
                );
              })}
        {/* DIMENSION LINE*/}
        <line x2={margin} x1={pipeLength + margin} y2={pipeY - pipeHeight + 100} y1={pipeY - pipeHeight + 100} stroke ="#222" strokeWidth={3} />
        <line x1={margin} y1={pipeY + 75} x2={margin} y2={pipeY + pipeHeight + 75} stroke="#222" strokeWidth={3} />
        <line x1={pipeLength + margin} y1={pipeY + 75} x2={pipeLength + margin} y2={pipeY + pipeHeight + 75} stroke="#222" strokeWidth={3} />

        {/* Segment Lengths for all segments */}
        {/* Only show segment labels if there are outlets */}
        {outlets.length > 0 && segmentLengths.map((segLen, idx) => (
          <text
            key={idx}
            x={segmentCenters[idx]}
            y={pipeY + pipeHeight + 100}
            textAnchor="middle"
            fontSize="16"
            fill={idx === 0 ? "#1976d2" : idx === segmentLengths.length - 1 ? "#d32f2f" : "#333"}
            fontWeight="bold"
          >
            {formatFeetInches(segLen)}
          </text>
        ))}
        {/* Always show bottom pipe end labels and LENGTH label */}
        <text x={margin} y={pipeY + pipeHeight + 120} textAnchor="start" fontSize="16" fill="#1976d2">
          {fittingsEndPipeLabel1}
        </text>
        <text x={width - margin} y={pipeY + pipeHeight + 120} textAnchor="end" fontSize="#d32f2f">
          {fittingsEndPipeLabel2}
        </text>
        <text x={width / 2} y={pipeY + pipeHeight + 120} textAnchor="middle" fontSize="16" fill="#333">
          LENGTH: {formatFeetInches(length)}
        </text>
        {/*OUTLET LOCATION ON DIMENSION LINE*/}
        {outlets.map((outlet, idx) => {
          const loc = Number(outlet.location);
          const x = margin + Math.max(0, Math.min(loc / length, 1)) * pipeLength;
          return (
            <g key={idx}>
              <line x1={x} y1={pipeY - pipeHeight + 90} x2={x} y2={pipeY + pipeHeight + 80} stroke="#222" strokeWidth={3} />
              <text
                x={x}
                y={pipeY - pipeHeight + 80}
                textAnchor="middle"
                fontSize="14"
                fill="#1976d2"
                fontWeight="bold"
              >
                {formatFeetInches(loc)}
              </text>
            </g>
          );
        })}
        {/* (Add rendering logic here if needed, or remove this block if not used) */}

        {/* Pipe tags and summary text (conditionally hidden for export) */}
        {!hideSummaryText && (
          <>
            <text x={margin} y={pipeY - 90} textAnchor="start" fontSize="14" fill="#333">
              Pipe ID: {pipetag}
            </text>
            <text x={width / 2} y={pipeY + pipeHeight + 120} textAnchor="middle" fontSize="16" fill="#333">
              LENGTH: {formatFeetInches(length)}
            </text>
            <text x={width - 130} y={pipeY - 90} textAnchor="start" fontSize="16" fill="#333">
              Diameter: {diameter} in
            </text>
            <text x={width / 2} y={pipeY - 90} textAnchor="middle" fontSize="16" fill="#333">
              Pipe Type: {pipeType}
            </text>
            <text x={margin} y={pipeY + pipeHeight + 120} textAnchor="start" fontSize="16" fill="#333">
              {fittingsEndPipeLabel1}
            </text>
            <text x={width - margin} y={pipeY + pipeHeight + 120} textAnchor="end" fontSize="16" fill="#333">
              {fittingsEndPipeLabel2}
            </text>
          </>
        )}
        </svg>
      </div>
      {/* Export PDF Button (only if showExportButton is true) */}
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
