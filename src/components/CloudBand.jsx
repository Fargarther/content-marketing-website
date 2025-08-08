import React from "react";

const CloudBand = ({
  height = 280,
  speedFront = 60,
  speedMid = 95,
  speedBack = 140,
  opacityFront = 0.95,
  opacityMid = 0.7,
  opacityBack = 0.5,
  idPrefix = "cloudband",
  className = ""
}) => {
  const blurS = `${idPrefix}-blur-s`;
  const blurM = `${idPrefix}-blur-m`;
  const fadeY = `${idPrefix}-fade-y`;
  const maskId = `${idPrefix}-mask`;
  const drop = `${idPrefix}-drop`;

  return (
    <div
      className={className}
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1 }}
      aria-hidden
    >
      {/* Inline styles so it works out-of-the-box in Vite */}
      <style>{`
        .cb-wrap { pointer-events:none; position:absolute; inset:0; overflow:hidden; z-index:0; 
          background: linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 60%, #E0F6FF 100%); }
        .cb-svg { width:200%; height:100%; display:block; }
        @keyframes cb-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes cb-bob1 { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-6px);} }
        @keyframes cb-bob2 { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-10px);} }
        @keyframes cb-breathe { 0%,100%{ transform: scale(1);} 50%{ transform: scale(1.02);} }
        .cb-track { animation: cb-scroll ${speedFront}s linear infinite; }
        .cb-track.mid { animation-duration: ${speedMid}s; filter: url(#${blurS}); }
        .cb-track.back { animation-duration: ${speedBack}s; filter: url(#${blurM}); }
        .cb-bob1 { animation: cb-bob1 9s ease-in-out infinite alternate; }
        .cb-bob2 { animation: cb-bob2 12s ease-in-out infinite alternate; }
        .cb-breathe { animation: cb-breathe 16s ease-in-out infinite; transform-origin:center; }
        .cb-d1 { animation-delay:-2s; } .cb-d2 { animation-delay:-4s; } .cb-d3 { animation-delay:-6s; } .cb-d4 { animation-delay:-8s; }
        @media (prefers-reduced-motion: reduce){ .cb-track,.cb-bob1,.cb-bob2,.cb-breathe{ animation:none!important; } }
        @media (prefers-color-scheme: dark){ .cb-wrap{ background: linear-gradient(to bottom, #16243e, #1f3355 55%, #2a4365); } }
      `}</style>

      <div className="cb-wrap">
        {/* Shared defs (filters, symbols, mask, drop shadow) */}
        <svg width={0} height={0} aria-hidden focusable="false">
          <defs>
            <filter id={blurS}><feGaussianBlur stdDeviation="0.6"/></filter>
            <filter id={blurM}><feGaussianBlur stdDeviation="1.2"/></filter>
            {/* Soft vertical fade for top/bottom edges */}
            <linearGradient id={fadeY} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000" stopOpacity="0"/>
              <stop offset="20%" stopColor="#000" stopOpacity="1"/>
              <stop offset="80%" stopColor="#000" stopOpacity="1"/>
              <stop offset="100%" stopColor="#000" stopOpacity="0"/>
            </linearGradient>
            <mask id={maskId}><rect width="100%" height="100%" fill={`url(#${fadeY})`} /></mask>
            {/* Subtle drop shadow to ensure clouds pop on bright skies */}
            <filter id={drop} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.18" />
            </filter>
            {/* Cloud shapes */}
            <symbol id={`${idPrefix}-a`} viewBox="0 0 220 90">
              <path d="M25 70c-6-22 15-38 38-30 8-17 31-26 52-12 10-15 33-21 51-7 22-3 40 12 40 32 14 1 26 10 26 25 0 16-14 27-34 27H55C41 105 31 92 25 70Z"/>
            </symbol>
            <symbol id={`${idPrefix}-b`} viewBox="0 0 180 70">
              <path d="M18 55c-5-16 11-30 28-24 5-12 22-19 38-9 8-13 28-19 43-6 20-3 35 9 35 24 12 1 22 8 22 19 0 12-11 21-28 21H38C26 80 19 70 18 55Z"/>
            </symbol>
            <symbol id={`${idPrefix}-c`} viewBox="0 0 260 110">
              <path d="M30 85c-7-26 17-45 46-36 9-20 36-31 62-14 12-19 40-28 62-10 27-4 48 13 48 37 16 1 30 11 30 29 0 18-16 31-39 31H58C42 122 32 106 30 85Z"/>
            </symbol>
            <symbol id={`${idPrefix}-d`} viewBox="0 0 200 80">
              <path d="M22 60c-5-20 12-35 32-28 6-14 25-22 43-10 9-15 30-21 46-7 21-3 37 10 37 29 13 1 24 9 24 22 0 14-12 24-30 24H44C31 90 23 79 22 60Z"/>
            </symbol>
            <symbol id={`${idPrefix}-e`} viewBox="0 0 210 90">
              <path d="M24 68c-6-21 13-37 36-29 7-16 28-25 48-12 9-15 31-22 49-7 23-3 40 11 40 31 14 1 26 9 26 24 0 15-13 26-32 26H48C34 101 26 89 24 68Z"/>
            </symbol>
            <symbol id={`${idPrefix}-f`} viewBox="0 0 240 100">
              <path d="M35 74c-6-22 13-42 39-33 8-18 30-28 53-13 11-18 36-26 56-9 25-4 44 12 44 34 15 1 28 10 28 26 0 17-14 29-35 29H58C43 108 35 95 35 74Z"/>
            </symbol>
          </defs>
        </svg>

        {/* BACK LAYER */}
        <svg className="cb-svg" viewBox="0 0 2000 400" preserveAspectRatio="none" mask={`url(#${maskId})`}>
          <g className="cb-track back" fill="#ffffff" fillOpacity={opacityBack}>
            <g className="cb-bob1 cb-d1"><use href={`#${idPrefix}-c`} x={40} y={40} width={340} height={144} /></g>
            <g className="cb-bob2 cb-d2"><use href={`#${idPrefix}-f`} x={420} y={55} width={380} height={158} /></g>
            <g className="cb-bob1 cb-d3"><use href={`#${idPrefix}-e`} x={860} y={30} width={320} height={140} /></g>
            <g className="cb-bob2 cb-d4"><use href={`#${idPrefix}-c`} x={1220} y={50} width={360} height={152} /></g>
            <g className="cb-bob1 cb-d2"><use href={`#${idPrefix}-f`} x={1620} y={35} width={400} height={168} /></g>
            {/* Track B */}
            <g className="cb-bob2 cb-d3"><use href={`#${idPrefix}-c`} x={2040} y={40} width={340} height={144} /></g>
            <g className="cb-bob1 cb-d4"><use href={`#${idPrefix}-f`} x={2420} y={55} width={380} height={158} /></g>
            <g className="cb-bob2 cb-d1"><use href={`#${idPrefix}-e`} x={2860} y={30} width={320} height={140} /></g>
          </g>
        </svg>

        {/* MID LAYER */}
        <svg className="cb-svg" viewBox="0 0 2000 400" preserveAspectRatio="none" mask={`url(#${maskId})`}>
          <g className="cb-track mid" fill="#ffffff" fillOpacity={opacityMid}>
            <g className="cb-bob2 cb-d1 cb-breathe"><use href={`#${idPrefix}-a`} x={0} y={95} width={260} height={110} /></g>
            <g className="cb-bob1 cb-d2 cb-breathe"><use href={`#${idPrefix}-d`} x={270} y={120} width={220} height={94} /></g>
            <g className="cb-bob2 cb-d3 cb-breathe"><use href={`#${idPrefix}-b`} x={520} y={105} width={230} height={92} /></g>
            <g className="cb-bob1 cb-d4 cb-breathe"><use href={`#${idPrefix}-e`} x={780} y={115} width={260} height={110} /></g>
            <g className="cb-bob2 cb-d1 cb-breathe"><use href={`#${idPrefix}-a`} x={1060} y={100} width={260} height={110} /></g>
            <g className="cb-bob1 cb-d2 cb-breathe"><use href={`#${idPrefix}-d`} x={1340} y={125} width={220} height={94} /></g>
            <g className="cb-bob2 cb-d3 cb-breathe"><use href={`#${idPrefix}-b`} x={1600} y={110} width={230} height={92} /></g>
            {/* Track B */}
            <g className="cb-bob1 cb-d4 cb-breathe"><use href={`#${idPrefix}-e`} x={2000} y={115} width={260} height={110} /></g>
            <g className="cb-bob2 cb-d1 cb-breathe"><use href={`#${idPrefix}-a`} x={2280} y={100} width={260} height={110} /></g>
            <g className="cb-bob1 cb-d2 cb-breathe"><use href={`#${idPrefix}-d`} x={2560} y={125} width={220} height={94} /></g>
          </g>
        </svg>

        {/* FRONT LAYER */}
        <svg className="cb-svg" viewBox="0 0 2000 400" preserveAspectRatio="none" mask={`url(#${maskId})`}>
          <g className="cb-track" fill="#ffffff" fillOpacity={opacityFront} filter={`url(#${drop})`}>
            <g className="cb-bob1 cb-d1 cb-breathe"><use href={`#${idPrefix}-b`} x={20} y={160} width={180} height={70} /></g>
            <g className="cb-bob2 cb-d2 cb-breathe"><use href={`#${idPrefix}-a`} x={220} y={140} width={200} height={80} /></g>
            <g className="cb-bob1 cb-d3 cb-breathe"><use href={`#${idPrefix}-d`} x={440} y={155} width={210} height={82} /></g>
            <g className="cb-bob2 cb-d4 cb-breathe"><use href={`#${idPrefix}-b`} x={680} y={165} width={180} height={70} /></g>
            <g className="cb-bob1 cb-d1 cb-breathe"><use href={`#${idPrefix}-a`} x={900} y={150} width={200} height={80} /></g>
            <g className="cb-bob2 cb-d2 cb-breathe"><use href={`#${idPrefix}-d`} x={1120} y={160} width={210} height={82} /></g>
            <g className="cb-bob1 cb-d3 cb-breathe"><use href={`#${idPrefix}-b`} x={1360} y={170} width={180} height={70} /></g>
            <g className="cb-bob2 cb-d4 cb-breathe"><use href={`#${idPrefix}-a`} x={1560} y={145} width={200} height={80} /></g>
            {/* Track B */}
            <g className="cb-bob1 cb-d2 cb-breathe"><use href={`#${idPrefix}-d`} x={2000} y={160} width={210} height={82} /></g>
            <g className="cb-bob2 cb-d3 cb-breathe"><use href={`#${idPrefix}-b`} x={2240} y={170} width={180} height={70} /></g>
            <g className="cb-bob1 cb-d4 cb-breathe"><use href={`#${idPrefix}-a`} x={2440} y={145} width={200} height={80} /></g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default CloudBand;