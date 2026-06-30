
// =====================================================
// 🔇 SILENZIA LOG DI DEBUG / INFO GLOBALE
// =====================================================

// Attiva/disattiva il debug globale con una sola variabile
const DEBUG = false; // ⬅️ imposta a true se vuoi riattivare i log

// Backup delle funzioni originali
const _log = console.log;
const _info = console.info;
const _warn = console.warn;
const _debug = console.debug;
const _error = console.error;

// Reindirizza in base al flag
if (!DEBUG) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  // ❗ Lasciamo attivo solo console.error per eventuali errori gravi
} else {
  console.log = _log;
  console.info = _info;
  console.debug = _debug;
  console.warn = _warn;
  console.error = _error;
}

// =====================================================






/*********************** Stato ***********************/
const state = {
  patient: {},
  admin: {},
  wb: [], // {t, read, fia}
  blood: [], // {t, vol, cpm, conc, fia1ml, fiasangue}
  fit: { wb:null, blood:null },
  charts: {},
  kpi: {}
};


// Scaling factors aggiuntivi (riportati da Excel)
const SCALING = {
  male: {
    x1: 0.896,
    x2: 0.9632,
    x3: 1.001,
    XRM_kidneys: 0.663,
    XRM_spleen: 0.6644,
    XRM_liver: 0.6627,
    Xrm_LIVER: 0.6710,
    Xrm_SPLEEN: 0.6673,
    Xrm_KIDNEYS: 0.6713
  },
  female: {
    x1: 0.894,
    x2: 0.97,
    x3: 0.992,
    XRM_kidneys: 0.6678,
    XRM_spleen: 0.6611,
    XRM_liver: 0.6663,
    Xrm_LIVER: 0.6694,
    Xrm_SPLEEN: 0.6705,
    Xrm_KIDNEYS: 0.6689
  }
};





const REF_STD = {
  male: {
    mTB: 73.7,
    mRM: 1.120,
    bloodVolume: 4800,
    S: {
      RM_RM: 4.28e-02,
      RM_TB: 9.61e-04,
      RM_L: 8.82e-05,
      RM_S: 8.93e-05,
      RM_K: 1.71e-04,
      K_K:  2.89e-01,
      S_S:  4.72e-01
    },
    // 🔹 alias per compatibilità con le funzioni
    SrmRM: 4.28e-02,   // = RM_RM
    SrmTB: 9.61e-04    // = RM_TB
  },
  female: {
    mTB: 56.9,
    mRM: 1.300,
    bloodVolume: 2900,
    S: {
      RM_RM: 3.78e-02,
      RM_TB: 1.19e-03,
      RM_L: 9.86e-05,
      RM_S: 1.05e-04,
      RM_K: 2.03e-04,
      K_K:  3.14e-01,
      S_S:  5.76e-01
    },
    // 🔹 alias per compatibilità con le funzioni
    SrmRM: 3.78e-02,   // = RM_RM
    SrmTB: 1.19e-03    // = RM_TB
  }
};


state.refStd = REF_STD;


// I131 Germanio CPM * A + B   A= -0.00037146 B=621,165
// I131 captus CPM * A + B   A= -0.00208121 B=17339
const CALIBRATION_FACTORS = {
  "Germanio": {
    "177Lu-Lutathera":122.7,
    "177Lu-PSMA": 122.7,
    "131I": { A: -0.00037146, B: 621.165 },  // <- formula
    "90Y": 1500,
    "225Ac": 2500
  },
  "Capintec": {
    "177Lu-Lutathera": 1787,
    "177Lu-PSMA": 1787,
    "131I": { A: -0.00208121, B: 17339 },   // <- formula
    "90Y": 95.3,
    "225Ac": 500
  }
  // altri counter...
};



const DEBUG_VERBOSE = false; 






/******************************* reset foglio HTML *****************************************************/
function resetAll() {
  console.group("♻️ RESET COMPLETO");

  // 🔸 Svuota lo stato globale
  state.patient = {};
  state.admin = {};
  state.blood = [];
  state.wb = [];
  state.fit = { wb: null, blood: null };
  state.kpi = {};
  state.charts = {};

  // 🔸 Pulisce tutti i campi input
  document.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'checkbox' || el.type === 'radio') {
      el.checked = false;
    } else {
      el.value = '';
    }
  });

  // 🔸 Pulisce le tabelle
  const tbBlood = document.querySelector('#tblBlood tbody');
  const tbWB = document.querySelector('#tblWB tbody');
  if (tbBlood) tbBlood.innerHTML = '';
  if (tbWB) tbWB.innerHTML = '';

  // 🔸 Cancella localStorage
  localStorage.removeItem('doseMidolloState');

  // 🔸 Aggiorna grafici e UI
  renderWB();
  renderBlood();
  if (typeof setKPIs === "function") setKPIs();

  console.groupEnd();
  alert("✅ Tutti i dati sono stati resettati");
}







/**************************** Funzioni e Costanti Utili per il calcolo della dose **********************/





function getLambdaPhys() {
  const t12 = parseFloat(document.getElementById("ptT12")?.value || "0");
  if (!t12 || t12 <= 0) return null;
  return Math.log(2) / t12; // λ = ln2 / T½
}


function getCalibrationFactor(counter, isotope) {
  if (!counter || !isotope) return null;
  const calib = CALIBRATION_FACTORS[counter]?.[isotope];
  if (!calib) {
    console.warn(`⚠️ Nessuna calibrazione trovata per ${counter} / ${isotope}`);
    return null;
  }
  return calib;
}







// ===============================
// Calcolo AUC bi-esponenziale (coerente con Excel)
// ===============================
// Parametri:
//   fit = { A, B, C, D }   → parametri del fit bi-esponenziale
//   tauH                   → tempo limite in ore
//   lambdaPhys             → costante di decadimento fisico (1/h)
//   values                 → array di punti {t, y}
//   label                  → "WB" o "Blood" per log
//
// Ritorna:
//   { auc, aucLim, aucEff }
// ===============================
// ===============================
// Calcolo AUC bi-esponenziale (generico, coerente con Excel)
// ===============================

/*
Formula Excel:
Y = A*EXP(-B*t) + C*EXP(-D*t)

auc = (A/B) + (C/D)
aucLim = (A/B)*(1 - exp(-B*tau)) +
         (C/D)*(1 - exp(-D*tau)) +
         FIA(tau)/λphys
aucEff = min(auc, aucLim)
*/
/**
 * 📊 Calcola AUC teorica, limitata ed effettiva (Excel-like)
 * @param {Object} fit - parametri A, B, C, D del fit bi-esponenziale
 * @param {number} t12Days - emivita fisica in giorni (come in Excel)
 * @param {Array} values - dati {t, y} per calcolo FIA(tau)
 * @param {string} label - "WB" o "Blood" (default)
 * @returns {{auc: number, aucLim: number, aucEff: number}}
 */
function computeAUC(fit, t12Days, values = [], label = "WB/Blood") {
  // 🛑 Controlli iniziali
  if (!fit || !t12Days) {
    console.warn(`⚠️ computeAUC(${label}): parametri mancanti`);
    return { auc: null, aucLim: null, aucEff: null };
  }

  const { A, B, C, D } = fit;
  if ([A, B, C, D].some(v => !isFinite(v))) {
    console.warn(`⚠️ computeAUC(${label}): parametri non validi`, fit);
    return { auc: NaN, aucLim: NaN, aucEff: NaN };
  }

  // 🧮 λ fisico in h⁻¹ (T½ dato in GIORNI → converto in ore)
  const lambdaPhys = Math.log(2) / (t12Days * 24);
  if (!isFinite(lambdaPhys) || lambdaPhys <= 0) {
    console.warn(`⚠️ computeAUC(${label}): λ fisico non valido`);
    return { auc: NaN, aucLim: NaN, aucEff: NaN };
  }

  // ⏱ τ di follow-up (∞ per WB, ultimo punto per sangue)
  const tauFollowup = (label === "WB")
    ? 24             // integra fino a 24h per il WB
    : (values.length > 0 ? Math.max(...values.map(p => p.t)) : 24);

  // 🩸 Selezione FIA(τ): osservata o calcolata
  let fiaTau;
  if (values.length > 0) {
    const closest = values.reduce((prev, curr) =>
      Math.abs(curr.t - tauFollowup) < Math.abs(prev.t - tauFollowup) ? curr : prev
    );
    fiaTau = Number(closest.y);
    if (!isFinite(fiaTau)) {
      fiaTau = A * Math.exp(-B * tauFollowup) + C * Math.exp(-D * tauFollowup);
      console.log(`📌 ${label}: FIA osservata non valida, uso fit → ${fiaTau}`);
    } else {
      console.log(`📌 ${label}: usata FIA osservata a t=${closest.t} h → ${fiaTau}`);
    }
  } else {
    fiaTau = A * Math.exp(-B * tauFollowup) + C * Math.exp(-D * tauFollowup);
    console.log(`📌 ${label}: nessun dato osservato, usata FIA stimata → ${fiaTau}`);
  }

  // ====================================================================
  // 📘 Calcolo delle AUC — coerente con il modello Excel
  // ====================================================================

  // 🧮 AUC teorica (integrale bi-esponenziale da 0 → ∞)
  const aucTeo = (A / B) + (C / D);

  // 🕒 AUC limitata a τ (solo se tauFollowup è finito)
  const expB = Math.exp(-B * tauFollowup);
  const expD = Math.exp(-D * tauFollowup);

  const term1 = (A / B) * (1 - expB); // primo termine (decadimento rapido)
  const term2 = (C / D) * (1 - expD); // secondo termine (decadimento lento)
  const termPhys = isFinite(tauFollowup) ? (fiaTau / lambdaPhys) : 0;

  // 🔸 AUC limitata (Excel replica): integrazione fino a τ + contributo fisico
  const aucLim = isFinite(tauFollowup)
    ? (term1 + term2 + termPhys)
    : aucTeo;

  // ✅ AUC effettiva (Excel rule: usa AUC_lim se minore di AUC_teo)
  const aucEff = (isFinite(tauFollowup) && aucTeo > aucLim)
    ? aucLim
    : aucTeo;

  // ====================================================================
  // 🧾 Log di debug completo
  // ====================================================================
  console.group(`📊 computeAUC (${label})`);
  console.log(`τ follow-up = ${isFinite(tauFollowup) ? tauFollowup : "∞"} h`);
  console.log(`T½ fisico = ${t12Days} giorni → λ_phys = ${lambdaPhys.toExponential(4)} 1/h`);
  console.log(`FIA(τ) = ${fiaTau}`);
  console.log(`term1 = ${term1.toExponential(4)}, term2 = ${term2.toExponential(4)}, termPhys = ${termPhys.toExponential(4)}`);
  console.log(`AUC teorico = ${aucTeo.toExponential(4)}, AUC limitato = ${aucLim.toExponential(4)}, AUC effettivo = ${aucEff.toExponential(4)}`);

  if (isFinite(tauFollowup) && aucTeo > aucLim) {
    console.warn(`⚠️ ${label}: AUC (${aucTeo.toExponential(3)}) > AUC_lim (${aucLim.toExponential(3)}), uso AUC_lim`);
  }
  console.groupEnd();

  return { auc: aucTeo, aucLim, aucEff };

}
/*********************** Helper UI ***********************/

// parsing date tipo "10/02/2025 09:30"
function parseDateDDMMYYYY(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.trim().split(" ");
  if (parts.length < 2) return null;

  const [datePart, timePart] = parts;
  const [dd, mm, yyyy] = datePart.split(/[\/\-]/).map(Number);
  const [HH = 0, MM = 0] = timePart.split(":").map(Number);

  if (!yyyy || !mm || !dd) return null;
  return new Date(yyyy, mm - 1, dd, HH, MM);
}

// querySelector compatto
const $ = sel => document.querySelector(sel);

// conversione sicura a numero
function toNumber(v) {
  if (v === undefined || v === null) return null;
  let s = String(v).trim();
  s = s.replace(/\s/g, "");   // togli spazi
  s = s.replace(/,/g, ".");   // virgola → punto
  const x = parseFloat(s);
  return isNaN(x) ? null : x;
}




function saveLocal() {
  try {
    // salvo solo le parti serializzabili, non i grafici
    const toSave = {
      patient: state.patient || {},
      blood: state.blood || [],
      wb: state.wb || [],
	  admin: state.admin  || {},
	  fit: state.fit || {}, // ✅ AGGIUNTO 10.10.2025
	  kpi: state.kpi || {}   // ✅ AGGIUNTO 10.10.2025
    };
    localStorage.setItem('doseMidolloState', JSON.stringify(toSave));
    //console.log("Dati salvati in localStorage");
  } catch (err) {
    console.error("Errore in saveLocal:", err);
  }
}


function loadLocal() {
  try {
    const raw = localStorage.getItem('doseMidolloState');
    if (!raw) {
      console.warn("⚠️ Nessun dato trovato in localStorage");
      return;
    }
    const data = JSON.parse(raw);

    state.patient = data.patient || {};
    state.blood   = Array.isArray(data.blood) ? data.blood.map(normalizeBlood) : [];
    state.wb      = Array.isArray(data.wb)    ? data.wb    : [];
    state.admin   = normalizeAdmin(data.admin);

    console.group("📥 loadLocal()");
    console.log("Patient:", state.patient);
    console.log("Blood:", state.blood);
    console.log("WB:", state.wb);
    console.log("Admin (normalized):", state.admin);
    console.groupEnd();
calcAdmin()
    renderAll();
    renderBlood();
    renderWB();
    renderAdmin();   // 🔹 ora ripopola sempre anche la sezione Admin

    console.log("✅ Dati caricati da localStorage e interfaccia aggiornata");
  } catch (err) {
    console.error("❌ Errore in loadLocal:", err);
  }
}

function renderAdmin() {
  const a = state.admin || {};
  console.group("🖌️ renderAdmin()");
  console.log("Input:", a);

  if ($('#admMeasured')) {
    $('#admMeasured').value = a.meas || '';
    console.log("→ admMeasured:", $('#admMeasured').value);
  }
  if ($('#admMeasuredDT')) {
    $('#admMeasuredDT').value = a.measDT || '';
    console.log("→ admMeasuredDT:", $('#admMeasuredDT').value);
  }
  if ($('#admCalib')) {
    $('#admCalib').value = a.calib || '';
    console.log("→ admCalib:", $('#admCalib').value);
  }
  if ($('#admCalibDT')) {
    $('#admCalibDT').value = a.calibDT || '';
    console.log("→ admCalibDT:", $('#admCalibDT').value);
  }
  if ($('#admExpected')) {
    $('#admExpected').value = a.expected || '';
    console.log("→ admExpected:", $('#admExpected').value);
  }
  if ($('#admExpectedDT')) {
    $('#admExpectedDT').value = a.expectedDT || '';
    console.log("→ admExpectedDT:", $('#admExpectedDT').value);
  }
  if ($('#admEmpty')) {
    $('#admEmpty').value = a.empty || '';
    console.log("→ admEmpty:", $('#admEmpty').value);
  }
  if ($('#admEmptyDT')) {
    $('#admEmptyDT').value = a.emptyDT || '';
    console.log("→ admEmptyDT:", $('#admEmptyDT').value);
  }
  if ($('#admAdministered')) {
    $('#admAdministered').value = a.admin || '';
    console.log("→ admAdministered:", $('#admAdministered').value);
  }
  if ($('#admAdminDT')) {
    $('#admAdminDT').value = a.adminDT || '';
    console.log("→ admAdminDT:", $('#admAdminDT').value);
  }
  if ($('#admExpMeas')) {
    $('#admExpMeas').textContent = a.expMeas || '';
    console.log("→ admExpMeas:", $('#admExpMeas').textContent);
  }
  // dopo aver ripopolato i campi
if (typeof computeAdmin === "function") {
  computeAdmin(); // ricalcola i valori derivati
}
  // 🔹 forza sempre il ricalcolo
  calcAdmin();

  console.groupEnd();
}

