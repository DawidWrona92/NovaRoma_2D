# Narzędzia deweloperskie Nova Roma

Gra to jeden plik `Nova_Roma.html` (bez zależności). Poniższe skrypty są tylko do testów i nie są potrzebne do grania.
Wymagany jest Node 18+ (skrypty `browser_*.js` dodatkowo Playwright z Chromium).

## Testy silnika (bez przeglądarki)

`headless.js` wczytuje skrypt gry w `node:vm` z atrapami DOM i udostępnia moduły (`World`, `Economy`, `Tribute`, `TestBots`, `Advisor`…).

| Skrypt | Co robi |
|---|---|
| `node tools/scenarios.js [plik] [filtr]` | 58 scenariuszy ze specyfikacji (normalna gra, warunki brzegowe, kryzysy) dla 4 nacji + niezmienniki sprawdzane w każdym ticku (brak ujemnych zapasów, ludność ≥ 10, ceny w krzywej…). |
| `node tools/normal.js [plik] [nacja]` | Normalna gra botami R/D/N: ludność @20/40/60/90/150, głód, terminy haraczu, złoto, deski. |
| `node tools/mapstats.js` | Generator map: liczba drzew (300/150/450/300), złoża, brzeg Wikingów. |
| `node tools/raids.js` | Napady na karawanę (Saraceni): strata średnia po 24 ziarnach ze Strażnicami i bez. |
| `node tools/store.js` | Wpływ Składu na pojemność haraczu Słowian. |

## Testy w przeglądarce (Playwright)

| Skrypt | Co robi |
|---|---|
| `node tools/browser_ui.js` | Przepływy UI dla 4 nacji: budowa kliknięciem, karta budynku, haracz (preset i poziom 1–11), przełączniki, Doradca, żywa pętla gry. |
| `node tools/browser_play.js [nacje] [minuty]` | Bot buduje osadę, zrzuty ekranu (`SHOTS=katalog`) z Doradcą i kartą budynku. |
| `node tools/browser_contact.js nacja [id,id…] [zoom] [kolumny]` | Kontaktówka sprite'ów budynków nacji. |
| `node tools/browser_mobile.js` | Widok telefonu (dotyk): wybór nacji, HUD, Doradca. |

## Parametry scenariusza (stan `World.state().settings`)

`raids` (napady na karawanę), `voyageGuard` (reguła 90% robotników Wikingów), `shoreSpots` (miejsca pod Chaty rybaka),
`depositLeft` (opcjonalne skończone złoża, np. `{ clay: 60 }`). Liczby złóż i drzew: `Data.FACTIONS[nacja].deposits / treesTarget`.
