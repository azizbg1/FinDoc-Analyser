const http = require("http");
const fs   = require("fs");
const path = require("path");

// Polyfills needed by pdf-parse / pdfjs on Node < 22
if (typeof global.DOMMatrix === "undefined") {
  global.DOMMatrix = class DOMMatrix {
    constructor() { this.a=1;this.b=0;this.c=0;this.d=1;this.e=0;this.f=0; }
    multiply()       { return new global.DOMMatrix(); }
    translate()      { return new global.DOMMatrix(); }
    scale()          { return new global.DOMMatrix(); }
    rotate()         { return new global.DOMMatrix(); }
    inverse()        { return new global.DOMMatrix(); }
    transformPoint(p){ return p || {x:0,y:0}; }
    toString()       { return "matrix(1,0,0,1,0,0)"; }
  };
}
if (typeof global.ImageData === "undefined") {
  global.ImageData = class ImageData {
    constructor(w, h) { this.width = w; this.height = h; this.data = new Uint8ClampedArray(w * h * 4); }
  };
}
if (typeof global.Path2D === "undefined") {
  global.Path2D = class Path2D { constructor() {} };
}

let pdfParse = null;
try {
  const mod = require("pdf-parse");
  pdfParse = typeof mod === "function" ? mod : (mod.default || null);
  if (typeof pdfParse === "function") console.log("pdf-parse v1 charge (function)");
  else { console.warn("pdf-parse: export inattendu :", typeof mod); pdfParse = null; }
} catch (e) { console.warn("pdf-parse non disponible :", e.message); }

const PORT       = 8000;
const UPLOAD_DIR = path.join(__dirname, "uploads_mock");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Donnees pre-chargees ──────────────────────────────────────────────────────

const SAMPLE_DOCS = [
  { id: 1, filename: "facture_ACME_2024_001.pdf",    upload_date: "2024-06-10T09:15:00", document_type: "facture",           risk_score: 0.87, anomaly_count: 5 },
  { id: 2, filename: "bon_commande_fournisseur.pdf", upload_date: "2024-06-12T14:30:00", document_type: "bon de commande",   risk_score: 0.45, anomaly_count: 2 },
  { id: 3, filename: "rapport_financier_Q1.pdf",     upload_date: "2024-06-15T11:00:00", document_type: "rapport financier", risk_score: 0.10, anomaly_count: 0 },
];

const ANALYSIS_DOC1 = {
  id: 1, document_id: 1,
  summary: "Facture ACME SARL. HT: 8100, TVA: 1620, TTC indique: 9000 (attendu: 9720). Incoherence detectee.",
  anomalies: [
    { type: "total_inconsistency", severity: "HIGH",   message: "TTC incoherent : 8100 (HT) + 1620 (TVA) = 9720, le document indique 9000.", value: { ht: 8100, tva: 1620, expected_ttc: 9720, found_ttc: 9000 } },
    { type: "missing_field",       severity: "HIGH",   message: "Champ obligatoire absent : numero de facture.", value: "numero de facture" },
    { type: "invoice_number_format",severity:"LOW",    message: "Format numero non standard : F2024001.", value: "F2024001" },
    { type: "statistical_outlier", severity: "MEDIUM", message: "Valeur anormale : 9000 (detectee par 2/3 modeles).", value: 9000 },
    { type: "zero_amount",         severity: "LOW",    message: "Montant nul (0,00) detecte.", value: 0 },
  ],
  risk_score: 0.87, created_at: "2024-06-10T09:16:45",
};

const ANALYSIS_DOC2 = {
  id: 2, document_id: 2,
  summary: "Bon de commande BETA INDUSTRIES. Total TTC: 15000. Quantite anormalement elevee sur REF-2024-99.",
  anomalies: [
    { type: "statistical_outlier", severity: "MEDIUM", message: "Quantite inhabituelle : 500 unites pour REF-2024-99.", value: 500 },
    { type: "invoice_number_format",severity: "LOW",   message: "Reference produit non standard : PROD99X.", value: "PROD99X" },
  ],
  risk_score: 0.45, created_at: "2024-06-12T14:31:10",
};

