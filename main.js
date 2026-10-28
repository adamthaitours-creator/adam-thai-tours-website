// Homepage behaviour: ticker, quick trip planner and WhatsApp links.
(function () {
  var U = window.ATT, $ = U.$, $$ = U.$$, el = U.el;
  var CONFIG = {
    showTicker: true,
    showFloatingWhatsapp: true
  };

  var L = {
    ar: {
      dests: [['تايلاند', 'BKK'], ['فيتنام', 'SGN'], ['بالي', 'DPS'], ['اليابان', 'TYO'], ['أوروبا', 'EUR'], ['وجهة أخرى', '???']],
      types: ['شهر عسل', 'عائلية', 'استرخاء وشواطئ', 'مغامرة', 'رحلة منظمة'],
      ticker: ['تايلاند', 'فيتنام', 'بالي', 'اليابان', 'أوروبا', 'الشرق الأوسط', 'الأمريكيتان', 'أفريقيا'],
      pax: function (n) { return n === 1 ? 'مسافر واحد' : n === 2 ? 'مسافران' : n + ' مسافرين'; },
      intro: 'مرحبا، أريد التخطيط لرحلة:',
      dest: 'الوجهة', type: 'نوع الرحلة', travellers: 'عدد المسافرين', depart: 'الذهاب', ret: 'العودة',
      nights: 'عدد الليالي', flex: 'مرونة التاريخ'
    },
    he: {
      dests: [['תאילנד', 'BKK'], ['וייטנאם', 'SGN'], ['באלי', 'DPS'], ['יפן', 'TYO'], ['אירופה', 'EUR'], ['יעד אחר', '???']],
      types: ['ירח דבש', 'משפחתי', 'בטן-גב וחופים', 'הרפתקאות', 'טיול מאורגן'],
      ticker: ['תאילנד', 'וייטנאם', 'באלי', 'יפן', 'אירופה', 'המזרח התיכון', 'אמריקה', 'אפריקה'],
      pax: function (n) { return n === 1 ? 'נוסע אחד' : n + ' נוסעים'; },
      intro: 'שלום, אני רוצה לתכנן טיול:',
      dest: 'יעד', type: 'סוג הטיול', travellers: 'מספר נוסעים', depart: 'יציאה', ret: 'חזרה',
      nights: 'מספר לילות', flex: 'גמישות בתאריכים'
    },
    en: {
      dests: [['Thailand', 'BKK'], ['Vietnam', 'SGN'], ['Bali', 'DPS'], ['Japan', 'TYO'], ['Europe', 'EUR'], ['Somewhere else', '???']],
      types: ['Honeymoon', 'Family', 'Beach & relax', 'Adventure', 'Group tour'],
      ticker: ['Thailand', 'Vietnam', 'Bali', 'Japan', 'Europe', 'Middle East', 'The Americas', 'Africa'],
      pax: function (n) { return n === 1 ? '1 traveller' : n + ' travellers'; },
      intro: 'Hi, I would like to plan a trip:',
      dest: 'Destination', type: 'Trip type', travellers: 'Travellers', depart: 'Departure', ret: 'Return',
      nights: 'Nights', flex: 'Date flexibility'
    }
  }[U.lang];
  var BARS = [2, 1, 3, 1, 1, 4, 2, 1, 3, 2, 1, 1, 4, 1, 2, 3, 1, 2, 1, 4, 1, 3, 2, 1, 1, 3, 2, 4];

  var state = { dest: 0, type: 0, pax: 2, nights: 7, depart: '', ret: '', flex: 0 };

  // Ticker: one row of names separated by stars, duplicated for a seamless loop.
  var ticker = $('.ticker');
  if (!CONFIG.showTicker) {
    ticker.remove();
  } else {
    var track = $('.ticker-track');
    for (var copy = 0; copy < 2; copy++) {
      L.ticker.forEach(function (name) {
        track.appendChild(el('span', '', name));
        track.appendChild(el('span', 'star', '✦'));
      });
    }
  }
  if (!CONFIG.showFloatingWhatsapp) $('.float-wa').remove();

  // Static WhatsApp links (departures board).
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
  var destChips = buildChips('dest', L.dests.map(function (d) { return d[0]; }));
  var typeChips = buildChips('type', L.types);

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
    var d = L.dests[state.dest], t = L.types[state.type];
    U.output({
      code: d[1], destName: d[0], typeName: t, paxLabel: L.pax(state.pax), pax: state.pax,
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

    var msg = [
      L.intro,
      L.dest + ': ' + d[0],
      L.type + ': ' + t,
      L.travellers + ': ' + state.pax,
      L.depart + ': ' + U.dateLine(state.depart),
      L.ret + ': ' + U.dateLine(state.ret),
      L.nights + ': ' + state.nights,
      L.flex + ': ' + U.flexLine(state.flex)
    ].join('\n');
    var link = U.waLink(msg);
    $$('[data-wa-plan]').forEach(function (a) { a.href = link; });

    var q = new URLSearchParams({ dest: d[0], type: t, pax: state.pax, nights: state.nights, flex: state.flex });
    if (state.depart) q.set('depart', state.depart);
    if (state.ret) q.set('ret', state.ret);
    $('[data-plan-link]').href = 'plan.html?' + q.toString();
  }

  render();
})();
