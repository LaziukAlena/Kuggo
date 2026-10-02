/* ---------- утилиты ---------- */

// Блокируем скролл страницы, пока открыто меню или модалка
function updateScrollLock() {
  const hasOpenLayer = document.querySelector(
    ".mobile-menu.is-open, .testdrive-modal-overlay.is-open, .panel-overlay.is-open",
  );
  document.body.style.overflow = hasOpenLayer ? "hidden" : "";
}

/* ---------- маска телефона: +7 (XXX) XXX - XX - XX (10 цифр) ---------- */

function formatPhoneValue(digits) {
  // digits: только цифры после "+7", максимум 10
  let result = "+7";
  if (digits.length > 0) {
    result += " (" + digits.substring(0, 3);
  }
  if (digits.length >= 3) {
    result += ")";
  }
  if (digits.length > 3) {
    result += " " + digits.substring(3, 6);
  }
  if (digits.length > 6) {
    result += " - " + digits.substring(6, 8);
  }
  if (digits.length > 8) {
    result += " - " + digits.substring(8, 10);
  }
  return result;
}

function caretPositionAfterDigits(formattedValue, digitCount) {
  // пропускаем статичный префикс "+7" — его "7" не введена пользователем
  const scanStart = 2;
  if (digitCount <= 0) {
    return formattedValue.length ? formattedValue.indexOf("(") + 1 : 0;
  }

  let seen = 0;
  for (let i = scanStart; i < formattedValue.length; i++) {
    if (/\d/.test(formattedValue[i])) {
      seen++;
      if (seen === digitCount) return i + 1;
    }
  }
  return formattedValue.length;
}

function initPhoneMask(input) {
  input.addEventListener("input", function () {
    const caretPos = input.selectionStart;
    // сколько цифр стоит левее каретки в «сыром» значении
    const digitsBeforeCaret = input.value
      .substring(0, caretPos)
      .replace(/\D/g, "").length;

    let raw = input.value.replace(/\D/g, "");

    // убираем код страны (7 или 8), "+7" мы добавляем сами.
    // Номер из 10 цифр, вставленный в пустое поле, — это уже номер без кода.
    let leadingDigitDropped = 0;
    if (
      /^[78]/.test(raw) &&
      (raw.length !== 10 || input.value.startsWith("+7"))
    ) {
      raw = raw.substring(1);
      leadingDigitDropped = 1;
    }
    raw = raw.substring(0, 10);

    input.value = raw.length ? formatPhoneValue(raw) : "";

    // возвращаем каретку после той же цифры, а не в конец строки
    const targetDigitCount = Math.max(
      0,
      digitsBeforeCaret - leadingDigitDropped,
    );
    const newCaretPos = caretPositionAfterDigits(input.value, targetDigitCount);
    input.setSelectionRange(newCaretPos, newCaretPos);

    // required пропускает неполный номер — проверяем длину сами
    input.setCustomValidity(raw.length === 10 ? "" : "Введите номер полностью");
  });

  input.addEventListener("focus", function () {
    if (!input.value) {
      input.value = "+7 (";
    }
  });

  input.addEventListener("blur", function () {
    if (input.value === "+7 (" || input.value === "+7") {
      input.value = "";
    }
  });
}

/* ---------- мобильное меню ---------- */