function normalizeBlood(r) {
  console.group("🧪 normalizeBlood — Inizio");

  // 📌 Lettura dati di base
  const vol = Number(r.vol) || 1;
  const cpm = Number(r.cpm) || 0;
  let netWeight = Number(r.netWeight) || 0;
  console.log("Vol:", vol, "CPM:", cpm, "Netto (g):", netWeight);

  // 📌 Isotopo e counter
  const isotope = state.patient?.radio || $('#ptRadio')?.value || "";
  const counter = $('#bloodCounter')?.value || state.patient?.counter || "Capintec";
  console.log("Isotope:", isotope, "Counter:", counter);

  // 📌 Se isotopo è I-131, forza peso netto = 1.06 g
  if (isotope.includes("131I") || isotope.includes("I-131")) {
    netWeight = 1.06;
    console.log("⚙️ Forzato netWeight = 1.06 g per isotopo I-131");
  } else if (!netWeight || isNaN(netWeight) || netWeight <= 0) {
    netWeight = 1;
  }

  // 📌 Recupero calibrazione
  const calibDef = getCalibrationFactor(counter, isotope, cpm);
  console.log("Calibrazione grezza (calibDef):", calibDef, "tipo:", typeof calibDef);

  // 📌 Blood volume
  const blv = state.patient?.blv ??
              REF_STD[state.patient?.sex === "F" ? "female" : "male"].bloodVolume;
  console.log("Blood Volume (ml):", blv);

  // 📌 Attività somministrata
  const measMBq  = Number(state.admin?.meas)  || 0;
  const residMBq = Number(state.admin?.empty) || 0;
  const adminMBq = Math.max(0, measMBq - residMBq);
  const adminGBq = adminMBq / 1000;
  console.log("Admin (MBq):", adminMBq, "Admin (GBq):", adminGBq);

  // 📌 Date parsing
  const dtSample = r.datetimeSample ? new Date(r.datetimeSample.replace(" ", "T")) : null;
  const dtCount  = r.datetimeCount ? new Date(r.datetimeCount.replace(" ", "T")) : null;
  console.log("Sample:", dtSample, "Count:", dtCount);

  // 📌 Costante di decadimento λ [giorni⁻¹]
  const t12d = toNumber($('#ptT12')?.value);
  const lambda = t12d > 0 ? Math.log(2) / t12d : 0;

  // 🔹 Δt = giorni tra lettura e prelievo
  const deltaT_days = (dtCount - dtSample) / (1000 * 60 * 60 * 24);
  console.log("Δt (days) lettura-prelievo:", deltaT_days);

  // =================================================================
  // 📊 Calcolo concentrazione (kBq/g)
  // =================================================================
  let conc_kBqml = 0;
  const validDates = dtSample && dtCount && !isNaN(dtSample) && !isNaN(dtCount);

  if (validDates && cpm > 0) {
    // 📌 Caso 1 — Calibrazione numerica (es. 177Lu)
    if (typeof calibDef === 'number' && calibDef > 0) {
      console.log("🧮 Uso calibrazione numerica:", calibDef);
      conc_kBqml = (cpm * Math.exp(+lambda * deltaT_days)) / calibDef;

      // Per iodio → normalizza sempre per peso netto (1.06 g forzato sopra)
      if (isotope.includes("131I") || isotope.includes("I-131")) {
        conc_kBqml /= netWeight;
      }

    // 📌 Caso 2 — Calibrazione A/B (es. 131I Germanio)
    } else if (calibDef && typeof calibDef === 'object' && 'A' in calibDef && 'B' in calibDef) {
      const A = Number(calibDef.A);
      const B = Number(calibDef.B);
      const factor_cpm_per_kBq = (A * cpm) + B;
      console.log("🧮 Uso calibrazione {A,B} - Fattore:", factor_cpm_per_kBq);

      if (factor_cpm_per_kBq > 0) {
        const kBq_read = cpm / factor_cpm_per_kBq;
        const kBq_at_sample = kBq_read * Math.exp(+lambda * deltaT_days);
        conc_kBqml = kBq_at_sample / netWeight; // divisione sempre applicata
      }
    } else {
      console.warn("⚠️ Tipo calibrazione non riconosciuto:", calibDef);
    }
  } else {
    console.warn("⚠️ Dati insufficienti per calcolo concentrazione", { dtSample, dtCount, cpm });
  }

  // =================================================================
  // 💉 Calcolo FIA
  // =================================================================
  let fia1ml = 0;
  if (isotope.includes("131I") || isotope.includes("I-131")) {
    // 👉 Iodio: kBq/ml → MBq/ml, dividi per adminMBq
    if (adminMBq > 0) {
      const concMBqml = conc_kBqml / 1000; // kBq/ml → MBq/ml
      fia1ml = (concMBqml * vol) / adminMBq;
      console.log("💉 Formula FIA usata: I-131 → (concMBqml * vol) / adminMBq");
    }
  } else {
    // 👉 Altri isotopi (177Lu, 90Y, ecc.): kBq/ml → GBq/ml, dividi per adminGBq
    if (adminGBq > 0) {
      const concGBqml = conc_kBqml / 1e6; // kBq/ml → GBq/ml
      fia1ml = (concGBqml * vol) / adminGBq;
      console.log("💉 Formula FIA usata: altri isotopi → (concGBqml * vol) / adminGBq");
    }
  }

  const fiaBlood = fia1ml * blv * 100;

  // 📊 Log finale
  console.log(`🧪 normalizeBlood — Isotope: ${isotope}, Counter: ${counter}`);
  console.log("📌 Concentrazione (kBq/g):", conc_kBqml);
  console.log("📌 FIA(1ml):", fia1ml);
  console.log("📌 FIA sangue:", fiaBlood);
  console.groupEnd();

  return {
    t: Number(r.t) || 0,
    vol,
    cpm,
    conc: conc_kBqml,
    fia1ml,
    fiasangue: fiaBlood,
    datetimeSample: r.datetimeSample || null,
    datetimeCount: r.datetimeCount || null
  };
}

function downloadJSON() {
  if (!state.patient || !state.patient.name) {
    alert("⚠️ Prima inserire i dati del paziente");
    return;
  }

  console.group("💾 Salvataggio JSON completo e autosufficiente");

  try {
    // 🔹 Aggiorna tutti gli stati prima del salvataggio
    updateAdminState();
    parseBloodTable();

    // 🔹 Aggiorna calcoli (dose midollo, AUC, fit, ecc.)
    if (typeof computeDose === "function") computeDose();
    if (typeof forceFullRecalc === "function") forceFullRecalc();

    // 🔹 Blocchi calcolati
    const doseResults = {
      fitWB: state.fit?.wb || null,
      fitBlood: state.fit?.blood || null,
      aucWB: state.kpi?.aucWB ?? null,
      aucBlood: state.kpi?.aucBlood ?? null,
      aucEff: state.kpi?.aucEff ?? null,
      aucLim: state.kpi?.aucLim ?? null,
      doseMidollo: state.kpi?.doseMidollo ?? null,
      doseMidolloWB: state.kpi?.doseMidolloWB ?? null,
      doseMidolloBlood: state.kpi?.doseMidolloBlood ?? null,
      doseTotale: state.kpi?.doseTotale ?? null,
      selfDose: state.kpi?.selfDose ?? null,
      crossDose: state.kpi?.crossDose ?? null,
      lambdaPhys: state.patient?.lambda ?? null,
      tau: state.patient?.tau ?? null
    };

    // 🔹 Metadati (per garantire tracciabilità e analisi future)
    const meta = {
      exportDate: new Date().toISOString(),
      software: "DoseMidollo LocalApp",
      version: "1.0",
      isotope: state.patient?.radio || "ND",
      generator: typeof navigator !== "undefined" ? navigator.userAgent : "node",
      operator: state.patient?.operator || null
    };

    // 🔹 JSON completo da esportare
    const exportData = {
      meta,
      patient: state.patient,
      admin: state.admin || {},
      blood: state.blood || [],
      wb: state.wb || [],
      fit: state.fit || {},
      kpi: state.kpi || {},
      dose: doseResults
    };

    // 🔹 Nome file coerente e timestampato
    const name = state.patient.name.replace(/\s+/g, "_");
    const radio = state.patient.radio || "radioisotope";
    const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const filename = `${name}_${radio}_${date}.json`;

    // 🔹 Esportazione su disco
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);

    console.log(`✅ File JSON generato correttamente: ${filename}`);
  } catch (err) {
    console.error("❌ Errore durante la generazione del JSON:", err);
    alert("Errore durante il salvataggio dei dati calcolati.");
  }

  console.groupEnd();
}


function updateAdminState() {
  state.admin = {
    measDT: $('#admMeasuredDT')?.value || '',
    meas:   $('#admMeasured')?.value   || '',
    calibDT: $('#admCalibDT')?.value   || '',
    calib:  $('#admCalib')?.value      || '',
    expectedDT: $('#admExpectedDT')?.value || '',
    expected:   $('#admExpected')?.value   || '',
    emptyDT: $('#admEmptyDT')?.value   || '',
    empty:  $('#admEmpty')?.value      || '',
    expMeasDT: $('#admExpMeasDT')?.value || '',
    expMeas:   $('#admExpMeas')?.textContent || '',
    adminDT: $('#admAdminDT')?.value   || '',
    admin:  $('#admAdministered')?.value || ''
  };
  console.log("💾 updateAdminState() →", state.admin);
}


function normalizeAdmin(admin) {
  if (!admin) return {};
  const norm = {
    // valori misurati
    measDT: admin.measDT || admin.measuredDT || "",
    meas:   admin.meas   || admin.measured   || "",

    // valori calibrazione
    calibDT: admin.calibDT || admin.calibrationDT || "",
    calib:   admin.calib   || admin.calibration   || "",

    // valori expected
    expectedDT: admin.expectedDT || "",
    expected:   admin.expected   || "",

    // valori empty
    emptyDT: admin.emptyDT || "",
    empty:   admin.empty   || "",

    // expected/measured ratio
    expMeasDT: admin.expMeasDT || "",
    expMeas:   admin.expMeas   || "",

    // somministrazione
    adminDT: admin.adminDT || "",
    admin:   admin.admin || admin.administered || ""
  };

  console.group("🔧 normalizeAdmin");
  console.log("Input:", admin);
  console.log("Output:", norm);
  console.groupEnd();

  return norm;
}

/**
 * 📥 uploadJSON()
 * Carica un file JSON, ripristina stato e UI, e ricalcola correttamente i dati
 * (incluso il netWeight per il sangue, importante per I-131).
 */
async function uploadJSON(event) {
  let file = null;

  // 📌 1️⃣ Recupera file dall'evento
  if (event?.target?.files?.length > 0) {
    file = event.target.files[0];
  } else if (event instanceof File) {
    file = event; // permette chiamate manuali
  } else {
    console.warn("⚠️ Nessun file selezionato o evento non valido:", event);
    return;
  }

  console.group("📥 uploadJSON()");
  console.log("File selezionato:", file.name);

  try {
    // 📂 2️⃣ Leggi e parse del JSON
    const text = await file.text();
    const parsed = JSON.parse(text);
    console.log("Contenuto JSON parsato:", parsed);

    // ==========================
    // 3️⃣ Paziente + Isotopo
    // ==========================
    if (parsed.patient && typeof parsed.patient === "object") {
      state.patient = parsed.patient;
      console.log("👤 Paziente ripristinato:", state.patient);

      // 📌 Ripristina isotopo nella UI
      if (parsed.patient.radio) {
        const radioInput = document.querySelector('#ptRadio');
        if (radioInput) {
          radioInput.value = parsed.patient.radio;
        }
        state.patient.radio = parsed.patient.radio;
        console.log("📌 Isotopo ripristinato:", state.patient.radio);

        // Aggiorna calibrazione PRIMA di elaborare i dati blood
        updateCalibrationFactor();
      }

      // Ricalcolo volume sanguigno (se sesso/peso presenti)
      computeBLV(true);

    } else {
      state.patient = {};
      console.warn("⚠️ Nessun dato paziente nel JSON");
    }

    // ==========================
    // 4️⃣ Blood
    // ==========================
    if (Array.isArray(parsed.blood)) {
      state.blood = parsed.blood;
      console.log(`🩸 Punti blood caricati: ${state.blood.length}`);

      // 🧠 4a. Prima renderizzo la tabella UI
      renderBlood();

      // 🧠 4b. Poi rileggo dalla tabella UI → aggiorno state.blood (incl. netWeight)
      parseBloodTable();

      // 🧠 4c. Infine ricalcolo concentrazione/FIA per l'isotopo corrente
      aggiornaBloodTable();

    } else {
      state.blood = [];
      console.warn("⚠️ Nessun dato blood nel JSON");
      renderBlood();
    }

    // ==========================
    // 5️⃣ Whole Body
    // ==========================
    if (Array.isArray(parsed.wb)) {
      state.wb = parsed.wb;
      console.log(`🌐 WB points caricati: ${state.wb.length}`);
      renderWB();
    } else {
      state.wb = [];
      console.warn("⚠️ Nessun dato WB nel JSON");
      renderWB();
    }

    // ==========================
    // 6️⃣ Admin
    // ==========================
if (parsed.admin && typeof parsed.admin === "object") {
  state.admin = parsed.admin;
  console.log("💉 Admin caricati:", state.admin);

  // 🔹 Aggiorna i campi della UI se presenti nel JSON
  if (parsed.admin.meas && $('#admMeasured'))
    $('#admMeasured').value = parsed.admin.meas;

  if ((parsed.admin.admin || parsed.admin.adminMBq) && $('#admAdministered'))
    $('#admAdministered').value = parsed.admin.admin || parsed.admin.adminMBq;

  // 🔹 Conversione di sicurezza
  if (typeof state.admin.admin === "string")
    state.admin.admin = parseFloat(state.admin.admin);

  // ✅ Forza ricalcolo attività somministrata
  renderAdmin();
  calcAdmin();
  // ✅ Forza sincronizzazione isotopo dopo caricamento JSON
const radioEl = $('#ptRadio');
if (radioEl && parsed.patient?.radio) {
  radioEl.value = parsed.patient.radio;
  console.log("🔄 Isotopo forzato:", radioEl.value);

  // Forza l’evento onchange per aggiornare UI e calcoli
  if (typeof radioEl.onchange === "function") {
    radioEl.onchange();
  } else {
    radioEl.dispatchEvent(new Event("change"));
  }
}

} else {
  state.admin = {};
  console.warn("⚠️ Nessun dato Admin nel JSON");
  renderAdmin();
}


    // ==========================
    // 7️⃣ Salvataggio & Rendering finale
    // ==========================
    saveLocal();
    renderAll();
	forceFullRecalc();  // ✅ aggiungi questa riga
    console.log("✅ Dati caricati da JSON e interfaccia aggiornata correttamente");

  } catch (err) {
    console.error("❌ Errore nel caricamento del JSON:", err);
    alert("Errore nel caricamento del file JSON. Controlla la console per i dettagli.");
  } finally {
    console.groupEnd();

    // reset input file per permettere il ri-upload dello stesso file
    if (event?.target?.value !== undefined) {
      event.target.value = "";
    }
  }
  

 
  
}


  // ============================================================
  // 🔁 RICALCOLO COMPLETO — forza aggiornamento di tutto
  // ============================================================
  function forceFullRecalc() {
    console.group("🔁 FORCE FULL RECALC");

    const radioVal = $('#ptRadio')?.value || "";
    if (radioVal) state.patient.radio = radioVal;

    const t12 = toNumber($('#ptT12')?.value);
    if (t12 > 0) {
      state.patient.t12 = t12;
      state.patient.lambda = Math.log(2) / t12;
      console.log(`📘 T½=${t12} giorni → λ=${state.patient.lambda.toExponential(4)}`);
    }

    computeBLV(true);
    calcAdmin();

    if (Array.isArray(state.blood) && state.blood.length > 0) {
      console.log("🩸 Ricalcolo campioni sangue...");
      state.blood = state.blood.map(r => normalizeBlood(r));
      renderBlood();
    }

    renderWB();
    computeDose();

    console.groupEnd();
  }




