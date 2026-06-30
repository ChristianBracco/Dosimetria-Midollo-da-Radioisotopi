# Dose Midollo JS

> Guida operativa illustrata per usare l'app, capire il flusso dei calcoli e riconoscere al volo il significato dei pulsanti.

---

## Mission Control

```mermaid
flowchart LR
  A["1. Patient Registry"] --> B["2. Administration"]
  B --> C["3. Blood"]
  B --> D["4. Whole Body"]
  C --> E["5. Fit Blood"]
  D --> F["6. Fit Whole Body"]
  E --> G["7. Dose Midollo"]
  F --> G
  G --> H["8. Report PDF"]

  classDef start fill:#0f172a,stroke:#38bdf8,color:#e0f2fe
  classDef work fill:#111827,stroke:#a78bfa,color:#f5f3ff
  classDef output fill:#052e16,stroke:#22c55e,color:#dcfce7

  class A,B work
  class C,D,E,F work
  class G start
  class H output
```

L'app lavora come una sequenza di moduli: prima si definiscono paziente e somministrazione, poi si caricano Blood e Whole Body, infine si fanno fit, dose e report.

---

## Plancia Comandi

| Pulsante | Tooltip | Quando usarlo |
| --- | --- | --- |
| Importa da PDF | Importa automaticamente i dati paziente e terapia da un PDF Physico. | Quando parti da un documento gia pronto. |
| Carica JSON | Carica una sessione salvata in formato JSON. | Per riprendere un lavoro precedente. |
| Salva JSON | Scarica su file JSON tutti i dati inseriti e calcolati. | Prima di chiudere o archiviare il caso. |
| Reset | Cancella i dati locali e riporta l'app allo stato iniziale. | Quando vuoi ripartire da zero. |
| Genera Report | Apre la scelta di fisico e medico prima di generare il report. | A fine workflow. |

```mermaid
flowchart TB
  P["Dati in ingresso"] --> J["JSON locale"]
  P --> PDF["PDF Physico"]
  J --> APP["Dose Midollo JS"]
  PDF --> APP
  APP --> SAVE["Salva JSON"]
  APP --> REPORT["Genera Report"]
  REPORT --> OUT["PDF finale"]
```

---

## Tooltip: una sola voce, non due

Il tooltip nero e quello voluto: e il tooltip custom dell'app.
Il vecchio balloon giallo era il tooltip nativo del browser generato da `title`, ora rimosso.

```mermaid
flowchart LR
  B["button"] --> R["resolveButtonTooltip()"]
  R --> A["aria-label"]
  R --> D["data-tooltip"]
  D --> C["balloon nero custom"]
```

I pulsanti dinamici, come le X di cancellazione nelle tabelle, vengono intercettati anche quando la tabella viene ridisegnata.

---

## Patient Registry

```mermaid
sequenceDiagram
  participant C as Clipboard
  participant UI as App
  participant K as KPI paziente

  C->>UI: Importa dati da clipboard
  UI->>K: Eta, BLV, lambda
  K-->>UI: Valori aggiornati
```

Qui entrano i dati anagrafici, peso, altezza, radiofarmaco e parametri di decadimento. Il pulsante di import da clipboard serve a saltare l'inserimento manuale quando i dati sono gia copiati da una sorgente esterna.

---

## Administration

```mermaid
flowchart LR
  M["Measured"] --> C["Calcolo Admin"]
  E["Empty"] --> C
  X["Expected / Measured"] --> C
  C --> A["Administered"]
  A --> D["Dose"]
```

La sezione Administration e il motore temporale del caso: definisce attivita, residuo e data/ora di riferimento per Blood e Whole Body.

---

## Blood Bay

```mermaid
flowchart TB
  A["Aggiungi campione"] --> B["Modal Blood"]
  B --> C["Data prelievo"]
  B --> D["Data lettura"]
  B --> E["CPM, volume, netto"]
  C --> F["Aggiungi"]
  D --> F
  E --> F
  F --> T["Tabella Blood"]
  T --> X["X elimina riga"]
  T --> FIT["Esegui Fit Blood"]
  FIT --> DOSE["Dose Midollo"]
```

