/* PULPO — Demo del dashboard con datos simulados (autocontenido, sin backend) */
(function () {
  "use strict";

  /* ── Config de severidad / tipos ─────────────────────────── */
  var SEV = {
    CRITICA: { color: "#f85149", label: "Crítica", badge: "b-critica" },
    ALTA:    { color: "#d29922", label: "Alta",    badge: "b-alta"    },
    MEDIA:   { color: "#58a6ff", label: "Media",   badge: "b-media"   },
    BAJA:    { color: "#6e7681", label: "Baja",    badge: "b-baja"    }
  };
  var SEV_ORDER = ["CRITICA", "ALTA", "MEDIA", "BAJA"];

  /* ── Catálogo de reglas (IDs reales del motor PULPO) ─────── */
  var RULES = [
    { regla: "SSH_BRUTEFORCE", tipo: "BLOQUEO", sev: "ALTA",    dur: 300, w: 7 },
    { regla: "ROOT_LOGIN",     tipo: "BLOQUEO", sev: "CRITICA", dur: 600, w: 3 },
    { regla: "INVALID_USER",   tipo: "ALERTA",  sev: "BAJA",    dur: 0,   w: 8 },
    { regla: "HTTP_FLOOD",     tipo: "BLOQUEO", sev: "ALTA",    dur: 300, w: 5 },
    { regla: "SQL_INJECTION",  tipo: "BLOQUEO", sev: "CRITICA", dur: 600, w: 4 },
    { regla: "XSS_ATTEMPT",    tipo: "ALERTA",  sev: "ALTA",    dur: 0,   w: 5 },
    { regla: "PATH_TRAVERSAL", tipo: "ALERTA",  sev: "ALTA",    dur: 0,   w: 4 },
    { regla: "CMD_INJECTION",  tipo: "BLOQUEO", sev: "CRITICA", dur: 600, w: 2 },
    { regla: "WEB_SCAN_404",   tipo: "ALERTA",  sev: "MEDIA",   dur: 0,   w: 7 },
    { regla: "SCANNER_UA",     tipo: "ALERTA",  sev: "BAJA",    dur: 0,   w: 6 },
    { regla: "SENSITIVE_FILE", tipo: "ALERTA",  sev: "MEDIA",   dur: 0,   w: 4 },
    { regla: "FILE_UPLOAD",    tipo: "ALERTA",  sev: "MEDIA",   dur: 0,   w: 3 }
  ];
  var RULE_BAG = [];
  RULES.forEach(function (r) { for (var i = 0; i < r.w; i++) RULE_BAG.push(r); });

  /* ── IPs origen + threat intel asociado (país / AbuseIPDB / VirusTotal) ──
     Las privadas (192.168/10.x) no se enriquecen → pais:null. */
  var IP_INTEL = {
    "203.0.113.42":   { pais: "US", abuse: 12,  vt: 0 },
    "203.0.113.77":   { pais: "US", abuse: 0,   vt: 0 },
    "198.51.100.7":   { pais: "GB", abuse: 34,  vt: 1 },
    "198.51.100.23":  { pais: "GB", abuse: 0,   vt: 0 },
    "45.79.12.6":     { pais: "US", abuse: 28,  vt: 2 },
    "45.137.21.90":   { pais: "NL", abuse: 88,  vt: 5 },
    "185.220.101.4":  { pais: "DE", abuse: 100, vt: 9 },
    "185.220.101.34": { pais: "DE", abuse: 100, vt: 7 },
    "192.168.56.102": { pais: null, abuse: 0,   vt: 0 },
    "10.0.4.18":      { pais: null, abuse: 0,   vt: 0 },
    "91.219.236.18":  { pais: "RU", abuse: 76,  vt: 4 },
    "146.70.99.2":    { pais: "RO", abuse: 41,  vt: 1 },
    "5.188.206.14":   { pais: "RU", abuse: 93,  vt: 6 },
    "194.165.16.71":  { pais: "SE", abuse: 100, vt: 8 }
  };
  var IPS = Object.keys(IP_INTEL);

  function rand(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rand(a.length)]; }

  // Banderas en SVG inline (Windows no renderiza los emoji de bandera → mostraría
  // solo las 2 letras). Mismo conjunto de países que IP_INTEL.
  var FV = ' class="flag-svg" preserveAspectRatio="none"';
  var FLAGS = {
    US: '<svg' + FV + ' viewBox="0 0 19 10"><rect width="19" height="10" fill="#B22234"/>' +
        '<g fill="#fff"><rect y="0.77" width="19" height="0.77"/><rect y="2.31" width="19" height="0.77"/>' +
        '<rect y="3.85" width="19" height="0.77"/><rect y="5.38" width="19" height="0.77"/>' +
        '<rect y="6.92" width="19" height="0.77"/><rect y="8.46" width="19" height="0.77"/></g>' +
        '<rect width="7.6" height="5.38" fill="#3C3B6E"/></svg>',
    GB: '<svg' + FV + ' viewBox="0 0 60 30"><rect width="60" height="30" fill="#012169"/>' +
        '<path d="M0 0L60 30M60 0L0 30" stroke="#fff" stroke-width="6"/>' +
        '<path d="M0 0L60 30M60 0L0 30" stroke="#C8102E" stroke-width="3"/>' +
        '<path d="M30 0V30M0 15H60" stroke="#fff" stroke-width="10"/>' +
        '<path d="M30 0V30M0 15H60" stroke="#C8102E" stroke-width="6"/></svg>',
    DE: '<svg' + FV + ' viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/>' +
        '<rect width="5" height="1" y="1" fill="#D00"/><rect width="5" height="1" y="2" fill="#FFCE00"/></svg>',
    NL: '<svg' + FV + ' viewBox="0 0 9 6"><rect width="9" height="2" fill="#AE1C28"/>' +
        '<rect width="9" height="2" y="2" fill="#fff"/><rect width="9" height="2" y="4" fill="#21468B"/></svg>',
    RU: '<svg' + FV + ' viewBox="0 0 9 6"><rect width="9" height="2" fill="#fff"/>' +
        '<rect width="9" height="2" y="2" fill="#0039A6"/><rect width="9" height="2" y="4" fill="#D52B1E"/></svg>',
    RO: '<svg' + FV + ' viewBox="0 0 3 2"><rect width="1" height="2" fill="#002B7F"/>' +
        '<rect width="1" height="2" x="1" fill="#FCD116"/><rect width="1" height="2" x="2" fill="#CE1126"/></svg>',
    SE: '<svg' + FV + ' viewBox="0 0 16 10"><rect width="16" height="10" fill="#006AA7"/>' +
        '<rect x="5" width="2" height="10" fill="#FECC00"/><rect y="4" width="16" height="2" fill="#FECC00"/></svg>'
  };
  function flagSvg(cc) { return cc ? (FLAGS[cc.toUpperCase()] || "") : ""; }
  // Tramo de color del abuse_score (AbuseIPDB 0–100).
  function abuseClass(score) {
    if (score >= 75) return "b-abuse-high";
    if (score >= 25) return "b-abuse-med";
    return "b-abuse-low";
  }

  function fmtTs(d) {
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  var uid = 1;
  function makeAlert(date) {
    var r = pick(RULE_BAG);
    var ip = pick(IPS);
    var intel = IP_INTEL[ip] || { pais: null, abuse: 0, vt: 0 };
    return {
      id: uid++,
      ts: date,
      timestamp: fmtTs(date),
      tipo: r.tipo,
      regla: r.regla,
      ip: ip,
      severidad: r.sev,
      duracion: r.dur,
      pais: intel.pais,
      abuse_score: intel.abuse,
      vt_malicious: intel.vt
    };
  }

  /* ── Estado ──────────────────────────────────────────────── */
  var alerts = [];           // más reciente primero
  var blocked = new Map();   // ip -> { rule, hits, last }
  var filterTipo = "ALL", filterSev = "ALL", query = "";
  var filtersOpen = false;

  // Semilla: ~26 eventos repartidos en los últimos 30 min
  (function seed() {
    var now = Date.now();
    var seedDates = [];
    for (var i = 0; i < 26; i++) seedDates.push(new Date(now - rand(30 * 60000)));
    seedDates.sort(function (a, b) { return a - b; });   // antiguos primero para asignar ids crecientes
    seedDates.forEach(function (d) {
      var a = makeAlert(d);
      alerts.unshift(a);
      if (a.tipo === "BLOQUEO") registerBlock(a);
    });
  })();

  function registerBlock(a) {
    var e = blocked.get(a.ip);
    if (e) { e.hits++; e.last = a.ts; e.rule = a.regla; }
    else blocked.set(a.ip, { rule: a.regla, hits: 1, last: a.ts });
  }

  /* ── Filtro ──────────────────────────────────────────────── */
  function visibleAlerts() {
    var q = query.toLowerCase();
    return alerts.filter(function (a) {
      if (filterTipo !== "ALL" && a.tipo !== filterTipo) return false;
      if (filterSev !== "ALL" && a.severidad !== filterSev) return false;
      if (q && a.regla.toLowerCase().indexOf(q) < 0 && a.ip.indexOf(q) < 0) return false;
      return true;
    });
  }
  function activeCount() {
    return (filterTipo !== "ALL" ? 1 : 0) + (filterSev !== "ALL" ? 1 : 0) + (query ? 1 : 0);
  }

  /* ── Render: pipeline ────────────────────────────────────── */
  function renderPipeline() {
    var last = alerts[0];
    var active = !last ? "ingesta" : (last.tipo === "BLOQUEO" ? "respuesta" : "alertas");
    document.querySelectorAll("#pipeline .pipeline-stage").forEach(function (el) {
      el.classList.toggle("pipeline-stage--active", el.getAttribute("data-stage") === active);
    });
  }

  /* ── Render: stats ───────────────────────────────────────── */
  function renderStats() {
    var s = { total: alerts.length, bloqueos: 0, alertas: 0, CRITICA: 0, ALTA: 0, MEDIA: 0, BAJA: 0 };
    alerts.forEach(function (a) {
      if (a.tipo === "BLOQUEO") s.bloqueos++; else if (a.tipo === "ALERTA") s.alertas++;
      s[a.severidad]++;
    });
    var cards = [
      ["Total eventos", s.total, "var(--blue)"],
      ["Bloqueos", s.bloqueos, "var(--red)"],
      ["IPs bloqueadas", blocked.size, "var(--purple)"],
      ["Severidad Alta", s.ALTA, "var(--orange)"],
      ["Críticos", s.CRITICA, "var(--red)"],
      ["Alertas", s.alertas, "var(--blue)"]
    ];
    document.getElementById("stats").innerHTML = cards.map(function (c) {
      return '<div class="stat-card" style="--card-color:' + c[2] + '">' +
        '<span class="stat-value">' + c[1].toLocaleString("es-ES") + '</span>' +
        '<span class="stat-label">' + c[0] + '</span></div>';
    }).join("");
  }

  /* ── Render: timeline (área SVG) ─────────────────────────── */
  function renderTimeline() {
    var now = Date.now(), W = 30;
    var buckets = new Array(W).fill(0);
    alerts.forEach(function (a) {
      var age = (now - a.ts.getTime()) / 60000;
      if (age >= 0 && age < W) buckets[W - 1 - Math.floor(age)]++;
    });
    var max = Math.max(1, Math.max.apply(null, buckets));
    var vw = 300, vh = 90, pad = 6;
    function X(i) { return pad + (i / (W - 1)) * (vw - 2 * pad); }
    function Y(v) { return vh - pad - (v / max) * (vh - 2 * pad); }
    var line = "", area = "";
    buckets.forEach(function (v, i) {
      var x = X(i).toFixed(1), y = Y(v).toFixed(1);
      line += (i === 0 ? "M" : "L") + x + " " + y + " ";
    });
    area = line + "L" + X(W - 1).toFixed(1) + " " + (vh - pad) + " L" + X(0).toFixed(1) + " " + (vh - pad) + " Z";
    document.getElementById("chartTimeline").innerHTML =
      '<svg viewBox="0 0 ' + vw + ' ' + vh + '" preserveAspectRatio="none" style="width:100%;height:100%;display:block">' +
        '<defs><linearGradient id="tlg" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#58a6ff" stop-opacity="0.28"/>' +
        '<stop offset="100%" stop-color="#58a6ff" stop-opacity="0"/></linearGradient></defs>' +
        '<path d="' + area + '" fill="url(#tlg)"/>' +
        '<path d="' + line + '" fill="none" stroke="#58a6ff" stroke-width="1.6" vector-effect="non-scaling-stroke"/>' +
      '</svg>';
  }

  /* ── Render: donut severidad ─────────────────────────────── */
  function renderDonut() {
    var counts = { CRITICA: 0, ALTA: 0, MEDIA: 0, BAJA: 0 }, total = 0;
    alerts.forEach(function (a) { counts[a.severidad]++; total++; });
    var r = 38, cx = 52, cy = 52, sw = 14, C = 2 * Math.PI * r;
    var segs = "", off = 0;
    SEV_ORDER.forEach(function (k) {
      if (!counts[k]) return;
      var len = (counts[k] / total) * C;
      var gap = total > 0 ? 2 : 0;
      segs += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + SEV[k].color +
        '" stroke-width="' + sw + '" stroke-dasharray="' + Math.max(0, len - gap).toFixed(2) + " " +
        (C - Math.max(0, len - gap)).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>';
      off += len;
    });
    var legend = SEV_ORDER.filter(function (k) { return counts[k]; }).map(function (k) {
      return '<div class="donut-leg-row"><span class="donut-leg-dot" style="background:' + SEV[k].color +
        '"></span><span class="donut-leg-name">' + SEV[k].label + '</span>' +
        '<span class="donut-leg-val">' + counts[k] + '</span></div>';
    }).join("");
    document.getElementById("chartDonut").innerHTML =
      '<div class="donut-wrap" style="width:104px;height:104px">' +
        '<svg width="104" height="104" viewBox="0 0 104 104" style="transform:rotate(-90deg)">' +
        '<circle cx="52" cy="52" r="38" fill="none" stroke="#21262d" stroke-width="14"/>' + segs + '</svg>' +
        '<div class="donut-center"><span class="donut-total">' + total + '</span>' +
        '<span class="donut-label">total</span></div></div>' +
      '<div class="donut-legend">' + legend + '</div>';
  }

  /* ── Render: top reglas ──────────────────────────────────── */
  function renderRules() {
    var m = {};
    alerts.forEach(function (a) { m[a.regla] = (m[a.regla] || 0) + 1; });
    var sorted = Object.keys(m).map(function (k) { return [k, m[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
    var max = sorted.length ? sorted[0][1] : 1;
    document.getElementById("chartRules").innerHTML = sorted.map(function (e) {
      var pct = Math.round((e[1] / max) * 100);
      return '<div class="rule-bar-row"><span class="rule-bar-name" title="' + e[0] + '">' + e[0] + '</span>' +
        '<div class="rule-bar-track"><div class="rule-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="rule-bar-count">' + e[1] + '</span></div>';
    }).join("");
  }

  /* ── Render: tabla de eventos ────────────────────────────── */
  // Celda "Riesgo": badge de abuse + (opcional) badge de VirusTotal, o "—".
  function threatCell(a) {
    var hasScore = a.abuse_score != null && a.abuse_score > 0;
    var hasVt = a.vt_malicious != null && a.vt_malicious > 0;
    if (!hasScore && !hasVt) return '<span class="cell-empty">—</span>';
    var html = '<span class="intel-group">';
    if (hasScore) {
      html += '<span class="badge ' + abuseClass(a.abuse_score) + '" title="AbuseIPDB ' + a.abuse_score +
        '/100"><span class="dot"></span>' + a.abuse_score + "</span>";
    }
    if (hasVt) {
      html += '<span class="badge b-vt" title="VirusTotal: ' + a.vt_malicious + ' motores maliciosos">VT ' +
        a.vt_malicious + "</span>";
    }
    return html + "</span>";
  }

  function renderFeed(freshId) {
    var vis = visibleAlerts();
    document.getElementById("feedVisible").textContent = vis.length;
    document.getElementById("feedTotal").textContent = alerts.length;
    var body = document.getElementById("feedBody");
    if (!vis.length) {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-faint);font-style:italic">' +
        (alerts.length ? "Sin eventos que coincidan con el filtro" : "Esperando eventos…") + "</td></tr>";
    } else {
      body.innerHTML = vis.map(function (a) {
        var tcls = a.tipo === "BLOQUEO" ? "b-bloqueo" : "b-alerta";
        var fsvg = flagSvg(a.pais);
        var flag = fsvg ? '<span class="ip-flag" title="' + a.pais + '">' + fsvg + "</span>" : "";
        return '<tr' + (a.id === freshId ? ' class="row-fresh"' : "") + ">" +
          '<td class="cell-ts">' + a.timestamp + "</td>" +
          '<td><span class="badge ' + tcls + '"><span class="dot"></span>' + a.tipo + "</span></td>" +
          '<td class="cell-rule">' + a.regla + "</td>" +
          '<td class="cell-ip">' + flag + a.ip + "</td>" +
          '<td class="cell-intel">' + threatCell(a) + "</td>" +
          '<td><span class="badge ' + SEV[a.severidad].badge + '">' + a.severidad + "</span></td>" +
          '<td class="cell-dur">' + (a.duracion ? a.duracion + "s" : "—") + "</td></tr>";
      }).join("");
    }
    // Estado de la barra de filtros
    var ac = activeCount();
    var fbCount = document.getElementById("fbCount");
    fbCount.textContent = ac; fbCount.hidden = ac === 0;
    document.getElementById("btnFilters").classList.toggle("fb-toggle--on", ac > 0);
    document.getElementById("fbClear").disabled = ac === 0;
  }

  /* ── Render: IPs bloqueadas ──────────────────────────────── */
  function renderBlocked() {
    document.getElementById("ipCount").textContent = blocked.size;
    var panel = document.getElementById("ipPanel");
    if (!blocked.size) {
      panel.innerHTML = '<div class="empty-state"><div class="empty-ring">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v5c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V6z"/></svg>' +
        '</div><h4>Sin bloqueos activos</h4><p>Las direcciones bloqueadas por el motor aparecerán aquí en tiempo real.</p></div>';
      return;
    }
    var rows = Array.from(blocked.entries()).sort(function (a, b) { return b[1].last - a[1].last; }).slice(0, 12);
    panel.className = "ip-list";
    panel.innerHTML = rows.map(function (e) {
      var ip = e[0], d = e[1];
      return '<div class="ip-row"><span class="pulse-dot" style="background:var(--red);--ring-color:rgba(248,81,73,0.6)"></span>' +
        '<span class="ip-addr">' + ip + '</span><div class="ip-meta">' +
        '<span class="ip-rule">' + d.rule + '</span>' +
        '<span class="ip-hits">' + d.hits + " hit" + (d.hits > 1 ? "s" : "") + "</span></div></div>";
    }).join("");
  }

  function renderAll(freshId) {
    renderPipeline(); renderStats(); renderTimeline();
    renderDonut(); renderRules(); renderFeed(freshId); renderBlocked();
  }

  /* ── Toast ───────────────────────────────────────────────── */
  var toastEl = document.getElementById("demoToast"), toastT = null;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ── Interacciones ───────────────────────────────────────── */
  // Segmentos de filtro
  document.querySelectorAll(".segment").forEach(function (seg) {
    seg.addEventListener("click", function (e) {
      var btn = e.target.closest(".seg-btn"); if (!btn) return;
      seg.querySelectorAll(".seg-btn").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      var val = btn.getAttribute("data-val");
      if (seg.getAttribute("data-seg") === "tipo") filterTipo = val; else filterSev = val;
      renderFeed(null);
    });
  });
  // Búsqueda
  var search = document.getElementById("fbSearch"), searchX = document.getElementById("fbSearchX");
  search.addEventListener("input", function () {
    query = search.value.trim(); searchX.hidden = !search.value; renderFeed(null);
  });
  searchX.addEventListener("click", function () {
    search.value = ""; query = ""; searchX.hidden = true; renderFeed(null); search.focus();
  });
  // Toggle filtros
  document.getElementById("btnFilters").addEventListener("click", function () {
    filtersOpen = !filtersOpen;
    document.getElementById("filterbar").hidden = !filtersOpen;
  });
  // Limpiar filtros
  document.getElementById("fbClear").addEventListener("click", function () {
    filterTipo = "ALL"; filterSev = "ALL"; query = "";
    search.value = ""; searchX.hidden = true;
    document.querySelectorAll(".segment").forEach(function (seg) {
      seg.querySelectorAll(".seg-btn").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-val") === "ALL" ? "true" : "false");
      });
    });
    renderFeed(null);
  });
  // Exportar CSV
  document.getElementById("btnCsv").addEventListener("click", function () {
    var vis = visibleAlerts();
    var head = "timestamp,tipo,regla,ip,pais,abuse_score,vt_malicious,severidad,duracion\n";
    var rows = vis.map(function (a) {
      return '"' + a.timestamp + '","' + a.tipo + '","' + a.regla + '","' + a.ip + '","' +
        (a.pais || "") + '","' + (a.abuse_score || "") + '","' + (a.vt_malicious || "") + '","' +
        a.severidad + '","' + (a.duracion || "") + '"';
    }).join("\n");
    var blob = new Blob([head + rows], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = "alertas_demo.csv"; link.click();
    URL.revokeObjectURL(url);
    toast("Exportadas " + vis.length + " alertas a CSV");
  });
  // Limpiar historial
  document.getElementById("btnClear").addEventListener("click", function () {
    alerts = []; blocked.clear(); renderAll(null); toast("Historial limpiado — el motor sigue escuchando");
  });
  // Cambiar fichero (demo)
  document.getElementById("btnSwap").addEventListener("click", function () {
    toast("Demo: el fichero de origen es fijo (/opt/LogClassifier/alertas.log)");
  });

  /* ── Streaming de eventos simulados ──────────────────────── */
  renderAll(null);
  setInterval(function () {
    var a = makeAlert(new Date());
    alerts.unshift(a);
    if (alerts.length > 80) alerts.pop();
    if (a.tipo === "BLOQUEO") registerBlock(a);
    renderAll(a.id);
  }, 3200);
})();
