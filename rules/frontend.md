
# Frontend Rules

## Stack
- **React 18** with **TypeScript**
- **Vite** — dev server and bundler
- **Tailwind CSS** — styling
- **react-plotly.js** — chart rendering
- **pnpm** — package manager

Never use npm or yarn. Always use `pnpm`.

---

## Design System

### Colors

| Token | Hex | Usage |
|---|---|---|
| `bg-app` | `#0d1117` | Main content area background |
| `bg-sidebar` | `#10161f` | Left sidebar background (slightly darker) |
| `bg-card` | `#1a2235` | Result cards, input bar, header |
| `bg-card-alt` | `#1e2a3a` | Hover states on nav items |
| `bg-nav-active` | `#1e3a5f` | Active sidebar nav item background |
| `bg-user-bubble` | `#3b5af6` | User message bubble |
| `bg-send-btn` | `#4f46e5` | Circular send button (indigo) |
| `text-primary` | `#f0f4f8` | Main text, headings |
| `text-secondary` | `#8892a4` | Subtitles, timestamps, hints, nav inactive |
| `text-nav-active` | `#ffffff` | Active nav item label |
| `accent-blue` | `#3b5af6` | New Analysis button, user bubble |
| `accent-blue-hover` | `#2d4ae0` | Hover state |
| `status-green` | `#22c55e` | Connected dot, security status |
| `error-red` | `#f87171` | Error icon, error text |
| `error-bg` | `#3d1515` | Error card background |
| `error-border` | `#7f1d1d` | Error card border |
| `border` | `#1e2d40` | Subtle dividers, card borders |
| `border-input` | `#2a3a50` | Input field border |

Tailwind custom colors in `tailwind.config.ts`:
```ts
colors: {
  app: "#0d1117",
  sidebar: "#10161f",
  card: "#1a2235",
  "card-alt": "#1e2a3a",
  "nav-active": "#1e3a5f",
}
```

### Typography

| Element | Size | Weight | Color |
|---|---|---|---|
| App name (header) | `text-base` | `font-bold` | `text-primary` |
| Header center title | `text-sm` | `font-medium` | `text-primary` |
| Sidebar version | `text-xs` | `font-normal` | `text-secondary` |
| Sidebar nav item | `text-xs` | `font-semibold` | `text-secondary` / white (active) |
| New Analysis btn | `text-sm` | `font-medium` | white |
| User message | `text-sm` | `font-normal` | white |
| Timestamp | `text-xs` | `font-normal` | `text-secondary` |
| Result card title | `text-sm` | `font-semibold` | `text-primary` |
| VIEW SQL label | `text-xs` | `font-medium` | `text-secondary` |
| SQL code | `text-xs` | `font-mono` | `#93c5fd` |
| Metric number | `text-4xl` | `font-bold` | `text-primary` |
| Empty state heading | `text-3xl` | `font-bold` | `text-primary` |
| Empty state subtitle | `text-sm` | `font-normal` | `text-secondary` |
| Sample card text | `text-sm` | `font-normal` | `text-primary` |
| Error title | `text-sm` | `font-semibold` | `text-primary` |
| Error body | `text-xs` | `font-normal` | `text-secondary` |
| Footer text | `text-xs` | `font-normal` | `text-secondary` |

Font family: `Inter` (system fallback: `ui-sans-serif, system-ui`).

### Spacing & Radius

| Element | Value | Notes |
|---|---|---|
| Sidebar width | `w-48` (192px) | Fixed, never collapses |
| Header height | `h-12` | Fixed top |
| Message gap | `gap-5` | Between chat message groups |
| User bubble padding | `px-4 py-3` | |
| User bubble radius | `rounded-2xl rounded-br-sm` | Nearly full round, slight flat bottom-right |
| Result card radius | `rounded-xl` | 12px |
| Result card padding | `p-5` | |
| Input bar padding | `px-4 py-3` | |
| Input field radius | `rounded-xl` | |
| Send button | `w-10 h-10 rounded-full` | Circular |
| Sample card radius | `rounded-xl` | Rectangular, not pill |
| Nav item radius | `rounded-lg` | When active/hover |
| Error card radius | `rounded-xl` | |
| New Analysis btn radius | `rounded-lg` | |

---

## Screens

### Overall Layout (all screens)

```
┌────────────────────────────────────────────────────────┐
│  HEADER  (fixed, h-12, bg-card, full width, z-10)      │
│  [🤖 BI Agent]     [Instacart Analytics]   [● STATUS]  │
├──────────────┬─────────────────────────────────────────┤
│              │                                         │
│   SIDEBAR    │   MAIN CONTENT AREA                     │
│   (fixed,    │   (flex-1, scrollable, bg-app)          │
│   w-48,      │                                         │
│   bg-sidebar)│                                         │
│              │                                         │
│  V1.2.0-STABLE                                         │
│              │                                         │
│  [+ New      │                                         │
│   Analysis]  │                                         │
│              │                                         │
│  DASHBOARD ← active                                    │
│  QUERY HISTORY                                         │
│  SAVED REPORTS                                         │
│  DATASETS    │                                         │
│              │                                         │
│  (spacer)    │                                         │
│              │                                         │
│  SETTINGS    │                                         │
│  DOCUMENTATION                                         │
│              │                                         │
├──────────────┴─────────────────────────────────────────┤
│  INPUT BAR (fixed bottom, full width, bg-card)         │
│  [🎤] [ Ask a question about the data...  ] [📎] [▶]  │
└────────────────────────────────────────────────────────┘
```

