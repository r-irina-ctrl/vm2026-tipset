const STORAGE_KEY = "vm2026-tipset-data-v1";
const CONFIG_KEY = "vm2026-tipset-config-v1";
const ADMIN_PASSWORD = "vm2026";
const REQUEST_TIMEOUT_MS = 10000;
const CLOUD_CONFIG = {
  masterKey: "$2a$10$NcZV4da5Bw5CazTuhfQvgOgSX5rkigaV5dfuwLwdYrupyBv2rG.zK",
  accessKey: "",
  binId: "6a2af761da38895dfeaf7b32",
  binName: "vm2026-tipset",
};

const groupMatches = {
  A: [["Mexiko", "Sydafrika"], ["Sydkorea", "Tjeckien"], ["Tjeckien", "Sydafrika"], ["Mexiko", "Sydkorea"], ["Tjeckien", "Mexiko"], ["Sydafrika", "Sydkorea"]],
  B: [["Kanada", "Bosnien"], ["Qatar", "Schweiz"], ["Schweiz", "Bosnien"], ["Kanada", "Qatar"], ["Schweiz", "Kanada"], ["Bosnien", "Qatar"]],
  C: [["Brasilien", "Marocko"], ["Haiti", "Skottland"], ["Skottland", "Marocko"], ["Brasilien", "Haiti"], ["Skottland", "Brasilien"], ["Marocko", "Haiti"]],
  D: [["USA", "Paraguay"], ["Australien", "Turkiet"], ["USA", "Australien"], ["Turkiet", "Paraguay"], ["Turkiet", "USA"], ["Paraguay", "Australien"]],
  E: [["Tyskland", "Curaçao"], ["Elfenbenskusten", "Ecuador"], ["Tyskland", "Elfenbenskusten"], ["Ecuador", "Curaçao"], ["Ecuador", "Tyskland"], ["Curaçao", "Elfenbenskusten"]],
  F: [["Nederländerna", "Japan"], ["Sverige", "Tunisien"], ["Nederländerna", "Sverige"], ["Tunisien", "Japan"], ["Japan", "Sverige"], ["Tunisien", "Nederländerna"]],
  G: [["Belgien", "Egypten"], ["Iran", "Nya Zeeland"], ["Belgien", "Iran"], ["Nya Zeeland", "Egypten"], ["Egypten", "Iran"], ["Nya Zeeland", "Belgien"]],
  H: [["Spanien", "Kap Verde"], ["Saudiarabien", "Uruguay"], ["Spanien", "Saudiarabien"], ["Uruguay", "Kap Verde"], ["Kap Verde", "Saudiarabien"], ["Uruguay", "Spanien"]],
  I: [["Frankrike", "Senegal"], ["Irak", "Norge"], ["Frankrike", "Irak"], ["Norge", "Senegal"], ["Norge", "Frankrike"], ["Senegal", "Irak"]],
  J: [["Argentina", "Algeriet"], ["Österrike", "Jordanien"], ["Argentina", "Österrike"], ["Jordanien", "Algeriet"], ["Algeriet", "Österrike"], ["Jordanien", "Argentina"]],
  K: [["Portugal", "DR Kongo"], ["Uzbekistan", "Colombia"], ["Portugal", "Uzbekistan"], ["Colombia", "DR Kongo"], ["Colombia", "Portugal"], ["DR Kongo", "Uzbekistan"]],
  L: [["England", "Kroatien"], ["Ghana", "Panama"], ["England", "Ghana"], ["Panama", "Kroatien"], ["Panama", "England"], ["Kroatien", "Ghana"]],
};

const groupTeams = {
  A: ["Mexiko", "Sydkorea", "Sydafrika", "Tjeckien"],
  B: ["Kanada", "Schweiz", "Qatar", "Bosnien"],
  C: ["Brasilien", "Marocko", "Skottland", "Haiti"],
  D: ["USA", "Turkiet", "Paraguay", "Australien"],
  E: ["Tyskland", "Elfenbenskusten", "Ecuador", "Curaçao"],
  F: ["Nederländerna", "Japan", "Sverige", "Tunisien"],
  G: ["Belgien", "Iran", "Nya Zeeland", "Egypten"],
  H: ["Spanien", "Uruguay", "Saudiarabien", "Kap Verde"],
  I: ["Frankrike", "Senegal", "Norge", "Irak"],
  J: ["Argentina", "Algeriet", "Österrike", "Jordanien"],
  K: ["Portugal", "Colombia", "Uzbekistan", "DR Kongo"],
  L: ["England", "Kroatien", "Ghana", "Panama"],
};

