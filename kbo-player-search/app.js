const SEARCH_FIELDS = {
  all: { label: "전체 항목", columns: ["선수명", "팀명", "포지션", "생년월일", "등번호", "체격", "출신교", "pcode", "검색어"] },
  name: { label: "선수명", columns: ["선수명"] },
  team: { label: "팀명", columns: ["팀명"] },
  position: { label: "포지션", columns: ["포지션"] },
  birth: { label: "생년월일", columns: ["생년월일"] },
  number: { label: "등번호", columns: ["등번호"] },
  body: { label: "체격", columns: ["체격"] },
  school: { label: "출신교", columns: ["출신교"] },
  keyword: { label: "검색어", columns: ["검색어"] },
};

const SORT_FIELDS = {
  player_id: { label: "ID", column: "player_id" },
  name: { label: "선수명", column: "선수명" },
  team: { label: "팀명", column: "팀명" },
  position: { label: "포지션", column: "포지션" },
  birth: { label: "생년월일", column: "생년월일" },
  number: { label: "등번호", column: "등번호" },
  body: { label: "체격", column: "체격" },
  school: { label: "출신교", column: "출신교" },
};

const state = {
  players: [],
  filtered: [],
  pageItems: [],
  q: "",
  field: "all",
  team: "",
  position: "",
  nameQuery: "",
  schoolQuery: "",
  birthQuery: "",
  sortBy: "player_id",
  sortDir: "asc",
  limit: 50,
  offset: 0,
};

