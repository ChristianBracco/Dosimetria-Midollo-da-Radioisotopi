
// =============================================================
// 🏥 Logo Mauriziano incorporato (versione Base64 leggera)
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const logoEl = document.getElementById("logo");
  if (logoEl) {
    logoEl.src = "data:image/jpeg;base64,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c01ib29sAAAAAABDcm5DYm9vbAAAAAAAQ250Q2Jvb2wAAAAAAExibHNib29sAAAAAABOZ3R2Ym9vbAAAAAAARW1sRGJvb2wAAAAAAEludHJib29sAAAAAABCY2tnT2JqYwAAAAEAAAAAAABSR0JDAAAAAwAAAABSZCAgZG91YkBv4AAAAAAAAAAAAEdybiBkb3ViQG/gAAAAAAAAAAAAQmwgIGRvdWJAb+AAAAAAAAAAAABCcmRUVW50RiNSbHQAAAAAAAAAAAAAAABCbGQgVW50RiNSbHQAAAAAAAAAAAAAAABSc2x0VW50RiNQeGxAUgAAAAAAAAAAAAp2ZWN0b3JEYXRhYm9vbAEAAAAAUGdQc2VudW0AAAAAUGdQcwAAAABQZ1BDAAAAAExlZnRVbnRGI1JsdAAAAAAAAAAAAAAAAFRvcCBVbnRGI1JsdAAAAAAAAAAAAAAAAFNjbCBVbnRGI1ByY0BZAAAAAAAAAAAAEGNyb3BXaGVuUHJpbnRpbmdib29sAAAAAA5jcm9wUmVjdEJvdHRvbWxvbmcAAAAAAAAADGNyb3BSZWN0TGVmdGxvbmcAAAAAAAAADWNyb3BSZWN0UmlnaHRsb25nAAAAAAAAAAtjcm9wUmVjdFRvcGxvbmcAAAAAADhCSU0D7QAAAAAAEABIAAAAAQACAEgAAAABAAI4QklNBCYAAAAAAA4AAAAAAAAAAAAAP4AAADhCSU0D8gAAAAAACgAA////////AAA4QklNBA0AAAAAAAQAAAAeOEJJTQQZAAAAAAAEAAAAHjhCSU0D8wAAAAAACQAAAAAAAAAAAQA4QklNJxAAAAAAAAoAAQAAAAAAAAACOEJJTQP1AAAAAABIAC9mZgABAGxmZgAGAAAAAAABAC9mZgABAKGZmgAGAAAAAAABADIAAAABAFoAAAAGAAAAAAABADUAAAABAC0AAAAGAAAAAAABOEJJTQP4AAAAAABwAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAADhCSU0ECAAAAAAAEAAAAAEAAAJAAAACQAAAAAA4QklNBB4AAAAAAAQAAAAAOEJJTQQa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OjM2KzAxOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIyLTAzLTAxVDE5OjE1OjM2KzAxOjAwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChNYWNpbnRvc2gpIiBkYzpmb3JtYXQ9ImltYWdlL2pwZWciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo4M2RhYjkzZC0yOTJkLTQ4ZjItOWIxMS03ZDlmMmM2MmQ4ZTYiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDphZjAyNGFjZS1kNTU2LTUzNDAtYjUzOC1mNWFlNmNmM2ZiZTEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo2ZDZiM2UxNi01ZDBjLTQzMzctOWNlOS05MTE0Yjc1NzFlM2YiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjZkNmIzZTE2LTVkMGMtNDMzNy05Y2U5LTkxMTRiNzU3MWUzZiIgc3RFdnQ6d2hlbj0iMjAyMi0wMy0wMVQxNzoxODozOCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmU5N2E1NmU1LTkzOWUtNDQ1MS1hNzE5LWJmNDhkNGFmMjRkMSIgc3RFdnQ6d2hlbj0iMjAyMi0wMy0wMVQxOToxNTozNiswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNvbnZlcnRlZCIgc3RFdnQ6cGFyYW1ldGVycz0iZnJvbSBpbWFnZS90aWZmIHRvIGltYWdlL2pwZWciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImRlcml2ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImNvbnZlcnRlZCBmcm9tIGltYWdlL3RpZmYgdG8gaW1hZ2UvanBlZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODNkYWI5M2QtMjkyZC00OGYyLTliMTEtN2Q5ZjJjNjJkOGU2IiBzdEV2dDp3aGVuPSIyMDIyLTAzLTAxVDE5OjE1OjM2KzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6ZTk3YTU2ZTUtOTM5ZS00NDUxLWE3MTktYmY0OGQ0YWYyNGQxIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjZkNmIzZTE2LTVkMGMtNDMzNy05Y2U5LTkxMTRiNzU3MWUzZiIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjZkNmIzZTE2LTVkMGMtNDMzNy05Y2U5LTkxMTRiNzU3MWUzZiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8P3hwYWNrZXQgZW5kPSJ3Ij8+/+4ADkFkb2JlAGQA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";
  }
}); // ✅ chiude document.addEventListener