// ============================================================
// 📦 INIZIALIZZAZIONE COMPLETA (al caricamento pagina)
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
	  // 👇 blocco corretto di disattivazione UI per il report
  if (window.IS_REPORT_MODE) {
    console.log("📄 Modalità Report attiva: salto inizializzazione UI");
    return;
  }
  console.group("🚀 Inizializzazione UI e calcoli");

  // 🔹 Nascondo pulsanti obsoleti
  if ($('#btnComputeBLV'))  $('#btnComputeBLV').style.display = "none";
  if ($('#btnAdminCalc'))   $('#btnAdminCalc').style.display  = "none";
  if ($('#importWB'))       $('#importWB').onclick = importWBFromClipboard;

  // ============================================================
  // 🧍 PATIENT SECTION
  // ============================================================
  ["#ptSex","#ptWt","#ptHt","#ptDOB","#ptT12"].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener("change", computeBLV);
  });

  const elSex = document.getElementById("ptSex");
  if (elSex) {
    const sex = elSex.value;
    const key = sex === "F" ? "female" : "male";
    const std = REF_STD[key];
    console.log("Blood Volume (ml):", std.bloodVol);
    console.log("S RM<-TB:", std.S.SRM_TB);
  }

  // ============================================================
  // 💉 ADMINISTRATION SECTION
  // ============================================================
  [
    "#admMeasured", "#admMeasuredDT", "#admCalib", "#admCalibDT",
    "#admExpected", "#admExpectedDT", "#admEmpty", "#admEmptyDT",
    "#admAdminDT", "#admExpMeasDT"
  ].forEach(sel => {
    const el = $(sel);
    if (el) {
      el.addEventListener("input", () => {
        syncAdminDates();
        calcAdmin();
      });
      el.addEventListener("change", () => {
        syncAdminDates();
        calcAdmin();
      });
    }
  });

  if ($('#admMeasuredDT')) {
    $('#admMeasuredDT').addEventListener("change", () => {
      const measDT = $('#admMeasuredDT').value;
      if (measDT) {
        if (!$('#admExpectedDT').value) $('#admExpectedDT').value = measDT;
        if (!$('#admExpMeasDT').value)  $('#admExpMeasDT').value  = measDT;
      }
      calcAdmin();
    });
  }

  if ($('#btnPastePatient')) {
    $('#btnPastePatient').addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        parseClipboardPatient(text);
        forceFullRecalc(); // 🔁 aggiorna tutto anche dopo incolla
      } catch (err) {
        alert("Errore durante la lettura dal clipboard: " + err);
      }
    });
  }

  // ============================================================
  // ⚛️ ISOTOPO & T½
  // ============================================================
  const radio = document.getElementById("ptRadio");
  const t12Field = document.getElementById("ptT12");

  function updateHalfLife() {
    if (!radio || !t12Field) return;
    const selected = radio.options[radio.selectedIndex];
    const lutetio = { "177Lu-Lutathera": 6.65, "177Lu-PSMA": 6.65 };
    const altri   = { "131I": 8.02, "90Y": 2.67, "225Ac": 10.0 };
    const t12 = lutetio[selected.value] || altri[selected.value] || "";
    if (t12) t12Field.value = t12;
    forceFullRecalc();
  }


  // ============================================================
  // ⚙️ LISTENER GLOBALE DI RICALCOLO
  // ============================================================
  console.log("🌐 Init: listener globale per recalcolo attivo");

  // Ricalcolo iniziale all’avvio
  updateHalfLife?.();
  forceFullRecalc();

  // Ogni modifica di input/select/textarea → recalcolo completo
  document.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("change", () => {
      console.log(`🔄 Change in: #${el.id || el.name || el.tagName}`);
      forceFullRecalc();
    });
    el.addEventListener("input", () => {
      console.log(`🔄 Input in: #${el.id || el.name || el.tagName}`);
      forceFullRecalc();
    });
  });

  // Ogni click (es. eliminazione punti sangue o WB)
  document.body.addEventListener("click", (ev) => {
    const t = ev.target;
    if (t.matches("button") || t.matches(".btn") || t.closest("button")) {
      console.log(`🖱️ Click → recalcolo completo da: ${t.id || t.textContent.trim()}`);
      forceFullRecalc();
    }
  });

  console.groupEnd();
}); // ✅ chiusura unica corretta





function parseClipboardPatient(text) {
  // Rimuove eventuali spazi e normalizza
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);

  let patient = {};

  lines.forEach(line => {
    if (line.startsWith("Nome:")) {
      // es. Nome:  ROSSI^GAETANO^
      const nomeRaw = line.split(":")[1].trim();
      // i caret ^ separano Cognome e Nome
      const parts = nomeRaw.split("^");
      patient.name = parts.join(" "); // -> "ROSSI GAETANO"
    }
    if (line.startsWith("PID:")) {
      patient.cc = line.split(":")[1].trim();
    }
    if (line.startsWith("PID Secondario:")) {
      patient.babele = line.split(":")[1].trim();
    }
    if (line.startsWith("Data di Nascita:")) {
      const dob = line.split(":")[1].trim();
      // converto da dd-mm-yyyy a yyyy-mm-dd (formato input date)
      const [d, m, y] = dob.split("-");
      patient.dob = `${y}-${m}-${d}`;
    }
    if (line.startsWith("Sesso:")) {
      patient.sex = line.split(":")[1].trim() || "F";
    }
    if (line.startsWith("Codice Fiscale:")) {
      patient.cf = line.split(":")[1].trim();
    }
  });

  // 🔹 compila form Patient Registry
  if (patient.name && $('#ptName')) $('#ptName').value = patient.name;
  if (patient.cc && $('#ptCC')) $('#ptCC').value = patient.cc;
  if (patient.babele && $('#ptBabele')) $('#ptBabele').value = patient.babele;
  if (patient.dob && $('#ptDOB')) $('#ptDOB').value = patient.dob;
  if (patient.sex && $('#ptSex')) $('#ptSex').value = patient.sex[0]; // "M" o "F"

  // aggiorna stato globale
  Object.assign(state.patient, patient);
  saveLocal();
  computeBLV(true);
}


// Calcolo età = differenza tra oggi e data di nascita
function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

let recalcTimer;
function safeRecalc() {
  clearTimeout(recalcTimer);
  recalcTimer = setTimeout(forceFullRecalc, 200);
}

/*********************** Patient & BLV ***********************/

function computeBLV(silent = false) {
  // ============================
  // 1️⃣ Lettura dati anagrafici
  // ============================
  const sex = $('#ptSex').value;                // "F" o "M"
  const wt  = toNumber($('#ptWt').value) || 0;  // peso (kg)
  const ht  = toNumber($('#ptHt').value) || 0;  // altezza (cm)
  const dob = $('#ptDOB').value;

  if (!sex || wt <= 0 || ht <= 0) {
    if (!silent) {
      alert("⚠️ Dati anagrafici mancanti per il calcolo del BLV");
    }
    return;
  }

  // ============================
  // 2️⃣ Calcolo età (solo UI)
  // ============================
  const age = calcAge(dob);
  if ($('#ptAge')) {
    $('#ptAge').textContent = (age !== null) ? age : '—';
  }

  // ============================
  // 3️⃣ Calcolo Blood Volume
  // Formula Excel (ml)
  // ============================
  let blv = null;
  if (sex === 'M') {
    blv = 31.9 * ht + 26.3 * wt - 2402;
  } else if (sex === 'F') {
    blv = 56.9 * ht + 14.1 * wt - 6460;
  }

  if ($('#kpiBLV')) {
    $('#kpiBLV').textContent = (blv && isFinite(blv)) ? blv.toFixed(0) : '—';
  }

  // ============================
  // 4️⃣ Calcolo Red Marrow (kg)
  // ============================
  let rmkg = null;
  if (wt > 0) {
    if (sex === "M") {
      rmkg = REF_STD.male.mRM * (wt / REF_STD.male.mTB);
    } else if (sex === "F") {
      rmkg = REF_STD.female.mRM * (wt / REF_STD.female.mTB);
    }
  }

  if ($('#ptRMkg')) {
    $('#ptRMkg').value = (rmkg && isFinite(rmkg)) ? rmkg.toFixed(3) : '';
  }

  // ============================
  // 5️⃣ Calcolo RM/Blood ratio
  // ============================
  let rmbr = null;
  if (blv && rmkg) {
    rmbr = rmkg * 1000 / blv; // (kg → g) / ml sangue
  }

  if ($('#kpiRMBR')) {
    $('#kpiRMBR').textContent = (rmbr && isFinite(rmbr)) ? rmbr.toFixed(3) : '—';
  }

  // ============================
  // 6️⃣ λ e τ (dal T½)
  // ============================
  const t12    = toNumber($('#ptT12').value) || 0;
  const lambda = t12 ? Math.log(2) / t12 : 0;
  const tau    = lambda ? (1 / lambda) : 0;

  if ($('#ptTau')) {
    $('#ptTau').value = isFinite(tau) ? tau.toFixed(2) : '—';
  }
  if ($('#kpiLambda')) {
    $('#kpiLambda').textContent = isFinite(lambda) ? lambda.toFixed(3) : '—';
  }

  // ============================
  // 7️⃣ Aggiorna stato globale
  // ============================
  state.patient = {
    ...state.patient,
    name: $('#ptName').value,
    cc: $('#ptCC').value,
    babele: $('#ptBabele').value,
    dob,
    age,
    sex,
    wt,
    ht,
    t12,
    tau,
    lambda,
    rmkg,
    rmbr,
    blv
  };

  // 🔸 Derived per calcoli ROB e dosi
  state.derived = {
    ...state.derived,
    blv,
    mrm: rmkg,
    rmBloodRatio: rmbr
  };

  // ============================
  // 8️⃣ Log & salvataggio
  // ============================
  console.group("📊 computeBLV");
  console.log("Blood Volume (ml):", blv);
  console.log("Red Marrow (kg):", rmkg);
  console.log("RM/Blood ratio:", rmbr);
  console.groupEnd();

  saveLocal();
}



// 🔸 Ricalcola tutte le righe sangue e aggiorna tabella UI
function aggiornaBloodTable() {
  if (!state.blood || state.blood.length === 0) return;

  console.log("🔄 Ricalcolo sangue per isotopo:", state.patient.radio);
  state.blood = state.blood.map(r => normalizeBlood(r));
  renderBlood();
}





function computeBloodVolume(sex, weight) {
  if (!state.refStd) return null;
  const std = state.refStd[sex];
  if (!std) return null;

  // BLV_std * (peso / mTB_std)
  return std.bloodVol * (weight / std.mTB);
}




// 🔹 funzione di sync: solo se i campi sono vuoti
function syncAdminDates() {
  const measDT = $('#admMeasuredDT').value;
  if (measDT) {
    if (!$('#admExpectedDT').value)  $('#admExpectedDT').value  = measDT;
    if (!$('#admExpMeasDT').value)   $('#admExpMeasDT').value   = measDT;
    if (!$('#admEmptyDT').value)     $('#admEmptyDT').value     = measDT;
    if (!$('#admAdminDT').value)     $('#admAdminDT').value     = measDT;
  }
}




// 🔹 listener una sola volta (NON dentro calcAdmin!)
if ($('#admMeasuredDT')) {
  $('#admMeasuredDT').addEventListener("change", () => {
    syncAdminDates();
    calcAdmin(); // ricalcola subito
  });
}

function calcAdmin() {
  console.group("💉 calcAdmin — Calcolo attività somministrata");

  // === Se lo state contiene già un valore da JSON, mantienilo ===
  if (state.admin && typeof state.admin.admin === "string") {
    state.admin.admin = parseFloat(state.admin.admin);
  }

  // ===============================
  // 📥 Lettura input dalla UI
  // ===============================
  const measStr       = $('#admMeasured')?.value;
  const measDTStr     = $('#admMeasuredDT')?.value;
  const calibStr      = $('#admCalib')?.value;
  const calibDTStr    = $('#admCalibDT')?.value;
  const emptyStr      = $('#admEmpty')?.value;
  const emptyDTStr    = $('#admEmptyDT')?.value;
  const expectedDTStr = $('#admExpectedDT')?.value;
  const adminDTStr    = $('#admAdminDT')?.value;

  // Se tutti i campi sono vuoti → tenta di recuperare dal JSON
  if (!measStr && !calibStr && !state.admin?.admin) {
    console.log("⏩ calcAdmin() saltato: nessun dato disponibile, mantengo state.admin:", state.admin);
    console.groupEnd();
    return;
  }

  // ===============================
  // 🔹 Conversioni numeriche
  // ===============================
  const meas  = toNumber(measStr)  || 0;
  const calib = toNumber(calibStr) || 0;
  const empty = toNumber(emptyStr) || 0;

  // ===============================
  // 🔹 Decadimento fisico
  // ===============================
  const t12 = toNumber($('#ptT12')?.value) || 0;         // emivita in giorni
  const lambda = t12 > 0 ? Math.log(2) / t12 : 0;

  // ===============================
  // 🔹 Attività expected (decay corrected)
  // ===============================
  let expected = 0;
  if (calib > 0 && calibDTStr && expectedDTStr && lambda > 0) {
    const dtCalib = new Date(calibDTStr);
    const dtExp   = new Date(expectedDTStr);
    if (!isNaN(dtCalib) && !isNaN(dtExp)) {
      const deltaDays = (dtExp - dtCalib) / (1000 * 60 * 60 * 24);
      expected = calib * Math.exp(-lambda * deltaDays);
    }
  }

  // ===============================
  // 🔹 Attività somministrata
  // ===============================
  // priorità: campo già presente nel JSON → input manuale → calcolo
const measVal  = parseFloat(measStr?.replace(",", ".") || 0);
const emptyVal = parseFloat(emptyStr?.replace(",", ".") || 0);

let administeredMBq = 0;
if (!isNaN(measVal) && measVal > 0) {
  administeredMBq = measVal - (isNaN(emptyVal) ? 0 : emptyVal);
  if (administeredMBq < 0) {
    console.warn("⚠️ Administered negativo, inversione valori");
    administeredMBq = Math.abs(administeredMBq);
  }
}

const administeredGBq = administeredMBq / 1000;

  // ===============================
  // 💾 Aggiornamento dello state (senza perdere dati esistenti)
  // ===============================
  state.admin = {
    ...(state.admin || {}),
    measDT: measDTStr || state.admin?.measDT || "",
    meas,
    calibDT: calibDTStr || state.admin?.calibDT || "",
    calib,
    expectedDT: expectedDTStr || state.admin?.expectedDT || "",
    expected,
    emptyDT: emptyDTStr || state.admin?.emptyDT || "",
    empty,
    adminDT: adminDTStr || state.admin?.adminDT || "",
    admin: administeredMBq,
    adminMBq: administeredMBq,
    adminGBq: administeredGBq,
  };

  console.log("✅ Attività somministrata:", administeredMBq, "MBq (", administeredGBq, "GBq )");

  // ===============================
  // 🖋️ Aggiorna interfaccia
  // ===============================
  const adminEl = $('#admAdministered');
  if (adminEl) adminEl.value = administeredMBq ? administeredMBq.toFixed(2) : "";

  const expectedEl = $('#admExpected');
  if (expectedEl) expectedEl.value = expected ? expected.toFixed(2) : "";

  // ===============================
  // 🔁 Ricalcolo sangue (se presente)
  // ===============================
  if (state.blood && state.blood.length > 0) {
    console.log("🔄 Ricalcolo sangue per isotopo:", state.patient?.radio || $('#ptRadio')?.value);
    state.blood = state.blood.map(normalizeBlood);
    renderBlood();
  }

  saveLocal();
  console.groupEnd();
}


