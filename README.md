# Nova Roma

Gra strategiczno-ekonomiczna w jednym pliku HTML (canvas 2D, bez zależności).

| Co | Gdzie |
|---|---|
| **Gra** (Etap 6: cztery nacje z Słowianami, ekonomia wg specyfikacji v3.6, Doradca, statusy budynków) | `Nova_Roma.html` — otwórz w przeglądarce |
| Testy i narzędzia (silnik bez przeglądarki, scenariusze akceptacyjne, testy UI w Playwright) | `tools/` — patrz `tools/README.md` |
| Prototyp nowego stylu graficznego (RTS lat 90/2000: budynki o różnych obrysach, zużycie, kamera z oddalaniem) — **osadzony w grze** (sprite'y przez `prototyp/build_game.js`) | `prototyp/` — otwórz `prototyp/grafika_prototyp.html`, opis w `prototyp/README.md` |

Prototyp jest budowany z `prototyp/src/*.js` poleceniem `node prototyp/build.js` (skleja w jeden plik HTML);
podglądy w `prototyp/podglad/` odświeża `sh prototyp/podglady.sh` (Node + Playwright + Chromium).

## Zasady rozgrywki dodane w nowym stylu (teren, ruch, zabudowa)
- **Teren:** 4 klimaty (umiarkowany, Europa Wschodnia, śnieżny, pustynny) × 6 typów map (nadmorska, nizinna, rzeczna, jeziorna, górzysta, bagnista; Wikingowie zawsze nadmorska); `?play=nacja&climate=…&map=…&seed=…`.
- **Zabudowa:** pole obok budynku jest zabronione (przerwa 1 pola — miejsce na drogę); w odległości 2–3 pól od innych budynków budowa trwa dłużej (+10% za każdy, maks. +40%) — gra pokazuje strefy i karę przed wyborem miejsca.
- **Wzgórza:** pochyły teren trzeba wyrównać (+0,25 min budowy za każde pole do przesunięcia); stoki mają własną grafikę (ziemia i stopnie), a obszar startowy (≤ 13,5 pola od Dworu) jest płaski — wzgórza zaczynają się dalej.
- **Drogi:** narzędzie „Drogi” w pasku budowy (początek i koniec, 1 deska za pole); po drodze piesi i nosiciele chodzą ok. 1,6× szybciej, a ścieżki je preferują.
- **Logistyka:** producent daleko od Składu / Dworu daje mniej (do −30%, bezpłatnie do 6 pól drogi); przełącznik 🚚 w HUD (`?logistics=0` wyłącza); scenariusze specyfikacji liczą się bez logistyki.
- **Fauna i polowanie:** sarny i króliki (w śnieżnym renifery i zające polarne, na pustyni gazele i króliki pustynne), lisy, dziki, łosie, wielbłądy, foki, jaszczurki i ptaki żyją przy legowiskach; Chata myśliwego **nie wymaga lasu w pobliżu** — wysyła myśliwego z łukiem (idzie, celuje, strzela, niesie zdobycz), a jej plon to × min(1, zwierzyna w łowisku / 5 pkt); wiele Chat w jednej okolicy przetrzebia zwierzynę (odradza się przy legowiskach). `?fauna=0` wyłącza; scenariusze specyfikacji liczą się bez fauny.
