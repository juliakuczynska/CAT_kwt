import express from "express";
import cors from "cors";
import morgan from "morgan";
import {
  addGlossary,
  addTM,
  listGlossary,
  listTM,
  suggestGlossary,
  suggestTM
} from "./store.js";
import { checkSpelling } from "./spellcheck.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/tm", (_req, res) => {
  res.json(listTM());
});

app.post("/api/tm", (req, res) => {
  const { sourceLang, targetLang, sourceText, targetText, context } = req.body || {};

  if (!sourceLang || !targetLang || !sourceText || !targetText) {
    res.status(400).json({
      error: "Wymagane: sourceLang, targetLang, sourceText, targetText"
    });
    return;
  }

  const created = addTM({ sourceLang, targetLang, sourceText, targetText, context });
  res.status(201).json(created);
});

app.post("/api/tm/suggest", (req, res) => {
  const { sourceText, sourceLang, targetLang, context } = req.body || {};

  if (!sourceText || !sourceLang || !targetLang) {
    res.status(400).json({
      error: "Wymagane: sourceText, sourceLang, targetLang"
    });
    return;
  }

  const suggestions = suggestTM({ sourceText, sourceLang, targetLang, context });
  res.json(suggestions);
});

app.get("/api/glossary", (_req, res) => {
  res.json(listGlossary());
});

app.post("/api/glossary", (req, res) => {
  const { sourceLang, targetLang, sourceTerm, targetTerm, domain, note } = req.body || {};

  if (!sourceLang || !targetLang || !sourceTerm || !targetTerm) {
    res.status(400).json({
      error: "Wymagane: sourceLang, targetLang, sourceTerm, targetTerm"
    });
    return;
  }

  const created = addGlossary({ sourceLang, targetLang, sourceTerm, targetTerm, domain, note });
  res.status(201).json(created);
});

app.post("/api/glossary/suggest", (req, res) => {
  const { sourceText, sourceLang, targetLang, domain } = req.body || {};

  if (!sourceText || !sourceLang || !targetLang) {
    res.status(400).json({
      error: "Wymagane: sourceText, sourceLang, targetLang"
    });
    return;
  }

  const suggestions = suggestGlossary({ sourceText, sourceLang, targetLang, domain });
  res.json(suggestions);
});

app.post("/api/spellcheck", async (req, res) => {
  const { text, language } = req.body || {};

  if (!text || !language) {
    res.status(400).json({
      error: "Wymagane: text, language"
    });
    return;
  }

  try {
    const result = await checkSpelling(text, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Błąd podczas sprawdzania pisowni",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`CAT backend listening on http://localhost:${PORT}`);
});