function initMobileMenu() {
  const menu = document.querySelector(".mobile-menu");
  const menuToggle = document.querySelector(".mobile-menu-toggle");
  const menuClose = document.querySelector(".mobile-menu-close");

  if (!menu || !menuToggle || !menuClose) return null;

  const openMenu = () => {
    menu.classList.add("is-open");
    updateScrollLock();
  };
  const closeMenu = () => {
    menu.classList.remove("is-open");
    updateScrollLock();
  };

  menuToggle.addEventListener("click", openMenu);
  menuClose.addEventListener("click", closeMenu);
  menu.querySelectorAll(".mobile-menu-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // если окно расширили до десктопа при открытом меню — закрываем,
  // иначе body остаётся с overflow: hidden
  window
    .matchMedia("(min-width: 939px)")
    .addEventListener("change", (e) => e.matches && closeMenu());

  return { closeMenu };
}

/* ---------- модалка тест-драйва ---------- */

function initModal() {
  const overlay = document.getElementById("testdriveModalOverlay");
  const closeBtn = document.getElementById("testdriveModalClose");
  const openTriggers = document.querySelectorAll(
    '.model-button, a[href="#test-drive"]',
  );

  if (!overlay || !closeBtn) return null;

  let lastFocused = null;

  const openModal = (e) => {
    e.preventDefault();
    lastFocused = document.activeElement;
    overlay.classList.add("is-open");
    updateScrollLock();
    closeBtn.focus();
  };

  const closeModal = () => {
    if (!overlay.classList.contains("is-open")) return;
    overlay.classList.remove("is-open");
    updateScrollLock();
    if (lastFocused) lastFocused.focus();
  };

  openTriggers.forEach((el) => el.addEventListener("click", openModal));
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // простой focus trap: Tab не уходит за пределы модалки
  overlay.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const focusable = overlay.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  return { closeModal, overlay };
}

/* ---------- формы ---------- */

function initForms(modal) {
  document
    .querySelectorAll(".cta-form, .testdrive-modal-form, .subscribe-form")
    .forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        // бэкенда пока нет — здесь будет реальный запрос (fetch)

        form.reset();

        const status = document.createElement("p");
        status.className = "form-status";
        status.setAttribute("role", "status");
        status.textContent = "Спасибо! Заявка отправлена.";
        form.after(status);

        const inModal = modal && modal.overlay.contains(form);
        setTimeout(
          () => {
            status.remove();
            if (inModal) modal.closeModal();
          },
          inModal ? 1500 : 4000,
        );
      });
    });
}

/* ---------- «оживление»: появление при скролле, прогресс, наверх, избранное ---------- */

function initEffects() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // 1. Плавное появление блоков (карточки — с каскадной задержкой)
  if ("IntersectionObserver" in window && !reduceMotion) {
    const targets = document.querySelectorAll(
      ".intro .container, .intro-photo, .training .container, .training-photo, .models-grid > *, .cta-container-wrapper, .subscribe-wrapper",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    targets.forEach((el, i) => {
      el.classList.add("reveal");
      if (el.parentElement.classList.contains("models-grid")) {
        el.style.transitionDelay = (i % 4) * 80 + "ms";
      }
      observer.observe(el);
    });
  }

  // 2. Полоска прогресса чтения + кнопка «наверх»
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  const toTop = document.createElement("button");
  toTop.type = "button";
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "Наверх");
  toTop.textContent = "↑";
  document.body.append(progress, toTop);

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform =
        "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      toTop.classList.toggle("is-visible", window.scrollY > 600);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }),
  );
}

/* ---------- магазин: корзина, избранное, сравнение, поиск, панели ---------- */

const store = {
  read(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* приватный режим / переполнение — работаем без сохранения */
    }
  },
};

function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

const fmtPrice = (n) => n.toLocaleString("ru-RU") + " ₽";

function showToast(msg) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove("is-visible"), 2200);
}

function createPanel() {
  const overlay = document.createElement("div");
  overlay.className = "panel-overlay";
  overlay.innerHTML =
    '<aside class="panel" role="dialog" aria-modal="true" aria-labelledby="panelTitle">' +
    '<div class="panel-head"><h2 class="panel-title" id="panelTitle"></h2>' +
    '<button class="panel-close" type="button" aria-label="Закрыть">×</button></div>' +
    '<div class="panel-body"></div></aside>';
  document.body.append(overlay);

  const titleEl = overlay.querySelector(".panel-title");
  const body = overlay.querySelector(".panel-body");
  const closeBtn = overlay.querySelector(".panel-close");
  let renderFn = null;
  let lastFocused = null;

  const isOpen = () => overlay.classList.contains("is-open");
  const render = () => {
    if (!renderFn) return;
    body.innerHTML = renderFn();
    body.querySelectorAll(".phone-mask").forEach(initPhoneMask);
  };
  const open = (title, fn) => {
    if (!isOpen()) lastFocused = document.activeElement;
    titleEl.textContent = title;
    renderFn = fn;
    render();
    overlay.classList.add("is-open");
    updateScrollLock();
    closeBtn.focus();
  };
  const close = () => {
    if (!isOpen()) return;
    overlay.classList.remove("is-open");
    renderFn = null;
    updateScrollLock();
    if (lastFocused) lastFocused.focus();
  };

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  return { open, close, refresh: render, body, isOpen };
}