const groupColors = {
  A: "#e74c3c",
  B: "#e67e22",
  C: "#f1c40f",
  D: "#2ecc71",
  E: "#1abc9c",
  F: "#3498db",
  G: "#9b59b6",
  H: "#e91e63",
  I: "#ff5722",
  J: "#607d8b",
  K: "#795548",
  L: "#00bcd4",
};

const allTeams = Object.values(groupTeams).flat().sort((a, b) => a.localeCompare(b, "sv"));
const totalMatchCount = Object.values(groupMatches).reduce((sum, matches) => sum + matches.length, 0);

const state = {
  screen: "home",
  playerName: "",
  nameError: "",
  tips: {},
  groupFirst: {},
  groupSecond: {},
  winner: "",
  scorer: "",
  scorerGoals: "",
  activeGroup: "A",
  entries: [],
  results: null,
  cloudReady: Boolean(CLOUD_CONFIG.masterKey && CLOUD_CONFIG.binId),
  loading: true,
  saving: false,
  message: "",
  adminUnlocked: false,
  adminPass: "",
  adminTab: "entries",
  adminOpenEntry: "",
  resTips: {},
  resGroupFirst: {},
  resGroupSecond: {},
  resWinner: "",
  resScorer: "",
  resScorerGoals: "",
  resActiveGroup: "A",
  syncStatus: "",
};

const app = document.querySelector("#app");

init();

async function init() {
  render();
  await loadAll();
  render();
}

async function loadAll() {
  state.loading = true;
  state.message = "";
  try {
    const data = await readStore();
    state.entries = data.entries || [];
    applyResults(data.results || null);
  } catch {
    state.entries = [];
    applyResults(null);
    state.message = "Kunde inte ansluta till gemensamma databasen. Ladda om sidan och försök igen.";
  }
  state.loading = false;
}

function applyResults(results) {
  state.results = results;
  state.resTips = { ...(results?.tips || {}) };
  state.resGroupFirst = { ...(results?.groupFirst || {}) };
  state.resGroupSecond = { ...(results?.groupSecond || {}) };
  state.resWinner = results?.winner || "";
  state.resScorer = results?.scorer || "";
  state.resScorerGoals = results?.scorerGoals || "";
}

function render() {
  if (state.loading) {
    app.innerHTML = `<div class="page center"><div class="main home-main"><div class="card" style="text-align:center">Ansluter till databasen...</div></div></div>`;
    return;
  }

  if (state.screen === "form") renderForm();
  else if (state.screen === "leaderboard") renderLeaderboard();
  else if (state.screen === "admin") renderAdmin();
  else renderHome();
}

function renderHome() {
  const matchCount = Object.keys(state.results?.tips || {}).length;
  const syncedAt = state.results?.syncedAt ? ` · senast ${formatDateTime(state.results.syncedAt)}` : "";
  app.innerHTML = `
    <div class="page">
      <header class="header">
        <div class="home-hero">
          <div class="trophy">🏆</div>
          <div class="kicker">FIFA</div>
          <h1>VM 2026 Tipset</h1>
          <p class="subtitle">USA · Kanada · Mexiko · 11 juni - 19 juli</p>
          <p class="count">${state.entries.length} deltagare har lämnat in tips</p>
        </div>
      </header>
      <section class="main home-main">
        ${messageHtml()}
        ${matchCount ? `<div class="notice">${matchCount} matchresultat i facit${syncedAt}</div>` : ""}
        <div class="notice">${state.cloudReady ? "Gemensam sparning är aktiv." : "Lokal testversion. Gemensam sparning är inte kopplad."}</div>
        <div class="card">
          <label class="label" for="player-name">Ditt namn</label>
          <input class="input" id="player-name" value="${esc(state.playerName)}" placeholder="Ange ditt namn..." />
          ${state.nameError ? `<div class="error">${esc(state.nameError)}</div>` : ""}
          <button class="button button-gold button-full" id="start" style="margin-top:14px">Fyll i kupong</button>
        </div>
        <button class="button button-blue button-full" id="leaderboard">Se topplistan</button>
        <button class="button button-dark button-full" id="admin" style="margin-top:8px">Admin</button>
        <p class="config-note">Dela samma länk med deltagarna. Alla nya svar sparas i den gemensamma databasen.</p>
      </section>
    </div>
  `;

  bind("#player-name", "input", (event) => {
    state.playerName = event.target.value;
    state.nameError = "";
  });
  bind("#player-name", "keydown", (event) => {
    if (event.key === "Enter") startForm();
  });
  bind("#start", "click", startForm);
  bind("#leaderboard", "click", async () => {
    await loadAll();
    state.screen = "leaderboard";
    render();
  });
  bind("#admin", "click", () => {
    state.screen = "admin";
    render();
  });
}