// =============================================================
// 📊 REPORT MIDOLLO — versione autonoma e coerente con script.js
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  console.group("📥 Caricamento stato dal localStorage");

  const state =
    JSON.parse(
      localStorage.getItem("doseMidolloState") ||
      localStorage.getItem("state") ||
      localStorage.getItem("midolloState") ||
      "{}"
    );

  if (!state?.patient) {
    console.warn("⚠️ Nessun dato valido trovato nel localStorage");
    return;
  }

  const p = state.patient;
  const fit = state.fit || {};
  const kpi = state.kpi || {};

  console.log("✅ Stato:", state);
  
  
  // 🔧 Allinea i nomi delle chiavi per compatibilità con versioni diverse
if (state.kpi) {
  state.kpi.doseSelf = state.kpi.doseSelf || state.kpi.selfDose || 0;
  state.kpi.doseCross = state.kpi.doseCross || state.kpi.crossDose || 0;
  state.kpi.doseMidollo =
    state.kpi.doseMidollo ||
    (state.kpi.selfDose || 0) + (state.kpi.crossDose || 0);
  state.kpi.doseWB = state.kpi.doseWB || state.kpi.crossDose || 0;
}

  

  // =============================================================
  // 🧍‍♂️ DATI ANAGRAFICI
  // =============================================================
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "—";	
  };
  const fix = (v, d = 2) =>
    v == null || isNaN(v) ? "—" : Number(v).toFixed(d);

  set("nomePaziente", p.name);
  set("idPaziente", p.cc);
  set("dob", p.dob);
  set("sesso", p.sex);
  set("peso", fix(p.wt, 0));
  set("altezza", fix(p.ht, 0));
  set("radioisotopo", p.radio);
  set("attivitaSomministrata", `${fix(state.admin?.adminGBq ?? 0, 4)} GBq`);
  set("dataRicovero", state.admin?.adminDT?.split("T")[0] ?? "—");


// =============================================================
// ✍️ FIRME E CONVALIDA — compatibile con confermaPDF()
// =============================================================
let meta = state.reportMeta || {};

// Se non trovata, prova a recuperare lo stato salvato da confermaPDF()
if (!meta.fisico && !meta.medico) {
  try {
    const altState = JSON.parse(localStorage.getItem("state") || "{}");
    if (altState?.reportMeta) meta = altState.reportMeta;
  } catch (err) {
    console.warn("⚠️ Nessuna firma trovata:", err);
  }
}

document.getElementById("fisico").textContent = meta.fisico ?? "—";
document.getElementById("medico").textContent = meta.medico ?? "—";
document.getElementById("dataFirma").textContent =
  meta.timestamp ? meta.timestamp.split("T")[0] : "—";








  // =============================================================
  // 📈 KPI e RISULTATI DOSIMETRICI
  // =============================================================
  set("kpiAwb", fix(fit.Awb ?? kpi.Awb));
  set("kpiAlim", fix(fit.Alim ?? kpi.Alim));
  set("kpiAblood", kpi.Ablood ? Number(kpi.Ablood).toExponential(2) : "—");
  set("kpiAbloodkg", fix(kpi.Abloodkg, 3));
  set("kpiArm", fix(fit.Arm ?? kpi.Arm, 3));
  set("kpiArb", fix(fit.Arb ?? kpi.Arb, 3));