/*********************** Function for Fitting Data ***********************/

function fitBiExp(x, y) {
  // 🧩 Controlli iniziali
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
    console.error("❌ fitExpAdaptive: dati insufficienti o non validi");
    return null;
  }

  // 🔹 Scelta automatica del modello
  const isMono = x.length < 4;
  console.warn(`⚙️ fitExpAdaptive: ${isMono ? "monoesponenziale" : "biesponenziale"} (${x.length} punti)`);

  // Normalizzazione per stabilità numerica
  const yMax = Math.max(...y);
  const yn = y.map(v => v / yMax);

  // 🔹 Modello con vincolo positivo intrinseco
  const model = (p, t) => {
    if (isMono) {
      // p = [a, b] → A = exp(a), B = exp(b)
      const [a, b] = p;
      const A = Math.exp(a);
      const B = Math.exp(b);
      return A * Math.exp(-B * t);
    } else {
      // p = [a, b, c, d]
      const [a, b, c, d] = p;
      const A = Math.exp(a);
      const B = Math.exp(b);
      const C = Math.exp(c);
      const D = Math.exp(d);
      return A * Math.exp(-B * t) + C * Math.exp(-D * t);
    }
  };

  // 🔹 Funzione di perdita
  const loss = (p) => {
    let sse = 0;
    for (let i = 0; i < x.length; i++) {
      const err = model(p, x[i]) - yn[i];
      sse += err * err;
    }
    return isFinite(sse) ? sse : 1e9;
  };

  // 🔹 Ottimizzatore (Nelder–Mead semplice)
  function nelderMead(f, start, step = 0.05, maxIter = 5000, tol = 1e-8) {
    let n = start.length;
    let simplex = [start];
    for (let i = 0; i < n; i++) {
      let p = start.slice();
      p[i] += step;
      simplex.push(p);
    }
    simplex = simplex.map(p => [p, f(p)]);
    simplex.sort((a, b) => a[1] - b[1]);

    for (let iter = 0; iter < maxIter; iter++) {
      simplex.sort((a, b) => a[1] - b[1]);
      const best = simplex[0][0], worst = simplex[n][0];
      const centroid = Array(n).fill(0).map((_, j) =>
        simplex.slice(0, n).reduce((sum, s) => sum + s[0][j], 0) / n
      );

      const alpha = 1, gamma = 2, rho = 0.5;
      const pr = centroid.map((c, j) => c + alpha * (c - worst[j]));
      const fr = f(pr);

      if (fr < simplex[0][1]) {
        const pe = centroid.map((c, j) => c + gamma * (pr[j] - c));
        const fe = f(pe);
        simplex[n] = fe < fr ? [pe, fe] : [pr, fr];
      } else if (fr < simplex[n - 1][1]) {
        simplex[n] = [pr, fr];
      } else {
        const pc = centroid.map((c, j) => c + rho * (worst[j] - c));
        const fc = f(pc);
        simplex[n] = fc < simplex[n][1] ? [pc, fc] : simplex[n];
      }

      if (Math.abs(simplex[0][1] - simplex[n][1]) < tol) break;
    }

    simplex.sort((a, b) => a[1] - b[1]);
    return simplex[0][0];
  }

  // 🔹 Parametri iniziali in log-spazio (vincolo positività)
  const init = isMono
    ? [Math.log(Math.max(yn[0], 1e-6)), Math.log(0.1)]
    : [Math.log(Math.max(yn[0] * 0.6, 1e-6)), Math.log(0.1), Math.log(Math.max(yn[0] * 0.4, 1e-6)), Math.log(0.01)];

  // 🔹 Esegui il fit
  const params = nelderMead(loss, init);

  // 🔹 Ritorno ai parametri fisici (sempre positivi)
  let A, B, C = 0, D = 1; // default compatibili
  if (isMono) {
    [A, B] = params.map(Math.exp);
  } else {
    [A, B, C, D] = params.map(Math.exp);
  }

  // 🔹 Denormalizza A, C
  const A_den = A * yMax;
  const C_den = C * yMax;

  // ⚠️ Controllo finale
  if ([A, B, C, D].some(v => !isFinite(v) || v <= 0)) {
    console.warn("⚠️ fitExpAdaptive: coefficienti non validi", { A, B, C, D });
    return null;
  }

  // 🔹 Calcolo curva fittata e R²
  const yFit = x.map(t =>
    isMono
      ? A_den * Math.exp(-B * t)
      : A_den * Math.exp(-B * t) + C_den * Math.exp(-D * t)
  );
  const meanY = y.reduce((a, b) => a + b, 0) / y.length;
  const ssRes = y.reduce((acc, yi, i) => acc + (yi - yFit[i]) ** 2, 0);
  const ssTot = y.reduce((acc, yi) => acc + (yi - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;

  // 🔹 Log risultati
  console.group(`📈 Fit ${isMono ? "monoesponenziale" : "biesponenziale"}`);
  console.table({ A: A_den, B, C: C_den, D, r2 });
  console.groupEnd();

  // 🔹 Restituzione risultati coerenti
  return { A: A_den, B, C: C_den, D, r2, yFit, model: isMono ? "mono" : "bi" };
}




/**
 * Fallback monoesponenziale per pochi punti
 * Usa forma Y = A·exp(-B·t) + C·exp(-D·t)
 * con C=0, D=1 per compatibilità
 */
// =============================
// Fit monoesponenziale (con log-parametri per garantire positività)
// =============================
function fitMonoExp(x, y) {
  if (!x || !y || x.length < 2) {
    console.warn("⚠️ fitMonoExp: dati insufficienti");
    return null;
  }

  // --- modello log-parametrico ---
  const model = (p, t) => {
    const [logA, logB] = p;
    const A = Math.exp(logA);
    const B = Math.exp(logB);
    return A * Math.exp(-B * t);
  };

  // --- funzione di perdita ---
  const loss = (p) => {
    let sse = 0;
    for (let i = 0; i < x.length; i++) {
      const err = model(p, x[i]) - y[i];
      sse += err * err;
    }
    return sse;
  };

  // --- inizializzazione logaritmica ---
  const y0 = Math.max(y[0], 1e-9);
  const init = [Math.log(y0), Math.log(0.1)];

  const params = nelderMead(loss, init);
  if (!params || params.some(v => !isFinite(v))) {
    console.warn("❌ Fit mono-exp non riuscito");
    return null;
  }

  // 🔹 Ritorno ai parametri fisici (sempre positivi)
  let [A, B, C, D] = [0, 0, 0, 1];
  [A, B] = params.map(Math.exp); // <— coerente col tuo schema

  // --- calcolo R² ---
  const yhat = x.map(t => A * Math.exp(-B * t));
  const ymean = y.reduce((a, b) => a + b, 0) / y.length;
  const ssTot = y.reduce((s, yi) => s + (yi - ymean) ** 2, 0);
  const ssRes = y.reduce((s, yi, i) => s + (yi - yhat[i]) ** 2, 0);
  const r2 = ssTot ? 1 - ssRes / ssTot : 0;

  console.log("📈 Fit monoesponenziale (log-param)", { A, B, C, D, r2 });
  return { A, B, C, D, r2 };
}


/**
 * Fallback monoesponenziale per pochi punti
 * Usa forma Y = A·exp(-B·t) + C·exp(-D·t)
 * con C=0, D=1 per compatibilità
 */

function fitMonoExp(x, y) {
  // 🔹 Controlli iniziali
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
    console.error("❌ fitMonoExp: dati non validi");
    return null;
  }

  // 🔹 Normalizzazione per stabilità numerica
  const yMax = Math.max(...y);
  const yn = y.map(v => v / yMax);

  // 🔹 Modello: Y = A * exp(-B * t)
  const model = (p, t) => {
    const [A, B] = p.map(Math.abs);
    return A * Math.exp(-B * t);
  };

  // 🔹 Funzione obiettivo (SSE + penalità per negativi)
  const loss = (p) => {
    let penalty = 0;
    if (p.some(v => v <= 0)) penalty = 1e6;
    let sse = 0;
    for (let i = 0; i < x.length; i++) {
      const err = model(p, x[i]) - yn[i];
      sse += err * err;
    }
    return sse + penalty;
  };

  // 🔹 Ottimizzatore Nelder–Mead
  function nelderMead(f, start, step = 0.05, maxIter = 3000, tol = 1e-8) {
    let n = start.length;
    let simplex = [start];
    for (let i = 0; i < n; i++) {
      let p = start.slice();
      p[i] += step;
      simplex.push(p);
    }
    simplex = simplex.map(p => [p, f(p)]);

    for (let iter = 0; iter < maxIter; iter++) {
      simplex.sort((a, b) => a[1] - b[1]);
      const best = simplex[0][0];
      const worst = simplex[n][0];
      const centroid = Array(n).fill(0).map((_, j) =>
        simplex.slice(0, n).reduce((sum, s) => sum + s[0][j], 0) / n
      );

      const alpha = 1, gamma = 2, rho = 0.5;
      const pr = centroid.map((c, j) => c + alpha * (c - worst[j]));
      const fr = f(pr);

      if (fr < simplex[0][1]) {
        const pe = centroid.map((c, j) => c + gamma * (pr[j] - c));
        const fe = f(pe);
        simplex[n] = fe < fr ? [pe, fe] : [pr, fr];
      } else if (fr < simplex[n - 1][1]) {
        simplex[n] = [pr, fr];
      } else {
        const pc = centroid.map((c, j) => c + rho * (worst[j] - c));
        const fc = f(pc);
        simplex[n] = fc < simplex[n][1] ? [pc, fc] : simplex[n];
      }
      if (Math.abs(simplex[0][1] - simplex[n][1]) < tol) break;
    }

    simplex.sort((a, b) => a[1] - b[1]);
    return simplex[0][0];
  }

  // 🔹 Stima iniziale
  const init = [yn[0], 0.1];
  const params = nelderMead(loss, init);
  let [A, B] = params.map(Math.abs);

  // 🔹 Denormalizza
  A *= yMax;

  // 🔹 Calcolo R²
  const yFit = x.map(t => A * Math.exp(-B * t));
  const meanY = y.reduce((a, b) => a + b, 0) / y.length;
  const ssRes = y.reduce((acc, yi, i) => acc + (yi - yFit[i]) ** 2, 0);
  const ssTot = y.reduce((acc, yi) => acc + (yi - meanY) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;

  console.group("📈 Fit monoesponenziale (vincolato positivo)");
  console.table({ A, B, r2 });
  console.groupEnd();

  return { A, B, C: 0, D: 1, r2, yFit };
}




/*********************** Support to Chart Function******************************/

// Migliora nitidezza testo e coerenza font Chart.js
Chart.defaults.devicePixelRatio = 2;

function ensureChart(key, canvasId, labelData, labelFit) {
  if (!state.charts) state.charts = {};
  if (!state.charts[key]) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`Canvas #${canvasId} non trovato!`);
      return null;
    }

    state.charts[key] = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: labelData,
            data: [],
            borderColor: 'rgba(0,180,255,0.9)',
            backgroundColor: 'rgba(0,180,255,0.3)',
            borderWidth: 2,
            showLine: false,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointStyle: 'circle'
          },
          {
            label: labelFit,
            data: [],
            borderColor: 'rgba(255,99,71,1)',
            borderWidth: 2,
            borderDash: [5, 3],
            fill: false,
            showLine: true,
            pointRadius: 0,
            pointHoverRadius: 0,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
scales: {
  x: {
    type: 'linear',
    title: {
      display: true,
      text: 'Tempo (h)',
      color: '#ddd',
      font: { family: 'Inter, Arial, sans-serif', weight: 'bold', size: 13 }
    },
    ticks: {
      color: '#eee',
      font: { family: 'Inter, Arial, sans-serif', size: 12 },
      callback: v => Number(v).toFixed(1)
    },
    grid: { color: 'rgba(255,255,255,0.1)' },
    min: 0
  },
  y: {
    title: {
      display: true,
      text: 'FIA (a.u.)',
      color: '#ddd',
      font: { family: 'Inter, Arial, sans-serif', weight: 'bold', size: 13 }
    },
    ticks: {
      color: '#eee',
      font: { family: 'Inter, Arial, sans-serif', size: 12 },
      callback: function (value) {
        if (Math.abs(value) < 0.001 && value !== 0) {
          return value.toExponential(1); // es. 4.0e-5
        }
        return Number(value).toPrecision(3);
      }
    },
    grid: { color: 'rgba(255,255,255,0.1)' },
    min: 0
  }
},

        plugins: {
          legend: {
            labels: {
              color: '#fff',
              font: { family: 'Inter, Arial, sans-serif', size: 13, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  return state.charts[key];
}

//===========================================================================
//=================================fitting blood ===========================
//=========================================================================


let fittingBloodInProgress = false;

function computeFitBlood() {
  if (fittingBloodInProgress) return;
  fittingBloodInProgress = true;

  try {
    const spanFit = document.getElementById("bloodFit");
    const chart = ensureChart("blood", "chartBlood", "FIA dati (1 ml)", "Fit sangue");

    const nPoints = state.blood?.length || 0;
    if (nPoints < 2) {
      if (spanFit) spanFit.textContent = "Fit non eseguito (meno di 2 punti)";
      state.fit.blood = null;
      if (chart) {
        chart.data.datasets[0].data = [];
        chart.data.datasets[1].data = [];
        chart.update();
      }
      return;
    }

    // --- Prepara dati ---
    const x = state.blood.map(p => p.t);
    const y = state.blood.map(p => p.fia1ml);

    // --- Scelta automatica modello ---
    const fit = (nPoints < 4) ? fitMonoExp(x, y) : fitBiExp(x, y);

    if (!fit || !isFinite(fit.A) || !isFinite(fit.B)) {
      console.warn("⚠️ computeFitBlood: fit non valido", fit);
      if (spanFit) spanFit.textContent = "Fit non valido";
      state.fit.blood = null;
      return;
    }

    // --- Salva risultato ---
    state.fit.blood = fit;

    // --- Crea curva fittata ---
    const tFit = [];
    const tMax = Math.max(...x) * 1.2;
    for (let t = 0; t <= tMax; t += tMax / 100) {
      const yhat = (fit.C && fit.D)
        ? fit.A * Math.exp(-fit.B * t) + fit.C * Math.exp(-fit.D * t)
        : fit.A * Math.exp(-fit.B * t);
      tFit.push({ x: t, y: yhat });
    }

    // --- Aggiorna grafico ---
    if (chart) {
      chart.options.scales.y.min = 0;
      chart.options.scales.y.max = Math.max(...y) * 1.2; // auto scaling
      chart.data.datasets[0].data = x.map((xi, i) => ({ x: xi, y: y[i] })); // punti reali
      chart.data.datasets[1].data = tFit; // curva fittata
      chart.update();
    }

    // --- Calcolo AUC ---
    const t12 = toNumber($("#ptT12").value) || 0;
    const resBlood = computeAUC(fit, t12, state.blood.map(p => ({ t: p.t, y: p.fia1ml })), "Blood");
    const Ablood1ml = resBlood.aucEff || 0;

    Object.assign(state.fit, {
      Ablood1ml,
      AbloodHg: Ablood1ml,
      AbloodLim: resBlood.aucLim,
      AbloodTeor: resBlood.auc,
      AbloodEff: resBlood.aucEff
    });

    // --- Aggiorna etichetta modello dinamicamente ---
    if (spanFit) {
      const tipo = (nPoints < 4) ? "mono-exp" : "bi-exp";
      const formula = (nPoints < 4)
        ? `Y = A·e<sup>-B·t</sup>`
        : `Y = A·e<sup>-B·t</sup> + C·e<sup>-D·t</sup>`;
      spanFit.innerHTML =
        `${tipo} | A=${fit.A.toExponential(2)}  B=${fit.B.toExponential(2)}  ` +
        (fit.C ? `C=${fit.C.toExponential(2)}  D=${fit.D.toExponential(2)}  ` : "") +
        `|  R²=${fit.r2.toFixed(3)}  |  Ã=${Ablood1ml.toExponential(2)} h/ml<br>` +
        `Fit: ${formula}`;
    }

    if (typeof setKPIs === "function") setKPIs();
    if (typeof computeDerivedMassesAndAUC === "function") computeDerivedMassesAndAUC();

    console.group("📊 Fit sangue");
    console.table({ ...fit, Ablood1ml, r2: fit.r2 });
    console.groupEnd();
  } finally {
    fittingBloodInProgress = false;
  }

}


//===========================================================================
//=================================DOSIMETRIA RM ===========================
//=========================================================================


function computeSelfIrradiation(AbloodHg, mRM, coeffS, refMrm, exp) {
  // 🛑 Controllo parametri in ingresso
  if (![AbloodHg, mRM, coeffS, refMrm].every(Number.isFinite) || exp === undefined) {
    console.warn("⚠️ computeSelfIrradiation: parametri mancanti o non validi", { AbloodHg, mRM, coeffS, refMrm, exp });
    $('#kpiSelfIrradiation').textContent = '—';
    return NaN;
  }

  // ============================================================
  // 📘 Conversione e calcolo
  // ============================================================

    // AbloodHg [h/kg] → converto a [h/g] moltiplicando ×1000
  const Arm = (AbloodHg * mRM) * 1000;

  // Dose self-irradiation secondo Traino 2007:
  // D_self [mGy/MBq] = coeffS × Ãrm × (mRM_ref / mRM)^exp
  const val = coeffS * Arm * Math.pow(refMrm / mRM, exp);

  // ============================================================
  // 📊 Log di debug (più sintetico e chiaro)
  // ============================================================
  console.group("🧩 computeSelfIrradiation()");
  console.log(`AbloodHg [h/g] = ${AbloodHg}`);
  console.log(`mRM [kg]       = ${mRM}`);
  console.log(`→ Ãrm [h]      = ${Arm}`);
  console.log(`coeffS         = ${coeffS}`);
  console.log(`refMrm [kg]    = ${refMrm}`);
  console.log(`exp            = ${exp}`);
  console.log(`Self-irradiation [mGy/MBq] = ${val}`);
  console.groupEnd();

  // ============================================================
  // 🧾 Output su UI
  // ============================================================
  $('#kpiSelfIrradiation').textContent = Number.isFinite(val)
    ? val.toExponential(4)
    : '—';

  return val;
}


function computeROB({ Arb, AbloodHg, mrm, wt, SrmTB, SrmRM, sex, exp1, exp2, exp3 }) {
  // 🧩 Controllo parametri
  const params = { Arb, AbloodHg, mrm, wt, SrmTB, SrmRM, sex, exp1, exp2, exp3 };
  const valid = Object.values(params).every(v => Number.isFinite(v) || typeof v === "string");

  if (!valid) {
    console.warn("⚠️ computeROB: parametri mancanti o non validi", params);
    if ($('#kpiROB')) $('#kpiROB').textContent = '—';
    return NaN;
  }

  // ============================================================
  // 📘 Masse di riferimento (Traino 2007)
  // ============================================================
  const mTBref = sex === "M" ? REF_STD.male.mTB : REF_STD.female.mTB;   // massa totale
  const mRMref = sex === "M" ? REF_STD.male.mRM : REF_STD.female.mRM;   // midollo rosso
  const mRBref = sex === "M" ? 72.58 : 55.6;                            // red bone marrow reference

  // ============================================================
  // 🧮 Termini principali
  // ============================================================
  const termineA = Arb - (AbloodHg * mrm);  // differenza tra A_rb e A_blood × mrm
  const termine1 = SrmTB * (mTBref / mRBref) ** exp2 * (mTBref / wt) ** exp1;
  const termine2 = SrmRM * ((mTBref * mRMref) / (wt * mRBref)) ** exp3;

  const rob = termineA * (termine1 - termine2);

  // ============================================================
  // 🧾 Log strutturato
  // ============================================================
  console.groupCollapsed("🔍 computeROB (Excel replica)");
  console.table({
    Arb,
    AbloodHg,
    mrm,
    wt,
    mTBref,
    mRMref,
    mRBref,
    termineA,
    termine1,
    termine2,
    ROB_mGy_MBq: rob
  });
  console.groupEnd();

  // ============================================================
  // 💾 Output
  // ============================================================
  if ($('#kpiROB')) {
    $('#kpiROB').textContent = Number.isFinite(rob)
      ? rob.toExponential(4)
      : '—';
  }

  return rob;
}




// Trasforma i tooltip in formule LaTeX
document.querySelectorAll(".card[data-formula]").forEach(el => {
  const latex = el.getAttribute("data-formula");
  // Wrappa la formula per MathJax
  el.setAttribute("data-formula", `\\(${latex}\\)`);
});

// Forza MathJax a renderizzare anche i tooltip
if (window.MathJax) {
  MathJax.typesetPromise();
}



function computeSelfDose(selfIrradiation, adminActivity) {
  if (!selfIrradiation || !adminActivity) return 0;

  // selfIrradiation è in mGy/MBq
  // adminActivity è in MBq
  const selfDose = (selfIrradiation * adminActivity) / 1000;

  console.group("📊 Self Dose");
  console.log("Self-irradiation (mGy/MBq) =", selfIrradiation);
  console.log("Attività somministrata (MBq) =", adminActivity);
  console.log("Self Dose (Gy) =", selfDose);
  console.groupEnd();

  return selfDose;
} 



function computeCrossDose(rob, adminActivity) {
  if (!rob || !adminActivity) return 0;

  // rob in mGy/MBq
  // adminActivity in MBq
  const crossDose = (rob * adminActivity) / 1000;

  console.group("📊 Cross Dose");
  console.log("ROB (mGy/MBq) =", rob);
  console.log("Attività somministrata (MBq) =", adminActivity);
  console.log("Cross Dose (Gy) =", crossDose);
  console.groupEnd();

  return crossDose;
}


function computeTotalDoseGy(selfDose, crossDose) {
  const totalDose = (selfDose || 0) + (crossDose || 0);

  console.group("📊 Total Dose (Gy)");
  console.log("Self Dose (Gy) =", selfDose);
  console.log("Cross Dose (Gy) =", crossDose);
  console.log("Total Dose (Gy) =", totalDose);
  console.groupEnd();

  return totalDose;
}

function computeTotalDosePerAdminActivity(totalDoseGy, adminActivity) {
  if (!totalDoseGy || !adminActivity) return 0;

  // totalDoseGy è in Gy → ×1000 per convertire in mGy
  const totalDosePerAdmin = (totalDoseGy * 1000) / adminActivity;

  console.group("📊 Total Dose per Admin Activity");
  console.log("Total Dose (Gy) =", totalDoseGy);
  console.log("Admin Activity (MBq) =", adminActivity);
  console.log("Total Dose per Admin Activity (mGy/MBq) =", totalDosePerAdmin);
  console.groupEnd();

  return totalDosePerAdmin;
}




function computeDerivedMassesAndAUC() {
  if (!state.fit || !state.patient) {
    console.warn("⚠️ computeDerivedMassesAndAUC: manca fit o patient");
    return;
  }
  const { sex, wt, rmkg } = state.patient;
const BLOOD_DENSITY = 1.0; // g/ml (se vuoi puoi mettere 1.06)
const Ablood1ml = state.fit?.Ablood1ml || 0;   // h/ml
const AbloodHg  = Ablood1ml  /  BLOOD_DENSITY;   // h/kg

  // Masse reali
  const mrm = rmkg || 0;               // kg midollo
  const mrb = (wt && mrm) ? (wt - mrm) : 0; // corpo intero escluso midollo
  // AUC midollo (Excel-like: Ãrm = Ãblood[h/g] × mRM[g])
  const Arm = AbloodHg * (mrm * 1000);


  const AwbEff = state.fitWB?.aucEff || state.fit?.AwbEff || 0;

const Arb    = Math.max(0, AwbEff - Arm);

console.log(`📘 Ã_rb (rm,tb) = ${AwbEff.toFixed(3)} - ${Arm.toFixed(3)} = ${Arb.toFixed(3)}`);

  const Alim      = Number(state.fit?.AwbLim) || 0;

  // Helper
  const pickBySex = (sex, maleVal, femaleVal) => (sex === "M" ? maleVal : femaleVal);

  // Riferimenti da tabella
  const mTBref = pickBySex(sex, REF_STD.male.mTB, REF_STD.female.mTB);
  const mRMref = pickBySex(sex, REF_STD.male.mRM, REF_STD.female.mRM);
  const mRBref = mTBref - mRMref;





  // Parametri S e scaling
  const SrmTB = pickBySex(sex, REF_STD.male.SrmTB, REF_STD.female.SrmTB);
  const SrmRM = pickBySex(sex, REF_STD.male.SrmRM, REF_STD.female.SrmRM);
const exp1  = pickBySex(sex, SCALING.male.x1, SCALING.female.x1);
const exp2  = pickBySex(sex, SCALING.male.x2, SCALING.female.x2);
const exp3  = pickBySex(sex, SCALING.male.x3, SCALING.female.x3);


  // Calcoli Traino et al. 2007
 
const coeffS = pickBySex(sex, REF_STD.male.SrmRM, REF_STD.female.SrmRM);
console.log("🔍 Parametri selfIrr", {
  AbloodHg,
  mrm,
  coeffS,
  mRMref,
  exp3
});
const selfIrr = computeSelfIrradiation(AbloodHg, mrm, coeffS, mRMref, exp3);


// ===============================
// Dentro computeDerivedMassesAndAUC
// ===============================
const patientData = {
  sex,
  wt,
  AbloodHg,
  mRM: mrm,
  Arb
};

const refData = {
  SrmTB,
  SrmRM
};

const scaling = { exp1, exp2, exp3 };

// ✅ Ora passiamo sex e lasciamo che computeROB prenda i valori REF_STD giusti
const rob = computeROB({
  Arb,
  AbloodHg,
  mrm,
  wt,
  SrmTB,
  SrmRM,
  sex,      // 🔹 aggiunto: decide se usare REF_STD.male o REF_STD.female
  exp1,
  exp2,
  exp3
});


const adminActivity =
  Number(state.admin?.adminMBq) ||
  Number(state.admin?.admin) ||
  Number(state.admin?.administered) ||
  0;

const selfDose  = computeSelfDose(selfIrr, adminActivity);
const crossDose = computeCrossDose(rob, adminActivity);

state.kpi.selfDose  = selfDose;
state.kpi.crossDose = crossDose;








 const totalDoseGy  = computeTotalDoseGy(selfDose, crossDose);
 const totalDosePerAdmin = computeTotalDosePerAdminActivity(totalDoseGy, adminActivity);

  // Stato globale
  state.derived = { Arm, Arb, mrm, mrb, mrbRef: mRBref, mrmRef: mRMref, Alim };

  // =======================
  // KPI
  // =======================
  $('#kpiArm').textContent    = Arm   ? Arm.toFixed(3)   : '—';
  $('#kpiArb').textContent    = Arb   ? Arb.toFixed(2)   : '—';
  $('#kpiMrm').textContent    = mrm   ? mrm.toFixed(3)   : '—';
  $('#kpiMrb').textContent    = mrb   ? mrb.toFixed(2)   : '—';
  $('#kpiMrbRef').textContent = mRBref? mRBref.toFixed(2): '—';
  $('#kpiAlim').textContent   = (isFinite(Alim) && Alim > 0) ? Alim.toFixed(2) : '—';

  $('#kpiSelfIrradiation').textContent        = isFinite(selfIrr)   ? selfIrr.toExponential(4) : '—';
  $('#kpiROB').textContent                    = isFinite(rob)       ? rob.toExponential(4)     : '—';
  $('#kpiSelfDose').textContent               = isFinite(selfDose)  ? selfDose.toFixed(4)      : '—';
  $('#kpiCrossDose').textContent              = isFinite(crossDose) ? crossDose.toFixed(4)     : '—';
  $('#kpiTotalDoseGy').textContent            = isFinite(totalDoseGy)  ? totalDoseGy.toFixed(4) : '—';
  $('#kpiTotalDosePerAdminActivity').textContent = isFinite(totalDosePerAdmin) ? totalDosePerAdmin.toFixed(4) : '—';

  // =======================
  // Logging
  // =======================
  console.group("📊 Derived AUC & Masses");
  console.log("Ãrm [h] =", Arm);
  console.log("Ãrb (rm,tb) [h] =", Arb);
  console.log("mrm [kg] =", mrm);
  console.log("mrb (rm,tb) [kg] =", mrb);
  console.log("REFERENCE mRB (rm,tb) [kg] =", mRBref);
  console.log("REFERENCE mRM [kg] =", mRMref);
  console.log("Ãlim [h] =", Alim);
  console.groupEnd();
}















// =============================
// Fit bi-esponenziale del WHOLE BODY
// =============================
function computeFitWB() {
  const wbChart = ensureChart("wb", "chartWB", "FIA dati (%)", "Fit bi-exp");
  if (!wbChart) return;

  const spanFit = $('#wbFit');
  if (!spanFit) {
    console.warn("⚠️ computeFitWB: elemento #wbFit non trovato nel DOM");
    return;
  }

  if (state.wb.length < 3) {
    spanFit.textContent = 'Fit non eseguito (pochi dati)';
    state.fit.wb = null;
    state.fit.Awb = null;
    state.fit.AlimWB = null;
    state.fit.AwbEff = null;
    setKPIs();
    return;
  }

  try {
    const x = state.wb.map(r => r.t);
    const y = state.wb.map(r => r.fia);

    const yMax = Math.max(...y);
    const yNorm = y.map(v => v / yMax);

    // Fit
    const { A, B, C, D, r2 } = fitBiExp(x, yNorm);

    // Riscala A e C
    const Ares = A * yMax;
    const Cres = C * yMax;

    // Parametri per AUC
// Tempo limite coerente con Excel (default 24h, oppure parametrico)
const t12 = toNumber($('#ptT12').value) || 0;
const tauLim = 24; // ore, come Excel
const datiWB = state.wb.map(r => ({ t: r.t, y: r.fia }));
const fitWB = { A: Ares, B, C: Cres, D };   // oggetto fit corretto
const resWB = computeAUC(fitWB, t12, datiWB, "WB");



    // Aggiorna riga compatta
    spanFit.textContent =
      `A=${Ares.toExponential(2)}  B=${B.toFixed(3)}  ` +
      `C=${Cres.toExponential(2)}  D=${D.toFixed(3)}  |  ` +
      `Ã_wb=${resWB.auc.toExponential(2)} h  |  ` +
      `Ã_lim=${resWB.aucLim.toExponential(2)} h  |  ` +
      `Ã_eff=${resWB.aucEff.toExponential(2)} h  |  ` +
      `R²=${r2.toFixed(2)}`;

    // Salva stato
    state.fit.wb = { A: Ares, B, C: Cres, D, r2 };
    state.fit.Awb = resWB.auc;
    state.fit.AlimWB = resWB.aucLim;
    state.fit.AwbEff = resWB.aucEff;
	state.fit.AwbLim  = resWB.aucLim;

    // Aggiorna grafico
    wbChart.data.datasets[0].data = x.map((t, i) => ({ x: t, y: y[i] }));
    wbChart.data.datasets[1].data = Array.from({ length: 200 }, (_, i) => {
      const t = Math.min(...x) + (Math.max(...x) - Math.min(...x)) * i / 199;
      return { x: t, y: (Ares * Math.exp(-B * t) + Cres * Math.exp(-D * t)) };
    });
    wbChart.update();

    // Log
    console.group("📊 Fit WB");
    console.log("A =", Ares);
    console.log("B =", B);
    console.log("C =", Cres);
    console.log("D =", D);
    console.log("R² =", r2);
    console.log("AUC WB =", resWB.auc);
    console.log("AUC limit =", resWB.aucLim);
    console.log("AUC eff =", resWB.aucEff);
    console.groupEnd();

  } catch (e) {
    console.warn("❌ Fit WB error", e);
    spanFit.textContent = 'Fit non riuscito';
    state.fit.wb = null;
    state.fit.Awb = null;
    state.fit.AlimWB = null;
    state.fit.AwbEff = null;
  }

  setKPIs();

}

/*********************** Whole Body data ***********************/

async function importWBFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);

    // Trova la riga header e mappa gli indici
    const hIdx = lines.findIndex(l => /\bStep\b/i.test(l) && /\bLettura\b/i.test(l));
    let idxTempo = 4, idxEff = 6, idxLett = 8; // fallback “vecchi” indici
    if (hIdx >= 0) {
      const headers = lines[hIdx].split('\t').map(h => h.trim());
      const find = (re) => headers.findIndex(h => re.test(h));
      idxTempo = (find(/Tempo/i) !== -1) ? find(/Tempo/i) : idxTempo;              // "Tempo (min)"
      idxEff   = (find(/Orario\s*Eff/i) !== -1) ? find(/Orario\s*Eff/i) : idxEff;  // "Orario Effettivo"
      idxLett  = (find(/Lettura/i) !== -1) ? find(/Lettura/i) : idxLett;           // "Lettura (auto)"
    }

    // Prendi solo le righe MISURA dopo l’header
    const dataLines = lines.slice(hIdx + 1).filter(l => /^\d+\tMISURA\b/.test(l));

    const nuovaWB = [];
    for (const line of dataLines) {
      const parts = line.split('\t');
      if (!parts[idxTempo] || !parts[idxLett]) continue;

      const tempoMin = toNumber(parts[idxTempo]);   // usa il tuo helper che gestisce virgole/spazi
      const lettura  = toNumber(parts[idxLett]);    // notazione scientifica OK
      const orarioEff = parts[idxEff] || '';

      if (tempoMin != null && lettura != null) {
        nuovaWB.push({ t: tempoMin / 60, read: lettura, datetime: orarioEff });
      }
    }

    if (!nuovaWB.length) {
      alert("Nessuna riga valida trovata (controlla colonne ‘Tempo (min)’ e ‘Lettura (auto)’ nel clipboard).");
      renderWB(); // pulisce eventuale tabella
      return;
    }

    // Ordina e calcola FIA%
    nuovaWB.sort((a, b) => a.t - b.t);
    const first = nuovaWB[0].read || 1;
    state.wb = nuovaWB.map(x => ({ ...x, fia: (x.read / first) * 100 }));

    saveLocal();
    renderWB();   // popola tabella e aggiorna il grafico
    alert("Dati WB importati con successo!");
  } catch (err) {
    alert("Errore nell'import WB: " + err);
  }
}






function clearWB(){ state.wb=[]; saveLocal(); renderWB(); }

function renderWB() {
  const tb = $('#tblWB tbody'); 
  if (!tb) {
    console.error("❌ Tabella tblWB non trovata!");
    return;
  }
  tb.innerHTML = '';

  state.wb.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.t.toFixed(2)}</td>
      <td>${(+r.read).toExponential(3)}</td>
      <td>${(r.fia || 0).toFixed(2)}</td>
      <td><button class="delWB" data-idx="${i}">✖</button></td>
    `;
    tb.appendChild(tr);
  });

  // attach delete events
  tb.querySelectorAll('.delWB').forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.dataset.idx;
      state.wb.splice(idx, 1);
      saveLocal();
      renderWB();
    };
  });

  // aggiorna grafico + fit
  computeFitWB();
}




/*********************** Blood data ***********************/
function addBloodRow() {
  const t0 = state.admin?.adminDT ? new Date(state.admin.adminDT).getTime() : null;
  if (!t0) {
    alert("⚠️ Inserire prima la data/ora di somministrazione");
    return;
  }

  const dtSample = $('#bloodDT').value;
  const dtCount  = $('#bloodCountDT').value;
  const cpm      = toNumber($('#bloodCPM').value) || 0;
  const vol      = toNumber($('#bloodVol').value) || 1;

  if (!dtSample || !cpm) {
    alert("⚠️ Inserire almeno data/ora del prelievo e CPM");
    return;
  }

  // tempo dopo somministrazione
  const t = (new Date(dtSample).getTime() - t0) / (1000 * 60 * 60);

  // concentrazione in kBq/ml (assumi che 1 CPM = 1 Bq, puoi adattare fattore di calibrazione)
  const conc_kBqml = cpm / 1000 / vol;

  // normalizza con la funzione ufficiale
  const row = normalizeBlood({
    t,
    vol,
    cpm,
    conc_kBqml,
    datetimeSample: dtSample,
    datetimeCount: dtCount
  });

  state.blood.push(row);
  renderBlood();
  saveLocal();
}



function clearBlood(){ state.blood=[]; saveLocal(); renderBlood(); }

function renderBlood(){
  const isotope = state.patient?.radio || $('#ptRadio')?.value || "";
  const counter = state.patient?.counter || $('#bloodCounter')?.value || "Capintec";
  const calibInput = $('#bloodCalib');
 if (!calibInput) return;
  if (isotope === "131I") {
    if (counter === "Germanio") {
      calibInput.value = "calib = -0.00037146·CPM + 621.165";
    } else if (counter === "Capintec") {
      calibInput.value = "calib = -0.00208121·CPM + 17339";
    } else {
      calibInput.value = "formula non definita";
    }
  } else {
    // fallback: mostra il valore fisso
    const calib = CALIBRATION_FACTORS[counter]?.[isotope] || "";
    calibInput.value = calib;
  }


	
  const tb = $('#tblBlood tbody'); 
  if (!tb) {
    console.error("❌ Tabella tblBlood non trovata!");
    return;
  }
  tb.innerHTML = '';

  state.blood.forEach((r,i) => {
    const conc = r.conc_kBqml ?? r.conc ?? 0;
    const fiaBlood = r.fiaBlood ?? r.fiasangue ?? 0;
	const netWeight = r.netWeight ?? 1.06;   // 🆕 aggiunto

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${r.datetimeSample || '—'}</td>
      <td>${r.datetimeCount || '—'}</td>
      <td>${r.t.toFixed(2)}</td>
      <td>${r.vol}</td>
      <td>${r.cpm}</td>
	  <td>${netWeight}</td> <!-- 🆕 nuova colonna Netto (g) -->
      <td>${conc.toFixed(1)}</td>
      <td>${(r.fia1ml || 0).toExponential(6)}</td>
      <td>${fiaBlood.toFixed(2)}</td>
      <td><button class="delBlood" data-idx="${i}">✖</button></td>
    `;
    tb.appendChild(tr);
  });

  // attach delete events
  tb.querySelectorAll('.delBlood').forEach(btn => {
    btn.onclick = () => {
      const idx = +btn.dataset.idx;
      state.blood.splice(idx, 1);
      saveLocal();
      renderBlood();
    };
  });
    // aggiorna grafico + fit
  computeFitBlood();
}


