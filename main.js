// Site behaviour: ticker, trip planner and WhatsApp links.
(function () {
  var CONFIG = {
    phone: '972587643159',
    showTicker: true,
    showFloatingWhatsapp: true
  };

  var DESTS = [['تايلاند', 'BKK'], ['فيتنام', 'SGN'], ['بالي', 'DPS'], ['اليابان', 'TYO'], ['أوروبا', 'EUR'], ['وجهة أخرى', '???']];
  var TYPES = ['شهر عسل', 'عائلية', 'استرخاء وشواطئ', 'مغامرة', 'رحلة منظمة'];
  var FLEX = ['ثابتة', '± يوم واحد', '± يومان', '± ٣ أيام'];
  var TICKER = ['تايلاند', 'فيتنام', 'بالي', 'اليابان', 'أوروبا', 'الشرق الأوسط', 'الأمريكيتان', 'أفريقيا'];
  var BARS = [2, 1, 3, 1, 1, 4, 2, 1, 3, 2, 1, 1, 4, 1, 2, 3, 1, 2, 1, 4, 1, 3, 2, 1, 1, 3, 2, 4];

  var state = { dest: 0, type: 0, pax: 2, nights: 7, depart: '', ret: '', flex: 0 };

  function wa(text) {
    return 'https://api.whatsapp.com/send?phone=' + CONFIG.phone + '&text=' + encodeURIComponent(text);
  }
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Ticker: one row of names separated by stars, duplicated for a seamless loop.
  var ticker = $('.ticker');
  if (!CONFIG.showTicker) {
    ticker.remove();
  } else {
    var track = $('.ticker-track');
    for (var copy = 0; copy < 2; copy++) {
      TICKER.forEach(function (name) {
        track.appendChild(el('span', '', name));
        track.appendChild(el('span', 'star', '✦'));
      });
    }
  }
  if (!CONFIG.showFloatingWhatsapp) $('.float-wa').remove();

  // Static WhatsApp links (services, departures board).
  $$('[data-wa]').forEach(function (a) { a.href = wa(a.getAttribute('data-wa')); });

  // Planner controls.
  function buildChips(key, labels) {
    var box = $('[data-chips="' + key + '"]');
    labels.forEach(function (label, i) {
      var b = el('button', 'chip', label);
      b.type = 'button';
      b.addEventListener('click', function () { state[key] = i; render(); });
      box.appendChild(b);
    });
    return box;
  }
  var destChips = buildChips('dest', DESTS.map(function (d) { return d[0]; }));
  var typeChips = buildChips('type', TYPES);

  // Dates are kept as YYYY-MM-DD strings and computed in UTC to avoid timezone shifts.
  var DAY = 864e5;
  function toDate(iso) { var p = iso.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function toIso(ms) { return new Date(ms).toISOString().slice(0, 10); }
  function addDays(iso, n) { return toIso(toDate(iso) + n * DAY); }
  function fmt(iso) {
    return iso ? new Date(toDate(iso)).toLocaleDateString('ar', { day: 'numeric', month: 'long', timeZone: 'UTC' }) : '—';
  }
  function nightsLabel(n) {
    return n === 1 ? 'ليلة واحدة' : n === 2 ? 'ليلتان' : n <= 10 ? n + ' ليالٍ' : n + ' ليلة';
  }

  var departInput = $('#depart'), returnInput = $('#return'), flexSelect = $('#flex');
  var now = new Date();
  departInput.min = toIso(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  departInput.addEventListener('change', function () {
    state.depart = departInput.value;
    if (state.depart) state.ret = addDays(state.depart, state.nights);
    render();
  });
  returnInput.addEventListener('change', function () {
    state.ret = returnInput.value;
    if (state.depart && state.ret) {
      var n = Math.round((toDate(state.ret) - toDate(state.depart)) / DAY);
      if (n >= 1) state.nights = n;
      else state.ret = addDays(state.depart, state.nights);
    }
    render();
  });
  flexSelect.addEventListener('change', function () { state.flex = +flexSelect.value; render(); });

  $$('[data-nights]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.nights = Math.max(1, Math.min(60, state.nights + Number(b.getAttribute('data-nights'))));
      if (state.depart) state.ret = addDays(state.depart, state.nights);
      render();
    });
  });

  $$('[data-pax]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.pax = Math.max(1, Math.min(20, state.pax + Number(b.getAttribute('data-pax'))));
      render();
    });
  });

  var barcode = $('.barcode');
  BARS.forEach(function (w) {
    var s = el('span');
    s.style.width = w + 'px';
    barcode.appendChild(s);
  });

  function render() {
    var d = DESTS[state.dest], t = TYPES[state.type];
    var paxLabel = state.pax === 1 ? 'مسافر واحد' : state.pax === 2 ? 'مسافران' : state.pax + ' مسافرين';
    var out = {
      code: d[1], destName: d[0], typeName: t, paxLabel: paxLabel, pax: state.pax,
      nights: state.nights, nightsLabel: nightsLabel(state.nights),
      departLabel: fmt(state.depart), returnLabel: fmt(state.ret), flexLabel: FLEX[state.flex]
    };
    Object.keys(out).forEach(function (k) {
      $$('[data-out="' + k + '"]').forEach(function (n) { n.textContent = out[k]; });
    });
    [[destChips, state.dest], [typeChips, state.type]].forEach(function (pair) {
      Array.prototype.forEach.call(pair[0].children, function (b, i) {
        b.setAttribute('aria-pressed', String(i === pair[1]));
      });
    });
    departInput.value = state.depart;
    returnInput.value = state.ret;
    returnInput.min = state.depart ? addDays(state.depart, 1) : departInput.min;
    flexSelect.value = String(state.flex);

    var msg = 'مرحبا، أريد التخطيط لرحلة:\nالوجهة: ' + d[0] + '\nنوع الرحلة: ' + t +
      '\nعدد المسافرين: ' + state.pax +
      '\nالذهاب: ' + (state.depart ? fmt(state.depart) + ' (' + state.depart + ')' : 'لم يحدد بعد') +
      '\nالعودة: ' + (state.ret ? fmt(state.ret) + ' (' + state.ret + ')' : 'لم يحدد بعد') +
      '\nعدد الليالي: ' + state.nights +
      '\nمرونة التاريخ: ' + (state.flex ? FLEX[state.flex] : 'تواريخ ثابتة');
    var link = wa(msg);
    $$('[data-wa-plan]').forEach(function (a) { a.href = link; });
  }

  render();
})();
