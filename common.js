// Shared helpers for all pages: contact details, language, DOM shortcuts, dates and labels.
// The page language comes from <html lang="ar|he">; page scripts pick their own strings with ATT.lang.
window.ATT = (function () {
  var PHONE = '972587643159';
  var EMAIL = 'Adam.thai.tours@gmail.com';
  var lang = document.documentElement.lang === 'he' ? 'he' : 'ar';

  var STRINGS = {
    ar: {
      locale: 'ar', sep: '، ', notSet: 'لم يحدد بعد', fixedDates: 'تواريخ ثابتة',
      flex: ['ثابتة', '± يوم واحد', '± يومان', '± ٣ أيام'],
      nights: function (n) { return n === 1 ? 'ليلة واحدة' : n === 2 ? 'ليلتان' : n <= 10 ? n + ' ليالٍ' : n + ' ليلة'; },
      adults: function (n) { return n === 1 ? 'بالغ' : n === 2 ? 'بالغان' : n + ' بالغين'; },
      children: function (n) { return n === 1 ? 'طفل' : n + ' أطفال'; },
      infants: function (n) { return n === 1 ? 'رضيع' : n + ' رضّع'; },
      rooms: function (n) { return n === 1 ? 'غرفة واحدة' : n === 2 ? 'غرفتان' : n + ' غرف'; },
      from: 'من ', upTo: 'حتى ',
      // Section numbers in Arabic-Indic digits: ٠١، ٠٢…
      num: function (n) { return '٠' + n.toLocaleString('ar-EG'); }
    },
    he: {
      locale: 'he', sep: ', ', notSet: 'טרם נקבע', fixedDates: 'תאריכים קבועים',
      flex: ['קבועים', '± יום', '± יומיים', '± 3 ימים'],
      nights: function (n) { return n === 1 ? 'לילה אחד' : n + ' לילות'; },
      adults: function (n) { return n === 1 ? 'מבוגר אחד' : n + ' מבוגרים'; },
      children: function (n) { return n === 1 ? 'ילד אחד' : n + ' ילדים'; },
      infants: function (n) { return n === 1 ? 'תינוק אחד' : n + ' תינוקות'; },
      rooms: function (n) { return n === 1 ? 'חדר אחד' : n + ' חדרים'; },
      from: 'החל מ-', upTo: 'עד ',
      num: function (n) { return '0' + n; }
    }
  };
  var S = STRINGS[lang];

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
    return iso ? new Date(toDate(iso)).toLocaleDateString(S.locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }) : '—';
  }
  function dateLine(iso) { return iso ? fmt(iso) + ' (' + iso + ')' : S.notSet; }
  function flexLine(i) { return i ? S.flex[i] : S.fixedDates; }

  function paxLabel(adults, children, infants) {
    var parts = [S.adults(adults)];
    if (children) parts.push(S.children(children));
    if (infants) parts.push(S.infants(infants));
    return parts.join(' + ');
  }
  // ⁦…⁩ isolate the dollar amounts so they read left-to-right inside RTL text.
  function money(n) { return '⁦$' + Number(n).toLocaleString('en-US') + '⁩'; }
  function rangeLabel(lo, hi) {
    if (lo && hi) return money(Math.min(lo, hi)) + ' – ' + money(Math.max(lo, hi));
    if (lo) return S.from + money(lo);
    if (hi) return S.upTo + money(hi);
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
    PHONE: PHONE, EMAIL: EMAIL, lang: lang, FLEX: S.flex, sep: S.sep, num: S.num, notSet: S.notSet,
    $: $, $$: $$, el: el,
    toDate: toDate, toIso: toIso, addDays: addDays, daysBetween: daysBetween, today: today,
    fmt: fmt, dateLine: dateLine, flexLine: flexLine, nightsLabel: S.nights, roomsLabel: S.rooms, paxLabel: paxLabel,
    money: money, rangeLabel: rangeLabel, amount: amount,
    waLink: waLink, mailLink: mailLink, output: output
  };
})();
