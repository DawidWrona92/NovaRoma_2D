# Fauna i polowanie {#fauna}

Fauna to zwierzęta na mapie (sarny, króliki, lisy, foki, ptaki…) i wyprawy myśliwego, który wychodzi z Chaty myśliwego po zwierzynę. Moduł `Fauna` nie zmienia ekonomii sam z siebie: wpływa na nią tylko przez jeden mnożnik plonu Chaty myśliwego i przez liczniki wypraw. Fauna jest włączona w grze, a wyłączona w scenariuszach specyfikacji, więc bilans z rozdz. {{ref:ekonomia}} i testy specyfikacji liczą się bez niej.

## Gatunki {#gatunki}

Katalog `Data.FAUNA` opisuje każdy gatunek. Role to: `prey` — zwierzyna łowna (jedyna, na którą poluje myśliwy), `roamer` — zwierzęta wałęsające się (niełowne), `bird` — ptaki (wyłącznie kosmetyczne przeloty). Klimat wybiera zestaw gatunków, a nie ekonomię: mapa śnieżna ma renifery i foki, pustynna gazele i wielbłądy.

{{tabela:fauna_gatunki}}

Zwierzęta zachowują się w czterech trybach (`IDLE`, `WALK`, `FLEE`, `DEAD`, plus `HUNTED` i `HIDE` w czasie wypraw). Zwierzę, które wykryje zagrożenie (`buildThreats`), przechodzi w tryb ucieczki z prędkością `flee`, zwykle większą od spaceru `sp`. Siedlisko (`hab`) to test otoczenia: las to co najmniej 3 drzewa w promieniu 2 pól, otwarty ląd to co najwyżej 4 drzewa, brzeg to morze lub lód przy sąsiednim polu. Kolumna `n` w tabeli to liczba osobników na mapę 48×48 przy starcie i cel odradzania; liczebności są mniejsze niż w pierwotnym projekcie (wałęsające się i ptaki ok. 50%, zwierzyna łowna ok. 70%).

## Legowiska i odradzanie {#legowiska}

Przy starcie mapy `Fauna.populate` tworzy `den` legowisk na lądzie, w odległości 10–21 pól od Dworu i w siedlisku gatunku (gdy to się nie uda, dopuszczalne jest do 24 pól). Przy każdym legowisku stoi stado wielkości `herd` (losowe z przedziału). Legowisko odradza osobniki z tempem `br` (os./min), dopóki w jego pobliżu nie ma więcej niż `herd[1] + 1` zwierząt tego gatunku. Dzięki temu zwierzyna odnawia się po polowaniach, ale nie rośnie bez końca.

Legowisko, wokół którego wyrosło miasto, przenosi się na wolne pole 11–30 pól od Dworu, a jego zwierzęta wracają do nowego miejsca.

## Zabudowa i punkty spawnu {#zabudowa-fauna}

Zwierzęta unikają miasta. Każdy budynek i każdy plac budowy ma **strefę** o promieniu: połowa dłuższego boku + `buf` = {{v:Data.FAUNA_RULES.buf}} pola (`buildZones`). Zwierzę, które znajdzie się w strefie, ucieka od jej środka, tak jak przed obywatelami. Cele wędrówek i miejsca narodzin leżą poza strefami.

Wałęsające się zwierzęta i ptaki mają **punkty spawnu** (`state.fauna.spawns`: {k, x, y}, po jednym na grupę lub ptaka, wybierane przy zaludnieniu mapy). Brakujące osobniki odradzają się w punkcie spawnu swojego gatunku, który leży poza strefami zabudowy. Tempo to `respawn` = {{v:Data.FAUNA_RULES.respawn}} osobnika/min pomnożone przez brak populacji (1 − liczba/`n`); ułamkowe osobniki gromadzi licznik `state.fauna.sacc` ({gatunek: akumulator}). Zwierzyna łowna odradza się, jak dotąd, przy legowiskach.

## Polowanie z łukiem {#polowanie}

Chata myśliwego (budynek z `game: true`) ma łowisko — promień `radius` = {{v:Data.FAUNA_RULES.radius}} pól wokół obrysu. Gdy zebrane mięso (`b.huntAcc`) osiągnie `minMeat` = {{v:Data.FAUNA_RULES.minMeat}}, a myśliwy jest obsadzony, wybiera najbliższą zwierzynę łowną (sarny i inne o wadze ≥ 0,9 mają pierwszeństwo) i rusza ścieżką `Path`. Wyprawa jest opisana wyłącznie przez czas gry: `Fauna.poseOf(h, time)` zwraca pozycję i tryb myśliwego jako czystą funkcję czasu, bez zmiennych stanu między klatkami.

