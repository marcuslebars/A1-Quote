# A1 Marine Care - Quote Form

Public-facing quote submission form for A1 Marine Care boat detailing services. **Zero Manus dependencies** - ready for Vercel deployment.

## 🎯 Purpose

This is the **public quote form only** - no admin features, no authentication. 

- Customers fill out boat details and service selections
- Get instant price estimates  
- Submit quotes to database
- Pay $250 deposit via Stripe

**Admin dashboard** is in separate repository: `a1_admin_dashboard`

## 🚀 Quick Deploy to Vercel

1. Push to GitHub:
   ```bash
   git add -A
   git commit -m "Quote form ready"
   git push origin main
   ```

2. Import to Vercel:
   - Framework: Vite
   - Build: `pnpm build`
   - Output: `dist/public`

3. Add environment variables:
   ```
   DATABASE_URL=mysql://user:password@host:port/database
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. Add custom domain: `quote.a1marinecare.ca`

## 🛠️ Development

```bash
pnpm install
pnpm db:push
pnpm dev
```

## 📁 Structure

- `client/` - React frontend (quote form)
- `server/` - Express + tRPC backend
- `drizzle/` - Database schema

## 🔗 Related

- Admin Dashboard: `a1_admin_dashboard` → admin.a1marinecare.ca