const el = {
  query: document.getElementById("query"),
  field: document.getElementById("field"),
  team: document.getElementById("team"),
  position: document.getElementById("position"),
  nameQuery: document.getElementById("name-query"),
  schoolQuery: document.getElementById("school-query"),
  birthQuery: document.getElementById("birth-query"),
  sortBy: document.getElementById("sort-by"),
  sortDir: document.getElementById("sort-dir"),
  searchBtn: document.getElementById("search-btn"),
  downloadBtn: document.getElementById("download-btn"),
  rows: document.getElementById("rows"),
  empty: document.getElementById("empty"),
  summary: document.getElementById("summary"),
  pageInfo: document.getElementById("page-info"),
  rangeInfo: document.getElementById("range-info"),
  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),
  detail: document.getElementById("detail"),
  detailTitle: document.getElementById("detail-title"),
  detailGrid: document.getElementById("detail-grid"),
  metaTotal: document.getElementById("meta-total"),
  metaTeams: document.getElementById("meta-teams"),
  metaPositions: document.getElementById("meta-positions"),
  statTeams: document.getElementById("stat-teams"),
  statPositions: document.getElementById("stat-positions"),
  statSchools: document.getElementById("stat-schools"),
  headers: Array.from(document.querySelectorAll("th.sortable")),
};

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`, "i");
}

function textIncludes(value, query) {
  return (value || "").toLowerCase().includes(query.toLowerCase());
}

function textMatches(value, query) {
  if (!query) return true;
  if (query.includes("*") || query.includes("?")) {
    return wildcardToRegExp(query).test(value || "");
  }
  return textIncludes(value || "", query);
}

function matchField(player, query, fieldKey) {
  if (!query) return true;
  const columns = (SEARCH_FIELDS[fieldKey] || SEARCH_FIELDS.all).columns;
  return columns.some((column) => textMatches(player[column] || "", query));
}

function buildOptions(select, options, emptyLabel) {
  select.innerHTML = "";
  const base = document.createElement("option");
  base.value = "";
  base.textContent = emptyLabel;
  select.appendChild(base);
  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function buildFixedOptions(select, mapping) {
  select.innerHTML = "";
  Object.entries(mapping).forEach(([key, value]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = value.label;
    select.appendChild(option);
  });
}

function counterTop(players, field, limit = 8) {
  const counts = new Map();
  players.forEach((player) => {
    const key = (player[field] || "").trim();
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")).slice(0, limit);
}

function renderStats(players) {
  const renderList = (target, items) => {
    target.innerHTML = items.length
      ? items.map(([label, count]) => `<li><span>${label}</span><strong>${count}</strong></li>`).join("")
      : "<li><span>결과 없음</span><strong>0</strong></li>";
  };
  renderList(el.statTeams, counterTop(players, "팀명"));
  renderList(el.statPositions, counterTop(players, "포지션"));
  renderList(el.statSchools, counterTop(players, "출신교"));
}

function normalizeSortValue(value, key) {
  const text = (value || "").trim();
  if (key === "player_id") {
    const parsed = Number.parseInt(text, 10);
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
  }
  return text.toLowerCase();
}

function applyFilters() {
  state.filtered = state.players.filter((player) => {
    if (state.team && player["팀명"] !== state.team) return false;
    if (state.position && player["포지션"] !== state.position) return false;
    if (!matchField(player, state.q, state.field)) return false;
    if (!matchField(player, state.nameQuery, "name")) return false;
    if (!matchField(player, state.schoolQuery, "school")) return false;
    if (!matchField(player, state.birthQuery, "birth")) return false;
    return true;
  });

  const sortField = SORT_FIELDS[state.sortBy] || SORT_FIELDS.player_id;
  state.filtered.sort((left, right) => {
    const a = normalizeSortValue(left[sortField.column], sortField.column);
    const b = normalizeSortValue(right[sortField.column], sortField.column);
    if (a < b) return state.sortDir === "asc" ? -1 : 1;
    if (a > b) return state.sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

function syncSortHeaders() {
  el.headers.forEach((header) => {
    const active = header.dataset.sortKey === state.sortBy;
    const arrow = active ? (state.sortDir === "asc" ? " ↑" : " ↓") : "";
    header.classList.toggle("active", active);
    header.textContent = header.dataset.label + arrow;
  });
  el.sortBy.value = state.sortBy;
  el.sortDir.value = state.sortDir;
}

function renderSummary() {
  const fieldLabel = SEARCH_FIELDS[state.field].label;
  const queryLabel = state.q ? `${fieldLabel} "${state.q}"` : "전체";
  const extras = [
    state.team && `팀:${state.team}`,
    state.position && `포지션:${state.position}`,
    state.nameQuery && `선수명:${state.nameQuery}`,
    state.schoolQuery && `출신교:${state.schoolQuery}`,
    state.birthQuery && `생년월일:${state.birthQuery}`,
  ].filter(Boolean);
  el.summary.textContent = `${queryLabel}${extras.length ? " · " + extras.join(" / ") : ""} 검색 결과 ${state.filtered.length.toLocaleString("ko-KR")}건`;
}

function renderPaging() {
  const total = state.filtered.length;
  const from = total === 0 ? 0 : state.offset + 1;
  const to = total === 0 ? 0 : Math.min(total, state.offset + state.limit);
  const currentPage = Math.floor(state.offset / state.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / state.limit));
  el.pageInfo.textContent = `페이지 ${currentPage} / ${totalPages}`;
  el.rangeInfo.textContent = `${from.toLocaleString("ko-KR")}-${to.toLocaleString("ko-KR")} / ${total.toLocaleString("ko-KR")}`;
  el.prevBtn.disabled = state.offset === 0;
  el.nextBtn.disabled = state.offset + state.limit >= total;
}

function renderRows() {
  state.pageItems = state.filtered.slice(state.offset, state.offset + state.limit);
  el.rows.innerHTML = "";
  if (state.pageItems.length === 0) {
    el.empty.hidden = false;
    return;
  }
  el.empty.hidden = true;
  state.pageItems.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.player_id || ""}</td>
      <td><strong>${item["선수명"] || ""}</strong></td>
      <td>${item["팀명"] || ""}</td>
      <td>${item["포지션"] || ""}</td>
      <td>${item["생년월일"] || ""}</td>
      <td>${item["등번호"] || ""}</td>
      <td>${item["체격"] || ""}</td>
      <td>${item["출신교"] || ""}</td>
      <td>${item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer">KBO</a>` : ""}</td>
    `;
    tr.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      openDetail(item);
    });
    el.rows.appendChild(tr);
  });
}

function openDetail(player) {
  const fields = [
    ["ID", player.player_id],
    ["등번호", player["등번호"]],
    ["선수명", player["선수명"]],
    ["팀명", player["팀명"]],
    ["포지션", player["포지션"]],
    ["생년월일", player["생년월일"]],
    ["체격", player["체격"]],
    ["출신교", player["출신교"]],
    ["검색어", player["검색어"]],
    ["pcode", player.pcode],
  ];
  el.detail.hidden = false;
  el.detailTitle.textContent = `${player["선수명"] || ""} · ${player["팀명"] || ""}`;
  el.detailGrid.innerHTML = fields.map(([label, value]) => `
    <div class="detail-item">
      <strong>${label}</strong>
      <div>${value || ""}</div>
    </div>
  `).join("") + (player.url ? `
    <div class="detail-item">
      <strong>KBO 링크</strong>
      <div><a href="${player.url}" target="_blank" rel="noreferrer">원본 페이지 열기</a></div>
    </div>
  ` : "");
}

function renderMeta() {
  el.metaTotal.textContent = `${state.players.length.toLocaleString("ko-KR")}명`;
  el.metaTeams.textContent = counterTop(state.players, "팀명", 5).map(([name, count]) => `${name}(${count})`).join(", ");
  el.metaPositions.textContent = counterTop(state.players, "포지션", 5).map(([name, count]) => `${name}(${count})`).join(", ");
}

function runSearch(resetOffset = false) {
  if (resetOffset) state.offset = 0;
  applyFilters();
  renderMeta();
  renderStats(state.filtered);
  renderSummary();
  renderPaging();
  renderRows();
  syncSortHeaders();
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv() {
  const headers = ["player_id", "등번호", "선수명", "팀명", "포지션", "생년월일", "체격", "출신교", "pcode", "url", "검색어"];
  const lines = [headers.join(",")];
  state.filtered.forEach((row) => {
    lines.push(headers.map((header) => escapeCsv(row[header] || "")).join(","));
  });
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `kbo_player_search_${state.filtered.length}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function hydrateStateFromControls() {
  state.q = el.query.value.trim();
  state.field = el.field.value;
  state.team = el.team.value;
  state.position = el.position.value;
  state.nameQuery = el.nameQuery.value.trim();
  state.schoolQuery = el.schoolQuery.value.trim();
  state.birthQuery = el.birthQuery.value.trim();
  state.sortBy = el.sortBy.value;
  state.sortDir = el.sortDir.value;
}