### Screen 1 — Main Chat

```
SIDEBAR  │  MAIN CONTENT (scrollable)
         │
         │      [User bubble — right aligned]
         │      "What are the top 5 products by order volume?"
         │                                      JUST NOW ←
         │
         │  [Result card — left, full content width]
         │  ┌─────────────────────────────────────────┐
         │  │ 📊 Top 5 Products by Volume             │
         │  │                                         │
         │  │  Organic Bananas    ████████████  12.4k │
         │  │  Bananas            █████████     10.1k │
         │  │  Organic Strawberries ██████        8.2k│
         │  │  Organic Baby Spinach █████          7.5k│
         │  │  Organic Hass Avocado ████           6.8k│
         │  │                                         │
         │  │  VIEW SQL  ▾                            │
         │  └─────────────────────────────────────────┘
         │
         │      [User bubble — right aligned]
         │      "Show me reorder rates for the last 6 months."
         │                                 2 MINUTES AGO ←
         │
         │  [Result card]
         │  ┌─────────────────────────────────────────┐
         │  │ 📈 6-Month Reorder Trend                │
         │  │                                         │
         │  │  [Line chart — green dots, dark bg]     │
         │  │                                         │
         │  │  VIEW SQL  ▾                            │
         │  └─────────────────────────────────────────┘
```

**Key observations from screenshot 1:**
- Result cards span the FULL width of the content area (not left-aligned bubble)
- Card has an icon (📊/📈) + title in a header row
- Horizontal bar chart inside first card with label + bar + value layout
- `VIEW SQL ▾` appears at the bottom-left of every result card, always visible (not hidden)
- Timestamp appears below and to the right of user bubble text ("JUST NOW")
- User bubble is right-aligned, compact, blue

### Screen 2 — Empty State

```
SIDEBAR  │  MAIN CONTENT (centered vertically and horizontally)
         │
         │            [📊 outline chart icon — large]
         │
         │        Ask anything about your data
         │   (bold, large ~text-3xl)
         │
         │   Try asking about orders, products, departments,
         │   or trends from the Instacart production cluster.
         │   (text-secondary, centered, max-w-sm)
         │
         │   ┌──────────────────┐  ┌──────────────────┐
         │   │Top 10 most       │  │Reorder rate by   │
         │   │ordered products  │  │department        │
         │   └──────────────────┘  └──────────────────┘
         │   ┌──────────────────┐  ┌──────────────────┐
         │   │Orders by hour    │  │Average days      │
         │   │of day            │  │between orders    │
         │   └──────────────────┘  └──────────────────┘
         │
         │  [Input bar — "Type your data question here..."]
```

**Key observations from screenshot 2:**
- Sample questions are **rectangular cards** (`rounded-xl`), NOT pills or chips
- Cards are in a strict 2×2 grid with equal widths
- Input bar placeholder text changes: "Type your data question here..." (vs main chat "Ask a question about the data...")
- Sidebar "DASHBOARD" is active (highlighted background)

### Screen 3 — Error State

```
SIDEBAR  │  MAIN CONTENT
         │
         │      [User bubble — right aligned]
         │      "How many customers ordered twice last week?"
         │
         │  [🤖 bot avatar icon — small, left of card]
         │
         │  [Error card]
         │  ┌──────────────────────────────────────────┐
         │  │  🔴  Error: Column 'order_date' not       │
         │  │       found in table 'customers'          │
         │  │                                          │
         │  │  The query execution failed because the  │
         │  │  specified schema mapping is incorrect   │
         │  │  for the 'customers' entity.             │
         │  └──────────────────────────────────────────┘
         │
         │  ℹ  Try rephrasing your question or check the schema.
         │
         │  [ View Schema ]  [ Show Table Definition ]
         │
         │
         │  ─────────────────────────────────────────────
         │  © 2024 BI AGENT AI. CONNECTED TO INSTACART   ●SECURITY STATUS: ACTIVE
         │  PRODUCTION CLUSTER.         PRIVACY · TERMS
```

**Key observations from screenshot 3:**
- A **robot avatar icon** (🤖) appears to the left of the error card — not inside it
- Error card has a red circle `!` icon, bold error title, smaller body text
- The **hint text** ("ℹ Try rephrasing...") sits OUTSIDE the error card, below it
- Two **outline action buttons** below the hint: "View Schema" and "Show Table Definition"
- A **footer** appears at the bottom of the page (visible in error screen):
  - Left: "© 2024 BI AGENT AI. CONNECTED TO INSTACART PRODUCTION CLUSTER."
  - Right: "PRIVACY POLICY · TERMS OF SERVICE · ● SECURITY STATUS: ACTIVE"