// ===============================
// 🧾 RISULTATI DOSIMETRICI — AGGIORNAMENTO KPI
// ===============================



// parsing sicuro
const toNum = v => (v === null || v === undefined || v === "" ? null : parseFloat(v));

const doseSelf  = toNum(kpi?.doseSelf);
const doseCross = toNum(kpi?.doseCross);
const doseSomma = (doseSelf || 0) + (doseCross || 0);
const doseWB    = toNum(kpi?.doseWB);

// ✅ Aggiorna i KPI sul report
set("doseMidolloSelf",  fix(doseSelf));
set("doseMidolloCross", fix(doseCross));
set("doseMidolloSangue", fix(doseSomma));   // somma self + cross
set("doseMidolloWB",    fix(doseWB));

// =============================================================
// ⚡ Attività necessaria per 2 Gy (presa dalla UI)
// =============================================================
const att2Gy = state?.kpi?.activity2Gy ?? kpi?.activity2Gy ?? null;

if (att2Gy != null) {
  const el = document.getElementById("attivita2Gy");
  if (el) el.textContent = `${Number(att2Gy).toFixed(2)} GBq`;
}





  // =============================================================
  // 📉 GRAFICI (usa solo fit salvati)
  // =============================================================
  if (state.blood?.length && fit.blood)
    renderFitChart("chartBlood", state.blood, fit.blood, "Andamento Sangue");
  else if (state.blood?.length)
    console.warn("⚠️ Fit sangue mancante: impossibile disegnare curva.");

  if (state.wb?.length && fit.wb)
    renderFitChart("chartWB", state.wb, fit.wb, "Andamento Whole-Body");
  else if (state.wb?.length)
    console.warn("⚠️ Fit whole-body mancante: impossibile disegnare curva.");







// =============================================================
// 📐 Valutazione modello (mono o bi-esponenziale  per WB)
// =============================================================
function modelEval(t, fit, forceBi = false) {
  if (!fit) return 0;

  // Forza bi-esponenziale (caso Whole Body)
  if (forceBi) {
    if (fit.A1 != null && fit.A2 != null && fit.lambda1 != null && fit.lambda2 != null)
      return fit.A1 * Math.exp(-fit.lambda1 * t) + fit.A2 * Math.exp(-fit.lambda2 * t);
    if (fit.A != null && fit.B != null && fit.C != null && fit.D != null)
      return fit.A * Math.exp(-fit.B * t) + fit.C * Math.exp(-fit.D * t);
    if (fit.A != null && fit.B != null)
      return fit.A * Math.exp(-fit.B * t);
  }

  // Normale — rispetta modello
  if (fit.model === "bi" || (fit.A != null && fit.B != null && fit.C != null && fit.D != null))
    return fit.A * Math.exp(-fit.B * t) + fit.C * Math.exp(-fit.D * t);

  if (fit.model === "mono" || (fit.A != null && fit.B != null && (fit.C == null || fit.C === 0)))
    return fit.A * Math.exp(-fit.B * t);

  if (fit.A1 != null && fit.A2 != null && fit.lambda1 != null && fit.lambda2 != null)
    return fit.A1 * Math.exp(-fit.lambda1 * t) + fit.A2 * Math.exp(-fit.lambda2 * t);

  return 0;
}

// =============================================================
// 🧮 Calcolo AUC dal fit
// =============================================================
function computeAUC(fit) {
  if (!fit) return 0;
  if (fit.A1 != null && fit.lambda1 != null && fit.A2 != null && fit.lambda2 != null)
    return fit.A1 / fit.lambda1 + fit.A2 / fit.lambda2;
  if (fit.A != null && fit.B != null && fit.C != null && fit.D != null)
    return fit.A / fit.B + fit.C / fit.D;
  if (fit.A != null && fit.B != null)
    return fit.A / fit.B;
  return 0;
}