const ANALYSIS_DOC3 = {
  id: 3, document_id: 3,
  summary: "Rapport financier Q1 2024 GAMMA CORP. CA: 2 450 000. Resultat net: 198 000. Aucune anomalie.",
  anomalies: [],
  risk_score: 0.10, created_at: "2024-06-15T11:01:22",
};

const analysisStore = { 1: ANALYSIS_DOC1, 2: ANALYSIS_DOC2, 3: ANALYSIS_DOC3 };

const USERS = [
  { id: 1, email: "admin@findoc.ai",   password: "findoc2024", name: "Admin FinDoc",   role: "Administrateur" },
  { id: 2, email: "analyst@findoc.ai", password: "findoc2024", name: "Marie Analyste", role: "Analyste"       },
];

let nextId = 4;
const docs = [...SAMPLE_DOCS];

// ── Extraction PDF ────────────────────────────────────────────────────────────

function extractPdfBinary(buffer) {
  for (let i = 0; i <= buffer.length - 4; i++) {
    if (buffer[i] === 0x25 && buffer[i+1] === 0x50 && buffer[i+2] === 0x44 && buffer[i+3] === 0x46) {
      return buffer.slice(i);
    }
  }
  return buffer;
}

// ── Parsing des nombres ───────────────────────────────────────────────────────

function parseNum(str) {
  if (!str) return null;
  let s = str.trim().replace(/\s/g, "");
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, "");
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) s = s.replace(/,/g, "");
  s = s.replace(",", ".");
  const v = parseFloat(s);
  return isNaN(v) || v < 0 ? null : v;
}

// ── Extraction des montants par labels ────────────────────────────────────────

function extractByLabels(text) {
  const t = text.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ");
  const N = "(\\d[\\d ,.]*)";

  function first(patterns) {
    for (const re of patterns) {
      const m = t.match(re);
      if (m) {
        const v = parseNum(m[1]);
        if (v !== null && v >= 10) return v;
      }
    }
    return null;
  }

  const ht = first([
    new RegExp("(?:sous[\\s-]*total|montant)[\\s:]*(?:H\\.?T\\.?|hors[\\s-]*tax\\w*)[\\s:]*" + N, "i"),
    new RegExp("(?:H\\.?T\\.?|hors[\\s-]*tax\\w*)[\\s:]*" + N, "i"),
    // "Sous-total : 8100" sans mention HT explicite
    new RegExp("sous[\\s-]*total[\\s]*:[\\s]*" + N, "i"),
    new RegExp("montant[\\s]+net[\\s]*:[\\s]*" + N, "i"),
  ]);

  const tva = first([
    new RegExp("T\\.?V\\.?A\\.?[\\s:]*(?:\\(?\\d+[\\s]*%\\)?[\\s:,]*)" + N, "i"),
    new RegExp("T\\.?V\\.?A\\.?[\\s:]*" + N, "i"),
  ]);

  const ttc = first([
    // "Total TTC indiqué : 9000" — texte entre TTC et le nombre
    new RegExp("T\\.?T\\.?C\\.?[^\\d]{0,30}" + N, "i"),
    new RegExp("[àa][\\s]+payer[^\\d]{0,20}" + N, "i"),
    new RegExp("total[\\s]+(?:toutes[\\s]+taxes)[^\\d]{0,20}" + N, "i"),
    new RegExp("net[\\s]+[àa][\\s]+payer[^\\d]{0,20}" + N, "i"),
  ]);

  return { ht, tva, ttc };
}

// ── Detection par triplet numerique (sans labels) ────────────────────────────

function detectTriplet(text) {
  const re = /\b(\d{1,3}(?:[\s.]\d{3})*(?:[,]\d{1,2})?|\d+(?:[,.]\d{1,2})?)\b/g;
  const seen = new Set();
  const nums = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const v = parseNum(m[1]);
    if (v !== null && v >= 10 && v <= 9999999 && !seen.has(v)) {
      seen.add(v); nums.push(v);
    }
  }
  nums.sort((a, b) => a - b);

  // TVA < HT < TTC  =>  i=TVA, j=HT, k=TTC  (tous tries croissants)
  // Condition: TVA/HT est le taux de taxe, donc in [0.04, 0.55]
  for (let i = 0; i < nums.length - 2; i++) {
    for (let j = i + 1; j < nums.length - 1; j++) {
      const tva = nums[i], ht = nums[j];
      const ratio = tva / ht;            // TVA/HT = taux (ex: 0.20)
      if (ratio < 0.04 || ratio > 0.55) continue;
      const expected = Math.round((ht + tva) * 100) / 100;
      for (let k = j + 1; k < nums.length; k++) {
        const ttc  = nums[k];
        const diff = Math.abs(ttc - expected);
        const pct  = expected > 0 ? diff / expected : 0;
        if (diff <= 1)               return { ht, tva, ttc, consistent: true,  expected };
        if (diff > 1 && pct < 0.30) return { ht, tva, ttc, consistent: false, expected };
      }
    }
  }
  return null;
}

