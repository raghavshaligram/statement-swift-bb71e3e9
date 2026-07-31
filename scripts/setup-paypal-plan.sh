#!/usr/bin/env bash
#
# One-time setup: creates the "LedgerLocal Pro" Product and its $19/month
# Plan on PayPal. Run this once against sandbox to test, and once again
# against live when you're ready to go live -- each run needs the matching
# Client ID/Secret pair.
#
# Usage:
#   PAYPAL_CLIENT_ID=xxx PAYPAL_CLIENT_SECRET=xxx PAYPAL_API_BASE=https://api-m.sandbox.paypal.com ./setup-paypal-plan.sh
#
# For live, use PAYPAL_API_BASE=https://api-m.paypal.com instead.
#
# The script prints a PLAN_ID at the end -- set that as PAYPAL_PLAN_ID_SANDBOX
# (or PAYPAL_PLAN_ID_LIVE) via `supabase secrets set`.

set -euo pipefail

: "${PAYPAL_CLIENT_ID:?Set PAYPAL_CLIENT_ID}"
: "${PAYPAL_CLIENT_SECRET:?Set PAYPAL_CLIENT_SECRET}"
: "${PAYPAL_API_BASE:?Set PAYPAL_API_BASE (sandbox or live)}"

echo "Getting access token..."
TOKEN_RESPONSE=$(curl -s "$PAYPAL_API_BASE/v1/oauth2/token" \
  -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET" \
  -d "grant_type=client_credentials")
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'access_token' not in d:
    print('ERROR: could not authenticate with PayPal. Response was:', file=sys.stderr)
    print(json.dumps(d, indent=2), file=sys.stderr)
    sys.exit(1)
print(d['access_token'])
")

echo "Creating product..."
PRODUCT_RESPONSE=$(curl -s "$PAYPAL_API_BASE/v1/catalogs/products" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "PayPal-Request-Id: ledgerlocal-product-$(date +%s)" \
  -d '{
    "name": "LedgerLocal Pro",
    "description": "Unlimited bank statement conversions, no page cap, all export formats",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }')
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'id' not in d:
    print('ERROR: product creation failed. PayPal responded:', file=sys.stderr)
    print(json.dumps(d, indent=2), file=sys.stderr)
    sys.exit(1)
print(d['id'])
")
echo "Product created: $PRODUCT_ID"

echo "Creating plan..."
PLAN_RESPONSE=$(curl -s "$PAYPAL_API_BASE/v1/billing/plans" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "PayPal-Request-Id: ledgerlocal-plan-$(date +%s)" \
  -d '{
    "product_id": "'"$PRODUCT_ID"'",
    "name": "LedgerLocal Pro Monthly",
    "description": "$19/month flat -- unlimited conversions, no page cap, all export formats",
    "status": "ACTIVE",
    "billing_cycles": [
      {
        "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
        "tenure_type": "REGULAR",
        "sequence": 1,
        "total_cycles": 0,
        "pricing_scheme": {
          "fixed_price": { "value": "19.00", "currency_code": "USD" }
        }
      }
    ],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "payment_failure_threshold": 3
    }
  }')
PLAN_ID=$(echo "$PLAN_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if 'id' not in d:
    print('ERROR: plan creation failed. PayPal responded:', file=sys.stderr)
    print(json.dumps(d, indent=2), file=sys.stderr)
    sys.exit(1)
print(d['id'])
")

echo ""
echo "=========================================="
echo "PLAN_ID: $PLAN_ID"
echo "=========================================="
echo ""
echo "Next: set this as a Supabase secret, e.g.:"
echo "  supabase secrets set PAYPAL_PLAN_ID_SANDBOX=$PLAN_ID"
echo "(or PAYPAL_PLAN_ID_LIVE=$PLAN_ID if this was run against live)"