---

## Component Specs

### Updated File Structure

```
src/
├── main.tsx
├── App.tsx                        # Root: Header + Sidebar + Main + InputBar layout
├── types/
│   └── index.ts
├── api/
│   └── query.ts
├── hooks/
│   └── useChat.ts
└── components/
    ├── Header.tsx                 # Fixed top bar
    ├── Sidebar.tsx                # Fixed left nav
    ├── ChatInput.tsx              # Fixed bottom input bar
    ├── ChatMessage.tsx            # User bubble + timestamp
    ├── ResultCard.tsx             # Assistant result (chart + SQL viewer)
    ├── ChartRenderer.tsx          # Plotly figure renderer
    ├── SqlViewer.tsx              # VIEW SQL toggle
    ├── ErrorCard.tsx              # Error state inside result card
    ├── EmptyState.tsx             # Empty chat area
    └── Footer.tsx                 # Copyright + status bar
```

---

### `Header.tsx`
- Fixed top, full width, `h-12`, `bg-card`, `border-b border-border`, `z-10`
- Three sections in a `flex items-center justify-between px-4`:
  - **Left:** Square icon (blue, `rounded-lg`) + "BI Agent" (`text-base font-bold text-primary`) in a `flex items-center gap-2`
  - **Center:** "Instacart Analytics" (`text-sm font-medium text-primary`)
  - **Right:** Green dot (`w-2 h-2 rounded-full bg-status-green`) + "CONNECTED" (`text-xs text-secondary uppercase tracking-wide`)

---

### `Sidebar.tsx`
- Fixed left, `w-48`, full height, `bg-sidebar`, `border-r border-border`, `flex flex-col`
- **Top section:**
  - Version: `V1.2.0-STABLE` (`text-xs text-secondary px-3 pt-3 pb-2`)
  - `+ New Analysis` button: full width, `bg-accent-blue hover:bg-accent-blue-hover text-white text-sm font-medium rounded-lg py-2 mx-3 flex items-center gap-2`
- **Nav items** (`flex flex-col gap-1 px-2 mt-4`):
  - Each item: icon + uppercase label (`text-xs font-semibold tracking-wide`)
  - Inactive: `text-secondary hover:bg-card-alt hover:text-primary rounded-lg px-3 py-2`
  - Active: `bg-nav-active text-white rounded-lg px-3 py-2`
  - Items in order: DASHBOARD, QUERY HISTORY, SAVED REPORTS, DATASETS
- **Bottom section** (`mt-auto flex flex-col gap-1 px-2 pb-4`):
  - SETTINGS, DOCUMENTATION — same style as inactive nav items

---

### `ChatInput.tsx`
- Fixed bottom, full width, `bg-card`, `border-t border-border`, `px-4 py-3`, `z-10`
- Layout: `flex items-center gap-3`
- **Mic icon** (`text-secondary`, left of input)
- **Input field**: `flex-1 bg-app border border-border-input rounded-xl px-4 py-2 text-sm text-primary placeholder:text-secondary outline-none`
  - Placeholder (main chat): "Ask a question about the data..."
  - Placeholder (empty state): "Type your data question here..."
- **Attachment icon** (`text-secondary`, right of input before button)
- **Send button**: `w-10 h-10 rounded-full bg-send-btn hover:opacity-90 flex items-center justify-center` with arrow-right icon in white
  - Disabled and dimmed when input is empty or loading
- Submit on Enter key (not Shift+Enter)

---

### `ChatMessage.tsx` — User message only

- Container: `flex flex-col items-end gap-1`
- Bubble: `bg-user-bubble text-white text-sm rounded-2xl rounded-br-sm px-4 py-3 max-w-[65%]`
- Timestamp: `text-xs text-secondary` — appears BELOW the bubble, right-aligned ("JUST NOW", "2 MINUTES AGO")

---

### `ResultCard.tsx` — Assistant response card

- Container: `flex items-start gap-3` (robot avatar + card side by side in error state, card-only in success)
- Card: `bg-card rounded-xl p-5 w-full overflow-hidden` (full content width, not constrained)
- **Card header row** (`flex items-center gap-2 mb-4`):
  - Chart type icon (📊 bar/pie, 📈 line, etc.) — small, `text-base`
  - Title derived from query — `text-sm font-semibold text-primary`
- **Card body**: `ChartRenderer` output fills this area
- **Summary** (below chart, above VIEW SQL):
  - Shown only when `response.summary` is not null
  - Style: `text-sm italic text-secondary mt-3 leading-relaxed`
  - Tone: first-person analyst ("To answer this, I've aggregated...")
  - Max 2 sentences — approach + key insight
  - No container or border — plain paragraph text
- **Card footer** (`mt-4 pt-3 border-t border-border`):
  - `VIEW SQL ▾` — always visible, not hidden — `text-xs text-secondary cursor-pointer hover:text-primary flex items-center gap-1`