// =============================================================
// 📈 RENDER GRAFICI — versione PDF-safe (anti SecurityError)
// =============================================================
function renderFitChart(canvasId, data, fit, titolo) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Prevenzione CORS: marcatura "anonymous" per HTML2Canvas
  canvas.crossOrigin = "anonymous";

  // Ordina i punti per tempo
  const points = [...data].sort((a, b) => a.t - b.t);
  const x = points.map(p => Number(p.t));
  const y = points.map(p => Number(p.fia1ml ?? p.fia ?? 0));

  const minT = Math.min(...x);
  const maxT = Math.max(...x);
  const isWB = titolo.toLowerCase().includes("whole");

  // === Generazione punti di fit ===
  const nFit = Math.min(200, Math.max(40, x.length * 10));
  const fitData = Array.from({ length: nFit }, (_, i) => {
    const t = minT + (i / (nFit - 1)) * (maxT - minT);
    return { x: t, y: modelEval(t, fit, isWB) };
  });

  // === Etichette e scala ===
  const auc = computeAUC(fit);
  const labelFit = isWB ? "Bi-esponenziale" :
    fit.model === "bi" ? "Bi-esponenziale" : "Mono-esponenziale";

  const dynamicRange =
    Math.max(...y) / Math.max(1e-10, Math.min(...y.filter(v => v > 0)));
  const useLog = dynamicRange > 1000;

  // === Creazione grafico ===
  Chart.defaults.devicePixelRatio = 2; // migliora la nitidezza generale
  const chart = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Dati sperimentali",
          data: x.map((v, i) => ({ x: v, y: y[i] })),
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: "#dc2626",
          borderColor: "#dc2626",
          showLine: false,
        },
        {
          label: "Curva di fit",
          data: fitData,
          type: "line",
          borderColor: "#0ea5e9",
          borderWidth: 2.4,
          tension: 0.25,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `${titolo} — ${labelFit} (AUC=${auc.toExponential(2)}, R²=${fit.r2?.toFixed(3) ?? "—"})`,
          color: "#0f172a",
          font: { size: 13, weight: "600" },
          padding: { top: 8, bottom: 6 },
        },
      },
scales: {
  x: {
    type: "linear",
    title: {
      display: true,
      text: "Tempo (h)",
      color: "#0f172a",
      font: { size: 13, weight: "600" }
    },
    grid: { color: "#e2e8f0" },
    ticks: {
      color: "#0f172a",
      callback: v => Number(v).toFixed(1),
      font: { size: 12 },
    },
    min: 0,
  },

  y: {
    type: useLog ? "logarithmic" : "linear",
    title: {
      display: true,
      text: "FIA (a.u.)",
      color: "#0f172a",
      font: { size: 13, weight: "600" }
    },
    grid: { color: "#e2e8f0" },
    ticks: {
      color: "#0f172a",
      font: { size: 12 },
      callback: function(value) {
        // 🔹 Valori piccoli in notazione scientifica compatta
        if (Math.abs(value) < 0.001 && value !== 0) {
          return value.toExponential(1); // es. 4.0e-5
        }
        // 🔹 Valori normali con max 3 cifre significative
        return Number(value).toPrecision(3);
      },
    },
    min: useLog ? undefined : 0,
  },
},

    },
  });

  // === Protezione anti SecurityError (per html2canvas) ===
  try {
    chart.canvas.crossOrigin = "anonymous";
    chart.canvas.toDataURL = () => ""; // neutralizza lettura diretta
  } catch (e) {
    console.warn("⚠️ Ignorato errore CORS canvas:", e);
  }

  console.log(`📈 ${titolo} — grafico disegnato correttamente`);
}

  // 🧾 Listener per pulsante Esporta PDF
  const btnPDF = document.getElementById("btnPDF");
  if (btnPDF) {
    btnPDF.addEventListener("click", async () => {
      console.log("🧾 Pulsante 'Esporta PDF' premuto");
      await exportPDF();
    });
  } else {
    console.warn("⚠️ Pulsante btnPDF non trovato!");
  }





