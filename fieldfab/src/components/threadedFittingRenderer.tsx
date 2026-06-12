import type { ThreadedFitting } from "../types";

type ThreadedFittingRendererProps = {
  fitting: ThreadedFitting;
  x: number;
  y: number;
  isLeftEnd: boolean;
  index: number;
};

const STROKE_WIDTH = 2;
const SOCKET_STROKE_WIDTH = 1.5;
const HALF = 8;
const LEG = 14;
const STUB = 6;
const STROKE = "#111";

function isType(fitting: ThreadedFitting, keyword: string): boolean {
  return fitting.type.toLowerCase().includes(keyword);
}

function threadedFittingLabel(fitting: ThreadedFitting): string {
  const size = fitting.size || fitting.runSize || fitting.branchSize || fitting.outletSize || "";

  if (isType(fitting, "tee")) return `${size} Tee`.trim();
  if (isType(fitting, "cap")) return `${size} Cap`.trim();
  if (isType(fitting, "coupling")) return `${size} Coupling`.trim();
  if (isType(fitting, "union")) return `${size} Union`.trim();
  if (isType(fitting, "bushing")) return `${size} Bushing`.trim();
  if (isType(fitting, "plug")) return `${size} Plug`.trim();
  if (isType(fitting, "elbow90")) return `${size} 90`.trim();

  return size || "Fitting";
}

export function ThreadedFittingRenderer({ fitting, x, y, isLeftEnd, index }: ThreadedFittingRendererProps) {
  const isTee = isType(fitting, "tee");
  const isCap = isType(fitting, "cap");
  const isCoupling = isType(fitting, "coupling");
  const isUnion = isType(fitting, "union");

  const branchDirection = fitting.direction === "down" ? 1 : -1;
  const pipeDirection = isLeftEnd ? -1 : 1;
  const branchDeltaY = branchDirection * LEG;
  const label = threadedFittingLabel(fitting);
  const labelY = y + 34;

  if (isCap) {
    return (
      <g key={`threaded-fitting-${index}`}>
        <line
          x1={x}
          y1={y - HALF}
          x2={x}
          y2={y + HALF}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <text x={x} y={labelY} textAnchor="middle" fontSize="7.5" fontWeight="700">
          {label}
        </text>
      </g>
    );
  }

  if (isCoupling || isUnion) {
    const gap = 6;
    return (
      <g key={`threaded-fitting-${index}`}>
        <line x1={x - gap} y1={y - HALF} x2={x - gap} y2={y + HALF} stroke={STROKE} strokeWidth={SOCKET_STROKE_WIDTH} strokeLinecap="round" />
        <line x1={x + gap} y1={y - HALF} x2={x + gap} y2={y + HALF} stroke={STROKE} strokeWidth={SOCKET_STROKE_WIDTH} strokeLinecap="round" />
        <text x={x} y={labelY} textAnchor="middle" fontSize="7.5" fontWeight="700">
          {label}
        </text>
      </g>
    );
  }

  if (isTee) {
    const pipeEndX = x - pipeDirection;
    const branchX = x + pipeDirection * (STUB + 1);
    const runEndX = x + pipeDirection * (STUB + 10);
    const branchEndY = y + branchDeltaY;
    const teeLabelY = branchDirection > 0 ? branchEndY + 12 : branchEndY - 8;
    const crossbarHalf = HALF * 0.85;
    const connectorStartY = branchDirection > 0 ? y - crossbarHalf * 0.01 : y - crossbarHalf;
    const connectorEndY = branchDirection > 0 ? y + crossbarHalf : y + crossbarHalf * 0.01;

    return (
      <g key={`threaded-fitting-${index}`}>
        <line
          x1={pipeEndX}
          y1={y}
          x2={runEndX}
          y2={y}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <line
          x1={pipeEndX}
          y1={y - crossbarHalf}
          x2={pipeEndX}
          y2={y + crossbarHalf}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <line
          x1={branchX}
          y1={connectorStartY}
          x2={branchX}
          y2={connectorEndY}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <line
          x1={branchX}
          y1={y + branchDirection * crossbarHalf}
          x2={branchX}
          y2={branchEndY}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <line
          x1={branchX - crossbarHalf}
          y1={branchEndY}
          x2={branchX + crossbarHalf}
          y2={branchEndY}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <line
          x1={runEndX}
          y1={y - crossbarHalf}
          x2={runEndX}
          y2={y + crossbarHalf}
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <text x={branchX} y={teeLabelY} textAnchor="middle" fontSize="7.5" fontWeight="700">
          {label}
        </text>
      </g>
    );
  }

  const stubEndX = x + pipeDirection * STUB;
  const legEndY = y + branchDeltaY;
  const crossbarHalf = HALF * 0.7;
  const bodyStartY = branchDirection > 0 ? y : y - crossbarHalf;
  const bodyEndY = branchDirection > 0 ? y + crossbarHalf : y;
  const elbowLabelY = branchDirection > 0 ? legEndY + 12 : legEndY - 6;

  return (
    <g key={`threaded-fitting-${index}`}>
      <line
        x1={x}
        y1={y}
        x2={stubEndX}
        y2={y}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <line
        x1={stubEndX}
        y1={bodyStartY}
        x2={stubEndX}
        y2={bodyEndY}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <line
        x1={stubEndX}
        y1={y + branchDirection * crossbarHalf}
        x2={stubEndX}
        y2={legEndY}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <line
        x1={x}
        y1={y - crossbarHalf}
        x2={x}
        y2={y + crossbarHalf}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <line
        x1={stubEndX - crossbarHalf}
        y1={legEndY}
        x2={stubEndX + crossbarHalf}
        y2={legEndY}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <text x={stubEndX} y={elbowLabelY} textAnchor="middle" fontSize="7.5" fontWeight="700">
        {label}
      </text>
    </g>
  );
}
