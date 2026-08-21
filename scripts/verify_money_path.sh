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
echo "=== Checkout links still present in the markup ==="
for pg in "" plan system playbook welcome-plan; do
  n=$(curl -sS "https://liftoffr.com/$pg" | grep -c "whop.com/checkout" || true)
  printf "  /%-13s %s checkout anchors\n" "$pg" "$n"
done

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
