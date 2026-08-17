/* LiftOffr review display — real data only.
 *
 * Usage:  <div data-liftoffr-reviews="plan"></div>
 *         <div data-liftoffr-reviews="system" data-mode="rating"></div>
 *
 *   data-liftoffr-reviews : plan | system | playbook   (Whop product key)
 *   data-mode             : "full" (default) stars + count + quotes
 *                           "rating"          stars + count only, one line
 *   data-max              : max quotes to render (default 3)
 *
 * HARD RULE, do not relax it: this renders NOTHING until real published
 * reviews exist. No placeholder stars, no "no reviews yet" message, no
 * skeleton, no seeded example. The container stays empty and invisible, so a
 * page with zero reviews reads exactly as it did before this script existed.
 * A rating shown before one is earned is the same category of problem as the
 * unattributed testimonials that had to come off /playbook.
 *
 * Attribution comes from Whop (real name or @username) and every row is a
 * verified purchase — both enforced server-side in api/reviews.js.
 */
(function () {
  "use strict";

  function stars(n) {
    var full = Math.round(n);
    var s = "";
    for (var i = 1; i <= 5; i++) {
      s += '<span style="color:' + (i <= full ? "#e63946" : "#333") + ';">★</span>';
    }
    return s;
  }

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ratingLine(d) {
    return '' +
      '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:14px;">' +
        '<span style="letter-spacing:1px;font-size:15px;">' + stars(d.average) + "</span>" +
        '<strong style="color:#fff;font-weight:800;">' + d.average.toFixed(1) + "</strong>" +
        '<span style="color:#8a8a8a;">from ' + d.count + " verified " +
          (d.count === 1 ? "review" : "reviews") + " on Whop</span>" +
      "</div>";
  }

  function quote(r) {
    var head = r.title ? '<div style="font-weight:800;color:#fff;margin-bottom:4px;">' + esc(r.title) + "</div>" : "";
    var body = r.body ? '<div style="color:#bdbdbd;line-height:1.6;">' + esc(r.body) + "</div>" : "";
    return '' +
      '<div style="background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:16px 18px;">' +
        '<div style="letter-spacing:1px;font-size:13px;margin-bottom:7px;">' + stars(r.stars) + "</div>" +
        head + body +
        '<div style="color:#777;font-size:12.5px;margin-top:9px;">— ' + esc(r.by) +
          ' <span style="color:#555;">· verified purchase</span></div>' +
      "</div>";
  }

  function render(el, d) {
    if (!d || !d.count || !d.average) return;           // ← the hard rule
    var mode = el.getAttribute("data-mode") || "full";
    var max = parseInt(el.getAttribute("data-max") || "3", 10);

    if (mode === "rating") {
      el.innerHTML = ratingLine(d);
      return;
    }
    var quotes = d.reviews.filter(function (r) { return r.title || r.body; }).slice(0, max);
    el.innerHTML =
      '<div style="margin-bottom:14px;">' + ratingLine(d) + "</div>" +
      (quotes.length
        ? '<div style="display:grid;gap:10px;">' + quotes.map(quote).join("") + "</div>"
        : "");
  }

  function boot() {
    var nodes = document.querySelectorAll("[data-liftoffr-reviews]");
    if (!nodes.length) return;
    var wanted = {};
    Array.prototype.forEach.call(nodes, function (el) {
      wanted[el.getAttribute("data-liftoffr-reviews")] = true;
    });
    Object.keys(wanted).forEach(function (product) {
      fetch("/api/reviews?product=" + encodeURIComponent(product))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          Array.prototype.forEach.call(nodes, function (el) {
            if (el.getAttribute("data-liftoffr-reviews") === product) render(el, d);
          });
        })
        .catch(function () { /* stay silent and stay empty — see the note above */ });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
