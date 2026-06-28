import React from 'react';

export function BlueprintGrid() {
  // Ultra-sparse lines to keep background clean and empty
  const vLines = [12, 38, 62, 88];
  const hLines = [15, 45, 75];

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden opacity-[0.4]">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        {/* Vertical lines */}
        {vLines.map((xVal) => (
          <line
            key={`v-${xVal}`}
            x1={`${xVal}%`}
            y1="0"
            x2={`${xVal}%`}
            y2="100%"
            stroke="rgba(99, 102, 241, 0.02)"
            strokeWidth="0.5"
          />
        ))}

        {/* Horizontal lines */}
        {hLines.map((yVal) => (
          <line
            key={`h-${yVal}`}
            x1="0"
            y1={`${yVal}%`}
            x2="100%"
            y2={`${yVal}%`}
            stroke="rgba(99, 102, 241, 0.02)"
            strokeWidth="0.5"
          />
        ))}

        {/* Intersecting crosshairs */}
        {vLines.flatMap((xVal) =>
          hLines.map((yVal) => (
            <path
              key={`cross-${xVal}-${yVal}`}
              d={`M ${xVal}% ${yVal}% m -4 0 l 8 0 M ${xVal}% ${yVal}% m 0 -4 l 0 8`}
              stroke="rgba(99, 102, 241, 0.04)"
              strokeWidth="0.5"
              fill="none"
            />
          ))
        )}

        {/* Monospace coordinate markers in margins */}
        <text x="3%" y="6%" className="font-mono text-[7px] fill-[rgba(99,102,241,0.06)] uppercase tracking-widest">
          SYS_STATUS: STANDBY
        </text>
        <text x="3%" y="8%" className="font-mono text-[7px] fill-[rgba(99,102,241,0.04)] uppercase tracking-widest">
          PORT: 443 // SSL_ON
        </text>

        <text x="92%" y="6%" className="font-mono text-[7px] fill-[rgba(99,102,241,0.04)] uppercase tracking-widest" textAnchor="end">
          REF_X: 12.04
        </text>
        <text x="92%" y="8%" className="font-mono text-[7px] fill-[rgba(99,102,241,0.04)] uppercase tracking-widest" textAnchor="end">
          REF_Y: 75.82
        </text>

        <text x="3%" y="96%" className="font-mono text-[7px] fill-[rgba(99,102,241,0.04)] uppercase tracking-widest">
          0x00FF3E // CORE_NET
        </text>

        <text x="92%" y="96%" className="font-mono text-[7px] fill-[rgba(99,102,241,0.04)] uppercase tracking-widest" textAnchor="end">
          GRID_SEC: A_04
        </text>
      </svg>
    </div>
  );
}
export default BlueprintGrid;
