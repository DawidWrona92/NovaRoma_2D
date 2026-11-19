# Afganistan 1979 — Kompania 40. Armii

Mikro-RTS w HTML/CSS/JS w stylu Company of Heroes, osadzony podczas radzieckiej inwazji na Afganistan (1979). Jeśli grasz 40. Armią ZSRR, walczysz przeciwko mudżahedinów o punkty kontroli.

## Uruchomienie

Otwórz `index.html` w przeglądarce (wystarczy podwójne kliknięcie — zero zależności, zero serwera). Nie wymaga żadnych zależności.

## Grywalne mapy

| Mapa | Opis |
| --- | --- |
| **Wadi Kandahar** | Suche koryto rzeki, skalne przełęcze — walki o przełęczę wschodnią, dno wadi i skałę zachodnią. |
| **Kunduz — wioska** | Zabudowana wioska z gliny — walki o minaret, studnię i wzgórze. |

## Frakcje i jednostki

**40. Armia (gracz):** Strzelec (AK), RPG-7 (przeciw pojazdom), BTR-70, T-62.
**Mudżahedini (AI):** mudżahedin z AK, RPG-7, Technikal (Toyota z DShK).

## Zasady gry

- **Zaopatrzenie** rośnie z czasem i jest wartością wzrostową — za każdy punkt kontroli, który kontrolujesz.
- **Punkty kontroli (3 na mapę):** wprowadź jednostki w promieniu, aby przejmować punkt. Trzy punkty = **ZWYCIĘSTWO** po utrzymaniu ich 30 s (albo wybij wszystkie siły wroga).
- **Sterowanie:** LPM — kliknięcie/ramka zaznaczania • **PPM** — ruch / atak na wroga • **Spacja** — stopuj • **A** — szturm na najbliższy punkt • **ESC** — odznacz.
- **Produkcja jednostek:** dolny panel (limit kompanii: 18).

## Kwestie techniczne

- **Sprity** (16): piechota, pojazdy, flaga punktu kontroli, kafle podłoża, domy, skały, drzewa — generowane deterministycznie na siatce ASCII (`scripts/build-sprites.js`), walidowane przez walidator stylu modern pixel art (`validateModern`: sieroty, near-duplikaty ΔE, banding, sel-out share).
- **Silnik**: canvas 2D, izometryczne kafle 64×32, sortowanie wg głębokości, A* (8 kierunków z zapobieganiem przecinaniu rogów), proste strzały i AI przeciwnika (reinforcements + priorytet przejmowania punktów).
- **Sprawdzenia**: `node scripts/build-sprites.js` (walidacja spriteów), `node scripts/smoke-test.js` (symulacja logiczna 90 s na obu mapach).

## Struktura projektu

```
index.html          — UI (menu, HUD, panel produkcji)
style.css           — interfejs pustynnej palety
sprites.js          — dane spriteów (wygenerowane, nie edytuj ręcznie)
maps.js             — definicje dwóch map
game.js             — silnik gry
scripts/            — pipeline spriteów + testy dymne
preview/            — podglądy SVG/PNG wygenerowane przez pipeline
```

## Regeneracja spriteów

```
cd scripts
node build-sprites.js    # waliduje i generuje sprites.js
node render-map.js       # renderuje statyczne mapy do PNG (test wizualny)
```
