import nspell from "nspell";
import dictionaryEn from "dictionary-en";
import dictionaryPl from "dictionary-pl";

const loaders = {
  en: dictionaryEn,
  pl: dictionaryPl
};

const spellCache = new Map();

function loadDictionary(lang) {
  if (spellCache.has(lang)) {
    return Promise.resolve(spellCache.get(lang));
  }

  const loader = loaders[lang];
  if (!loader) {
    return Promise.resolve(null);
  }

  // Some dictionary packages export aff/dic objects directly, others expose callback loaders.
  if (typeof loader === "object" && loader !== null) {
    const spell = nspell(loader);
    spellCache.set(lang, spell);
    return Promise.resolve(spell);
  }

  return new Promise((resolve, reject) => {
    loader((err, dict) => {
      if (err) {
        reject(err);
        return;
      }
      const spell = nspell(dict);
      spellCache.set(lang, spell);
      resolve(spell);
    });
  });
}

function tokenize(text) {
  return Array.from(text.matchAll(/\p{L}[\p{L}\p{M}'-]*/gu)).map((match) => ({
    word: match[0],
    index: match.index
  }));
}

export async function checkSpelling(text, language) {
  const spell = await loadDictionary(language);
  if (!spell) {
    return {
      language,
      supported: false,
      misspellings: []
    };
  }

  const seen = new Set();
  const misspellings = [];

  for (const token of tokenize(text || "")) {
    const lc = token.word.toLowerCase();

    if (seen.has(`${lc}:${token.index}`)) {
      continue;
    }

    seen.add(`${lc}:${token.index}`);

    if (!spell.correct(token.word)) {
      misspellings.push({
        token: token.word,
        index: token.index,
        suggestions: spell.suggest(token.word).slice(0, 5)
      });
    }
  }

  return {
    language,
    supported: true,
    misspellings
  };
}
