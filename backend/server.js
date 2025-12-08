require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

const dynamicFetch = (...args) =>
  import("node-fetch").then((m) => m.default(...args));

function buildPrompt(description) {
  return `Tu es un assistant chargé d’extraire des informations structurées depuis une description de projet rédigée en français.

⚠️ Sortie strictement en JSON VALIDE — aucun texte avant ou après. Pas de Markdown. Pas d’explication.

--------------------------------------
🎯 RÈGLES D’EXTRACTION
--------------------------------------

1. "titre" (string ou null)
   - Utilise le titre explicitement indiqué ("Titre: ...").
   - Sinon, déduis le nom du projet si présent dans une phrase (ex: "On crée GreenSoul" → "GreenSoul").
   - Sinon null.

2. "description" (string ou null)
   - Résume en 1 phrase courte le but du projet.
   - Si aucune description claire → null.

3. "budget" (number ou null)
   - Extrais un montant même s’il est écrit sous une forme informelle :
       - "40 000 €" → 40000
       - "5k€" / "5k" / "5 K" → 5000
       - "entre 20k et 30k" → prends la valeur minimale → 20000
       - "aucune idée", "?" → null
   - Si plusieurs nombres sont présents → prends le montant le plus pertinent.

4. "debut" (date ISO yyyy-mm-dd ou null)
   - Accepte formats variés : "01/03/2026", "février 2026", "mi-janvier 2026", "début 2026".
   - Si la date est floue :
       - "début 2026" → 2026-01-01
       - "mi-janvier 2026" → 2026-01-15
       - "février 2026" → 2026-02-01
   - Si impossible → null.

5. "fin" (date ISO yyyy-mm-dd ou null)
   - Même logique que pour "debut".
   - Si l’utilisateur dit "avant l’été 2026" → approx = 2026-06-01.
   - "fin 2026" → 2026-12-31.

6. "fonctionnalites" (array de strings ou null)
   - Extrais toutes les fonctionnalités détectées, même en texte libre.
   - Sépare par virgules, puces, ou mots-clés.
   - Si aucune fonctionnalité claire → null.

--------------------------------------

Voici la description à analyser :
"""
${description}
"""

Commence la réponse par '{' et termine par '}' sans rien d’autre.`;
}

function normalizeOllamaOutput(rawText) {
  if (!rawText) return "";

  // If the response is a single JSON object or array, try to parse that first
  try {
    const parsed = JSON.parse(rawText);
    // If parsed is an object and contains aggregated fields, try to extract text
    if (typeof parsed === "object") {
      // Common patterns: { response: '...' } or { output: '...' }
      if (typeof parsed.response === "string") return parsed.response;
      if (typeof parsed.output === "string") return parsed.output;
      // If the object itself looks like the final JSON, return the rawText
      return rawText;
    }
  } catch (e) {
    // Not a single JSON document — may be NDJSON (one JSON per line).
  }

  // NDJSON or multiple JSON objects concatenated with newlines
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  let acc = "";
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj && typeof obj === "object") {
        // Ollama uses `response` fragments when streaming
        if (typeof obj.response === "string") acc += obj.response;
        else if (typeof obj.output === "string") acc += obj.output;
      }
    } catch (err) {
      // not a JSON line - append raw
      acc += line;
    }
  }

  return acc;
}

async function callOllama(prompt) {
  const url = `${OLLAMA_URL}/api/generate`;
  const body = {
    model: OLLAMA_MODEL,
    prompt,
    max_tokens: 800,
    temperature: 0.2,
  };
  const res = await dynamicFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return text;
}

function extractFirstJson(text) {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  const jsonText = match[0];
  try {
    return JSON.parse(jsonText);
  } catch (err) {
    return null;
  }
}

function normalizeSchema(obj) {
  // Ensure object is a plain object
  if (!obj || typeof obj !== "object") return null;

  const keys = [
    "titre",
    "description",
    "budget",
    "debut",
    "fin",
    "fonctionnalites",
  ];
  const out = {};
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      out[k] = obj[k] === undefined ? null : obj[k];
    } else {
      out[k] = null;
    }
  }

  // Normalize `fonctionnalites` to array when possible
  const f = out.fonctionnalites;
  if (f === null) {
    // keep null
  } else if (Array.isArray(f)) {
    out.fonctionnalites = f.map((i) => (typeof i === "string" ? i.trim() : i));
  } else if (typeof f === "string") {
    // split by commas if present, otherwise single-item array
    if (f.includes(",")) {
      out.fonctionnalites = f
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.trim() === "") {
      out.fonctionnalites = null;
    } else {
      out.fonctionnalites = [f.trim()];
    }
  } else {
    // unknown type — keep as-is inside an array
    out.fonctionnalites = [f];
  }

  return out;
}

app.post("/api/extract", async (req, res) => {
  try {
    const description = req.body?.description;
    if (!description || typeof description !== "string") {
      return res.status(400).json({
        error:
          'Le champ "description" (string) est requis. Vérifiez que vous envoyez JSON valide et l en-tête Content-Type: application/json.',
      });
    }

    const prompt = buildPrompt(description);
    const llmRaw = await callOllama(prompt);
    const normalized = normalizeOllamaOutput(llmRaw);

    const parsed = extractFirstJson(normalized);
    if (!parsed) {
      return res.status(502).json({
        error: "Impossible de parser la réponse LLM en JSON.",
        // include both raw and normalized to help debugging
        raw: llmRaw,
        normalized,
      });
    }

    const final = normalizeSchema(parsed);
    if (!final) {
      return res
        .status(502)
        .json({ error: "Réponse LLM non conforme", raw: parsed });
    }

    return res.json({ success: true, data: final });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Erreur interne", details: err.message });
  }
});

app.get("/", (req, res) => res.json({ ok: true, msg: "API backend ready" }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});
