/* ===================================================================
   Smoke & Barrel — vanilla JS, no dependencies
=================================================================== */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Mobile nav ---------- */
  const navToggle = $("#navToggle");
  const nav = $("#primary-nav");
  function closeNav() {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$('#primary-nav a').forEach(a => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav(); });

  /* ===================================================================
     FEATURE A — Where we're parked this week
  =================================================================== */
  const schedule = [
    { day: "Mon", open: false, loc: "Resting Bessie", area: "Day off", when: "", blurb: "We're cleaning the smoker, prepping rubs and resting up. Back at it Tuesday.", tags: [], lat: 51.4955, lon: -0.0995, bbox: "-0.115,51.488,-0.084,51.503" },
    { day: "Tue", open: true, loc: "Mercato Metropolitano", area: "Elephant & Castle, SE1", when: "Tue · 11:30 – 21:30", blurb: "Our home base. Full menu, the brisket's freshly off the smoker. Indoor seating, plenty of beer next door.", tags: ["Brisket", "Full menu", "Indoor seating"], lat: 51.4955, lon: -0.0995, bbox: "-0.110,51.490,-0.089,51.501" },
    { day: "Wed", open: true, loc: "Brockley Market", area: "Lewisham, SE4", when: "Wed · 12:00 – 20:00", blurb: "Mid-week roam to South-East. Pulled pork buns and loaded fries are flying. Bring cash or card.", tags: ["Pulled pork", "Loaded fries"], lat: 51.4646, lon: -0.0367, bbox: "-0.047,51.459,-0.026,51.470" },
    { day: "Thu", open: true, loc: "Pop Brixton", area: "Brixton, SW9", when: "Thu · 11:30 – 22:00", blurb: "Late one in Brixton. Burnt ends special till they're gone. Live music after 8.", tags: ["Burnt ends", "Late night"], lat: 51.4626, lon: -0.1145, bbox: "-0.125,51.457,-0.104,51.468" },
    { day: "Fri", open: true, loc: "Beavertown Brewery Taproom", area: "Tottenham Hale, N17", when: "Fri · 16:00 – 22:00", blurb: "Beer & 'cue Friday. Ribs, brisket and a meat-free smoked jackfruit bun. Big queues — get there early.", tags: ["Ribs", "Brewery", "Veggie option"], lat: 51.5917, lon: -0.0586, bbox: "-0.069,51.586,-0.048,51.597" },
    { day: "Sat", open: true, loc: "Maltby Street Market", area: "Bermondsey, SE1", when: "Sat · 11:00 – 22:00", blurb: "The big one. Full menu, the whole team, smoke from open. Our busiest day — worth the wait.", tags: ["Full menu", "Busiest day"], lat: 51.4986, lon: -0.0742, bbox: "-0.085,51.493,-0.064,51.504" },
    { day: "Sun", open: true, loc: "Dulwich Picture Gallery Lawn", area: "Dulwich, SE21", when: "Sun · 12:00 – 18:00", blurb: "Sunday roast, BBQ style. Brisket plates, kids' menu, picnic on the lawn. Family vibes.", tags: ["Sunday plates", "Family"], lat: 51.4445, lon: -0.0876, bbox: "-0.098,51.439,-0.077,51.450" }
  ];

  const dayList = $("#dayList");
  const detailCard = $("#detailCard");
  const mapFrame = $("#scheduleMap");
  const mapLink = $("#mapLink");

  function renderDetail(d) {
    if (!d.open) {
      detailCard.innerHTML =
        `<h3>${d.loc}</h3>
         <p class="detail-closed">${d.blurb}</p>`;
    } else {
      detailCard.innerHTML =
        `<h3>${d.loc}</h3>
         <p class="d-when">${d.when}</p>
         <p>${d.blurb}</p>
         <p style="color:var(--ink-soft);font-size:.9rem">📍 ${d.area}</p>
         ${d.tags.length ? `<ul class="detail-tags">${d.tags.map(t => `<li>${t}</li>`).join("")}</ul>` : ""}`;
    }
    mapFrame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${d.bbox}&layer=mapnik&marker=${d.lat}%2C${d.lon}`;
    mapFrame.title = `Map showing Smoke and Barrel at ${d.loc}, ${d.area}`;
    mapLink.href = `https://www.openstreetmap.org/?mlat=${d.lat}&mlon=${d.lon}#map=15/${d.lat}/${d.lon}`;
  }

  schedule.forEach((d, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-btn";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", "false");
    if (!d.open) btn.setAttribute("aria-disabled", "true");
    btn.innerHTML =
      `<span class="d-day">${d.day}</span>
       <span><span class="d-loc">${d.loc}</span><span class="d-area">${d.open ? d.area : "Closed"}</span></span>`;
    btn.addEventListener("click", () => selectDay(i));
    li.appendChild(btn);
    dayList.appendChild(li);
  });
  const dayBtns = $$(".day-btn", dayList);
  function selectDay(i) {
    dayBtns.forEach((b, idx) => {
      const on = idx === i;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    renderDetail(schedule[i]);
  }
  // default to today if open, else first open day
  const jsDay = new Date().getDay(); // 0=Sun
  const map = { 0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }; // js->schedule index
  let startIdx = map[jsDay];
  if (!schedule[startIdx].open) startIdx = schedule.findIndex(d => d.open);
  selectDay(startIdx);

  /* ===================================================================
     FEATURE B — Menu tabs
  =================================================================== */
  const menu = {
    lowslow: [
      { n: "Smoked Beef Brisket", d: "16-hour oak-smoked, sliced to order, butcher paper & pickles", p: "£11.50", b: "Signature" },
      { n: "Pulled Pork Bun", d: "12-hour pork shoulder, house slaw, BBQ glaze, toasted brioche", p: "£9.50" },
      { n: "Burnt Ends", d: "Caramelised brisket point, sticky bourbon glaze", p: "£10.00" },
      { n: "St Louis Ribs", d: "Half rack, dry-rubbed, slow-smoked, fall-off-the-bone", p: "£13.00" },
      { n: "The Whole Hog Platter", d: "Brisket, pulled pork, ribs, two sides — feeds two", p: "£26.00", b: "Sharer" },
      { n: "Smoked Jackfruit Bun", d: "Meat-free, smoked low & slow, slaw, BBQ glaze", p: "£8.50", b: "Veggie" }
    ],
    sides: [
      { n: "Smoked Mac & Cheese", d: "Three-cheese, smoked, crispy crumb top", p: "£5.00" },
      { n: "Charred Corn Ribs", d: "Chilli-lime butter, cotija", p: "£4.50" },
      { n: "House Slaw", d: "Apple, fennel, buttermilk dressing", p: "£3.50" },
      { n: "Pit Beans", d: "Slow-cooked in the smoker with brisket trimmings", p: "£4.00" },
      { n: "Cornbread", d: "Honey-butter, baked daily", p: "£3.50" }
    ],
    fries: [
      { n: "Brisket Loaded Fries", d: "Chopped brisket, cheese sauce, pickled onion, BBQ drizzle", p: "£8.50", b: "Best seller" },
      { n: "Pulled Pork Fries", d: "Pulled pork, slaw, jalapeño, crispy onion", p: "£8.00" },
      { n: "Burnt End Loaded Fries", d: "Sticky burnt ends, cheese sauce, spring onion", p: "£9.00" },
      { n: "Dirty Veggie Fries", d: "Smoked jackfruit, cheese sauce, pickles", p: "£7.50", b: "Veggie" },
      { n: "Plain Skin-On Fries", d: "Triple-cooked, smoked salt", p: "£4.00" }
    ],
    drinks: [
      { n: "House Cherry Cola", d: "Made in-house, over ice", p: "£3.00" },
      { n: "Craft Lager (Beavertown)", d: "440ml can, ice-cold", p: "£5.50" },
      { n: "Smoked Old Fashioned (ABV)", d: "Bourbon, bitters, applewood smoke — events only", p: "£9.00" },
      { n: "Homemade Lemonade", d: "Pink grapefruit & rosemary", p: "£3.50" },
      { n: "Bottomless Filter Coffee", d: "Locally roasted, refills on us", p: "£2.50" }
    ]
  };
  const labels = { lowslow: "Low & Slow", sides: "Sides", fries: "Loaded Fries", drinks: "Drinks" };
  const panelsWrap = $("#menuPanels");
  Object.keys(menu).forEach((cat, idx) => {
    const panel = document.createElement("div");
    panel.className = "menu-panel" + (idx === 0 ? " is-active" : "");
    panel.id = "panel-" + cat;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "tab-" + cat);
    if (idx !== 0) panel.hidden = true;
    const ul = document.createElement("ul");
    ul.className = "menu-items";
    ul.innerHTML = menu[cat].map(it =>
      `<li class="menu-item">
         <h3>${it.n}${it.b ? `<span class="mi-badge">${it.b}</span>` : ""}</h3>
         <span class="mi-price">${it.p}</span>
         <p class="mi-desc">${it.d}</p>
       </li>`).join("");
    panel.appendChild(ul);
    panelsWrap.appendChild(panel);
  });

  const tabs = $$(".menu-tab");
  function activateTab(tab) {
    const cat = tab.dataset.cat;
    tabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    $$(".menu-panel").forEach(p => {
      const on = p.id === "panel-" + cat;
      p.classList.toggle("is-active", on);
      p.hidden = !on;
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", e => {
      let ni = null;
      if (e.key === "ArrowRight") ni = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") ni = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") ni = 0;
      if (e.key === "End") ni = tabs.length - 1;
      if (ni !== null) { e.preventDefault(); tabs[ni].focus(); activateTab(tabs[ni]); }
    });
  });

  /* ===================================================================
     FEATURE D — Photo feed + lightbox
  =================================================================== */
  const photos = [
    { seed: "smokebarrel-brisket", cap: "16-hour brisket, that smoke ring" },
    { seed: "smokebarrel-ribs", cap: "Ribs resting before the chop" },
    { seed: "smokebarrel-fries", cap: "Brisket loaded fries, no apologies" },
    { seed: "smokebarrel-bun", cap: "Pulled pork bun, fully dressed" },
    { seed: "smokebarrel-fire", cap: "Bessie, fired up at 5am" },
    { seed: "smokebarrel-truck", cap: "The rig parked up at Maltby Street" },
    { seed: "smokebarrel-burntends", cap: "Burnt ends, sticky and gone fast" },
    { seed: "smokebarrel-queue", cap: "Saturday queue at Bermondsey" }
  ];
  const feedGrid = $("#feedGrid");
  feedGrid.innerHTML = photos.map((ph, i) =>
    `<li class="feed-item">
       <button class="feed-btn" type="button" data-idx="${i}" aria-label="Open photo: ${ph.cap}">
         <img src="https://picsum.photos/seed/${ph.seed}/500/500" alt="${ph.cap}" loading="lazy" width="500" height="500" />
       </button>
     </li>`).join("");

  const lightbox = $("#lightbox");
  const lbImg = $("#lightboxImg");
  const lbCap = $("#lightboxCap");
  let lbIndex = 0, lastFocus = null;

  function showLb(i) {
    lbIndex = (i + photos.length) % photos.length;
    const ph = photos[lbIndex];
    lbImg.src = `https://picsum.photos/seed/${ph.seed}/1000/1000`;
    lbImg.alt = ph.cap;
    lbCap.textContent = ph.cap;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    showLb(i);
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lightboxClose").focus();
  }
  function closeLb() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  feedGrid.addEventListener("click", e => {
    const btn = e.target.closest(".feed-btn");
    if (btn) openLb(Number(btn.dataset.idx));
  });
  $("#lightboxClose").addEventListener("click", closeLb);
  $("#lightboxNext").addEventListener("click", () => showLb(lbIndex + 1));
  $("#lightboxPrev").addEventListener("click", () => showLb(lbIndex - 1));
  lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLb(); });
  document.addEventListener("keydown", e => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
    if (e.key === "Tab") { // simple focus trap
      const f = $$("button", lightbox);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ===================================================================
     FEATURE C — Catering form validation
  =================================================================== */
  const form = $("#cateringForm");
  const success = $("#cateringSuccess");
  const validators = {
    "cf-name": v => v.trim().length >= 2 || "Please tell us your name.",
    "cf-email": v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Enter a valid email address.",
    "cf-phone": v => v.trim() === "" || /^[\d\s+()-]{7,}$/.test(v.trim()) || "Enter a valid phone number.",
    "cf-date": v => {
      if (!v) return "Pick your event date.";
      const d = new Date(v + "T00:00"); const today = new Date(); today.setHours(0, 0, 0, 0);
      return d >= today || "Choose a date in the future.";
    },
    "cf-guests": v => {
      const n = Number(v);
      return (v !== "" && n >= 10 && n <= 800) || "We cater 10–800 guests.";
    },
    "cf-message": v => v.trim().length >= 10 || "A few words about your event, please."
  };
  function validateField(id) {
    const input = $("#" + id);
    const field = input.closest(".field");
    const errEl = $(`.field-error[data-for="${id}"]`);
    const res = validators[id](input.value);
    if (res === true) {
      field.classList.remove("invalid");
      input.removeAttribute("aria-invalid");
      errEl.textContent = "";
      return true;
    }
    field.classList.add("invalid");
    input.setAttribute("aria-invalid", "true");
    errEl.textContent = res;
    return false;
  }
  Object.keys(validators).forEach(id => {
    const input = $("#" + id);
    input.addEventListener("blur", () => validateField(id));
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("invalid")) validateField(id);
    });
  });
  // set min date = today
  const dateInput = $("#cf-date");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", e => {
    e.preventDefault();
    let ok = true, firstBad = null;
    Object.keys(validators).forEach(id => {
      const valid = validateField(id);
      if (!valid && !firstBad) firstBad = id;
      ok = ok && valid;
    });
    if (!ok) { if (firstBad) $("#" + firstBad).focus(); success.hidden = true; return; }
    form.reset();
    Object.keys(validators).forEach(id => $(`.field-error[data-for="${id}"]`).textContent = "");
    success.hidden = false;
    success.focus && success.focus();
    success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  });

  /* ===================================================================
     FEATURE E — Loyalty card (localStorage, reward at 6)
  =================================================================== */
  const KEY = "smokebarrel.stamps";
  const MAX = 6;
  const stampRow = $("#stampRow");
  const statusEl = $("#loyaltyStatus");
  const stampBtn = $("#stampBtn");

  function getStamps() {
    const n = parseInt(localStorage.getItem(KEY) || "0", 10);
    return isNaN(n) ? 0 : Math.max(0, Math.min(MAX, n));
  }
  function setStamps(n) { localStorage.setItem(KEY, String(n)); }

  function renderLoyalty(justAdded) {
    const n = getStamps();
    stampRow.innerHTML = "";
    for (let i = 0; i < MAX; i++) {
      const li = document.createElement("li");
      const filled = i < n;
      const reward = i === MAX - 1;
      li.className = "stamp" + (filled ? " filled" : "") + (filled && reward ? " reward" : "");
      li.textContent = filled ? (reward ? "★" : "🔥") : (reward ? "🎁" : i + 1);
      li.setAttribute("aria-label", filled ? `Stamp ${i + 1} collected` : `Stamp ${i + 1} empty`);
      stampRow.appendChild(li);
    }
    if (n >= MAX) {
      statusEl.innerHTML = `<span class="win">🎉 Full card! Show this at the hatch for a free plate.</span>`;
      stampBtn.textContent = "Redeem & start over";
    } else {
      const left = MAX - n;
      statusEl.textContent = `${n} of ${MAX} stamps — ${left} more visit${left === 1 ? "" : "s"} to a free plate.`;
      stampBtn.textContent = "Stamp this visit";
    }
  }
  stampBtn.addEventListener("click", () => {
    let n = getStamps();
    if (n >= MAX) { n = 0; }     // redeem resets
    else { n += 1; }
    setStamps(n);
    renderLoyalty(true);
  });
  $("#resetLoyalty").addEventListener("click", () => { setStamps(0); renderLoyalty(false); });
  renderLoyalty(false);

  /* ===================================================================
     Scroll reveal
  =================================================================== */
  const revealEls = $$(".section .container > *, .hero-inner > *");
  revealEls.forEach(el => el.classList.add("reveal"));
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("in"));
  }

  /* ===================================================================
     Embers in hero
  =================================================================== */
  const emberLayer = $("#emberLayer");
  if (emberLayer && !reduceMotion) {
    for (let i = 0; i < 18; i++) {
      const e = document.createElement("span");
      e.className = "ember";
      e.style.left = Math.random() * 100 + "%";
      e.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
      e.style.animationDuration = (5 + Math.random() * 6) + "s";
      e.style.animationDelay = (Math.random() * 8) + "s";
      const s = 3 + Math.random() * 4;
      e.style.width = e.style.height = s + "px";
      emberLayer.appendChild(e);
    }
  }
})();
