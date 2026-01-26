# Hopscotch Nurseries Funding Tools

A suite of funding tools for Hopscotch Children's Nurseries.

## Apps

### 1. Funding Calculator (Parent-facing)
A single-page funding calculator for parents to estimate childcare costs with government funding applied.

**Location:** Root directory (`/`)
**URL:** Main Vercel deployment

### 2. Staff Tools - Response Generator (Staff-only)
An internal tool for staff to generate draft responses to parent funding queries using AI.

**Location:** `/staff-tools`
**URL:** Separate Vercel deployment (not linked from parent site)
**Features:**
- Generates warm, accurate responses to funding questions
- Uses the same pricing data as the calculator
- No data storage - just produces text to copy/paste
- Requires Anthropic API key (stored in browser only)

## Features

- Calculate weekly childcare costs including government funding
- Support for new and existing bookings
- Automatic funding eligibility based on child's age
- Real-time cost updates as you change inputs
- Mobile-responsive design
- No backend required - pure client-side calculation

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd funding-calculator

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Main Calculator (Vercel)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy (Vercel auto-detects Vite projects)
4. This deploys the parent-facing calculator

### Staff Tools (Separate Vercel Project)

1. In Vercel, create a **new project** from the same repo
2. In Project Settings:
   - **Root Directory:** `staff-tools`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Deploy to a separate URL (e.g., `hopscotch-staff-tools.vercel.app`)
4. Share this URL with staff only - not linked from parent site

The staff tools use the same nursery config (`/src/utils/nurseryConfig.js`) ensuring pricing stays in sync.

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=<repository-url>)

1. Push your code to GitHub
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

## Pricing Structure

### Base Fees (No Funding)

| Session | Hours | Price |
|---------|-------|-------|
| Full day | 9.5 hrs | £69.00 |
| Morning | 4.5 hrs | £37.00 |
| Afternoon | 4 hrs | £34.00 |
| Early start (7:30-8am) | 0.5 hrs | £9.00 |
| Late finish (5:30-6pm) | 0.5 hrs | £9.00 |
| Lunch hour | 1 hr | £9.00 |
| Hot meal | - | £4.16 each |

### Funding Calculation

Government funding is stretched over 51 weeks (vs 38 term weeks):
- 15 hours entitlement = 11 hrs/week stretched
- 30 hours entitlement = 22 hrs/week stretched

### Funding Eligibility by Age (Working Parents)

| Age | Entitlement |
|-----|-------------|
| Under 9 months | No funding |
| 9 months - 2 years | 15 hrs (11 stretched) |
| 2 - 3 years | 30 hrs (22 stretched)* |
| 3 - 4 years | 30 hrs (22 stretched) |

*From September 2025

### Universal Funding (Non-Working Parents)

- 3-4 years: 15 hrs (11 stretched)

### When Funding Applies

| Child Born | Funding Starts |
|------------|----------------|
| Sept - Dec | Following January |
| Jan - Mar | Following April |
| Apr - Aug | Following September |

### Funded vs Unfunded Rates

- Funded hours: £0 (covered by government)
- Enrichment fee on funded hours: £1.50/hr
- Unfunded hours: £7.26/hr

## Tech Stack

- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## Brand Colours

- Yellow: `#FFD700`
- Green: `#4CAF50`
- Orange: `#FF9800`

## License

Private - Hopscotch Children's Nurseries