**Full card layout order (top to bottom):**
```
[icon + title]          ← card header
[chart/table/metric]    ← ChartRenderer
[summary paragraph]     ← italic, secondary, mt-3
[VIEW SQL ▾]            ← SqlViewer, border-top
```

> Result card spans full content width. It is NOT a narrow chat bubble.

---

### `ChartRenderer.tsx`

| `chart_type` | Renderer | Height |
|---|---|---|
| `"bar"` | `<Plot>` Plotly bar chart | Fixed 320px wrapper div |
| `"line"` | `<Plot>` Plotly line chart with markers | Fixed 320px wrapper div |
| `"pie"` | `<Plot>` Plotly pie chart | Fixed 320px wrapper div |
| `"metric"` | Plain div — large number + label | Dynamic (auto) |
| `"table"` | HTML `<table>` via `TableFallback` — **never Plotly** | Dynamic — fits row count |

> **Why HTML for tables?** Plotly's table component has a large internal minimum height (~400px) regardless of row count. A 1-row result would show ~400px of blank space above the summary. The HTML table sizes to exactly fit its content.

**Layout constants in `ChartRenderer.tsx`:**
```typescript
// Shared base — applied to all Plotly charts
const DARK_BASE = {
  paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
  font: { color: '#f0f4f8', family: 'Inter' },
  title: { text: '' }, autosize: true,
  legend: { font: { color: '#f0f4f8' } },
  xaxis: { gridcolor: '#1e2d40', color: '#8892a4' },
  yaxis: { gridcolor: '#1e2d40', color: '#8892a4' },
}

// Only for bar / line / pie — tables use HTML, not this
const CHART_LAYOUT = { ...DARK_BASE, margin: { t: 10, b: 48, l: 48, r: 24 }, height: 320 }
```

**Plotly props (bar / line / pie only):**
```typescript
<div style={{ width: '100%', height: '320px' }}>
  <Plot
    data={figure.data as Data[]}
    layout={{ ...(figure.layout as Partial<Layout>), ...CHART_LAYOUT }}
    config={{ displayModeBar: false, responsive: true }}
    useResizeHandler
    style={{ width: '100%', height: '100%' }}
  />
</div>
```

**Metric card:**
```tsx
<div className="flex flex-col items-center justify-center py-10 gap-2">
  <span className="text-4xl font-bold text-primary">{value.toLocaleString()}</span>
  <span className="text-sm text-secondary">{label}</span>
</div>
```

---

### `SqlViewer.tsx`
- Always visible at bottom of `ResultCard` as "VIEW SQL ▾"
- Collapsed by default
- Toggle: click to expand/collapse, arrow rotates (`▾` → `▴`)
- When expanded:
  ```tsx
  <pre className="mt-3 bg-app rounded-lg p-3 text-xs font-mono text-blue-300
                  whitespace-pre-wrap overflow-x-auto">
    {sql}
  </pre>
  ```

---

### `ErrorCard.tsx`
Three parts rendered outside the card container:

**1. Robot avatar + error card row** (`flex items-start gap-3`):
- Left: `🤖` bot avatar icon (small, `text-xl`, aligned to top of card)
- Right: error card:
  ```
  bg-error-bg border border-error-border rounded-xl px-4 py-4
  ```
  - Red circle `!` icon (`text-error-red`) + bold error title on same row
  - Body text (`text-xs text-secondary mt-1`)

**2. Info hint** (below card, NOT inside):
```tsx
<p className="text-xs text-secondary flex items-center gap-1 mt-3">
  <InfoIcon /> Try rephrasing your question or check the schema.
</p>
```

**3. Action buttons** (below hint):
```tsx
<div className="flex gap-2 mt-2">
  <button className="text-xs border border-border rounded-lg px-3 py-1.5
                     text-secondary hover:text-primary hover:border-primary transition">
    View Schema
  </button>
  <button className="text-xs border border-border rounded-lg px-3 py-1.5
                     text-secondary hover:text-primary hover:border-primary transition">
    Show Table Definition
  </button>
</div>
```

---

### `EmptyState.tsx`
- Fills the full content area: `flex flex-col items-center justify-center h-full gap-6`
- **Icon**: outline bar chart SVG, `w-16 h-16 text-secondary`
- **Heading**: "Ask anything about your data" — `text-3xl font-bold text-primary text-center`
- **Subtext**: "Try asking about orders, products, departments, or trends from the Instacart production cluster." — `text-sm text-secondary text-center max-w-sm`
- **Sample cards** — `grid grid-cols-2 gap-3 mt-2 w-full max-w-lg`:
  - Each card: `bg-card border border-border rounded-xl px-4 py-4 text-sm text-primary cursor-pointer hover:bg-card-alt transition`
  - Rectangular, NOT pill-shaped
  - On click: fill input AND submit immediately
  - Cards: "Top 10 most ordered products", "Reorder rate by department", "Orders by hour of day", "Average days between orders"

---

