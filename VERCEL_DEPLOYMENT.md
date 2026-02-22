# Vercel Deployment Guide

## Overview

This project is ready to deploy to Vercel with minimal configuration. Both the **quote form** and **admin dashboard** can be deployed as separate Vercel projects sharing the same database.

---

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **TiDB/MySQL Database**: Your existing database connection string

---

## Deployment Steps

### 1. Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Vercel will auto-detect the framework (Vite + Express)

### 2. Configure Build Settings

Vercel should auto-detect these settings, but verify:

```
Framework Preset: Vite
Build Command: pnpm build
Output Directory: dist
Install Command: pnpm install
```

### 3. Add Environment Variables

Click **"Environment Variables"** and add these:

#### Required Variables

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Manus OAuth (if keeping Manus auth temporarily)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-manus-app-id
OWNER_OPEN_ID=your-owner-open-id

# Manus Forge APIs (optional, for LLM/storage features)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# App Branding
VITE_APP_TITLE=A1 Marine Care
VITE_APP_LOGO=https://your-logo-url.com/logo.png

# Node Environment
NODE_ENV=production
```

#### Optional Variables (if using features)

```bash
# Stripe (for payment webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 4. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Vercel will provide a URL like `https://your-project.vercel.app`

---

## Custom Domain Setup

### For `quote.a1marinecare.ca`

1. In Vercel project settings, go to **Domains**
2. Add `quote.a1marinecare.ca`
3. Vercel will provide DNS records:

```
Type: CNAME
Name: quote
Value: cname.vercel-dns.com
```

4. Add this record in your domain registrar (e.g., GoDaddy, Namecheap)
5. Wait 5-10 minutes for DNS propagation

### For `admin.a1marinecare.ca`

Repeat the same process for your admin dashboard deployment.

---

## Separate Deployments Strategy

### Quote Form Deployment

**Repository**: Main branch with quote form on homepage

**Vercel Project Name**: `a1-marine-quote`

**Domain**: `quote.a1marinecare.ca`

**Routes**:
- `/` - Quote submission form
- `/thank-you` - Confirmation page

### Admin Dashboard Deployment

**Repository**: Same repo, different branch or separate fork

**Vercel Project Name**: `a1-marine-admin`

**Domain**: `admin.a1marinecare.ca`

**Routes**:
- `/` - Redirects to `/admin/quotes`
- `/admin/quotes` - Admin dashboard

**Shared Database**: Both deployments use the same `DATABASE_URL`

---

## Post-Deployment Configuration

### 1. Stripe Webhook URL

If using Stripe payments, update your webhook endpoint:

```
Webhook URL: https://quote.a1marinecare.ca/api/webhooks/stripe
Events: checkout.session.completed
```

### 2. Test Authentication

- Visit your deployed URL
- Click "Sign In"
- Verify Manus OAuth redirects work correctly
- Check admin dashboard requires login

### 3. Database Migrations

Migrations should run automatically on first deployment. If not:

```bash
# Connect to Vercel project
vercel link

# Run migrations
vercel env pull .env.local
pnpm db:push
```

---

## Troubleshooting

### Build Fails

**Error**: `Cannot find module 'vite-plugin-manus-runtime'`

**Solution**: This plugin is Manus-specific. Remove it from `vite.config.ts`:

```typescript
// Remove this line
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// And remove from plugins array
const plugins = [react(), tailwindcss(), jsxLocPlugin()]; // Remove vitePluginManusRuntime()
```

### OAuth Redirect Issues

**Error**: OAuth callback fails or redirects to wrong URL

**Solution**: Update OAuth redirect URLs in Manus dashboard to match your Vercel domain:

```
Allowed Callback URLs:
- https://quote.a1marinecare.ca/api/oauth/callback
- https://admin.a1marinecare.ca/api/oauth/callback
```

### Database Connection Fails

**Error**: `ER_ACCESS_DENIED_ERROR` or connection timeout

**Solution**: 
1. Verify `DATABASE_URL` is correct
2. Ensure SSL is enabled: `?ssl={"rejectUnauthorized":true}`
3. Whitelist Vercel IPs in TiDB/MySQL firewall (or use `0.0.0.0/0` for testing)

### Environment Variables Not Loading

**Error**: `process.env.VARIABLE_NAME is undefined`

**Solution**:
1. Verify variables are added in Vercel dashboard
2. Redeploy after adding variables (they don't apply retroactively)
3. Check variable names match exactly (case-sensitive)

---

## Migration to Custom Auth

When ready to replace Manus OAuth with your own authentication:

### Option 1: Clerk (Recommended for Vercel)

1. Sign up at [clerk.com](https://clerk.com)
2. Install Clerk:
   ```bash
   pnpm add @clerk/clerk-react
   ```
3. Replace `useAuth()` hook with Clerk's `useUser()`
4. Update environment variables:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_...
   CLERK_SECRET_KEY=sk_...
   ```

### Option 2: NextAuth.js

1. Install NextAuth:
   ```bash
   pnpm add next-auth
   ```
2. Configure providers (Google, GitHub, Email)
3. Update tRPC context to use NextAuth sessions

### Option 3: Custom JWT (Already Prepared)

The JWT authentication code is already in this repo (in git history). To restore it:

```bash
git log --all --oneline | grep "JWT"
git checkout <commit-hash> -- server/_core/auth.ts
```

---

## Performance Optimization

### 1. Enable Edge Functions

In `vercel.json`:

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### 2. Add Caching Headers

For static assets, add to `server/_core/vite.ts`:

```typescript
app.use(express.static("dist/client", {
  maxAge: "1y",
  immutable: true
}));
```

### 3. Database Connection Pooling

Already configured in `server/db.ts` with Drizzle ORM.

---

## Monitoring & Logs

### View Logs

```bash
vercel logs <deployment-url>
```

### Add Error Tracking

Install Sentry:

```bash
pnpm add @sentry/react @sentry/node
```

Configure in `client/src/main.tsx` and `server/_core/index.ts`.

---

## Cost Estimate

**Vercel**:
- Free tier: 100GB bandwidth, unlimited deployments
- Pro ($20/month): Custom domains, team collaboration

**TiDB/MySQL**:
- Your existing database (no additional cost)

**Total**: $0-20/month depending on traffic

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vite.dev
- **tRPC Docs**: https://trpc.io

For project-specific issues, check:
- `DEPLOYMENT_GUIDE.md` - General deployment info
- `STRIPE_WEBHOOK_SETUP.md` - Stripe integration
- `README.md` - Project architecture
