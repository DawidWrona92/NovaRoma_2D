# Nova Roma

Gra strategiczno-ekonomiczna w jednym pliku HTML (canvas 2D, bez zależności).

| Co | Gdzie |
|---|---|
| **Gra** (Etap 6: cztery nacje z Słowianami, ekonomia wg specyfikacji v3.6, Doradca, statusy budynków) | `Nova_Roma.html` — otwórz w przeglądarce |
| Testy i narzędzia (silnik bez przeglądarki, scenariusze akceptacyjne, testy UI w Playwright) | `tools/` — patrz `tools/README.md` |
| Prototyp nowego stylu graficznego (RTS lat 90/2000: budynki o różnych obrysach, zużycie, kamera z oddalaniem) — **jeszcze niepodłączony do gry** | `prototyp/` — otwórz `prototyp/grafika_prototyp.html`, opis w `prototyp/README.md` |

Prototyp jest budowany z `prototyp/src/*.js` poleceniem `node prototyp/build.js` (skleja w jeden plik HTML);
podglądy w `prototyp/podglad/` odświeża `sh prototyp/podglady.sh` (Node + Playwright + Chromium).