### `Footer.tsx`
Visible at the bottom of the content area (not fixed — scrolls with content, sits after last message):
```tsx
<footer className="flex items-center justify-between px-6 py-3 border-t border-border
                   text-xs text-secondary mt-auto">
  <span>© 2024 BI AGENT AI. CONNECTED TO INSTACART PRODUCTION CLUSTER.</span>
  <div className="flex items-center gap-4">
    <span className="cursor-pointer hover:text-primary">PRIVACY POLICY</span>
    <span className="cursor-pointer hover:text-primary">TERMS OF SERVICE</span>
    <span className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
      SECURITY STATUS: ACTIVE
    </span>
  </div>
</footer>
```

---

### `UnavailableCard.tsx`
Rendered by `ResultCard` when `response.chart_type === 'unavailable'`.
This is NOT an error — it's a correct, graceful response that the requested data concept doesn't exist in the dataset.

Layout:
```
🔍  Data Not Available
    [message from response.summary]

    ┌─ What this dataset can answer ──────────────────┐
    │  • Order counts, frequency, and timing          │
    │  • Reorder rates by product, aisle, department  │
    │  • Basket size and cart position analysis       │
    │  • Product popularity and category trends       │
    └─────────────────────────────────────────────────┘
```

- Icon: `🔍` (search), `text-2xl`, left of message
- Title: "Data Not Available" — `text-sm font-semibold text-primary`
- Message: `text-sm text-secondary leading-relaxed` — the `summary` field from the response
- Hint box: `bg-app rounded-lg px-4 py-3 border border-border` — static list of what IS available
- No VIEW SQL shown (no SQL was executed)
- No summary shown (the message IS the explanation)

**`ResultCard` renders this when `chart_type === 'unavailable'` BEFORE the normal chart path:**
```tsx
if (response.chart_type === 'unavailable') {
  return (
    <div className="bg-card rounded-xl p-5 w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span>🔍</span>
        <span className="text-sm font-semibold text-primary">Data Not Available</span>
      </div>
      <UnavailableCard message={response.summary ?? '...'} />
    </div>
  )
}
```

---

### `MetricCard` (inside `ChartRenderer.tsx`) — safety net
If a string value containing `'unavailable'` slips through backend detection and reaches `MetricCard`,
it renders as an info message instead of giant bold text:
```tsx
if (typeof value === 'string' && value.toLowerCase().includes('unavailable')) {
  // render compact info message — not the big number display
}
```
This is defense in depth — the backend `_is_unavailable_response()` should catch it first.

---

### `SlowQueryWarning.tsx`
Rendered by `ResultCard` when `response.chart_type === 'warning'`.
This is NOT an error — it's a proactive performance warning before the query is executed.

Layout:
```
⚠️  Performance Warning
    [message from response.warning.message]

    ┌─ Try a faster alternative instead ──────────────────┐
    │  [Clickable suggestion 1]                           │
    │  [Clickable suggestion 2]                           │
    └─────────────────────────────────────────────────────┘

    Original question: "..." [Run anyway →]
```

- `suggestions` buttons: `bg-card-alt hover:bg-nav-active rounded-lg` — clicking calls `onSuggestion(text)` which adds a new chat pair
- "Run anyway →" button: outline style — clicking calls `onRunAnyway(messageId, originalQuestion)`
  - `messageId` is the warning message's ID — response is updated IN-PLACE (no new message pair)
  - `originalQuestion` comes from the preceding user message, passed via `ResultCard` prop
  - Backend receives `force_execute: true` → bypasses slow query check → executes full query

**`ResultCard` passes `originalQuestion` from `App.tsx`:**
```tsx
// App.tsx — get original question from the preceding user message
messages.map((msg, index) =>
  msg.role === 'user' ? <ChatMessage /> : (
    <ResultCard
      originalQuestion={messages[index - 1]?.question ?? ''}
      onForceExecute={forceExecute}
      onSuggestion={sendQuestion}
    />
  )
)
```

**`chart_type === 'running'`** — shown while `forceExecute` is in progress for this card:
- Inline loading skeleton replaces the warning card
- Text: "Running full query — this may take a few minutes..."
- Does NOT trigger the global `LoadingSkeleton` at the bottom of the chat

---

### `useChat.ts` — additional exports

```typescript
// Update an existing assistant message response in-place (used by forceExecute)
updateMessage(messageId: string, response: QueryResponse): void

// Re-execute a blocked question with force_execute=true
// Updates the warning card in-place — does NOT add a new message pair
// Uses isForceExecuting flag (separate from isLoading) so LoadingSkeleton is NOT shown
forceExecute(messageId: string, question: string): Promise<void>
```

`isForceExecuting` is separate from `isLoading` — this prevents the bottom `LoadingSkeleton` from appearing while a force-execute is running (the running state is shown inline in the card instead).

---

## File & Folder Conventions

