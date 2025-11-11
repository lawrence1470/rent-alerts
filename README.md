This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing Stripe Webhooks Locally

To test the payment system and webhook functionality during development, use the Stripe CLI to forward webhook events to your local server.

### Setup Stripe CLI

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to your Stripe account:**
   ```bash
   stripe login
   ```

3. **Start forwarding webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   This will output a webhook signing secret:
   ```
   > Ready! Your webhook signing secret is whsec_xxx (^C to quit)
   ```

4. **Add the webhook secret to `.env.local`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

### Testing Payment Flow

With both your dev server and Stripe CLI running:

**Terminal 1 - Run your app:**
```bash
npm run dev
```

**Terminal 2 - Keep Stripe CLI running:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Terminal 3 - Trigger test webhook events:**
```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test refund
stripe trigger charge.refunded
```

### Webhook Events

The app listens for these 4 Stripe webhook events:
- `checkout.session.completed` - Grants user access after successful checkout
- `payment_intent.succeeded` - Marks purchase as complete
- `payment_intent.payment_failed` - Handles failed payments
- `charge.refunded` - Revokes access on refunds

### Verifying Webhooks Work

Check the terminal running `stripe listen` to see webhook events being received and forwarded to your local server. Your app logs will show webhook processing results.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