function initShop() {
  const cards = [...document.querySelectorAll(".model-card")];
  if (!cards.length) return null;

  const products = cards.map((card, i) => ({
    id: "m" + i,
    card,
    title: card.querySelector(".model-title")?.textContent.trim() || "Модель",
    price:
      parseInt(
        (card.querySelector(".model-price-new")?.textContent || "").replace(
          /\D/g,
          "",
        ),
        10,
      ) || 0,
    img: card.querySelector(".model-image")?.getAttribute("src") || "",
    specs: (card.querySelector(".model-specs")?.innerText || "").trim(),
    cartBtn: card.querySelector('[aria-label="В корзину"]'),
    favBtn: card.querySelector('[aria-label="В избранное"]'),
    cmpBtn: card.querySelector(".model-favorite"),
  }));
  const ids = new Set(products.map((p) => p.id));
  const byId = (id) => products.find((p) => p.id === id);

  let cart = Object.fromEntries(
    Object.entries(store.read("kugoo:cart", {})).filter(
      ([id, q]) => ids.has(id) && q > 0,
    ),
  );
  let favs = store.read("kugoo:favs", []).filter((id) => ids.has(id));
  let cmp = store.read("kugoo:cmp", []).filter((id) => ids.has(id));

  const panel = createPanel();
  const go = (sel) =>
    document.querySelector(sel)?.scrollIntoView({ behavior: "smooth" });
  const flip = (arr, id) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  /* ----- бейджи в шапке ----- */
  const navBtns = {
    cmp: document.querySelector('.navbar-action[aria-label="Сравнение"]'),
    fav: document.querySelector('.navbar-action[aria-label="Избранное"]'),
    cart: document.querySelector(".navbar-cart"),
  };
  const badges = {};
  Object.entries(navBtns).forEach(([key, el]) => {
    if (!el) return;
    const b = document.createElement("span");
    b.className = "badge";
    el.append(b);
    badges[key] = b;
  });

  const mark = (btn, on, aria) => {
    if (!btn) return;
    btn.classList.toggle("is-active", on);
    if (aria) btn.setAttribute("aria-pressed", String(on));
  };

  function sync() {
    store.write("kugoo:cart", cart);
    store.write("kugoo:favs", favs);
    store.write("kugoo:cmp", cmp);
    const nums = {
      cart: Object.values(cart).reduce((a, b) => a + b, 0),
      fav: favs.length,
      cmp: cmp.length,
    };
    Object.entries(badges).forEach(([key, b]) => {
      b.textContent = nums[key];
      b.classList.toggle("is-visible", nums[key] > 0);
    });
    products.forEach((p) => {
      mark(p.cartBtn, !!cart[p.id], false);
      mark(p.favBtn, favs.includes(p.id), true);
      mark(p.cmpBtn, cmp.includes(p.id), true);
    });
    if (panel.isOpen()) panel.refresh();
  }

  /* ----- содержимое панелей ----- */
  const row = (p, extra) =>
    '<div class="p-item" data-id="' +
    p.id +
    '">' +
    '<img src="' +
    esc(p.img) +
    '" alt="">' +
    '<div class="p-info"><div class="p-title">' +
    esc(p.title) +
    "</div>" +
    '<div class="p-price">' +
    fmtPrice(p.price) +
    "</div>" +
    extra +
    "</div></div>";
  const empty = (text) =>
    '<p class="p-empty">' +
    text +
    "</p>" +
    '<button class="button p-btn" type="button" data-act="models">К моделям</button>';

  const views = {
    cart: () => {
      const list = Object.keys(cart).map(byId);
      if (!list.length) return empty("Корзина пуста");
      const total = list.reduce((s, p) => s + p.price * cart[p.id], 0);
      return (
        list
          .map((p) =>
            row(
              p,
              '<div class="p-qty">' +
                '<button type="button" data-act="dec" aria-label="Меньше">−</button>' +
                "<span>" +
                cart[p.id] +
                "</span>" +
                '<button type="button" data-act="inc" aria-label="Больше">+</button>' +
                '<button type="button" class="p-link" data-act="rm-cart">Удалить</button></div>',
            ),
          )
          .join("") +
        '<div class="p-total"><span>Итого</span><strong>' +
        fmtPrice(total) +
        "</strong></div>" +
        '<button class="button p-btn" type="button" data-act="checkout">Оформить заказ</button>'
      );
    },
    fav: () => {
      if (!favs.length) return empty("В избранном пока пусто");
      return favs
        .map(byId)
        .map((p) =>
          row(
            p,
            '<div class="p-qty"><button type="button" class="p-link" data-act="tocart">В корзину</button>' +
              '<button type="button" class="p-link" data-act="rm-fav">Убрать</button></div>',
          ),
        )
        .join("");
    },
    cmp: () => {
      if (!cmp.length) return empty("Добавьте модели к сравнению");
      return cmp
        .map(byId)
        .map((p) =>
          row(
            p,
            '<div class="p-specs">' +
              esc(p.specs) +
              "</div>" +
              '<div class="p-qty"><button type="button" class="p-link" data-act="tocart">В корзину</button>' +
              '<button type="button" class="p-link" data-act="rm-cmp">Убрать</button></div>',
          ),
        )
        .join("");
    },
    checkout: () => {
      const total = Object.keys(cart).reduce(
        (s, id) => s + byId(id).price * cart[id],
        0,
      );
      return (
        '<form class="p-checkout"><p>Сумма заказа: <strong>' +
        fmtPrice(total) +
        "</strong>. Оставьте телефон — менеджер свяжется для подтверждения.</p>" +
        '<label class="visually-hidden" for="checkout-phone">Номер телефона</label>' +
        '<input id="checkout-phone" class="cta-input phone-mask" type="tel" inputmode="numeric" ' +
        'autocomplete="tel" required placeholder="+7 (___) ___ - __ - __">' +
        '<button class="button p-btn" type="submit">Отправить заказ</button></form>'
      );
    },
    done: () =>
      '<p class="p-empty">Спасибо! Заказ принят — мы скоро перезвоним.</p>' +
      '<button class="button p-btn" type="button" data-act="models">Продолжить покупки</button>',
  };
  const titles = { cart: "Корзина", fav: "Избранное", cmp: "Сравнение" };

  Object.entries(navBtns).forEach(([key, el]) => {
    el?.addEventListener("click", (e) => {
      e.preventDefault();
      panel.open(titles[key], views[key]);
    });
  });

  panel.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const id = btn.closest("[data-id]")?.dataset.id;
    switch (btn.dataset.act) {
      case "inc":
        cart[id]++;
        break;
      case "dec":
        cart[id]--;
        if (cart[id] <= 0) delete cart[id];
        break;
      case "rm-cart":
        delete cart[id];
        break;
      case "rm-fav":
        favs = favs.filter((x) => x !== id);
        break;
      case "rm-cmp":
        cmp = cmp.filter((x) => x !== id);
        break;
      case "tocart":
        cart[id] = (cart[id] || 0) + 1;
        showToast("Добавлено в корзину");
        break;
      case "checkout":
        panel.open("Оформление заказа", views.checkout);
        return;
      case "models":
        panel.close();
        go("#models");
        return;
      case "callback":
        panel.close();
        document.querySelector('a[href="#test-drive"]')?.click();
        return;
    }
    sync();
  });

  panel.body.addEventListener("submit", (e) => {
    e.preventDefault();
    cart = {};
    panel.open("Заказ принят", views.done);
    sync();
  });

  /* ----- кнопки на карточках ----- */
  products.forEach((p) => {
    p.cartBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      cart[p.id] = (cart[p.id] || 0) + 1;
      showToast("«" + p.title + "» добавлен в корзину");
      p.cartBtn.classList.add("is-pop");
      setTimeout(() => p.cartBtn.classList.remove("is-pop"), 400);
      sync();
    });
    p.favBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      favs = flip(favs, p.id);
      showToast(
        favs.includes(p.id) ? "Добавлено в избранное" : "Убрано из избранного",
      );
      sync();
    });
    p.cmpBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      cmp = flip(cmp, p.id);
      showToast(
        cmp.includes(p.id) ? "Добавлено к сравнению" : "Убрано из сравнения",
      );
      sync();
    });
  });

  /* ----- поиск по моделям ----- */
  const form = document.querySelector(".search-form");
  const input = document.getElementById("search-q");
  const grid = document.querySelector(".models-grid");
  if (form && input && grid) {
    const emptyMsg = document.createElement("p");
    emptyMsg.className = "models-empty";
    emptyMsg.textContent = "По вашему запросу ничего не найдено";
    emptyMsg.hidden = true;
    grid.after(emptyMsg);

    const filter = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      products.forEach((p) => {
        const ok = !q || (p.title + " " + p.specs).toLowerCase().includes(q);
        p.card.hidden = !ok;
        if (ok) shown++;
      });
      emptyMsg.hidden = shown > 0;
    };
    input.addEventListener("input", filter);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      filter();
      go("#models");
    });
  }

  /* ----- ссылки-заглушки (href="#") открывают информационную панель ----- */
  const openInfo = (title) =>
    panel.open(
      title,
      () =>
        '<p class="p-empty">Этот раздел скоро появится. Подробности можно уточнить по телефону ' +
        '<a href="tel:+78005055461">+7 (800) 505-54-61</a>.</p>' +
        '<button class="button p-btn" type="button" data-act="callback">Заказать звонок</button>',
    );
  document.querySelectorAll('a[href="#"]').forEach((a) => {
    if (a.closest(".model-action, .navbar-action")) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      openInfo(
        a.textContent.trim() ||
          a.getAttribute("aria-label") ||
          a.querySelector("img")?.alt ||
          "Скоро",
      );
    });
  });

  sync();
  return { isOpen: panel.isOpen, closePanel: panel.close };
}

