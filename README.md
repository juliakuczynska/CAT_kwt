# CAT_kwt

Własna platforma CAT (Computer-Assisted Translation) z webowym frontendem i backendem API.

## Funkcje

- Webowy frontend do pracy na segmentach tłumaczenia
- Pamięć tłumaczeń (Translation Memory)
- Słownik kontekstowy (glossary per domena/kontekst)
- Sprawdzanie pisowni po stronie docelowej (EN/PL)

## Struktura projektu

- `frontend/` - React + Vite (interfejs CAT)
- `backend/` - Express API (TM, glossary, spell-check)

## Wymagania

- Node.js 20+ (zalecane)

## Instalacja

W osobnych terminalach:

1. Backend

```powershell
cd backend
npm install
npm run dev
```

Backend uruchamia się na `http://localhost:4000`.

2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend uruchamia się na `http://localhost:5173`.

## Jak używać

1. Wybierz język źródłowy/docelowy, domenę i kontekst.
2. (Opcjonalnie) Wklej własny tekst do sekcji `Własny tekst źródłowy` i kliknij `Załaduj segmenty`.
3. Pracuj na segmentach po lewej stronie (wpisuj tłumaczenie docelowe).
4. Kliknij `Pobierz podpowiedzi`, aby pobrać dopasowania z TM i słownika.
5. Kliknij `Zapisz do TM`, aby dodać aktualny segment do pamięci tłumaczeń.
6. Uzupełnij pola terminu i kliknij `Dodaj do słownika`, aby zapisać termin źródłowy/docelowy.
7. Kliknij `Sprawdź pisownię`, aby zweryfikować tekst docelowy.

## Szybki scenariusz testowy

1. Wklej np. 3 linie tekstu EN i kliknij `Załaduj segmenty`.
2. Przetłumacz pierwszy segment i kliknij `Zapisz do TM`.
3. Kliknij `Pobierz podpowiedzi` - wpis powinien pojawić się w panelu `Pamięć tłumaczeń`.
4. Dodaj termin do słownika i ponownie kliknij `Pobierz podpowiedzi`.
5. Wpisz literówkę w tłumaczeniu i kliknij `Sprawdź pisownię`.

## API (skrót)

- `GET /api/health`
- `GET /api/tm`
- `POST /api/tm`
- `POST /api/tm/suggest`
- `GET /api/glossary`
- `POST /api/glossary`
- `POST /api/glossary/suggest`
- `POST /api/spellcheck`

## Dane

Backend przechowuje dane w pliku `backend/data/store.json` (tworzony automatycznie przy pierwszym uruchomieniu).