#!/bin/bash
# Post-deploy money-path + tracking verification. Never let these regress.
echo "=== Apple Pay domain association ==="
curl -sS -o /tmp/ap.bin -D /tmp/ap.hdr "https://liftoffr.com/.well-known/apple-developer-merchantid-domain-association"
code=$(head -1 /tmp/ap.hdr | awk '{print $2}')
ct=$(grep -i "^content-type:" /tmp/ap.hdr | tr -d '\r' | awk '{print $2}')
bytes=$(wc -c < /tmp/ap.bin | tr -d ' ')
sha=$(shasum -a 256 /tmp/ap.bin | awk '{print $1}')
echo "status=$code bytes=$bytes content-type=$ct"
echo "sha256=$sha"
[ "$code" = "200" ] && [ "$bytes" = "228" ] && [ "$ct" = "application/octet-stream" ] \
  && [ "$sha" = "5d3b5ecee0a3778d40f056bf81bb80dbd36f47e83435a5b41b963f5d414def4c" ] \
  && echo "APPLE PAY: PASS" || echo "APPLE PAY: *** FAIL ***"

echo
echo "=== Four Whop checkout links ==="
ok=1
for p in plan_MntgjXJaQnGsW plan_WHByzwILskLsc plan_3SEycpErj9Zk7 plan_uIpPdsPTSHdTp; do
  c=$(curl -sSL -o /dev/null -w "%{http_code}" "https://whop.com/checkout/$p")
  echo "  $p -> $c"; [ "$c" = "200" ] || ok=0
done
[ "$ok" = "1" ] && echo "CHECKOUTS: PASS" || echo "CHECKOUTS: *** FAIL ***"

echo
echo "=== Checkout anchors still present in the markup ==="
# Count real anchors only. A bare grep for "whop.com/checkout" also matches the
# cta_clicked selector string, which now contains that literal on every page that
# carries the listener -- that inflated every count by one and would have masked a
# genuinely deleted anchor by making the remaining ones add up to the old total.
expected_pg="/:0 plan:4 system:1 playbook:4 welcome-plan:1"
anchors_ok=1
for pair in $expected_pg; do
  pg="${pair%%:*}"; want="${pair##*:}"
  url_path="$pg"; [ "$pg" = "/" ] && url_path=""
  n=$(curl -sS "https://liftoffr.com/$url_path" \
      | grep -o 'href="https://whop\.com/checkout/plan_[A-Za-z0-9]*' | wc -l | tr -d ' ')
  if [ "$n" = "$want" ]; then
    printf "  /%-13s %s anchors\n" "${pg#/}" "$n"
  else
    printf "  /%-13s %s anchors  *** expected %s ***\n" "${pg#/}" "$n" "$want"
    anchors_ok=0
  fi
done
[ "$anchors_ok" = "1" ] && echo "CHECKOUT ANCHORS: PASS" || echo "CHECKOUT ANCHORS: *** FAIL ***"

echo
echo "=== Consent banner renders (executes render(), not just a syntax check) ==="
if command -v node >/dev/null 2>&1; then
  node "$(dirname "$0")/check_consent_banner.js" || echo "CONSENT BANNER: *** FAIL ***"
else
  echo "node not found, skipping consent render check"
fi

echo
echo "=== No production notes in files that get posted ==="
if command -v node >/dev/null 2>&1; then
  node "$(dirname "$0")/check_course_markers.js" || echo "COURSE MARKERS: *** FAIL ***"
else
  echo "node not found, skipping course marker check"
fi

echo
echo "=== Weekly AI read validator rejects drift ==="
if command -v node >/dev/null 2>&1; then
  node "$(dirname "$0")/check_weekly_read_validator.js" || echo "WEEKLY READ VALIDATOR: *** FAIL ***"
else
  echo "node not found, skipping weekly read validator check"
fi

echo
echo "=== cta_clicked selector covers every offer link (static) ==="
if command -v node >/dev/null 2>&1; then
  node "$(dirname "$0")/check_cta_coverage.js" || echo "CTA COVERAGE: *** FAIL ***"
else
  echo "node not found, skipping cta coverage check"
fi

echo
echo "=== Tracking coverage on live pages ==="
printf "%-26s %-6s %-6s %-6s %-8s %-6s\n" PAGE GA4 GTM ATTR CONSENTJS TRACKJS
for pg in "" score free quiz plan system playbook links receipts proof cycle faq stack indicators indicators/rhodl-ratio when-will-bitcoin-bottom welcome welcome-plan track-record about privacy terms disclaimer blog; do
  b=$(curl -sS "https://liftoffr.com/$pg")
  printf "%-26s %-6s %-6s %-6s %-8s %-6s\n" "/$pg" \
    "$(echo "$b" | grep -c 'gtag/js?id=G-015PKWM24J')" \
    "$(echo "$b" | grep -c 'GTM-K5B4BX46')" \
    "$(echo "$b" | grep -c 'src=\"/js/attribution.js\"')" \
    "$(echo "$b" | grep -c 'src=\"/js/consent.js')" \
    "$(echo "$b" | grep -c 'src=\"/js/track.js\"')"
done
