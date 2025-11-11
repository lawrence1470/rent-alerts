# Week-Based Payment System - Complete Documentation

## Overview

This directory contains complete documentation for implementing a Stripe-based payment system with week-based access control for rental notification frequency tiers.

**System Design**: One-time payments (NOT subscriptions) where users purchase notification access in weekly increments (1-6 weeks) across three frequency tiers.

---

## 📚 Documentation Files

### 1. `payment-architecture.md` (Primary Reference - 600+ lines)
**Complete technical specification covering:**
- Database schema design (4 new tables + 2 columns added to existing)
- Access validation service architecture
- Purchase flow & Stripe integration
- Expiry handling strategy
- API endpoint specifications
- Edge case handling (refunds, upgrades, concurrent purchases)
- Performance considerations (indexes, caching, batch processing)
- Security & compliance
- Monitoring & alerting

**Read this first** for comprehensive understanding of the entire system.

### 2. `payment-flow-diagrams.md` (Visual Reference - 400+ lines)
**Visual ASCII diagrams showing:**
- Complete purchase flow (user → Stripe → access grant)
- Access validation in cron job (how 35% of API calls are saved)
- Access period calculation logic (extending vs new access)
- Webhook event processing flow (with error handling)
- Expiry & renewal flows (automated reminders, status updates)
- Refund processing flow (immediate access revocation)
- Critical database query patterns with performance targets

**Use this** to visualize how data flows through the system.

### 3. `payment-implementation-guide.md` (Quick Reference - 500+ lines)
**Code snippets and step-by-step instructions:**
- Database migration SQL
- Seed script for payment tiers
- Core service implementations (access validation, payment processing)
- API endpoint code (checkout, webhooks, user status)
- Updated cron job with access filtering
- Frontend components (pricing page, access status banner)
- Testing checklist
- Common issues & solutions

**Use this** when actually implementing the system.

---

## 🎯 Key Design Decisions

### Pricing Model
```
15-Minute Checks: $20/week
30-Minute Checks: $15/week
Hourly Checks:    $10/week
Free Tier:        Hourly checks (no payment required)
```

**Purchase Quantity**: 1-6 weeks at a time
**Payment Type**: One-time payments (not recurring subscriptions)
**Access Model**: Additive (purchases extend existing access, not replace)

### Architecture Highlights

1. **Week-Based Precision**: All access periods calculated in full weeks (7 days)
2. **Additive Extension**: New purchases extend from current expiry, preserving existing access
3. **Efficient Filtering**: Cron job uses single batch query to filter alerts by user access tier
4. **Multiple Active Periods**: Users can have overlapping periods (system uses fastest tier)
5. **Graceful Degradation**: Expired access reverts to free tier (hourly), not complete loss

---

## 📊 Database Schema Summary

### New Tables (4)

1. **`payment_tiers`** - Frequency tier definitions
   - Stores: name, slug, checkIntervalMinutes, pricePerWeekCents, stripePriceId
   - Seeded with 3 tiers (15-min, 30-min, hourly)

2. **`user_access_periods`** - Active access tracking
   - Stores: userId, tierId, startsAt, expiresAt, status
   - **Critical index**: `(userId, status, expiresAt)` for <50ms cron queries

3. **`purchases`** - Purchase history & audit trail
   - Stores: userId, tierId, weekQuantity, amounts, Stripe IDs, status
   - Complete audit trail for compliance and debugging

4. **`stripe_webhook_events`** - Webhook deduplication
   - Stores: stripeEventId, eventType, status, eventData, errors
   - Ensures idempotent webhook processing

### Updated Tables (1)

**`alerts`** - Added columns:
- `preferred_tier_id` - User's selected frequency tier
- `last_checked` - Timestamp of last check (for frequency enforcement)

---

## 🔄 Critical Flows

### Purchase Flow (Happy Path)
```
1. User clicks "Buy 3 weeks @ $20/week"
2. Frontend: POST /api/checkout/create-session
3. Backend: Create Stripe checkout session
4. User redirected to Stripe
5. User completes payment
6. Stripe webhook: checkout.session.completed → Create purchase (pending)
7. Stripe webhook: payment_intent.succeeded → Grant access (transaction)
8. Access period created: startsAt = now or existing expiry, expiresAt = start + 21 days
9. User redirected to success page, sees "Access until [date]"
```

