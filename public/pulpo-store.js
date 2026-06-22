/* PULPO storefront — conecta la landing con el backend (checkout, descargas, leads) */
(function () {
  "use strict";

  var API = ""; // mismo origen

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = "toast show" + (kind ? " toast-" + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.className = "toast";
    }, 4200);
  }

  function annualSelected() {
    var sw = document.getElementById("billingSwitch");
    return sw && sw.getAttribute("aria-checked") === "true";
  }

  function busy(btn, on, restore) {
    if (!btn) return;
    if (on) {
      btn.dataset.label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Procesando…";
    } else {
      btn.disabled = false;
      btn.textContent = restore || btn.dataset.label || btn.textContent;
    }
  }

  /* ---------- Descarga (Community) ---------- */
  function handleDownload(btn, plan) {
    busy(btn, true);
    fetch(API + "/api/download/" + encodeURIComponent(plan || "community"), { method: "POST" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        busy(btn, false);
        if (data && data.url) {
          toast("Preparando tu descarga de PULPO " + (data.plan || plan) + "…", "ok");
          window.location.href = data.url;
        } else {
          toast(data && data.error ? data.error : "No se pudo iniciar la descarga.", "err");
        }
      })
      .catch(function () { busy(btn, false); toast("Error de red al solicitar la descarga.", "err"); });
  }

  /* ---------- Checkout (Pro) ---------- */
  function handleCheckout(btn, plan) {
    busy(btn, true);
    fetch(API + "/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan || "pro", billing: annualSelected() ? "annual" : "monthly", hosts: 1 })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.url) {
          window.location.href = data.url; // Stripe Checkout (o página demo)
        } else {
          busy(btn, false);
          toast(data && data.error ? data.error : "No se pudo iniciar el checkout.", "err");
        }
      })
      .catch(function () { busy(btn, false); toast("Error de red al iniciar el pago.", "err"); });
  }

  /* ---------- Modal de contacto (Enterprise) ---------- */
  var modal = document.getElementById("contactModal");
  var modalClose = document.getElementById("contactClose");
  var form = document.getElementById("contactForm");
  var formMsg = document.getElementById("contactMsg");
  var lastFocus = null;

  function openModal() {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    var first = modal.querySelector("input, textarea, button");
    if (first) first.focus();
    document.addEventListener("keydown", onEsc);
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", onEsc);
    if (lastFocus) lastFocus.focus();
  }
  function onEsc(e) { if (e.key === "Escape") closeModal(); }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  /* ---------- Lightbox: demo interactiva del dashboard ---------- */
  var lightbox = document.getElementById("demoLightbox");
  var demoClose = document.getElementById("demoClose");
  var demoFrame = document.getElementById("demoFrame");
  var demoFocus = null;
  function onDemoEsc(e) { if (e.key === "Escape") closeDemo(); }
  function openDemo() {
    if (!lightbox) return;
    demoFocus = document.activeElement;
    if (demoFrame) demoFrame.src = "demo.html?v=2"; // siempre una demo fresca
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (demoClose) demoClose.focus();
    document.addEventListener("keydown", onDemoEsc);
  }
  function closeDemo() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (demoFrame) demoFrame.src = "about:blank"; // descarga el iframe y detiene el streaming
    document.removeEventListener("keydown", onDemoEsc);
    if (demoFocus) demoFocus.focus();
  }
  if (demoClose) demoClose.addEventListener("click", closeDemo);
  if (lightbox) lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeDemo(); });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (formMsg) { formMsg.textContent = ""; formMsg.className = "form-msg"; }
      var fd = new FormData(form);
      var payload = {
        name: (fd.get("name") || "").toString().trim(),
        email: (fd.get("email") || "").toString().trim(),
        company: (fd.get("company") || "").toString().trim(),
        hosts: (fd.get("hosts") || "").toString().trim(),
        message: (fd.get("message") || "").toString().trim()
      };
      if (!payload.name || !payload.email) {
        if (formMsg) { formMsg.textContent = "Indica al menos tu nombre y un email válido."; formMsg.className = "form-msg err"; }
        return;
      }
      var submit = document.getElementById("contactSubmit");
      busy(submit, true);
      fetch(API + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
        .then(function (res) {
          busy(submit, false, "Enviar solicitud");
          if (res.ok && res.body && res.body.ok) {
            form.reset();
            if (formMsg) { formMsg.textContent = "¡Recibido! Te contactaremos en menos de 24 h. Ref: " + res.body.ref; formMsg.className = "form-msg ok"; }
            toast("Solicitud enviada. Gracias por tu interés.", "ok");
          } else {
            var err = (res.body && res.body.error) || "No se pudo enviar la solicitud.";
            if (formMsg) { formMsg.textContent = err; formMsg.className = "form-msg err"; }
          }
        })
        .catch(function () {
          busy(submit, false, "Enviar solicitud");
          if (formMsg) { formMsg.textContent = "Error de red. Inténtalo de nuevo."; formMsg.className = "form-msg err"; }
        });
    });
  }

  /* ---------- Delegación de eventos en los CTA ---------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    var plan = btn.getAttribute("data-plan");
    if (action === "download") { e.preventDefault(); handleDownload(btn, plan); }
    else if (action === "checkout") { e.preventDefault(); handleCheckout(btn, plan); }
    else if (action === "contact") { e.preventDefault(); openModal(); }
    else if (action === "demo") { e.preventDefault(); openDemo(); }
  });

  /* ---------- Aviso de retorno de Stripe (?status=) ---------- */
  var params = new URLSearchParams(window.location.search);
  var status = params.get("status");
  if (status === "success") {
    var lic = params.get("license");
    toast(lic ? "¡Pago confirmado! Tu licencia: " + lic : "¡Pago confirmado! Revisa tu email.", "ok");
    history.replaceState({}, "", window.location.pathname + "#precios");
  } else if (status === "cancel") {
    toast("Pago cancelado. Puedes intentarlo cuando quieras.", "err");
    history.replaceState({}, "", window.location.pathname + "#precios");
  }
})();
