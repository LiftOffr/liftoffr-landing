#!/bin/bash
# Daily refresh of the generated /indicators + /when-will-bitcoin-bottom pages.
#
# These pages compete on freshness — a visible, true "Last updated" dateline is
# the whole reason they can rank against AI Overviews. A page that says
# "updated daily" and wasn't is worse than one that never claimed it.
#
# Only commits when the generator actually changed bytes, so a day when CBBI
# hasn't published produces no commit and no deploy.
#
# Shares the repo with youtube_intel.py's hourly push, hence the rebase pull
# and the retry: if the two collide, this one yields and tries again next day.
set -euo pipefail

REPO="$HOME/liftoffr-landing"
cd "$REPO"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] indicator-refresh: $*"; }

# Never fight with in-progress hand edits. If the tree is dirty outside the
# files this script owns, do nothing and say so.
DIRTY=$(git status --porcelain -- . ':(exclude)indicators' ':(exclude)when-will-bitcoin-bottom' ':(exclude)sitemap.xml')
if [ -n "$DIRTY" ]; then
  log "working tree has unrelated changes, skipping"
  echo "$DIRTY"
  exit 0
fi

git pull --rebase --quiet origin main || { log "pull failed, skipping today"; exit 0; }

if ! /usr/bin/env python3 scripts/build_indicator_pages.py; then
  log "generator failed (upstream data unavailable?), leaving pages as they are"
  exit 1
fi

if git diff --quiet -- indicators when-will-bitcoin-bottom sitemap.xml; then
  log "no change in the data, nothing to commit"
  exit 0
fi

git add indicators when-will-bitcoin-bottom sitemap.xml
git commit -q -m "indicators: daily data refresh $(date -u +%Y-%m-%d)"
if git push --quiet origin main; then
  log "pushed refresh"
else
  log "push failed — commit is local, next run will carry it"
  exit 1
fi
