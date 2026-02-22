# A1 Marine Care - Quote Form

**Public quote submission form with Stripe payment integration.**

## Features

- ✅ **Quote Form** - Customer-facing form for boat service quotes
- ✅ **Instant Pricing** - Real-time calculation based on boat size and services
- ✅ **Stripe Integration** - $250 deposit payment link
- ✅ **Database Storage** - All quotes saved to MySQL/TiDB
- ✅ **No Authentication** - Public access for customers
- ✅ **No Manus Dependencies** - Pure Express + React + tRPC stack

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Express 5, tRPC 11
- **Database**: MySQL/TiDB with Drizzle ORM
- **Payment**: Stripe payment links

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create `.env` file:

```env
# Database (required)
DATABASE_URL=mysql://user:password@host:port/database

# Stripe (optional - for payment webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Server
NODE_ENV=development
PORT=3001
```

### 3. Push Database Schema

```bash
pnpm db:push
```

### 4. Run Development Server

```bash
# Terminal 1: Backend
pnpm dev

# Terminal 2: Frontend (if needed)
cd client && vite
```

- Quote Form: http://localhost:3000

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import `marcuslebars/A1-Quote`
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist/client`
   - **Install Command**: `pnpm install`

### Step 3: Add Environment Variables

```
DATABASE_URL=mysql://...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
```

### Step 4: Configure Custom Domain

1. Go to **Settings → Domains**
2. Add `quote.a1marinecare.ca`
3. Update DNS:

```
Type: CNAME
Name: quote
Value: cname.vercel-dns.com
TTL: 3600
```

### Step 5: Configure Stripe Webhook (Optional)

1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://quote.a1marinecare.ca/api/webhooks/stripe`
3. Events: `checkout.session.completed`
4. Copy webhook secret to Vercel environment variables

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # shadcn/ui components
│   │   ├── pages/        # Quote form page
│   │   ├── lib/          # tRPC client, pricing logic
│   │   └── App.tsx       # Routing
│   └── index.html
├── server/               # Express backend
│   ├── index.ts          # Express server
│   ├── routers.ts        # tRPC API endpoints
│   ├── context.ts        # tRPC context (no auth)
│   ├── db.ts             # Database helpers
│   └── stripe.ts         # Stripe webhook handler
├── drizzle/              # Database schema
│   └── schema.ts
└── shared/               # Shared types and constants
```

## API Endpoints

### tRPC (via `/api/trpc`)
- `quotes.submit` - Submit new quote
- `quotes.getById` - Get quote by ID

### Webhooks
- `POST /api/webhooks/stripe` - Stripe payment events

## Scripts

```bash
# Development
pnpm dev              # Start backend server

# Build
pnpm build            # Build frontend + backend for production

# Database
pnpm db:push          # Push schema changes to database
```

## Database Schema

### `quotes` table
```sql
CREATE TABLE quotes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  boat_length INT NOT NULL,
  boat_type VARCHAR(100) NOT NULL,
  service_location VARCHAR(255) NOT NULL,
  estimated_total DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  requires_manual_review BOOLEAN DEFAULT FALSE,
  review_reasons TEXT,
  service_selections TEXT,
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## What's Different from Admin Dashboard

**Removed:**
- ❌ Google OAuth authentication
- ❌ Admin dashboard UI
- ❌ User management
- ❌ Admin-only endpoints

**Kept:**
- ✅ Quote form (exactly as before)
- ✅ Pricing calculation
- ✅ Database integration
- ✅ Stripe webhook

This is a **public-facing** application with no authentication required. Customers can submit quotes directly.

## Support

For issues or questions, contact the A1 Marine Care development team.
