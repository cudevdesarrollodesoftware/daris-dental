(function () {
  'use strict';

  /** WhatsApp de la clínica (sin +) */
  var WA_NUMBER = '5354783902';

  /** Endpoint oficial TRMI El Toque — requiere token (meta el-toque-token o window.__EL_TOQUE_TOKEN__) */
  var EL_TOQUE_TRMI_URL = 'https://tasas.eltoque.com/v1/trmi';

  var SERVICIOS_DENTALES_USD = [
    { name: 'Limpiezas profundas', usd: 10 },
    { name: 'Blanqueamientos dentales', usd: 20 },
    { name: 'Pack limpieza + blanqueamiento', usd: 25 },
    { name: 'Curitas o sellados temporales', usd: 5 },
    { name: 'Empaste en dientes anteriores', usd: 10 },
    { name: 'Empastes en molares', usd: 15 },
    { name: 'Reconstrucciones en dientes afectados estéticamente o con cambios de coloración', usd: 25 },
    { name: 'Reconstrucción de espigas', usd: 40 },
    { name: 'Cierres de diastemas', usd: 45 },
    { name: 'Puentes fijos', usd: 50 },
    { name: 'Puentes fijos de 2 o más molares', usd: 60 },
    { name: 'Servicio de ortodoncia', usd: 80 },
    { name: 'Diseños de sonrisa', usd: 42 },
    { name: 'Mantenimiento de diseños de sonrisa', usd: 15 }
  ];

  /** Textos de la modal por servicio (clave = data-service-id en index.html). */
  var SERVICIOS_MODAL_DESC = {
    reconstrucciones:
      'Carillas en dientes anteriores fracturados y dientes con cambios de coloración por trauma o TPR. Reconstrucciones grandes en molares y dientes afectados funcional y estéticamente',
    'limpieza-blanqueamiento':
      'Profesionalmente recomiendo un máximo de 3 sesiones y un mínimo de 2 sesiones para lograr un resultado satisfactorio. Nota importante: Siempre para realizar un blanqueamiento en la primera sesion hay que realizar antes una limpieza dental, sobre un diente sucio o manchado no se puede realizar',
    'puentes-fijos':
      'Reconstrucción de puente fijo en molares y en espacios por dientes perdidos tras extracciones previas, una vez la zona cicatrizada y lista para rehabilitar. En consulta valoramos pilares, longitud del puente y oclusión; el alcance y el coste dependen de cada caso.',
    'carillas-faciales':
      'Las carillas faciales mejoran forma, tamaño y color de los dientes visibles al hablar o sonreír. En consulta definimos si su caso encaja con carillas de composite o de porcelana, el número de piezas y el protocolo. El resultado busca naturalidad y armonía con su rostro; el plan y el coste dependen de la valoración clínica.',
    'diseno-sonrisa':
      'Los diseños de sonrisa tienen una referencia orientativa de 42 USD por diente; el paciente escoge el tono que desea para cada pieza. Como en todo tratamiento, el resultado se cuida en el día a día: ahí está cerca del 80% del éxito, en el mantenimiento que cada persona dedica en casa. El otro 20% lo aportamos nosotros con materiales de calidad y un trabajo clínico del que esperamos que quede muy satisfecho.'
  };

  /**
   * Galería de la modal por servicio: { src, alt }[]. Si falta una clave, se usa solo la foto de la tarjeta.
   * Sustituya URLs por las fotos reales de la clínica.
   */
  var SERVICIOS_MODAL_IMAGES = {
    reconstrucciones: [
      { src: 'images/reconstruccion-1.jpg', alt: 'Reconstrucciones — caso clínico' },
      { src: 'images/reconstruccion-2.jpg', alt: 'Reconstrucciones — detalle' },
      { src: 'images/reconstruccion-3.jpg', alt: 'Reconstrucciones — valoración' },
      { src: 'images/reconstruccion-4.jpg', alt: 'Reconstrucciones — resultado' }
    ],
    'limpieza-blanqueamiento': [
      { src: 'images/limpieza-blanqueamiento-1.jpg', alt: 'Limpieza y blanqueamiento — tratamiento' },
      { src: 'images/limpieza-blanqueamiento-2.jpg', alt: 'Limpieza y blanqueamiento — seguimiento' }
    ],
    'puentes-fijos': [{ src: 'images/puentes-fijos.jpg', alt: 'Puentes fijos — rehabilitación' }],
    'carillas-faciales': [
      { src: 'images/carillas-faciales-1.jpg', alt: 'Carillas estéticas — vista 1' },
      { src: 'images/carillas-faciales-2.jpg', alt: 'Carillas estéticas — vista 2' },
      { src: 'images/carillas-faciales-3.jpg', alt: 'Carillas estéticas — vista 3' },
      { src: 'images/carillas-faciales-4.jpg', alt: 'Carillas estéticas — vista 4' }
    ],
    'diseno-sonrisa': [
      { src: 'images/dis-sonrisa-1.jpg', alt: 'Diseños de sonrisa — vista 1' },
      { src: 'images/dis-sonrisa-2.jpg', alt: 'Diseños de sonrisa — vista 2' },
      { src: 'images/dis-sonrisa-3.jpg', alt: 'Diseños de sonrisa — vista 3' },
      { src: 'images/dis-sonrisa-4.jpg', alt: 'Diseños de sonrisa — vista 4' },
      { src: 'images/dis-sonrisa-5.jpg', alt: 'Diseños de sonrisa — vista 5' },
      { src: 'images/dis-sonrisa-6.jpg', alt: 'Diseños de sonrisa — vista 6' }
    ]
  };

  var ARTICULOS_DENTALES_USD = [
    { name: 'Férulas dentales', usd: 10},
    { name: 'Sets de higiene para aparatos fijos', usd: 8 },
    { name: 'Enjuague bucal Listerine 1 L (1000 ml)', usd: 18 },
    { name: 'Enjuague bucal pequeño (95 ml)', usd: 3 },
    { name: 'Pasta dental blanqueadora', usd: 6 }
  ];

  var state = {
    currency: 'USD',
    cupPerUsd: null,
    rateError: null,
    rateUpdated: null,
    rateLoading: true
  };

  function getElToqueToken() {
    var m = document.querySelector('meta[name="el-toque-token"]');
    var fromMeta = m && m.getAttribute('content');
    if (fromMeta && fromMeta.trim()) return fromMeta.trim();
    if (typeof window !== 'undefined' && window.__EL_TOQUE_TOKEN__) {
      return String(window.__EL_TOQUE_TOKEN__).trim();
    }
    return '';
  }

  /**
   * Intenta obtener la mediana USD→CUP desde distintas formas de respuesta de la API.
   */
  function extractCupPerUsd(data) {
    if (data == null || typeof data !== 'object') return null;

    if (typeof data.USD === 'number' && data.USD > 0) return data.USD;
    if (typeof data.usd === 'number' && data.usd > 0) return data.usd;

    var usdBlock = data.USD || data.usd || data.Usd;
    if (usdBlock && typeof usdBlock === 'object') {
      var n = pickNumeric(usdBlock, ['median', 'median_24h', 'value', 'trmi', 'price', 'cup']);
      if (n != null) return n;
    }

    var arr = data.currencies || data.rates || data.data;
    if (Array.isArray(arr)) {
      for (var i = 0; i < arr.length; i++) {
        var row = arr[i];
        if (!row || typeof row !== 'object') continue;
        var code = (row.code || row.currency || row.symbol || row.name || '').toString().toUpperCase();
        if (code === 'USD' || code === 'DOLAR' || code === 'USD_INFORMAL') {
          var v = pickNumeric(row, ['median', 'median_24h', 'value', 'trmi', 'cup', 'price']);
          if (v != null) return v;
        }
      }
    }

    if (data.trmi && typeof data.trmi === 'object') {
      var t = data.trmi.USD || data.trmi.usd;
      if (t && typeof t === 'object') {
        var t2 = pickNumeric(t, ['median', 'value', 'cup']);
        if (t2 != null) return t2;
      }
    }

    return null;
  }

  function pickNumeric(obj, keys) {
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      if (obj[key] == null) continue;
      var num = Number(obj[key]);
      if (!isNaN(num) && num > 0) return num;
    }
    return null;
  }

  function formatUsd(n) {
    return new Intl.NumberFormat('es-CU', { maximumFractionDigits: 0 }).format(n) + ' USD';
  }

  function formatCup(n) {
    return new Intl.NumberFormat('es-CU', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' CUP';
  }

  function setRateLabel() {
    var el = document.getElementById('rate-label');
    var retry = document.getElementById('rate-retry');
    if (!el) return;
    if (state.cupPerUsd != null) {
      var extra = state.rateUpdated ? ' · Actualización API: ' + state.rateUpdated : '';
      el.textContent = 'Tasa de cambio según El Toque: 1 USD ≈ ' + formatCup(state.cupPerUsd) + extra;
      el.classList.remove('text-red-600');
      el.classList.add('text-soft-gray-dark');
      if (retry) retry.classList.add('hidden');
    } else if (state.rateLoading) {
      el.textContent = 'Tasa de cambio según El Toque: cargando…';
      el.classList.remove('text-red-600');
      el.classList.add('text-soft-gray-dark');
      if (retry) retry.classList.add('hidden');
    } else {
      el.textContent = 'Error al cargar la tasa de cambio';
      el.classList.add('text-red-600');
      el.classList.remove('text-soft-gray-dark');
      if (retry) retry.classList.remove('hidden');
    }
  }

  function displayNameCell(item) {
    if (!item.stockNote) return item.name;
    return item.name + ' · ' + item.stockNote;
  }

  /** Rellena el select «Motivo» solo con servicios dentales + «Otro». */
  function populateAgendaMotivoSelect() {
    var sel = document.getElementById('motivo');
    if (!sel) return;

    sel.innerHTML = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccione…';
    sel.appendChild(placeholder);

    for (var i = 0; i < SERVICIOS_DENTALES_USD.length; i++) {
      var it = SERVICIOS_DENTALES_USD[i];
      var text = displayNameCell(it);
      var o = document.createElement('option');
      o.value = text;
      o.textContent = text;
      sel.appendChild(o);
    }

    var ot = document.createElement('option');
    ot.value = 'Otro';
    ot.textContent = 'Otro';
    sel.appendChild(ot);
  }

  function appendPriceRows(items, tbody, cardsRoot) {
    if (!tbody) return;
    var rate = state.cupPerUsd;

    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      var zebra = i % 2 === 1;
      var label = displayNameCell(s);

      var tr = document.createElement('tr');
      if (zebra) tr.className = 'bg-slate-50/80';

      var tdName = document.createElement('td');
      tdName.className = 'px-4 py-3 text-slate-700 sm:px-5 sm:py-3.5';
      tdName.textContent = label;

      var tdPrice = document.createElement('td');
      tdPrice.className =
        'px-4 py-3 text-right font-display text-base font-semibold tabular-nums text-dental-blue-dark sm:px-5 sm:py-3.5';
      tdPrice.dataset.usd = String(s.usd);

      var usdText = formatUsd(s.usd);
      var cupText = rate != null ? formatCup(s.usd * rate) : '—';

      if (state.currency === 'USD') {
        tdPrice.textContent = usdText;
      } else {
        tdPrice.textContent = cupText;
        tdPrice.title = 'Equivalente aproximado: ' + usdText;
      }

      tr.appendChild(tdName);
      tr.appendChild(tdPrice);
      tbody.appendChild(tr);

      if (cardsRoot) {
        var row = document.createElement('div');
        row.className =
          'flex flex-row items-baseline justify-between gap-3 px-4 py-3.5 ' + (zebra ? 'bg-slate-50/80 ' : '');
        var nameEl = document.createElement('span');
        nameEl.className = 'min-w-0 flex-1 text-sm leading-snug text-slate-700';
        nameEl.textContent = label;
        var priceEl = document.createElement('span');
        priceEl.className =
          'shrink-0 whitespace-nowrap text-right font-display text-base font-semibold tabular-nums text-dental-blue-dark';
        if (state.currency === 'USD') {
          priceEl.textContent = usdText;
        } else {
          priceEl.textContent = cupText;
          priceEl.title = 'Equivalente aproximado: ' + usdText;
        }
        row.appendChild(nameEl);
        row.appendChild(priceEl);
        cardsRoot.appendChild(row);
      }
    }
  }

  function renderPrices() {
    var tbodySvc = document.getElementById('price-table-body-services');
    var tbodyArt = document.getElementById('price-table-body-articles');
    var cardsSvc = document.getElementById('price-cards-mobile-services');
    var cardsArt = document.getElementById('price-cards-mobile-articles');
    if (!tbodySvc || !tbodyArt) return;

    var headingText = state.currency === 'USD' ? 'Precio USD' : 'Precio CUP';

    ['price-column-heading-services', 'price-column-heading-articles'].forEach(function (id) {
      var th = document.getElementById(id);
      if (th) th.textContent = headingText;
    });

    ['price-mobile-banner-services', 'price-mobile-banner-articles'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = headingText;
    });

    tbodySvc.innerHTML = '';
    tbodyArt.innerHTML = '';
    if (cardsSvc) cardsSvc.innerHTML = '';
    if (cardsArt) cardsArt.innerHTML = '';

    appendPriceRows(SERVICIOS_DENTALES_USD, tbodySvc, cardsSvc);
    appendPriceRows(ARTICULOS_DENTALES_USD, tbodyArt, cardsArt);
  }

  function setCurrencyButtons() {
    var bUsd = document.getElementById('currency-usd');
    var bCup = document.getElementById('currency-cup');
    if (!bUsd || !bCup) return;

    var active =
      'rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-dental-blue-dark shadow-md ring-1 ring-slate-200/80';
    var idle =
      'rounded-full px-5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white/70 hover:text-dental-blue';

    if (state.currency === 'USD') {
      bUsd.className = active;
      bCup.className = idle;
    } else {
      bUsd.className = idle;
      bCup.className = active;
    }

    bCup.disabled = state.cupPerUsd == null;
    bCup.classList.toggle('cursor-not-allowed', state.cupPerUsd == null);
    bCup.classList.toggle('opacity-40', state.cupPerUsd == null);
    bCup.title = state.cupPerUsd == null ? 'Activa cuando cargue la tasa de El Toque' : '';
  }

  function fetchElToqueRate() {
    var token = getElToqueToken();
    var headers = { Accept: 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;

    return fetch(EL_TOQUE_TRMI_URL, { headers: headers, cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var cup = extractCupPerUsd(json);
        if (cup == null) throw new Error('Formato de respuesta no reconocido');
        state.cupPerUsd = cup;
        state.rateError = null;
        if (json.updated_at) state.rateUpdated = json.updated_at;
        else if (json.updatedAt) state.rateUpdated = json.updatedAt;
        else if (json.date) state.rateUpdated = json.date;
        else state.rateUpdated = null;
      })
      .catch(function (err) {
        state.cupPerUsd = null;
        state.rateError = err && err.message ? err.message : 'Error de red';
      });
  }

  function initCurrencyUi() {
    var bUsd = document.getElementById('currency-usd');
    var bCup = document.getElementById('currency-cup');
    if (bUsd) {
      bUsd.addEventListener('click', function () {
        state.currency = 'USD';
        setCurrencyButtons();
        renderPrices();
      });
    }
    if (bCup) {
      bCup.addEventListener('click', function () {
        if (state.cupPerUsd == null) return;
        state.currency = 'CUP';
        setCurrencyButtons();
        renderPrices();
      });
    }

    var retryBtn = document.getElementById('rate-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        state.rateLoading = true;
        state.rateError = null;
        setRateLabel();
        fetchElToqueRate().finally(function () {
          state.rateLoading = false;
          setRateLabel();
          setCurrencyButtons();
          if (state.currency === 'CUP' && state.cupPerUsd == null) {
            state.currency = 'USD';
          }
          renderPrices();
        });
      });
    }
  }

  function normalizePhoneDigits(input) {
    var d = String(input || '').replace(/\D/g, '');
    if (d.startsWith('53')) d = d.slice(2);
    return d;
  }

  function buildWhatsAppMessage(form) {
    var nombre = (form.nombre && form.nombre.value.trim()) || '';
    var tel = normalizePhoneDigits(form.telefono && form.telefono.value);
    var motivo = (form.motivo && form.motivo.value) || '';
    var descripcion = (form.descripcion && form.descripcion.value.trim()) || '';
    var tiempo = (form.tiempo && form.tiempo.value.trim()) || '';
    var estetica = (form.estetica && form.estetica.value.trim()) || '';

    var disp = '';
    var radios = form.querySelectorAll('input[name="disponibilidad"]:checked');
    if (radios.length) disp = radios[0].value;

    var ants = [];
    var boxes = form.querySelectorAll('input[name="antecedente"]:checked');
    for (var i = 0; i < boxes.length; i++) ants.push(boxes[i].value);

    var lines = [
      '*Nueva solicitud — Dari\'s Dental*',
      '',
      '*Nombre:* ' + nombre,
      '*Teléfono:* +53' + tel,
      '*Motivo:* ' + motivo,
      '*Descripción:* ' + (descripcion || '—'),
      '*Tiempo con el problema:* ' + (tiempo || '—'),
      '*Disponibilidad:* ' + (disp || '—'),
      '*Antecedentes:* ' + (ants.length ? ants.join(', ') : 'Ninguno declarado'),
      '*Otra preocupación estética:* ' + (estetica || '—'),
      '',
      '_Mensaje generado desde dari.dental (web)._'
    ];
    return lines.join('\n');
  }

  function initMobileNav() {
    var toggle = document.getElementById('nav-menu-toggle');
    var panel = document.getElementById('nav-mobile-panel');
    var backdrop = document.getElementById('nav-backdrop');
    var menuIcon = document.getElementById('nav-icon-menu');
    var closeIcon = document.getElementById('nav-icon-close');
    if (!toggle || !panel) return;

    function setOpen(open) {
      if (open) {
        panel.classList.remove('hidden');
        panel.classList.add('flex', 'flex-col');
        if (backdrop) {
          backdrop.classList.remove('hidden');
          backdrop.setAttribute('aria-hidden', 'false');
        }
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Cerrar menú');
        if (menuIcon) menuIcon.classList.add('hidden');
        if (closeIcon) closeIcon.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
      } else {
        panel.classList.add('hidden');
        panel.classList.remove('flex', 'flex-col');
        if (backdrop) {
          backdrop.classList.add('hidden');
          backdrop.setAttribute('aria-hidden', 'true');
        }
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
        if (menuIcon) menuIcon.classList.remove('hidden');
        if (closeIcon) closeIcon.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(panel.classList.contains('hidden'));
    });

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        setOpen(false);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.classList.contains('hidden')) setOpen(false);
    });

    var links = panel.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () {
        setOpen(false);
      });
    }
  }

  function initServiceModal() {
    var root = document.getElementById('service-modal');
    var backdrop = document.getElementById('service-modal-backdrop');
    var closeX = document.getElementById('service-modal-close-x');
    var closeBtn = document.getElementById('service-modal-close-btn');
    var titleEl = document.getElementById('service-modal-title');
    var imgEl = document.getElementById('service-modal-img');
    var descEl = document.getElementById('service-modal-desc');
    var prevBtn = document.getElementById('service-modal-prev');
    var nextBtn = document.getElementById('service-modal-next');
    if (!root || !titleEl || !imgEl || !descEl) return;

    var lastFocus = null;
    var gallerySlides = [];
    var galleryIndex = 0;

    function updateCarouselNav() {
      var n = gallerySlides.length;
      if (!prevBtn || !nextBtn) return;
      if (n <= 1) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        return;
      }
      prevBtn.classList.toggle('hidden', galleryIndex <= 0);
      nextBtn.classList.toggle('hidden', galleryIndex >= n - 1);
    }

    function showSlide(i) {
      if (!gallerySlides.length || i < 0 || i >= gallerySlides.length) return;
      galleryIndex = i;
      var s = gallerySlides[galleryIndex];
      if (s && s.src) {
        imgEl.src = s.src;
        imgEl.alt = s.alt || '';
      }
      updateCarouselNav();
    }

    function openFromButton(btn) {
      var id = btn.getAttribute('data-service-id');
      if (!id) return;
      var article = btn.closest('article.service-card');
      if (!article) return;
      var cardImg = article.querySelector('img.service-card-img');
      var titleNode = article.querySelector('.service-card-title');
      var title = titleNode ? titleNode.textContent.trim() : '';
      var desc =
        SERVICIOS_MODAL_DESC[id] ||
        'Para detalles y valoración personalizada, escríbanos por WhatsApp o consulte la lista de precios en esta página.';

      var slides = SERVICIOS_MODAL_IMAGES[id];
      if (!slides || !slides.length) {
        slides =
          cardImg && cardImg.getAttribute('src')
            ? [{ src: cardImg.getAttribute('src'), alt: cardImg.getAttribute('alt') || title }]
            : [];
      }

      gallerySlides = slides;
      titleEl.textContent = title;
      descEl.textContent = desc;
      if (!gallerySlides.length) {
        imgEl.removeAttribute('src');
        imgEl.alt = title || '';
        updateCarouselNav();
      } else {
        showSlide(0);
      }

      lastFocus = document.activeElement;
      root.classList.remove('hidden');
      root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');

      if (closeX) closeX.focus();
    }

    function closeModal() {
      root.classList.add('hidden');
      root.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');
      gallerySlides = [];
      galleryIndex = 0;
      if (prevBtn) prevBtn.classList.add('hidden');
      if (nextBtn) nextBtn.classList.add('hidden');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try {
          lastFocus.focus();
        } catch (e) {
          /* ignore */
        }
      }
      lastFocus = null;
    }

    document.addEventListener('click', function (e) {
      var openBtn = e.target && e.target.closest && e.target.closest('.service-modal-open');
      if (!openBtn) return;
      e.preventDefault();
      openFromButton(openBtn);
    });

    if (backdrop) backdrop.addEventListener('click', closeModal);
    if (closeX) closeX.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showSlide(galleryIndex - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        showSlide(galleryIndex + 1);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (root.classList.contains('hidden')) return;
      if (e.key === 'Escape') {
        closeModal();
        return;
      }
      if (gallerySlides.length <= 1) return;
      if (e.key === 'ArrowLeft' && galleryIndex > 0) {
        e.preventDefault();
        showSlide(galleryIndex - 1);
      } else if (e.key === 'ArrowRight' && galleryIndex < gallerySlides.length - 1) {
        e.preventDefault();
        showSlide(galleryIndex + 1);
      }
    });
  }

  function initForm() {
    var form = document.getElementById('wa-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nombre = form.nombre.value.trim();
      var tel = normalizePhoneDigits(form.telefono.value);
      var motivo = form.motivo.value;

      if (!nombre) {
        alert('Indique su nombre completo.');
        form.nombre.focus();
        return;
      }
      if (tel.length < 8) {
        alert('Indique un teléfono válido (cuba, +53).');
        form.telefono.focus();
        return;
      }
      if (!motivo) {
        alert('Seleccione el motivo de consulta.');
        form.motivo.focus();
        return;
      }

      var text = buildWhatsAppMessage(form);
      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
      window.location.href = url;
    });
  }

  function boot() {
    populateAgendaMotivoSelect();
    initMobileNav();
    initServiceModal();
    initCurrencyUi();
    initForm();
    renderPrices();
    setCurrencyButtons();
    setRateLabel();

    fetchElToqueRate().finally(function () {
      state.rateLoading = false;
      setRateLabel();
      setCurrencyButtons();
      if (state.currency === 'CUP' && state.cupPerUsd == null) {
        state.currency = 'USD';
      }
      renderPrices();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
