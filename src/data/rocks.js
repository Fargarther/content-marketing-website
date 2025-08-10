// Rock data with normalized positions and layering
// x: 0-1 normalized position across width
// z: 0=back, 1=mid, 2=front (for parallax layers)
// w/h: width/height in pixels
// hue: hue rotation from base earth tone
// seed: for generating unique pebble shapes

export const rocks = [
  // Background layer (z=0) - smaller, muted
  { x: 0.08, z: 0, w: 18, h: 14, hue: -5, seed: 42 },
  { x: 0.22, z: 0, w: 20, h: 16, hue: 8, seed: 17 },
  { x: 0.45, z: 0, w: 16, h: 13, hue: -10, seed: 93 },
  { x: 0.71, z: 0, w: 19, h: 15, hue: 5, seed: 64 },
  { x: 0.89, z: 0, w: 17, h: 14, hue: -8, seed: 28 },
  
  // Middle layer (z=1) - medium sized
  { x: 0.15, z: 1, w: 26, h: 20, hue: 12, seed: 73 },
  { x: 0.34, z: 1, w: 28, h: 22, hue: -15, seed: 51 },
  { x: 0.52, z: 1, w: 24, h: 19, hue: 7, seed: 89 },
  { x: 0.68, z: 1, w: 27, h: 21, hue: -12, seed: 36 },
  { x: 0.83, z: 1, w: 25, h: 20, hue: 10, seed: 45 },
  { x: 0.94, z: 1, w: 23, h: 18, hue: -6, seed: 82 },
  
  // Foreground layer (z=2) - larger, more prominent
  { x: 0.12, z: 2, w: 34, h: 26, hue: 15, seed: 61 },
  { x: 0.28, z: 2, w: 36, h: 28, hue: -18, seed: 29 },
  { x: 0.41, z: 2, w: 32, h: 25, hue: 8, seed: 77 },
  { x: 0.58, z: 2, w: 35, h: 27, hue: -14, seed: 14 },
  { x: 0.76, z: 2, w: 33, h: 26, hue: 11, seed: 56 },
  { x: 0.91, z: 2, w: 31, h: 24, hue: -9, seed: 38 }
];

// Helper to generate pebble vertices with noise
export function generatePebbleVertices(seed, w, h) {
  const rng = (s) => {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  const vertices = [];
  const numVertices = 5 + Math.floor(rng(seed) * 3); // 5-7 vertices
  
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const radiusX = w / 2;
    const radiusY = h / 2;
    
    // Add noise to create organic shape
    const noise = 0.7 + rng(seed + i * 17) * 0.3; // 0.7-1.0 variation
    const x = Math.cos(angle) * radiusX * noise;
    const y = Math.sin(angle) * radiusY * noise;
    
    vertices.push({ x, y });
  }
  
  return vertices;
}

// Helper to compute color from hue rotation
export function getRockColor(hue, layer) {
  // Base earth tones
  const baseHue = 35; // warm brown/tan
  const baseSat = layer === 0 ? 15 : layer === 1 ? 20 : 25; // Less saturated in back
  const baseLightness = layer === 0 ? 48 : layer === 1 ? 45 : 42; // Lighter in back
  
  return {
    hue: baseHue + hue,
    saturation: baseSat,
    lightness: baseLightness
  };
}