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
// Set LIFTOFFR_MAILING_ADDRESS in Production to the mailing address explicitly
// supplied by Torin. Keep its value out of source control.

export const ENTITY = "LiftOffr LLC";
export const CONTACT_EMAIL = "contact.liftoffr@gmail.com";

// The one consolidated disclaimer (Torin, 2026-11-11: disclose once, sell everywhere
// else). Same wording as the site footer. Email bodies carry no further hedges.
export const DISCLOSURE = "Education, not individualized financial advice. LiftOffr Score signals are backtests over public price and on-chain data, not records of live trades, and past performance doesn't guarantee future results. Paid products are 18+.";

export function mailingAddress() {
  const a = (process.env.LIFTOFFR_MAILING_ADDRESS || "").trim();
  return a || null;
}

// Plain-text variant, for the text/* part of every send.
export function disclosureText(listReason) {
  const lines = [
    DISCLOSURE,
    "",
    `${ENTITY}${listReason ? " - " + listReason : ""}`,
  ];
  const addr = mailingAddress();
  if (addr) lines.push(addr);
  lines.push(`Contact: ${CONTACT_EMAIL}`);
  return lines.join("\n");
}

// HTML variant. Drops into the existing grey footer band on every template.
export function disclosureHTML(listReason) {
  const addr = mailingAddress();
  return `
    ${DISCLOSURE}<br/><br/>
    ${ENTITY}${listReason ? " &middot; " + listReason : ""}<br/>
    ${addr ? addr + "<br/>" : ""}
    <a href="mailto:${CONTACT_EMAIL}" style="color:#999;">${CONTACT_EMAIL}</a>`;
}
