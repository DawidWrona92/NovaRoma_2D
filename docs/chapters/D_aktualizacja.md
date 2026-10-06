# Procedura aktualizacji dokumentacji {#aktualizacja}

Dokumentacja jest częścią repozytorium i **jest aktualizowana po każdym etapie prac**, jeśli etap zmienia logikę, dane, interfejs, testy lub decyzje projektowe. Tabele i wartości liczbowe pochodzą z kodu, więc większość zmian danych widać po samej przebudowie PDF; zmiany *zasad* wymagają poprawienia tekstu rozdziału.

## Lista kontrolna po etapie {#lista}

1. Zbuduj PDF: `node docs/build.js` (lub `--check`, jeśli nie potrzeba PDF). Komunikat „PROBLEMY” oznacza błąd dyrektywy, nieopisane pole stanu gry albo odwołanie do nieistniejącego rozdziału.
2. Jeśli zmieniono logikę ekonomii, teren, zabudowę, ruch, faunę lub interfejs — popraw odpowiedni rozdział (tabela poniżej).
3. Jeśli zmieniono liczby, które testy sprawdzają — odśwież wyniki: `node docs/collect.js`.
4. Dodaj wpis w rozdz. {{ref:decyzje}} (nowa decyzja projektowa lub fakt historyczny) i, jeśli trzeba, w rozdz. {{ref:spec-kod}} (różnica względem specyfikacji).
5. Zaktualizuj `docs/meta.json` (wersja dokumentu, opis stanu projektu na okładce) i tabelę faz w rozdz. {{ref:stan}}.
6. Obejrzyj PDF (strony → PNG, np. `pdftoppm -r 60 -png docs/Nova_Roma_dokumentacja.pdf /tmp/doc`), popraw układ.
7. Zacommituj razem z kodem etapu: źródła rozdziałów **i** `docs/Nova_Roma_dokumentacja.pdf`.

## Który rozdział zmienia która zmiana {#mapa}

Tabela: Mapa zmian i rozdziałów
| Zmiana w grze | Rozdziały do przeglądu |
|---|---|
| nowy budynek, zmiana kosztu lub tempa (`Data.BUILDINGS`) | 6 (tabele z kodu), 7 (łańcuchy i przepisy), 8 (lista `NEED_LIST`), 16 |
| ekonomia: produkcja, obsada, jedzenie, imigracja, popularność | 3, 4, 18 |
| haracz, terminy, presety, rynek, wyprawy | 7, 8, 9, aneks A |
| teren, klimaty, typy map, generator | 10, 11 |
| zasady zabudowy, wyrównywanie, strefy | 5, 11 |
| ścieżki, drogi, piesi, logistyka | 12 |
| fauna, polowanie | 13 |
| HUD, Doradca, menu, parametry adresu | 1, 14 |
| sprite'y, render, wydajność | 15 |
| testy, skrypty, regresja | 16, aneksy B i C |
| nowy moduł lub zmiana kolejności ticku | 2 (diagramy ręczne w `docs/diagrams.js`) |
