const STORAGE_KEY = "engis-budget-projects-v1";
const PERSONNEL_MASTER_KEY = "engis-budget-personnel-masters-v1";

const projectTypes = [
  "중소기업혁신개발사업",
  "해양수산부 R&D",
  "과기정통부 R&D",
  "AI 바우처",
  "ODA",
  "직접입력(기타)",
];

const unitOptions = [
  { value: "천원", factor: 1 },
  { value: "백만원", factor: 1000 },
  { value: "억원", factor: 100000 },
];

const institutionTypeRates = {
  주관기관: 10,
  공동연구기관: 10,
  위탁기관: 25,
  수요기관: 5,
};

const personnelRates = {
  연구책임자: 7000,
  선임연구원: 5500,
  연구원: 4200,
  보조연구원: 2800,
};

const budgetTemplates = {
  "중소기업혁신개발사업": ["인건비", "재료비", "여비", "연구활동비", "연구개발서비스비", "기타", "간접비"],
  "해양수산부 R&D": ["인건비", "재료비", "여비", "연구활동비", "연구개발서비스비", "기타", "간접비"],
  "과기정통부 R&D": ["인건비", "재료비", "여비", "연구활동비", "연구개발서비스비", "기타", "간접비"],
  "AI 바우처": ["인건비", "AI솔루션비", "클라우드/인프라", "여비", "연구활동비", "기타", "간접비"],
  ODA: ["인건비", "현지조사비", "여비", "연구활동비", "전문가활용비", "기타", "간접비"],
  "직접입력(기타)": ["인건비", "재료비", "여비", "연구활동비", "연구개발서비스비", "기타", "간접비"],
};

const steps = [
  { id: "basic", title: "기본 정보", description: "사업 유형, 총액, 참여기관" },
  { id: "budget", title: "비목 설정", description: "기관별 직접비와 간접비" },
  { id: "personnel", title: "인건비 상세", description: "인력/참여율/참여기간" },
  { id: "years", title: "연차 배분", description: "집행 패턴과 연차 합계" },
  { id: "preview", title: "산출표", description: "미리보기와 내보내기" },
];

const heroCopy = {
  basic: ["새 과제 작성", "사업 유형, 전체 재원, 기관별 연구비 구성을 한 번에 정의합니다."],
  budget: ["비목 입력", "기관별 직접비와 자동 간접비를 조정합니다."],
  personnel: ["인건비 계산", "투입 인력을 등록해 인건비를 자동 산정합니다."],
  years: ["연차 배분", "집행 패턴과 연차별 비율을 확정합니다."],
  preview: ["최종 산출표", "전체/기관별/연차별 합계를 점검하고 내보냅니다."],
};

const uiState = {
  personnelAutoAdjustMessages: {},
  personnelLibraryCollapsed: true,
  personnelLibraryDrafts: {},
  personnelLibraryMessage: "",
  activePersonnelInstitutionId: "",
  personnelBudgetLock: {
    active: false,
    targetTotal: 0,
    targetsByInstitution: {},
  },
};
let activeStepIndex = 0;
let state = createEmptyState();

function captureFocusState() {
  const active = document.activeElement;
  if (!active || !(active instanceof HTMLElement)) return null;

  const key =
    active.dataset.bind ||
    active.dataset.money ||
    active.dataset.instName ||
    active.dataset.instType ||
    active.dataset.instGovernmentInput ||
    active.dataset.instPrivateCashInput ||
    active.dataset.instPrivateInkindInput ||
    active.dataset.budgetId ||
    active.dataset.budgetCategory ||
    active.dataset.personName ||
    active.dataset.personGrade ||
    active.dataset.personInst ||
    active.dataset.personRate ||
    active.dataset.personMonths ||
    active.dataset.personSalary ||
    active.dataset.allocationIndex;

  if (!key) return null;

  return {
    tagName: active.tagName,
    type: active.getAttribute("type") || "",
    key,
    value: active.value,
    selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
    selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
  };
}

function restoreFocusState(focusState) {
  if (!focusState) return;

  const selectors = [
    `[data-bind="${focusState.key}"]`,
    `[data-money="${focusState.key}"]`,
    `[data-inst-name="${focusState.key}"]`,
    `[data-inst-type="${focusState.key}"]`,
    `[data-inst-government-input="${focusState.key}"]`,
    `[data-inst-private-cash-input="${focusState.key}"]`,
    `[data-inst-private-inkind-input="${focusState.key}"]`,
    `[data-budget-id="${focusState.key}"]`,
    `[data-budget-category="${focusState.key}"]`,
    `[data-person-name="${focusState.key}"]`,
    `[data-person-grade="${focusState.key}"]`,
    `[data-person-inst="${focusState.key}"]`,
    `[data-person-rate="${focusState.key}"]`,
    `[data-person-months="${focusState.key}"]`,
    `[data-person-salary="${focusState.key}"]`,
    `[data-allocation-index="${focusState.key}"]`,
  ];

  const target = selectors
    .map((selector) => document.querySelector(selector))
    .find((element) => element instanceof HTMLElement);

  if (!target) return;

  target.focus();
  if (
    focusState.selectionStart !== null &&
    focusState.selectionEnd !== null &&
    typeof target.setSelectionRange === "function" &&
    focusState.type !== "number"
  ) {
    target.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
  }
}

function createEmptyState() {
  clearPersonnelBudgetLock();
  return {
    project: {
      id: crypto.randomUUID(),
      name: "",
      type: projectTypes[0],
      totalAmount: 0,
      governmentAmount: 0,
      privateAmount: 0,
      privateCashRatio: 10,
      durationYears: 2,
      unitDisplay: "백만원",
      createdAt: formatLocalDate(),
    },
    institutions: [createInstitution("㈜엔지스", "주관기관", 100)],
    budgetItems: [],
    personnel: [],
    allocation: {
      pattern: "균등 배분",
      percentages: [50, 50],
    },
  };
}

function createInstitution(name = "", type = "공동연구기관", ratio = 0) {
  return {
    id: crypto.randomUUID(),
    name,
    type,
    ratio,
    amount: 0,
    governmentAmount: 0,
    privateCashAmount: 0,
    privateInKindAmount: 0,
    privateAmount: 0,
    privateCashRatio: 10,
    budgetConfigured: false,
    indirectRate: institutionTypeRates[type],
  };
}

function createBudgetItem(institutionId, category) {
  return {
    id: crypto.randomUUID(),
    institutionId,
    category,
    amount: 0,
    auto: category === "인건비" || category === "간접비",
    custom: false,
  };
}

function createCustomBudgetItem(institutionId) {
  return {
    id: crypto.randomUUID(),
    institutionId,
    category: "커스텀 비목",
    amount: 0,
    auto: false,
    custom: true,
  };
}

function createPersonnel(institutionId = getActivePersonnelInstitutionId()) {
  const grade = "연구원";
  return {
    id: crypto.randomUUID(),
    name: generatePersonnelName(grade),
    grade,
    participationRate: 100,
    months: state.project.durationYears * 12,
    baseSalary: personnelRates[grade],
    institutionId,
    fundingSourceAmounts: {
      government: 0,
      privateCash: 0,
      privateInKind: 0,
    },
  };
}

function createPersonnelFromMaster(master) {
  const institutionId = getActivePersonnelInstitutionId();
  return {
    id: crypto.randomUUID(),
    name: master.name || generatePersonnelName(master.grade || "연구원"),
    grade: master.grade || "연구원",
    participationRate: 100,
    months: master.defaultMonths || state.project.durationYears * 12,
    baseSalary: master.baseSalary || personnelRates[master.grade] || personnelRates["연구원"],
    institutionId,
    fundingSourceAmounts: {
      government: 0,
      privateCash: 0,
      privateInKind: 0,
    },
  };
}

function movePersonnel(personId, direction) {
  const index = state.personnel.findIndex((person) => person.id === personId);
  if (index < 0) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= state.personnel.length) return;
  const [moved] = state.personnel.splice(index, 1);
  state.personnel.splice(targetIndex, 0, moved);
}

function generatePersonnelName(grade) {
  const count = state.personnel.filter((person) => person.grade === grade).length + 1;
  return `${grade}${count}`;
}

function clearPersonnelBudgetLock() {
  uiState.personnelBudgetLock = {
    active: false,
    targetTotal: 0,
    targetsByInstitution: {},
  };
  uiState.personnelAutoAdjustMessages = {};
}

function getActivePersonnelInstitutionId() {
  const activeId = uiState.activePersonnelInstitutionId;
  const exists = state.institutions.some((inst) => inst.id === activeId);
  if (exists) return activeId;
  const fallback = state.institutions[0]?.id || "";
  uiState.activePersonnelInstitutionId = fallback;
  return fallback;
}

