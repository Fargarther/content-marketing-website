import React from 'react';
import './CloudBand.css';

const CloudBand = () => {
  return (
    <div className="clouds-wrapper">
      {/* BACK LAYER (soft + slow) */}
      <svg className="clouds-svg" viewBox="0 0 2000 400" preserveAspectRatio="none" aria-hidden>
        <defs>
          <symbol id="cloud-a" viewBox="0 0 220 90">
            <path d="M15 65c-8-20 12-40 35-28 10-22 35-30 58-15 8-12 28-18 45-8 18-5 38 8 42 28 16 2 30 12 30 28 0 18-16 30-38 30H45C28 100 20 85 15 65Z"/>
          </symbol>
          <symbol id="cloud-b" viewBox="0 0 260 110">
            <path d="M30 80c-10-25 18-45 42-35 12-20 38-32 62-18 15-22 42-28 65-12 28-6 48 15 48 38 18 3 32 14 32 30 0 20-16 32-40 32H65C45 115 32 100 30 80Z"/>
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
      </svg>

      {/* FRONT LAYER (crisper + faster) */}
      <svg className="clouds-svg" viewBox="0 0 2000 400" preserveAspectRatio="none" aria-hidden>
        <defs>
          <symbol id="cloud-c" viewBox="0 0 200 85">
            <path d="M20 60c-7-18 14-35 32-25 7-15 25-22 42-12 10-14 30-20 48-10 15-4 32 6 38 22 14 2 25 11 25 24 0 15-13 25-32 25H42C30 84 22 72 20 60Z"/>
          </symbol>
          <symbol id="cloud-d" viewBox="0 0 240 95">
            <path d="M22 75c-8-24 20-42 45-32 10-18 34-28 56-14 12-16 35-22 54-8 24-4 42 14 42 35 15 2 28 12 28 27 0 18-15 29-36 29H50C35 112 28 98 22 75Z"/>
          </symbol>
          <symbol id="cloud-e" viewBox="0 0 190 75">
            <path d="M25 58c-6-15 10-28 26-22 6-13 20-18 35-10 9-12 26-17 40-8 18-2 33 10 33 25 10 1 20 7 20 17 0 11-10 19-25 19H40C29 79 24 68 25 58Z"/>
          </symbol>
          <symbol id="cloud-f" viewBox="0 0 210 88">
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