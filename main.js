// Site behaviour: ticker, trip planner and WhatsApp links.
(function () {
  var CONFIG = {
    phone: '972587643159',
    showTicker: true,
    showFloatingWhatsapp: true
  };

  var DESTS = [['تايلاند', 'BKK'], ['فيتنام', 'SGN'], ['بالي', 'DPS'], ['اليابان', 'TYO'], ['أوروبا', 'EUR'], ['وجهة أخرى', '???']];
  var TYPES = ['شهر عسل', 'عائلية', 'استرخاء وشواطئ', 'مغامرة', 'رحلة منظمة'];
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var TICKER = ['تايلاند', 'فيتنام', 'بالي', 'اليابان', 'أوروبا', 'الشرق الأوسط', 'الأمريكيتان', 'أفريقيا'];
  var BARS = [2, 1, 3, 1, 1, 4, 2, 1, 3, 2, 1, 1, 4, 1, 2, 3, 1, 2, 1, 4, 1, 3, 2, 1, 1, 3, 2, 4];

  var state = { dest: 0, type: 0, pax: 2, month: 'ديسمبر' };

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

  var monthSelect = $('#month');
  MONTHS.forEach(function (m) {
    var o = el('option', '', m);
    o.value = m;
    monthSelect.appendChild(o);
  });
  monthSelect.addEventListener('change', function (e) { state.month = e.target.value; render(); });

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
    var out = { code: d[1], destName: d[0], typeName: t, paxLabel: paxLabel, month: state.month, pax: state.pax };
    Object.keys(out).forEach(function (k) {
      $$('[data-out="' + k + '"]').forEach(function (n) { n.textContent = out[k]; });
    });
    [[destChips, state.dest], [typeChips, state.type]].forEach(function (pair) {
      Array.prototype.forEach.call(pair[0].children, function (b, i) {
        b.setAttribute('aria-pressed', String(i === pair[1]));
      });
    });
    monthSelect.value = state.month;

    var msg = 'مرحبا، أريد التخطيط لرحلة:\nالوجهة: ' + d[0] + '\nنوع الرحلة: ' + t +
      '\nعدد المسافرين: ' + state.pax + '\nالشهر: ' + state.month;
    var link = wa(msg);
    $$('[data-wa-plan]').forEach(function (a) { a.href = link; });
  }

  render();
})();