/**
 * 📥 parseBloodTable()
 * Ricostruisce l'array state.blood leggendo i valori attuali dalla tabella UI.
 * Utile se i valori vengono modificati manualmente o ricalcolati dopo il caricamento.
 */
function parseBloodTable() {
  const tbody = $('#tblBlood tbody');
  if (!tbody) return;

  const rows = Array.from(tbody.rows);
  state.blood = rows.map(row => ({
    datetimeSample: row.cells[1].textContent !== '—' ? row.cells[1].textContent : null,
    datetimeCount: row.cells[2].textContent !== '—' ? row.cells[2].textContent : null,
    t: parseFloat(row.cells[3].textContent) || 0,
    vol: parseFloat(row.cells[4].textContent) || 1,
    cpm: parseFloat(row.cells[5].textContent) || 0,
    netWeight: parseFloat(row.cells[6].textContent) || 1,
    conc: parseFloat(row.cells[7].textContent) || 0,
    fia1ml: parseFloat(row.cells[8].textContent) || 0,
    fiasangue: parseFloat(row.cells[9].textContent) || 0
  }));

  console.log("📥 parseBloodTable → state.blood ricostruito:", state.blood);
  saveLocal();
}






/*********************** KPIs ***********************/
function setKPIs(){
  $('#kpiAwb').textContent = state.fit.Awb!=null? state.fit.Awb.toFixed(2): '—';

  $('#kpiAblood').textContent = state.fit.Ablood1ml!=null? state.fit.Ablood1ml.toExponential(2): '—';
  const AbloodKg = state.fit.Ablood1ml!=null? state.fit.Ablood1ml*1000 : null; // 1 ml ≈ 1 g
  $('#kpiAbloodkg').textContent = AbloodKg!=null? AbloodKg.toFixed(3) : '—';
}

