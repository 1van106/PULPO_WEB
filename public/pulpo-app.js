/* PULPO landing — interacciones (vanilla JS) */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  var burger = document.getElementById("navBurger");
  var links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
      burger.textContent = open ? "✕" : "☰";
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        burger.textContent = "☰";
      }
    });
  }

  /* ---------- Count-up metrics ----------
     El HTML ya muestra los valores finales; solo animamos (0 → valor)
     cuando el observer confirma que la sección es visible. Si
     IntersectionObserver no dispara, los valores quedan correctos. */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var dur = 1200;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }

  var counted = false;
  var metricsEl = document.querySelector(".metrics");
  if (metricsEl && "IntersectionObserver" in window && !reduceMotion) {
    var mo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !counted) {
          counted = true;
          document.querySelectorAll("[data-count]").forEach(countUp);
          mo.disconnect();
        }
      });
    }, { threshold: 0.4 });
    mo.observe(metricsEl);
  }

  /* ---------- Reveal on scroll ----------
     El estado oculto (.pre) se añade solo aquí (progressive enhancement)
     y un temporizador de seguridad fuerza la revelación si el observer
     nunca dispara (p. ej. iframes con IO inerte). */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          ro.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) {
      el.classList.add("pre");
      ro.observe(el);
    });
    setTimeout(function () {
      reveals.forEach(function (el) {
        el.classList.add("in");
        /* Si el reloj de animaciones está congelado (iframes), quitar .pre
           muestra el elemento al instante sin depender de la transición */
        el.classList.remove("pre");
      });
    }, 1500);
  }

  /* ---------- Billing toggle ---------- */
  var sw = document.getElementById("billingSwitch");
  var lblM = document.getElementById("lblMonthly");
  var lblA = document.getElementById("lblAnnual");
  function setBilling(annual) {
    sw.setAttribute("aria-checked", String(annual));
    sw.setAttribute("aria-label", annual ? "Cambiar a facturación mensual" : "Cambiar a facturación anual");
    if (lblM) lblM.classList.toggle("on", !annual);
    if (lblA) lblA.classList.toggle("on", annual);
    document.querySelectorAll(".price-num").forEach(function (el) {
      el.textContent = el.getAttribute(annual ? "data-annual" : "data-monthly");
    });
    document.querySelectorAll(".plan-billnote[data-monthly]").forEach(function (el) {
      el.textContent = el.getAttribute(annual ? "data-annual" : "data-monthly");
    });
  }
  if (sw) {
    sw.addEventListener("click", function () {
      setBilling(sw.getAttribute("aria-checked") !== "true");
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    btn.addEventListener("click", function () {
      var open = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", String(!open));
      btn.setAttribute("aria-expanded", String(!open));
    });
  });
})();
