# A1 Marine Care Instant Quote System

A production-ready instant quote application for A1 Marine Care boat detailing services. Built with React, TypeScript, and TailwindCSS, featuring a comprehensive client-side pricing engine and Stripe payment integration.

## Features

- **Real-time price calculation** for 8 different marine detailing services
- **Dynamic service configuration** with expandable option panels
- **Tiered pricing** based on boat length and service complexity
- **Automatic manual review flagging** for edge cases
- **Stripe payment link integration** for $250 refundable deposits
- **Premium marine aesthetic** with A1 Marine Care brand colors
- **Fully responsive design** optimized for mobile and desktop
- **Production-ready code** with TypeScript, no module resolution issues

## Services Offered

1. **Gelcoat Restoration** - Hull, topsides, or bowrider special with add-ons
2. **Exterior Detailing** - Four service tiers from refresh to restoration
3. **Interior Detailing** - Four service tiers with specialized add-ons
4. **Ceramic Coating** - Premium protection with optional layers
5. **Graphene Nano Coating** - Advanced coating technology
6. **Wet Sanding & Paint/Gelcoat Correction** - Professional surface refinishing
7. **Bottom Painting** - Anti-fouling paint application
8. **Vinyl Services** - Removal, installation, and custom design

## Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- TailwindCSS 4
- shadcn/ui components
- Wouter (routing)
- Client-side pricing engine

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open browser to http://localhost:3000
```

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
client/
├── src/
│   ├── lib/
│   │   └── pricing.ts          # Centralized pricing engine
│   ├── pages/
│   │   └── Home.tsx            # Main quote form
│   ├── components/ui/          # shadcn/ui components
│   ├── App.tsx                 # App wrapper and routing
│   └── index.css               # Global styles + brand colors
├── index.html                  # HTML template
└── public/                     # Static assets
```

## Brand Design

The application uses A1 Marine Care's exact brand colors:

- **Primary Accent**: `#00FFFF` (Cyan) - Used sparingly for premium feel
- **Surface/Cards**: `#2B2B2B` (Dark Gray) - Card backgrounds
- **Background**: `#000000` (Pure Black) - Page background
- **Typography**: Inter font family

Design philosophy: Modern, premium marine aesthetic with generous spacing, subtle borders, and minimal cyan usage to avoid a neon look.

## Pricing Engine

The pricing engine (`client/src/lib/pricing.ts`) is a fully typed, centralized calculation system that handles:

- Length-based tiered pricing (different rates for different boat sizes)
- Service tier multipliers (refresh, standard, deep, restoration)
- Add-on calculations (radar arch, hard top, teak cleaning, etc.)
- Condition multipliers (heavy oxidation +20%)
- Automatic manual review detection (boats over 45ft, bowriders over 30ft, blister repair)

All calculations are performed client-side for instant updates.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:

- Manus hosting (recommended)
- Vercel deployment
- Netlify deployment
- Stripe payment link configuration
- Post-payment redirect setup

## Stripe Integration

The application uses a **payment link** approach (not Stripe API checkout sessions):

- No server-side Stripe logic required
- Direct link to Stripe payment page
- Post-payment redirect configured in Stripe Dashboard
- Redirects to Wix Bookings for appointment scheduling

**Payment Link**: `https://buy.stripe.com/4gM3cvetybh54ao8ww`

## Configuration

### Updating Prices

Edit `client/src/lib/pricing.ts` to modify:
- Base rates per foot
- Tier multipliers
- Add-on prices
- Length-based pricing tiers

### Changing Brand Colors

Edit `client/src/index.css` CSS variables:
```css
--cyan-accent: #00FFFF;
--surface-card: #2B2B2B;
--bg-black: #000000;
```

## Testing

The application has been tested for:

- ✅ Accurate pricing calculations across all services
- ✅ Real-time estimate updates
- ✅ Form validation (required fields)
- ✅ Service configuration panel expansion
- ✅ Manual review flag detection
- ✅ Mobile responsive design
- ✅ Stripe payment link functionality

Example test case:
- 35ft yacht
- Gelcoat restoration (hull) with hard top
- **Expected**: $945 (base) + $475 (hard top) = $1,420 ✅

## Code Quality

- **TypeScript**: Fully typed, no `any` types
- **Clean imports**: No module resolution issues
- **No unused code**: Clean file structure
- **Production-ready**: No console errors, optimized build

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

## Support

For deployment assistance or technical questions, refer to:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment guide
- Source code comments in `pricing.ts` - Calculation logic documentation
- Component documentation in `Home.tsx` - UI structure details

---

Built with ⚓ for A1 Marine Care
