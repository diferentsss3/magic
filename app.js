(function () {
  "use strict";

  // Цвета заглушек, пока у блюда нет фото: [внешний круг, основа, сердцевина]
  var INK = "#1B1B1B";
  var LOOKS = {
    rolls: [
      [INK, "#F08A6B", "#8DBB6A"],
      [INK, "#E6A15A", "#8DBB6A"],
      ["#7B3F34", "#C98A4B", "#3A2A22"],
      [INK, "#C2403A", "#8DBB6A"],
      [INK, "#8DBB6A", "#F3F1EA"]
    ],
    sets: [
      ["#D0352E", "#F3F1EA", INK],
      ["#D0352E", "#F08A6B", INK],
      ["#7B3F34", "#E6A15A", "#F3F1EA"]
    ],
    sushi: [
      ["#F08A6B", "#F3F1EA", "#F08A6B"],
      ["#7B3F34", "#F3F1EA", "#3A2A22"],
      [INK, "#F3F1EA", "#E6A15A"],
      ["#F5B79A", "#F3F1EA", "#F5B79A"]
    ],
    hot: [
      ["#7B3F34", "#E6A15A", "#F3F1EA"],
      [INK, "#E6A15A", "#8DBB6A"],
      ["#7B3F34", "#F3F1EA", "#8DBB6A"]
    ],
    drinks: [
      ["#8DBB6A", "#F3F1EA", "#8DBB6A"],
      ["#C2403A", "#F3F1EA", "#C2403A"],
      ["#E6C85A", "#F3F1EA", "#E6C85A"]
    ]
  };
  var FALLBACK = [
    [INK, "#F08A6B", "#8DBB6A"],
    ["#D0352E", "#F3F1EA", INK],
    ["#7B3F34", "#E6A15A", "#F3F1EA"]
  ];

  function lookFor(catId, index) {
    var list = LOOKS[catId] || FALLBACK;
    return list[index % list.length];
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(n) {
    return Number(n).toLocaleString("ru-RU") + " ₽";
  }

  function load(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + ": " + r.status);
      return r.json();
    });
  }

  function fillSite(site) {
    document.querySelectorAll("[data-site]").forEach(function (el) {
      var value = site[el.getAttribute("data-site")];
      var box = el.closest("[data-hide-empty]");
      if (!value) {
        // Пустое поле: блок с ним не показываем, пока его не заполнят
        if (box) box.hidden = true;
        return;
      }
      if (/^https?:\/\//i.test(value)) {
        var host = "";
        try { host = new URL(value).hostname.replace(/^www\./, ""); } catch (e) { host = value; }
        var link = document.createElement("a");
        link.href = value;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = /(^|\.)vk\.(com|ru)$/.test(host) ? "ВКонтакте" : host;
        el.textContent = "";
        el.appendChild(link);
      } else {
        el.textContent = value;
      }
    });
    var digits = String(site.phone || "").replace(/[^\d+]/g, "");
    document.querySelectorAll("[data-phone]").forEach(function (el) {
      if (site.phone) el.textContent = site.phone;
    });
    document.querySelectorAll("[data-phone-link]").forEach(function (el) {
      if (digits) el.setAttribute("href", "tel:" + digits);
    });
  }

  function photoBlock(item, catId, index) {
    if (item.photo) {
      var src = String(item.photo).replace(/^\/+/, "");
      return '<img src="' + esc(src) + '" alt="' + esc(item.name) + '" loading="lazy">';
    }
    var look = lookFor(catId, index);
    return (
      '<span class="ph" style="--c1:' + look[0] + ";--c2:" + look[1] + ";--c3:" + look[2] + '">' +
      '<span class="ph__disc"></span>' +
      '<span class="ph__label">Место для фото</span>' +
      "</span>"
    );
  }

  function card(item, catId, index) {
    var meta = [item.desc, item.weight].filter(Boolean).join(" · ");
    return (
      '<article class="card">' +
      '<div class="card__photo">' + photoBlock(item, catId, index) + "</div>" +
      '<div class="card__body">' +
      '<div class="card__row">' +
      '<h3 class="card__name">' + esc(item.name) + "</h3>" +
      '<span class="card__price">' + (item.priceFrom ? "от " : "") + money(item.price) + "</span>" +
      "</div>" +
      '<p class="card__desc">' + esc(meta) + "</p>" +
      "</div>" +
      "</article>"
    );
  }

  function renderMenu(data) {
    var cats = (data && data.categories) || [];
    var html = "";
    var pillHtml = "";
    cats.forEach(function (cat) {
      var items = cat.items || [];
      pillHtml += '<a href="#' + esc(cat.id) + '">' + esc(cat.title) + "</a>";
      html +=
        '<section class="cat" id="' + esc(cat.id) + '">' +
        '<div class="cat__head"><h2 class="cat__title">' + esc(cat.title) + "</h2>" +
        (cat.note ? '<span class="cat__note">' + esc(cat.note) + "</span>" : "") +
        "</div>" +
        '<div class="wave" aria-hidden="true"></div>' +
        '<div class="grid">' +
        items.map(function (item, i) { return card(item, cat.id, i); }).join("") +
        "</div>" +
        "</section>";
    });
    document.getElementById("menu-root").innerHTML = html;
    document.getElementById("pills").innerHTML = pillHtml;
    setupSearch();
  }

  function setupSearch() {
    var input = document.getElementById("search");
    var root = document.getElementById("menu-root");
    if (!input) return;
    var empty = document.createElement("p");
    empty.className = "notice";
    empty.hidden = true;
    empty.textContent = "Ничего не нашли. Попробуйте другое слово.";
    root.appendChild(empty);
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase().replace(/ё/g, "е");
      var shown = 0;
      root.querySelectorAll(".cat").forEach(function (sec) {
        var any = 0;
        sec.querySelectorAll(".card").forEach(function (c) {
          var t = c.textContent.toLowerCase().replace(/ё/g, "е");
          var ok = !q || t.indexOf(q) !== -1;
          c.hidden = !ok;
          if (ok) any++;
        });
        sec.hidden = !any;
        shown += any;
      });
      empty.hidden = shown > 0;
      var pills = document.getElementById("pills");
      if (pills) pills.hidden = !!q;
    });
  }

  function showError(err) {
    var root = document.getElementById("menu-root");
    var local = location.protocol === "file:";
    root.innerHTML =
      '<p class="notice">' +
      (local
        ? "Меню подгружается из файлов, поэтому страницу нужно открывать через сайт или локальный сервер, а не двойным кликом по файлу."
        : "Не удалось загрузить меню. Обновите страницу или попробуйте позже.") +
      "</p>";
    if (window.console) console.error(err);
  }

  Promise.all([load("data/site.json"), load("data/menu.json")])
    .then(function (res) {
      fillSite(res[0] || {});
      renderMenu(res[1]);
    })
    .catch(showError);
})();
