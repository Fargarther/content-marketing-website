import React from 'react';
import './CloudBand.css';

const CloudBand = () => {
  return (
    <div className="clouds-wrapper">
      {/* BACK LAYER (soft + slow) */}
      <svg className="clouds-svg" viewBox="0 0 2000 400" preserveAspectRatio="none" aria-hidden>
        <defs>
          <symbol id="cloud-a" viewBox="0 0 230 120">
            <path fill="white" opacity="0.92"
              d="M22 70c-8-24 22-46 49-37 8-18 33-30 54-20 14-18 45-22 68-8
                 23-5 41 16 41 36 18 2 32 18 32 38
                 0 22-20 38-50 38H58
                 C36 117 26 95 22 70Z" />
          </symbol>
          <symbol id="cloud-b" viewBox="0 0 260 110">
            <path d="M30 80c-10-25 18-45 42-35 12-20 38-32 62-18 15-22 42-28 65-12 28-6 48 15 48 38 18 3 32 14 32 30 0 20-16 32-40 32H65C45 115 32 100 30 80Z"/>
          </symbol>
          <symbol id="cloud-slim" viewBox="0 0 280 90">
            <path fill="white" opacity="0.88"
              d="M18 48c-6-18 18-34 44-28 10-14 34-20 54-12 16-12 40-14 62-4
                 22-2 36 14 36 28 14 2 26 12 26 24
                 0 18-18 26-40 26H56
                 C38 82 26 66 18 48Z" />
          </symbol>
          <symbol id="cloud-cirrus" viewBox="0 0 320 60">
            <path fill="white" opacity="0.75"
              d="M10 42c-5-16 18-28 36-22 12-10 30-14 48-8
                 22-10 52-10 76 2 28-6 54 6 58 22
                 18 2 30 12 30 22
                 0 14-16 22-36 22H46
                 C28 58 16 50 10 42Z" />
          </symbol>
        </defs>

        <g className="track back" fill="#fff" fillOpacity="var(--op-back)">
          {/* Track A */}
          <g className="bob-1 d1"><use href="#cloud-a" x="60"  y="40"  width="280" height="115"/></g>
          <g className="bob-2 d2"><use href="#cloud-b" x="380" y="65"  width="400" height="165"/></g>
          <g className="bob-1 d3"><use href="#cloud-a" x="850" y="30"  width="320" height="130"/></g>
          <g className="bob-2 d4"><use href="#cloud-b" x="1200" y="55" width="380" height="155"/></g>
          <g className="bob-1 d2"><use href="#cloud-a" x="1620" y="35" width="300" height="125"/></g>
          {/* Track B (offset by 2000) */}
          <g className="bob-2 d3"><use href="#cloud-b" x="2060" y="45"  width="390" height="160"/></g>
          <g className="bob-1 d4"><use href="#cloud-a" x="2480" y="60"  width="310" height="125"/></g>
          <g className="bob-2 d1"><use href="#cloud-b" x="2820" y="30"  width="370" height="150"/></g>
        </g>
        {/* High, wispy cirrus (very thin, near the top) */}
        <g opacity="0.65">
          <g className="track">
            <g className="bob-1"><use href="#cloud-cirrus" x="420" y="6" width="300" height="66"/></g>
          </g>
          <g className="track offset">
            <g className="bob-2"><use href="#cloud-cirrus" x="2420" y="10" width="320" height="70"/></g>
          </g>
        </g>

        {/* Slim mid/high altitude shapes (still in the back lane) */}
        <g opacity="0.8">
          <g className="track">
            <g className="bob-1"><use href="#cloud-slim" x="180" y="12" width="260" height="80"/></g>
            <g className="bob-2"><use href="#cloud-slim" x="980" y="18" width="240" height="76"/></g>
          </g>
          <g className="track offset">
            <g className="bob-1"><use href="#cloud-slim" x="2180" y="12" width="260" height="80"/></g>
            <g className="bob-2"><use href="#cloud-slim" x="2980" y="18" width="240" height="76"/></g>
          </g>
        </g>
      </svg>

      {/* FRONT LAYER (crisper + faster) */}
      <svg className="clouds-svg" viewBox="0 0 2000 400" preserveAspectRatio="none" aria-hidden>
        <defs>
          <symbol id="cloud-c" viewBox="0 0 200 85">
            <path d="M20 60c-7-18 14-35 32-25 7-15 25-22 42-12 10-14 30-20 48-10 15-4 32 6 38 22 14 2 25 11 25 24 0 15-13 25-32 25H42C30 84 22 72 20 60Z"/>
          </symbol>
          <symbol id="cloud-d" viewBox="0 0 240 125">
            <path fill="white" opacity="0.95"
              d="M24 78c-8-22 20-42 45-32 10-18 36-28 56-16 14-16 40-22 60-9
                 24-4 42 16 42 34 15 3 28 14 28 30
                 0 20-18 33-44 33H52
                 C36 118 28 98 24 78Z" />
          </symbol>
          <symbol id="cloud-e" viewBox="0 0 190 95">
            <path d="M25 58c-6-15 10-28 26-22 6-13 20-18 35-10 9-12 26-17 40-8 18-2 33 10 33 25 10 1 20 7 20 17 0 11-10 19-25 19H40C29 79 24 68 25 58Z"/>
          </symbol>
          <symbol id="cloud-f" viewBox="0 0 210 108">
            <path d="M28 68c-5-20 16-36 36-28 9-16 30-24 50-11 11-14 32-19 50-6 20-3 38 11 38 30 13 1 24 9 24 23 0 15-13 25-32 25H52C39 101 32 88 28 68Z"/>
          </symbol>
        </defs>

        <g className="track" fill="#fff" fillOpacity="var(--op-front)">
          {/* Track A */}
          <g className="bob-1 d1"><use href="#cloud-c" x="10"   y="150" width="220" height="85"/></g>
          <g className="bob-2 d2"><use href="#cloud-e" x="260"  y="125" width="190" height="75"/></g>
          <g className="bob-1 d3"><use href="#cloud-d" x="480"  y="160" width="260" height="100"/></g>
          <g className="bob-2 d4"><use href="#cloud-f" x="770"  y="135" width="210" height="88"/></g>
          <g className="bob-1 d1"><use href="#cloud-c" x="1020" y="155" width="200" height="85"/></g>
          <g className="bob-2 d2"><use href="#cloud-d" x="1280" y="130" width="240" height="95"/></g>
          <g className="bob-1 d3"><use href="#cloud-e" x="1560" y="160" width="180" height="72"/></g>
          <g className="bob-2 d4"><use href="#cloud-f" x="1780" y="140" width="220" height="90"/></g>
          {/* Track B */}
          <g className="bob-1 d1"><use href="#cloud-d" x="2030" y="135" width="250" height="98"/></g>
          <g className="bob-2 d2"><use href="#cloud-c" x="2320" y="155" width="210" height="85"/></g>
          <g className="bob-1 d3"><use href="#cloud-e" x="2560" y="145" width="195" height="78"/></g>
          <g className="bob-2 d4"><use href="#cloud-f" x="2790" y="130" width="230" height="92"/></g>
        </g>
      </svg>
    </div>
  );
};

export default CloudBand;