function loadPersonnelMasters() {
  try {
    return JSON.parse(localStorage.getItem(PERSONNEL_MASTER_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePersonnelMasters(masters) {
  localStorage.setItem(PERSONNEL_MASTER_KEY, JSON.stringify(masters));
}

function startPersonnelMasterEdit(master) {
  uiState.personnelLibraryDrafts[master.id] = {
    name: master.name,
    grade: master.grade,
    baseSalary: master.baseSalary,
    defaultMonths: master.defaultMonths,
  };
}

function stopPersonnelMasterEdit(masterId) {
  delete uiState.personnelLibraryDrafts[masterId];
}

function normalizeName(value) {
  return (value || "").trim();
}

function hasDuplicateName(collection, name, currentId) {
  const normalized = normalizeName(name);
  if (!normalized) return false;
  return collection.some((item) => item.id !== currentId && normalizeName(item.name) === normalized);
}

function isPersonnelMasterAddedToProject(master) {
  const normalized = normalizeName(master.name);
  if (!normalized) return false;
  return state.personnel.some((person) => normalizeName(person.name) === normalized);
}

function createPersonnelMaster() {
  return {
    id: crypto.randomUUID(),
    name: "",
    grade: "연구원",
    baseSalary: personnelRates["연구원"],
    defaultMonths: state.project.durationYears * 12,
  };
}

function normalizePersonnelMaster(master) {
  const grade = Object.keys(personnelRates).includes(master?.grade) ? master.grade : "연구원";
  const parsedSalary = Number(master?.baseSalary);
  const parsedMonths = Number(master?.defaultMonths);
  return {
    id: master?.id || crypto.randomUUID(),
    name: typeof master?.name === "string" ? master.name.trim() : "",
    grade,
    baseSalary: Number.isFinite(parsedSalary) ? parsedSalary : personnelRates[grade],
    defaultMonths: Number.isFinite(parsedMonths) ? clamp(parsedMonths, 1, 84) : 12,
  };
}

function buildPersonnelMastersExport() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    masters: loadPersonnelMasters().map((master) => normalizePersonnelMaster(master)),
  };
}

function downloadPersonnelMasters() {
  const payload = buildPersonnelMastersExport();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `personnel_masters_${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  uiState.personnelLibraryMessage = `${payload.masters.length}개의 인력 기본정보를 JSON으로 저장했습니다.`;
  renderPersonnelLibrary();
}

function importPersonnelMastersFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = JSON.parse(String(reader.result || ""));
      const importedMasters = Array.isArray(raw) ? raw : raw?.masters;
      if (!Array.isArray(importedMasters)) {
        throw new Error("invalid-format");
      }

      const existing = loadPersonnelMasters().map((master) => normalizePersonnelMaster(master));
      const byName = new Map(existing.map((master) => [normalizeName(master.name), master]));
      let importedCount = 0;
      let updatedCount = 0;

      importedMasters
        .map((master) => normalizePersonnelMaster(master))
        .filter((master) => normalizeName(master.name))
        .forEach((master) => {
          const key = normalizeName(master.name);
          const matched = byName.get(key);
          if (matched) {
            matched.grade = master.grade;
            matched.baseSalary = master.baseSalary;
            matched.defaultMonths = master.defaultMonths;
            updatedCount += 1;
            return;
          }
          const next = { ...master, id: crypto.randomUUID() };
          existing.push(next);
          byName.set(key, next);
          importedCount += 1;
        });

      savePersonnelMasters(existing);
      uiState.personnelLibraryMessage = `${importedCount}개 추가, ${updatedCount}개 갱신했습니다.`;
      renderPersonnelLibrary();
    } catch (error) {
      console.error("failed to import personnel masters", error);
      uiState.personnelLibraryMessage = "인력 기본정보 파일을 읽지 못했습니다. JSON 형식을 확인하세요.";
      renderPersonnelLibrary();
    }
  };
  reader.readAsText(file);
}

function getUnitFactor() {
  return unitOptions.find((unit) => unit.value === state.project.unitDisplay)?.factor || 1000;
}

function fromDisplayUnit(value) {
  return Math.round((Number(value) || 0) * getUnitFactor());
}

function toDisplayUnit(value) {
  return ((Number(value) || 0) / getUnitFactor()).toFixed(2).replace(/\.00$/, "");
}

function roundForDisplay(value) {
  return Number(toDisplayUnit(value));
}

function formatCurrency(value, suffix = state.project.unitDisplay) {
  const displayed = roundForDisplay(value).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  return `${displayed} ${suffix}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDiffStatus(diffValue) {
  const roundedDiff = roundForDisplay(diffValue);
  if (Math.abs(roundedDiff) < 0.01) {
    return { label: "일치", className: "ok" };
  }
  if (roundedDiff > 0) {
    return { label: "미달", className: "warn" };
  }
  return { label: "초과", className: "danger" };
}

function syncProjectTotals() {
  const totals = state.institutions.reduce(
    (acc, inst) => {
      acc.government += Number(inst.governmentAmount) || 0;
      acc.privateCash += Number(inst.privateCashAmount) || 0;
      acc.privateInKind += Number(inst.privateInKindAmount) || 0;
      return acc;
    },
    { government: 0, privateCash: 0, privateInKind: 0 },
  );

  state.project.governmentAmount = totals.government;
  state.project.privateAmount = totals.privateCash + totals.privateInKind;
  state.project.totalAmount = state.project.governmentAmount + state.project.privateAmount;
  state.project.privateCashRatio =
    state.project.privateAmount > 0 ? (totals.privateCash / state.project.privateAmount) * 100 : 0;
}

function syncInstitutions() {
  state.institutions.forEach((inst) => {
    const legacyPrivateAmount = Number(inst.privateAmount) || 0;
    const privateCashAmount =
      Number(inst.privateCashAmount) ||
      Math.round(legacyPrivateAmount * ((Number(inst.privateCashRatio) || 0) / 100));
    const privateInKindAmount =
      Number(inst.privateInKindAmount) || Math.max(0, legacyPrivateAmount - privateCashAmount);

    inst.privateCashAmount = privateCashAmount;
    inst.privateInKindAmount = privateInKindAmount;
    inst.privateAmount = privateCashAmount + privateInKindAmount;
    inst.amount = (Number(inst.governmentAmount) || 0) + inst.privateAmount;
    inst.privateCashRatio = inst.privateAmount > 0 ? (privateCashAmount / inst.privateAmount) * 100 : 0;
    inst.indirectRate = 0;
  });
  const projectTotal = state.institutions.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  state.institutions.forEach((inst) => {
    inst.ratio = projectTotal > 0 ? ((Number(inst.amount) || 0) / projectTotal) * 100 : 0;
  });
}

function syncAllocation() {
  const years = clamp(Number(state.project.durationYears) || 1, 1, 7);
  state.project.durationYears = years;
  const current = state.allocation.percentages.slice(0, years);
  while (current.length < years) current.push(0);
  if (state.allocation.pattern === "균등 배분") {
    const equal = Number((100 / years).toFixed(2));
    current.fill(equal);
    current[years - 1] = Number((100 - equal * (years - 1)).toFixed(2));
  } else if (state.allocation.pattern === "전반 집중형") {
    const presets = {
      1: [100],
      2: [55, 45],
      3: [45, 35, 20],
      4: [35, 30, 20, 15],
      5: [30, 25, 20, 15, 10],
      6: [26, 22, 18, 14, 12, 8],
      7: [24, 20, 16, 14, 10, 9, 7],
    };
    state.allocation.percentages = presets[years];
    return;
  } else if (state.allocation.pattern === "후반 집중형") {
    const presets = {
      1: [100],
      2: [45, 55],
      3: [20, 35, 45],
      4: [15, 20, 30, 35],
      5: [10, 15, 20, 25, 30],
      6: [8, 12, 14, 18, 22, 26],
      7: [7, 9, 10, 14, 16, 20, 24],
    };
    state.allocation.percentages = presets[years];
    return;
  }
  state.allocation.percentages = current;
}

function syncBudgetTemplate() {
  const template = budgetTemplates[state.project.type] || budgetTemplates["직접입력(기타)"];
  const institutionIds = new Set(state.institutions.map((institution) => institution.id));
  const existingByKey = new Map(
    state.budgetItems.filter((item) => !item.custom).map((item) => [`${item.institutionId}-${item.category}`, item]),
  );
  const next = [];
  state.institutions.forEach((institution) => {
    template.forEach((category) => {
      const key = `${institution.id}-${category}`;
      const existing = existingByKey.get(key);
      next.push(existing || createBudgetItem(institution.id, category));
    });
  });
  state.budgetItems
    .filter((item) => item.custom && institutionIds.has(item.institutionId))
    .forEach((item) => {
      next.push(item);
    });
  state.budgetItems = next;
  clearPersonnelBudgetLock();
  syncBudgetDerived();
}

function calculatePersonnelAmount(person) {
  return Math.round((Number(person.baseSalary) || 0) * ((Number(person.participationRate) || 0) / 100) * (Number(person.months) || 0));
}

function getPrivateCashAmount() {
  return Math.round((state.project.privateAmount * (Number(state.project.privateCashRatio) || 0)) / 100);
}

function getPrivateInKindAmount() {
  return state.project.privateAmount - getPrivateCashAmount();
}

function getInstitutionPrivateCashAmount(inst) {
  return Number(inst.privateCashAmount) || 0;
}

function getInstitutionPrivateInKindAmount(inst) {
  return Number(inst.privateInKindAmount) || 0;
}

function getInstitutionPersonnelFundingTargets(inst) {
  const personnelTarget = uiState.personnelBudgetLock.targetsByInstitution?.[inst.id] || 0;
  const privateCash = getInstitutionPrivateCashAmount(inst);
  const privateInKind = getInstitutionPrivateInKindAmount(inst);
  return {
    government: personnelTarget - privateCash - privateInKind,
    privateCash,
    privateInKind,
  };
}

function getPersonnelFundingTargets() {
  return state.institutions.reduce(
    (acc, inst) => {
      const targets = getInstitutionPersonnelFundingTargets(inst);
      acc.government += targets.government;
      acc.privateCash += targets.privateCash;
      acc.privateInKind += targets.privateInKind;
      return acc;
    },
    { government: 0, privateCash: 0, privateInKind: 0 },
  );
}

function normalizeFundingSourceAmounts(person) {
  const government = Number(person.fundingSourceAmounts?.government) || 0;
  const privateCash = Number(person.fundingSourceAmounts?.privateCash) || 0;
  const privateInKind = Number(person.fundingSourceAmounts?.privateInKind) || 0;
  return { government, privateCash, privateInKind };
}

function calculatePersonnelFundingAmounts(person) {
  return normalizeFundingSourceAmounts(person);
}

function calculatePersonnelFundingRates(person) {
  const denominator = (Number(person.baseSalary) || 0) * (Number(person.months) || 0);
  const amounts = calculatePersonnelFundingAmounts(person);
  if (!denominator) {
    return { government: 0, privateCash: 0, privateInKind: 0 };
  }
  return {
    government: (amounts.government / denominator) * 100,
    privateCash: (amounts.privateCash / denominator) * 100,
    privateInKind: (amounts.privateInKind / denominator) * 100,
  };
}

function formatPercent(value) {
  return `${Number((Number(value) || 0).toFixed(2)).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}%`;
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function renderPersonnelFundingRateBreakdown(person) {
  const amounts = calculatePersonnelFundingAmounts(person);
  const activeSourceCount = Object.values(amounts).filter((value) => value > 0).length;
  if (activeSourceCount < 2) return "";

  const rates = calculatePersonnelFundingRates(person);
  const entries = [
    ["지원금", amounts.government, rates.government],
    ["민간 현금", amounts.privateCash, rates.privateCash],
    ["민간 현물", amounts.privateInKind, rates.privateInKind],
  ].filter(([, amount]) => amount > 0);

  return `재원별 참여율: ${entries.map(([label, , rate]) => `${label} ${formatPercent(rate)}`).join(" · ")}`;
}

function getPersonnelFundingDifference(person) {
  const total = calculatePersonnelAmount(person);
  const amounts = calculatePersonnelFundingAmounts(person);
  return total - (amounts.government + amounts.privateCash + amounts.privateInKind);
}

function getPersonnelFundingTotals() {
  return state.personnel.reduce(
    (acc, person) => {
      const amounts = calculatePersonnelFundingAmounts(person);
      acc.government += amounts.government;
      acc.privateCash += amounts.privateCash;
      acc.privateInKind += amounts.privateInKind;
      return acc;
    },
    { government: 0, privateCash: 0, privateInKind: 0 },
  );
}

function getPersonnelFundingAllocatedTotal() {
  const totals = getPersonnelFundingTotals();
  return totals.government + totals.privateCash + totals.privateInKind;
}

function getPersonnelFundingTotalsByInstitution(instId) {
  return state.personnel
    .filter((person) => person.institutionId === instId)
    .reduce(
      (acc, person) => {
        const amounts = calculatePersonnelFundingAmounts(person);
        acc.government += amounts.government;
        acc.privateCash += amounts.privateCash;
        acc.privateInKind += amounts.privateInKind;
        return acc;
      },
      { government: 0, privateCash: 0, privateInKind: 0 },
    );
}

function getPersonnelFundingAllocatedTotalByInstitution(instId) {
  const totals = getPersonnelFundingTotalsByInstitution(instId);
  return totals.government + totals.privateCash + totals.privateInKind;
}

function getFundingTargetAmount(sourceKey, institutionId) {
  const institution = state.institutions.find((inst) => inst.id === institutionId);
  const targets = institution ? getInstitutionPersonnelFundingTargets(institution) : getPersonnelFundingTargets();
  if (sourceKey === "government") return targets.government;
  if (sourceKey === "privateCash") return targets.privateCash;
  return targets.privateInKind;
}

function applyPersonnelFundingAutoAmount(personId, sourceKey) {
  const person = state.personnel.find((entry) => entry.id === personId);
  if (!person) return;

  const target = getFundingTargetAmount(sourceKey, person.institutionId);
  const otherTotal = state.personnel
    .filter((entry) => entry.id !== personId && entry.institutionId === person.institutionId)
    .reduce((sum, entry) => sum + (Number(entry.fundingSourceAmounts?.[sourceKey]) || 0), 0);
  const personTotal = calculatePersonnelAmount(person);
  const currentAmounts = calculatePersonnelFundingAmounts(person);
  const otherSourcesTotal =
    sourceKey === "government"
      ? currentAmounts.privateCash + currentAmounts.privateInKind
      : sourceKey === "privateCash"
        ? currentAmounts.government + currentAmounts.privateInKind
        : currentAmounts.government + currentAmounts.privateCash;
  const maxAssignable = Math.max(0, personTotal - otherSourcesTotal);
  const targetRemainder = Math.max(0, target - otherTotal);
  const appliedAmount = Math.min(targetRemainder, maxAssignable);

  person.fundingSourceAmounts[sourceKey] = appliedAmount;
  const label = sourceKey === "government" ? "지원금" : sourceKey === "privateCash" ? "민간 현금" : "민간 현물";
  uiState.personnelAutoAdjustMessages[personId] =
    targetRemainder > maxAssignable
      ? `${label} 자동 계산은 해당 인력 최대치 ${formatCurrency(maxAssignable)}까지만 적용했습니다.`
      : `${label} 금액을 자동 계산했습니다.`;
  refreshPersonnelStepDerived();
}

function getPersonnelTotal() {
  return state.personnel.reduce((sum, person) => sum + calculatePersonnelAmount(person), 0);
}

function lockPersonnelBudgetTargets() {
  const targetsByInstitution = {};
  let targetTotal = 0;

  state.institutions.forEach((institution) => {
    const personnelItem = state.budgetItems.find(
      (item) => item.institutionId === institution.id && item.category === "인건비",
    );
    const amount = personnelItem?.amount || 0;
    targetsByInstitution[institution.id] = amount;
    targetTotal += amount;
  });

  uiState.personnelBudgetLock = {
    active: true,
    targetTotal,
    targetsByInstitution,
  };
  uiState.personnelAutoAdjustMessages = {};
}

function syncBudgetDerived() {
  state.institutions.forEach((institution) => {
    const related = state.budgetItems.filter((item) => item.institutionId === institution.id);
    const nonPersonnelDirectTotal = related
      .filter((item) => item.category !== "인건비" && item.category !== "간접비")
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    related.forEach((item) => {
      if (item.category === "인건비") {
        if (uiState.personnelBudgetLock.active) {
          item.amount = uiState.personnelBudgetLock.targetsByInstitution[institution.id] ?? item.amount;
        } else {
          item.amount = Math.max(0, institution.amount - nonPersonnelDirectTotal);
        }
      }
    });

    related.forEach((item) => {
      if (item.category === "간접비") {
        item.amount = 0;
      }
    });
  });
}

function getProjectTotalFromBudget() {
  return state.budgetItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

function getInstitutionBudgetTotal(instId) {
  return state.budgetItems
    .filter((item) => item.institutionId === instId)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
}

function getValidation() {
  const ratioTotal = state.institutions.reduce((sum, inst) => sum + (Number(inst.ratio) || 0), 0);
  const fundTotal = state.project.governmentAmount + state.project.privateAmount;
  const budgetTotal = getProjectTotalFromBudget();
  const allocationTotal = state.allocation.percentages.reduce((sum, value) => sum + (Number(value) || 0), 0);
  return {
    ratioTotal,
    fundTotal,
    budgetTotal,
    allocationTotal,
    ratioOk: Math.abs(ratioTotal - 100) < 0.01,
    fundOk: Math.abs(fundTotal - state.project.totalAmount) < 1,
    budgetOk: Math.abs(budgetTotal - state.project.totalAmount) < 1,
    allocationOk: Math.abs(allocationTotal - 100) < 0.05,
  };
}

function calculateYearlyRows() {
  const rows = [];
  state.budgetItems.forEach((item) => {
    const yearly = state.allocation.percentages.map((ratio, index) => {
      if (index === state.allocation.percentages.length - 1) {
        const assigned = state.allocation.percentages
          .slice(0, -1)
          .reduce((sum, earlierRatio) => sum + Math.round((item.amount * earlierRatio) / 100), 0);
        return item.amount - assigned;
      }
      return Math.round((item.amount * ratio) / 100);
    });
    rows.push({ ...item, yearly });
  });
  return rows;
}

function render() {
  const focusState = captureFocusState();
  syncInstitutions();
  syncProjectTotals();
  syncAllocation();
  if (!state.budgetItems.length) syncBudgetTemplate();
  syncBudgetDerived();
  renderStepper();
  renderStatusPanel();
  renderSavedProjects();
  renderCurrentStep();
  restoreFocusState(focusState);
}

function renderStepper() {
  const stepper = document.getElementById("stepper");
  stepper.innerHTML = steps
    .map(
      (step, index) => `
        <button class="${index === activeStepIndex ? "active" : ""}" data-step-index="${index}">
          <span class="step-index">${index + 1}</span>
          <span>
            <strong>${step.title}</strong><br />
            <small>${step.description}</small>
          </span>
        </button>
      `,
    )
    .join("");
  stepper.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeStepIndex = Number(button.dataset.stepIndex);
      render();
    });
  });
}

function renderStatusPanel() {
  const validation = getValidation();
  const panel = document.getElementById("statusPanel");
  panel.innerHTML = `
    <div class="status-list">
      ${statusPill(validation.ratioOk, `기관 배분 합계 ${validation.ratioTotal.toFixed(2)}%`)}
      ${statusPill(validation.fundOk, `재원 합계 ${formatCurrency(validation.fundTotal)}`)}
      ${statusPill(validation.budgetOk, `비목 합계 ${formatCurrency(validation.budgetTotal)}`)}
      ${statusPill(validation.allocationOk, `연차 배분 합계 ${validation.allocationTotal.toFixed(2)}%`)}
      <div class="mini-grid">
        <div class="mini-card">
          <strong>${state.project.name || "미입력 과제"}</strong>
          <div class="muted">${state.project.type} · ${state.project.durationYears}년</div>
        </div>
        <div class="mini-card">
          <strong>${formatCurrency(state.project.totalAmount)}</strong>
          <div class="muted">총사업비</div>
        </div>
      </div>
    </div>
  `;
}

function statusPill(ok, text) {
  const level = ok ? "ok" : Math.abs(Number(text.match(/[\d.]+/)?.[0] || 0) - 100) < 5 ? "warn" : "danger";
  return `<div class="status-pill ${level}">${ok ? "정상" : level === "warn" ? "주의" : "오류"} · ${text}</div>`;
}

function renderSavedProjects() {
  const container = document.getElementById("savedProjectList");
  const saved = loadSavedProjects();
  if (!saved.length) {
    container.innerHTML = `<div class="muted">저장된 과제가 없습니다.</div>`;
    return;
  }

  container.innerHTML = saved
    .map(
      (item) => `
        <div class="saved-item">
          <div>
            <strong>${item.project.name || "이름 없는 과제"}</strong>
            <div class="muted">${item.project.type} · 생성 ${item.project.createdAt} · 저장 ${item.savedAt || "-"}</div>
          </div>
          <div class="storage-actions">
            <button class="secondary" data-load-id="${item.saveId}">불러오기</button>
            <button class="ghost" data-delete-id="${item.saveId}">삭제</button>
          </div>
        </div>
      `,
    )
    .join("");

  container.querySelectorAll("[data-load-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = saved.find((entry) => entry.saveId === button.dataset.loadId);
      if (selected) {
        clearPersonnelBudgetLock();
        state = structuredClone(selected);
        delete state.saveId;
        delete state.savedAt;
        activeStepIndex = 0;
        render();
      }
    });
  });

  container.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = saved.filter((entry) => entry.saveId !== button.dataset.deleteId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      renderSavedProjects();
    });
  });
}