/*********************** Dose ***********************/
function computeDose() {
  console.group("💉 computeDose()");

  // === Calcolo preliminare ===
  computeBLV(true); // assicura dati paziente aggiornati

  const IA_MBq = (state.patient?.adminGBq || 0) * 1000; // GBq → MBq
  const useLimitEl = $('#useLimit');
  const overrideEl = $('#overrideRMBR');

  const useLimit = useLimitEl ? (useLimitEl.value === '1') : false;
  const Swb = state.patient?.Swb || toNumber($('#S_wb')?.value) || 0;
  const Sblood = state.patient?.Sblood || toNumber($('#S_blood')?.value) || 0;
  const rmbr = overrideEl
    ? (toNumber(overrideEl.value) || state.patient?.rmbr || 1.0)
    : (state.patient?.rmbr || 1.0);

  const Awb_h = state.fit?.Awb || 0;
  const Alim_h = state.fit?.Alim || Awb_h;
  const AwbEff = useLimit ? Math.min(Awb_h, Alim_h) : Awb_h;

  const Ablood1ml_h = state.fit?.Ablood1ml || 0;
  const AbloodKg_h = Ablood1ml_h * 1000; // h/kg
  const AbloodEff = AbloodKg_h * rmbr;

// === Calcoli dosimetrici base ===
const doseWB = Swb * AwbEff * IA_MBq;          // whole-body
const doseBlood = Sblood * AbloodEff * IA_MBq; // dose al sangue (Gy)

// =======================================================
// 🎯 Calcolo attività necessaria per ottenere 2 Gy al sangue
// =======================================================
let activity2Gy = null;
try {
    // Se esiste una brach di attività reale
    const adminGBq = parseFloat(state.patient?.adminGBq || 0);

    if (adminGBq > 0 && doseBlood > 0) {
        // (Gy/GBq)
        const Gy_per_GBq = doseBlood / adminGBq;

        // attività necessaria per 2 Gy
        activity2Gy = 2 / Gy_per_GBq;   // [GBq]

        console.log("🔵 Activity 2 Gy (GBq):", activity2Gy);
    } else {
        console.warn("⚠️ activity2Gy non calcolabile: adminGBq o doseBlood non validi");
    }
} catch (err) {
    console.error("❌ Errore nel calcolo activity2Gy:", err);
}

// Memorizzazione nel KPI
state.kpi = state.kpi || {};
state.kpi.activity2Gy = activity2Gy;


  // === Aggiornamento UI (dose rapida) ===
  const elDoseWB = $('#doseWB');
  if (elDoseWB) elDoseWB.textContent = isFinite(doseWB) ? doseWB.toFixed(1) : '—';

  const elDoseBlood = $('#doseBlood');
  if (elDoseBlood) elDoseBlood.textContent = isFinite(doseBlood) ? doseBlood.toFixed(1) : '—';

  const elEsito = $('#doseEsito');
  if (elEsito) {
    elEsito.innerHTML = `<span class="pill ${doseBlood > 150 ? 'danger' : 'ok'}">
      ${doseBlood > 150 ? 'ATTENZIONE' : 'OK'}
    </span>`;
  }

  // === Gestione per isotopi ===
  const isotope = state.patient?.radio || "";

  if (isotope.includes("131I")) {
    // 🔹 modello dedicato iodio
    const res = computeDose_I131_fromFit();
    updateDoseCard(isotope, res);
    console.groupEnd();
    return;
  }

  // 🔹 default (Lu-177, Y-90, ecc.)
  updateDoseCard(isotope, null);

  // ======================
  // 🔹 Calcolo KPI dosimetrici
  // ======================
  const doseSelf = doseBlood;  // per Lu-177: self ≈ sangue
  const doseCross = doseWB;    // per Lu-177: cross ≈ whole-body
  const doseMidollo = doseSelf + doseCross;

  state.kpi = {
    ...state.kpi,
    aucWB: state.fit?.AwbEff ?? null,
    aucBlood: state.fit?.AbloodEff ?? null,
    aucEff: Math.min(state.fit?.AwbEff ?? Infinity, state.fit?.AbloodEff ?? Infinity),
    aucLim: Math.min(state.fit?.AwbLim ?? Infinity, state.fit?.AbloodLim ?? Infinity),
    lambdaPhys: state.patient?.lambda ?? null,
    tau: state.patient?.tau ?? null,
    doseSelf,
    doseCross,
    doseMidollo,
    doseWB
  };

  state.dose = {
    self: doseSelf,
    cross: doseCross,
    midollo: doseMidollo,
    WB: doseWB
  };

  console.log("💾 KPI dosimetrici aggiornati:", state.kpi);
  console.log("💉 Dose Midollo calcolata:", { doseSelf, doseCross, doseMidollo, doseWB });

  // ======================
  // 💾 Salvataggio pulito nel localStorage (dopo aggiornamento KPI)
  // ======================

setTimeout(() => {
  try {
    const cleanState = {
      patient: {
        ID: state.patient?.ID || "",
        nome: state.patient?.nome || "",
        cognome: state.patient?.cognome || "",
        sesso: state.patient?.sesso || "",
        peso: state.patient?.peso || null,
        altezza: state.patient?.altezza || null,
        dataNascita: state.patient?.dataNascita || "",
        dataRicovero: state.patient?.dataRicovero || "",
        radio: state.patient?.radio || "",
        adminGBq: state.patient?.adminGBq || 0
      },
      fit: {
        blood: Array.isArray(state.blood) ? state.blood : [],
        wb: Array.isArray(state.wb) ? state.wb : [],
        AwbEff: state.fit?.AwbEff ?? null,
        AbloodEff: state.fit?.AbloodEff ?? null
      },

kpi: {
  // 🔹 uniforma nomi tra calcolo e report
  doseSelf: state.kpi?.doseSelf ?? state.kpi?.selfDose ?? 0,
  doseCross: state.kpi?.doseCross ?? state.kpi?.crossDose ?? 0,
  doseMidollo:
    state.kpi?.doseMidollo ??
    (state.kpi?.selfDose ?? 0) + (state.kpi?.crossDose ?? 0),
  doseWB: state.kpi?.doseWB ?? state.kpi?.WB ?? 0,
  // 🔹 attività per 2 Gy al sangue (NUOVO KPI)
  activity2Gy: state.kpi?.activity2Gy ?? null,
  // 🔹 mantieni anche i nomi originali per compatibilità futura
  selfDose: state.kpi?.selfDose ?? 0,
  crossDose: state.kpi?.crossDose ?? 0
}

    };

    localStorage.setItem("doseMidolloState", JSON.stringify(cleanState));
    console.log("💾 Stato dosimetrico salvato (pulito ma completo):", cleanState);
  } catch (err) {
    console.warn("⚠️ Errore nel salvataggio del localStorage:", err);
  }
}, 250); // ⏱️ piccolo delay per garantire KPI aggiornati


  console.groupEnd();
}