```
src/
├── main.tsx                       # ReactDOM.createRoot entry — do not touch
├── App.tsx                        # Root layout; passes originalQuestion + forceExecute to ResultCard
├── types/
│   ├── index.ts                   # QueryRequest (force_execute), QueryResponse (warning, 'warning'|'running'), QueryWarning
│   └── session.ts                 # Session interface
├── api/
│   └── query.ts                   # postQuery() with force_execute, getHealth(), getSchema()
├── hooks/
│   ├── useChat.ts                 # sendQuestion, forceExecute, updateMessage, isForceExecuting, sessionId
│   └── useSessions.ts             # localStorage session CRUD
└── components/
    ├── Header.tsx
    ├── Sidebar.tsx                 # Now accepts onNavChange callback
    ├── ChatInput.tsx
    ├── ChatMessage.tsx
    ├── ResultCard.tsx
    ├── ChartRenderer.tsx
    ├── SqlViewer.tsx
    ├── ErrorCard.tsx
    ├── EmptyState.tsx
    ├── Footer.tsx
    ├── UnavailableCard.tsx         # Rendered when chart_type = 'unavailable'
    ├── SlowQueryWarning.tsx        # Rendered when chart_type = 'warning'; has Run Anyway + suggestions
    ├── QueryHistoryPanel.tsx       # Session list shown when nav = 'history'
    └── SessionCard.tsx            # One session row in the history list
```

Rules:
- One component per file — no multiple exports from one file
- Component files: `PascalCase.tsx`
- Hook files: `camelCase.ts` prefixed with `use`
- No component logic in `App.tsx` — it only composes other components
- No API calls outside `api/query.ts`
- No localStorage access outside `hooks/useSessions.ts`

---

## TypeScript Conventions

### Naming
- Types and interfaces: `PascalCase` — `QueryResponse`, `ChatMessage`
- Use `interface` for object shapes, `type` for unions and primitives
- All props interfaces named `<ComponentName>Props`
- No `any` — use `unknown` if type is truly unknown, then narrow it

### Types (src/types/index.ts)

```typescript
export interface QueryRequest {
  question: string;
  force_execute?: boolean;   // bypass slow query warning when true
}

export interface PlotlyFigure {
  data: object[];
  layout: object;
}

export interface QueryWarning {
  message: string;           // performance warning text
  suggestions: string[];     // 2 faster alternative questions
}

export interface QueryResponse {
  success: boolean;
  sql: string | null;
  chart_type: "bar" | "line" | "pie" | "table" | "metric" | "unavailable" | "warning" | "running" | null;
  plotly_figure: PlotlyFigure | null;
  table_data: Record<string, unknown>[] | null;
  row_count: number;
  summary: string | null;    // AI-generated plain-English explanation
  warning: QueryWarning | null;  // set when chart_type='warning'
  error: string | null;
}

// chart_type values:
// 'warning'  → slow query intercepted; show SlowQueryWarning card; warning field is set
// 'running'  → forceExecute in progress; show inline loading skeleton
// 'unavailable' → data concept doesn't exist in dataset; show UnavailableCard

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  question?: string;
  response?: QueryResponse;
  timestamp: number;
}
```

### Session Type (src/types/session.ts)

```typescript
import type { ChatMessage } from './index'

export interface Session {
  id: string             // crypto.randomUUID()
  title: string          // first user question, max 50 chars
  created_at: number     // Date.now() when session started
  updated_at: number     // Date.now() of last message
  message_count: number  // total messages (user + assistant)
  messages: ChatMessage[] // full message array — plotly_figure.layout stripped to save space
}
```

**How `plotly_figure` is saved:**
A Plotly figure has two parts:
- `data` — the actual x/y values and trace type (~2–8KB per chart). **Kept.**
- `layout` — Plotly default styling, colors, font, grid config (~50–200KB). **Stripped** (replaced with `{}`).

On load, `ChartRenderer` merges the saved `data` with `DARK_LAYOUT` to produce an identical-looking chart. The result is visually identical to the live chart — only the backend-generated styling metadata is discarded, which we override anyway.

---

## Component Conventions

### Props
- Always define a `Props` interface explicitly — no inline prop types
- Required props: no default. Optional props: use `?` and provide a sensible default via destructuring

```typescript
interface ChatMessageProps {
  message: ChatMessage;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) { ... }
```

### Component Structure Order
1. Props interface
2. Component function
3. Hooks (`useState`, `useEffect`, custom hooks) at the top
4. Event handlers
5. Return JSX

### No Inline Logic in JSX
Move conditional logic out of JSX into variables:

```typescript
// Good
const chartContent = response.plotly_figure
  ? <ChartRenderer figure={response.plotly_figure} />
  : <table>...</table>;

return <div>{chartContent}</div>;

// Bad
return (
  <div>
    {response.plotly_figure ? <ChartRenderer ... /> : <table>...</table>}
  </div>
);
```

### Events
- Event handler functions: prefix with `handle` — `handleSubmit`, `handleKeyDown`
- Never define event handlers inline in JSX for anything beyond one-liners

---

## API Layer (src/api/query.ts)

Only one function lives here. Keep it minimal.