function renderCurrentStep() {
  const step = steps[activeStepIndex];
  const content = document.getElementById("stepContent");
  const [title, description] = heroCopy[step.id];
  document.getElementById("heroTitle").textContent = title;
  document.getElementById("heroDescription").textContent = description;
  const template = document.getElementById(`step-template-${step.id}`);
  content.innerHTML = "";
  content.appendChild(template.content.cloneNode(true));

  if (step.id === "basic") renderBasicStep();
  if (step.id === "budget") renderBudgetStep();
  if (step.id === "personnel") renderPersonnelStep();
  if (step.id === "years") renderYearsStep();
  if (step.id === "preview") renderPreviewStep();

  content.appendChild(buildFooterNav());
}

function buildFooterNav() {
  const footer = document.createElement("div");
  footer.className = "footer-nav";
  const prev = document.createElement("button");
  prev.className = "ghost";
  prev.textContent = "이전 단계";
  prev.disabled = activeStepIndex === 0;
  prev.addEventListener("click", () => {
    activeStepIndex = clamp(activeStepIndex - 1, 0, steps.length - 1);
    render();
  });
  const next = document.createElement("button");
  next.className = "primary";
  next.textContent = activeStepIndex === steps.length - 1 ? "처음으로" : "다음 단계";
  next.addEventListener("click", () => {
    activeStepIndex = activeStepIndex === steps.length - 1 ? 0 : activeStepIndex + 1;
    render();
  });
  footer.append(prev, next);
  return footer;
}

function renderBasicStep() {
  const typeSelect = document.querySelector('select[data-bind="project.type"]');
  const unitSelect = document.querySelector('select[data-bind="project.unitDisplay"]');
  typeSelect.innerHTML = projectTypes.map((type) => `<option value="${type}">${type}</option>`).join("");
  unitSelect.innerHTML = unitOptions.map((unit) => `<option value="${unit.value}">${unit.value}</option>`).join("");

  bindBasicInputs();
  renderInstitutionFundingTable();
}

function refreshBasicStepDerived() {
  syncInstitutions();
  syncProjectTotals();
  syncAllocation();
  syncBudgetDerived();
  renderStatusPanel();
  refreshInstitutionFundingTable();
}

function bindBasicInputs() {
  document.querySelectorAll("[data-bind]").forEach((element) => {
    const path = element.dataset.bind.split(".");
    element.value = path[0] === "allocation" ? state.allocation[path[1]] : state.project[path[1]];
    const eventName = element.tagName === "SELECT" ? "change" : "input";
    element.addEventListener(eventName, () => {
      const value = element.type === "number" ? Number(element.value) : element.value;
      if (path[0] === "project") state.project[path[1]] = value;
      else state.allocation[path[1]] = value;

      if (path[1] === "type") {
        syncBudgetTemplate();
        render();
        return;
      }

      if (path[1] === "unitDisplay") {
        render();
        return;
      }

      if (path[1] === "durationYears") {
        syncAllocation();
        state.personnel.forEach((person) => {
          person.months = Math.min(person.months, state.project.durationYears * 12);
        });
        renderStatusPanel();
        return;
      }

      refreshBasicStepDerived();
    });
  });
}

function renderInstitutionFundingTable() {
  const container = document.getElementById("institutionFundingTable");
  if (!container) return;
  const privateCashAmount = getPrivateCashAmount();
  const privateInKindAmount = getPrivateInKindAmount();
  container.innerHTML = `
    <table class="data-table funding-board">
      <thead>
        <tr>
          <th>구분</th>
          <th>기관 유형</th>
          <th>정부지원금</th>
          <th>민간 현금</th>
          <th>민간 현물</th>
          <th>기관 총액</th>
          <th>배분 비율(%)</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr class="row-total">
          <td><strong>전체</strong></td>
          <td>-</td>
          <td>${formatCurrency(state.project.governmentAmount)}</td>
          <td>${formatCurrency(privateCashAmount)}</td>
          <td>${formatCurrency(privateInKindAmount)}</td>
          <td data-total-amount>${formatCurrency(state.project.totalAmount)}</td>
          <td>100.00%</td>
          <td></td>
        </tr>
        ${state.institutions
          .map(
            (inst, index) => `
              <tr>
                <td><input value="${inst.name}" data-inst-name="${inst.id}" type="text" placeholder="기관${index + 1}" /></td>
                <td>
                  <select data-inst-type="${inst.id}">
                    ${Object.keys(institutionTypeRates)
                      .map((type) => `<option value="${type}" ${type === inst.type ? "selected" : ""}>${type}</option>`)
                      .join("")}
                  </select>
                </td>
                <td><input value="${toDisplayUnit(inst.governmentAmount)}" data-inst-government-input="${inst.id}" type="number" min="0" step="0.1" /></td>
                <td><input value="${toDisplayUnit(getInstitutionPrivateCashAmount(inst))}" data-inst-private-cash-input="${inst.id}" type="number" min="0" step="0.1" /></td>
                <td><input value="${toDisplayUnit(getInstitutionPrivateInKindAmount(inst))}" data-inst-private-inkind-input="${inst.id}" type="number" min="0" step="0.1" /></td>
                <td data-inst-amount="${inst.id}">${formatCurrency(inst.amount)}</td>
                <td data-inst-ratio="${inst.id}">${inst.ratio.toFixed(2)}%</td>
                <td><button class="ghost" data-remove-inst="${inst.id}">삭제</button></td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;

  document.getElementById("addInstitutionBtn").addEventListener("click", () => {
    if (state.institutions.length >= 10) return;
    state.institutions.push(createInstitution("", "공동연구기관", 0));
    syncBudgetTemplate();
    render();
  });

  bindInstitutionTable();
  refreshInstitutionFundingTable();
}

