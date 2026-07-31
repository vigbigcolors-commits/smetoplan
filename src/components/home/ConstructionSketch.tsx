'use client';

/**
 * Symbolic construction calc → elegant slab foundation.
 * Loop: numbers → formula → result → structure.
 */
export function ConstructionSketch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 340"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="fxLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8FCB8F" />
          <stop offset="100%" stopColor="#7EB6E0" />
        </linearGradient>
        <linearGradient id="fxSlab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A2C8E8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3D6494" stopOpacity="0.12" />
        </linearGradient>
        <filter id="fxGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* —— PHASE 1: INPUT NUMBERS —— */}
      <g className="fx-nums" fontFamily="var(--font-plex-mono), ui-monospace, monospace">
        <text className="fx-fade fx-d1" x="40" y="58" fill="#8FCB8F" fontSize="11" letterSpacing="1.5">
          ВВОД
        </text>
        <text className="fx-fade fx-d2" x="40" y="86" fill="#E8F0F8" fontSize="22" fontWeight="600">
          L = 12.0
        </text>
        <text className="fx-fade fx-d3" x="40" y="116" fill="#E8F0F8" fontSize="22" fontWeight="600">
          W = 8.0
        </text>
        <text className="fx-fade fx-d4" x="40" y="146" fill="#E8F0F8" fontSize="22" fontWeight="600">
          H = 0.40
        </text>
        <text className="fx-fade fx-d5" x="40" y="172" fill="#7EB6E0" fontSize="12">
          м · плита
        </text>
      </g>

      {/* —— PHASE 2: FORMULA / CALC —— */}
      <g className="fx-calc" fontFamily="var(--font-plex-mono), ui-monospace, monospace">
        <text className="fx-fade fx-d6" x="230" y="58" fill="#A2C8E8" fontSize="11" letterSpacing="1.5">
          РАСЧЁТ
        </text>
        <text className="fx-fade fx-d7" x="230" y="88" fill="#C8D9EA" fontSize="15">
          V = L × W × H
        </text>
        <text className="fx-fade fx-d8" x="230" y="114" fill="#8FCB8F" fontSize="14">
          12 × 8 × 0.4
        </text>
        <path
          className="fx-stroke fx-d9"
          d="M230 128 H360"
          stroke="url(#fxLine)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* ticking dots */}
        <circle className="fx-pulse fx-d8" cx="248" cy="148" r="2.2" fill="#8FCB8F" />
        <circle className="fx-pulse fx-d9" cx="262" cy="148" r="2.2" fill="#7EB6E0" />
        <circle className="fx-pulse fx-d10" cx="276" cy="148" r="2.2" fill="#A2C8E8" />
      </g>

      {/* Smetoplan assistant chip */}
      <g className="fx-assist">
        <rect
          className="fx-fade fx-d7"
          x="300"
          y="160"
          width="132"
          height="28"
          rx="8"
          fill="#0E1624"
          fillOpacity="0.55"
          stroke="#6B93C4"
          strokeOpacity="0.55"
        />
        <text
          className="fx-fade fx-d8"
          x="366"
          y="178"
          textAnchor="middle"
          fill="#A2C8E8"
          fontSize="10"
          fontFamily="var(--font-display), sans-serif"
          fontWeight="700"
          letterSpacing="0.8"
        >
          SMETOPLAN · AI
        </text>
      </g>

      {/* —— PHASE 3: RESULT —— */}
      <g className="fx-result" fontFamily="var(--font-plex-mono), ui-monospace, monospace">
        <text className="fx-fade fx-fade-early fx-d11" x="40" y="210" fill="#8FCB8F" fontSize="11" letterSpacing="1.5">
          РЕЗУЛЬТАТ
        </text>
        <text className="fx-fade fx-fade-early fx-d12" x="40" y="242" fill="#FFFFFF" fontSize="28" fontWeight="700" filter="url(#fxGlow)">
          38.4 м³
        </text>
        <text className="fx-fade fx-fade-early fx-d13" x="40" y="268" fill="#A2C8E8" fontSize="13">
          бетон М300
        </text>
        <text className="fx-fade fx-fade-early fx-d14" x="40" y="292" fill="#8FCB8F" fontSize="13">
          арматура Ø12 · 1 860 кг
        </text>
      </g>

      {/* —— PHASE 4: FOUNDATION STRUCTURE —— */}
      <g className="fx-struct" transform="translate(248 188)">
        {/* soil line */}
        <path
          className="fx-stroke fx-d15"
          d="M12 92 H228"
          stroke="#8FCB8F"
          strokeWidth="1.4"
          strokeDasharray="4 3"
          opacity="0.7"
        />

        {/* slab body */}
        <path
          className="fx-stroke fx-d16"
          d="M18 92 V62 H212 V92"
          stroke="#7EB6E0"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path className="fx-fill fx-d17" d="M18 62 H212 V92 H18 Z" fill="url(#fxSlab)" />

        {/* perimeter rib */}
        <path
          className="fx-stroke fx-d18"
          d="M18 92 V108 H48 V92 M182 92 V108 H212 V92"
          stroke="#A2C8E8"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* rebar grid */}
        <path
          className="fx-stroke fx-d19"
          d="M34 70 H196 M34 78 H196 M34 86 H196"
          stroke="#8FCB8F"
          strokeWidth="1.2"
          opacity="0.85"
        />
        <path
          className="fx-stroke fx-d20"
          d="M52 66 V90 M78 66 V90 M104 66 V90 M130 66 V90 M156 66 V90 M182 66 V90"
          stroke="#7EB6E0"
          strokeWidth="1.15"
          opacity="0.9"
        />

        {/* center mark */}
        <path
          className="fx-stroke fx-d21"
          d="M115 54 V48 M112 51 H118"
          stroke="#A2C8E8"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* dimension */}
        <path
          className="fx-stroke fx-d22"
          d="M18 118 H212 M18 114 V122 M212 114 V122"
          stroke="#6B93C4"
          strokeWidth="1.3"
        />
        <text
          className="fx-fade fx-d22"
          x="115"
          y="136"
          textAnchor="middle"
          fill="#A2C8E8"
          fontSize="10"
          fontFamily="var(--font-plex-mono), ui-monospace, monospace"
        >
          12.0 × 8.0 м
        </text>
      </g>
    </svg>
  );
}
