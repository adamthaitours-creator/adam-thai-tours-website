// Flights & hotels quote page: three request modes, live ticket/voucher summary and WhatsApp/email handoff.
(function () {
  var U = window.ATT, $ = U.$, $$ = U.$$;

  var MODES = { flight: 'تذكرة طيران', hotel: 'فندق', both: 'طيران + فندق' };
  var OPTIONS = {
    trip: ['ذهاب وعودة', 'ذهاب فقط'],
    cabin: ['اقتصادية', 'اقتصادية مميزة', 'رجال الأعمال', 'الدرجة الأولى'],
    bags: ['حقيبة يد فقط', 'حقيبة شحن واحدة', 'حقيبتا شحن'],
    stars: ['٣ نجوم', '٤ نجوم', '٥ نجوم', 'فيلا / منتجع'],
    board: ['بدون وجبات', 'إفطار', 'نصف إقامة', 'إقامة كاملة', 'شامل كليًا'],
    prefs: ['قريب من الشاطئ', 'وسط المدينة', 'مسبح', 'مسبح خاص', 'مناسب للعائلات', 'سبا', 'إطلالة بحرية', 'غرف متصلة']
  };
  var LIMITS = { adults: [1, 20], children: [0, 10], infants: [0, 5], rooms: [1, 10], nights: [1, 60] };

  var state = {
    mode: 'flight',
    trip: 0, fromCity: '', toCity: '', fDepart: '', fReturn: '', flex: 0, cabin: 0, bags: 1, direct: false, airline: '',
    hotelCity: '', checkin: '', checkout: '', nights: 5, stars: -1, board: -1, prefs: [], budgetMin: '', budgetMax: '',
    // In "both" mode the hotel follows the flight's destination and dates until the hotel fields are edited.
    hotelLinked: true,
    adults: 2, children: 0, infants: 0, rooms: 1,
    name: '', phone: '', email: '', notes: ''
  };

  var tab = new URLSearchParams(location.search).get('tab');
  if (MODES[tab]) state.mode = tab;

  function has(mode) { return state.mode === mode || state.mode === 'both'; }
  function pick(key) {
    var v = state[key];
    if (Array.isArray(v)) return v.map(function (i) { return OPTIONS[key][i]; });
    return v < 0 ? null : OPTIONS[key][v];
  }
  function roomsLabel(n) { return n === 1 ? 'غرفة واحدة' : n === 2 ? 'غرفتان' : n + ' غرف'; }
  function paxLabel() { return U.paxLabel(state.adults, state.children, state.infants); }

  // Copy the flight's destination and dates into the hotel while they are linked.
  function syncHotel() {
    if (state.mode !== 'both' || !state.hotelLinked) return;
    state.hotelCity = state.toCity;
    state.checkin = state.fDepart;
    if (state.fDepart && state.fReturn && state.trip === 0 && U.daysBetween(state.fDepart, state.fReturn) >= 1) {
      state.checkout = state.fReturn;
      state.nights = U.daysBetween(state.fDepart, state.fReturn);
    } else if (state.fDepart) {
      state.checkout = U.addDays(state.fDepart, state.nights);
    }
  }

  $$('[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () { state.mode = b.getAttribute('data-mode'); syncHotel(); render(); });
  });

  // Chip groups: single choice toggles off when tapped again (except trip/cabin/bags); data-multi allows several.
  var REQUIRED = { trip: true, cabin: true, bags: true };
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
          state[key] = state[key] === i && !REQUIRED[key] ? -1 : i;
        }
        syncHotel();
        render();
      });
      box.appendChild(b);
    });
  });

  $('[data-toggle="direct"]').addEventListener('click', function () { state.direct = !state.direct; render(); });

  $('[data-swap]').addEventListener('click', function () {
    var from = state.fromCity;
    state.fromCity = state.toCity;
    state.toCity = from;
    syncHotel();
    render();
  });

  $$('[data-step]').forEach(function (b) {
    var parts = b.getAttribute('data-step').split(':'), key = parts[0], delta = +parts[1];
    b.addEventListener('click', function () {
      state[key] = Math.max(LIMITS[key][0], Math.min(LIMITS[key][1], state[key] + delta));
      if (key === 'nights') {
        state.hotelLinked = false;
        if (state.checkin) state.checkout = U.addDays(state.checkin, state.nights);
      }
      render();
    });
  });

  var inputs = {};
  ['fromCity', 'toCity', 'airline', 'hotelCity', 'name', 'phone', 'email', 'notes'].forEach(function (id) {
    var input = inputs[id] = document.getElementById(id);
    input.addEventListener('input', function () {
      state[id] = input.value.trim();
      if (id === 'hotelCity') state.hotelLinked = false;
      syncHotel();
      render();
    });
  });
  ['budgetMin', 'budgetMax'].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener('input', function () { state[id] = U.amount(input.value); render(); });
  });

  var dates = {};
  ['fDepart', 'fReturn', 'checkin', 'checkout'].forEach(function (id) {
    var input = dates[id] = document.getElementById(id);
    input.min = U.today();
    input.addEventListener('change', function () {
      state[id] = input.value;
      if (id === 'fDepart' && state.fReturn && state.fDepart > state.fReturn) state.fReturn = '';
      if (id === 'checkin' || id === 'checkout') state.hotelLinked = false;
      if (id === 'checkin' && state.checkin) state.checkout = U.addDays(state.checkin, state.nights);
      if (id === 'checkout' && state.checkin && state.checkout) {
        var n = U.daysBetween(state.checkin, state.checkout);
        if (n >= 1) state.nights = n;
        else state.checkout = U.addDays(state.checkin, state.nights);
      }
      syncHotel();
      render();
    });
  });
  var flexSelect = $('#flex');
  flexSelect.addEventListener('change', function () { state.flex = +flexSelect.value; render(); });

  function message() {
    var lines = ['مرحبا، أريد عرض سعر: ' + MODES[state.mode]];
    function add(label, value) { if (value) lines.push(label + ': ' + value); }
    add('الاسم', state.name);
    add('الهاتف', state.phone);
    add('البريد الإلكتروني', state.email);
    add('المسافرون', paxLabel());
    if (has('flight')) {
      lines.push('', '— الطيران —');
      add('نوع التذكرة', pick('trip'));
      add('من', state.fromCity || 'لم يحدد بعد');
      add('إلى', state.toCity || 'لم يحدد بعد');
      add('الذهاب', U.dateLine(state.fDepart));
      if (state.trip === 0) add('العودة', U.dateLine(state.fReturn));
      add('مرونة التاريخ', state.flex ? U.FLEX[state.flex] : 'تواريخ ثابتة');
      add('الدرجة', pick('cabin'));
      add('الأمتعة', pick('bags'));
      if (state.direct) add('التوقفات', 'رحلات مباشرة فقط');
      add('شركة مفضّلة', state.airline);
    }
    if (has('hotel')) {
      lines.push('', '— الفندق —');
      add('المدينة / المنطقة', state.hotelCity || 'لم يحدد بعد');
      add('الوصول', U.dateLine(state.checkin));
      add('المغادرة', U.dateLine(state.checkout));
      add('عدد الليالي', String(state.nights));
      add('الغرف', roomsLabel(state.rooms));
      add('التصنيف', pick('stars'));
      add('الوجبات', pick('board'));
      add('المميزات', pick('prefs').join('، '));
      add('الميزانية لليلة', U.rangeLabel(state.budgetMin, state.budgetMax));
    }
    if (state.notes) lines.push('', 'ملاحظات: ' + state.notes);
    return lines.join('\n');
  }

  function progress() {
    var checks = [!!state.name, !!(state.phone || state.email)];
    if (has('flight')) {
      checks.push(!!state.fromCity, !!state.toCity, !!state.fDepart);
      if (state.trip === 0) checks.push(!!state.fReturn);
    }
    if (has('hotel')) checks.push(!!state.hotelCity, !!state.checkin, state.stars >= 0, state.board >= 0);
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }

  function render() {
    var oneWay = state.trip === 1;

    $$('[data-mode]').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === state.mode));
    });
    $$('[data-show]').forEach(function (n) {
      n.hidden = n.getAttribute('data-show').split(' ').indexOf(state.mode) < 0;
    });
    $$('[data-roundtrip]').forEach(function (n) { n.hidden = oneWay; });
    // Number the visible sections ٠١، ٠٢… so hidden ones leave no gaps.
    $$('.plan-block:not([hidden]) .plan-num').forEach(function (n, i) {
      n.textContent = '٠' + (i + 1).toLocaleString('ar-EG');
    });
    $('[data-hotel-hint]').textContent = state.mode === 'both' && state.hotelLinked
      ? 'مرتبطة بوجهة وتواريخ الطيران — عدّلها إن أردت.'
      : 'أين وكم ليلة؟ وما الذي يهمك في الفندق؟';

    $$('[data-chips]').forEach(function (box) {
      var v = state[box.getAttribute('data-chips')];
      Array.prototype.forEach.call(box.children, function (b, i) {
        b.setAttribute('aria-pressed', String(Array.isArray(v) ? v.indexOf(i) >= 0 : v === i));
      });
    });
    $('[data-toggle="direct"]').setAttribute('aria-pressed', String(state.direct));

    // Only overwrite text inputs that changed programmatically, so typing isn't interrupted.
    Object.keys(inputs).forEach(function (id) {
      if (inputs[id].value.trim() !== state[id]) inputs[id].value = state[id];
    });
    Object.keys(dates).forEach(function (id) { dates[id].value = state[id]; });
    dates.fReturn.min = state.fDepart || U.today();
    dates.checkout.min = state.checkin ? U.addDays(state.checkin, 1) : U.today();
    flexSelect.value = String(state.flex);

    var pct = progress();
    U.output({
      adults: state.adults, children: state.children, infants: state.infants, rooms: state.rooms, nights: state.nights,
      tripCode: oneWay ? 'ONE WAY' : 'ROUND TRIP',
      tripIcon: oneWay ? '✈' : '⇄',
      fromLabel: state.fromCity || 'مدينتك',
      toLabel: state.toCity || 'وجهتك',
      fDepartLabel: U.fmt(state.fDepart), fReturnLabel: U.fmt(state.fReturn), flexLabel: U.FLEX[state.flex],
      paxLabel: paxLabel(), cabinLabel: pick('cabin'), bagsLabel: pick('bags') + (state.direct ? ' · مباشر' : ''),
      hotelLabel: state.hotelCity || 'مدينة الإقامة',
      checkinLabel: U.fmt(state.checkin), checkoutLabel: U.fmt(state.checkout), nightsLabel: U.nightsLabel(state.nights),
      roomsLabel: roomsLabel(state.rooms), starsLabel: pick('stars') || '—', boardLabel: pick('board') || '—',
      budgetLabel: U.rangeLabel(state.budgetMin, state.budgetMax) || '—',
      progress: pct + '%'
    });
    $('[data-meter]').style.width = pct + '%';

    var text = message();
    var subject = 'طلب عرض سعر — ' + MODES[state.mode] + (state.toCity || state.hotelCity ? ' — ' + (state.toCity || state.hotelCity) : '');
    $$('[data-send="wa"]').forEach(function (a) { a.href = U.waLink(text); });
    $$('[data-send="mail"]').forEach(function (a) { a.href = U.mailLink(subject, text); });
  }

  render();
})();
