# A1 Marine Care Quote System - Deployment Guide

## Overview

The A1 Marine Care Instant Quote system has been upgraded to a **full-stack application** with database persistence, API endpoints, and Stripe payment integration. This guide covers deployment, configuration, and usage.

---

## Architecture

### Technology Stack

**Frontend**:
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- tRPC client for type-safe API calls
- Vite for build tooling

**Backend**:
- Express 4 server
- tRPC 11 for API layer
- Drizzle ORM for database
- MySQL/TiDB database
- Stripe webhook integration

**Key Features**:
- Real-time quote calculations
- Database persistence for all submissions
- Payment tracking via Stripe webhooks
- Manual review flagging for complex quotes
- Complete audit trail with timestamps

---

## Database Schema

### Quotes Table

```sql
CREATE TABLE quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customerName VARCHAR(255) NOT NULL,
  customerEmail VARCHAR(255) NOT NULL,
  customerPhone VARCHAR(50) NOT NULL,
  boatLength INT NOT NULL,
  boatType VARCHAR(100) NOT NULL,
  serviceLocation VARCHAR(255) NOT NULL,
  estimatedTotal INT NOT NULL,
  depositAmount INT NOT NULL DEFAULT 25000,
  paymentStatus ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  requiresManualReview TINYINT(1) DEFAULT 0,
  reviewReasons TEXT,
  servicesConfig JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Field Descriptions**:
- `estimatedTotal`: Total price in cents (e.g., 450000 = $4,500.00)
- `depositAmount`: Deposit required in cents (default $250.00)
- `paymentStatus`: Tracks payment lifecycle
- `requiresManualReview`: Boolean flag for quotes requiring agent review
- `reviewReasons`: JSON array of reasons for manual review
- `servicesConfig`: Complete JSON object of all selected services and configurations

---

## API Endpoints

### tRPC Routes

All routes are available at `/api/trpc` with type-safe client bindings.

#### `quotes.submit`

**Purpose**: Submit a new quote request

**Input**:
```typescript
{
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  boatLength: number;
  boatType: string;
  serviceLocation: string;
  estimatedTotal: number; // in cents
  requiresManualReview: boolean;
  reviewReasons?: string[];
  servicesConfig: object; // Complete service selections
}
```

**Output**:
```typescript
{
  success: boolean;
  quoteId: number;
  message: string;
}
```

#### `quotes.getById`

**Purpose**: Retrieve a specific quote by ID

**Input**: `{ id: number }`

**Output**: Complete quote object with all fields

#### `quotes.list`

**Purpose**: Get all quotes (for admin dashboard)

**Input**: None

**Output**: Array of all quotes ordered by creation date (newest first)

---

## Stripe Integration

### Webhook Endpoint

**URL**: `/api/webhooks/stripe`

**Events Handled**:
- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Alternative payment confirmation

**Functionality**:
- Verifies Stripe signature (production)
- Updates quote payment status to "paid"
- Logs payment confirmations
- Triggers Marina AI agent (placeholder ready)

### Configuration Steps

1. **Development Testing**:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login to Stripe
   stripe login
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

2. **Production Setup**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.manus.space/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy webhook signing secret
   - Add to environment: `STRIPE_WEBHOOK_SECRET=whsec_...`

3. **Upgrade to Dynamic Checkout** (Recommended):
   - Replace fixed payment link with Stripe Checkout Sessions API
   - Pass quote ID as metadata: `metadata: { quoteId: "123" }`
   - Webhook can then directly update the correct quote

---

## Environment Variables

### Required System Variables (Auto-Injected)

```bash
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
OWNER_OPEN_ID=...
OWNER_NAME=...
BUILT_IN_FORGE_API_URL=...
BUILT_IN_FORGE_API_KEY=...
```

### Optional Production Variables

```bash
# Stripe webhook signature verification (production only)
STRIPE_WEBHOOK_SECRET=whsec_...

