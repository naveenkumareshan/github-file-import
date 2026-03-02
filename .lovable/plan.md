

# Store Razorpay API Keys as Secrets

## What Needs to Happen

1. **Store `RAZORPAY_KEY_ID`** as a backend secret with value `rzp_live_SMR8KHzhG3dzxM`
2. **Store `RAZORPAY_KEY_SECRET`** -- need to ask the user for this value
3. Optionally store `RAZORPAY_WEBHOOK_SECRET` if the user has one

## No Code Changes Needed

The edge functions (`razorpay-create-order` and `razorpay-verify-payment`) already read these secrets via `Deno.env.get("RAZORPAY_KEY_ID")` and `Deno.env.get("RAZORPAY_KEY_SECRET")`. Once the secrets are configured, Razorpay will work automatically in live mode instead of test mode.

## Steps
1. Add `RAZORPAY_KEY_ID` secret
2. Ask for and add `RAZORPAY_KEY_SECRET` secret
3. Verify integration works by testing the edge function

