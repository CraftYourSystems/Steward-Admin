# Steward Design System

This document serves as the mandatory reference for all UI/UX development across the Steward application (Admin Dashboard, Kitchen Display System, Waiter views, etc.).

**Crucial Rule:** From this point forward, every new page or component MUST treat this document as a required input. Reuse these exact tokens and patterns. If a genuinely new UI need comes up (e.g., a complex chart type), extend the token system rather than inventing a separate visual language, and flag that extension explicitly.

## 1. Styling Mechanism
- **Framework:** Tailwind CSS
- **Configuration:** Custom properties via `app/globals.css`, mapped to Tailwind tokens in `tailwind.config.ts`.
- **Methodology:** We use semantic CSS variables (`--bg`, `--surface`, `--accent`) mapped to Tailwind classes (`bg-surface`, `text-accent`) to allow seamless theme scaling and consistent dark/light modes (currently optimised for dark/premium aesthetic).

## 2. Tokens

### Colors (Backgrounds & Surfaces)
- **True Background:** `bg-bg` (True Black, `#000000`)
- **Primary Surface:** `bg-surface` (Elevated layer, `#1C1C1E`)
- **Secondary Surface:** `bg-surface-2` (Deeper layer, `#2C2C2E`)
- **Tertiary Surface:** `bg-surface-3` (Highest layer, `#3A3A3C`)
- **Glass Card (Premium):** `.card-premium` (Translucent `rgba(255,255,255,0.02)` background with a 24px backdrop blur, inner white shadow, and 20px radius).
- **Glass Card (Flat):** `.glass-card` (Translucent `rgba(255,255,255,0.025)` with 8px backdrop blur and 20px radius).

### Colors (Text & Foreground)
- **Primary Text:** `text-fg` (White, `#FFFFFF`)
- **Muted Text:** `text-fg-muted` (Light Grey, `#A1A1A6`)
- **Subtle Text:** `text-fg-subtle` (Darker Grey, `#808084`)

### Colors (Semantic & Brand)
- **Accent:** `text-accent`, `bg-accent` (White, `#FFFFFF` for minimalistic pops)
- **Success (Optimal):** `text-success`, `bg-success` (iOS Green, `#34C759`) - e.g., "On track"
- **Warning (Needs Attention):** `text-warning`, `bg-warning` (iOS Orange, `#FF9F0A`)
- **Danger (Critical):** `text-danger`, `bg-danger` (iOS Red, `#FF3B30`)
- **Info:** `text-info`, `bg-info` (iOS Blue, `#007AFF`)

### Typography
- **Font Family:** `Inter`, falling back to `ui-sans-serif, system-ui, -apple-system`.
- **Large Stat Numbers:** Use the `.num` utility class alongside semantic sizing (e.g., `text-[36px] font-semibold tracking-tight num leading-none`) for tabular, evenly-spaced digits.
- **Section Labels:** Use `.label-xs` (`text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted`) for all small tracked-out uppercase labels (e.g., "LIVE PULSE", "TODAY'S REVENUE").
- **Headings (h1-h6):** `font-semibold tracking-tight text-fg` with letter spacing `-0.01em`.

### Spacing, Sizing, Borders & Shadows
- **Base Border Radius:** `--radius` (`0.75rem` / 12px) for generic components, buttons, and standard cards (`.surface`).
- **Premium Card Radius:** `20px` for high-level dashboard and analytics components.
- **Border Treatment:**
  - Standard border: `border-border` (`#3A3A3C`)
  - Strong border: `border-border-strong` (`#48484A`)
- **Shadows:**
  - Elevated standard: `shadow-elevated`
  - Glow effect: `shadow-glow` (for active/focus states)
  - Card Drop Shadow: `shadow-card`
  - Hover states on premium cards often inject a heavier drop shadow and subtle translation (lift).

---

## 3. Component Patterns

### 1. Stat-Card (KPI) Pattern
Used for high-level metrics.
- **Container:** Standardised as `.glass-card` (or explicit `rounded-[20px] border border-white/10 bg-white/5` if custom). Incorporates a subtle inner top highlight (`shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`) and transition effects.
- **Top Row:** `.label-xs` label on the left, small semantic icon container on the right (often tinted by accent color).
- **Value:** Sized around `text-[24px]` (or `text-[36px]` for hero layouts), applying the `.num` class.
- **Trend Line:** A pill beneath the value, colored by status (e.g., `bg-success/10 text-success`), housing a small directional arrow and percentage.

### 2. Circular Gauge / Progress-Ring Pattern
Used for composite scores and target tracking (e.g., RevenueRing).
- **Structure:** SVG-based ring.
- **Styling:** The background track is `stroke-border` or `stroke-white/10`. The active stroke is colored via semantic classes (e.g., `stroke-accent` or dynamic text colors like `text-success`).
- **Inner Value:** Centered absolutely over the SVG, usually in a bold tabular format.

### 3. Status Badge Pattern
Used to indicate the state of an order, component, or system.
- **Style:** Pill-shaped inline element.
- **Classes:** `inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border border-transparent`.
- **Colors:** A soft background with matching text (e.g., `bg-success/15 text-success`, `bg-warning/15 text-warning`).

### 4. Empty-State Pattern
Used consistently across all list/dashboard views when no data is present.
- **Layout:** Centered flex column (`flex flex-col items-center justify-center gap-3 py-16 px-6 text-center`).
- **Icon Container:** 48x48px container (`h-12 w-12 rounded-xl border border-border bg-surface-2`) housing a subdued icon (`text-fg-subtle`).
- **Text:** Title (`text-[14px] font-semibold text-fg`) and optional subtitle (`text-[12px] text-fg-subtle max-w-xs`).

### 5. Sidebar Nav Pattern
Used for primary application navigation.
- **Links:** 36px tall (`h-9`), rounded-lg, `text-[13px] font-medium`.
- **Active State:** Highlights with `bg-surface-2 text-fg shadow-sm`, and displays a 14px high active indicator bar (`h-3.5 w-1 rounded-r-full`) clinging to the left edge with a colored drop shadow.
- **Inactive State:** `text-fg-muted hover:bg-surface-2/50 hover:text-fg`.
- **Grouping Labels:** Small uppercase headers using a variation of `.label-xs`.

### 6. Date-Range Filter / Tab Pattern
Used for quick data range selection.
- **Container:** Pill-shaped wrapping element (`inline-flex items-center rounded-full border border-border bg-surface p-0.5`).
- **Buttons:** 28px tall (`h-7`), extra small uppercase (`text-[11px] font-semibold uppercase tracking-wider`).
- **Active State:** `bg-surface-3 text-fg border border-border-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`.
- **Inactive State:** `text-fg-muted hover:text-fg`.

### 7. Table Pattern
Used for tabular data like the Order Ledger.
- **Container:** Usually sits inside a `.card-premium` wrapper to inherit the border radius and glass effect.
- **Header:** Uses small, tracked uppercase font (`py-3 text-[10px] uppercase tracking-widest text-fg-muted font-semibold`).
- **Rows:** `text-[12px]` size for content. Divided by subtle borders (`divide-y divide-border/30`).
- **Interactions:** Rows highlight entirely on hover (`hover:bg-white/5/50 transition-colors`). Action buttons (like trailing ellipsis menus) remain opacity-0 until the row is hovered (`group-hover:opacity-100`).