// =============================================================
// 📄 Esportazione PDF multipagina, layout centrato A4
// =============================================================
async function exportPDF() {
  console.log("🧾 Avvio exportPDF() — funzione raggiunta");

  // Seleziona solo il contenuto principale del report
  const element =
    document.querySelector(".report-wrapper") ||
    document.getElementById("report") ||
    document.body;

  // Nascondi temporaneamente il pulsante PDF
  const btn = document.getElementById("btnPDF");
  if (btn) btn.style.display = "none";

  // Genera un canvas ad alta risoluzione
  const canvas = await html2canvas(element, {
     scale: window.devicePixelRatio * 2, // aumenta la densità pixel nella cattura
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0,
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
    onclone: (clonedDoc) => {
      // Mostra esplicitamente i page break
      clonedDoc.querySelectorAll(".page-break").forEach((el) => {
        el.style.display = "block";
        el.style.height = "20mm";
      });
    },
  });

  const imgData = canvas.toDataURL("image/jpeg", 1.0);
  const pdf = new jspdf.jsPDF("p", "mm", "a4");

  // Calcolo proporzioni reali in mm
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pxPerMm = canvas.width / pageWidth;
  const imgHeightMm = canvas.height / pxPerMm;

  let position = 0;
  let heightLeft = imgHeightMm;

  // Aggiungi pagine se necessario
  while (heightLeft > 0) {
    pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeightMm);
    heightLeft -= pageHeight;
    position -= pageHeight;
    if (heightLeft > 0) pdf.addPage();
  }

  // Crea titolo dinamico in base ai dati del paziente
  const surname = (state.patient?.surname || "").trim();
  const name = (state.patient?.name || "").trim();
  const ricovero = (state.patient?.ricoveroDate || "").substring(0, 10);

  const filename = `Report_Dosimetrico_${surname}_${name}_${ricovero}.pdf`;
  console.log("💾 Salvataggio PDF:", filename);

  // Salva il file
  pdf.save(filename);

  // Ripristina il pulsante
  if (btn) btn.style.display = "inline-block";
  console.log("✅ PDF generato con successo");
}


}); // ✅ chiude document.addEventListener

// =============================================================
// 🧬 Imposta titoli dinamici in base all’isotopo selezionato
// =============================================================
function updateTitlesByIsotope() {
  try {
    const isotope =
      (state?.patient?.radioisotope ||
       state?.patient?.isotope ||
       state?.patient?.isotopo ||
       ""
      ).toLowerCase().trim();

    const mainTitle = document.getElementById("mainTitle");
    const subTitle = document.getElementById("subTitle");

    if (!mainTitle || !subTitle) {
      console.warn("⚠️ Titoli non trovati nel DOM.");
      return;
    }

    // Default
    let t1 = "⚛️ Report Dosimetrico Paziente";
    let t2 = "";

    // LUTATHERA
    if (isotope.includes("lutathera") || isotope.includes("dotatate") || isotope.includes("177lu")) {
      t1 = "Report DOSIMETRIA MIDOLLO POST TERAPIA ☢️";
      t2 = "Terapia radiometabolica Lu177-DOTATATE (Lutathera)";
    }

    // PSMA
    else if (isotope.includes("psma")) {
      t1 = "Report DOSIMETRIA MIDOLLO POST TERAPIA ☢️";
      t2 = "Terapia radiometabolica Lu177-PSMA";
    }

    // IODIO
    else if (isotope.includes("131i") || isotope.includes("iodio")) {
      t1 = "Report DOSIMETRIA MIDOLLO POST TERAPIA ☢️";
      t2 = "Terapia radiometabolica Iodio-131";
    }

    mainTitle.textContent = t1;
    subTitle.textContent = t2;
    console.log(`🧠 Titoli aggiornati per isotopo: "${isotope}"`);
  } catch (err) {
    console.error("❌ Errore in updateTitlesByIsotope:", err);
  }
}

// =============================================================
// 🧩 Attendi DOM + caricamento dello stato
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const observer = setInterval(() => {
    if (typeof state !== "undefined" && state?.patient?.radioisotope) {
      clearInterval(observer);
      console.log("🧩 Esecuzione updateTitlesByIsotope...");
      updateTitlesByIsotope();
    }
  }, 300);
});

