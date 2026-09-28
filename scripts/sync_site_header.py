#!/usr/bin/env python3
"""Synchronize the shared public header. Never touches private/paid pages."""
import argparse
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
PATTERN = r'<!-- shared-site-header:start -->.*?<!-- shared-site-header:end -->'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    header = (ROOT / 'scripts/shared-site-header.html').read_text().strip()
    changed = []
    pages = 0
    for path in ROOT.rglob('*.html'):
        if any(p in {'.git', 'node_modules', 'scripts', 'dashboard', 'product', 'lead-magnet'} for p in path.relative_to(ROOT).parts):
            continue
        source = path.read_text()
        if 'lo-public' not in source:
            continue
        pages += 1
        if len(re.findall(PATTERN, source, flags=re.S)) != 1:
            raise SystemExit(f'{path.relative_to(ROOT)}: expected one shared header')
        updated = re.sub(PATTERN, lambda _: header, source, flags=re.S)
        if updated != source:
            changed.append(str(path.relative_to(ROOT)))
            if not args.check:
                path.write_text(updated)
    print(f'{pages} public pages; {len(changed)} headers ' + ('out of sync' if args.check else 'updated'))
    if args.check and changed:
        raise SystemExit('\n'.join(changed))
if __name__ == '__main__':
    main()