function startForm() {
  if (!state.playerName.trim()) {
    state.nameError = "Ange ditt namn.";
    render();
    return;
  }
  state.nameError = "";
  state.screen = "form";
  render();
}

function renderForm() {
  const filledMatches = Object.keys(state.tips).length;
  const filledGroups = Object.keys(groupTeams).filter((group) => state.groupFirst[group] && state.groupSecond[group]).length;
  const progress = Math.min(
    100,
    Math.round((filledMatches / totalMatchCount) * 55 + (filledGroups / 12) * 25 + (state.winner ? 10 : 0) + (state.scorer ? 5 : 0) + (state.scorerGoals ? 5 : 0)),
  );
  const complete = filledMatches === totalMatchCount && filledGroups === 12 && state.winner && state.scorer && state.scorerGoals;

  app.innerHTML = `
    <div class="page">
      ${header("VM 2026 Tipskupong", `Spelar som: ${esc(state.playerName)}`, "home")}
      <section class="main">
        <div class="progress"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div class="progress-meta"><span>${filledMatches}/${totalMatchCount} matcher</span><span>${filledGroups}/12 grupper</span></div>
        <div class="small-label" style="margin-top:16px">Välj grupp</div>
        ${groupTabs(state.activeGroup, "group-tab")}
        ${groupForm(state.activeGroup, state.tips, state.groupFirst, state.groupSecond)}
        ${finalQuestions()}
        <div class="save-box">
          <button class="button button-gold button-full" id="submit" ${complete || state.saving ? "" : "disabled"}>
            ${state.saving ? "Sparar..." : complete ? "Lämna in kupong" : `Fyll i alla tips (${filledMatches}/${totalMatchCount} matcher, ${filledGroups}/12 grupper)`}
          </button>
          ${messageHtml()}
        </div>
      </section>
    </div>
  `;

  bindCommonHeader();
  bindGroupTabs("group-tab", (group) => {
    state.activeGroup = group;
    render();
  });
  bindTips(state.tips);
  bindPickers(state.groupFirst, state.groupSecond);
  bind("#winner", "change", (event) => (state.winner = event.target.value));
  bind("#scorer", "input", (event) => (state.scorer = event.target.value));
  bind("#scorer-goals", "input", (event) => (state.scorerGoals = event.target.value));
  bind("#submit", "click", submitEntry);
}

function groupForm(group, tips, first, second) {
  const matches = groupMatches[group];
  return `
    <section class="group-card" style="border-color:${groupColors[group]}66">
      <div class="group-head" style="background:linear-gradient(90deg, ${groupColors[group]}22, transparent)">
        <div class="group-dot" style="background:${groupColors[group]}">${group}</div>
        <div>
          <div class="group-name">Grupp ${group}</div>
          <div class="teams">${groupTeams[group].join(" · ")}</div>
        </div>
      </div>
      <div class="match-list">
        <div class="small-label">Matcher - 1 / X / 2</div>
        ${matches.map(([home, away]) => matchRow(group, home, away, tips)).join("")}
      </div>
      <div class="pickers">
        ${teamSelect(`first-${group}`, "Gruppsetta", group, first[group], second[group])}
        ${teamSelect(`second-${group}`, "Grupptvåa", group, second[group], first[group])}
      </div>
    </section>
  `;
}

function matchRow(group, home, away, tips) {
  const key = `${group}-${home}-${away}`;
  return `
    <div class="match-row">
      <div class="match-name"><strong>${esc(home)}</strong><span class="versus">-</span><strong>${esc(away)}</strong></div>
      <div class="tip-buttons">
        ${["1", "X", "2"].map((value) => tipButton(key, value, tips[key], group)).join("")}
      </div>
    </div>
  `;
}

function tipButton(key, value, selected, group) {
  const active = selected === value;
  return `<button class="tip-button" data-tip-key="${esc(key)}" data-tip-value="${value}" style="${active ? `background:${groupColors[group]};border-color:${groupColors[group]};color:#fff` : ""}">${value}</button>`;
}