| Comando Blood | Effetto |
| --- | --- |
| Aggiungi campione | Apre la finestra di inserimento. |
| Aggiungi | Valida i campi e aggiunge il campione alla tabella. |
| Svuota tabella | Cancella tutti i campioni Blood. |
| X | Elimina una singola riga. |
| Esegui Fit Blood | Stima la curva Blood e aggiorna i risultati. |

---

## Whole Body Deck

```mermaid
flowchart TB
  T["Importa da clipboard Therabed"] --> WB["Tabella Whole Body"]
  M["Aggiungi misura manuale"] --> WB
  A["Aggiungi da Camera Ambientale"] --> WB
  WB --> X["X elimina riga"]
  WB --> FIT["Esegui Fit WB"]
  FIT --> DOSE["Dose Midollo"]
```

| Comando Whole Body | Effetto |
| --- | --- |
| Importa da clipboard | Legge le righe MISURA copiate da Therabed. |
| Aggiungi misura Whole Body | Inserisce una misura manuale da lettura cartacea. |
| Aggiungi misura da Camera Ambientale | Calcola il rapporto tra due letture ambientali. |
| Svuota | Cancella tutte le misure Whole Body. |
| Esegui Fit WB | Stima la curva Whole Body. |

---

## Dose Engine

```mermaid
flowchart LR
  Blood["AUC Blood"] --> RM["Red Marrow"]
  WB["AUC Whole Body"] --> Cross["Cross Dose"]
  RM --> Self["Self Dose"]
  Self --> Total["Total Dose"]
  Cross --> Total
  Total --> Activity["Attivita per 2 Gy"]
```

La dose finale nasce dalla combinazione di contributi self e cross. I KPI restano visibili nella sezione Dose Midollo, mentre il report prende i valori salvati nello stato dell'app.

---

## Report Launch

```mermaid
sequenceDiagram
  participant UI as App
  participant M as Modal Report
  participant R as Report HTML
  participant P as PDF

  UI->>M: Genera Report
  M->>M: Seleziona fisico e medico
  M->>R: Salva metadati e apre report
  R->>P: Esporta in PDF
```

Il report finale eredita dati paziente, risultati dosimetrici, grafici e firme. Anche il pulsante di esportazione mantiene `aria-label`, cosi resta accessibile senza evocare il tooltip giallo del browser.

---

## Checklist Pre-Flight

- Dati paziente compilati.
- Data/ora di somministrazione presente.
- Attivita somministrata coerente.
- Campioni Blood ordinati e plausibili.
- Misure Whole Body presenti e successive alla somministrazione.
- Fit Blood eseguito.
- Fit Whole Body eseguito.
- Dose Midollo aggiornata.
- Report generato con fisico e medico corretti.
- JSON salvato per archivio o revisione.

---

## Mappa file

| File | Ruolo |
| --- | --- |
| `DoseMidollo.html` | Interfaccia principale dell'app. |
| `src/script.js` | Logica applicativa, calcoli, tooltip e rendering dinamico. |
| `src/style.css` | Stile dell'app e balloon nero dei tooltip. |
| `report.html` | Pagina report esportabile. |
| `report/report.js` | Popolamento del report e grafici. |
| `GUIDA_TOOLTIP_E_WORKFLOW.md` | Questa guida. |

---

## Nota tecnica sui tooltip

La logica dei tooltip e centralizzata in `src/script.js`:

```mermaid
flowchart TB
  A["BUTTON_TOOLTIPS"] --> C["resolveButtonTooltip"]
  B["BUTTON_TEXT_TOOLTIPS"] --> C
  C --> D["applyButtonTooltips"]
  D --> E["aria-label"]
  D --> F["data-tooltip"]
  F --> G["CSS ::after"]
  H["MutationObserver"] --> D
```

Questo permette di coprire sia i pulsanti statici sia quelli creati dopo, come le righe cancellabili delle tabelle.