```typescript
import type { QueryRequest, QueryResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function postQuery(request: QueryRequest): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<QueryResponse>;
}
```

Rules:
- Never call `fetch` anywhere else in the codebase — always go through `api/query.ts`
- Throw on non-2xx HTTP status — the hook handles the error
- Do not transform the response here — return it as-is for the hook to process

---

## State Management (src/hooks/useChat.ts)

All chat state lives here. Components do not manage their own message state.

```typescript
import { useState, useCallback } from "react";
import { postQuery } from "../api/query";
import type { ChatMessage, QueryResponse } from "../types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = useCallback(async (question: string) => {
    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      question,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response: QueryResponse = await postQuery({ question });
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, error, sendQuestion };
}
```

Rules:
- No direct `fetch` calls inside hooks — always use `api/query.ts`
- `isLoading` is always reset in a `finally` block
- Messages are immutable — always spread into a new array, never mutate

---

## Chart Rendering (src/components/ChartRenderer.tsx)

Decision tree for what gets rendered:

```
figure is null?
  ├── tableData exists → HTML TableFallback (history safety net)
  └── no tableData   → null (nothing rendered)

chartType === 'metric' → MetricCard (plain div, no Plotly)

chartType === 'table'  → HTML TableFallback (ALWAYS, even with figure present)
                         Never use Plotly for tables — fixed internal min-height causes gap

chartType === 'bar' | 'line' | 'pie'
  → <Plot> inside fixed 320px div, layout merged with CHART_LAYOUT
```

Rules:
- Never use Plotly for `chart_type === "table"` — use HTML `TableFallback`
- Always wrap bar/line/pie `<Plot>` in `style={{ width: '100%', height: '320px' }}` div
- Always pass `useResizeHandler` and `style={{ width: '100%', height: '100%' }}` to `<Plot>`
- Always pass `config={{ displayModeBar: false, responsive: true }}` to hide Plotly toolbar
- `CHART_LAYOUT` is the only layout constant — do not add new layout objects without updating this rule

---

## Styling (Tailwind CSS)

- Use Tailwind utility classes only — no custom CSS files except `index.css` for base resets
- No inline `style` props except for Plotly chart dimensions (`width`, `height`)
- Always use the color tokens from the Design System — never hardcode hex values in `className`
- Dark mode only — no light mode variants

### App Layout (3-panel)

```
App (h-screen flex flex-col overflow-hidden bg-app)
├── Header        (fixed top-0 left-0 right-0 h-12 z-10)
└── Body (flex-1 flex overflow-hidden pt-12 pb-16)
    ├── Sidebar   (fixed left-0 top-12 bottom-16 w-48 bg-sidebar)
    └── Main      (ml-48 flex-1 overflow-y-auto bg-app)
         └── content (flex flex-col gap-5 px-6 py-6 max-w-4xl)
              ├── [ChatMessage] (user)
              ├── [ResultCard]  (assistant)
              ├── [ChatMessage] (user)
              ├── [ResultCard or ErrorCard] (assistant)
              └── [Footer]      (at end of message list)
└── ChatInput     (fixed bottom-0 left-48 right-0 h-16 bg-card)
```

### Key Styling Rules
- Result cards are full-width within the content column — `w-full`, not max-width constrained
- User bubbles are right-aligned and compact — `max-w-[65%] ml-auto`
- Timestamps sit below user bubbles, right-aligned, `text-xs text-secondary`
- Never use `bg-white`, `bg-slate-100`, or any light background
- `VIEW SQL` is always rendered at the bottom of every result card — never hidden by default

---

## Environment Variables

Frontend env vars must be prefixed with `VITE_` to be exposed by Vite:

```bash
# frontend/.env.local  (gitignored)
VITE_API_URL=http://localhost:8000
```

Access in code:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
```

Never hardcode the backend URL in component files.

---

## Vite Config

Proxy API calls in development to avoid CORS issues during local dev:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
```

With this proxy, frontend can call `/api/query` directly without the full URL during dev.

---

## Session Management (localStorage)

### Overview

Chat sessions are persisted in the browser's `localStorage` so users can return to a previous conversation and continue from where they left off. This is local-only — no backend changes required.

### Storage Contract

```
Key:   'bi_agent_sessions'
Value: JSON.stringify(Session[])
Limit: 5MB (browser localStorage limit)
Max sessions stored: 20 (oldest removed when limit reached)
```

### Session Lifecycle

```
User asks a question
        │
        ▼
useChat adds messages to state
        │
        ▼ (useEffect on messages)
useSessions.saveSession(currentSessionId, messages)
  - strips plotly_figure.layout (keeps plotly_figure.data) before writing
  - writes full session array back to localStorage
        │
User clicks "Query History" in sidebar
        │
        ▼
App.tsx sets activeView = 'history'
Main content renders <QueryHistoryPanel />
        │
User clicks a past session
        │
        ▼
useSessions.loadSession(id) → returns ChatMessage[]
App.tsx sets activeView = 'chat'
useChat.loadMessages(messages) replaces current messages
User can now continue chatting — new questions append to the loaded session
```