# Custom domain (if using)
VITE_APP_URL=https://quotes.a1marinecare.ca
```

---

## Deployment Checklist

### Pre-Deployment

- [x] Database schema migrated (`pnpm db:push`)
- [x] All unit tests passing (`pnpm test`)
- [x] Environment variables configured
- [x] Stripe webhook endpoint documented
- [ ] Admin dashboard created (optional)
- [ ] Thank you page updated with quote details

### Deployment Steps

1. **Save Checkpoint**:
   ```bash
   # In Manus UI, click "Save Checkpoint" button
   # Or use webdev_save_checkpoint tool
   ```

2. **Publish Application**:
   - Click "Publish" button in Manus UI
   - Application will be deployed to `https://your-subdomain.manus.space`

3. **Configure Stripe Webhook**:
   - Add production webhook URL in Stripe Dashboard
   - Test with Stripe test mode payment

4. **Verify Deployment**:
   - Submit test quote through live form
   - Check database for new entry
   - Verify Stripe webhook receives events

### Post-Deployment

- [ ] Monitor database for quote submissions
- [ ] Test Stripe payment flow end-to-end
- [ ] Configure Marina AI trigger (see MARINA_KNOWLEDGE_BASE.md)
- [ ] Set up email notifications (optional)
- [ ] Add analytics tracking (optional)

---

## Admin Operations

### Viewing Quotes

**Option 1: Database UI** (Manus Management Panel)
- Navigate to "Database" tab in Manus UI
- View `quotes` table
- Filter, sort, and export data

**Option 2: SQL Queries**
```sql
-- View all pending quotes
SELECT * FROM quotes WHERE paymentStatus = 'pending' ORDER BY createdAt DESC;

-- View paid quotes
SELECT * FROM quotes WHERE paymentStatus = 'paid' ORDER BY createdAt DESC;

-- View quotes requiring manual review
SELECT * FROM quotes WHERE requiresManualReview = 1 ORDER BY createdAt DESC;

-- Get quote details with services
SELECT 
  id,
  customerName,
  customerEmail,
  boatLength,
  boatType,
  estimatedTotal / 100 as totalDollars,
  paymentStatus,
  servicesConfig,
  createdAt
FROM quotes
WHERE id = ?;
```

**Option 3: Admin Dashboard** (Future Enhancement)
- Build custom dashboard using `quotes.list` tRPC endpoint
- Display quotes in table format
- Add filters for payment status, manual review, date range
- Export to CSV functionality

### Updating Payment Status

**Automatic** (via Stripe webhook):
- Payment status updates automatically when webhook receives confirmation

**Manual** (if needed):
```sql
UPDATE quotes SET paymentStatus = 'paid' WHERE id = ?;
```

### Handling Manual Review Quotes

1. Check `reviewReasons` field for specific issues
2. Review `servicesConfig` JSON for complete service details
3. Contact customer via email/phone with revised quote
4. Update `estimatedTotal` if pricing changes
5. Send new payment link or process payment manually

---

## Monitoring & Maintenance

### Health Checks

- **Database Connection**: Monitor connection pool status
- **API Response Times**: Track tRPC endpoint latency
- **Webhook Delivery**: Check Stripe webhook logs for failures
- **Error Logs**: Review server logs for exceptions

### Backup Strategy

- **Database Backups**: Automatic daily backups via Manus platform
- **Checkpoint History**: Rollback to previous versions if needed
- **Export Quotes**: Regular CSV exports for offline records

### Performance Optimization

- **Database Indexing**: Add indexes on frequently queried fields
  ```sql
  CREATE INDEX idx_payment_status ON quotes(paymentStatus);
  CREATE INDEX idx_created_at ON quotes(createdAt);
  CREATE INDEX idx_customer_email ON quotes(customerEmail);
  ```

- **Query Optimization**: Use pagination for large quote lists
- **Caching**: Consider Redis for frequently accessed data

---

## Troubleshooting

### Quote Submission Fails

**Symptoms**: Frontend shows error, no database entry

**Checks**:
1. Verify database connection: `pnpm db:push`
2. Check server logs: `.manus-logs/devserver.log`
3. Verify tRPC endpoint: Test with unit tests
4. Check browser console for client errors

