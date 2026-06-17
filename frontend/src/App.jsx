import { useMemo, useState } from "react";
import { addGlossary, addTM, spellcheck, suggestGlossary, suggestTM } from "./api";

const initialSegments = [
  { id: 1, source: "Please press the emergency stop button.", target: "" },
  { id: 2, source: "The battery should be replaced every 24 months.", target: "" },
  { id: 3, source: "Do not expose the device to direct sunlight.", target: "" }
];

function splitIntoSegments(text) {
  return text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      id: index + 1,
      source: line,
      target: ""
    }));
}

export default function App() {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("pl");
  const [domain, setDomain] = useState("manual");
  const [context, setContext] = useState("safety");

  const [segments, setSegments] = useState(initialSegments);
  const [selectedId, setSelectedId] = useState(1);

  const [tmSuggestions, setTmSuggestions] = useState([]);
  const [glossarySuggestions, setGlossarySuggestions] = useState([]);
  const [spellResult, setSpellResult] = useState(null);
  const [status, setStatus] = useState("Gotowe");
  const [sourceTermInput, setSourceTermInput] = useState("");
  const [targetTermInput, setTargetTermInput] = useState("");
  const [sourceDraft, setSourceDraft] = useState("");

  const selectedSegment = useMemo(
    () => segments.find((item) => item.id === selectedId),
    [segments, selectedId]
  );

  const selectedTarget = selectedSegment?.target || "";

  async function handleSuggest() {
    if (!selectedSegment) return;
    setStatus("Pobieram podpowiedzi...");

    try {
      const [tm, glossary] = await Promise.all([
        suggestTM({
          sourceText: selectedSegment.source,
          sourceLang,
          targetLang,
          context
        }),
        suggestGlossary({
          sourceText: selectedSegment.source,
          sourceLang,
          targetLang,
          domain
        })
      ]);

      setTmSuggestions(tm);
      setGlossarySuggestions(glossary);
      setStatus("Podpowiedzi zaktualizowane");
    } catch (error) {
      setStatus(`Błąd: ${error.message}`);
    }
  }

  async function handleStoreTM() {
    if (!selectedSegment?.target.trim()) {
      setStatus("Najpierw wpisz tłumaczenie docelowe");
      return;
    }

    try {
      await addTM({
        sourceLang,
        targetLang,
        sourceText: selectedSegment.source,
        targetText: selectedSegment.target,
        context
      });
      setStatus("Dodano wpis do pamięci tłumaczeń");
    } catch (error) {
      setStatus(`Błąd: ${error.message}`);
    }
  }

  async function handleAddGlossary() {
    const sourceTerm = sourceTermInput.trim();
    const targetTerm = targetTermInput.trim();

    if (!sourceTerm || !targetTerm) {
      setStatus("Uzupełnij pola: termin źródłowy i docelowy");
      return;
    }

    try {
      await addGlossary({
        sourceLang,
        targetLang,
        sourceTerm,
        targetTerm,
        domain,
        note: context
      });
      setSourceTermInput("");
      setTargetTermInput("");
      setStatus("Dodano wpis do słownika kontekstowego");
    } catch (error) {
      setStatus(`Błąd: ${error.message}`);
    }
  }

  async function handleSpellcheck() {
    if (!selectedTarget.trim()) {
      setStatus("Brak tekstu docelowego do sprawdzenia");
      return;
    }

    try {
      const result = await spellcheck({
        text: selectedTarget,
        language: targetLang
      });
      setSpellResult(result);

      if (!result.supported) {
        setStatus("Język nieobsługiwany przez moduł spell-check");
        return;
      }

      setStatus(
        result.misspellings.length
          ? `Wykryto ${result.misspellings.length} potencjalnych błędów`
          : "Nie wykryto błędów pisowni"
      );
    } catch (error) {
      setStatus(`Błąd: ${error.message}`);
    }
  }

  function updateTarget(id, value) {
    setSegments((prev) => prev.map((item) => (item.id === id ? { ...item, target: value } : item)));
  }

  function applyTmSuggestion(value) {
    if (!selectedSegment) return;
    updateTarget(selectedSegment.id, value);
  }

  function insertGlossaryTerm(value) {
    if (!selectedSegment) return;
    const current = selectedSegment.target.trim();
    const next = current ? `${current} ${value}` : value;
    updateTarget(selectedSegment.id, next);
  }

  function handleLoadSourceText() {
    const parsed = splitIntoSegments(sourceDraft);
    if (parsed.length === 0) {
      setStatus("Wklej tekst źródłowy (min. 1 niepusta linia)");
      return;
    }

    setSegments(parsed);
    setSelectedId(parsed[0].id);
    setTmSuggestions([]);
    setGlossarySuggestions([]);
    setSpellResult(null);
    setStatus(`Załadowano ${parsed.length} segmentów z własnego tekstu`);
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>CAT Workbench</h1>
        <p>Platforma do wspomagania tłumaczenia z pamięcią TM, słownikiem i spell-checkiem.</p>
      </header>

      <section className="controls card">
        <label>
          Źródłowy
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            <option value="en">EN</option>
            <option value="pl">PL</option>
          </select>
        </label>
        <label>
          Docelowy
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            <option value="pl">PL</option>
            <option value="en">EN</option>
          </select>
        </label>
        <label>
          Domena
          <input value={domain} onChange={(e) => setDomain(e.target.value)} />
        </label>
        <label>
          Kontekst
          <input value={context} onChange={(e) => setContext(e.target.value)} />
        </label>
        <label>
          Termin źródłowy
          <input
            value={sourceTermInput}
            onChange={(e) => setSourceTermInput(e.target.value)}
            placeholder="np. emergency stop"
          />
        </label>
        <label>
          Termin docelowy
          <input
            value={targetTermInput}
            onChange={(e) => setTargetTermInput(e.target.value)}
            placeholder="np. wyłącznik awaryjny"
          />
        </label>
        <button onClick={handleSuggest}>Pobierz podpowiedzi</button>
        <button onClick={handleStoreTM}>Zapisz do TM</button>
        <button onClick={handleAddGlossary}>Dodaj do słownika</button>
        <button onClick={handleSpellcheck}>Sprawdź pisownię</button>
        <p className="inline-status">Status: {status}</p>
      </section>

      <section className="card ingest">
        <h2>Własny tekst źródłowy</h2>
        <p className="muted">Wklej tekst, użyj nowych linii jako granic segmentów, a potem kliknij Załaduj segmenty.</p>
        <textarea
          value={sourceDraft}
          onChange={(e) => setSourceDraft(e.target.value)}
          placeholder={"Line 1\nLine 2\nLine 3"}
        />
        <button onClick={handleLoadSourceText}>Załaduj segmenty</button>
      </section>

      <main className="layout">
        <section className="segments card">
          <h2>Segmenty</h2>
          {segments.map((segment) => (
            <article
              key={segment.id}
              className={`segment ${segment.id === selectedId ? "is-selected" : ""}`}
              onClick={() => setSelectedId(segment.id)}
            >
              <div className="source">{segment.source}</div>
              <textarea
                value={segment.target}
                placeholder="Wpisz tłumaczenie docelowe..."
                onChange={(e) => updateTarget(segment.id, e.target.value)}
              />
            </article>
          ))}
        </section>

        <aside className="sidebar">
          <section className="card">
            <h3>Pamięć tłumaczeń</h3>
            {tmSuggestions.length === 0 ? (
              <p className="muted">Brak trafień TM</p>
            ) : (
              tmSuggestions.map((item) => (
                <button key={item.id} className="suggestion" onClick={() => applyTmSuggestion(item.targetText)}>
                  <strong>{item.targetText}</strong>
                  <span>score: {item.score.toFixed(2)}</span>
                </button>
              ))
            )}
          </section>

          <section className="card">
            <h3>Słownik kontekstowy</h3>
            {glossarySuggestions.length === 0 ? (
              <p className="muted">Brak terminów dla segmentu</p>
            ) : (
              glossarySuggestions.map((item) => (
                <button key={item.id} className="suggestion" onClick={() => insertGlossaryTerm(item.targetTerm)}>
                  <strong>
                    {item.sourceTerm} → {item.targetTerm}
                  </strong>
                  <span>{item.domain || "bez domeny"}</span>
                </button>
              ))
            )}
          </section>

          <section className="card">
            <h3>Spell-check</h3>
            {!spellResult ? <p className="muted">Brak analizy</p> : null}
            {spellResult?.supported === false ? <p>Język nieobsługiwany</p> : null}
            {spellResult?.supported && spellResult.misspellings.length === 0 ? (
              <p>Brak błędów pisowni.</p>
            ) : null}
            {spellResult?.supported && spellResult.misspellings.length > 0
              ? spellResult.misspellings.map((item, idx) => (
                  <div key={`${item.token}-${idx}`} className="misspelling">
                    <strong>{item.token}</strong>
                    <span>pozycja: {item.index}</span>
                    <small>{item.suggestions.join(", ") || "brak sugestii"}</small>
                  </div>
                ))
              : null}
          </section>
        </aside>
      </main>
    </div>
  );
}