// ── Analyse principale ────────────────────────────────────────────────────────

function analyzeText(docId, text, doc) {
  try {
    fs.writeFileSync(path.join(UPLOAD_DIR, "doc_" + docId + "_text.txt"), text, "utf8");
  } catch (_) {}

  console.log("\n[Analyze] doc " + docId + " | " + text.length + " chars");
  console.log("[Analyze] debut:\n" + text.slice(0, 500));

  let { ht, tva, ttc } = extractByLabels(text);
  console.log("[Analyze] Labels => HT=" + ht + " TVA=" + tva + " TTC=" + ttc);

  let triplet = null;
  if (ht === null || tva === null || ttc === null) {
    triplet = detectTriplet(text);
    if (triplet) {
      if (ht  === null) ht  = triplet.ht;
      if (tva === null) tva = triplet.tva;
      if (ttc === null) ttc = triplet.ttc;
      console.log("[Analyze] Triplet => HT=" + ht + " TVA=" + tva + " TTC=" + ttc + " consistent=" + triplet.consistent);
    }
  }

  const anomalies = [];

  if (ht !== null && tva !== null && ttc !== null) {
    const expected = Math.round((ht + tva) * 100) / 100;
    const diff     = Math.abs(expected - ttc);
    const pct      = expected > 0 ? diff / expected : 0;
    const isInconsistent = triplet ? !triplet.consistent : (diff > 0.5 && pct > 0.001);

    console.log("[Analyze] HT(" + ht + ") + TVA(" + tva + ") = " + expected + " vs TTC=" + ttc + " diff=" + diff.toFixed(2));

    if (isInconsistent) {
      anomalies.push({
        type: "total_inconsistency", severity: "HIGH",
        message: "TTC incoherent : " + ht + " (HT) + " + tva + " (TVA) = " + expected + ", mais le document indique " + ttc + ".",
        value: { ht, tva, expected_ttc: expected, found_ttc: ttc },
      });
    }
  } else if (ht !== null || tva !== null || ttc !== null) {
    const missing = ["HT", "TVA", "TTC"].filter((_, i) => [ht, tva, ttc][i] === null);
    anomalies.push({
      type: "missing_field", severity: "MEDIUM",
      message: "Montant(s) introuvable(s) : " + missing.join(", ") + ".",
      value: missing.join(", "),
    });
  }

  const hasInvoiceNum = /(?:facture|invoice|no|num.ro)\s*[:#-]?\s*\w+/i.test(text);
  if (!hasInvoiceNum) {
    anomalies.push({ type: "missing_field", severity: "MEDIUM", message: "Numero de facture introuvable.", value: "numero facture" });
  }

  const hasDate = /\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/.test(text);
  if (!hasDate) {
    anomalies.push({ type: "missing_field", severity: "LOW", message: "Aucune date trouvee.", value: "date" });
  }

  const riskScore = anomalies.length === 0 ? 0.05
    : anomalies.some(a => a.severity === "HIGH") ? Math.min(0.92, 0.60 + anomalies.length * 0.07)
    : Math.min(0.55, 0.22 + anomalies.length * 0.08);

  console.log("[Analyze] => " + anomalies.length + " anomalies | risk=" + riskScore);

  const fmt = v => v !== null ? v + " EUR" : "non trouve";
  const summary = "Document : " + (doc && doc.filename ? doc.filename : "inconnu") + "\n"
    + "Date : " + new Date().toLocaleDateString("fr-FR") + "\n\n"
    + "Montants extraits :\n"
    + "  HT  : " + fmt(ht) + "\n"
    + "  TVA : " + fmt(tva) + "\n"
    + "  TTC : " + fmt(ttc) + "\n\n"
    + "Resultat : " + (anomalies.length === 0 ? "Aucune anomalie. Document conforme." : anomalies.length + " anomalie(s) detectee(s).")
    + "\n\nPipeline : OCR -> Extraction -> Detection d anomalies -> Resume";

  return { id: docId, document_id: docId, summary, anomalies, risk_score: riskScore, created_at: new Date().toISOString() };
}

// ── Chat ──────────────────────────────────────────────────────────────────────

function getChatAnswer(docId, question) {
  const analysis = analysisStore[docId];
  const doc      = docs.find(d => d.id === docId);
  if (!analysis || !doc) return { answer: "Document " + docId + " non trouve.", sources: [] };

  const q        = question.toLowerCase();
  const riskPct  = Math.round((analysis.risk_score || 0) * 100);
  const count    = (analysis.anomalies || []).length;
  let answer = "";

  if (q.includes("anomalie") || q.includes("erreur") || q.includes("probleme") || q.includes("risque")) {
    if (count === 0) {
      answer = "Aucune anomalie dans **" + doc.filename + "**. Risque : **" + riskPct + "%** (faible).";
    } else {
      const list = analysis.anomalies.map((a, i) => (i+1) + ". [" + a.severity + "] " + a.message).join("\n");
      answer = "**" + count + " anomalie(s)** dans **" + doc.filename + "** (risque : **" + riskPct + "%**) :\n\n" + list;
    }
  } else if (q.includes("resum") || q.includes("synthese")) {
    answer = "Resume de **" + doc.filename + "** :\n\n" + analysis.summary;
  } else if (q.includes("score")) {
    answer = "Score de risque de **" + doc.filename + "** : **" + riskPct + "%**.";
  } else {
    answer = "Document **" + doc.filename + "** (" + doc.document_type + ", risque " + riskPct + "%, " + count + " anomalie(s)):\n\n" + analysis.summary;
  }

  return { answer, sources: ["Analyse de " + doc.filename, "Risque : " + riskPct + "%"] };
}

// ── Serveur ───────────────────────────────────────────────────────────────────

function router(req, res) {
  const url      = new URL(req.url, "http://localhost:" + PORT);
  const method   = req.method;
  const pathname = url.pathname;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const json = (data, status) => {
    res.writeHead(status || 200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    });
    res.end(JSON.stringify(data));
  };

  const body = cb => {
    let data = "";
    req.on("data", c => (data += c));
    req.on("end", () => { try { cb(JSON.parse(data || "{}")); } catch (_) { cb({}); } });
  };

  // POST /api/login
  if (pathname === "/api/login" && method === "POST") {
    body(payload => {
      const user = USERS.find(u => u.email === payload.email && u.password === payload.password);
      if (!user) { json({ detail: "Identifiants incorrects." }, 401); return; }
      const { password: _, ...safe } = user;
      json({ ...safe, token: "mock-token-" + user.id });
    });
    return;
  }

  // POST /api/upload
  if (pathname === "/api/upload" && method === "POST") {
    let filename = "document_" + Date.now() + ".pdf";
    const chunks = [];

    req.on("data", chunk => {
      chunks.push(chunk);
      const str = chunk.toString("latin1");
      const m   = str.match(/filename="([^"]+)"/);
      if (m) filename = m[1];
    });

    req.on("end", () => {
      const newId = nextId++;
      const full  = Buffer.concat(chunks);
      try {
        fs.writeFileSync(path.join(UPLOAD_DIR, "doc_" + newId + ".raw"), full);
        console.log("[Upload] " + filename + " => doc_" + newId + ".raw (" + full.length + " bytes)");
      } catch (e) {
        console.warn("[Upload] Erreur sauvegarde : " + e.message);
      }

      const doc = { id: newId, filename, upload_date: new Date().toISOString(), document_type: "facture", risk_score: null, anomaly_count: null };
      docs.push(doc);
      setTimeout(() => json(doc, 201), 1200);
    });
    return;
  }

  // POST /api/analyze
  if (pathname === "/api/analyze" && method === "POST") {
    body(payload => {
      const docId = payload.document_id;
      const doc   = docs.find(d => d.id === docId);

      console.log("\n[Analyze] document_id=" + docId + " filename=" + (doc && doc.filename));

      const doAnalysis = async () => {
        if (docId <= 3) {
          console.log("[Analyze] Pre-seeded doc " + docId);
        } else {
          const rawPath = path.join(UPLOAD_DIR, "doc_" + docId + ".raw");
          if (pdfParse && fs.existsSync(rawPath)) {
            try {
              const raw    = fs.readFileSync(rawPath);
              const pdf    = extractPdfBinary(raw);
              const data   = await pdfParse(pdf);
              const text   = data.text || "";
              console.log("[Analyze] Texte extrait : " + text.length + " chars");
              if (text.trim().length > 10) {
                analysisStore[docId] = analyzeText(docId, text, doc);
              } else {
                console.warn("[Analyze] PDF scanné (texte vide)");
                analysisStore[docId] = {
                  id: docId, document_id: docId,
                  summary: "Document scanne. OCR requis pour analyse complete.",
                  anomalies: [{ type: "ocr_required", severity: "LOW", message: "Document scanne : utilisez le backend Python avec PaddleOCR.", value: null }],
                  risk_score: 0.15, created_at: new Date().toISOString(),
                };
              }
            } catch (e) {
              console.error("[Analyze] Erreur pdf-parse : " + e.message);
              analysisStore[docId] = {
                id: docId, document_id: docId,
                summary: "Erreur lecture PDF : " + e.message,
                anomalies: [], risk_score: 0.05, created_at: new Date().toISOString(),
              };
            }
          } else if (!pdfParse) {
            console.warn("[Analyze] pdf-parse non disponible");
            analysisStore[docId] = { id: docId, document_id: docId, summary: "pdf-parse non disponible.", anomalies: [], risk_score: 0.05, created_at: new Date().toISOString() };
          } else {
            console.warn("[Analyze] Fichier non trouve : " + rawPath);
            analysisStore[docId] = {
              id: docId, document_id: docId,
              summary: "Fichier non recu par le serveur.",
              anomalies: [{ type: "upload_error", severity: "LOW", message: "Fichier non recu. Reessayez l upload.", value: null }],
              risk_score: 0.10, created_at: new Date().toISOString(),
            };
          }
        }

        const analysis = { ...analysisStore[docId], document_id: docId };
        if (doc) { doc.risk_score = analysis.risk_score; doc.anomaly_count = analysis.anomalies.length; }
        console.log("[Analyze] FINAL risk=" + analysis.risk_score + " anomalies=" + analysis.anomalies.length);
        json(analysis);
      };

      setTimeout(() => doAnalysis().catch(e => {
        console.error("[Analyze] Erreur :", e);
        json({ detail: "Erreur serveur" }, 500);
      }), 2500);
    });
    return;
  }

  // GET /api/results/:id
  const rm = pathname.match(/^\/api\/results\/(\d+)$/);
  if (rm && method === "GET") {
    const docId    = parseInt(rm[1]);
    const doc      = docs.find(d => d.id === docId);
    if (!doc) { json({ detail: "Document " + docId + " non trouve." }, 404); return; }
    const analysis = analysisStore[docId];
    if (!analysis) { json({ document: doc, analysis: null }); return; }
    console.log("[Results] doc " + docId + " risk=" + analysis.risk_score + " anomalies=" + analysis.anomalies.length);
    json({ document: doc, analysis: { ...analysis, document_id: docId } });
    return;
  }

  if (pathname === "/api/documents" && method === "GET") { json(docs); return; }

  if (pathname === "/api/chat" && method === "POST") {
    body(payload => {
      const docId  = Number(payload.document_id);
      const result = getChatAnswer(docId, payload.question || "");
      setTimeout(() => json(result), 800);
    });
    return;
  }

  if (pathname === "/" || pathname === "/health") {
    json({ status: "ok", service: "FinDoc mock", documents: docs.length, analyses: Object.keys(analysisStore).length });
    return;
  }

  json({ detail: "Not found" }, 404);
}

http.createServer(router).listen(PORT, () => {
  console.log("\n Mock API => http://localhost:" + PORT);
  console.log("  pdf-parse : " + (pdfParse ? "ACTIVE" : "DESACTIVE"));
  console.log("  uploads   : " + UPLOAD_DIR + "\n");
});
