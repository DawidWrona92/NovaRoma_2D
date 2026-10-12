# Wyniki botów i scenariuszy w grze {#wyniki-gry}

Wyniki poniżej pochodzą z plików `docs/data/wyniki_testow.json`, które zapisuje `node docs/collect.js` (uruchamia `tools/normal.js` i `tools/scenarios.js` albo parsuje ich gotowe wyjścia). Odświeżamy je po każdej fazie, w której zmieniła się logika gry; stan z dnia i commitu podano w podpisach tabel.

## Normalna gra botów {#b-normalna}

Boty: **R** — przepis nacji z szumem ε (nieuwaga), **D** — przepis z opóźnieniem decyzji (co 2 min), **N** — reaktywny, bez przepisu (rozdz. {{ref:testy}}). Haracz „Łatwy” oznacza poziom 3 od pierwszego terminu nacji.

{{tabela:wyniki_normalna}}

## Scenariusze akceptacyjne {#b-scenariusze}

58 scenariuszy ze specyfikacji (normalna gra, warunki brzegowe, kryzysy) dla czterech nacji; w każdym ticku sprawdzane są niezmienniki (brak ujemnych zapasów, ludność ≥ 10, ceny w krzywej, magazyny w limitach…). Kolumna „Haracz” to terminy spełnione / ocenione.

{{tabela:wyniki_scenariusze}}
