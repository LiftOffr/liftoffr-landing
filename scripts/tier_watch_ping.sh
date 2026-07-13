#!/bin/bash
# Pings the tier-watch task on cron-weekly-score every LaunchAgent interval so
# a hit-but-unfilled buy tier DMs Torin well before the once-daily Vercel cron
# would catch it. `tasks=watch` scopes the call to tier-watch only — it never
# triggers the daily-DCA task path, regardless of time of day.
set -euo pipefail
source ~/.openclaw/secrets/liftoffr-cron.env

curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "https://liftoffr.com/api/cron-weekly-score?tasks=watch"
