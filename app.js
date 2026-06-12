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
