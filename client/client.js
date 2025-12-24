// /client/client.js
(() => {
  // ====== CONFIG À ADAPTER ======
  const CFG = {
    bookingUrl: "https://outlook.office.com/book/PrauditMicrosoft365@Clear365.be/",
    depositUrl: "#", // TODO: remplace par ton lien de dépôt (SharePoint Request files / OneDrive / etc.)
    contactUrl: "mailto:contact@clear365.be?subject=CLEAR365%20-%20Acc%C3%A8s%20client",
    storageKey: "clear365_client_portal_v1",
  };

  // ====== HELPERS ======
  const $ = (id) => document.getElementById(id);
  const nowIso = () => new Date().toISOString();

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(CFG.storageKey) || "{}");
    } catch {
      return {};
    }
  }
  function saveState(patch) {
    const current = loadState();
    const next = { ...current, ...patch, updatedAt: nowIso() };
    localStorage.setItem(CFG.storageKey, JSON.stringify(next));
    return next;
  }

  function normalizeCaseRef(v) {
    return (v || "").trim().toUpperCase();
  }
  function generateCaseRef() {
    const y = new Date().getFullYear();
    const n = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `C365-${y}-${n}`;
  }

  function buildSummary() {
    const st = loadState();
    return {
      brand: "CLEAR365",
      version: "client-portal-v1",
      caseRef: st.caseRef || null,
      audit: {
        globalReaderAssigned: !!st.globalReaderAssigned,
        exports: st.exports || {},
      },
      scopes: st.scopes || { security:false, finance:false, ops:false, gov:false },
      consents: st.consents || { readonly:false, scoped:false },
      notes: st.notes || "",
      timestamps: {
        createdAt: st.createdAt || null,
        updatedAt: st.updatedAt || null,
      },
    };
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ====== COMMON LINKS ======
  function wireCommonLinks() {
    const startBooking = $("btnStartBooking");
    const startBooking2 = $("btnStartBooking2");
    const deposit = $("btnDeposit");
    const deposit2 = $("btnDeposit2");
    const deposit3 = $("btnDeposit3");
    const contact = $("btnContact");

    if (startBooking) startBooking.href = CFG.bookingUrl;
    if (startBooking2) startBooking2.href = CFG.bookingUrl;

    if (deposit) deposit.href = CFG.depositUrl;
    if (deposit2) deposit2.href = CFG.depositUrl;
    if (deposit3) deposit3.href = CFG.depositUrl;

    if (contact) contact.href = CFG.contactUrl;
  }

  // ====== INDEX PAGE ======
  function initIndex() {
    const refInput = $("caseRef");
    const btnLoad = $("btnLoadCase");
    const status = $("caseStatus");

    if (!refInput || !btnLoad) return;

    const st = loadState();
    if (st.caseRef) refInput.value = st.caseRef;

    btnLoad.addEventListener("click", () => {
      const v = normalizeCaseRef(refInput.value);
      if (!v) {
        status.textContent = "Veuillez saisir une référence dossier.";
        return;
      }
      const next = saveState({ caseRef: v, createdAt: loadState().createdAt || nowIso() });
      status.textContent = `Dossier chargé : ${next.caseRef}.`;
    });
  }

  // ====== AUDIT PAGE ======
  function initAudit() {
    const caseRef = $("auditCaseRef");
    const btnSaveRef = $("btnSaveCaseRef");
    const btnGenRef = $("btnGenerateCaseRef");
    const hint = $("auditCaseHint");

    const chkGlobalReader = $("chkGlobalReader");
    const btnSaveAccess = $("btnSaveAuditAccess");
    const accessStatus = $("auditAccessStatus");

    const exportIds = ["ex_ca","ex_signins","ex_roles","ex_devices","ex_secureScore","ex_email"];
    const btnSaveExports = $("btnSaveExports");
    const exportsStatus = $("exportsStatus");

    if (!caseRef) return;

    const st = loadState();
    if (st.caseRef) caseRef.value = st.caseRef;

    if (btnSaveRef) {
      btnSaveRef.addEventListener("click", () => {
        const v = normalizeCaseRef(caseRef.value);
        if (!v) { hint.textContent = "Veuillez saisir une référence dossier."; return; }
        const next = saveState({ caseRef: v, createdAt: loadState().createdAt || nowIso() });
        hint.textContent = `Référence enregistrée : ${next.caseRef}.`;
      });
    }

    if (btnGenRef) {
      btnGenRef.addEventListener("click", () => {
        const v = generateCaseRef();
        caseRef.value = v;
        const next = saveState({ caseRef: v, createdAt: loadState().createdAt || nowIso() });
        hint.textContent = `Référence générée : ${next.caseRef}.`;
      });
    }

    if (chkGlobalReader) chkGlobalReader.checked = !!st.globalReaderAssigned;

    if (btnSaveAccess) {
      btnSaveAccess.addEventListener("click", () => {
        const next = saveState({ globalReaderAssigned: !!chkGlobalReader?.checked });
        accessStatus.textContent = next.globalReaderAssigned
          ? "Accès Global Reader confirmé (lecture seule)."
          : "Accès Global Reader non confirmé.";
      });
    }

    // load exports
    const currentExports = st.exports || {};
    exportIds.forEach(id => { const el = $(id); if (el) el.checked = !!currentExports[id]; });

    if (btnSaveExports) {
      btnSaveExports.addEventListener("click", () => {
        const exports = {};
        exportIds.forEach(id => { exports[id] = !!$(id)?.checked; });
        const next = saveState({ exports });
        exportsStatus.textContent = `Exports enregistrés pour le dossier ${next.caseRef || "(sans référence)"}.`;
      });
    }
  }

  // ====== SCOPE PAGE ======
  function initScope() {
    const caseRef = $("scopeCaseRef");
    const btnSaveRef = $("btnSaveScopeCaseRef");
    const status = $("scopeCaseStatus");

    const scSecurity = $("sc_security");
    const scFinance = $("sc_finance");
    const scOps = $("sc_ops");
    const scGov = $("sc_gov");

    const consentReadonly = $("consent_readonly");
    const consentScoped = $("consent_scoped");
    const notes = $("scopeNotes");

    const btnSave = $("btnSaveScopes");
    const btnDownload = $("btnDownloadSummary");
    const saveStatus = $("scopeSaveStatus");

    if (!caseRef) return;

    const st = loadState();
    if (st.caseRef) caseRef.value = st.caseRef;

    const scopes = st.scopes || {};
    if (scSecurity) scSecurity.checked = !!scopes.security;
    if (scFinance) scFinance.checked = !!scopes.finance;
    if (scOps) scOps.checked = !!scopes.ops;
    if (scGov) scGov.checked = !!scopes.gov;

    const consents = st.consents || {};
    if (consentReadonly) consentReadonly.checked = !!consents.readonly;
    if (consentScoped) consentScoped.checked = !!consents.scoped;

    if (notes) notes.value = st.notes || "";

    if (btnSaveRef) {
      btnSaveRef.addEventListener("click", () => {
        const v = normalizeCaseRef(caseRef.value);
        if (!v) { status.textContent = "Veuillez saisir une référence dossier."; return; }
        const next = saveState({ caseRef: v, createdAt: loadState().createdAt || nowIso() });
        status.textContent = `Référence enregistrée : ${next.caseRef}.`;
      });
    }

    if (btnSave) {
      btnSave.addEventListener("click", () => {
        const v = normalizeCaseRef(caseRef.value);
        if (!v) { saveStatus.textContent = "Veuillez d’abord définir une référence dossier."; return; }

        const next = saveState({
          caseRef: v,
          scopes: {
            security: !!scSecurity?.checked,
            finance: !!scFinance?.checked,
            ops: !!scOps?.checked,
            gov: !!scGov?.checked,
          },
          consents: {
            readonly: !!consentReadonly?.checked,
            scoped: !!consentScoped?.checked,
          },
          notes: (notes?.value || "").trim(),
          createdAt: loadState().createdAt || nowIso(),
        });

        if (!next.consents?.readonly || !next.consents?.scoped) {
          saveStatus.textContent = "Scopes enregistrés, mais il manque une ou plusieurs validations de consentement.";
          return;
        }

        saveStatus.textContent = `Scopes et consentements enregistrés pour ${next.caseRef}.`;
      });
    }

    if (btnDownload) {
      btnDownload.addEventListener("click", () => {
        const summary = buildSummary();
        const filename = `${(summary.caseRef || "C365-DOSSIER")}-clear365-scope.json`;
        downloadJson(filename, summary);
      });
    }
  }

  // ====== BOOTSTRAP ======
  wireCommonLinks();
  initIndex();
  initAudit();
  initScope();
})();
