/**
 * main.js
 * Mobile nav, smooth-scroll close, and rendering of dynamic
 * content (bio, schedule, media, projects, contact) from content.json.
 *
 * Shared across ALL pages (index.html, bio.html, schedule.html,
 * media.html, projects.html, contact.html). Every render function
 * checks whether its target elements exist before doing anything,
 * so a page only renders the sections it actually contains.
 */

document.addEventListener("DOMContentLoaded", async () => {

  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Navigation must be initialized independently
  // from the content/i18n loading.
  setupNav();
  setupLangSwitch();

  try {
    await I18N.init();

    renderAll();
    I18N.setLang(I18N.getLang());

    document.addEventListener("langchange", renderAll);

  } catch (error) {
    console.error("I18N initialization failed:", error);
  }
});

/* ---------------------------------------------------------------------
   Navigation (mobile menu)
--------------------------------------------------------------------- */
function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primaryNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
}

function setupLangSwitch() {
  document.querySelectorAll(".lang-switch__btn").forEach((btn) => {
    btn.addEventListener("click", () => I18N.setLang(btn.getAttribute("data-lang")));
  });
}

/* ---------------------------------------------------------------------
   Rendering — each function is a no-op if its elements aren't on the page
--------------------------------------------------------------------- */
function renderAll() {
  renderProjectsDetailed("projectsDetailed", "projectsEmpty");
  renderHero();
  renderBioTeaser();
  renderBio();
  renderVenues();
  renderSchedule();
  renderMedia();
  renderProjects("projectsGrid", "projectsEmpty");           // full projects page
  renderProjects("projectsPreviewGrid", "projectsPreviewEmpty", 3); // homepage preview
  renderContact();
}

function renderHero() {
  const eyebrow = document.querySelector('[data-i18n="hero.eyebrow"]');
  const tagline = document.querySelector('[data-i18n="hero.tagline"]');
  if (eyebrow) eyebrow.textContent = I18N.c("hero.eyebrow");
  if (tagline) tagline.textContent = I18N.c("hero.tagline");

  const img = document.getElementById("heroImage");
  if (img) img.alt = I18N.c("hero.image.alt");
}

function renderBioTeaser() {
  const el = document.getElementById("bioTeaser");
  if (!el) return;
  el.textContent = I18N.c("bioTeaser") || "";
}

function renderBio() {
  const el = document.getElementById("bioText");
  if (!el) return;
  const text = I18N.c("bio") || "";
  el.innerHTML = "";
  text.split(/\n\n+/).forEach((para) => {
    if (!para.trim()) return;
    const p = document.createElement("p");
    p.textContent = para.trim();
    el.appendChild(p);
  });
}

function renderVenues() {
  const list = document.getElementById("venuesList");
  if (!list) return;
  const venues = I18N.content?.venuesHighlight || [];
  list.innerHTML = "";
  venues.forEach((v) => {
    const li = document.createElement("li");
    li.textContent = v[I18N.getLang()] || v.en;
    list.appendChild(li);
  });
}

function renderSchedule() {
  const list = document.getElementById("scheduleList");
  const emptyState = document.getElementById("scheduleEmpty");
  if (!list || !emptyState) return;
  const items = I18N.content?.schedule || [];
  list.innerHTML = "";

  if (items.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "schedule-item";

    const date = document.createElement("span");
    date.className = "schedule-item__date";
    date.textContent = item.dateDisplay || item.date || "";

    const title = document.createElement("span");
    title.className = "schedule-item__title";
    title.textContent = pickLang(item.title);

    const venue = document.createElement("span");
    venue.className = "schedule-item__venue";
    venue.textContent = [pickLang(item.venue), pickLang(item.city)].filter(Boolean).join(" — ");

    li.appendChild(date);
    li.appendChild(title);
    li.appendChild(venue);

    if (item.program) {
      const program = document.createElement("span");
      program.className = "schedule-item__program";
      program.textContent = pickLang(item.program);
      li.appendChild(program);
    }

    list.appendChild(li);
  });
}

function renderMedia() {
  const grid = document.getElementById("mediaGrid");
  const emptyState = document.getElementById("mediaEmpty");
  if (!grid || !emptyState) return;
  const items = I18N.content?.media || [];
  grid.innerHTML = "";

  if (items.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "media-card";

    if (item.embedUrl) {
      const frame = document.createElement("div");
      frame.className = "media-card__frame";
      const iframe = document.createElement("iframe");
      iframe.src = item.embedUrl;
      iframe.loading = "lazy";
      iframe.title = pickLang(item.title);
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);
      card.appendChild(frame);
    }

    const body = document.createElement("div");
    body.className = "media-card__body";
    const title = document.createElement("h3");
    title.className = "media-card__title";
    title.textContent = pickLang(item.title);
    const meta = document.createElement("p");
    meta.className = "media-card__meta";
    meta.textContent = pickLang(item.meta);
    body.appendChild(title);
    if (item.meta) body.appendChild(meta);
    card.appendChild(body);

    grid.appendChild(card);
  });
}

