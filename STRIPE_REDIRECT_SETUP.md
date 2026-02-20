# Stripe Payment Link Redirect Setup

## Overview

After creating the thank you page at `/thank-you`, you need to configure your Stripe payment link to redirect customers to this page after they complete their $250 deposit payment.

## Step-by-Step Instructions

### 1. Publish Your Manus Application

Before configuring Stripe, you must publish your application to get a permanent public URL:

1. Open the **Management UI** (right panel in Manus interface)
2. Click the **Publish** button in the top-right header
3. Your application will be deployed to: `https://[your-project-name].manus.space`
4. Copy this URL - you'll need it for Stripe configuration

**Example**: If your project is named `a1-marine-quote`, your URL will be:
```
https://a1-marine-quote.manus.space
```

### 2. Configure Stripe Payment Link Redirect

1. **Log into Stripe Dashboard**
   - Navigate to: https://dashboard.stripe.com/

2. **Find Your Payment Link**
   - In the left sidebar, click **"Payment Links"**
   - Or use the search bar at the top and search for "Payment Links"
   - Locate the payment link ending in `...Tjgbm01` (your $250 deposit link)

3. **Edit the Payment Link**
   - Click on the payment link to open its details
   - Click the **"Edit"** button (usually in the top-right corner)

4. **Configure Post-Payment Redirect**
   - Scroll down to the **"After payment"** section
   - Select **"Redirect to URL"** (instead of "Show confirmation page")
   - Enter your thank you page URL:
     ```
     https://a1-marine-quote.manus.space/thank-you
     ```
   - Replace `a1-marine-quote` with your actual Manus project name

5. **Save Changes**
   - Scroll to the bottom of the page
   - Click **"Save"** to apply the changes

### 3. Test the Complete Flow

After configuring the redirect, test the entire payment flow:

1. **Open Your Quote Form**
   - Navigate to: `https://a1-marine-quote.manus.space`

2. **Fill Out the Form**
   - Enter test boat details (e.g., 32ft Cruiser)
   - Select a service (e.g., Gelcoat Restoration)
   - Fill in contact information with a real email you can access

3. **Complete Test Payment**
   - Click the **"Pay $250 Deposit"** button
   - Use Stripe test card: `4242 4242 4242 4242`
   - Enter any future expiry date (e.g., 12/25)
   - Enter any 3-digit CVC (e.g., 123)
   - Enter any ZIP code (e.g., 12345)

4. **Verify Redirect**
   - After payment completes, you should be automatically redirected to:
     ```
     https://a1-marine-quote.manus.space/thank-you
     ```
   - You should see the "Thank You for Your Deposit!" page with:
     - Success checkmark icon
     - Deposit confirmation message
     - "What Happens Next" section
     - Contact information
     - Action buttons

### 4. Switch to Live Mode (Production)

Once testing is complete, switch from test mode to live mode:

1. **In Stripe Dashboard**
   - Toggle the **"Test mode"** switch in the top-right to **OFF**
   - This activates live mode

2. **Update Payment Link** (if needed)
   - Your live payment link may have a different URL
   - Verify the redirect URL is still set correctly in live mode
   - The thank you page URL remains the same

3. **Update Quote Form** (if payment link URL changed)
   - If your live payment link has a different URL than test mode
   - Update the Stripe URL in your quote form code
   - Redeploy your application

## Custom Domain Setup (Optional)

If you want to use your own domain (e.g., `quote.a1marinecare.ca`) instead of the Manus subdomain:

### 1. Configure Custom Domain in Manus

1. Open **Management UI** → **Settings** → **Domains**
2. Click **"Add Custom Domain"**
3. Enter your desired subdomain: `quote.a1marinecare.ca`
4. Follow the DNS configuration instructions provided
5. Wait for DNS propagation (usually 5-30 minutes)

### 2. Update Stripe Redirect URL

1. Return to Stripe Dashboard → Payment Links
2. Edit your payment link
3. Update the redirect URL to:
   ```
   https://quote.a1marinecare.ca/thank-you
   ```
4. Save changes

### 3. Test with Custom Domain

- Navigate to: `https://quote.a1marinecare.ca`
- Complete a test payment
- Verify redirect to: `https://quote.a1marinecare.ca/thank-you`

## Troubleshooting

### Issue: Redirect Not Working

**Symptoms**: After payment, customer sees Stripe's default confirmation page instead of your thank you page.

**Solutions**:
1. Verify you selected "Redirect to URL" (not "Show confirmation page")
2. Check that the URL is correct with no typos
3. Ensure the URL includes `https://` protocol
4. Verify your Manus application is published and accessible
5. Clear browser cache and test in incognito mode

### Issue: Thank You Page Shows 404 Error

**Symptoms**: Redirect works but shows "Page Not Found" error.

**Solutions**:
1. Verify the `/thank-you` route exists in your application
2. Check that `ThankYou.tsx` component is imported in `App.tsx`
3. Redeploy your application after making changes
4. Test the thank you page directly by visiting the URL

### Issue: Payment Link URL Changed

**Symptoms**: After switching to live mode, the payment link URL is different.

**Solutions**:
1. Copy the new live payment link URL from Stripe
2. Update the Stripe URL in `client/src/pages/Home.tsx`
3. Search for the old URL (ending in `...Tjgbm01`)
4. Replace with the new live URL
5. Save and redeploy your application

## Next Steps

After configuring the Stripe redirect:

1. **Monitor Payment Flow**
   - Check Stripe dashboard for successful payments
   - Verify customers are reaching the thank you page
   - Review any error logs or failed redirects

2. **Set Up ElevenLabs Integration** (Optional)
   - Follow the `ELEVENLABS_INTEGRATION_GUIDE.md` document
   - Configure Marina AI agent to automatically call customers
   - Automate appointment scheduling

3. **Add Analytics** (Optional)
   - Track conversion rates from quote to deposit
   - Monitor thank you page visits
   - Measure customer engagement with follow-up

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Author**: Manus AI