**Common Causes**:
- Database connection timeout
- Invalid input data (missing required fields)
- JSON serialization errors in `servicesConfig`

### Stripe Webhook Not Firing

**Symptoms**: Payment completes but status stays "pending"

**Checks**:
1. Verify webhook URL in Stripe Dashboard
2. Check webhook signing secret (production)
3. Review Stripe webhook logs for delivery failures
4. Test with Stripe CLI: `stripe trigger checkout.session.completed`

**Common Causes**:
- Incorrect webhook URL (missing `/api/webhooks/stripe`)
- Firewall blocking Stripe IPs
- Signature verification failing (wrong secret)
- Server not responding (check uptime)

### Payment Status Not Updating

**Symptoms**: Webhook fires but database not updated

**Checks**:
1. Review server logs for webhook processing errors
2. Verify quote ID in webhook metadata
3. Check database permissions for UPDATE queries
4. Test manual update: `UPDATE quotes SET paymentStatus = 'paid' WHERE id = 1;`

**Common Causes**:
- Quote ID not passed in Stripe metadata (using fixed link)
- Database connection lost during webhook processing
- Race condition (multiple webhook events)

---

## Future Enhancements

### Priority 1: Dynamic Stripe Checkout

**Current**: Fixed payment link ($250 deposit)
**Proposed**: Dynamic checkout sessions with quote metadata

**Benefits**:
- Pass quote ID to Stripe for automatic status updates
- Support variable deposit amounts
- Include quote details in payment description
- Better tracking and reconciliation

**Implementation**:
```typescript
// server/routers.ts
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

createCheckoutSession: publicProcedure
  .input(z.object({ quoteId: z.number() }))
  .mutation(async ({ input }) => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Boat Service Deposit' },
          unit_amount: 25000, // $250
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.VITE_APP_URL}/thank-you?quote=${input.quoteId}`,
      cancel_url: `${process.env.VITE_APP_URL}/?cancelled=true`,
      metadata: { quoteId: input.quoteId.toString() },
    });
    return { url: session.url };
  });
```

### Priority 2: Photo Upload for Interior Services

**Current**: Photo upload field exists but not connected
**Proposed**: S3 upload integration

**Implementation**:
- Use `storagePut()` helper from `server/storage.ts`
- Store S3 URLs in database (new column: `photoUrls JSON`)
- Display photos in admin dashboard

### Priority 3: Customer Portal

**Features**:
- View quote status by email lookup
- Download quote PDF
- Update contact information
- Request quote revisions

### Priority 4: Email Notifications

**Triggers**:
- Quote submitted (confirmation email)
- Payment received (receipt email)
- Manual review required (agent notification)
- Quote ready (customer notification)

**Implementation**:
- Use Manus notification API or third-party service (SendGrid, Mailgun)
- Email templates for each trigger type
- Unsubscribe management

---

## Support & Documentation

### Related Documentation

- `STRIPE_WEBHOOK_SETUP.md` - Detailed Stripe webhook configuration
- `MARINA_KNOWLEDGE_BASE.md` - Marina AI agent integration
- `ELEVENLABS_INTEGRATION_GUIDE.md` - Voice AI setup
- `server/quotes.test.ts` - API endpoint examples and test cases

### Getting Help

For technical support or questions:
- Review unit tests for API usage examples
- Check server logs in `.manus-logs/` directory
- Use Manus support: https://help.manus.im
- Stripe support: https://support.stripe.com

---

## Version History

**v1.0.0** (Current)
- Full-stack upgrade with database persistence
- tRPC API endpoints for quote management
- Stripe webhook integration
- Unit tests (5/5 passing)
- Comprehensive documentation

**Planned v1.1.0**
- Dynamic Stripe checkout sessions
- Admin dashboard
- Photo upload to S3
- Email notifications
- Marina AI trigger implementation

---

## License & Credits

**A1 Marine Care Instant Quote System**
Built with Manus platform
© 2026 A1 Marine Care

**Technology Credits**:
- React, TypeScript, Tailwind CSS
- tRPC, Drizzle ORM, Express
- Stripe payment processing
- Manus hosting platform
