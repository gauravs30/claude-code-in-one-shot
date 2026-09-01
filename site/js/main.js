/* ==========================================================================
   Portfolio — Phase 1 behavior: theme toggle + render projects from JSON.
   No dependencies. Loaded with `defer`.
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.PORTFOLIO_CONFIG || { DATA_URL: "/data/projects.json", features: {} };

  /* --- theme toggle: auto -> light -> dark -> auto, persisted ----------- */
  var root = document.documentElement;
  var STORE_KEY = "portfolio-theme";
  var order = ["auto", "light", "dark"];

  try {
    var saved = localStorage.getItem(STORE_KEY);
    if (saved && order.indexOf(saved) !== -1) root.setAttribute("data-theme", saved);
  } catch (e) { /* private mode / disabled storage */ }

  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var cur = root.getAttribute("data-theme") || "auto";
      var next = order[(order.indexOf(cur) + 1) % order.length];
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(STORE_KEY, next); } catch (e) {}
      toggle.setAttribute("title", "Theme: " + next);
    });
  }

  /* --- footer year & résumé link -------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var resume = document.getElementById("resume-link");
  if (resume) {
    fetch(resume.getAttribute("href"), { method: "HEAD" })
      .then(function (r) { if (r.ok) resume.hidden = false; })
      .catch(function () { /* no résumé file — leave hidden */ });
  }

  /* --- projects ------------------------------------------------------- */
  var grid = document.getElementById("projects-grid");
  var meta = document.getElementById("projects-meta");
  if (!grid) return;

  fetch(CONFIG.DATA_URL, { headers: { Accept: "application/json" } })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      var projects = (data && data.projects) || [];
      if (!projects.length) {
        grid.innerHTML = '<p class="projects-grid__error">No projects to show yet.</p>';
        return;
      }
      grid.innerHTML = "";
      projects.forEach(function (p) { grid.appendChild(renderCard(p)); });

      if (meta && data.generatedAt) {
        var d = new Date(data.generatedAt);
        meta.textContent =
          "Synced from GitHub on " + d.toISOString().slice(0, 10) + " · " + projects.length + " projects";
      }
    })
    .catch(function (err) {
      grid.innerHTML =
        '<p class="projects-grid__error">Couldn\'t load projects (' +
        String(err.message) +
        '). See <a href="https://github.com/gauravs30">github.com/gauravs30</a>.</p>';
    });

  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderCard(p) {
    var card = el("article", "card" + (p.featured ? " card--featured" : ""));

    var head = el("div", "card__head");
    head.appendChild(el("h3", "card__title", p.name || "Untitled"));
    if (p.featured) head.appendChild(el("span", "card__badge", "Featured"));
    card.appendChild(head);

    if (p.description) card.appendChild(el("p", "card__desc", p.description));

    var tags = (p.tags && p.tags.length ? p.tags : p.topics) || [];
    if (tags.length) {
      var tagWrap = el("div", "card__tags");
      tags.slice(0, 6).forEach(function (t) { tagWrap.appendChild(el("span", "tag", t)); });
      card.appendChild(tagWrap);
    }

    var metaRow = el("div", "card__meta");
    if (p.language) metaRow.appendChild(el("span", null, p.language));
    if (typeof p.stars === "number" && p.stars > 0) metaRow.appendChild(el("span", null, "★ " + p.stars));
    if (p.pushed_at) metaRow.appendChild(el("span", null, "updated " + String(p.pushed_at).slice(0, 10)));
    if (metaRow.childNodes.length) card.appendChild(metaRow);

    var links = el("div", "card__links");
    if (p.url) {
      var repo = el("a", null, "Repository →");
      repo.href = p.url; repo.target = "_blank"; repo.rel = "noopener";
      links.appendChild(repo);
    }
    if (p.homepage) {
      var live = el("a", null, "Live demo →");
      live.href = p.homepage; live.target = "_blank"; live.rel = "noopener";
      links.appendChild(live);
    }
    if (links.childNodes.length) card.appendChild(links);

    return card;
  }
})();