function refreshInstitutionFundingTable() {
  syncInstitutions();
  syncProjectTotals();
  syncBudgetDerived();
  renderStatusPanel();

  if (activeStepIndex !== steps.findIndex((step) => step.id === "basic")) return;

  const totalAmountCell = document.querySelector("[data-total-amount]");
  if (totalAmountCell) totalAmountCell.textContent = formatCurrency(state.project.totalAmount);

  state.institutions.forEach((inst) => {
    const governmentInput = document.querySelector(`[data-inst-government-input="${inst.id}"]`);
    const privateCashInput = document.querySelector(`[data-inst-private-cash-input="${inst.id}"]`);
    const privateInKindInput = document.querySelector(`[data-inst-private-inkind-input="${inst.id}"]`);
    const amountCell = document.querySelector(`[data-inst-amount="${inst.id}"]`);
    const ratioCell = document.querySelector(`[data-inst-ratio="${inst.id}"]`);
    if (governmentInput && document.activeElement !== governmentInput) governmentInput.value = toDisplayUnit(inst.governmentAmount);
    if (privateCashInput && document.activeElement !== privateCashInput) {
      privateCashInput.value = toDisplayUnit(getInstitutionPrivateCashAmount(inst));
    }
    if (privateInKindInput && document.activeElement !== privateInKindInput) {
      privateInKindInput.value = toDisplayUnit(getInstitutionPrivateInKindAmount(inst));
    }
    if (amountCell) amountCell.textContent = formatCurrency(inst.amount);
    if (ratioCell) ratioCell.textContent = `${inst.ratio.toFixed(2)}%`;
  });

  const institutionGovernmentTotal = state.institutions.reduce((sum, inst) => sum + (Number(inst.governmentAmount) || 0), 0);
  const institutionPrivateCashTotal = state.institutions.reduce((sum, inst) => sum + getInstitutionPrivateCashAmount(inst), 0);
  const institutionPrivateInKindTotal = state.institutions.reduce((sum, inst) => sum + getInstitutionPrivateInKindAmount(inst), 0);
  const institutionTotal = state.institutions.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  document.getElementById("institutionValidation").innerHTML = `
    <div class="status-list">
      ${Math.abs(institutionTotal - state.project.totalAmount) < 1 ? `<div class="status-pill ok">정상 · 기관별 총액 합계 ${formatCurrency(institutionTotal)}</div>` : `<div class="status-pill danger">오류 · 기관별 총액 합계 ${formatCurrency(institutionTotal)}</div>`}
      ${Math.abs(institutionGovernmentTotal - state.project.governmentAmount) < 1 ? `<div class="status-pill ok">정상 · 기관별 정부지원금 합계 ${formatCurrency(institutionGovernmentTotal)}</div>` : `<div class="status-pill warn">주의 · 기관별 정부지원금 합계 ${formatCurrency(institutionGovernmentTotal)}</div>`}
      ${Math.abs(institutionPrivateCashTotal - getPrivateCashAmount()) < 1 ? `<div class="status-pill ok">정상 · 기관별 민간 현금 합계 ${formatCurrency(institutionPrivateCashTotal)}</div>` : `<div class="status-pill warn">주의 · 기관별 민간 현금 합계 ${formatCurrency(institutionPrivateCashTotal)}</div>`}
      ${Math.abs(institutionPrivateInKindTotal - getPrivateInKindAmount()) < 1 ? `<div class="status-pill ok">정상 · 기관별 민간 현물 합계 ${formatCurrency(institutionPrivateInKindTotal)}</div>` : `<div class="status-pill warn">주의 · 기관별 민간 현물 합계 ${formatCurrency(institutionPrivateInKindTotal)}</div>`}
      <div class="status-pill ok">정보 · 기관 비율 합계 ${state.institutions.reduce((sum, inst) => sum + (Number(inst.ratio) || 0), 0).toFixed(2)}%</div>
    </div>
  `;
}

function bindInstitutionTable() {
  document.querySelectorAll("[data-inst-name]").forEach((input) => {
    input.addEventListener("input", () => {
      const inst = state.institutions.find((item) => item.id === input.dataset.instName);
      if (inst) inst.name = input.value;
      renderStatusPanel();
      renderSavedProjects();
    });
  });

  document.querySelectorAll("[data-inst-type]").forEach((select) => {
    select.addEventListener("input", () => {
      const inst = state.institutions.find((item) => item.id === select.dataset.instType);
      if (inst) {
        inst.type = select.value;
        inst.indirectRate = 0;
      }
      syncBudgetTemplate();
      render();
    });
  });

  document.querySelectorAll("[data-inst-government-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const inst = state.institutions.find((item) => item.id === input.dataset.instGovernmentInput);
      if (inst) inst.governmentAmount = Math.max(0, fromDisplayUnit(input.value));
      clearPersonnelBudgetLock();
      refreshInstitutionFundingTable();
    });
  });

  document.querySelectorAll("[data-inst-private-cash-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const inst = state.institutions.find((item) => item.id === input.dataset.instPrivateCashInput);
      if (inst) inst.privateCashAmount = Math.max(0, fromDisplayUnit(input.value));
      clearPersonnelBudgetLock();
      refreshInstitutionFundingTable();
    });
  });

  document.querySelectorAll("[data-inst-private-inkind-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const inst = state.institutions.find((item) => item.id === input.dataset.instPrivateInkindInput);
      if (inst) inst.privateInKindAmount = Math.max(0, fromDisplayUnit(input.value));
      clearPersonnelBudgetLock();
      refreshInstitutionFundingTable();
    });
  });

  document.querySelectorAll("[data-remove-inst]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.institutions.length === 1) return;
      const instId = button.dataset.removeInst;
      state.institutions = state.institutions.filter((inst) => inst.id !== instId);
      state.personnel = state.personnel.filter((person) => person.institutionId !== instId);
      syncBudgetTemplate();
      render();
    });
  });
}

