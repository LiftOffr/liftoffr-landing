#!/usr/bin/env python3
"""Render PLAN_PRODUCT_DRAFT.md -> the customer PDF.

The source is customer-facing in full. This renderer does NOT strip production
notes: relying on strip regexes is how internal notes reached page 7 of the
20 Aug build. If something must not ship, remove it from the source.
"""
import io, re, html, subprocess, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, 'PLAN_PRODUCT_DRAFT.md')
OUT  = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/Desktop/My-Bear-Market-Buy-Plan.pdf')

src = re.sub(r'<!--.*?-->', '', io.open(SRC, encoding='utf-8').read(), flags=re.S)

def inline(t):
    t = html.escape(t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<em>\1</em>', t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1', t)
    return t

lines = src.split('\n')
out, i, in_cover = [], 0, False
while i < len(lines):
    l = lines[i].rstrip()

    if l.startswith('## __COVER__'):          # skip the whole cover block; it is templated
        in_cover = True; i += 1; continue
    if in_cover:
        if l.startswith('## '): in_cover = False
        else: i += 1; continue

    if l.startswith('## '):
        out.append('</section><section class="page"><h2>%s</h2>' % inline(l[3:])); i += 1; continue
    if l.startswith('### '):
        out.append('<h3>%s</h3>' % inline(l[4:])); i += 1; continue

    if l.startswith('```'):                   # fenced block -> monospace panel
        i += 1; buf = []
        while i < len(lines) and not lines[i].startswith('```'):
            buf.append(html.escape(lines[i])); i += 1
        i += 1
        out.append('<pre>%s</pre>' % '\n'.join(buf)); continue

    if l.startswith('|') and i + 1 < len(lines) and set(lines[i+1].replace('|', '').strip()) <= set('-: '):
        hdr = [c.strip() for c in l.strip('|').split('|')]
        out.append('<table><thead><tr>' + ''.join('<th>%s</th>' % inline(c) for c in hdr) + '</tr></thead><tbody>')
        i += 2
        while i < len(lines) and lines[i].strip().startswith('|'):
            cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
            out.append('<tr>' + ''.join('<td>%s</td>' % inline(c) for c in cells) + '</tr>'); i += 1
        out.append('</tbody></table>'); continue

    if re.match(r'^\s*[-*]\s+|^\s*\d+\.\s+', l):
        tag = 'ol' if re.match(r'^\s*\d+\.', l) else 'ul'
        out.append('<%s>' % tag)
        while i < len(lines) and (re.match(r'^\s*[-*]\s+|^\s*\d+\.\s+', lines[i]) or
                                  (lines[i].startswith('  ') and lines[i].strip())):
            if re.match(r'^\s*[-*]\s+|^\s*\d+\.\s+', lines[i]):
                buf = re.sub(r'^\s*(?:[-*]|\d+\.)\s+', '', lines[i]); i += 1
                while i < len(lines) and lines[i].startswith('  ') and lines[i].strip() \
                      and not re.match(r'^\s*(?:[-*]|\d+\.)\s+', lines[i]):
                    buf += ' ' + lines[i].strip(); i += 1
                out.append('<li>%s</li>' % inline(buf))
            else: i += 1
        out.append('</%s>' % tag); continue

    if l.strip() == '---': i += 1; continue

    if l.strip():
        buf = l
        while i + 1 < len(lines) and lines[i+1].strip() and \
              not re.match(r'^(#{2,3}\s|\||\s*[-*]\s|\s*\d+\.\s|---|```)', lines[i+1]):
            i += 1; buf += ' ' + lines[i].strip()
        out.append('<p>%s</p>' % inline(buf))
    i += 1

body = re.sub(r'^</section>', '', ''.join(out))

COVER = """<section class="cover">
  <div class="logo">lift<span>offr</span></div>
  <h1>My Bear Market<br>Buy Plan</h1>
  <p class="sub">The exact ladder I'm buying this bear market with.<br>Not a course. A plan &mdash; with the receipts attached.</p>
  <p class="by">by Torin &mdash; LiftOffr</p>
  <p class="upd">Last updated: 20 August 2026<br>Lifetime updates for this bear market included</p>
</section>"""

CSS = """
@page { size: Letter; margin: 18mm 17mm 20mm; }
* { box-sizing: border-box; }
body { font: 10.6pt/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif; color:#16181d; margin:0; }
.cover { background:#080808; color:#fff; height:236mm; padding:52mm 18mm 0;
         page-break-after:always; }
.cover .logo { font-size:21pt; font-weight:800; letter-spacing:-.5pt; margin-bottom:32mm; }
.cover .logo span { color:#e63946; }
.cover h1 { font-size:38pt; line-height:1.06; letter-spacing:-1.5pt; margin:0 0 9mm; font-weight:800; }
.cover .sub { font-size:12.5pt; color:#c9c9c9; line-height:1.5; margin:0 0 20mm; }
.cover .by { font-size:11pt; margin:0 0 3mm; font-weight:700; }
.cover .upd { font-size:9.5pt; color:#8a8a8a; margin:0; line-height:1.6; }
section.page { page-break-before:always; }
section.page:first-of-type { page-break-before:avoid; }
h2 { font-size:15.5pt; letter-spacing:-.4pt; margin:0 0 4.5mm; padding-bottom:2.2mm;
     border-bottom:2px solid #e63946; font-weight:800; page-break-after:avoid; }
h3 { font-size:11.5pt; margin:5mm 0 2.5mm; font-weight:800; page-break-after:avoid; }
p { margin:0 0 3.2mm; }
ul,ol { margin:0 0 3.6mm; padding-left:5mm; }
li { margin:0 0 2.2mm; }
strong { color:#000; }
code { font-family:ui-monospace,Menlo,monospace; font-size:9.2pt; background:#f3f4f6;
       padding:.3mm 1mm; border-radius:1mm; }
pre { font-family:ui-monospace,Menlo,monospace; font-size:8.9pt; line-height:1.5;
      background:#f7f8f9; border:1px solid #e4e6e9; border-radius:2mm; padding:3.5mm 4mm;
      margin:0 0 4mm; white-space:pre-wrap; }
table { width:100%; border-collapse:collapse; margin:0 0 4.5mm; font-size:9.4pt;
        page-break-inside:avoid; }
th { text-align:left; background:#f3f4f6; border-bottom:1.5px solid #d6d8dc;
     padding:2mm; font-weight:800; }
td { border-bottom:1px solid #e7e8ea; padding:2mm; vertical-align:top; }
"""

doc = ('<!doctype html><html><head><meta charset="utf-8">'
       '<title>My Bear Market Buy Plan</title><style>%s</style></head>'
       '<body>%s%s</section></body></html>' % (CSS, COVER, body))

tmp = '/tmp/_plan_render.html'
io.open(tmp, 'w', encoding='utf-8').write(doc)
subprocess.run(['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '--headless', '--disable-gpu', '--no-pdf-header-footer',
                '--print-to-pdf=' + OUT, 'file://' + tmp],
               capture_output=True)
print('wrote', OUT, os.path.getsize(OUT), 'bytes')
