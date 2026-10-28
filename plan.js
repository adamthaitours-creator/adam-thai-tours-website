// Full trip planner page: form state, live summary and WhatsApp/email handoff.
(function () {
  var U = window.ATT, $ = U.$, $$ = U.$$;

  var DESTS = [['تايلاند', 'BKK'], ['فيتنام', 'SGN'], ['بالي', 'DPS'], ['اليابان', 'TYO'], ['أوروبا', 'EUR'], ['الشرق الأوسط', 'DXB'], ['وجهة أخرى', '???']];
  var OPTIONS = {
    dests: DESTS.map(function (d) { return d[0]; }),
    type: ['شهر عسل', 'عائلية', 'استرخاء وشواطئ', 'مغامرة', 'رحلة منظمة', 'أصدقاء'],
    stay: ['اقتصادي', '٤ نجوم', '٥ نجوم', 'فلل ومنتجعات خاصة'],
    interests: ['شواطئ وجزر', 'طبيعة', 'ثقافة ومعابد', 'تسوق', 'مغامرات وأنشطة', 'سبا واسترخاء', 'مطاعم حلال', 'حياة ليلية'],
    services: ['تذاكر طيران', 'فنادق', 'استقبال وتنقلات', 'جولات يومية', 'تأشيرة', 'تأمين سفر']
  };
  var LIMITS = { adults: [1, 20], children: [0, 10], infants: [0, 5], nights: [1, 60] };

  var state = {
    dests: [], type: -1, stay: -1, budgetMin: '', budgetMax: '', interests: [], services: [0, 1],
    adults: 2, children: 0, infants: 0, nights: 7, depart: '', ret: '', flex: 0,
    cities: '', name: '', from: '', phone: '', email: '', notes: ''
  };

  function paxLabel() { return U.paxLabel(state.adults, state.children, state.infants); }
  function budgetLabel() { return U.rangeLabel(state.budgetMin, state.budgetMax); }

  function pick(key) {
    var v = state[key];
    if (Array.isArray(v)) return v.map(function (i) { return OPTIONS[key][i]; });
    return v < 0 ? null : OPTIONS[key][v];
  }

  // Prefill from the homepage quick planner (?dest=…&type=…&pax=…&depart=…&ret=…&nights=…&flex=…).
  (function prefill() {
    var q = new URLSearchParams(location.search);
    var d = OPTIONS.dests.indexOf(q.get('dest'));
    if (d >= 0) state.dests = [d];
    var t = OPTIONS.type.indexOf(q.get('type'));
    if (t >= 0) state.type = t;
    var pax = parseInt(q.get('pax'), 10);
    if (pax >= 1 && pax <= 20) state.adults = pax;
    var nights = parseInt(q.get('nights'), 10);
    if (nights >= 1 && nights <= 60) state.nights = nights;
    var iso = /^\d{4}-\d{2}-\d{2}$/;
    if (iso.test(q.get('depart') || '')) state.depart = q.get('depart');
    if (iso.test(q.get('ret') || '')) state.ret = q.get('ret');
    var flex = parseInt(q.get('flex'), 10);
    if (flex >= 0 && flex <= 3) state.flex = flex;
  })();

  // Chip groups: single choice toggles off when tapped again; data-multi allows several.
  $$('[data-chips]').forEach(function (box) {
    var key = box.getAttribute('data-chips');
    var multi = box.hasAttribute('data-multi');
    OPTIONS[key].forEach(function (label, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = label;
      b.addEventListener('click', function () {
        if (multi) {
          var at = state[key].indexOf(i);
          if (at >= 0) state[key].splice(at, 1); else state[key].push(i);
        } else {
          state[key] = state[key] === i ? -1 : i;
        }
        render();
      });
      box.appendChild(b);
    });
  });

  $$('[data-step]').forEach(function (b) {
    var parts = b.getAttribute('data-step').split(':'), key = parts[0], delta = +parts[1];
    b.addEventListener('click', function () {
      state[key] = Math.max(LIMITS[key][0], Math.min(LIMITS[key][1], state[key] + delta));
      if (key === 'nights' && state.depart) state.ret = U.addDays(state.depart, state.nights);
      render();
    });
  });

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

  ['budgetMin', 'budgetMax'].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener('input', function () {
      var n = Math.floor(Math.abs(parseFloat(input.value)));
      state[id] = isFinite(n) && n > 0 ? n : '';
      render();
    });
  });

  ['cities', 'name', 'from', 'phone', 'email', 'notes'].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener('input', function () { state[id] = input.value.trim(); render(); });
  });

  function message() {
    var lines = ['مرحبا، أريد التخطيط لرحلة:'];
    function add(label, value) { if (value) lines.push(label + ': ' + value); }
    add('الاسم', state.name);
    add('الهاتف', state.phone);
    add('البريد الإلكتروني', state.email);
    add('مدينة المغادرة', state.from);
    add('الوجهة', pick('dests').join('، ') || 'لم أقرر بعد');
    add('مدن تهمني', state.cities);
    add('المسافرون', paxLabel());
    add('نوع الرحلة', pick('type'));
    add('الذهاب', U.dateLine(state.depart));
    add('العودة', U.dateLine(state.ret));
    add('عدد الليالي', String(state.nights));
    add('مرونة التاريخ', state.flex ? U.FLEX[state.flex] : 'تواريخ ثابتة');
    add('مستوى الإقامة', pick('stay'));
    add('الميزانية للشخص', budgetLabel());
    add('الاهتمامات', pick('interests').join('، '));
    add('الخدمات المطلوبة', pick('services').join('، '));
    add('ملاحظات', state.notes);
    return lines.join('\n');
  }

  function progress() {
    var checks = [
      state.dests.length > 0, state.type >= 0, !!state.depart, state.stay >= 0,
      !!(state.budgetMin || state.budgetMax), state.interests.length > 0, state.services.length > 0,
      !!state.name, !!state.from, !!(state.phone || state.email)
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }

  function render() {
    var dests = pick('dests');
    var first = state.dests.length ? DESTS[state.dests[0]] : null;
    var services = pick('services');
    var pct = progress();
    var out = {
      adults: state.adults, children: state.children, infants: state.infants, nights: state.nights,
      fromName: state.from || 'مدينتك',
      toCode: first ? first[1] + (dests.length > 1 ? '+' + (dests.length - 1) : '') : '???',
      toName: dests.join('، ') || 'اختر وجهة',
      paxLabel: paxLabel(),
      typeLabel: pick('type') || '—',
      nightsLabel: U.nightsLabel(state.nights),
      departLabel: U.fmt(state.depart), returnLabel: U.fmt(state.ret), flexLabel: U.FLEX[state.flex],
      stayLabel: pick('stay') || '—',
      budgetLabel: budgetLabel() || '—',
      servicesLabel: services.length ? services.length + ' خدمات' : '—',
      progress: pct + '%'
    };
    if (services.length === 1) out.servicesLabel = services[0];
    if (services.length === 2) out.servicesLabel = 'خدمتان';
    Object.keys(out).forEach(function (k) {
      $$('[data-out="' + k + '"]').forEach(function (n) { n.textContent = out[k]; });
    });
    $('[data-meter]').style.width = pct + '%';

    $$('[data-chips]').forEach(function (box) {
      var v = state[box.getAttribute('data-chips')];
      Array.prototype.forEach.call(box.children, function (b, i) {
        b.setAttribute('aria-pressed', String(Array.isArray(v) ? v.indexOf(i) >= 0 : v === i));
      });
    });

    departInput.value = state.depart;
    returnInput.value = state.ret;
    returnInput.min = state.depart ? U.addDays(state.depart, 1) : departInput.min;
    flexSelect.value = String(state.flex);

    var text = message();
    var wa = U.waLink(text);
    var mail = U.mailLink('طلب رحلة' + (dests.length ? ' — ' + dests.join('، ') : ''), text);
    $$('[data-send="wa"]').forEach(function (a) { a.href = wa; });
    $$('[data-send="mail"]').forEach(function (a) { a.href = mail; });
  }

  render();
})();
