// Full trip planner page: form state, live summary and WhatsApp/email handoff.
(function () {
  var U = window.ATT, $ = U.$, $$ = U.$$;

  var CODES = ['BKK', 'SGN', 'DPS', 'TYO', 'EUR', 'DXB', '???'];
  var L = {
    ar: {
      options: {
        dests: ['تايلاند', 'فيتنام', 'بالي', 'اليابان', 'أوروبا', 'الشرق الأوسط', 'وجهة أخرى'],
        type: ['شهر عسل', 'عائلية', 'استرخاء وشواطئ', 'مغامرة', 'رحلة منظمة', 'أصدقاء'],
        stay: ['اقتصادي', '٤ نجوم', '٥ نجوم', 'فلل ومنتجعات خاصة'],
        interests: ['شواطئ وجزر', 'طبيعة', 'ثقافة ومعابد', 'تسوق', 'مغامرات وأنشطة', 'سبا واسترخاء', 'مطاعم حلال', 'حياة ليلية'],
        services: ['تذاكر طيران', 'فنادق', 'استقبال وتنقلات', 'جولات يومية', 'تأشيرة', 'تأمين سفر']
      },
      intro: 'مرحبا، أريد التخطيط لرحلة:', subject: 'طلب رحلة',
      name: 'الاسم', phone: 'الهاتف', email: 'البريد الإلكتروني', from: 'مدينة المغادرة',
      dest: 'الوجهة', undecided: 'لم أقرر بعد', cities: 'مدن تهمني', travellers: 'المسافرون', type: 'نوع الرحلة',
      depart: 'الذهاب', ret: 'العودة', nights: 'عدد الليالي', flex: 'مرونة التاريخ', stay: 'مستوى الإقامة',
      budget: 'الميزانية للشخص', interests: 'الاهتمامات', services: 'الخدمات المطلوبة', notes: 'ملاحظات',
      yourCity: 'مدينتك', pickDest: 'اختر وجهة',
      servicesCount: function (n) { return n === 2 ? 'خدمتان' : n + ' خدمات'; }
    },
    he: {
      options: {
        dests: ['תאילנד', 'וייטנאם', 'באלי', 'יפן', 'אירופה', 'המזרח התיכון', 'יעד אחר'],
        type: ['ירח דבש', 'משפחתי', 'בטן-גב וחופים', 'הרפתקאות', 'טיול מאורגן', 'חברים'],
        stay: ['חסכוני', '4 כוכבים', '5 כוכבים', 'וילות ואתרי נופש פרטיים'],
        interests: ['חופים ואיים', 'טבע', 'תרבות ומקדשים', 'קניות', 'הרפתקאות ואטרקציות', 'ספא ורוגע', 'אוכל כשר', 'חיי לילה'],
        services: ['טיסות', 'מלונות', 'איסוף והסעות', 'סיורים יומיים', 'ויזה', 'ביטוח נסיעות']
      },
      intro: 'שלום, אני רוצה לתכנן טיול:', subject: 'בקשה לתכנון טיול',
      name: 'שם', phone: 'טלפון', email: 'אימייל', from: 'עיר יציאה',
      dest: 'יעד', undecided: 'עדיין לא החלטתי', cities: 'ערים שמעניינות אותי', travellers: 'נוסעים', type: 'סוג הטיול',
      depart: 'יציאה', ret: 'חזרה', nights: 'מספר לילות', flex: 'גמישות בתאריכים', stay: 'רמת לינה',
      budget: 'תקציב לאדם', interests: 'תחומי עניין', services: 'שירותים מבוקשים', notes: 'הערות',
      yourCity: 'העיר שלך', pickDest: 'בחרו יעד',
      servicesCount: function (n) { return n + ' שירותים'; }
    }
  }[U.lang];
  var OPTIONS = L.options;
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
      var b = U.el('button', 'chip', label);
      b.type = 'button';
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
    input.addEventListener('input', function () { state[id] = U.amount(input.value); render(); });
  });

  ['cities', 'name', 'from', 'phone', 'email', 'notes'].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener('input', function () { state[id] = input.value.trim(); render(); });
  });

  function message() {
    var lines = [L.intro];
    function add(label, value) { if (value) lines.push(label + ': ' + value); }
    add(L.name, state.name);
    add(L.phone, state.phone);
    add(L.email, state.email);
    add(L.from, state.from);
    add(L.dest, pick('dests').join(U.sep) || L.undecided);
    add(L.cities, state.cities);
    add(L.travellers, paxLabel());
    add(L.type, pick('type'));
    add(L.depart, U.dateLine(state.depart));
    add(L.ret, U.dateLine(state.ret));
    add(L.nights, String(state.nights));
    add(L.flex, U.flexLine(state.flex));
    add(L.stay, pick('stay'));
    add(L.budget, budgetLabel());
    add(L.interests, pick('interests').join(U.sep));
    add(L.services, pick('services').join(U.sep));
    add(L.notes, state.notes);
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
    var services = pick('services');
    var pct = progress();
    U.output({
      adults: state.adults, children: state.children, infants: state.infants, nights: state.nights,
      fromName: state.from || L.yourCity,
      toCode: dests.length ? CODES[state.dests[0]] + (dests.length > 1 ? '+' + (dests.length - 1) : '') : '???',
      toName: dests.join(U.sep) || L.pickDest,
      paxLabel: paxLabel(),
      typeLabel: pick('type') || '—',
      nightsLabel: U.nightsLabel(state.nights),
      departLabel: U.fmt(state.depart), returnLabel: U.fmt(state.ret), flexLabel: U.FLEX[state.flex],
      stayLabel: pick('stay') || '—',
      budgetLabel: budgetLabel() || '—',
      servicesLabel: services.length === 1 ? services[0] : services.length ? L.servicesCount(services.length) : '—',
      progress: pct + '%'
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
    var mail = U.mailLink(L.subject + (dests.length ? ' — ' + dests.join(U.sep) : ''), text);
    $$('[data-send="wa"]').forEach(function (a) { a.href = wa; });
    $$('[data-send="mail"]').forEach(function (a) { a.href = mail; });
  }

  render();
})();