function renderBudgetStep() {
  const grouped = state.institutions
    .map((inst) => {
      const rows = state.budgetItems.filter((item) => item.institutionId === inst.id);
      return `
        <div class="preview-card budget-card">
          <div class="panel-header">
            <h4>${inst.name || "이름 없는 기관"} <span class="muted">(${inst.type})</span></h4>
            <button class="secondary compact-btn" data-add-custom="${inst.id}">커스텀 추가</button>
          </div>
          <table class="data-table budget-table">
            <thead>
              <tr>
                <th>비목</th>
                <th>금액</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (item) => `
                    <tr>
                      <td>
                        ${
                          item.custom
                            ? `<input type="text" value="${item.category}" data-budget-category="${item.id}" />`
                            : item.category
                        }
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value="${toDisplayUnit(item.amount)}"
                          data-budget-id="${item.id}"
                          ${item.auto ? "disabled" : ""}
                        />
                      </td>
                      <td>${item.auto ? "자동 계산" : item.custom ? "커스텀" : "직접 입력"}</td>
                      <td>${item.custom ? `<button class="ghost compact-btn" data-remove-budget="${item.id}">삭제</button>` : ""}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="inline-status">기관 합계: ${formatCurrency(getInstitutionBudgetTotal(inst.id))}</div>
        </div>
      `;
    })
    .join("");

  document.getElementById("budgetEditor").innerHTML = `<div class="preview-grid">${grouped}</div>`;
  document.getElementById("syncTemplateBtn").addEventListener("click", () => {
    syncBudgetTemplate();
    render();
  });

  document.querySelectorAll("[data-add-custom]").forEach((button) => {
    button.addEventListener("click", () => {
      state.budgetItems.push(createCustomBudgetItem(button.dataset.addCustom));
      render();
    });
  });

  document.querySelectorAll("[data-budget-id]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = state.budgetItems.find((entry) => entry.id === input.dataset.budgetId);
      if (item && !item.auto) item.amount = fromDisplayUnit(input.value);
      clearPersonnelBudgetLock();
      syncBudgetDerived();
      refreshBudgetStepDerived();
    });
  });

  document.querySelectorAll("[data-budget-category]").forEach((input) => {
    input.addEventListener("input", () => {
      const item = state.budgetItems.find((entry) => entry.id === input.dataset.budgetCategory);
      if (item) item.category = input.value || "커스텀 비목";
      renderStatusPanel();
    });
  });

  document.querySelectorAll("[data-remove-budget]").forEach((button) => {
    button.addEventListener("click", () => {
      state.budgetItems = state.budgetItems.filter((item) => item.id !== button.dataset.removeBudget);
      clearPersonnelBudgetLock();
      syncBudgetDerived();
      render();
    });
  });

  const validation = getValidation();
  document.getElementById("budgetValidation").innerHTML = `
    <div class="status-list">
      ${statusPill(validation.budgetOk, `비목 합계 ${formatCurrency(validation.budgetTotal)}`)}
      <div class="mini-card">총사업비 기준: <strong>${formatCurrency(state.project.totalAmount)}</strong></div>
      ${
        validation.budgetOk
          ? `<div class="mini-card">전체 비목 합계가 총사업비와 일치합니다.</div>`
          : `<div class="mini-card">차이: <strong>${formatCurrency(state.project.totalAmount - validation.budgetTotal)}</strong></div>`
      }
    </div>
  `;
}

function refreshBudgetStepDerived() {
  renderStatusPanel();

  if (activeStepIndex !== steps.findIndex((step) => step.id === "budget")) return;

  state.institutions.forEach((inst) => {
    const related = state.budgetItems.filter((item) => item.institutionId === inst.id);
    related.forEach((item) => {
      if (!item.auto) return;
      const input = document.querySelector(`[data-budget-id="${item.id}"]`);
      if (input) input.value = toDisplayUnit(item.amount);
    });

    const cards = Array.from(document.querySelectorAll(".preview-card"));
    const card = cards.find((element) => element.querySelector(`h4`)?.textContent?.includes(inst.name || "이름 없는 기관"));
    const status = card?.querySelector(".inline-status");
    if (status) status.textContent = `기관 합계: ${formatCurrency(getInstitutionBudgetTotal(inst.id))}`;
  });

  const validation = getValidation();
  document.getElementById("budgetValidation").innerHTML = `
    <div class="status-list">
      ${statusPill(validation.budgetOk, `비목 합계 ${formatCurrency(validation.budgetTotal)}`)}
      <div class="mini-card">총사업비 기준: <strong>${formatCurrency(state.project.totalAmount)}</strong></div>
      ${
        validation.budgetOk
          ? `<div class="mini-card">전체 비목 합계가 총사업비와 일치합니다.</div>`
          : `<div class="mini-card">차이: <strong>${formatCurrency(state.project.totalAmount - validation.budgetTotal)}</strong></div>`
      }
    </div>
  `;
}

function renderPersonnelStep() {
  if (!uiState.personnelBudgetLock.active) {
    lockPersonnelBudgetTargets();
  }
  const activeInstitutionId = getActivePersonnelInstitutionId();
  renderPersonnelSummary(activeInstitutionId);
  renderPersonnelLibrary();
  const visiblePersonnel = state.personnel.filter((person) => person.institutionId === activeInstitutionId);
  const countSummary = document.getElementById("personnelCountSummary");
  const activeInstitution = state.institutions.find((inst) => inst.id === activeInstitutionId);
  if (countSummary) {
    const institutionLabel = activeInstitution?.name || activeInstitution?.type || "현재 기관";
    countSummary.textContent = `${institutionLabel} 참여인력 ${visiblePersonnel.length}명 · 전체 ${state.personnel.length}명`;
  }
  const rows = visiblePersonnel
    .map(
      (person, index) => {
        const fundingRateBreakdown = renderPersonnelFundingRateBreakdown(person);
        return `
        <tr>
          <td>
            <div class="storage-actions compact-actions">
              <span class="muted">${index + 1}.</span>
              <input type="text" value="${person.name}" data-person-name="${person.id}" />
            </div>
            <div class="muted" data-person-name-message="${person.id}">${hasDuplicateName(state.personnel, person.name, person.id) ? "같은 이름의 인력이 이미 있습니다." : ""}</div>
            <div class="storage-actions compact-actions">
              <button class="secondary compact-btn icon-btn" data-move-person-up="${person.id}" title="위로 이동">↑</button>
              <button class="secondary compact-btn icon-btn" data-move-person-down="${person.id}" title="아래로 이동">↓</button>
              <button class="secondary compact-btn" data-save-master-person="${person.id}">저장</button>
              <button class="ghost compact-btn" data-remove-person="${person.id}">삭제</button>
            </div>
          </td>
          <td>
            <select data-person-grade="${person.id}">
              ${Object.keys(personnelRates)
                .map((grade) => `<option value="${grade}" ${grade === person.grade ? "selected" : ""}>${grade}</option>`)
                .join("")}
            </select>
          </td>
          <td>
            <div class="storage-actions compact-actions">
              <input type="number" min="0" max="100" step="1" value="${person.participationRate}" data-person-rate="${person.id}" />
              <button class="secondary compact-btn" data-auto-adjust-person="${person.id}">자동</button>
            </div>
            <div class="muted" data-person-auto-message="${person.id}">${uiState.personnelAutoAdjustMessages[person.id] || ""}</div>
          </td>
          <td><input type="number" min="1" max="84" step="1" value="${person.months}" data-person-months="${person.id}" /></td>
          <td><input type="number" min="0" step="1" value="${person.baseSalary}" data-person-salary="${person.id}" /></td>
          <td data-person-amount="${person.id}">${formatCurrency(calculatePersonnelAmount(person))}</td>
          <td>
            <div class="mini-grid compact-funding-grid">
              <label class="compact-source-field">
                <span>지원금</span>
                <div class="compact-source-input">
                  <input type="number" min="0" step="0.1" value="${toDisplayUnit(person.fundingSourceAmounts.government)}" data-person-source-government="${person.id}" />
                  <button class="secondary compact-btn" data-auto-funding-source="${person.id}" data-source-key="government">자동</button>
                </div>
              </label>
              <label class="compact-source-field">
                <span>민간 현금</span>
                <div class="compact-source-input">
                  <input type="number" min="0" step="0.1" value="${toDisplayUnit(person.fundingSourceAmounts.privateCash)}" data-person-source-private-cash="${person.id}" />
                  <button class="secondary compact-btn" data-auto-funding-source="${person.id}" data-source-key="privateCash">자동</button>
                </div>
              </label>
              <label class="compact-source-field">
                <span>민간 현물</span>
                <div class="compact-source-input">
                  <input type="number" min="0" step="0.1" value="${toDisplayUnit(person.fundingSourceAmounts.privateInKind)}" data-person-source-private-inkind="${person.id}" />
                  <button class="secondary compact-btn" data-auto-funding-source="${person.id}" data-source-key="privateInKind">자동</button>
                </div>
              </label>
            </div>
            <div class="muted" data-person-source-message="${person.id}"></div>
            <div class="muted" data-person-source-rate-message="${person.id}">${fundingRateBreakdown}</div>
          </td>
        </tr>
      `;
      },
    )
    .join("");

  document.getElementById("personnelTable").innerHTML = `
    <table class="data-table personnel-table">
      <thead>
        <tr>
          <th>성명</th>
          <th>직급</th>
          <th>참여율(%)</th>
          <th>참여월수</th>
          <th>기준단가(천원)</th>
          <th>산정 인건비</th>
          <th>재원 구성 금액</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  document.getElementById("exportPersonnelBtn").addEventListener("click", () => {
    downloadCsv(
      buildPersonnelCsv(),
      `${safeFilename(state.project.name || "personnel_detail")}_personnel.csv`,
    );
  });

  document.getElementById("clearPersonnelFundingBtn").addEventListener("click", () => {
    state.personnel
      .filter((person) => person.institutionId === activeInstitutionId)
      .forEach((person) => {
        person.fundingSourceAmounts = {
          government: 0,
          privateCash: 0,
          privateInKind: 0,
        };
        uiState.personnelAutoAdjustMessages[person.id] = "";
      });
    refreshPersonnelStepDerived();
  });

  document.getElementById("addPersonnelBtn").addEventListener("click", () => {
    state.personnel.push(createPersonnel(activeInstitutionId));
    render();
  });

  bindPersonnelTable();
}

function getPersonnelTotalByInstitution(instId) {
  return state.personnel
    .filter((person) => person.institutionId === instId)
    .reduce((sum, person) => sum + calculatePersonnelAmount(person), 0);
}

function renderPersonnelSummary(activeInstitutionId) {
  const container = document.getElementById("personnelSummary");
  if (!container) return;

  const activeInstitution = state.institutions.find((inst) => inst.id === activeInstitutionId) || state.institutions[0];
  const total = getPersonnelTotal();
  const targetTotal = uiState.personnelBudgetLock.targetTotal;
  const fundingTotals = getPersonnelFundingTotals();
  const allocatedTotal = getPersonnelFundingAllocatedTotal();
  const fundingTargets = getPersonnelFundingTargets();
  const fundingTargetRows = [
    {
      label: "전체 인건비 배분합계",
      target: targetTotal,
      current: allocatedTotal,
    },
    {
      label: "현재 산정 인건비",
      target: targetTotal,
      current: total,
    },
    {
      label: "지원금",
      target: fundingTargets.government,
      current: fundingTotals.government,
    },
    {
      label: "민간 현금",
      target: fundingTargets.privateCash,
      current: fundingTotals.privateCash,
    },
    {
      label: "민간 현물",
      target: fundingTargets.privateInKind,
      current: fundingTotals.privateInKind,
    },
  ];
  const institutionRows = state.institutions
    .map(
      (inst) => `
        <tr>
          <td>${inst.name || inst.type}</td>
          <td>${formatCurrency(uiState.personnelBudgetLock.targetsByInstitution[inst.id] || 0)}</td>
          <td>${formatCurrency(getPersonnelTotalByInstitution(inst.id))}</td>
          <td>${formatCurrency((uiState.personnelBudgetLock.targetsByInstitution[inst.id] || 0) - getPersonnelTotalByInstitution(inst.id))}</td>
        </tr>
      `,
    )
    .join("");

  const institutionTarget = uiState.personnelBudgetLock.targetsByInstitution[activeInstitution.id] || 0;
  const institutionCurrent = getPersonnelTotalByInstitution(activeInstitution.id);
  const institutionFundingTotals = getPersonnelFundingTotalsByInstitution(activeInstitution.id);
  const institutionFundingTargets = getInstitutionPersonnelFundingTargets(activeInstitution);
  const institutionAllocatedTotal = getPersonnelFundingAllocatedTotalByInstitution(activeInstitution.id);
  const institutionRowsDetailed = [
    { label: "기관 인건비 배분합계", target: institutionTarget, current: institutionAllocatedTotal },
    { label: "기관 산정 인건비", target: institutionTarget, current: institutionCurrent },
    { label: "지원금", target: institutionFundingTargets.government, current: institutionFundingTotals.government },
    { label: "민간 현금", target: institutionFundingTargets.privateCash, current: institutionFundingTotals.privateCash },
    { label: "민간 현물", target: institutionFundingTargets.privateInKind, current: institutionFundingTotals.privateInKind },
  ];

  container.innerHTML = `
    <div class="preview-card compact-summary-card personnel-tabs-card">
      <div class="personnel-tabs">
        ${state.institutions
          .map((inst) => {
            const diff = (uiState.personnelBudgetLock.targetsByInstitution[inst.id] || 0) - getPersonnelTotalByInstitution(inst.id);
            const status = getDiffStatus(diff);
            return `
              <button class="personnel-tab ${inst.id === activeInstitution.id ? "active" : ""}" data-personnel-tab="${inst.id}">
                <strong>${inst.name || inst.type}</strong>
                <span class="summary-status ${status.className}">${status.label}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
    <div class="preview-card compact-summary-card">
      <h4>${activeInstitution.name || activeInstitution.type} 인건비 목표 대비</h4>
      <table class="data-table compact-summary-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>목표</th>
            <th>현재</th>
            <th>차이</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          ${institutionRowsDetailed
            .map((row) => {
              const diffValue = row.target - row.current;
              const status = getDiffStatus(diffValue);
              return `
                <tr>
                  <td>${row.label}</td>
                  <td>${formatCurrency(row.target)}</td>
                  <td>${formatCurrency(row.current)}</td>
                  <td>${formatCurrency(diffValue)}</td>
                  <td><span class="summary-status ${status.className}">${status.label}</span></td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="preview-card compact-summary-card">
      <h4>인건비 재원 목표 대비 현황</h4>
      <table class="data-table compact-summary-table">
        <thead>
          <tr>
            <th>구분</th>
            <th>목표</th>
            <th>현재 합계</th>
            <th>차이</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          ${fundingTargetRows
            .map((row) => {
              const diffValue = row.target - row.current;
              const status = getDiffStatus(diffValue);
              return `
                <tr>
                  <td>${row.label}</td>
                  <td>${formatCurrency(row.target)}</td>
                  <td>${formatCurrency(row.current)}</td>
                  <td>${formatCurrency(diffValue)}</td>
                  <td><span class="summary-status ${status.className}">${status.label}</span></td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="preview-card compact-summary-card">
      <h4>기관별 인건비 목표 대비</h4>
      <table class="data-table compact-summary-table">
        <thead>
          <tr>
            <th>기관</th>
            <th>목표</th>
            <th>현재 합계</th>
            <th>차이</th>
          </tr>
        </thead>
        <tbody>
          ${institutionRows}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll("[data-personnel-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      uiState.activePersonnelInstitutionId = button.dataset.personnelTab;
      renderPersonnelStep();
      refreshPersonnelStepDerived();
    });
  });
}

function renderPersonnelLibrary() {
  const container = document.getElementById("personnelLibrary");
  if (!container) return;

  const masters = loadPersonnelMasters();
  const collapsed = uiState.personnelLibraryCollapsed;
  container.innerHTML = `
    <div class="panel-header">
      <div>
        <h3>인력 기본정보</h3>
        <p class="muted">자주 쓰는 인력을 등록해두고 과제 인력으로 바로 추가할 수 있습니다.</p>
      </div>
      <div class="storage-actions">
        <button id="togglePersonnelLibraryBtn" class="secondary">${collapsed ? "펼치기" : "접기"}</button>
        <button id="exportPersonnelMastersBtn" class="secondary">기본정보 저장</button>
        <button id="importPersonnelMastersBtn" class="secondary">기본정보 불러오기</button>
        ${collapsed ? "" : '<button id="addPersonnelMasterBtn" class="secondary">기본정보 추가</button>'}
      </div>
    </div>
    <input id="importPersonnelMastersInput" type="file" accept="application/json,.json" hidden />
    ${
      collapsed
        ? `<div class="muted">현재 ${masters.length}개의 인력 기본정보가 저장되어 있습니다.</div>`
        : masters.length
        ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>직급</th>
                <th>기준단가(천원)</th>
                <th>기본 참여월수</th>
                <th>과제 추가 상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${masters
                .map(
                  (master) => `
                    ${(() => {
                      const draft = uiState.personnelLibraryDrafts[master.id];
                      const editing = Boolean(draft);
                      const row = editing ? draft : master;
                      const added = isPersonnelMasterAddedToProject(master);
                      return `
                    <tr>
                      <td>
                        <input type="text" value="${row.name}" data-master-name="${master.id}" ${editing ? "" : "readonly"} />
                        <div class="muted" data-master-name-message="${master.id}">${hasDuplicateName(masters, row.name, master.id) ? "같은 이름의 기본정보가 이미 있습니다." : ""}</div>
                      </td>
                      <td>
                        <select data-master-grade="${master.id}" ${editing ? "" : "disabled"}>
                          ${Object.keys(personnelRates)
                            .map((grade) => `<option value="${grade}" ${grade === row.grade ? "selected" : ""}>${grade}</option>`)
                            .join("")}
                        </select>
                      </td>
                      <td><input type="number" min="0" step="1" value="${row.baseSalary}" data-master-salary="${master.id}" ${editing ? "" : "readonly"} /></td>
                      <td><input type="number" min="1" max="84" step="1" value="${row.defaultMonths}" data-master-months="${master.id}" ${editing ? "" : "readonly"} /></td>
                      <td>${added ? '<span class="status-pill ok">추가됨</span>' : '<span class="status-pill warn">미추가</span>'}</td>
                      <td>
                        <div class="storage-actions compact-actions row-actions">
                          <button class="secondary compact-btn" data-use-master="${master.id}">${added ? "다시 추가" : "추가"}</button>
                          ${
                            editing
                              ? `<button class="secondary compact-btn" data-save-master="${master.id}">저장</button>
                                 <button class="ghost compact-btn" data-cancel-master="${master.id}">취소</button>`
                              : `<button class="secondary compact-btn" data-edit-master="${master.id}">수정</button>`
                          }
                          <button class="ghost compact-btn" data-delete-master="${master.id}">삭제</button>
                        </div>
                      </td>
                    </tr>
                  `;
                    })()}
                  `,
                )
                .join("")}
            </tbody>
          </table>
        `
        : `<div class="muted">등록된 인력 기본정보가 없습니다.</div>`
    }
    ${uiState.personnelLibraryMessage ? `<div class="muted">${uiState.personnelLibraryMessage}</div>` : ""}
  `;

  document.getElementById("togglePersonnelLibraryBtn")?.addEventListener("click", () => {
    uiState.personnelLibraryCollapsed = !uiState.personnelLibraryCollapsed;
    renderPersonnelLibrary();
  });

  document.getElementById("exportPersonnelMastersBtn")?.addEventListener("click", () => {
    downloadPersonnelMasters();
  });

  document.getElementById("importPersonnelMastersBtn")?.addEventListener("click", () => {
    document.getElementById("importPersonnelMastersInput")?.click();
  });

  document.getElementById("importPersonnelMastersInput")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    importPersonnelMastersFromFile(file);
    event.target.value = "";
  });

  document.getElementById("addPersonnelMasterBtn")?.addEventListener("click", () => {
    const newMaster = createPersonnelMaster();
    const mastersNext = [...loadPersonnelMasters(), newMaster];
    savePersonnelMasters(mastersNext);
    startPersonnelMasterEdit(newMaster);
    renderPersonnelLibrary();
  });

  if (!collapsed) bindPersonnelLibrary();
}

function bindPersonnelLibrary() {
  document.querySelectorAll("[data-master-name], [data-master-grade], [data-master-salary], [data-master-months]").forEach((input) => {
    input.addEventListener("input", () => {
      const id =
        input.dataset.masterName ||
        input.dataset.masterGrade ||
        input.dataset.masterSalary ||
        input.dataset.masterMonths;
      const masters = loadPersonnelMasters();
      const master = masters.find((item) => item.id === id);
      if (!master) return;
      const draft = uiState.personnelLibraryDrafts[id];
      if (!draft) return;
      if (input.dataset.masterName) draft.name = input.value;
      if (input.dataset.masterGrade) {
        draft.grade = input.value;
        draft.baseSalary = personnelRates[input.value];
        const salaryInput = document.querySelector(`[data-master-salary="${id}"]`);
        if (salaryInput) salaryInput.value = draft.baseSalary;
      }
      if (input.dataset.masterSalary) draft.baseSalary = Number(input.value) || 0;
      if (input.dataset.masterMonths) draft.defaultMonths = Number(input.value) || 0;
      const messageEl = document.querySelector(`[data-master-name-message="${id}"]`);
      if (messageEl) {
        messageEl.textContent = hasDuplicateName(masters, draft.name, id) ? "같은 이름의 기본정보가 이미 있습니다." : "";
      }
    });
  });

  document.querySelectorAll("[data-edit-master]").forEach((button) => {
    button.addEventListener("click", () => {
      const master = loadPersonnelMasters().find((item) => item.id === button.dataset.editMaster);
      if (!master) return;
      startPersonnelMasterEdit(master);
      renderPersonnelLibrary();
    });
  });

  document.querySelectorAll("[data-save-master]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.saveMaster;
      const draft = uiState.personnelLibraryDrafts[id];
      if (!draft) return;
      const masters = loadPersonnelMasters();
      const master = masters.find((item) => item.id === id);
      if (!master) return;
      master.name = draft.name;
      master.grade = draft.grade;
      master.baseSalary = draft.baseSalary;
      master.defaultMonths = draft.defaultMonths;
      savePersonnelMasters(masters);
      stopPersonnelMasterEdit(id);
      renderPersonnelLibrary();
    });
  });

  document.querySelectorAll("[data-cancel-master]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.cancelMaster;
      const master = loadPersonnelMasters().find((item) => item.id === id);
      stopPersonnelMasterEdit(id);
      if (master && !master.name) {
        const mastersNext = loadPersonnelMasters().filter((item) => item.id !== id);
        savePersonnelMasters(mastersNext);
      }
      renderPersonnelLibrary();
    });
  });

  document.querySelectorAll("[data-use-master]").forEach((button) => {
    button.addEventListener("click", () => {
      const master = loadPersonnelMasters().find((item) => item.id === button.dataset.useMaster);
      if (!master) return;
      state.personnel.push(createPersonnelFromMaster(master));
      render();
    });
  });

  document.querySelectorAll("[data-delete-master]").forEach((button) => {
    button.addEventListener("click", () => {
      stopPersonnelMasterEdit(button.dataset.deleteMaster);
      const mastersNext = loadPersonnelMasters().filter((item) => item.id !== button.dataset.deleteMaster);
      savePersonnelMasters(mastersNext);
      renderPersonnelLibrary();
    });
  });
}
function applyPersonnelTargetAdjustment(personId) {
  const person = state.personnel.find((entry) => entry.id === personId);
  if (!person) {
    return;
  }

  const currentPersonAmount = calculatePersonnelAmount(person);
  const monthlyCapacity = (Number(person.baseSalary) || 0) * (Number(person.months) || 0);
  if (!monthlyCapacity) {
    uiState.personnelAutoAdjustMessages[person.id] = "기준단가와 참여월수가 0보다 커야 합니다.";
    refreshPersonnelStepDerived();
    return;
  }

  const target = uiState.personnelBudgetLock.targetsByInstitution[person.institutionId] || 0;
  const otherPersonnelAmount = getPersonnelTotalByInstitution(person.institutionId) - currentPersonAmount;
  const requiredPersonAmount = target - otherPersonnelAmount;

  const rawRate = (requiredPersonAmount / monthlyCapacity) * 100;
  const clampedRate = Number(clamp(rawRate, 0, 100).toFixed(2));
  person.participationRate = clampedRate;

  if (rawRate < 0 || rawRate > 100) {
    uiState.personnelAutoAdjustMessages[person.id] = `필요 참여율 ${rawRate.toFixed(2)}%가 범위를 벗어나 ${clampedRate}%로 보정했습니다.`;
  } else {
    uiState.personnelAutoAdjustMessages[person.id] = `${person.name} 참여율을 ${clampedRate}%로 자동 조정했습니다.`;
  }
  refreshPersonnelStepDerived();
}

function refreshPersonnelStepDerived() {
  syncBudgetDerived();
  renderStatusPanel();
  renderPersonnelSummary(getActivePersonnelInstitutionId());

  if (activeStepIndex !== steps.findIndex((step) => step.id === "personnel")) return;

  const activeInstitutionId = getActivePersonnelInstitutionId();
  const visiblePersonnel = state.personnel.filter((person) => person.institutionId === activeInstitutionId);

  visiblePersonnel.forEach((person) => {
    const amountCell = document.querySelector(`[data-person-amount="${person.id}"]`);
    if (amountCell) amountCell.textContent = formatCurrency(calculatePersonnelAmount(person));

    const rateInput = document.querySelector(`[data-person-rate="${person.id}"]`);
    if (rateInput && document.activeElement !== rateInput) rateInput.value = person.participationRate;

    const monthsInput = document.querySelector(`[data-person-months="${person.id}"]`);
    if (monthsInput && document.activeElement !== monthsInput) monthsInput.value = person.months;

    const salaryInput = document.querySelector(`[data-person-salary="${person.id}"]`);
    if (salaryInput && document.activeElement !== salaryInput) salaryInput.value = person.baseSalary;
  });

  document.querySelectorAll("[data-person-auto-message]").forEach((element) => {
    const message = uiState.personnelAutoAdjustMessages[element.dataset.personAutoMessage] || "";
    element.textContent = message;
  });

  document.querySelectorAll("[data-person-name-message]").forEach((element) => {
    const person = state.personnel.find((item) => item.id === element.dataset.personNameMessage);
    element.textContent = person && hasDuplicateName(state.personnel, person.name, person.id) ? "같은 이름의 인력이 이미 있습니다." : "";
  });

  document.querySelectorAll("[data-person-source-message]").forEach((element) => {
    const person = state.personnel.find((item) => item.id === element.dataset.personSourceMessage);
    if (!person) return;
    const diff = getPersonnelFundingDifference(person);
    if (Math.abs(diff) < 1) {
      element.textContent = "재원 배분 합계가 산정 인건비와 일치합니다.";
      return;
    }
    element.textContent = `재원 배분 합계가 산정 인건비와 ${formatCurrency(diff)} 차이납니다.`;
  });

  document.querySelectorAll("[data-person-source-rate-message]").forEach((element) => {
    const person = state.personnel.find((item) => item.id === element.dataset.personSourceRateMessage);
    element.textContent = person ? renderPersonnelFundingRateBreakdown(person) : "";
  });

  document.querySelectorAll("[data-person-source-government]").forEach((input) => {
    const person = state.personnel.find((item) => item.id === input.dataset.personSourceGovernment);
    if (person) input.value = toDisplayUnit(person.fundingSourceAmounts.government);
  });

  document.querySelectorAll("[data-person-source-private-cash]").forEach((input) => {
    const person = state.personnel.find((item) => item.id === input.dataset.personSourcePrivateCash);
    if (person) input.value = toDisplayUnit(person.fundingSourceAmounts.privateCash);
  });

  document.querySelectorAll("[data-person-source-private-inkind]").forEach((input) => {
    const person = state.personnel.find((item) => item.id === input.dataset.personSourcePrivateInkind);
    if (person) input.value = toDisplayUnit(person.fundingSourceAmounts.privateInKind);
  });
}

function bindPersonnelTable() {
  document.querySelectorAll("[data-person-name]").forEach((input) => {
    input.addEventListener("input", () => {
      const person = state.personnel.find((item) => item.id === input.dataset.personName);
      if (person) person.name = input.value;
      renderStatusPanel();
    });
  });

  document.querySelectorAll("[data-person-grade]").forEach((select) => {
    select.addEventListener("input", () => {
      const person = state.personnel.find((item) => item.id === select.dataset.personGrade);
      if (person) {
        person.grade = select.value;
        person.baseSalary = personnelRates[select.value];
      }
      renderPersonnelStep();
      refreshPersonnelStepDerived();
    });
  });

  document.querySelectorAll("[data-person-inst]").forEach((select) => {
    select.addEventListener("input", () => {
      const person = state.personnel.find((item) => item.id === select.dataset.personInst);
      if (person) person.institutionId = select.value;
      renderPersonnelStep();
      refreshPersonnelStepDerived();
    });
  });

  document.querySelectorAll("[data-person-rate], [data-person-months], [data-person-salary]").forEach((input) => {
    input.addEventListener("input", () => {
      const id = input.dataset.personRate || input.dataset.personMonths || input.dataset.personSalary;
      const person = state.personnel.find((item) => item.id === id);
      if (!person) return;
      if (input.dataset.personRate) person.participationRate = Number(input.value) || 0;
      if (input.dataset.personMonths) person.months = Number(input.value) || 0;
      if (input.dataset.personSalary) person.baseSalary = Number(input.value) || 0;
      uiState.personnelAutoAdjustMessages[id] = "";
      refreshPersonnelStepDerived();
    });
  });

  document
    .querySelectorAll("[data-person-source-government], [data-person-source-private-cash], [data-person-source-private-inkind]")
    .forEach((input) => {
      input.addEventListener("input", () => {
        const id =
          input.dataset.personSourceGovernment ||
          input.dataset.personSourcePrivateCash ||
          input.dataset.personSourcePrivateInkind;
        const person = state.personnel.find((item) => item.id === id);
        if (!person) return;
        if (input.dataset.personSourceGovernment) person.fundingSourceAmounts.government = fromDisplayUnit(input.value);
        if (input.dataset.personSourcePrivateCash) person.fundingSourceAmounts.privateCash = fromDisplayUnit(input.value);
        if (input.dataset.personSourcePrivateInkind) person.fundingSourceAmounts.privateInKind = fromDisplayUnit(input.value);
        refreshPersonnelStepDerived();
      });
    });

  document.querySelectorAll("[data-auto-funding-source]").forEach((button) => {
    button.addEventListener("click", () => {
      applyPersonnelFundingAutoAmount(button.dataset.autoFundingSource, button.dataset.sourceKey);
    });
  });

  document.querySelectorAll("[data-auto-adjust-person]").forEach((button) => {
    button.addEventListener("click", () => {
      applyPersonnelTargetAdjustment(button.dataset.autoAdjustPerson);
    });
  });

  document.querySelectorAll("[data-save-master-person]").forEach((button) => {
    button.addEventListener("click", () => {
      const person = state.personnel.find((entry) => entry.id === button.dataset.saveMasterPerson);
      if (!person) return;
      const masters = loadPersonnelMasters();
      masters.push({
        id: crypto.randomUUID(),
        name: person.name,
        grade: person.grade,
        baseSalary: person.baseSalary,
        defaultMonths: person.months,
      });
      savePersonnelMasters(masters);
      renderPersonnelLibrary();
      uiState.personnelAutoAdjustMessages[person.id] = "인력 기본정보로 저장했습니다.";
      refreshPersonnelStepDerived();
    });
  });

  document.querySelectorAll("[data-move-person-up]").forEach((button) => {
    button.addEventListener("click", () => {
      movePersonnel(button.dataset.movePersonUp, "up");
      render();
    });
  });

  document.querySelectorAll("[data-move-person-down]").forEach((button) => {
    button.addEventListener("click", () => {
      movePersonnel(button.dataset.movePersonDown, "down");
      render();
    });
  });

  document.querySelectorAll("[data-remove-person]").forEach((button) => {
    button.addEventListener("click", () => {
      state.personnel = state.personnel.filter((person) => person.id !== button.dataset.removePerson);
      delete uiState.personnelAutoAdjustMessages[button.dataset.removePerson];
      syncBudgetDerived();
      render();
    });
  });
}

function renderYearsStep() {
  const select = document.querySelector('select[data-bind="allocation.pattern"]');
  select.innerHTML = ["균등 배분", "전반 집중형", "후반 집중형", "직접 입력"]
    .map((pattern) => `<option value="${pattern}" ${pattern === state.allocation.pattern ? "selected" : ""}>${pattern}</option>`)
    .join("");

  bindBasicInputs();
  const editor = document.getElementById("allocationEditor");
  editor.innerHTML = `
    <div class="allocation-grid">
      ${state.allocation.percentages
        .map(
          (ratio, index) => `
            <div class="allocation-chip">
              <strong>${index + 1}년차</strong>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value="${ratio}"
                data-allocation-index="${index}"
                ${state.allocation.pattern !== "직접 입력" ? "disabled" : ""}
              />
            </div>
          `,
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll("[data-allocation-index]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.allocationIndex);
      state.allocation.percentages[index] = Number(input.value) || 0;
      render();
    });
  });

  const yearlyTotals = calculateYearlyRows().reduce((acc, row) => {
    row.yearly.forEach((value, index) => {
      acc[index] = (acc[index] || 0) + value;
    });
    return acc;
  }, []);

  const validation = getValidation();
  document.getElementById("allocationValidation").innerHTML = `
    <div class="status-list">
      ${statusPill(validation.allocationOk, `연차 합계 ${validation.allocationTotal.toFixed(2)}%`)}
      ${yearlyTotals
        .map((total, index) => `<div class="mini-card">${index + 1}년차 배분액: <strong>${formatCurrency(total)}</strong></div>`)
        .join("")}
    </div>
  `;
}

