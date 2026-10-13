# Spatial UI Design System — Route Sense

## 1. Overview & Philosophy
Route Sense is designed around a coherent spatial interface rather than a conventional administrative dashboard with an embedded map. It functions as an intuitive mobility command surface for India: calm, intelligent, immersive, and responsive.

Visual depth, layering, and geographic context are utilized to communicate hierarchy and guide the user through the primary journey workflow:
`Source ➔ Destination ➔ Find Journeys ➔ Compare Results ➔ View Journey`

---

## 2. Spatial Design Tokens & Palette

| Token | Value | Purpose |
|---|---|---|
| Deep Midnight Navy | `#070b14` / `#090d16` | Viewport background & canvas base |
| Spatial Surface / Glass | `rgba(15, 23, 42, 0.75)` | Translucent floating command panels |
| Spatial Border | `rgba(51, 65, 85, 0.8)` | Subtle elevation borders |
| Active Route Corridor | `#06b6d4` / `#14b8a6` | Cyan & teal glowing path vectors |
| Departure Beacon | `#10b981` | Pulsing emerald origin indicator |
| Destination Beacon | `#f43f5e` | Pulsing rose destination indicator |
| Waypoint / Transfer Point | `#38bdf8` | High-contrast transit interchange node |
| Amber Warning / Surge | `#f59e0b` | Congestion & dynamic pricing alert |
| High-Contrast Text | `#f8fafc` / `#94a3b8` | Readable labels with 4.5:1+ contrast ratio |

---

## 3. Spatial Layout Architecture

### 3.1 Desktop Layout
- **Viewport Canvas**: A fluid, full-viewport interactive map canvas provides continuous geographic orientation.
- **Floating Command Panel**: Anchored to the left (480px width), featuring backdrop blur (`backdrop-blur-2xl`), soft elevation shadows, and a clean two-parameter search form.
- **Comparison Drawer**: Compact journey cards with clear price hierarchy, duration, and operator attribution. Selecting a card immediately focuses the route on the spatial map.
- **Itinerary Inspector**: Expandable step-by-step corridor breakdown. Clicking individual steps highlights the corresponding route leg.

### 3.2 Mobile Layout
- Converted into a stacked, touch-optimized fluid interface.
- Search form remains full-width and thumb-accessible.
- Interactive map is placed directly below the search panel (min-height: 420px) with touch pinch-to-zoom and pan support.
- Zero forced horizontal scrolling or cramped microscopic cards.

---

## 4. Map Interactions & Resilient Fallback

1. **Beacon Markers**: Origin and Destination are rendered as CSS-animated beacons (`marker-beacon-start` and `marker-beacon-end`) with pulsating rings.
2. **Glowing Corridors**: Routes are drawn with a dual-pass polyline: an outer diffused glowing stroke (width: 9px, opacity: 0.25) and an inner crisp vector stroke (width: 4.5px, opacity: 0.95).
3. **Floating Spatial Controls**: In-canvas buttons for Zoom In, Zoom Out, Fit to Route (re-center bounds), and Style Layer Switch (Dark Spatial / Light Carto).
4. **Resilient Degradation**: If WebGL or map tiles encounter network interruptions, the application seamlessly presents an integrated Spatial Corridor Vector Diagram ensuring that journey distance, steps, and fare details remain completely accessible without throwing unhandled exceptions.