### `useSessions` Hook (`src/hooks/useSessions.ts`)

Single source of truth for all localStorage access. No other file reads or writes `localStorage`.

```typescript
export interface UseSessions {
  sessions: Session[]                                    // all stored sessions
  saveSession: (id: string, messages: ChatMessage[]) => void  // upsert a session
  loadSession: (id: string) => ChatMessage[] | null      // load messages by id
  deleteSession: (id: string) => void                    // remove a session
  clearAll: () => void                                   // wipe all sessions
}
```

**Rules inside `useSessions`:**
- Always read from localStorage in a try/catch — storage can throw
- Always strip `plotly_figure.layout` before writing: save `{ data: figure.data, layout: {} }` — never save the full layout
- `saveSession` upserts: finds existing session by id and updates it, or appends if new
- After every write, re-read from storage and update React state so UI reflects actual storage
- When sessions exceed 20, remove the oldest (`sort by updated_at asc, splice(0, count - 20)`)
- Wrap `localStorage.setItem` in try/catch for `QuotaExceededError` — log warning, do not crash

**Session title:** First user message text, trimmed to 50 characters. Never update the title after the session is created.

### `useChat` Changes

`useChat` gets two new capabilities:
1. Accept `initialMessages: ChatMessage[]` — used when loading a session from history
2. Export `sessionId: string` — a stable UUID for the current session, used as the key in `saveSession`

```typescript
// useChat auto-saves on every message change
useEffect(() => {
  if (messages.length === 0) return
  saveSession(sessionId, messages)
}, [messages])
```

### View Routing in `App.tsx`

`App.tsx` manages which view is active:

```typescript
type ActiveView = 'chat' | 'history'

const [activeView, setActiveView] = useState<ActiveView>('chat')
```

- `activeView = 'chat'` → render current chat (EmptyState or message list)
- `activeView = 'history'` → render `<QueryHistoryPanel />`
- Clicking "New Analysis" in sidebar → `clearMessages()` + `setActiveView('chat')`
- Clicking "Query History" in sidebar → `setActiveView('history')`
- Clicking a session in history → `loadSession(id)` + `setActiveView('chat')`

### `QueryHistoryPanel` Component (`src/components/QueryHistoryPanel.tsx`)

Shown in the main content area when `activeView = 'history'`.

```
┌─────────────────────────────────────────────┐
│  Query History                              │
│  23 sessions                                │
│─────────────────────────────────────────────│
│  [SessionCard]                              │
│  [SessionCard]                              │
│  [SessionCard]                              │
│  ...                                        │
│                     [Clear All History]     │
└─────────────────────────────────────────────┘
```

Props: `{ sessions, onLoad, onDelete, onClearAll }`

### `SessionCard` Component (`src/components/SessionCard.tsx`)

One row in the history list.

```
┌──────────────────────────────────────────────────────┐
│  📋  Reorder rate by department          [🗑 Delete] │
│      5 messages · 2 hours ago                        │
└──────────────────────────────────────────────────────┘
```

- Background: `bg-card`, border: `border border-border`, radius: `rounded-xl`
- Title: `text-sm font-medium text-primary` — truncated to 50 chars
- Meta: `text-xs text-secondary` — message count + relative time
- Full row is clickable → calls `onLoad(session.id)`
- Delete button: `🗑` icon, right-aligned, `text-secondary hover:text-error-red`
- On click: calls `onDelete(session.id)`, does NOT bubble to row click

### Charts in Loaded Sessions

When a session is loaded from history, `plotly_figure` contains `{ data: [...], layout: {} }`.
`ChartRenderer` merges the saved `data` with `CHART_LAYOUT` — bar/line/pie charts render identically to the live session.

For `chart_type === 'table'` in history sessions, `ChartRenderer` always renders `TableFallback` (HTML table) regardless of whether `plotly_figure` is present — this is the same path used for live sessions. No special history handling needed.

`TableFallback` renders for `figure === null` only as a safety net for sessions saved before the layout-stripping change.

### What NOT to Store in localStorage

- `plotly_figure.layout` — large (~50–200KB), always replaced with `{}` before writing
- Full unmodified Plotly figures — never save as-is, always strip the layout
- API keys or any secrets
- Backend schema — fetched fresh on demand via `GET /api/schema`

---

## What NOT to Do

- Do not use `useEffect` to fetch data on mount — fetching happens only on user action via `useChat`
- Do not install a state management library (Redux, Zustand) — `useState` + custom hooks is enough
- Do not use `axios` — native `fetch` is sufficient and avoids an extra dependency
- Do not put business logic in components — components render, hooks manage state, `api/` fetches
- Do not render raw HTML from API responses — no `dangerouslySetInnerHTML`
- Do not commit `node_modules/` or `dist/` — both are gitignored
- Do not access `localStorage` directly in components or `useChat` — always go through `useSessions`
- Do not save `plotly_figure.layout` to localStorage — always replace it with `{}` before writing
