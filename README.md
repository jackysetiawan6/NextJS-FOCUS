# FOCUS — Facility Operations Control & Utility System

FOCUS is a comprehensive facility operations dashboard and management console tailored for modern data centers. It provides facility managers and engineers with real-time operational monitoring, shift turnover procedures, incident tracking, roster scheduling, utility usage analysis, and inventory control.

---

## 🚀 Key Features

### 1. Centralized Dashboard
*   **KPI Monitoring**: Real-time tracking of Power Usage Effectiveness (PUE), Water Usage Effectiveness (WUE), active permits, in-progress incidents, active inventory loans, and scheduled staff on duty.
*   **Interactive Metrics**: Clickable metric cards that open detailed overlays for PUE component breakdowns, water usage details, active loans table, and staff rosters.
*   **Power Consumption Breakdown**: Interactive double-axis bar and line charts representing daily and cumulative power consumption (kWh) for Zone A and Zone B over the last 30 days.

### 2. Shift Turnover Module
*   **Alarm & Action Logs**: Log, filter, and manage Building Management System (BMS) alarms, tracking states from *Active* -> *Acknowledged* -> *Resolved* -> *Closed*.
*   **Fire System Isolation Logs**: Track active and historical fire protection system isolations with safety LOTO (Lockout/Tagout) tag tracking.
*   **Manual System Operations Logs**: Monitor manual overrides and operations performed on critical systems.
*   **LOTO Tag Monitoring**: Centralized monitoring of active and removed LOTO tags on equipment.
*   **Activity of the Day**: Shift checklists (Morning, Afternoon, Night) for daily routines, permit-to-work checklists (PM/CM status tracking), and personnel activity logs.
*   **Incident Management**: Track operational incidents from *Logged* to *Closed*, including historical progress logs grouped by day.

### 3. Electrical Unit Log Sheet
*   **Log Entries**: View electrical readings for critical systems (PDUs, CRACs, Generators) across Zone A and Zone B.
*   **Operational Visualizations**: Line charts analyzing 10-day reading averages comparing Zone A vs. Zone B.
*   **Filterable Logs**: Robust table filtering by date, shift, and text queries.

### 4. Roster Management
*   **Shift Scheduling**: Monthly grid to schedule personnel shifts (*MS*: Morning Shift, *AS*: Afternoon Shift, *NS*: Night Shift, *D*: Day Shift, *OFF*).
*   **Staff Profiles**: Maintain the roster with employee directories, and dynamically add/remove staff.

### 5. Inventory Management
*   **Asset Tracking**: Manage tools, testing equipment, and materials, including categories, quantities, and storage locations.
*   **Loan Logs**: Track checked-out items, expected return times, and who has loaned them out.

---

## 🛠️ Tech Stack

*   **Core Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Client Components)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & CSS Variables
*   **UI Components**: [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Visualizations**: [Chart.js](https://www.chartjs.org/) (via `react-chartjs-2`)
*   **Database & Auth**: Fully Offline Cookie-Based Local Auth (Zero external database or cloud service dependencies)
*   **Analytics**: [Vercel Analytics](https://vercel.com/analytics) & [Vercel Speed Insights](https://vercel.com/speed-insights)

---

## 📁 Project Structure

```text
src/
├── app/               # Next.js App Router
│   ├── (app)/         # Authenticated application route group
│   │   ├── dashboard/           # Main landing dashboard
│   │   ├── inventory-management/# Asset/loan management
│   │   ├── log-sheet/           # Electrical logs & charts
│   │   ├── roster-management/   # Staff scheduling grid
│   │   └── shift-turnover/      # Checklists, incidents, LOTO, alarm logs
│   ├── (auth)/        # Authentication routes (login, password reset)
│   ├── layout.tsx     # Global layout containing SidebarProvider
│   └── page.tsx       # Root landing page (redirects to /dashboard)
├── components/        # Shared components and shadcn UI elements
│   ├── dashboard/     # Dashboard-specific components (e.g., ChartJS wrappers)
│   ├── layout/        # Main layout elements (sidebar, profile, nav)
│   ├── log-sheet/     # Log sheet chart components
│   ├── shared/        # Multi-use helper components (e.g. Timestamp formatters)
│   └── ui/            # Primitive UI components (buttons, input, tables)
├── config/            # Static configuration files (e.g. navigation items)
├── hooks/             # Custom React hooks (toast notifications, responsive indicators)
├── lib/               # Utility scripts and mock database engines
│   └── data/          # Mock data modules for offline prototyping
├── types/             # TypeScript interfaces
└── utils/             # Helper utilities
    ├── auth-client.ts # Client-side offline auth helpers
    └── auth-server.ts # Server-side offline auth helpers
```

---

## ⚙️ Development Setup

### Prerequisites
*   Node.js (v18.x or later recommended)
*   npm

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd NextJS-FOCUS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:9002`.

4. Perform Typecheck:
   ```bash
   npm run typecheck
   ```
