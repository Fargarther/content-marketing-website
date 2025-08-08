# Prairie Grass Assets Setup

## Directory Structure

The grass assets should be organized in the following structure:

```
src/assets/grass/
├── blades/         # Individual grass blade sprites
├── buds/           # Seedhead/bud sprites
└── clumps/         # Mixed grass clump sprites (optional)
```

## Adding New Grass Assets

1. **Place your grass images** in the appropriate subdirectory:
   - Blade images go in `src/assets/grass/blades/`
   - Seedhead/bud images go in `src/assets/grass/buds/`
   - Clump images go in `src/assets/grass/clumps/`

2. **Update grassManifest.json** located at `src/data/grassManifest.json`:

```json
{
  "blades": [
    { "name": "blade_green_01", "palette": "green" },
    // Add new blade entries here
  ],
  "buds": [
    { "name": "seed_head_01", "palette": "green" },
    // Add new bud entries here
  ],
  "clumps": [
    // Add clump entries here if using
  ],
  "path": "/src/assets/grass/",
  "densitySuffix": "",
  "ext": "png"
}
```

## Asset Requirements

- **Format**: PNG with transparent background (WebP also supported)
- **Recommended Size**: 
  - Blades: 50-150px height
  - Buds: 30-80px height
  - Clumps: 100-200px width
- **Naming Convention**: `type_variant_number.png` (e.g., `blade_green_01.png`)

## Customizing Animation

The prairie grass animation can be tuned in `src/components/PrairieGrass.jsx`:

- **Physics Constants**:
  - `stiffness`: Spring stiffness (default: 0.15)
  - `damping`: Damping factor (default: 0.88)
  - `influence`: Mouse interaction radius (default: 100px)

- **Layer Configuration**:
  - Adjust `density`, `scale`, and `opacity` in the layers array
  - Modify wind effect intensity in the `windBase` calculation

## Adding Your Headshot

Replace the placeholder headshot by passing your image URL to the Headshot component in `src/pages/Home.jsx`:

```jsx
<Headshot src="/path/to/your/headshot.jpg" />
```

## Performance Notes

- Images are lazy-loaded for optimal performance
- Canvas animation pauses when offscreen (IntersectionObserver)
- Respects `prefers-reduced-motion` for accessibility
- Device pixel ratio aware for crisp rendering on high-DPI displays