function teamSelect(id, label, group, value, blocked) {
  return `
    <label>
      <span class="label" style="color:${label.includes("setta") ? "var(--gold)" : "#90caf9"};font-size:10px">${label}</span>
      <select class="select" id="${id}">
        <option value="">Välj lag...</option>
        ${groupTeams[group].filter((team) => team !== blocked).map((team) => `<option ${team === value ? "selected" : ""}>${esc(team)}</option>`).join("")}
      </select>
    </label>
  `;
}

function finalQuestions() {
  return `
    <div class="final-grid">
      <div class="mini-panel">
        <label class="label" for="winner" style="color:var(--gold)">VM-vinnare</label>
        <select class="select" id="winner">
          <option value="">Välj vinnare...</option>
          ${allTeams.map((team) => `<option ${team === state.winner ? "selected" : ""}>${esc(team)}</option>`).join("")}
        </select>
      </div>
      <div class="mini-panel">
        <label class="label" for="scorer" style="color:#e91e63">Skyttekung</label>
        <input class="input" id="scorer" value="${esc(state.scorer)}" placeholder="Spelarens namn..." style="margin-bottom:7px" />
        <input class="input" id="scorer-goals" type="number" min="1" max="20" value="${esc(state.scorerGoals)}" placeholder="Antal mål..." />
      </div>
    </div>
  `;
}

async function submitEntry() {
  state.saving = true;
  state.message = "";
  render();
  try {
    const data = await readStore();
    const entries = data.entries || [];
    const entry = {
      name: state.playerName.trim(),
      tips: state.tips,
      groupFirst: state.groupFirst,
      groupSecond: state.groupSecond,
      winner: state.winner,
      scorer: state.scorer,
      scorerGoals: state.scorerGoals,
      submittedAt: new Date().toISOString(),
    };
    const index = entries.findIndex((item) => item.name.toLowerCase() === entry.name.toLowerCase());
    if (index >= 0) entries[index] = entry;
    else entries.push(entry);
    await writeStore({ ...data, entries });
    state.entries = entries;
    state.message = "Kupong inlämnad.";
    setTimeout(() => {
      state.screen = "leaderboard";
      state.saving = false;
      render();
    }, 700);
  } catch {
    state.message = "Kunde inte spara. Försök igen.";
    state.saving = false;
    render();
  }
}

function renderLeaderboard() {
  const scored = getScoredEntries();
  app.innerHTML = `
    <div class="page">
      ${header("Topplista", `${scored.length} deltagare`, "home", "Uppdatera")}
      <section class="main">
        ${messageHtml()}
        ${state.results ? "" : `<div class="notice">Poäng räknas när facit finns i adminläget.</div>`}
        ${scored.length ? scored.map(entryRow).join("") : `<div class="card" style="text-align:center;color:var(--quiet)">Inga kuponger inlämnade ännu.</div>`}
        ${state.results ? `<div class="notice">Rätt match: 3p · Gruppsetta: 5p · Grupptvåa: 3p · VM-vinnare: 10p · Skyttekung: 4p · Rätt antal mål: +4p</div>` : ""}
      </section>
    </div>
  `;
  bindCommonHeader();
  bind("#header-action", "click", async () => {
    await loadAll();
    render();
  });
}

function entryRow(entry, index) {
  const medal = entry.pts == null ? `${index + 1}.` : ["🥇", "🥈", "🥉"][index] || `${index + 1}.`;
  return `
    <div class="entry-row">
      <div class="rank">${medal}</div>
      <div class="grow">
        <div class="entry-name">${esc(entry.name)}</div>
        <div class="entry-meta">VM-vinnare: ${esc(entry.winner || "-")} · Skyttekung: ${esc(entry.scorer || "-")} ${entry.scorerGoals ? `(${esc(entry.scorerGoals)} mål)` : ""}</div>
      </div>
      <div class="points">${entry.pts == null ? `<span>Väntar</span>` : `${entry.pts}<span>p</span>`}</div>
    </div>
  `;
}