### Access Validation (Cron Job - Every 15 Min)
```
1. Get all active alerts (10,000 alerts)
2. Extract unique user IDs (5,000 users)
3. BATCH QUERY: Get access intervals for all users (single query, <100ms)
4. Filter alerts: only check if (now - lastCheck) >= userInterval
5. Result: 6,500/10,000 alerts checked (35% API call savings)
6. Continue with existing batching logic...
```

### Expiry Handling
```
Cron Job (Hourly @ :00):
1. Find active periods where expiresAt <= NOW()
2. Update status = 'expired'
3. Send expiry notification emails
4. User reverts to free tier (hourly checks)

Reminder Job (Daily @ 9am):
1. Find periods expiring in 24-48 hours
2. Send reminder emails with renewal CTA
```

---

## ⚡ Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Access check query | <50ms | Composite index (userId, status, expiresAt) |
| Batch access validation | <100ms | Single query for all users |
| Cron job total time | <5 seconds | Batch queries, parallel processing |
| Webhook processing | <200ms | Transaction for DB, async email |
| Purchase completion | <500ms | Atomic transaction, no blocking ops |

---

## 🔐 Security Considerations

- ✅ Stripe webhook signature verification
- ✅ Clerk authentication on all payment endpoints
- ✅ Idempotent webhook processing (prevents duplicate charges)
- ✅ Database transactions for access grants (atomic operations)
- ✅ Complete audit trail (all events logged)
- ✅ PCI compliance (Stripe handles card data, we never store it)

---

## 🧪 Testing Strategy

### Unit Tests
- Access validation logic
- Access period calculation
- Should-check-alert logic
- Webhook event routing

### Integration Tests
- Complete purchase flow (checkout → webhook → access grant)
- Refund flow (webhook → access revocation)
- Expiry flow (cron → status update → notification)

### End-to-End Tests
- User journey: pricing page → Stripe → success → dashboard shows access
- Edge cases: concurrent purchases, upgrades, multiple periods

### Load Tests
- Cron job with 10,000+ alerts
- Webhook processing under high load
- Database query performance under scale

---

## 📈 Monitoring & Alerts

### Dashboards to Create
```
Revenue Metrics:
- Total revenue (daily/weekly/monthly)
- Revenue by tier
- Purchase conversion rate

Access Metrics:
- Active paid users
- Users by tier
- Expiration rate
- Renewal rate

Operational Metrics:
- Webhook processing time (p50, p95, p99)
- Webhook failure rate
- Cron job execution time
- Cron job success rate
```

