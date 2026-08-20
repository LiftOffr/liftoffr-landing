// Shared email footer disclosure. Underscore-prefixed so it does not count against
// Vercel's 12-function cap (see CLAUDE.md).
//
// Added 2026-08-20. Every outbound email previously carried only "Backtested
// 2017-2026. Past performance does not guarantee future results." That is missing
// four things the site's own footer already gets right and that CAN-SPAM requires:
//
//   1. The entity name. "LiftOffr LLC" appeared nowhere on any surface, despite the
//      LLC being filed 17 Aug 2026. Legal pages said only "operated by Torin
//      Christianson."
//   2. A physical mailing address. CAN-SPAM 15 U.S.C. 7704(a)(5) requires one in
//      every commercial email. There was none.
//   3. The not-an-adviser / not-personalised language.
//   4. An 18+ statement, on a list built from an audience that is 46.7% aged 18-24.
//
// TORIN: set LIFTOFFR_MAILING_ADDRESS in Vercel to the LLC's Montana registered
// address, e.g. "LiftOffr LLC, 123 Example St, Missoula, MT 59801". Until it is set,
// the address line is omitted rather than shipping a placeholder -- which means the
// emails are still not CAN-SPAM compliant until you set it. This is the single
// smallest item on the whole list and it is a one-line env var.

export const ENTITY = "LiftOffr LLC";

export function mailingAddress() {
  const a = (process.env.LIFTOFFR_MAILING_ADDRESS || "").trim();
  return a || null;
}

// Plain-text variant, for the text/* part of every send.
export function disclosureText(listReason) {
  const lines = [
    "Every dated signal from LiftOffr is the LiftOffr Score computed over public historical price and on-chain data - a backtest, not a record of trades placed or calls published at the time. Past performance does not predict future results. Torin Christianson is not a registered investment adviser and nothing here is personalised to you. Full record, including every signal that went the wrong way: https://liftoffr.com/receipts",
    "",
    "18+ only. Educational content, not financial advice.",
    "",
    `${ENTITY}${listReason ? " - " + listReason : ""}`,
  ];
  const addr = mailingAddress();
  if (addr) lines.push(addr);
  return lines.join("\n");
}

// HTML variant. Drops into the existing grey footer band on every template.
export function disclosureHTML(listReason) {
  const addr = mailingAddress();
  return `
    Every dated signal from LiftOffr is the LiftOffr Score computed over public historical price and on-chain data &mdash; a backtest, not a record of trades placed or calls published at the time. Past performance does not predict future results. Torin Christianson is not a registered investment adviser and nothing here is personalised to you. Full record, including every signal that went the wrong way, at <a href="https://liftoffr.com/receipts" style="color:#999;">liftoffr.com/receipts</a>.<br/><br/>
    <strong style="color:#888;">18+ only.</strong> Educational content, not financial advice.<br/>
    ${ENTITY}${listReason ? " &middot; " + listReason : ""}<br/>
    ${addr ? addr + "<br/>" : ""}`;
}