/* ---------- кнопка «Каталог»: прокрутка к моделям с подсветкой ---------- */

function initCatalogButton() {
  const btn = document.querySelector(".catalog-button");
  const target = document.getElementById("models");
  if (!btn || !target) return;

  btn.addEventListener("click", () => {
    // сбрасываем фильтр поиска, чтобы каталог показывался целиком
    const search = document.getElementById("search-q");
    if (search && search.value) {
      search.value = "";
      search.dispatchEvent(new Event("input"));
    }
    target.scrollIntoView({ behavior: "smooth" });
    const grid = target.querySelector(".models-grid");
    if (grid) {
      grid.classList.remove("is-highlight");
      void grid.offsetWidth; // перезапуск анимации
      grid.classList.add("is-highlight");
      setTimeout(() => grid.classList.remove("is-highlight"), 1200);
    }
  });
}

/* ---------- init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const menu = initMobileMenu();
  const modal = initModal();

  initForms(modal);
  initEffects();
  const shop = initShop();
  initCatalogButton();
  document.querySelectorAll(".phone-mask").forEach(initPhoneMask);

  // один обработчик Escape на всё
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (shop && shop.isOpen()) return shop.closePanel();
    if (menu) menu.closeMenu();
    if (modal) modal.closeModal();
  });
});