/*********************** Render All ***********************/
function renderAll() {
  // patient
  const p = state.patient || {};

  if (p.age !== undefined && $('#ptAge')) {
    $('#ptAge').textContent = p.age;
  }

  if ($('#ptName'))   $('#ptName').value   = p.name    || '';
  if ($('#ptCC'))     $('#ptCC').value     = p.cc      || '';
  if ($('#ptBabele')) $('#ptBabele').value = p.babele  || '';
  if ($('#ptDOB'))    $('#ptDOB').value    = p.dob     || '';
  if ($('#ptSex'))    $('#ptSex').value    = p.sex     || 'F';
  if ($('#ptWt'))     $('#ptWt').value     = p.wt      || '';
  if ($('#ptHt'))     $('#ptHt').value     = p.ht      || '';

  // campi opzionali: verifico che esistano
  const elAdminGBq = $('#ptAdminGBq');
  if (elAdminGBq) elAdminGBq.value = p.adminGBq || '';

  const elAdminDT = $('#ptAdminDT');
  if (elAdminDT) elAdminDT.value = p.adminDT || '';

  if ($('#ptT12'))    $('#ptT12').value    = (p.t12 !== undefined) ? p.t12 : $('#ptT12').value;
  if ($('#ptTau'))    $('#ptTau').value    = p.tau   || '';
  if ($('#ptRMkg'))   $('#ptRMkg').value   = p.rmkg  || '';

  const elRMBlood = $('#ptRMBlood');
  if (elRMBlood) elRMBlood.value = p.rmbr || '';

  // campi futuri
  const elSwb = $('#S_wb');
  if (elSwb) elSwb.value = p.Swb || '';

  const elSblood = $('#S_blood');
  if (elSblood) elSblood.value = p.Sblood || '';

  // KPI
  if (p.blv && $('#kpiBLV'))
    $('#kpiBLV').textContent = p.blv;

  if (p.lambda && $('#kpiLambda'))
    $('#kpiLambda').textContent = p.lambda.toFixed(3);

  const elKpiMBq = $('#kpiMBq');
  if (p.adminGBq && elKpiMBq)
    elKpiMBq.textContent = (p.adminGBq * 1000).toFixed(0);

  const elKpiDT = $('#kpiDT');
  if (p.adminDT && elKpiDT)
    elKpiDT.textContent = p.adminDT;

  // Ricalcola subito dopo aver popolato la UI
  computeBLV(true);
  calcAdmin();      // <-- prima
  computeDose();

  // tables
  renderWB();
  renderBlood();    // <-- dopo
}





/*********************** Events & Init ***********************/
document.addEventListener("DOMContentLoaded", () => {
if ($('#btnFitWB')) $('#btnFitWB').onclick = computeFitWB;
if ($('#btnFitBlood')) $('#btnFitBlood').onclick = computeFitBlood;

  if ($('#clearWB'))         $('#clearWB').onclick       = clearWB;
  if ($('#addBlood'))        $('#addBlood').onclick      = addBloodRow;
  if ($('#importWB'))        $('#importWB').onclick      = importWBFromClipboard;
  if ($('#clearBlood'))      $('#clearBlood').onclick    = clearBlood;
  if ($('#btnComputeDose'))  $('#btnComputeDose').onclick= computeDose;
  if ($('#btnPDF'))          $('#btnPDF').onclick        = generaPDF_Midollo;
  if ($('#btnSave'))         $('#btnSave').onclick       = downloadJSON;
  if ($('#btnLoad'))         $('#btnLoad').onclick       = uploadJSON;
  if ($('#btnReset'))        $('#btnReset').onclick      = () => {
    if (confirm('Sicuro di cancellare i dati locali?')) {
      localStorage.removeItem('midolloApp');
      location.reload();
    }
  };
// 🔸 Associa il bottone al file input
document.getElementById('btnLoad').addEventListener('click', () => {
  document.getElementById('fileJSON').click();
});

// 🔸 Caricamento effettivo
document.getElementById('fileJSON').addEventListener('change', uploadJSON);



  // Apri modal wb
  if ($('#addWB')) {
    $('#addWB').onclick = () => {
      $('#modalWB').style.display = 'flex';
    };
  }

  // Chiudi modal wb
  if ($('#closeModalWB')) {
    $('#closeModalWB').onclick = () => {
      $('#modalWB').style.display = 'none';
    };
  }

// Aggiungi misura da modal wb 
if ($('#btnAddWBModal')) {
  $('#btnAddWBModal').onclick = () => {
    const dt1 = $('#wbDatetime1').value;
    const dt2 = $('#wbDatetime2').value;
    let read1 = toNumber($('#wbRead1').value);  // 🔹 ora let
    let read2 = toNumber($('#wbRead2').value);  // 🔹 ora let

    if (!dt1 || !dt2 || read1 == null || read2 == null) {
      alert("Inserisci entrambe le date/ore e le letture valide");
      return;
    }

    // Ordina per data
    let d1 = new Date(dt1), d2 = new Date(dt2);
    if (d2 < d1) { [d1, d2] = [d2, d1]; [read1, read2] = [read2, read1]; }

    // Recupera data somministrazione
    const elAdmin = $('#admAdminDT');
    const dtAdmin = elAdmin && elAdmin.value ? new Date(elAdmin.value) : null;
    if (!dtAdmin) {
      alert("Manca la data/ora di somministrazione (Patient Registry)");
      return;
    }

    // Tempo trascorso tra admin e seconda misura
    const deltaH = (d2 - dtAdmin) / (1000 * 60 * 60);

    // Rapporto tra le due letture (accodato così com’è)
    const rapporto = read2 / read1;

    state.wb.push({
      t: deltaH,
      read: rapporto,
      datetime: d2.toISOString(),
      fia: rapporto
    });

    saveLocal();
    renderWB();

    // reset e chiudi modal
    $('#modalWB').style.display = 'none';
    $('#wbDatetime1').value = '';
    $('#wbRead1').value = '';
    $('#wbDatetime2').value = '';
    $('#wbRead2').value = '';
  };
}


// Apri modal Blood
if ($('#addBlood')) {
  $('#addBlood').onclick = () => {
    $('#modalBlood').style.display = 'flex';
  };
}

// Chiudi modal Blood
if ($('#closeModalBlood')) {
  $('#closeModalBlood').onclick = () => {
    $('#modalBlood').style.display = 'none';
  };
}

// 🩸 Aggiungi campione da modal
if ($('#btnAddBloodModal')) {
  $('#btnAddBloodModal').onclick = () => {
    const dtSampleStr = $('#bloodDatetimeSample').value;
    const dtCountStr  = $('#bloodDatetimeCount').value;
    const vol         = toNumber($('#bloodVol').value);
    const cpm         = toNumber($('#bloodCpm').value);
    const netWeight   = toNumber($('#bloodNetWeight')?.value) || 1;  // 🆕 netto coerente

    if (!dtSampleStr || !dtCountStr || [vol, cpm].some(v => v == null)) {
      alert("Inserisci tutti i campi obbligatori");
      return;
    }

    const dtSample = new Date(dtSampleStr);
    const dtCount  = new Date(dtCountStr);

    // 🔹 Tempo post somministrazione
    const dtAdmin = $('#admAdminDT').value ? new Date($('#admAdminDT').value) : null;
    if (!dtAdmin) {
      alert("Manca la data/ora di somministrazione (Patient Registry)");
      return;
    }
    const deltaH = (dtSample - dtAdmin) / (1000 * 60 * 60); // ore

    // 🔹 Correzione decadimento
    const calib = toNumber($('#bloodCalib').value) || 1;

    // λ = ln(2)/T½ (giorni⁻¹)
    const t12 = toNumber($('#ptT12').value) || 0;
    const lambda = t12 ? Math.log(2) / t12 : 0;

    // Δt = (lettura - prelievo) in giorni
    const deltaDays = (dtCount - dtSample) / (1000 * 60 * 60 * 24);

    // 📌 Conc = (CPM / calib) * exp(lambda * Δt) / netWeight
    let conc = (cpm / calib) * Math.exp(lambda * deltaDays) / netWeight;

    // 🔹 FIA
    const measMBq  = Number(state.admin?.meas)  || 0;
    const residMBq = Number(state.admin?.empty) || 0;
    const adminMBq = Math.max(0, measMBq - residMBq);
    const adminGBq = adminMBq / 1000;

    const fia1ml = adminGBq > 0 ? (conc * vol) / (adminGBq * 1e6) : 0;
    const fiasangue = fia1ml * (state.patient?.blv || 0) * 100;

    state.blood.push({
      t: deltaH,
      vol,
      cpm,
      netWeight,              // 🆕 coerente con normalizeBlood()
      conc,
      fia1ml,
      fiasangue,
      datetimeSample: dtSampleStr,
      datetimeCount: dtCountStr
    });

    state.blood.sort((a, b) => a.t - b.t);
    saveLocal();
    renderBlood();

    // 🔹 Ripropone la stessa data lettura (solo giorno)
    $('#bloodDatetimeCount').value = dtCountStr.split("T")[0] + "T";

    // reset solo prelievo/CPM
    $('#bloodDatetimeSample').value = '';
    $('#bloodT').value = '';
    $('#bloodVol').value = '1';
    $('#bloodCpm').value = '';
    if ($('#bloodNetWeight')) $('#bloodNetWeight').value = '';  // 🧹 reset netto
  };
}

//RESETTA INTERFACCIA
const btnReset = document.getElementById("btnReset");
  if (btnReset) {
    btnReset.addEventListener("click", resetAll);
  }


  // inizializza l’interfaccia
  renderAll();

  // carica dati salvati se esistono
  if (typeof loadLocal === "function") loadLocal();
});










//================================Carica da Report Physico PDF 

document.getElementById("btnImportPDF").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/pdf";
  input.onchange = () => {
    const file = input.files[0];
    if (file) importFromPDF(file);
  };
  input.click();
});

function parseDateTime(str) {
  if (!str) return null;
  const parts = str.match(/\d+/g);
  if (!parts || parts.length < 5) return null;

  const d  = parts[0].padStart(2, "0");
  const m  = parts[1].padStart(2, "0");
  const y  = parts[2];
  const hh = parts[3].padStart(2, "0");
  const mm = parts[4].padStart(2, "0");
  const ss = parts[5] ? parts[5].padStart(2, "0") : "00";

  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
  const dt = new Date(iso);

  return isNaN(dt) ? null : dt;
}


async function importFromPDF(file) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  let fullText = "";

  // Estrai testo da tutte le pagine
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(it => it.str);
    fullText += strings.join(" ") + "\n";
  }

  console.group("📥 Importazione PDF");
  console.log("Testo completo (prime 500 chars):", fullText.slice(0, 500) + "...");

  // ================== 🔹 Parsing dati anagrafici ==================
  const patient = {};

  const nameMatch = fullText.match(/Paziente:\s+([A-ZÀ-Ü^ ]+)/i);
  if (nameMatch) {
    patient.name = nameMatch[1].replace(/\^/g, " ").trim();
    $('#ptName').value = patient.name;
  }

  const pidMatch = fullText.match(/PID:\s+([A-Z0-9\-]+)/i);
  if (pidMatch) {
    patient.cc = pidMatch[1];
    $('#ptCC').value = patient.cc;
  }

  const dobMatch = fullText.match(/Data di nascita:\s+(\d{2})-(\d{2})-(\d{4})/i);
  if (dobMatch) {
    patient.dob = `${dobMatch[3]}-${dobMatch[2]}-${dobMatch[1]}`;
    $('#ptDOB').value = patient.dob;
  }

  const sexMatch = fullText.match(/Sesso:\s+([MF])/i);
  if (sexMatch) {
    patient.sex = sexMatch[1];
    $('#ptSex').value = patient.sex;
  }

  const wtMatch = fullText.match(/Peso del Paziente.*?:\s*(\d+)/i);
  if (wtMatch) {
    patient.wt = parseFloat(wtMatch[1]);
    $('#ptWt').value = patient.wt;
  }

  const htMatch = fullText.match(/Altezza del Paziente.*?:\s*(\d+)/i);
  if (htMatch) {
    patient.ht = parseFloat(htMatch[1]);
    $('#ptHt').value = patient.ht;
  }

  const actMatch = fullText.match(/Attivita'.*?:\s*([\d\.]+)/i);
  if (actMatch) {
    const MBq = parseFloat(actMatch[1]);
    patient.adminGBq = MBq / 1000.0; // MBq → GBq
    $('#admMeasured').value = MBq;
  }

  const dateAdmMatch = fullText.match(/Data di Somministrazione:\s+(\d{2})-(\d{2})-(\d{4})\s+Ora di Somministrazione:\s+(\d{2}):(\d{2})/i);
  if (dateAdmMatch) {
    patient.adminDT = `${dateAdmMatch[3]}-${dateAdmMatch[2]}-${dateAdmMatch[1]}T${dateAdmMatch[4]}:${dateAdmMatch[5]}`;
    $('#admAdminDT').value = patient.adminDT;
  }

  Object.assign(state.patient, patient);

  console.group("Dati anagrafici");
  console.log("Nome:", patient.name);
  console.log("PID:", patient.cc);
  console.log("Data nascita:", patient.dob);
  console.log("Sesso:", patient.sex);
  console.log("Peso:", patient.wt);
  console.log("Altezza:", patient.ht);
  console.log("Attività GBq:", patient.adminGBq);
  console.log("Data/Ora somministrazione:", patient.adminDT);
  console.groupEnd();


// ================== 🔹 Parsing misure WB ==================
state.wb = [];
const dtAdmin = state?.patient?.adminDT ? new Date(state.patient.adminDT) : null;

// cerchiamo numeri in notazione scientifica o decimali molto piccoli
const misuraRegex = /(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}).*?(\d\.\d+e?-?\d*|\d\.\d{8,})/gi;

let match;
while ((match = misuraRegex.exec(fullText)) !== null) {
  const effDate = parseDateTime(match[1]);
  const val = parseFloat(match[2]);

  if (!effDate || isNaN(val)) continue;

  const t = dtAdmin ? (effDate - dtAdmin) / 3.6e6 : 0;
  state.wb.push({
    t,
    read: val,
    datetime: effDate.toISOString()
  });
}

// ordina per tempo
state.wb.sort((a, b) => a.t - b.t);

// normalizza rispetto alla prima misura non nulla
const firstNonZero = state.wb.find(r => r.read > 0);
const firstVal = firstNonZero ? firstNonZero.read : null;
if (firstVal) {
  state.wb = state.wb.map(r => ({ ...r, fia: +(r.read / firstVal).toFixed(6) }));
}

console.group("Misure WB importate");
if (!state.wb.length) {
  console.warn("⚠️ Nessuna misura valida trovata.");
} else {
  console.log("AdminDT:", dtAdmin);
  state.wb.forEach((r, i) =>
    console.log(`#${i + 1}`, "t(h):", r.t.toFixed(2), "Read:", r.read, "FIA:", r.fia, "DT:", r.datetime)
  );
}
console.groupEnd();

// Aggiorna UI e ricalcola
renderWB();
computeBLV(true);
computeDose();
saveLocal();
renderAll();

}


function updateCalibrationFactor() {
  const radio = $('#ptRadio').value;
  const counter = $('#bloodCounter').value;

  if (CALIBRATION_FACTORS[counter] && CALIBRATION_FACTORS[counter][radio]) {
    $('#bloodCalib').value = CALIBRATION_FACTORS[counter][radio];
  } else {
    $('#bloodCalib').value = '';
  }
}

// 🔸 Aggiorna stato e ricalcola sangue quando cambia radioisotopo
if ($('#ptRadio')) {
  $('#ptRadio').addEventListener("change", (e) => {
    state.patient = state.patient || {};
    state.patient.radio = e.target.value;           // ✅ aggiorna lo state
    console.log("🔄 Isotopo selezionato:", state.patient.radio);
    updateCalibrationFactor();                     // aggiorna formula mostrata
    aggiornaBloodTable();                          // ricalcola concentrazioni
  });
}

// 🔸 Aggiorna stato, formula e ricalcola quando cambia counter
if ($('#bloodCounter')) {
  $('#bloodCounter').addEventListener("change", (e) => {
    state.patient = state.patient || {};
    state.patient.counter = e.target.value;        // ✅ AGGIUNTO
    console.log("🔄 Counter selezionato:", state.patient.counter);
    updateCalibrationFactor();
    aggiornaBloodTable();                          // ricalcola concentrazioni
  });
}