async function bootstrap() {
  buildFixedOptions(el.field, SEARCH_FIELDS);
  buildFixedOptions(el.sortBy, SORT_FIELDS);
  const response = await fetch("./players.json");
  state.players = await response.json();

  const teams = [...new Set(state.players.map((item) => item["팀명"]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  const positions = [...new Set(state.players.map((item) => item["포지션"]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  buildOptions(el.team, teams, "전체 팀");
  buildOptions(el.position, positions, "전체 포지션");

  el.searchBtn.addEventListener("click", () => {
    hydrateStateFromControls();
    runSearch(true);
  });
  [el.query, el.nameQuery, el.schoolQuery, el.birthQuery].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        hydrateStateFromControls();
        runSearch(true);
      }
    });
  });
  el.prevBtn.addEventListener("click", () => {
    state.offset = Math.max(0, state.offset - state.limit);
    runSearch(false);
  });
  el.nextBtn.addEventListener("click", () => {
    state.offset += state.limit;
    runSearch(false);
  });
  el.downloadBtn.addEventListener("click", downloadCsv);
  el.headers.forEach((header) => {
    header.addEventListener("click", () => {
      const next = header.dataset.sortKey;
      if (state.sortBy === next) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortBy = next;
        state.sortDir = "asc";
      }
      runSearch(false);
    });
  });
  el.sortBy.addEventListener("change", () => {
    hydrateStateFromControls();
    runSearch(true);
  });
  el.sortDir.addEventListener("change", () => {
    hydrateStateFromControls();
    runSearch(true);
  });
  el.team.addEventListener("change", () => {
    hydrateStateFromControls();
    runSearch(true);
  });
  el.position.addEventListener("change", () => {
    hydrateStateFromControls();
    runSearch(true);
  });
  hydrateStateFromControls();
  runSearch(true);
}

bootstrap().catch((error) => {
  console.error(error);
  el.summary.textContent = "데이터 로딩 실패";
});
