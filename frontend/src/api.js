const API_BASE = "http://localhost:4000/api";

async function parseJson(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Błąd API");
  }
  return data;
}

export async function suggestTM(payload) {
  const response = await fetch(`${API_BASE}/tm/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseJson(response);
}

export async function addTM(payload) {
  const response = await fetch(`${API_BASE}/tm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseJson(response);
}

export async function suggestGlossary(payload) {
  const response = await fetch(`${API_BASE}/glossary/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseJson(response);
}

export async function addGlossary(payload) {
  const response = await fetch(`${API_BASE}/glossary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseJson(response);
}

export async function spellcheck(payload) {
  const response = await fetch(`${API_BASE}/spellcheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseJson(response);
}
