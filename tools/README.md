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
| `node tools/terrain.js [plik] [ziarna]` | Generator terenu v2: macierz 4 nacje × 4 klimaty × 6 typów map (Wikingowie: nadmorska) × ziarna — niezmienniki pól kafli, walidacja (łączność, drzewa, złoża, miejsce pod zabudowę, brody, brzeg Wikingów), płaski plac wokół Dworu, liczby drzew i złóż, reguły `canPlace` dla wody i cech terenu, determinizm, izolacja globalnego `RNG` (Terrain.apply go nie dotyka). |
| `node tools/path.js [plik] [pary]` | Path (A*): koszt = Dijkstra, trasa tylko po polach przechodnich (rzeka tylko brodem / lodem), bez ścinania rogów, wygładzanie, brak RNG, szybkość. |
| `node tools/walkers.js [plik] [minuty]` | Widoczni piesi (Walkers): symulacja bota na 5 mapach — postacie tylko na wolnych polach przechodnich, nosiciele dochodzą do drzwi, budowniczowie przy placach, logika gry identyczna z Walkers i bez (cień symulacji). |
| `node tools/roads.js [plik]` | Drogi: koszt tylko za nowe pola, odmowy (woda, brak desek), budowa zdejmuje drogę, A* i prędkość pieszych po drodze, JSON, brak RNG. |
| `node tools/spacing.js [plik]` | Zasady zabudowy (Data.RULES): przerwa 1 pola, strefy kary 2–3 pola, boty układają całą recepturę mimo przerwy. |
| `node tools/leveling.js [plik]` | Wyrównywanie terenu: `levelOf`, etap 0 placu, czas budowy na stoku, zakaz rozpiętości ≥ 2, boty wybierają płaskie miejsca, obszar startowy bez stoków, wzgórza decyzyjne. |
| `node tools/logistics.js [plik]` | Sprawność logistyczna: blisko Składu bez kary, daleko spadek ≥ 70%, drogi i Skład poprawiają, ekonomia produkuje mniej przy słabej logistyce, brak RNG. |
| `node tools/footprints.js [plik]` | Obrysy budynków (w×h): zgodność z katalogiem sprite'ów, zajętość i zwolnienie pól, `canPlace` z pierścieniem sąsiedztwa, złoża pod kopalnią, place budowy (`siteAt`, `cancel`), wyburzenie, Dwór 4×4, miejsca dla botów. |

## Testy w przeglądarce (Playwright)

| Skrypt | Co robi |
|---|---|
| `node tools/browser_ui.js` | Przepływy UI dla 4 nacji: budowa kliknięciem, karta budynku, haracz (preset i poziom 1–11), przełączniki, Doradca, żywa pętla gry. |
| `node tools/browser_play.js [nacje] [minuty]` | Bot buduje osadę, zrzuty ekranu (`SHOTS=katalog`) z Doradcą i kartą budynku. |
| `node tools/browser_contact.js nacja [id,id…] [skala] [kolumny]` | Kontaktówka sprite'ów budynków nacji z obrysem i podpisem (`CLASSIC=1` — dawne procedury `Gfx.ART`). |
| `node tools/browser_sprites.js [jakość 1\|2] [nacje]` | Wypiek sprite'ów każdej nacji (`Sprites.bake`): wszystkie budynki, obrysy = katalog, niepuste warstwy, czas, brak błędów JS. |
| `node tools/browser_terrain.js [nacja] [--fps] [--sheet=plik.png] [--shots=katalog]` | Każda kombinacja klimat × typ mapy startuje przez `?play=…&climate=…&map=…&seed=…`: brak błędów JS, wypieczone chunki podłoża, niepusty obraz, FPS (`--fps`), arkusz kontaktowy 4 klimaty × 6 typów (`--sheet`). |
| `node tools/browser_mobile.js` | Widok telefonu (dotyk): wybór nacji, HUD, Doradca. |

Gra w przeglądarce startuje po wypieku sprite'ów wybranej nacji — testy czekają na `window.__gameReady === true`. Parametry adresu: `?q=1|2` (jakość wypieku), `?classic=1` (bez sprite'ów), `?play=nacja&climate=temperate|eastern|snow|desert&map=coast|plain|river|lakes|mountains|wetlands&seed=N` (start bez menu — ta sama ścieżka co przyszła Piaskownica).

## Parametry scenariusza (stan `World.state().settings`)

`raids` (napady na karawanę), `voyageGuard` (reguła 90% robotników Wikingów), `shoreSpots` (miejsca pod Chaty rybaka),
`depositLeft` (opcjonalne skończone złoża, np. `{ clay: 60 }`). Liczby złóż i drzew: `Data.FACTIONS[nacja].deposits / treesTarget`.
