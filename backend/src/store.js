import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const INITIAL_DATA = {
  translationMemory: [],
  glossary: []
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_DATA, null, 2), "utf-8");
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function normalize(text) {
  return (text || "").trim().toLowerCase();
}

export function listTM() {
  return readStore().translationMemory;
}

export function addTM(entry) {
  const store = readStore();

  const next = {
    id: randomUUID(),
    sourceLang: entry.sourceLang,
    targetLang: entry.targetLang,
    sourceText: entry.sourceText.trim(),
    targetText: entry.targetText.trim(),
    context: entry.context?.trim() || "",
    createdAt: new Date().toISOString()
  };

  store.translationMemory.unshift(next);
  writeStore(store);
  return next;
}

export function suggestTM({ sourceText, sourceLang, targetLang, context }) {
  const sourceNorm = normalize(sourceText);
  const contextNorm = normalize(context);

  const scored = readStore().translationMemory
    .filter((item) => item.sourceLang === sourceLang && item.targetLang === targetLang)
    .map((item) => {
      const candidateNorm = normalize(item.sourceText);
      const exact = sourceNorm === candidateNorm;
      const partial = !exact && (candidateNorm.includes(sourceNorm) || sourceNorm.includes(candidateNorm));
      const contextBoost = contextNorm && normalize(item.context) === contextNorm ? 0.25 : 0;
      const score = exact ? 1 + contextBoost : partial ? 0.7 + contextBoost : 0;

      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return scored;
}

export function listGlossary() {
  return readStore().glossary;
}

export function addGlossary(entry) {
  const store = readStore();

  const next = {
    id: randomUUID(),
    sourceLang: entry.sourceLang,
    targetLang: entry.targetLang,
    sourceTerm: entry.sourceTerm.trim(),
    targetTerm: entry.targetTerm.trim(),
    domain: entry.domain?.trim() || "",
    note: entry.note?.trim() || "",
    createdAt: new Date().toISOString()
  };

  store.glossary.unshift(next);
  writeStore(store);
  return next;
}

export function suggestGlossary({ sourceText, sourceLang, targetLang, domain }) {
  const sourceNorm = normalize(sourceText);
  const domainNorm = normalize(domain);

  const matches = readStore().glossary
    .filter((item) => item.sourceLang === sourceLang && item.targetLang === targetLang)
    .map((item) => {
      const termNorm = normalize(item.sourceTerm);
      const inText = sourceNorm.includes(termNorm);
      const exactDomain = domainNorm && normalize(item.domain) === domainNorm;
      const score = inText ? 1 + (exactDomain ? 0.2 : 0) : 0;
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  return matches;
}
