#!/usr/bin/env bash
# set-coinbase-key.sh — rotate the Coinbase CDP key used by the dashboard.
#
# Run this locally after creating a new READ-ONLY CDP key at
#   https://portal.cdp.coinbase.com/access/api
#
#   bash ~/liftoffr-landing/scripts/set-coinbase-key.sh
#
# It prompts for the key ID and private key with the terminal echo off, so
# neither value is displayed, written to a file, or saved in shell history.
# It then pushes both to Vercel Production, redeploys, and verifies with a
# read-only balance call.
#
# The key this sets is read-only: View + Trade history, no Trade permission.
# It cannot place, modify, or cancel orders.

set -euo pipefail

REPO="$HOME/liftoffr-landing"
cd "$REPO"

# ── Load tokens (never printed) ──────────────────────────────────────────────
set -a
# shellcheck disable=SC1090
. "$HOME/.openclaw/secrets/vercel.env"
# shellcheck disable=SC1090
. "$HOME/.openclaw/secrets/dashboard.env"
set +a
: "${VERCEL_TOKEN:?VERCEL_TOKEN missing from ~/.openclaw/secrets/vercel.env}"
: "${DASHBOARD_PASSWORD:?DASHBOARD_PASSWORD missing from ~/.openclaw/secrets/dashboard.env}"

vc() { vercel --token "$VERCEL_TOKEN" "$@"; }

echo "Rotating the Coinbase CDP key for liftoffr-landing (Production)."
echo "Nothing you type below is echoed or logged."
echo

# ── Prompt (echo off) ────────────────────────────────────────────────────────
read -r -s -p "COINBASE_API_KEY_ID   (UUID, e.g. 269781d7-...): " CB_KEY_ID; echo
read -r -s -p "COINBASE_API_SECRET   (base64 private key, ~88 chars): " CB_SECRET; echo
echo

# ── Validate locally before touching Vercel ──────────────────────────────────
# Coinbase shows the key ID either bare or as organizations/<uuid>/apiKeys/<uuid>.
CB_KEY_ID="${CB_KEY_ID##*/}"
if ! [[ "$CB_KEY_ID" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
  echo "ERROR: that key ID is not a UUID. Copy the 'API Key Name' / key ID field." >&2
  exit 1
fi

SECRET_BYTES=$(printf '%s' "$CB_SECRET" | base64 -d 2>/dev/null | wc -c | tr -d ' ') || SECRET_BYTES=0
if [ "${SECRET_BYTES:-0}" -lt 32 ]; then
  echo "ERROR: the private key did not decode to >=32 bytes (got ${SECRET_BYTES:-0})." >&2
  echo "       Paste the full base64 string, including the trailing '=='." >&2
  exit 1
fi
echo "Format checks passed (key ID is a UUID, secret decodes to ${SECRET_BYTES} bytes)."

# ── Push to Vercel Production ────────────────────────────────────────────────
for VAR in COINBASE_API_KEY_ID COINBASE_API_SECRET; do
  vc env rm "$VAR" production --yes >/dev/null 2>&1 || true
done
printf '%s' "$CB_KEY_ID" | vc env add COINBASE_API_KEY_ID production >/dev/null
printf '%s' "$CB_SECRET" | vc env add COINBASE_API_SECRET production >/dev/null
unset CB_KEY_ID CB_SECRET
echo "Both env vars updated on Production."

# ── Redeploy so the functions pick up the new values ─────────────────────────
# `vercel redeploy` rebuilds the last production deployment. Preferred over
# `vercel --prod`, which trips this project's cron validation (see CLAUDE.md).
LAST_PROD=$(vc ls --prod 2>/dev/null | grep -oE 'https://[a-z0-9.-]+\.vercel\.app' | head -1)
if [ -z "$LAST_PROD" ]; then
  echo "Could not resolve the last production deployment." >&2
  echo "Redeploy manually: Vercel dashboard -> Deployments -> ... -> Redeploy." >&2
  exit 1
fi
echo "Redeploying $LAST_PROD ..."
vc redeploy "$LAST_PROD" --target production >/dev/null
echo "Redeploy finished."

# ── Verify, read-only ────────────────────────────────────────────────────────
echo
echo "Verifying with a read-only balance call..."
sleep 5
BODY=$(curl -s -u "admin:$DASHBOARD_PASSWORD" "https://liftoffr.com/api/coinbase-balance")
if printf '%s' "$BODY" | grep -q '"btc"'; then
  echo "SUCCESS — Coinbase auth is working again."
  printf '%s\n' "$BODY" | head -c 400; echo
  echo
  echo "Next: open https://liftoffr.com/dashboard and hit 'Sync Coinbase'."
else
  echo "STILL FAILING:" >&2
  printf '%s\n' "$BODY" | head -c 600 >&2; echo >&2
  echo >&2
  echo "Most likely: the new key lacks the 'View' or 'Trade history' permission," >&2
  echo "or an IP allowlist was set on it. Check the key at portal.cdp.coinbase.com." >&2
  exit 1
fi
