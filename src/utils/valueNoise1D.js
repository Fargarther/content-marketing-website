/**
 * Lightweight 1D value noise for organic wind field variation
 * No dependencies, pure JS implementation
 */

// Simple integer hash for pseudo-random values
function hash(n) {
  n = (n ^ 61) ^ (n >> 16);
  n = n + (n << 3);
  n = n ^ (n >> 4);
  n = n * 0x27d4eb2d;
  n = n ^ (n >> 15);
  return n;
}

// Convert hash to float in [-1, 1]
function hashToFloat(n) {
  return (hash(n) & 0x7fffffff) / 0x3fffffff - 1.0;
}

// Smooth interpolation curve
function smoothstep(t) {
  return t * t * (3.0 - 2.0 * t);
}

/**
 * Sample 1D value noise at position x
 * @param {number} x - Position to sample
 * @param {number} seed - Seed for variation (default 0)
 * @returns {number} Value in range [-1, 1]
 */
export function valueNoise1D(x, seed = 0) {
  const seedOffset = seed * 1000;
  const fx = Math.floor(x);
  const frac = x - fx;
  
  // Get values at integer positions
  const v0 = hashToFloat(fx + seedOffset);
  const v1 = hashToFloat(fx + 1 + seedOffset);
  
  // Smooth interpolation
  const t = smoothstep(frac);
  return v0 * (1 - t) + v1 * t;
}

/**
 * Sample wind field with spatiotemporal variation
 * Returns small offset for wind perturbation
 * @param {number} x - Spatial position
 * @param {number} t - Time
 * @param {number} cohortPhase - Additional phase for cohort variation
 * @returns {number} Wind offset in range ~[-0.008, +0.008]
 */
export function sampleWindField(x, t, cohortPhase = 0) {
  // Two octaves of noise at different scales and speeds
  const octave1 = valueNoise1D(x * 0.003 - t * 0.15, 42) * 0.005;
  const octave2 = valueNoise1D(x * 0.007 + t * 0.08, 137) * 0.003;
  
  // Add cohort-based phase shift to prevent perfect alignment
  const cohortOffset = Math.sin(cohortPhase + t * 0.1) * 0.001;
  
  return octave1 + octave2 + cohortOffset;
}

// Fallback implementation using sine waves if noise feels too heavy
export function sampleWindFieldSines(x, t, cohortPhase = 0, seedPhase = 0) {
  const a = Math.sin(x * 0.012 - t * 0.22 + cohortPhase) * 0.006;
  const b = Math.sin(x * 0.025 + t * 0.35 + seedPhase) * 0.004;
  return a + b;
}

export default { valueNoise1D, sampleWindField, sampleWindFieldSines };