function renderAdmin() {
  if (!state.adminUnlocked) {
    app.innerHTML = `
      <div class="page">
        ${header("Admin", "", "home")}
        <section class="main home-main">
          <div class="card">
            <label class="label" for="admin-pass">Adminlösenord</label>
            <input class="input" id="admin-pass" type="password" value="${esc(state.adminPass)}" placeholder="Lösenord..." />
            <button class="button button-gold button-full" id="unlock" style="margin-top:12px">Logga in</button>
            <p class="config-note">Standardlösenord: vm2026</p>
          </div>
        </section>
      </div>
    `;
    bindCommonHeader();
    bind("#admin-pass", "input", (event) => (state.adminPass = event.target.value));
    bind("#admin-pass", "keydown", (event) => {
      if (event.key === "Enter") unlockAdmin();
    });
    bind("#unlock", "click", unlockAdmin);
    return;
  }

  app.innerHTML = `
      <div class="page">
        ${header("Admin", `${state.entries.length} deltagare`, "home")}
      <section class="main">
        ${messageHtml()}
        <div class="admin-tabs">
          <button class="admin-tab" id="admin-entries" style="${state.adminTab === "entries" ? "border-color:var(--gold);color:var(--gold)" : ""}">Deltagarnas svar</button>
          <button class="admin-tab" id="admin-results" style="${state.adminTab === "results" ? "border-color:var(--gold);color:var(--gold)" : ""}">Facit & synk</button>
        </div>
        ${state.adminTab === "entries" ? adminEntries() : adminResults()}
      </section>
    </div>
  `;
  bindCommonHeader();
  bind("#admin-entries", "click", () => {
    state.adminTab = "entries";
    render();
  });
  bind("#admin-results", "click", () => {
    state.adminTab = "results";
    render();
  });
  if (state.adminTab === "results") bindAdminResults();
  else bindAdminEntries();
}

function unlockAdmin() {
  if (state.adminPass === ADMIN_PASSWORD) {
    state.adminUnlocked = true;
    state.message = "";
  } else {
    state.message = "Fel lösenord.";
  }
  render();
}

function adminEntries() {
  if (!state.entries.length) return `<div class="card" style="text-align:center;color:var(--quiet)">Inga svar inlämnade ännu.</div>`;
  return state.entries
    .map(
      (entry) => `
        <div class="admin-entry-card">
          <div class="entry-row">
            <div class="grow">
              <div class="entry-name">${esc(entry.name)}</div>
              <div class="entry-meta">Inlämnad: ${formatDateTime(entry.submittedAt)} · Vinnare: ${esc(entry.winner || "-")}</div>
            </div>
            <div class="entry-actions">
              <button class="small-button" data-toggle-entry="${esc(entry.name)}">${state.adminOpenEntry === entry.name ? "Dölj svar" : "Visa svar"}</button>
              <button class="small-button danger" data-delete="${esc(entry.name)}">Ta bort</button>
            </div>
          </div>
          ${state.adminOpenEntry === entry.name ? adminEntryDetails(entry) : ""}
        </div>
      `,
    )
    .join("");
}

function bindAdminEntries() {
  document.querySelectorAll("[data-toggle-entry]").forEach((button) => {
    button.addEventListener("click", () => {
      state.adminOpenEntry = state.adminOpenEntry === button.dataset.toggleEntry ? "" : button.dataset.toggleEntry;
      render();
    });
  });
  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteEntry(button.dataset.delete);
    });
  });
}

function adminEntryDetails(entry) {
  return `
    <div class="entry-detail">
      <div class="detail-grid">
        <div>
          <div class="detail-title">Sluttips</div>
          <div class="detail-line">VM-vinnare: <strong>${esc(entry.winner || "-")}</strong></div>
          <div class="detail-line">Skyttekung: <strong>${esc(entry.scorer || "-")}</strong>${entry.scorerGoals ? `, ${esc(entry.scorerGoals)} mål` : ""}</div>
        </div>
        <div>
          <div class="detail-title">Grupper</div>
          ${Object.keys(groupTeams)
            .map((group) => `<div class="detail-line">Grupp ${group}: ${esc(entry.groupFirst?.[group] || "-")} / ${esc(entry.groupSecond?.[group] || "-")}</div>`)
            .join("")}
        </div>
      </div>
      <div class="detail-title" style="margin-top:12px">Matchtips</div>
      <div class="tips-grid">
        ${Object.entries(groupMatches)
          .map(([group, matches]) => `
            <div class="tips-group">
              <div class="tips-group-title">Grupp ${group}</div>
              ${matches
                .map(([home, away]) => {
                  const key = `${group}-${home}-${away}`;
                  return `<div class="detail-line">${esc(home)} - ${esc(away)}: <strong>${esc(entry.tips?.[key] || "-")}</strong></div>`;
                })
                .join("")}
            </div>
          `)
          .join("")}
      </div>
    </div>
  `;
}

async function deleteEntry(name) {
  state.saving = true;
  const data = await readStore();
  const entries = (data.entries || []).filter((entry) => entry.name.toLowerCase() !== name.toLowerCase());
  await writeStore({ ...data, entries });
  state.entries = entries;
  state.saving = false;
  render();
}

