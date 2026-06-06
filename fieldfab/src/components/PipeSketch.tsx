import React, { useRef } from "react";
import { exportPipeSketchPdf } from "./exportPdf";

import type { WeldedOutlet } from "./WeldedOutletForm";

interface PipeSketchProps {
  pipeType: string;
  pipetag: string;
  qty?: number;
  length: number;
  diameter: number | string;
  fittingsEndPipeLabel1: string;
  fittingsEndPipeLabel2: string;
  outlets?: WeldedOutlet[];
  showExportButton?: boolean;
  hideSummaryText?: boolean;
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
    return `${feet}'-${wholeInches}\"`;
  }

  const divisor = gcd(fracNum, 8);
  const num = fracNum / divisor;
  const den = 8 / divisor;

  return `${feet}'-${wholeInches} ${num}/${den}\"`;
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

function endPrepCode(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("cut groov")) return "CC";
  if (normalized.includes("roll groov")) return "GRV";
  if (normalized.includes("groov")) return "GRV";
  if (normalized.includes("thread")) return "T";
  if (normalized.includes("weld")) return "W";
  return "P";
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

const PipeSketch: React.FC<PipeSketchProps> = ({ pipeType, pipetag, qty = 1, length, diameter, fittingsEndPipeLabel1, fittingsEndPipeLabel2, outlets = [], showExportButton = false, hideSummaryText = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 480;
  const height = 275;
  const margin = 24;
  const dimensionY = 98;
  const pipeY = 186;
  const pipeHeight = 18;
  const pipeLength = width - 2 * margin;
  const sortedOutlets = [...outlets].sort((a, b) => Number(a.location) - Number(b.location));
  const segmentPositions = [0, ...sortedOutlets.map(o => Number(o.location)), length];
  const segmentLengths = segmentPositions.slice(0, -1).map((start, idx) => segmentPositions[idx + 1] - start);

  const xAt = (inches: number) => margin + Math.max(0, Math.min(inches / Math.max(length, 1), 1)) * pipeLength;
  const segmentCenters = segmentPositions.slice(0, -1).map((start, idx) => (xAt(start) + xAt(segmentPositions[idx + 1])) / 2);

  const leftPrepCode = endPrepCode(fittingsEndPipeLabel1);
  const rightPrepCode = endPrepCode(fittingsEndPipeLabel2);

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
          <text x={margin + 146} y={36} fontSize="7">{pipeDescription(diameter, pipeType)}</text>

          <text x={width - 192} y={20} fontSize="7" fontWeight="700">LENGTH</text>
          <text x={width - 192} y={36} fontSize="7">{formatLengthLabel(length)}</text>

          <text x={width - 120} y={20} fontSize="7" fontWeight="700">EP</text>
          <text x={width - 120} y={36} fontSize="7">{`${leftPrepCode}/${rightPrepCode}`}</text>

          <text x={width - 72} y={20} fontSize="7" fontWeight="700">COLOR</text>
          <text x={width - 72} y={36} fontSize="7">RED</text>

          {!hideSummaryText && (
            <text x={margin} y={70} fontSize="6" fill="#333">ARROW: ---&gt;</text>
          )}

          <line x1={margin} y1={dimensionY} x2={width - margin} y2={dimensionY} stroke="#111" strokeWidth="1.6" />
          <line x1={margin} y1={dimensionY - 8} x2={margin} y2={dimensionY + 8} stroke="#111" strokeWidth="1.6" />
          <line x1={width - margin} y1={dimensionY - 8} x2={width - margin} y2={dimensionY + 8} stroke="#111" strokeWidth="1.6" />

          {sortedOutlets.map((outlet, idx) => {
            const x = xAt(Number(outlet.location));
            return (
              <line key={`tick-${idx}`} x1={x} y1={dimensionY - 8} x2={x} y2={dimensionY + 8} stroke="#111" strokeWidth="1.4" />
            );
          })}

          {segmentLengths.map((segLen, idx) => (
            <text key={`seg-${idx}`} x={segmentCenters[idx]} y={dimensionY - 14} textAnchor="middle" fontSize="6.7" fill="#111">
              {formatFabDimension(segLen)}
            </text>
          ))}

          <text x={margin - 8} y={dimensionY + 17} textAnchor="start" fontSize="6.7">0-0</text>

          {sortedOutlets.map((outlet, idx) => {
            const x = xAt(Number(outlet.location));
            return (
              <text key={`cum-${idx}`} x={x} y={dimensionY + 17} textAnchor="middle" fontSize="6.7">
                {formatFabDimension(Number(outlet.location))}
              </text>
            );
          })}

          <text x={width - margin} y={dimensionY + 17} textAnchor="end" fontSize="6.7">
            {formatFabDimension(length)}
          </text>

          <text x={margin + 4} y={dimensionY - 4} textAnchor="start" fontSize="7.5" fontWeight="700">{leftPrepCode}</text>
          <text x={width - margin - 4} y={dimensionY - 4} textAnchor="end" fontSize="7.5" fontWeight="700">{rightPrepCode}</text>

          <rect x={margin} y={pipeY} width={pipeLength} height={pipeHeight} fill="url(#hatch)" stroke="#111" strokeWidth="2" />

          {sortedOutlets.map((outlet, idx) => {
            const x = xAt(Number(outlet.location));
            const { dx, dy } = outletDirectionVector(outlet.direction);
            const scale = outletScale(outlet.size, diameter);
            const pipeCenterY = pipeY + pipeHeight / 2;
            const branchLength = 15 + scale * 9;
            const branchWidth = 2.8 + scale * 2.4;
            const hubRadius = 2.4 + scale * 1.25;
            const endX = x + dx * branchLength;
            const endY = pipeCenterY + dy * branchLength;
            const labelX = endX + dx * 5;
            const labelY = endY + dy * 5 + (dy === 0 ? 3 : 0);
            return (
              <g key={`outlet-${idx}`}>
                <circle cx={x} cy={pipeCenterY} r={hubRadius} fill="#111" />
                <line x1={x} y1={pipeCenterY} x2={endX} y2={endY} stroke="#111" strokeWidth={branchWidth} strokeLinecap="round" />
                <line x1={x} y1={pipeCenterY} x2={endX} y2={endY} stroke="#f7f7f7" strokeWidth="1.1" strokeLinecap="round" />
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

          <text x={margin} y={height - 14} fontSize="6" fontWeight="700">STANDARD OUTLET: WELD P.O.L.</text>
          <text x={width - margin} y={height - 14} textAnchor="end" fontSize="6" fontWeight="700">
            TOTAL NUMBER OF WELDS: {sortedOutlets.length}
          </text>
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
