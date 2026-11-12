# 2026-11-12 full-audit fixes

Source: ~/Documents/liftoffr-full-audit-2026-11-12/site/SITE_AUDIT.md. Not pushed, not deployed.
Funnel pages (/, /map, /map/thanks, /plan, /bio), prices, plan IDs, payment/webhook logic and Whop untouched.

| Commit | Item |
|---|---|
| f2771f8 | Commit Nov 11 no-disclaimer leftovers (12 pre-existing files) |
| 3a467b5 | 1. $497 Playbook retired: /playbook and /playbook/ 308 to /system; out of sitemap, /faq (Q&A, refund line, footer), /links, /terms, llms.txt, Sunday Score menu (now the Course), Plan D14 section 2 (now a Course pitch), Discord /ladder embed; retired trial templates and TRIAL_CHECKOUT deleted. playbook/ files left in place (redirect wins). |
| c73abe3 | 2. Plan described as the real deliverable on /links, /ladder embed, llms.txt |
| c6b13ef | 3. PLAN_PRODUCT_DRAFT.md: "Next: The Cycle System" closing page ($29 USD / $8 INR credit, emailed code), hedges stripped, section 10 bridges to the Course; revision 12 Nov 2026. Re-rendered to /Users/torin/Desktop/My-Bear-Market-Buy-Plan-2026-11-12.pdf (not uploaded). |
| 5a18c85 | 4. /welcome-plan: "Next step when you're ready: The Cycle System" block with credit explanation |
| b189216 | 5. Sunday Score: Plan Buyers audience read once per run; buyers get Course CTA + credit reminder, others keep Plan CTA with the Course as menu item 3. Zone alert stale "Members" line fixed. Test: scripts/test_weekly_score_variants.mjs |
| 7f72dc0 | 6. Plan p7/p14 credit by edition ($29/$8 from PLAN_EDITIONS); p1 now "fill in tier 1 of the worksheet". Test: scripts/test_plan_edition_emails.mjs |
| 29832b5 | 7. Free nurture D12 "the Course, plainly" (INR-aware); new D5 and D18 subjects |
| 8cdaa62 | 8. /track-record and /score hedges removed, $1.88M out of the source comment, /disclaimer out of the sitemap |
| 3f14638 | 9. /system indexable (noindex removed; stays in sitemap) |
| e958d2e | 10. /about 2022 round-trip restored from torin_stories.md facts only |

## Tests
scripts/test_*.mjs + test_*.cjs: before 11/11 pass, after 13/13 pass (2 new files).
scripts/funnel.test.js (not in the test_* set): 14/15 before and after; the failing case
("all email senders put unsubscribe headers inside Resend JSON") predates this pass.

## Follow-ups (not done here)
- Plan p7/p14 edition: the Plan Buyers contact has no edition today, so the email falls back to
  country, then to a line naming both credits. One line in the webhook enrollment
  (properties.plan_edition) would make it exact; held because webhook logic was out of scope.
- CLAUDE.md page map still lists /playbook as live and /system as noindex.
- scripts/verify_money_path.sh still expects 4 checkout links on /playbook.
- Whop: archive plan_uIpPdsPTSHdTp and the hidden renewal plans; fix the Plan and System
  descriptions (levels claim, $1.88M, disclaimers). Recommendation only.
