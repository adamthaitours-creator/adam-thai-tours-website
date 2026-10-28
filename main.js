// Site behaviour: ticker, trip planner and WhatsApp links.
(function () {
  var U = window.ATT, $ = U.$, $$ = U.$$, el = U.el;
  var CONFIG = {
    showTicker: true,
    showFloatingWhatsapp: true
  };

  var DESTS = [['تايلاند', 'BKK'], ['فيتنام', 'SGN'], ['بالي', 'DPS'], ['اليابان', 'TYO'], ['أوروبا', 'EUR'], ['وجهة أخرى', '???']];
  var TYPES = ['شهر عسل', 'عائلية', 'استرخاء وشواطئ', 'مغامرة', 'رحلة منظمة'];
  var TICKER = ['تايلاند', 'فيتنام', 'بالي', 'اليابان', 'أوروبا', 'الشرق الأوسط', 'الأمريكيتان', 'أفريقيا'];
  var BARS = [2, 1, 3, 1, 1, 4, 2, 1, 3, 2, 1, 1, 4, 1, 2, 3, 1, 2, 1, 4, 1, 3, 2, 1, 1, 3, 2, 4];

  var state = { dest: 0, type: 0, pax: 2, nights: 7, depart: '', ret: '', flex: 0 };

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
  $$('[data-wa]').forEach(function (a) { a.href = U.waLink(a.getAttribute('data-wa')); });

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

  var departInput = $('#depart'), returnInput = $('#return'), flexSelect = $('#flex');
  departInput.min = U.today();

  departInput.addEventListener('change', function () {
    state.depart = departInput.value;
    if (state.depart) state.ret = U.addDays(state.depart, state.nights);
    render();
  });
  returnInput.addEventListener('change', function () {
    state.ret = returnInput.value;
    if (state.depart && state.ret) {
      var n = U.daysBetween(state.depart, state.ret);
      if (n >= 1) state.nights = n;
      else state.ret = U.addDays(state.depart, state.nights);
    }
    render();
  });
  flexSelect.addEventListener('change', function () { state.flex = +flexSelect.value; render(); });

  $$('[data-nights]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.nights = Math.max(1, Math.min(60, state.nights + Number(b.getAttribute('data-nights'))));
      if (state.depart) state.ret = U.addDays(state.depart, state.nights);
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
    U.output({
      code: d[1], destName: d[0], typeName: t, paxLabel: paxLabel, pax: state.pax,
      nights: state.nights, nightsLabel: U.nightsLabel(state.nights),
      departLabel: U.fmt(state.depart), returnLabel: U.fmt(state.ret), flexLabel: U.FLEX[state.flex]
    });
    [[destChips, state.dest], [typeChips, state.type]].forEach(function (pair) {
      Array.prototype.forEach.call(pair[0].children, function (b, i) {
        b.setAttribute('aria-pressed', String(i === pair[1]));
      });
    });
    departInput.value = state.depart;
    returnInput.value = state.ret;
    returnInput.min = state.depart ? U.addDays(state.depart, 1) : departInput.min;
    flexSelect.value = String(state.flex);

    var msg = 'مرحبا، أريد التخطيط لرحلة:\nالوجهة: ' + d[0] + '\nنوع الرحلة: ' + t +
      '\nعدد المسافرين: ' + state.pax +
      '\nالذهاب: ' + U.dateLine(state.depart) +
      '\nالعودة: ' + U.dateLine(state.ret) +
      '\nعدد الليالي: ' + state.nights +
      '\nمرونة التاريخ: ' + (state.flex ? U.FLEX[state.flex] : 'تواريخ ثابتة');
    var link = U.waLink(msg);
    $$('[data-wa-plan]').forEach(function (a) { a.href = link; });

    var q = new URLSearchParams({ dest: d[0], type: t, pax: state.pax, nights: state.nights, flex: state.flex });
    if (state.depart) q.set('depart', state.depart);
    if (state.ret) q.set('ret', state.ret);
    $('[data-plan-link]').href = 'plan.html?' + q.toString();
  }

  render();
})();