function renderPreviewStep() {
  const rows = calculateYearlyRows();
  const overallTable = `
    <div class="preview-card">
      <h4>전체 비목 연차표</h4>
      <table class="data-table">
        <thead>
          <tr>
            <th>기관</th>
            <th>비목</th>
            ${state.allocation.percentages.map((_, index) => `<th>${index + 1}년차</th>`).join("")}
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => {
              const inst = state.institutions.find((item) => item.id === row.institutionId);
              return `
                <tr>
                  <td>${inst?.name || "-"}</td>
                  <td>${row.category}</td>
                  ${row.yearly.map((value) => `<td>${formatCurrency(value)}</td>`).join("")}
                  <td>${formatCurrency(row.amount)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  const institutionTable = `
    <div class="preview-card">
      <h4>기관별 요약</h4>
      <table class="data-table">
        <thead>
          <tr>
            <th>기관명</th>
            <th>유형</th>
            <th>배분비율</th>
            <th>정부지원금</th>
            <th>민간부담금</th>
            <th>기관 총액</th>
            <th>비목 합계</th>
          </tr>
        </thead>
        <tbody>
          ${state.institutions
            .map(
              (inst) => `
                <tr>
                  <td>${inst.name || "-"}</td>
                  <td>${inst.type}</td>
                  <td>${inst.ratio}%</td>
                  <td>${formatCurrency(inst.governmentAmount)}</td>
                  <td>${formatCurrency(inst.privateAmount)}</td>
                  <td>${formatCurrency(inst.amount)}</td>
                  <td>${formatCurrency(getInstitutionBudgetTotal(inst.id))}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  const validation = getValidation();
  const summary = `
    <div class="preview-card">
      <h4>최종 검증</h4>
      <div class="status-list">
        ${statusPill(validation.ratioOk, `기관 비율 ${validation.ratioTotal.toFixed(2)}%`)}
        ${statusPill(validation.fundOk, `재원 합계 ${formatCurrency(validation.fundTotal)}`)}
        ${statusPill(validation.budgetOk, `비목 합계 ${formatCurrency(validation.budgetTotal)}`)}
      </div>
    </div>
  `;

  document.getElementById("previewTables").innerHTML = `<div class="preview-grid">${summary}${institutionTable}${overallTable}</div>`;

  document.getElementById("exportSummaryBtn").addEventListener("click", () => {
    downloadCsv(buildSummaryCsv(rows), `${safeFilename(state.project.name || "budget_summary")}.csv`);
  });
  document.getElementById("exportInstitutionBtn").addEventListener("click", () => {
    downloadCsv(buildInstitutionCsv(), `${safeFilename(state.project.name || "institution_summary")}_institutions.csv`);
  });
}

function buildSummaryCsv(rows) {
  const header = ["기관", "비목", ...state.allocation.percentages.map((_, index) => `${index + 1}년차`), "합계"];
  const lines = rows.map((row) => {
    const inst = state.institutions.find((item) => item.id === row.institutionId);
    return [
      inst?.name || "",
      row.category,
      ...row.yearly.map((value) => toDisplayUnit(value)),
      toDisplayUnit(row.amount),
    ];
  });
  return [header, ...lines].map((line) => line.join(",")).join("\n");
}

function buildInstitutionCsv() {
  const header = ["기관명", "기관유형", "배분비율", "정부지원금", "민간부담금", "민간현금", "민간현물", "기관총액", "비목합계", "간접비율"];
  const lines = state.institutions.map((inst) => [
    inst.name || "",
    inst.type,
    inst.ratio,
    toDisplayUnit(inst.governmentAmount),
    toDisplayUnit(inst.privateAmount),
    toDisplayUnit(getInstitutionPrivateCashAmount(inst)),
    toDisplayUnit(getInstitutionPrivateInKindAmount(inst)),
    toDisplayUnit(inst.amount),
    toDisplayUnit(getInstitutionBudgetTotal(inst.id)),
    inst.indirectRate,
  ]);
  return [header, ...lines].map((line) => line.join(",")).join("\n");
}

function buildPersonnelCsv() {
  const fundingTargets = getPersonnelFundingTargets();
  const summaryHeader = ["구분", "값"];
  const summaryLines = [
    ["과제명", state.project.name || ""],
    ["사업유형", state.project.type],
    ["표시단위", state.project.unitDisplay],
    ["정부지원금", toDisplayUnit(state.project.governmentAmount)],
    ["민간부담금", toDisplayUnit(state.project.privateAmount)],
    ["민간부담금 현금", toDisplayUnit(getPrivateCashAmount())],
    ["민간부담금 현물", toDisplayUnit(getPrivateInKindAmount())],
    ["현재 인건비 합계", toDisplayUnit(getPersonnelTotal())],
    ["고정 목표 인건비", toDisplayUnit(uiState.personnelBudgetLock.targetTotal)],
    ["인건비 목표 지원금", toDisplayUnit(fundingTargets.government)],
    ["인건비 목표 민간 현금", toDisplayUnit(fundingTargets.privateCash)],
    ["인건비 목표 민간 현물", toDisplayUnit(fundingTargets.privateInKind)],
    ["차이", toDisplayUnit(uiState.personnelBudgetLock.targetTotal - getPersonnelTotal())],
  ];

  const institutionHeader = ["기관명", "기관유형", "현재 인건비", "목표 인건비"];
  const institutionLines = state.institutions.map((inst) => [
    inst.name || "",
    inst.type,
    toDisplayUnit(getPersonnelTotalByInstitution(inst.id)),
    toDisplayUnit(uiState.personnelBudgetLock.targetsByInstitution[inst.id] || 0),
  ]);

  const personnelHeader = [
    "기관명",
    "성명",
    "직급",
    "참여율(%)",
    "참여월수",
    "기준단가(천원)",
    `산정 인건비(${state.project.unitDisplay})`,
    `지원금(${state.project.unitDisplay})`,
    `민간 현금(${state.project.unitDisplay})`,
    `민간 현물(${state.project.unitDisplay})`,
  ];
  const personnelLines = state.personnel.map((person) => {
    const inst = state.institutions.find((entry) => entry.id === person.institutionId);
    const fundingAmounts = calculatePersonnelFundingAmounts(person);
    return [
      inst?.name || "",
      person.name,
      person.grade,
      person.participationRate,
      person.months,
      person.baseSalary,
      toDisplayUnit(calculatePersonnelAmount(person)),
      toDisplayUnit(fundingAmounts.government),
      toDisplayUnit(fundingAmounts.privateCash),
      toDisplayUnit(fundingAmounts.privateInKind),
    ];
  });

  return [
    summaryHeader,
    ...summaryLines,
    [],
    institutionHeader,
    ...institutionLines,
    [],
    personnelHeader,
    ...personnelLines,
  ]
    .map((line) => line.join(","))
    .join("\n");
}

function downloadCsv(content, filename) {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function safeFilename(name) {
  return name.replace(/[^\w가-힣-]+/g, "_");
}

function saveProject() {
  const saved = loadSavedProjects();
  const timestamp = new Date();
  const savedAt = formatLocalDateTime(timestamp);
  const next = [
    {
      ...structuredClone(state),
      saveId: crypto.randomUUID(),
      savedAt,
      project: {
        ...state.project,
        createdAt: state.project.createdAt || formatLocalDate(timestamp),
      },
    },
    ...saved,
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 20)));
  renderSavedProjects();
}

function loadSavedProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const normalized = parsed.map((entry) => ({
      ...entry,
      saveId: entry.saveId || crypto.randomUUID(),
      savedAt: entry.savedAt || entry.project?.createdAt || formatLocalDateTime(),
    }));
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
  }
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFilename(state.project.name || "project")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function loadSample() {
  state = createEmptyState();
  state.project.name = "샘플_기관별재원_2기관";
  state.project.type = "중소기업혁신개발사업";
  state.project.unitDisplay = "백만원";
  state.project.durationYears = 1;
  state.institutions = [
    createInstitution("㈜엔지스", "주관기관", 0),
    createInstitution("공동1", "공동연구기관", 0),
  ];
  state.institutions[0].governmentAmount = 400000;
  state.institutions[0].privateCashAmount = 10000;
  state.institutions[0].privateInKindAmount = 90000;
  state.institutions[1].governmentAmount = 200000;
  state.institutions[1].privateCashAmount = 5000;
  state.institutions[1].privateInKindAmount = 45000;
  state.personnel = [
    {
      id: crypto.randomUUID(),
      name: "총괄책임자",
      grade: "연구책임자",
      participationRate: 100,
      months: 12,
      baseSalary: 9000,
      institutionId: state.institutions[0].id,
      fundingSourceAmounts: { government: 86000, privateCash: 2200, privateInKind: 19800 },
    },
    {
      id: crypto.randomUUID(),
      name: "선임연구원A",
      grade: "선임연구원",
      participationRate: 100,
      months: 12,
      baseSalary: 8000,
      institutionId: state.institutions[0].id,
      fundingSourceAmounts: { government: 76400, privateCash: 2000, privateInKind: 17600 },
    },
    {
      id: crypto.randomUUID(),
      name: "선임연구원B",
      grade: "선임연구원",
      participationRate: 100,
      months: 12,
      baseSalary: 7000,
      institutionId: state.institutions[0].id,
      fundingSourceAmounts: { government: 66900, privateCash: 1700, privateInKind: 15400 },
    },
    {
      id: crypto.randomUUID(),
      name: "연구원A",
      grade: "연구원",
      participationRate: 100,
      months: 12,
      baseSalary: 6000,
      institutionId: state.institutions[0].id,
      fundingSourceAmounts: { government: 57300, privateCash: 1500, privateInKind: 13200 },
    },
    {
      id: crypto.randomUUID(),
      name: "연구원B",
      grade: "연구원",
      participationRate: 100,
      months: 12,
      baseSalary: 5000,
      institutionId: state.institutions[0].id,
      fundingSourceAmounts: { government: 47800, privateCash: 1200, privateInKind: 11000 },
    },
    {
      id: crypto.randomUUID(),
      name: "연구원C",
      grade: "연구원",
      participationRate: 100,
      months: 12,
      baseSalary: 4000,
      institutionId: state.institutions[0].id,
      fundingSourceAmounts: { government: 38300, privateCash: 900, privateInKind: 8800 },
    },
    {
      id: crypto.randomUUID(),
      name: "보조연구원A",
      grade: "보조연구원",
      participationRate: 65.48,
      months: 12,
      baseSalary: 2800,
      institutionId: state.institutions[0].id,
      fundingSourceAmounts: { government: 17300, privateCash: 500, privateInKind: 4200 },
    },
    {
      id: crypto.randomUUID(),
      name: "공동책임자",
      grade: "연구책임자",
      participationRate: 100,
      months: 12,
      baseSalary: 9000,
      institutionId: state.institutions[1].id,
      fundingSourceAmounts: { government: 85600, privateCash: 2200, privateInKind: 20200 },
    },
    {
      id: crypto.randomUUID(),
      name: "공동선임A",
      grade: "선임연구원",
      participationRate: 100,
      months: 12,
      baseSalary: 7000,
      institutionId: state.institutions[1].id,
      fundingSourceAmounts: { government: 66500, privateCash: 1700, privateInKind: 15800 },
    },
    {
      id: crypto.randomUUID(),
      name: "공동연구원A",
      grade: "연구원",
      participationRate: 100,
      months: 12,
      baseSalary: 4000,
      institutionId: state.institutions[1].id,
      fundingSourceAmounts: { government: 37900, privateCash: 1100, privateInKind: 9000 },
    },
  ];
  state.allocation.pattern = "균등 배분";
  syncAllocation();
  syncBudgetTemplate();
  state.budgetItems.forEach((item) => {
    if (!item.auto) {
      item.amount = item.category === "기타" ? 10000 : 0;
    }
  });
  syncBudgetDerived();
  render();
}