### Critical Alerts
```
🔴 CRITICAL:
- Webhook failure rate > 5%
- Cron job failure
- Access grant transaction failure
- Stripe API errors

🟡 WARNING:
- Webhook processing time > 500ms
- Cron job execution time > 10 seconds
- Unusual refund rate (> 2%)
- Payment failures > 10%
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up Stripe account (test mode)
- [ ] Create products and prices in Stripe
- [ ] Run database migration
- [ ] Seed payment tiers with actual Stripe Price IDs

### Phase 2: Core Services (Week 1-2)
- [ ] Implement access-validation.service.ts
- [ ] Implement payment-processing.service.ts
- [ ] Update cron-job.service.ts with access filtering
- [ ] Write unit tests for core logic

### Phase 3: API Endpoints (Week 2)
- [ ] POST /api/checkout/create-session
- [ ] POST /api/webhooks/stripe
- [ ] GET /api/user/access-status
- [ ] GET /api/user/purchase-history
- [ ] Write integration tests

### Phase 4: Cron Jobs (Week 2-3)
- [ ] Update /api/cron/check-alerts
- [ ] Create /api/cron/mark-expired-access
- [ ] Create /api/cron/send-expiry-reminders
- [ ] Update vercel.json

### Phase 5: Frontend (Week 3)
- [ ] Build pricing page with tier cards
- [ ] Implement checkout flow
- [ ] Create payment success/cancel pages
- [ ] Add access status banner to dashboard
- [ ] Build purchase history page

### Phase 6: Testing & Launch (Week 4)
- [ ] End-to-end testing with Stripe test mode
- [ ] Load testing with simulated 10K alerts
- [ ] Set up monitoring dashboards
- [ ] Configure alerts
- [ ] Production deployment
- [ ] Switch Stripe to live mode

---

## 🎓 Key Concepts to Understand

### 1. Additive Access Extension
When a user buys more weeks while having active access, the new period **extends** from the current expiry, it doesn't replace it.

**Example**:
- User has 2 weeks remaining (expires Nov 22)
- User buys 3 more weeks
- New expiry: Nov 22 + 21 days = Dec 13
- **Total access**: 5 weeks (2 existing + 3 new)

### 2. Multiple Active Periods (Different Tiers)
Users can have multiple active periods simultaneously (e.g., hourly tier + 15-min tier).

**Behavior**: Cron job uses **fastest tier** (minimum checkInterval) across all active periods.

### 3. Week-Based Calculation
All date calculations use **full weeks (7 days)** with UTC timestamps.

```typescript
const expiresAt = new Date(startsAt);
expiresAt.setUTCDate(expiresAt.getUTCDate() + (weekQuantity * 7));
// MUST use setUTCDate (not setDate) to avoid DST issues
```

### 4. Batch Access Validation
Instead of querying database for each alert, we:
1. Get all active alerts
2. Extract unique user IDs
3. **Single batch query** for all user access intervals
4. Filter alerts in memory

**Result**: 10,000 alerts → 1 database query (not 10,000)

### 5. Idempotent Webhook Processing
Stripe may send the same webhook event multiple times.

**Protection**:
- Store all events in `stripe_webhook_events` table
- Check `stripeEventId` before processing
- If status = 'processed', skip and return 200 OK

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "Webhook signature verification failed"
- **Cause**: Wrong webhook secret or request body consumed before verification
- **Solution**: Use `await req.text()` to get raw body, verify BEFORE parsing

**Issue**: "Access not granted after payment"
- **Cause**: Webhook processing failed or transaction rolled back
- **Solution**: Check `stripe_webhook_events` table for error messages

**Issue**: "User has no access but payment succeeded"
- **Cause**: `payment_intent.succeeded` webhook not received or failed
- **Solution**: Check Stripe webhook delivery logs, manually trigger if needed

**Issue**: "Cron job taking >10 seconds"
- **Cause**: Missing database indexes or N+1 query problem
- **Solution**: Verify indexes exist, use batch queries

### Debug Commands

```sql
-- Check user's active access
SELECT * FROM user_access_periods
WHERE user_id = 'user_xxx'
AND status = 'active'
AND expires_at >= NOW();

-- Check recent purchases
SELECT * FROM purchases
WHERE user_id = 'user_xxx'
ORDER BY created_at DESC
LIMIT 10;

-- Check failed webhook events
SELECT * FROM stripe_webhook_events
WHERE status = 'failed'
ORDER BY received_at DESC
LIMIT 10;

-- Check cron job performance
SELECT * FROM cron_job_logs
WHERE job_name = 'check-alerts'
ORDER BY started_at DESC
LIMIT 10;
```

---

## 📝 Additional Resources

### Stripe Documentation
- [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions)
- [Webhooks](https://docs.stripe.com/webhooks)
- [Testing](https://docs.stripe.com/testing)

### Next.js Documentation
- [API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

### Database
- [Drizzle ORM](https://orm.drizzle.team/)
- [Neon Postgres](https://neon.tech/docs)

---

## ✅ Success Criteria

The payment system is successfully implemented when:

1. ✅ User can purchase 1-6 weeks of any tier via Stripe
2. ✅ Access is granted immediately after successful payment
3. ✅ Multiple purchases correctly extend existing access
4. ✅ Cron job filters alerts by user's frequency tier
5. ✅ Expired access reverts to free tier (hourly checks)
6. ✅ Refunds immediately revoke access
7. ✅ All webhook events are processed idempotently
8. ✅ Database queries meet performance targets (<50ms)
9. ✅ Complete audit trail exists for all purchases
10. ✅ Monitoring dashboards show revenue and access metrics

---

## 🤝 Contributing

When making changes to the payment system:

1. **Update documentation** if behavior changes
2. **Add tests** for new functionality
3. **Consider edge cases** (refunds, concurrent purchases, timezone handling)
4. **Monitor performance** (check query execution times)
5. **Verify audit trail** (all state changes logged)

---

## 📄 License

This documentation is part of the Rental Notifications application codebase.

---

**Last Updated**: November 8, 2024
**Version**: 1.0.0
**Author**: Backend Architect (Claude)
