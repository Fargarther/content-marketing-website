// src/components/Home/Spotlight/decorations/stickerData.jsx
import React from 'react';

export const SeasonalStickers = {
  // Autumn Leaf
  autumnLeaf: {
    name: 'Autumn Leaf',
    svg: (
      <svg viewBox="0 0 50 50" fill="none">
        <path d="M25 5 C15 15, 10 25, 10 35 C10 40, 15 45, 25 45 C35 45, 40 40, 40 35 C40 25, 35 15, 25 5 Z" 
              fill="#b87333" stroke="#8b5a2b" strokeWidth="1"/>
        <path d="M25 15 L25 40 M18 22 L25 25 L32 22 M20 30 L25 32 L30 30" 
              stroke="#8b5a2b" strokeWidth="1" opacity="0.6"/>
      </svg>
    )
  },
  
  // Spring Herb
  herb: {
    name: 'Fresh Herbs',
    svg: (
      <svg viewBox="0 0 50 50" fill="none">
        <path d="M25 40 C25 35, 25 30, 25 20 M20 35 C20 30, 22 28, 25 25 M30 35 C30 30, 28 28, 25 25" 
              stroke="#7a8b6f" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="35" r="3" fill="#8fa678"/>
        <circle cx="30" cy="35" r="3" fill="#8fa678"/>
        <circle cx="25" cy="20" r="3" fill="#8fa678"/>
        <circle cx="22" cy="28" r="2" fill="#a3b88c"/>
        <circle cx="28" cy="28" r="2" fill="#a3b88c"/>
      </svg>
    )
  },
  
  // Wheat
  wheat: {
    name: 'Wheat',
    svg: (
      <svg viewBox="0 0 50 50" fill="none">
        <path d="M25 45 L25 15" stroke="#c4a57b" strokeWidth="2"/>
        <ellipse cx="25" cy="10" rx="4" ry="6" fill="#d4b896" stroke="#c4a57b" strokeWidth="1"/>
        <ellipse cx="25" cy="18" rx="4" ry="6" fill="#d4b896" stroke="#c4a57b" strokeWidth="1"/>
        <ellipse cx="25" cy="26" rx="4" ry="6" fill="#d4b896" stroke="#c4a57b" strokeWidth="1"/>
        <path d="M21 12 L17 8 M29 12 L33 8 M21 20 L17 16 M29 20 L33 16 M21 28 L17 24 M29 28 L33 24" 
              stroke="#c4a57b" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    )
  },
  
  // Winter Branch
  winterBranch: {
    name: 'Winter Branch',
    svg: (
      <svg viewBox="0 0 50 50" fill="none">
        <path d="M10 40 L25 25 L40 10 M15 30 L20 25 M30 20 L35 15 M20 35 L25 30 M25 20 L30 15" 
              stroke="#8b7d6b" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="15" cy="30" r="2" fill="#e8dcc6"/>
        <circle cx="20" cy="35" r="2" fill="#e8dcc6"/>
        <circle cx="30" cy="20" r="2" fill="#e8dcc6"/>
        <circle cx="35" cy="15" r="2" fill="#e8dcc6"/>
      </svg>
    )
  },
  
  // Summer Sun
  sun: {
    name: 'Summer Sun',
    svg: (
      <svg viewBox="0 0 50 50" fill="none">
        <circle cx="25" cy="25" r="8" fill="#e3c099" stroke="#d4a574" strokeWidth="1"/>
        <path d="M25 10 L25 15 M25 35 L25 40 M40 25 L35 25 M15 25 L10 25 M35 15 L32 18 M18 32 L15 35 M35 35 L32 32 M18 18 L15 15" 
              stroke="#d4a574" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  
  // Mushroom
  mushroom: {
    name: 'Wild Mushroom',
    svg: (
      <svg viewBox="0 0 50 50" fill="none">
        <ellipse cx="25" cy="25" rx="12" ry="8" fill="#c4a27a" stroke="#a08563" strokeWidth="1"/>
        <path d="M20 25 C20 25, 20 35, 22 40 L28 40 C30 35, 30 25, 30 25" 
              fill="#e8dcc6" stroke="#a08563" strokeWidth="1"/>
        <circle cx="20" cy="23" r="2" fill="#a08563" opacity="0.5"/>
        <circle cx="30" cy="22" r="1.5" fill="#a08563" opacity="0.5"/>
        <circle cx="25" cy="24" r="1" fill="#a08563" opacity="0.5"/>
      </svg>
    )
  },
  
  // Rosemary Sprig
  rosemary: {
    name: 'Rosemary',
    svg: (
      <svg viewBox="0 0 50 50" fill="none">
        <path d="M25 45 L25 5" stroke="#7a8b6f" strokeWidth="2"/>
        <path d="M20 10 L25 8 L30 10 M20 15 L25 13 L30 15 M20 20 L25 18 L30 20 M20 25 L25 23 L30 25 M20 30 L25 28 L30 30 M20 35 L25 33 L30 35" 
              stroke="#8fa678" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  },
  
  // Garlic
  garlic: {
    name: 'Garlic Clove',
    svg: (
      <svg viewBox="0 0 50 50" fill="none">
        <ellipse cx="25" cy="28" rx="10" ry="12" fill="#f5f0dc" stroke="#d4ceb5" strokeWidth="1"/>
        <path d="M25 16 C25 16, 23 10, 25 8 C27 10, 25 16, 25 16" fill="#c4b896" stroke="#a09874" strokeWidth="1"/>
        <path d="M20 28 C20 28, 22 35, 25 35 C28 35, 30 28, 30 28" stroke="#d4ceb5" strokeWidth="1" fill="none"/>
        <line x1="25" y1="20" x2="25" y2="32" stroke="#d4ceb5" strokeWidth="0.5"/>
      </svg>
    )
  }
};