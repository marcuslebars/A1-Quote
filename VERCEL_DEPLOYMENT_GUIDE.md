# Vercel Deployment Guide for A1 Marine Care Quote App

This guide provides step-by-step instructions for deploying your A1 Marine Care instant quote application to Vercel as a static site.

## Understanding the Error

The error you encountered occurs because Vercel is a **serverless platform** designed for static sites and serverless functions, not traditional Node.js servers. Your application includes a `server/index.ts` file with an Express server, but this is only used for local development. For production deployment on Vercel, we deploy the **static build output** directly.

## Prerequisites

Before deploying to Vercel, ensure you have:

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- The `vercel.json` configuration file in your project root (already created)

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

This is the easiest method for first-time deployment.

**Step 1: Import Your Project**

Log into your Vercel dashboard and click **"Add New Project"**. Connect your Git repository (GitHub, GitLab, or Bitbucket) and select the `a1-marine-quote` repository.

**Step 2: Configure Build Settings**

Vercel should automatically detect the configuration from `vercel.json`, but verify these settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `pnpm build` |
| **Output Directory** | `dist/public` |
| **Install Command** | `pnpm install` |

**Step 3: Add Environment Variables**

If your application requires environment variables (like analytics endpoints), add them in the "Environment Variables" section. For this project, the following are automatically injected by Manus during local development but need to be set for Vercel:

- `VITE_ANALYTICS_ENDPOINT` (optional)
- `VITE_ANALYTICS_WEBSITE_ID` (optional)

You can leave these blank if you don't need analytics tracking.

**Step 4: Deploy**

Click **"Deploy"** and wait for the build to complete. Vercel will provide you with a production URL (e.g., `https://a1-marine-quote.vercel.app`).

### Method 2: Deploy via Vercel CLI

For developers who prefer command-line deployment.

**Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

**Step 2: Login to Vercel**

```bash
vercel login
```

**Step 3: Deploy from Project Directory**

```bash
cd /path/to/a1-marine-quote
vercel
```

Follow the prompts to link your project. For subsequent deployments, simply run `vercel` again.

**Step 4: Deploy to Production**

```bash
vercel --prod
```

## Configuration Details

The `vercel.json` file in your project root contains the following configuration:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/public",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Configuration Breakdown

**buildCommand**: Specifies the command Vercel runs to build your application. This executes `pnpm build`, which compiles your TypeScript, bundles your React components, and outputs static files.

**outputDirectory**: Tells Vercel where to find the built static files. Your Vite build outputs to `dist/public`, which contains the `index.html` and all assets.

**rewrites**: Configures single-page application (SPA) routing. This rule ensures that all routes (like `/thank-you`) are handled by your React Router (Wouter) instead of returning 404 errors. When a user navigates to any path, Vercel serves `index.html`, and your client-side router handles the routing.

## Post-Deployment Steps

### Update Stripe Payment Link

After deployment, you need to update your Stripe payment link to redirect to your new Vercel URL instead of the Manus development server.

**Step 1: Get Your Vercel URL**

After deployment, Vercel provides a production URL like `https://a1-marine-quote.vercel.app`. Copy this URL.

**Step 2: Update Stripe Redirect**

Log into your Stripe Dashboard, navigate to **Payment Links**, find your deposit payment link (ending in `...Tjgbm01`), and update the **"After payment"** redirect URL to:

```
https://a1-marine-quote.vercel.app/thank-you
```

### Configure Custom Domain (Optional)

If you want to use a custom domain like `quote.a1marinecare.ca`:

**Step 1: Add Domain in Vercel**

Go to your project settings in Vercel, click **"Domains"**, and add your custom domain.

**Step 2: Update DNS Records**

Vercel will provide DNS records (usually a CNAME or A record). Add these to your domain registrar's DNS settings.

**Step 3: Update Stripe Redirect**

Once your custom domain is active, update the Stripe payment link redirect to use your custom domain:

```
https://quote.a1marinecare.ca/thank-you
```

## Troubleshooting

### Build Fails with TypeScript Errors

If your build fails due to TypeScript errors, run `pnpm check` locally to identify and fix type errors before deploying.

### 404 Errors on Page Refresh

If you get 404 errors when refreshing pages other than the homepage, verify that the `rewrites` configuration in `vercel.json` is correct. The rewrite rule ensures all routes are handled by your SPA.

### Missing Environment Variables

If your application relies on environment variables that were available in Manus development, you'll need to add them manually in Vercel's project settings under **"Environment Variables"**.

### Build Command Not Found

If Vercel can't find `pnpm`, it may default to npm. Ensure your `package.json` includes the `packageManager` field:

```json
"packageManager": "pnpm@10.4.1+sha512.c753b6c3ad7afa13af388fa6d808035a008e30ea9993f58c6663e2bc5ff21679aa834db094987129aa4d488b86df57f7b634981b2f827cdcacc698cc0cfb88af"
```

This tells Vercel to use pnpm instead of npm.

## Continuous Deployment

Once your project is connected to Vercel, every push to your main branch automatically triggers a new deployment. This enables continuous deployment workflow:

1. Make changes locally
2. Commit and push to your Git repository
3. Vercel automatically builds and deploys the updated version
4. Your production site is updated within minutes

## Alternative: Manus Built-in Hosting

While Vercel is a popular choice, remember that **Manus provides built-in hosting** with custom domain support. If you prefer to use Manus hosting instead:

1. Click the **"Publish"** button in the Manus Management UI (requires creating a checkpoint first)
2. Your site will be deployed to a `*.manus.space` domain
3. Configure a custom domain directly in Manus settings

Manus hosting is optimized for projects built within the Manus environment and may offer simpler deployment for your use case.

## Summary

Your A1 Marine Care quote application is a static frontend application that deploys perfectly to Vercel. The `vercel.json` configuration ensures proper SPA routing, and the build process outputs static files that Vercel serves efficiently. After deployment, remember to update your Stripe payment link redirect URL to point to your new Vercel production URL.

---

**Author**: Manus AI  
**Last Updated**: February 2026