// inizializza al load
updateCalibrationFactor();




function deleteBlood(idx) {
  state.blood.splice(idx, 1);
  renderBlood();
}


// =====================================================
// 🔁 Aggiornamento automatico T½, τ e λ al cambio isotopo
// =====================================================
const isotopeDefaults = {
  "177Lu-Lutathera": { t12: 6.65, td: 9.59 },
  "177Lu-PSMA":      { t12: 6.65, td: 9.80 },
  "131I":            { t12: 8.02, td: 11.57 },
  "90Y":             { t12: 2.67, td: 5.00 },
  "225Ac":           { t12: 9.92, td: 12.0 }
};

// Attiva il listener solo se il menu isotopi è presente
const radioSel = document.querySelector('#ptRadio');
if (radioSel) {
  radioSel.addEventListener('change', e => {
    const iso = e.target.value;
    const def = isotopeDefaults[iso];
    if (!def) return;

    // ✅ aggiorna T½ e τ (in giorni)
    if ($('#ptT12')) $('#ptT12').value = def.t12.toFixed(2);
    if ($('#ptTau')) $('#ptTau').value = def.td.toFixed(2);

    // ✅ calcola λ(d⁻¹)
    const lambda = Math.log(2) / def.t12;
    if ($('#kpiLambda')) $('#kpiLambda').value = lambda.toFixed(4);

    console.log(`📘 Isotopo: ${iso} → T½=${def.t12} d, τ=${def.td} d, λ=${lambda.toFixed(4)} d⁻¹`);

    // ✅ aggiorna lo state, se definito
    if (state.patient) {
      state.patient.t12 = def.t12;
      state.patient.tau = def.td;
      state.patient.lambda = lambda;
      state.patient.radio = iso;
    }

    // 🔁 forza il ricalcolo completo per aggiornare tutti i campi derivati
    if (typeof forceFullRecalc === 'function') {
      forceFullRecalc();
    } else if (typeof computeBLV === 'function') {
      computeBLV(true);
    }
  });
}

function computeDose_I131_fromFit() {
  console.group("🧮 computeDose_I131_fromFit()");

  // ===============================
  // 📥 INPUT principali
  // ===============================
  const sex = state.patient?.sex === "F" ? "F" : "M";
  const age = state.patient?.age || 50;
  const fitWB = state.fit?.wb || {};
  const fitBlood = state.fit?.blood || {};

  const adminGBq = state.admin?.adminGBq || ((state.admin?.adminMBq || 0) / 1000);

  // ===============================
  // 🧮 Calcolo tempi di residenza
  // ===============================
  const tau_WB =
    (fitWB.A / fitWB.B || 0) + (fitWB.C / fitWB.D || 0); // [h]
  const tau_Blood =
    (fitBlood.A / fitBlood.B || 0) + (fitBlood.C / fitBlood.D || 0); // [h/g]

  console.log(`τ_WB (h): ${tau_WB.toExponential(4)}`);
  console.log(`τ_Blood (h/g): ${tau_Blood.toExponential(4)}`);
  console.log(`Età: ${age}, Sesso: ${sex}, Attività: ${adminGBq} GBq`);

  // ===============================
  // 🧩 AIFM (Eq. 13–14) → Dose MIDOLLO
  // ===============================
  const Dmid_AIFM_Gy_per_GBq =
    sex === "M"
      ? (0.105 * (tau_WB / age)) + 61 * tau_Blood
      : (0.0945 * (tau_WB / age)) + 64 * tau_Blood;

  // ===============================
  // 🧩 Traino et al. 2007 (Eq. 15–16) → Dose MIDOLLO
  // ===============================
  const Dmid_Traino_Gy_per_GBq =
    sex === "M"
      ? (55.89 * tau_Blood * Math.pow(age, 0.026)) +
        (tau_WB - 15.2 * tau_Blood * age) *
          ((0.6967 / Math.pow(age, 1.331)) -
           (4.1683 / Math.pow(age, 1.948)))
      : (58.97 * tau_Blood * Math.pow(age, 0.028)) +
        (tau_WB - 22.8 * tau_Blood * age) *
          ((0.5427 / Math.pow(age, 1.302)) -
           (3.4074 / Math.pow(age, 1.944)));

  // ===============================
  // 🧩 EANM 2008 (Eq. 18) → Dose SANGUE
  // ===============================
  const Dblood_EANM_Gy_per_GBq =
    (0.0188 * (tau_WB / Math.pow(age, 2 / 3))) +
    (108 * tau_Blood);

  // ===============================
  // 💉 Conversione in Gy (dosi assolute)
  // ===============================
  const Dmid_AIFM_Gy = Dmid_AIFM_Gy_per_GBq * adminGBq;
  const Dmid_Traino_Gy = Dmid_Traino_Gy_per_GBq * adminGBq;
  const Dblood_EANM_Gy = Dblood_EANM_Gy_per_GBq * adminGBq;
  


  
  
  // === Self/Cross per EANM Eq.18 ===
const self_Gy_per_GBq  = 108 * tau_Blood;
const cross_Gy_per_GBq = 0.0188 * (tau_WB / Math.pow(age, 2/3));
const total_Gy_per_GBq = self_Gy_per_GBq + cross_Gy_per_GBq;

const self_Gy  = self_Gy_per_GBq  * adminGBq;
const cross_Gy = cross_Gy_per_GBq * adminGBq;
const total_Gy = self_Gy + cross_Gy;

const activity_2Gy_GBq = total_Gy_per_GBq > 0 ? 2 / total_Gy_per_GBq : 0;

  
  
  

  // ===============================
  // 🧾 Log riepilogativo
  // ===============================
  console.table({
    "τ_WB (h)": tau_WB,
    "τ_Blood (h/g)": tau_Blood,
    "Dose MIDOLLO AIFM (Gy/GBq)": Dmid_AIFM_Gy_per_GBq,
    "Dose MIDOLLO Traino (Gy/GBq)": Dmid_Traino_Gy_per_GBq,
    "Dose SANGUE EANM (Gy/GBq)": Dblood_EANM_Gy_per_GBq,
    "→ Dose MIDOLLO AIFM (Gy)": Dmid_AIFM_Gy,
    "→ Dose MIDOLLO Traino (Gy)": Dmid_Traino_Gy,
    "→ Dose SANGUE EANM (Gy)": Dblood_EANM_Gy,
  });

  console.groupEnd();

  return {
    tau_WB,
    tau_Blood,
    doseMidollo: {
      AIFM_Gy_per_GBq: Dmid_AIFM_Gy_per_GBq,
      Traino_Gy_per_GBq: Dmid_Traino_Gy_per_GBq,
      AIFM_Gy: Dmid_AIFM_Gy,
      Traino_Gy: Dmid_Traino_Gy,
    },
    doseSangue: {
      EANM_Gy_per_GBq: Dblood_EANM_Gy_per_GBq,
      EANM_Gy: Dblood_EANM_Gy,
	    self_Gy_per_GBq,
  cross_Gy_per_GBq,
  total_Gy_per_GBq,
  self_Gy,
  cross_Gy,
  total_Gy,
  activity_2Gy_GBq
    },
  };
}


function fmtTauSmart(val) {
  if (!val || val <= 0) return "—";
  // Valori molto piccoli → notazione scientifica
  if (val < 0.1) return val.toExponential(3); // es. 3.217e-03
  // Valori normali → due decimali
  if (val < 100) return val.toFixed(4);
  // Valori grandi → massimo tre cifre significative
  return val.toPrecision(3);
}



function updateDoseCard(isotope, result) {
  const doseTitle   = document.getElementById("doseTitle");
  const gridDefault = document.getElementById("doseGrid");
  const gridIodine  = document.getElementById("iodineGrid");

  // === Titolo dinamico ===
  if (isotope.includes("177Lu-Lutathera")) doseTitle.textContent = "Dose Midollo – Lutathera";
  else if (isotope.includes("177Lu-PSMA")) doseTitle.textContent = "Dose Midollo – Lu-PSMA";
  else if (isotope.includes("131I"))        doseTitle.textContent = "Dose Midollo – Iodio-131";
  else doseTitle.textContent = "Dose Midollo";

  // === Logica visibilità ===
  const isIodio = isotope.includes("131I");
  gridDefault.style.display = isIodio ? "none" : "grid";
  gridIodine.style.display  = isIodio ? "grid" : "none";
  if (!isIodio || !result) return;

  // === Estrazione diretta dai risultati ===
  const { tau_WB, tau_Blood, doseMidollo, doseSangue } = result;

  const tauWB    = tau_WB || 0;
  const tauBlood = tau_Blood || 0;
  const AIFM_Gy  = doseMidollo?.AIFM_Gy || 0;
  const Traino_Gy = doseMidollo?.Traino_Gy || 0;
  const Sangue_Gy = doseSangue?.EANM_Gy || 0;
  const Sangue_Gy_per_GBq = doseSangue?.EANM_Gy_per_GBq || 0;
  
  // === Calcolo self/cross dal modello EANM Eq.18 ===
const age = state.patient?.age || 50;

const selfDose_per_GBq  = 108 * tauBlood; // [Gy/GBq]
const crossDose_per_GBq = 0.0188 * (tauWB / Math.pow(age, 2/3)); // [Gy/GBq]
const totDose_per_GBq   = selfDose_per_GBq + crossDose_per_GBq;

const selfDose_Gy  = selfDose_per_GBq * (state.admin?.adminGBq || 0);
const crossDose_Gy = crossDose_per_GBq * (state.admin?.adminGBq || 0);


  // === Calcolo attività che porta a 2 Gy nel sangue ===
  const act2Gy_GBq = Sangue_Gy_per_GBq > 0 ? 2 / Sangue_Gy_per_GBq : 0;

  // === Scelta colore in base al rischio clinico ===
  let riskColor = "#16a34a"; // verde <1.5 Gy
  if (Sangue_Gy_per_GBq >= 1.5 && Sangue_Gy_per_GBq < 2.0) riskColor = "#eab308"; // giallo
  if (Sangue_Gy_per_GBq >= 2.0) riskColor = "#dc2626"; // rosso
  
  
  
  
  
  
  

  // === Griglia KPI ===
  gridIodine.innerHTML = `
    <div class="kpi-grid">
     <div class="kpi-card">
  τ<sub>WB</sub><br><b>${fmtTauSmart(tauWB)}</b> h
</div>
<div class="kpi-card">
  τ<sub>Blood</sub><br><b>${fmtTauSmart(tauBlood)}</b> h
</div>
 

      <div class="kpi-card">
        Dose Midollo (AIFM)<br><b>${AIFM_Gy.toFixed(4)}</b> Gy
      </div>
      <div class="kpi-card">
        Dose Midollo (Traino)<br><b>${Traino_Gy.toFixed(4)}</b> Gy
      </div>

<div class="kpi-card">
  Dose Sangue (EANM 2008)<br>
  <b>${Sangue_Gy.toFixed(4)}</b> Gy<br>
  <small>Self: ${selfDose_Gy.toFixed(4)} Gy — Cross: ${crossDose_Gy.toFixed(4)} Gy</small>
</div>

      <div class="kpi-card dose2gy" style="background:${riskColor};color:#fff;">
        Attività per 2 Gy al Sangue<br><b>${act2Gy_GBq.toFixed(4)}</b> GBq
      </div>
    </div>
  `;
  
  
  // =============================================================
// 🧾 Aggiorna KPI globali e salva per il report
// =============================================================
state.kpi.doseSelf  = selfDose_Gy;
state.kpi.doseCross = crossDose_Gy;
state.kpi.doseWB    = Sangue_Gy; // puoi lasciare Sangue_Gy come proxy WB o metterlo 0 se non serve

// 🔹 Salva per il report
try {
  // 🔹 Pulisce l'oggetto da riferimenti circolari (grafici, contesti, ecc.)
  const safeState = JSON.parse(
    JSON.stringify(state, (key, value) => {
      if (
        key === "chart" ||
        key === "$context" ||
        key === "ctx" ||
        key === "_metasets" ||
        key === "_chart"
      ) {
        return undefined;
      }
      return value;
    })
  );

  localStorage.setItem("doseMidolloState", JSON.stringify(safeState));
  console.log("💾 Stato dosimetrico salvato senza riferimenti circolari:", safeState);
} catch (err) {
  console.warn("⚠️ Errore nel salvataggio doseMidolloState:", err);
}

console.log("💾 KPI dosimetrici I-131 salvati:", state.kpi);
}






function apriModaleScelta() {
  const modal = document.getElementById("modalPDF");
  if (modal) modal.classList.add("show");
}

function chiudiModale(event) {
  const modal = document.getElementById("modalPDF");
  if (!modal) return;
  if (!event || event.target.id === "modalPDF" || event.target.classList.contains("btn-annulla")) {
    modal.classList.remove("show");
  }
}

function confermaPDF() {
  const fisico = document.getElementById("selFisico")?.value;
  const medico = document.getElementById("selMedico")?.value;

  if (!fisico || !medico) {
    alert("⚠️ Seleziona sia il Fisico che il Medico Nucleare");
    return;
  }

  document.getElementById("modalPDF")?.classList.remove("show");

  if (typeof state === "undefined" || !state.patient) {
    alert("⚠️ Nessun paziente selezionato o stato non inizializzato");
    return;
  }

  // 💡 Crea copia pulita (senza grafici o elementi DOM)
  const { charts, chartBlood, chartWB, ...cleanState } = state;

  cleanState.reportMeta = {
    fisico,
    medico,
    timestamp: new Date().toISOString()
  };

  // 💾 Salva solo la parte "pulita"
  localStorage.setItem("state", JSON.stringify(cleanState));

  console.log("💾 Stato salvato per il report:", cleanState);

  // 🚀 Apri la pagina del report
  window.open("report.html", "_blank");
}



// =======================================================
// 📄 Gestione pagina REPORT.html
// =======================================================
window.addEventListener("DOMContentLoaded", () => {
  const data = JSON.parse(localStorage.getItem("reportData") || "{}");

  if (data && data.patient) {
    console.log("📄 Caricamento dati report:", data);

    // Popola i campi della pagina report.html
    const elNome = document.getElementById("nomePaziente");
    if (elNome) elNome.textContent = data.patient.name || "";

    const elRadio = document.getElementById("radioisotopo");
    if (elRadio) elRadio.textContent = data.patient.radio || "";

    const elFisico = document.getElementById("fisico");
    if (elFisico) elFisico.textContent = (data.reportMeta && data.reportMeta.fisico) || "";

    const elMedico = document.getElementById("medico");
    if (elMedico) elMedico.textContent = (data.reportMeta && data.reportMeta.medico) || "";

  } else {
    console.warn("⚠️ Nessun dato trovato in localStorage.reportData o patient mancante");
  }
});


// =======================================================
// 🧠 Gestione del modale per generare il report
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnConfermaReport");
  if (!btn) {
    console.warn("⚠️ Bottone 'btnConfermaReport' non trovato nel DOM");
    return;
  }

  btn.addEventListener("click", () => {
    const selFisico = document.getElementById("selectFisico");
    const selMedico = document.getElementById("selectMedico");

    const fisico = selFisico ? selFisico.value : "";
    const medico = selMedico ? selMedico.value : "";

    if (!fisico || !medico) {
      alert("⚠️ Seleziona fisico e medico prima di procedere");
      return;
    }

    if (typeof state === "undefined" || !state.patient) {
      alert("⚠️ Nessun paziente selezionato o stato non inizializzato");
      return;
    }

    // 🔹 Salva i dati nel contesto corrente
    state.reportMeta = {
      fisico,
      medico,
      timestamp: new Date().toISOString()
    };

    // 🔹 Serializza e salva nel localStorage
    localStorage.setItem("reportData", JSON.stringify(state));

    console.log("💾 reportData salvato:", state);

    // 🔹 Apri la pagina report.html in nuova scheda
    window.open("report.html", "_blank");
  });
});