Myśliwy idzie do zasięgu łuku (`bow` = {{v:Data.FAUNA_RULES.bow}} pola od ofiary), celuje przez `aim` min, strzela (strzała leci `arrow` min), podchodzi i podnosi zwierzynę (`pick` min), po czym wraca z łupem z prędkością × 0,9.

{{diagram:polowanie}}

Upolowanie zmniejsza zwierzynę w łowisku i odejmuje od `huntAcc` mięso `meat × waga` gatunku ({{v:Data.FAUNA_RULES.meat}} × waga). Gdy nadwyżka mięsa przekroczy `owed`, kolejne upolowania są rozstrzygane bez wyprawy — myśliwy nie nadąża, ale zwierzyna i tak znika z łowiska. Padlina leży `carcass` min.

{{tabela:fauna_zasady}}

## Plon Chaty myśliwego {#plon}

Plon mięsa Chaty myśliwego zależy od zwierzyny w łowisku. `Fauna.gameMult(s, b)` = min(1; Σw / ref), gdzie Σw to suma wag żywej zwierzyny łownej w promieniu łowiska, a `ref` = {{v:Data.FAUNA_RULES.ref}} punktów daje pełny plon. Ekonomia mnoży produkcję tą wartością (`forestMult`), więc przetrzebione łowisko daje mniej mięsa, a przy wyłączonej faunie mnożnik wynosi 1.

> [!uwaga] Chata myśliwego **nie wymaga lasu** (brak wymogu `req`, rozdz. {{ref:zabudowa}}). Jej wydajność zależy od zwierzyny, a nie od drzew; flaga `forest` dotyczy tylko budynków Słowian.

Zwierzęta nie są surowcem w magazynie: mięso powstaje w ekonomii jak dotąd, a wyprawa tylko „wyjaśnia” ubytek zwierzyny w łowisku. To rozdzielenie pozwala testom bilansu pozostać bez zmian.

## Własny PRNG i determinizm {#prng}

Fauna ma własny generator mulberry32 w `state.fauna.rs` (liczba całkowita w JSON, zasiewana ziarnem mapy). Moduł **nie wywołuje globalnego `RNG`**, więc włączenie fauny nie zmienia strumienia losowości logiki (tabela „Kto używa losowości” w rozdz. {{ref:architektura}}). Stan `fauna` (`rs`, `nid`, `bt`, `dens`, `spawns`, `sacc`, `hunts`, `kills`) należy do snapshotu gry, a `null` oznacza, że fauna jest wyłączona.

## Wyłączenie i parametry adresu {#wylaczenie}

Przełącznik `state.settings.fauna` decyduje, czy moduł działa:

- w testach specyfikacji — `false` (scenariusze liczą się bez zwierząt i łowisk);
- w grze — `true`; parametr adresu `?fauna=0` wyłącza ją przy starcie (`UI.startGame` nie wywołuje `Fauna.enable`).

Przy wyłączonej faunie `Fauna.tick` nic nie robi, `stock` zwraca `null`, a `gameMult` daje 1.

## Test {#test}

Moduł sprawdza `tools/fauna.js`: zaludnienie mapy według klimatu, poprawność pozycji zwierząt, zero wywołań globalnego RNG wewnątrz `Fauna`, determinizm, snapshot i restore, parytet ekonomii z fauną i bez niej, przebieg faz wyprawy (strzała, ubytek, odradzanie) oraz koszt jednego ticku. Dodatkowo sprawdza:

- **unikanie zabudowy** — zwierzęta stojące tuż przy ścianie budynku stanowią mniej niż 2% próbek;
- **punkty spawnu** — istnieją i mają poprawne położenie legowisk;
- **odradzanie po wyłapaniu** — po 400 minutach wraca co najmniej 70% gatunków, a każdy odrodzony gatunek ma punkt spawnu;
- **jedna Chata** — po 150 minutach średni `gameMult` ≥ 0,60 (zwierzyny jest mniej, plon waha się z położeniem legowisk).

Limit kosztu ticku w teście to 0,6 ms, a cel 0,3 ms (rozdz. {{ref:testy}}).

> [!pulapka] Zmiana `FAUNA_RULES` albo katalogu gatunków zmienia wyniki testów parytetu. Po zmianie należy uruchomić `node tools/fauna.js` i przebudować dokumentację, bo tabele z tego rozdziału są generowane z kodu.
