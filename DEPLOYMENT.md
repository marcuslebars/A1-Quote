# A1 Marine Care Instant Quote - Deployment Guide

## Overview

This is a production-ready instant quote system for A1 Marine Care boat detailing services. The application is built with React, TypeScript, and TailwindCSS, featuring a client-side pricing engine and Stripe payment link integration.

## Tech Stack

- **Framework**: Vite + React 19
- **Language**: TypeScript
- **Styling**: TailwindCSS 4 with custom brand colors
- **UI Components**: shadcn/ui
- **Routing**: Wouter (client-side)
- **Deployment**: Static hosting (Manus, Vercel, Netlify, etc.)

## Brand Colors

The application uses A1 Marine Care's exact brand colors:

- **Primary Accent**: `#00FFFF` (Cyan)
- **Surface/Cards**: `#2B2B2B` (Dark Gray)
- **Background**: `#000000` (Pure Black)

## Features Implemented

### 1. Boat Details Section
- Boat length input (in feet)
- Boat type dropdown (Bowrider, Cruiser, Yacht, Sailboat, Pontoon, Other)
- Service location input

### 2. Contact Information
- Full name
- Email
- Phone number

### 3. Service Selection with Dynamic Configuration

All services expand to show their specific configuration options when selected:

#### Gelcoat Restoration
- Area selection: Hull, Topsides, or Bowrider Special
- Add-ons: Radar Arch (+$175), Hard Top (+$475)
- Heavy Oxidation (+20% multiplier)
- Spot Wet Sanding (number of areas × $125)

#### Exterior Detailing
- Tier selection: Refresh, Standard, Deep Clean, Restoration
- Add-ons: Teak Cleaning (+$225), Canvas Cleaning (+$150), Fender Cleaning (+$60), Exterior Ozone (+$100)

#### Interior Detailing
- Tier selection: Refresh, Standard, Deep Clean, Restoration
- Add-ons: Mold Remediation (+$225), Mattress Shampoo (+$75), Head Deep Clean (+$75), Galley Deep Clean (+$100), Pet Hair Removal (+$100), Ozone Interior (+$100)

#### Ceramic Coating
- Base rate: $35/ft
- Add-ons: Second Layer (+$8/ft), Teak Ceramic (+$300), Interior Ceramic (+$150)

#### Graphene Nano Coating
- Base rate: $40/ft
- Add-ons: Second Layer (+$10/ft), Teak Graphene (+$350)

#### Wet Sanding & Paint/Gelcoat Correction
- Base rate: $45/ft
- Add-ons: Deep Scratch Repair (+$275), Spot Wet Sanding (number of areas × $125)

#### Bottom Painting
- Base rate: $30/ft
- Add-ons: 2nd Coat (+$12/ft), Old Paint Removal (+$18/ft), Heavy Growth Removal (+$250), Blister Repair (triggers manual review)

#### Vinyl Services
- Service type: Removal Only ($12/ft), Install Only ($15/ft), Removal + Install ($24/ft)
- Add-on: Custom Design (+$125)

### 4. Real-Time Price Calculation

The pricing engine (`client/src/lib/pricing.ts`) calculates estimates in real-time based on:
- Boat length
- Selected services
- Service tiers
- Add-ons and options

### 5. Estimate Display

When services are selected, the estimate card shows:
- **Estimated Total**: Calculated based on all selections
- **Deposit Required**: Fixed $250 refundable deposit
- **Price Breakdown**: Detailed line-by-line calculation
- **Manual Review Flags**: Automatic detection for edge cases (boats over 45ft, bowriders over 30ft, blister repair)

### 6. Stripe Payment Integration

- **Pay Deposit Button**: Appears when all required fields are filled and at least one service is selected
- **Payment Link**: Direct link to Stripe payment page
- **Current URL**: `https://buy.stripe.com/4gM3cvetybh54ao8ww`
- **Post-Payment Redirect**: Configure in Stripe Dashboard to redirect to Wix Bookings page

## Stripe Configuration

### Setting Up Post-Payment Redirect

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Payment Links**
3. Find the payment link for A1 Marine Care deposits
4. Click **Edit**
5. Under **After payment**, select **Redirect to URL**
6. Enter the Wix Bookings URL: `https://www.a1marinecare.ca/book-online`
7. Save changes

