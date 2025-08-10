// Eagerly import all grass PNG assets using Vite's import.meta.glob
// This ensures all images are properly bundled and available with hashed URLs

// Import all blade and bud PNGs as URLs (eager loading for immediate availability)
const grassFiles = import.meta.glob('../assets/grass/{blades,buds}/*.png', {
  eager: true,
  query: '?url',
  import: 'default'
});

// Build a map keyed by base filename (e.g., 'blade_green_01.png')
const SPRITES = {};

// Process all imported files
Object.entries(grassFiles).forEach(([path, url]) => {
  // Extract the filename from the path
  const filename = path.split('/').pop(); // e.g., 'blade_green_01.png'
  
  if (filename) {
    SPRITES[filename] = url;
    
    // Also store without extension for convenience
    const nameWithoutExt = filename.replace('.png', '');
    SPRITES[nameWithoutExt] = url;
  }
});

/**
 * Get sprite URL by filename or base name
 * @param {string} name - Filename like 'blade_green_01.png' or 'blade_green_01'
 * @returns {string | undefined} - The bundled URL or undefined if not found
 */
export function spriteUrl(name) {
  if (!name) {
    console.warn('[sprites/grass] spriteUrl called with empty name');
    return undefined;
  }
  
  // Handle potential typos/issues
  // Remove duplicate 'blade_' prefix if present
  const cleanedName = name.replace(/^blade_blade_/, 'blade_');
  
  // Try exact match first
  let url = SPRITES[cleanedName];
  
  // If not found and doesn't have extension, try with .png
  if (!url && !cleanedName.includes('.')) {
    url = SPRITES[cleanedName + '.png'];
  }
  
  // If still not found, try without extension
  if (!url && cleanedName.includes('.')) {
    url = SPRITES[cleanedName.replace('.png', '')];
  }
  
  if (!url) {
    console.warn(`[sprites/grass] Missing sprite: "${name}" (cleaned: "${cleanedName}")`);
    console.warn('[sprites/grass] Available sprites:', Object.keys(SPRITES).filter(k => !k.includes('.')).sort());
  }
  
  return url;
}

/**
 * Get all blade sprite URLs
 * @returns {Object} Map of blade names to URLs
 */
export function getBladeSprites() {
  const blades = {};
  Object.entries(SPRITES).forEach(([name, url]) => {
    if (name.startsWith('blade_') && !name.includes('.')) {
      blades[name] = url;
    }
  });
  return blades;
}

/**
 * Get all bud/seed sprite URLs
 * @returns {Object} Map of bud names to URLs
 */
export function getBudSprites() {
  const buds = {};
  Object.entries(SPRITES).forEach(([name, url]) => {
    if (name.startsWith('seed_') && !name.includes('.')) {
      buds[name] = url;
    }
  });
  return buds;
}

/**
 * List all available sprite keys (without extensions)
 * @returns {string[]} Array of sprite names
 */
export function spriteKeys() {
  return Object.keys(SPRITES).filter(k => !k.includes('.')).sort();
}

/**
 * Check if a sprite exists
 * @param {string} name - Sprite name to check
 * @returns {boolean} True if sprite exists
 */
export function hasSprite(name) {
  if (!name) return false;
  const cleanedName = name.replace(/^blade_blade_/, 'blade_');
  return !!(SPRITES[cleanedName] || SPRITES[cleanedName + '.png'] || SPRITES[cleanedName.replace('.png', '')]);
}

/**
 * Preload an image from a sprite URL
 * @param {string} name - Sprite name
 * @returns {Promise<HTMLImageElement | null>} Promise resolving to loaded image or null
 */
export async function preloadSprite(name) {
  const url = spriteUrl(name);
  if (!url) return null;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[sprites/grass] Failed to preload sprite: "${name}"`);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Preload multiple sprites
 * @param {string[]} names - Array of sprite names
 * @returns {Promise<Object>} Map of names to loaded images (null if failed)
 */
export async function preloadSprites(names) {
  const results = {};
  await Promise.all(
    names.map(async (name) => {
      results[name] = await preloadSprite(name);
    })
  );
  return results;
}

// Export the raw sprite map for debugging
export const SPRITE_MAP = SPRITES;

// Log available sprites in development
if (import.meta.env.DEV) {
  console.log('[sprites/grass] Loaded sprites:', spriteKeys());
}