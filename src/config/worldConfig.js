/**
 * World Configuration
 * Centralized settings for the horizontal "Prairie" portfolio layout.
 */

// 1. Layout & Dimensions
export const PANEL_COUNT = 5; // Number of horizontal screen-width panels
export const GROUND_VISUAL_HEIGHT = 100; // px (Visual height of the ground strip)

// 2. Physics & Interaction
export const SCROLL_FRICTION = 0.88; // Friction factor (0-1) for inertial scroll
export const SCROLL_VELOCITY_LIMIT = 0.2; // Velocity threshold to stop animation
export const TOUCH_SENSITIVITY = 1.0; // Multiplier for touch drag to scroll pixels

// 3. Grass System
export const GRASS_CHUNKS_PER_SCREEN = 1; // roughly one screen width per chunk? 
// Actually, PrairieGrass definition uses 2000px constant.
export const GRASS_CHUNK_SIZE = 2000;
export const GRASS_BASE_DAMPING = 0.92;
export const GRASS_BREEZE_LEVELS = {
    calm: 0.5,
    medium: 1.0,
    strong: 1.8,
    storm: 2.5
};

// 4. Sky System
export const CLOUD_SPEED_FACTOR = 0.8; // Global multiplier for cloud movement
export const CLOUD_PARALLAX_BASE = 0.05;

// 5. Colors (Synced with CSS variables where possible)
export const GROUND_COLOR_DEFAULT = '#c4b5a0';
export const SKY_GRADIENT_START = '#e6e2d0';
export const SKY_GRADIENT_END = '#e6e2d0'; // Flat beige for now