This ensures customers are automatically redirected to schedule their service appointment after completing payment.

## File Structure

```
client/
├── src/
│   ├── lib/
│   │   └── pricing.ts          # Centralized pricing engine
│   ├── pages/
│   │   ├── Home.tsx            # Main quote form page
│   │   └── NotFound.tsx        # 404 page
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── App.tsx                 # Routes and app wrapper
│   ├── index.css               # Global styles with brand colors
│   └── main.tsx                # React entry point
├── index.html                  # HTML template with Inter font
└── public/                     # Static assets
```

## Deployment Instructions

### Option 1: Manus Hosting (Recommended)

The application is already set up in Manus. To publish:

1. Click the **Publish** button in the Manus UI (requires creating a checkpoint first)
2. Your site will be live at your Manus domain
3. Custom domain support available in Manus settings

### Option 2: Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. From the project directory:
   ```bash
   vercel
   ```

3. Follow the prompts to deploy

### Option 3: Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. From the project directory:
   ```bash
   netlify deploy --prod
   ```

3. Build command: `pnpm build`
4. Publish directory: `dist/public`

### Option 4: Any Static Host

Build the project:
```bash
pnpm install
pnpm build
```

Upload the contents of `dist/public/` to your static hosting provider.

## Environment Variables

No environment variables are required for the basic functionality. The application runs entirely client-side.

## Testing the Application

### Manual Testing Checklist

1. **Form Validation**
   - [ ] All required fields must be filled before deposit button appears
   - [ ] Boat length must be a positive number
   - [ ] At least one service must be selected

2. **Pricing Accuracy**
   - [ ] Verify gelcoat rates match specification for different boat lengths
   - [ ] Test tier multipliers for exterior/interior detailing
   - [ ] Confirm add-ons calculate correctly
   - [ ] Check that manual review flags appear for edge cases

3. **User Experience**
   - [ ] Service configuration panels expand/collapse properly
   - [ ] Estimate updates in real-time
   - [ ] Price breakdown is readable and accurate
   - [ ] Mobile responsive design works on all screen sizes

4. **Payment Flow**
   - [ ] Deposit button links to correct Stripe URL
   - [ ] Stripe page loads correctly
   - [ ] Test payment redirects to Wix Bookings (after Stripe configuration)

## Code Quality

### TypeScript
- Fully typed pricing engine
- Type-safe service configurations
- No `any` types used

### Clean Architecture
- Centralized pricing logic in `pricing.ts`
- No module resolution issues
- No broken import paths
- No unused code or dependencies

### Performance
- Client-side calculations (instant updates)
- No unnecessary re-renders
- Optimized bundle size

## Maintenance

### Updating Prices

To update service prices, edit `client/src/lib/pricing.ts`:

1. Find the relevant pricing constant (e.g., `GELCOAT_RATES`, `TIER_MULTIPLIERS`)
2. Update the values
3. Rebuild and redeploy

### Adding New Services

1. Add service type to `ServiceSelections` interface in `pricing.ts`
2. Create configuration interface (e.g., `NewServiceConfig`)
3. Implement calculation function (e.g., `calculateNewService`)
4. Add to `calculateTotal` function
5. Update UI in `Home.tsx` to include checkbox and configuration panel

### Changing Brand Colors

Update `client/src/index.css` variables:
- `--cyan-accent`
- `--surface-card`
- `--bg-black`

## Support

For technical issues or questions about the application, refer to:
- Source code comments in `pricing.ts` for calculation logic
- Component documentation in `Home.tsx` for UI structure
- TailwindCSS documentation for styling customization

## Production Checklist

Before going live:

- [x] All pricing calculations verified
- [x] Brand colors applied correctly
- [x] Mobile responsive design tested
- [x] Stripe payment link configured
- [ ] Stripe post-payment redirect configured (requires Stripe Dashboard access)
- [x] TypeScript compilation successful
- [x] No console errors in browser
- [x] All form fields validated
- [x] Manual review flags tested

## Notes

- The application is built as a static site (no backend required)
- All calculations happen client-side in the browser
- No database or API calls needed
- Stripe payment link handles payment processing
- Wix Bookings handles appointment scheduling