/**
 * Renders the projects grid into the given container IDs.
 * @param {string} gridId - id of the grid element
 * @param {string} emptyId - id of the empty-state element
 * @param {number} [limit] - optional max number of items (used for homepage preview)
 */
function renderProjects(gridId, emptyId, limit) {
  const grid = document.getElementById(gridId);
  const emptyState = document.getElementById(emptyId);
  if (!grid || !emptyState) return;

  let items = I18N.content?.projects || [];
  if (limit) items = items.slice(0, limit);
  grid.innerHTML = "";

  if (items.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

items.forEach((item) => {
  const card = document.createElement("a");
  card.className = "project-card";
  card.href = `projects.html#${slugify(item.title?.en || pickLang(item.title))}`;

  const media = document.createElement("div");
  media.className = "project-card__media";

  if (item.image) {
    const img = document.createElement("img");
    img.className = "project-card__image";
    img.src = item.image;
    img.alt = "";
    img.loading = "lazy";
    media.appendChild(img);
  }

  const scrim = document.createElement("div");
  scrim.className = "project-card__scrim";
  media.appendChild(scrim);

  const title = document.createElement("h3");
  title.className = "project-card__title";
  title.textContent = pickLang(item.title);
  media.appendChild(title);

  card.appendChild(media);

  const caption = document.createElement("div");
  caption.className = "project-card__caption";

  const line = document.createElement("span");
  line.className = "project-card__caption-line";
  caption.appendChild(line);

  if (item.cardDescription) {
    const meta = document.createElement("p");
    meta.className = "project-card__meta";
    meta.textContent = pickLang(item.cardDescription);
    caption.appendChild(meta);
  }

  card.appendChild(caption);
  grid.appendChild(card);
});
}

function renderProjectsDetailed(containerId, emptyId) {
  const container = document.getElementById(containerId);
  const emptyState = document.getElementById(emptyId);
  if (!container || !emptyState) return;

  const items = I18N.content?.projects || [];
  container.innerHTML = "";

  if (items.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  items.forEach((item) => {
    const block = document.createElement("article");
    block.className = "project-block";

    const title = document.createElement("h3");
    title.className = "project-block__title";
    title.textContent = pickLang(item.title);
    block.appendChild(title);

    if (item.image) {
      const img = document.createElement("img");
      img.className = "project-block__image";
      img.src = item.image;
      img.alt = "";
      img.loading = "lazy";
      block.appendChild(img);
    }

    const textWrap = document.createElement("div");
    textWrap.className = "project-block__text-wrap";

    if (item.description) {
      const p = document.createElement("p");
      p.className = "project-block__text";
      p.textContent = pickLang(item.description);
      textWrap.appendChild(p);
    }

    if (item.link && item.link.url) {
      const a = document.createElement("a");
      a.className = "text-link";
      a.href = item.link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const span = document.createElement("span");
      span.textContent = pickLang(item.link.label) || "Learn more";
      const line = document.createElement("span");
      line.className = "text-link__line";
      line.setAttribute("aria-hidden", "true");
      a.appendChild(span);
      a.appendChild(line);
      textWrap.appendChild(a);
    }

    block.appendChild(textWrap);
    container.appendChild(block);
  });
}

function renderContact() {
  const el = document.getElementById("contactDetails");
  if (!el) return;
  const contact = I18N.content?.contact || {};
  el.innerHTML = "";

  if (contact.email) {
    const a = document.createElement("a");
    a.className = "contact__email";
    a.href = `mailto:${contact.email}`;
    a.textContent = contact.email;
    el.appendChild(a);
  } else {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = I18N.t("contactEmailFallback");
    el.appendChild(p);
  }

  if (contact.social && contact.social.length) {
    const wrap = document.createElement("div");
    wrap.className = "contact__social";
    contact.social.forEach((s) => {
      const a = document.createElement("a");
      a.href = s.url;
      a.textContent = s.label;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      wrap.appendChild(a);
    });
    el.appendChild(wrap);
  }
}

/* ---------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------- */
function pickLang(field) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[I18N.getLang()] || field.en || "";
}

function slugify(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