function loadLargeSample() {
  state = createEmptyState();
  state.project.name = "샘플_5년_250억_6기관";
  state.project.type = "중소기업혁신개발사업";
  state.project.unitDisplay = "백만원";
  state.project.durationYears = 5;
  state.project.privateCashRatio = 14.29;

  const institutionConfigs = [
    { name: "㈜엔지스", type: "주관기관", government: 4200000, privateCash: 300000, privateInKind: 1500000, expense: 400000 },
    { name: "공동1", type: "공동연구기관", government: 3600000, privateCash: 200000, privateInKind: 1200000, expense: 400000 },
    { name: "공동2", type: "공동연구기관", government: 3200000, privateCash: 150000, privateInKind: 1150000, expense: 400000 },
    { name: "공동3", type: "공동연구기관", government: 2500000, privateCash: 100000, privateInKind: 900000, expense: 350000 },
    { name: "공동4", type: "공동연구기관", government: 2200000, privateCash: 150000, privateInKind: 650000, expense: 300000 },
    { name: "공동5", type: "공동연구기관", government: 2300000, privateCash: 100000, privateInKind: 600000, expense: 250000 },
  ];

  state.institutions = institutionConfigs.map((config) => {
    const inst = createInstitution(config.name, config.type, 0);
    inst.governmentAmount = config.government;
    inst.privateCashAmount = config.privateCash;
    inst.privateInKindAmount = config.privateInKind;
    return inst;
  });

  syncInstitutions();
  syncProjectTotals();
  state.allocation.pattern = "전반 집중형";
  syncAllocation();
  syncBudgetTemplate();

  const expenseRatios = {
    재료비: 0.3,
    여비: 0.15,
    연구활동비: 0.2,
    연구개발서비스비: 0.2,
    기타: 0.15,
  };

  institutionConfigs.forEach((config, index) => {
    const instId = state.institutions[index].id;
    const rows = state.budgetItems.filter((item) => item.institutionId === instId && !item.auto);
    let remainingExpense = config.expense;
    rows.forEach((item, rowIndex) => {
      if (rowIndex === rows.length - 1) {
        item.amount = remainingExpense;
        return;
      }
      const amount = Math.round(config.expense * (expenseRatios[item.category] || 0));
      item.amount = amount;
      remainingExpense -= amount;
    });
  });

  syncBudgetDerived();

  const personnelSpecs = [
    { suffix: "책임자", grade: "연구책임자", baseSalary: 18000 },
    { suffix: "PM", grade: "연구책임자", baseSalary: 16000 },
    { suffix: "선임A", grade: "선임연구원", baseSalary: 15000 },
    { suffix: "선임B", grade: "선임연구원", baseSalary: 14000 },
    { suffix: "선임C", grade: "선임연구원", baseSalary: 13000 },
    { suffix: "연구원A", grade: "연구원", baseSalary: 12000 },
    { suffix: "연구원B", grade: "연구원", baseSalary: 10000 },
    { suffix: "보조A", grade: "보조연구원", baseSalary: 8000 },
  ];

  state.personnel = [];

  state.institutions.forEach((inst) => {
    const personnelTarget = state.budgetItems.find(
      (item) => item.institutionId === inst.id && item.category === "인건비",
    )?.amount || 0;
    const fundingTargets = {
      government: personnelTarget - getInstitutionPrivateCashAmount(inst) - getInstitutionPrivateInKindAmount(inst),
      privateCash: getInstitutionPrivateCashAmount(inst),
      privateInKind: getInstitutionPrivateInKindAmount(inst),
    };

    let remainingPersonnel = personnelTarget;
    const institutionPersonnel = [];

    personnelSpecs.forEach((spec) => {
      if (remainingPersonnel <= 0) return;
      const monthlyCapacity = spec.baseSalary * 60;
      const allocated = Math.min(monthlyCapacity, remainingPersonnel);
      if (allocated <= 0) return;
      const participationRate = Number(((allocated / monthlyCapacity) * 100).toFixed(2));
      institutionPersonnel.push({
        id: crypto.randomUUID(),
        name: `${inst.name}_${spec.suffix}`,
        grade: spec.grade,
        participationRate,
        months: 60,
        baseSalary: spec.baseSalary,
        institutionId: inst.id,
        fundingSourceAmounts: {
          government: 0,
          privateCash: 0,
          privateInKind: 0,
        },
      });
      remainingPersonnel -= Math.round((monthlyCapacity * participationRate) / 100);
    });

    let remainingGovernment = fundingTargets.government;
    let remainingPrivateCash = fundingTargets.privateCash;
    let remainingPrivateInKind = fundingTargets.privateInKind;

    institutionPersonnel.forEach((person, index) => {
      const amount = calculatePersonnelAmount(person);
      if (index === institutionPersonnel.length - 1) {
        person.fundingSourceAmounts = {
          government: remainingGovernment,
          privateCash: remainingPrivateCash,
          privateInKind: remainingPrivateInKind,
        };
        return;
      }
      const governmentShare = fundingTargets.government / personnelTarget;
      const privateCashShare = fundingTargets.privateCash / personnelTarget;
      const privateInKindShare = fundingTargets.privateInKind / personnelTarget;
      const privateCash = Math.round(amount * privateCashShare);
      const privateInKind = Math.round(amount * privateInKindShare);
      const government = amount - privateCash - privateInKind;
      person.fundingSourceAmounts = {
        government,
        privateCash,
        privateInKind,
      };
      remainingGovernment -= government;
      remainingPrivateCash -= privateCash;
      remainingPrivateInKind -= privateInKind;
    });

    state.personnel.push(...institutionPersonnel);
  });

  syncBudgetDerived();
  render();
}

function getInstitutionRatio(instId) {
  return state.institutions.find((inst) => inst.id === instId)?.ratio || 0;
}

function resetState() {
  state = createEmptyState();
  syncBudgetTemplate();
  activeStepIndex = 0;
  render();
}

document.addEventListener(
  "wheel",
  (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "number") {
      target.blur();
      event.preventDefault();
    }
  },
  { passive: false },
);

document.getElementById("saveProjectBtn").addEventListener("click", saveProject);
document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
document.getElementById("resetBtn").addEventListener("click", resetState);
document.getElementById("sampleBtn").addEventListener("click", loadSample);
document.getElementById("largeSampleBtn").addEventListener("click", loadLargeSample);

syncBudgetTemplate();
render();
