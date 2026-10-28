// Shared helpers for all pages: contact details, DOM shortcuts, dates and Arabic labels.
window.ATT = (function () {
  var PHONE = '972587643159';
  var EMAIL = 'Adam.thai.tours@gmail.com';

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Dates are kept as YYYY-MM-DD strings and computed in UTC to avoid timezone shifts.
  var DAY = 864e5;
  function toDate(iso) { var p = iso.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function toIso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function addDays(iso, n) { return toIso(toDate(iso) + n * DAY); }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / DAY); }
  function today() { var d = new Date(); return toIso(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }
  function fmt(iso) {
    return iso ? new Date(toDate(iso)).toLocaleDateString('ar', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : '—';
  }
  function dateLine(iso) { return iso ? fmt(iso) + ' (' + iso + ')' : 'لم يحدد بعد'; }

  var FLEX = ['ثابتة', '± يوم واحد', '± يومان', '± ٣ أيام'];
  function nightsLabel(n) {
    return n === 1 ? 'ليلة واحدة' : n === 2 ? 'ليلتان' : n <= 10 ? n + ' ليالٍ' : n + ' ليلة';
  }
  function paxLabel(adults, children, infants) {
    var parts = [adults === 1 ? 'بالغ' : adults === 2 ? 'بالغان' : adults + ' بالغين'];
    if (children) parts.push(children === 1 ? 'طفل' : children + ' أطفال');
    if (infants) parts.push(infants === 1 ? 'رضيع' : infants + ' رضّع');
    return parts.join(' + ');
  }
  // ⁦…⁩ isolate the dollar amounts so they read left-to-right inside Arabic text.
  function money(n) { return '⁦$' + Number(n).toLocaleString('en-US') + '⁩'; }
  function rangeLabel(lo, hi) {
    if (lo && hi) return money(Math.min(lo, hi)) + ' – ' + money(Math.max(lo, hi));
    if (lo) return 'من ' + money(lo);
    if (hi) return 'حتى ' + money(hi);
    return '';
  }
  // Positive whole number from an input, or '' when empty/invalid.
  function amount(value) {
    var n = Math.floor(Math.abs(parseFloat(value)));
    return isFinite(n) && n > 0 ? n : '';
  }

  function waLink(text) {
    return 'https://api.whatsapp.com/send?phone=' + PHONE + '&text=' + encodeURIComponent(text);
  }
  function mailLink(subject, text) {
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
  }
  // Fill every [data-out="key"] element with out[key].
  function output(out) {
    Object.keys(out).forEach(function (k) {
      $$('[data-out="' + k + '"]').forEach(function (n) { n.textContent = out[k]; });
    });
  }

  return {
    PHONE: PHONE, EMAIL: EMAIL, FLEX: FLEX,
    $: $, $$: $$, el: el,
    toDate: toDate, toIso: toIso, addDays: addDays, daysBetween: daysBetween, today: today,
    fmt: fmt, dateLine: dateLine, nightsLabel: nightsLabel, paxLabel: paxLabel,
    money: money, rangeLabel: rangeLabel, amount: amount,
    waLink: waLink, mailLink: mailLink, output: output
  };
})();