function adminResults() {
  return `
    <div class="notice">Live-synk är valfri. Du kan alltid fylla i facit manuellt.</div>
    <button class="button button-blue button-full" id="auto-sync">${state.syncStatus === "syncing" ? "Hämtar..." : "Synka från live-API"}</button>
    <div class="final-grid" style="margin-top:14px">
      <div class="mini-panel">
        <label class="label" for="res-winner" style="color:var(--gold)">VM-vinnare</label>
        <select class="select" id="res-winner">
          <option value="">Välj...</option>
          ${allTeams.map((team) => `<option ${team === state.resWinner ? "selected" : ""}>${esc(team)}</option>`).join("")}
        </select>
      </div>
      <div class="mini-panel">
        <label class="label" for="res-scorer" style="color:#e91e63">Skyttekung</label>
        <input class="input" id="res-scorer" value="${esc(state.resScorer)}" placeholder="Namn..." style="margin-bottom:7px" />
        <input class="input" id="res-scorer-goals" type="number" value="${esc(state.resScorerGoals)}" placeholder="Mål..." />
      </div>
    </div>
    <div class="small-label">Manuellt facit</div>
    ${groupTabs(state.resActiveGroup, "res-group-tab")}
    ${groupForm(state.resActiveGroup, state.resTips, state.resGroupFirst, state.resGroupSecond)}
    <button class="button button-gold button-full" id="save-results">Spara facit & räkna poäng</button>
    ${messageHtml()}
  `;
}

function bindAdminResults() {
  bind("#auto-sync", "click", autoSync);
  bind("#res-winner", "change", (event) => (state.resWinner = event.target.value));
  bind("#res-scorer", "input", (event) => (state.resScorer = event.target.value));
  bind("#res-scorer-goals", "input", (event) => (state.resScorerGoals = event.target.value));
  bindGroupTabs("res-group-tab", (group) => {
    state.resActiveGroup = group;
    render();
  });
  bindTips(state.resTips);
  bindPickers(state.resGroupFirst, state.resGroupSecond);
  bind("#save-results", "click", saveResults);
}

async function saveResults() {
  state.saving = true;
  state.message = "";
  render();
  try {
    const data = await readStore();
    const results = {
      tips: state.resTips,
      groupFirst: state.resGroupFirst,
      groupSecond: state.resGroupSecond,
      winner: state.resWinner,
      scorer: state.resScorer,
      scorerGoals: state.resScorerGoals,
      updatedAt: new Date().toISOString(),
    };
    await writeStore({ ...data, results });
    applyResults(results);
    state.message = "Facit sparat.";
  } catch {
    state.message = "Kunde inte spara facit.";
  }
  state.saving = false;
  render();
}

async function autoSync() {
  state.syncStatus = "syncing";
  render();
  try {
    const built = await fetchLiveResults(state.results);
    state.resTips = built.tips || {};
    state.resGroupFirst = built.groupFirst || {};
    state.resGroupSecond = built.groupSecond || {};
    state.resWinner = built.winner || "";
    state.resScorer = built.scorer || "";
    state.resScorerGoals = built.scorerGoals || "";
    state.syncStatus = "ok";
    state.message = `${Object.keys(built.tips || {}).length} matchresultat hämtade.`;
  } catch {
    state.syncStatus = "error";
    state.message = "Kunde inte hämta live-data.";
  }
  render();
}

function groupTabs(activeGroup, className) {
  return `
    <div class="tabs">
      ${Object.keys(groupMatches)
        .map((group) => {
          const active = group === activeGroup;
          return `<button class="tab ${className}" data-group="${group}" style="${active ? `border-color:${groupColors[group]};color:${groupColors[group]};background:${groupColors[group]}22` : ""}">Grupp ${group}</button>`;
        })
        .join("")}
    </div>
  `;
}

function bindGroupTabs(className, callback) {
  document.querySelectorAll(`.${className}`).forEach((button) => {
    button.addEventListener("click", () => callback(button.dataset.group));
  });
}

function bindTips(target) {
  document.querySelectorAll("[data-tip-key]").forEach((button) => {
    button.addEventListener("click", () => {
      target[button.dataset.tipKey] = button.dataset.tipValue;
      render();
    });
  });
}

function bindPickers(first, second) {
  Object.keys(groupTeams).forEach((group) => {
    bind(`#first-${group}`, "change", (event) => {
      first[group] = event.target.value;
      if (second[group] === event.target.value) second[group] = "";
      render();
    });
    bind(`#second-${group}`, "change", (event) => {
      second[group] = event.target.value;
      if (first[group] === event.target.value) first[group] = "";
      render();
    });
  });
}

