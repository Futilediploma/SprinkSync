import React from "react";

import type { WeldedOutlet } from "./WeldedOutletForm";

interface PipeSketchProps {
  pipeType: string;
  pipetag: string;
  length: number;
  diameter: number;
  fittingsEndPipeLabel1: string;
  fittingsEndPipeLabel2: string;
  outlets?: WeldedOutlet[];
}

// Utility to convert inches to feet-inches string (not used, but kept for future use)
// function formatFeetInches(inches: number) {
//   const feet = Math.floor(inches / 12);
//   const inch = +(inches % 12).toFixed(2);
//   return `${feet}'-${inch}${inch !== 1 ? '' : ''}`;
// }
function formatFeetInches(inches: number) {
  const feet = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${feet}' ${inch}"`;
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

const PipeSketch: React.FC<PipeSketchProps> = ({ pipeType, pipetag, length, diameter, fittingsEndPipeLabel1, fittingsEndPipeLabel2, outlets = [] }) => {
  // SVG dimensions
  // Responsive width: use 100% of parent, but set a max width
  const width = 480;
  const height = 220; // increased height for more space
  const margin = 30;
  const pipeY = 100; // move pipe down
  const pipeHeight = 16;
  const pipeLength = width - 2 * margin;
  const fillColor = pipeColors[pipeType] || '#e5e7eb';

  // Optionally, you could use 'length' to scale the pipe or display a label
  return (
    <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
  <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ marginBottom: 6, display: 'block' }}>
        {/* Pipe */}
  <rect x={margin} y={pipeY} width={pipeLength} height={pipeHeight} fill={fillColor} stroke="#222" strokeWidth={2} rx={4} />
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
                      <text x={x + 12} y={pipeY + pipeHeight - 34} textAnchor="middle" fontSize="13" fill="#333">
                          {outlet.size}"
                      </text>
                    </g>
                  );
                }
                if (isRightSide) {
                  return (
                    <g key={idx}>
                      <line x1={x} y1={pipeY + 20} x2={x} y2={pipeY - 4} stroke="#222" strokeWidth={6} />
                      <line x1={x + 7} y1={pipeY - 18} x2={x} y2={pipeY - 5} stroke="#222" strokeWidth={1.5} />
                      <text x={x - 10} y={pipeY + pipeHeight + 32} textAnchor="middle" fontSize="13" fill="#333">
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
                      <line x1={x} y1={pipeY + pipeHeight} x2={x} y2={pipeY + pipeHeight + 18} stroke="#222" strokeWidth={1.5} />
                      <text x={x} y={pipeY + pipeHeight + 30} textAnchor="middle" fontSize="13" fill="#333">
                        {outlet.size}"
                      </text>
                      </>
                    ) : isTop ? (
                      <>
                      <line x1={x} y1={pipeY + 20} x2={x} y2={pipeY - 4} stroke="#222" strokeWidth={6} />
                        <line x1={x} y1={pipeY - 20} x2={x} y2={pipeY - 0} stroke="#222" strokeWidth={1.5} />
                        <text x={x} y={pipeY - 22} textAnchor="middle" fontSize="13" fill="#333">
                          {outlet.size}"
                        </text>
                      </>
                    ) : null}
                  </g>
                );
              })}
        {/* Arrowhead marker definition */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,3 L0,6 L2,3 Z" fill="#222" />
          </marker>
        </defs>
        {/* Pipe tags */}
        <text x={margin} y={pipeY - 50} textAnchor="start" fontSize="14" fill="#333">
          Pipe ID: {pipetag}
        </text>
        {/* Show length as text */}
        <text x={width / 2} y={pipeY + pipeHeight + 95} textAnchor="middle" fontSize="16" fill="#333">
          LENGTH: {formatFeetInches(length)}
        </text>
        {/* Show diameter as text */}
        <text x={width - 130} y={pipeY - 50} textAnchor="start" fontSize="16" fill="#333">
          Diameter: {diameter} in
        </text>
        <text x={width / 2} y={pipeY - 50} textAnchor="middle" fontSize="16" fill="#333">
         Pipe Type: {pipeType}
        </text>
        <text x={margin} y={pipeY + 60} textAnchor="start" fontSize="16" fill="#333">
          {fittingsEndPipeLabel1}
        </text>
        <text x={width - margin} y={pipeY + 60} textAnchor="end" fontSize="16" fill="#333">
          {fittingsEndPipeLabel2}
        </text>
      </svg>
    </div>
  );
};
export default PipeSketch;