function header(title, subtitle, backTarget, actionText = "") {
  return `
    <header class="header">
      <div class="wrap header-row">
        <button class="back-button" id="header-back">${backTarget === "home" ? "Hem" : "Tillbaka"}</button>
        <div class="grow">
          <div class="screen-title">${esc(title)}</div>
          ${subtitle ? `<div class="screen-subtitle">${subtitle}</div>` : ""}
        </div>
        ${actionText ? `<button class="back-button" id="header-action">${actionText}</button>` : ""}
      </div>
    </header>
  `;
}

function bindCommonHeader() {
  bind("#header-back", "click", () => {
    state.screen = "home";
    state.message = "";
    render();
  });
}

function messageHtml() {
  if (!state.message) return "";
  const ok = !state.message.toLowerCase().includes("inte") && !state.message.toLowerCase().includes("fel");
  return `<div class="message ${ok ? "message-ok" : "message-error"}">${esc(state.message)}</div>`;
}

function getScoredEntries() {
  return state.entries
    .map((entry) => ({ ...entry, pts: state.results ? calcScore(entry, state.results) : null }))
    .sort((a, b) => (b.pts ?? -1) - (a.pts ?? -1) || a.name.localeCompare(b.name, "sv"));
}

function calcScore(entry, results) {
  let points = 0;
  Object.entries(entry.tips || {}).forEach(([key, value]) => {
    if (results.tips?.[key] === value) points += 3;
  });
  Object.keys(groupTeams).forEach((group) => {
    if (results.groupFirst?.[group] && results.groupFirst[group] === entry.groupFirst?.[group]) points += 5;
    if (results.groupSecond?.[group] && results.groupSecond[group] === entry.groupSecond?.[group]) points += 3;
  });
  if (results.winner && entry.winner === results.winner) points += 10;
  if (results.scorer && clean(entry.scorer) === clean(results.scorer)) {
    points += 4;
    if (results.scorerGoals && String(entry.scorerGoals) === String(results.scorerGoals)) points += 4;
  }
  return points;
}

async function readStore() {
  const config = getConfig();
  if (!config.masterKey) return readLocalStore();
  return readJsonBin(config);
}

async function writeStore(data) {
  const normalized = { entries: data.entries || [], results: data.results || null };
  const config = getConfig();
  if (config.masterKey) {
    await writeJsonBin(config, normalized);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

function readLocalStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { entries: [], results: null };
  } catch {
    return { entries: [], results: null };
  }
}

function getConfig() {
  try {
    return { ...CLOUD_CONFIG, ...(JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}) };
  } catch {
    return { ...CLOUD_CONFIG };
  }
}

async function readJsonBin(config) {
  const binId = await getBinId(config);
  const response = await fetchWithTimeout(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers: jsonBinHeaders(config),
  });
  if (!response.ok) throw new Error("read failed");
  const data = await response.json();
  return data.record || { entries: [], results: null };
}

async function writeJsonBin(config, data) {
  const binId = await getBinId(config);
  const response = await fetchWithTimeout(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: "PUT",
    headers: { ...jsonBinHeaders(config), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("write failed");
}

async function getBinId(config) {
  if (config.binId) return config.binId;
  const binName = config.binName || "vm2026-tipset";
  const response = await fetchWithTimeout("https://api.jsonbin.io/v3/c/bins", {
    headers: jsonBinHeaders(config),
  });
  if (response.ok) {
    const bins = await response.json();
    const found = (bins || []).find((bin) => bin.record?.name === binName || bin.metadata?.name === binName);
    const id = found?.metadata?.id || found?.record?.id;
    if (id) return id;
  }
  const created = await fetchWithTimeout("https://api.jsonbin.io/v3/b", {
    method: "POST",
    headers: { ...jsonBinHeaders(config), "Content-Type": "application/json", "X-Bin-Name": binName, "X-Bin-Private": "false" },
    body: JSON.stringify({ entries: [], results: null }),
  });
  if (!created.ok) throw new Error("create failed");
  const data = await created.json();
  return data.metadata?.id;
}

function jsonBinHeaders(config) {
  const headers = { "X-Master-Key": config.masterKey };
  if (config.accessKey) headers["X-Access-Key"] = config.accessKey;
  return headers;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchLiveResults(existing) {
  const response = await fetch("https://worldcup26.ir/get/games");
  if (!response.ok) throw new Error("API error");
  const data = await response.json();
  const games = Array.isArray(data) ? data : data.games || data.matches || data.data || [];
  const tips = {};
  const groupStandings = {};
  for (const game of games) {
    const status = String(game.status || game.state || "").toLowerCase();
    const finished = status.includes("finish") || status.includes("full") || status.includes("ft") || status.includes("ended") || game.homeScore != null;
    if (!finished) continue;
    const home = mapTeam(game.homeTeam?.name || game.home_team?.name || game.homeName || game.home || "");
    const away = mapTeam(game.awayTeam?.name || game.away_team?.name || game.awayName || game.away || "");
    const homeScore = Number(game.homeScore ?? game.home_score ?? game.score?.home ?? 0);
    const awayScore = Number(game.awayScore ?? game.away_score ?? game.score?.away ?? 0);
    const result = homeScore > awayScore ? "1" : homeScore < awayScore ? "2" : "X";
    Object.entries(groupMatches).forEach(([group, matches]) => {
      matches.forEach(([expectedHome, expectedAway]) => {
        if (expectedHome === home && expectedAway === away) tips[`${group}-${expectedHome}-${expectedAway}`] = result;
        if (expectedHome === away && expectedAway === home) tips[`${group}-${expectedHome}-${expectedAway}`] = result === "1" ? "2" : result === "2" ? "1" : "X";
      });
    });
    const group = String(game.group || game.groupName || "").replace(/group\s*/i, "").trim().toUpperCase();
    if (groupTeams[group]) addStanding(groupStandings, group, home, away, homeScore, awayScore);
  }
  const groupFirst = {};
  const groupSecond = {};
  Object.entries(groupStandings).forEach(([group, standings]) => {
    const sorted = Object.entries(standings).sort((a, b) => b[1].pts - a[1].pts || b[1].gd - a[1].gd || b[1].gf - a[1].gf);
    if (sorted[0]) groupFirst[group] = sorted[0][0];
    if (sorted[1]) groupSecond[group] = sorted[1][0];
  });
  return {
    tips,
    groupFirst,
    groupSecond,
    winner: existing?.winner || "",
    scorer: existing?.scorer || "",
    scorerGoals: existing?.scorerGoals || "",
    syncedAt: new Date().toISOString(),
  };
}

function addStanding(groupStandings, group, home, away, homeScore, awayScore) {
  groupStandings[group] ||= {};
  groupStandings[group][home] ||= { pts: 0, gd: 0, gf: 0 };
  groupStandings[group][away] ||= { pts: 0, gd: 0, gf: 0 };
  groupStandings[group][home].gf += homeScore;
  groupStandings[group][home].gd += homeScore - awayScore;
  groupStandings[group][away].gf += awayScore;
  groupStandings[group][away].gd += awayScore - homeScore;
  if (homeScore > awayScore) groupStandings[group][home].pts += 3;
  else if (homeScore < awayScore) groupStandings[group][away].pts += 3;
  else {
    groupStandings[group][home].pts += 1;
    groupStandings[group][away].pts += 1;
  }
}

function mapTeam(name) {
  const map = {
    Mexico: "Mexiko",
    "South Korea": "Sydkorea",
    "South Africa": "Sydafrika",
    "Czech Republic": "Tjeckien",
    Czechia: "Tjeckien",
    Canada: "Kanada",
    Switzerland: "Schweiz",
    "Bosnia and Herzegovina": "Bosnien",
    Brazil: "Brasilien",
    Morocco: "Marocko",
    Scotland: "Skottland",
    Turkey: "Turkiet",
    Australia: "Australien",
    Germany: "Tyskland",
    "Ivory Coast": "Elfenbenskusten",
    "Côte d'Ivoire": "Elfenbenskusten",
    Curacao: "Curaçao",
    Netherlands: "Nederländerna",
    Sweden: "Sverige",
    Tunisia: "Tunisien",
    Belgium: "Belgien",
    "New Zealand": "Nya Zeeland",
    Egypt: "Egypten",
    Spain: "Spanien",
    "Cape Verde": "Kap Verde",
    "Saudi Arabia": "Saudiarabien",
    France: "Frankrike",
    Iraq: "Irak",
    Norway: "Norge",
    Algeria: "Algeriet",
    Austria: "Österrike",
    "DR Congo": "DR Kongo",
    Croatia: "Kroatien",
  };
  return map[name] || name;
}

function bind(selector, event, handler) {
  const element = document.querySelector(selector);
  if (element) element.addEventListener(event, handler);
}

function clean(value) {
  return String(value || "").toLowerCase().trim();
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
