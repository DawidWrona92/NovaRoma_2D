# Plan prac — Nova Roma

> Plik czytelny „od góry do dołu”: najpierw **gdzie jesteśmy**, potem **co robimy teraz**, **co dalej** i **co czeka na decyzję**. Szczegóły historyczne są na końcu. Kopia: `/root/.claude/plans/rippling-sparking-babbage.md`. Dokumentacja gry: `docs/Nova_Roma_dokumentacja.pdf` (z `docs/chapters/*.md`, budowana `node docs/build.js`).

## 00. Kolejka od użytkownika (po Fazach 9E i 9F — ✔) — punkty 10–17, każdy osobno

**Zasady wykonania (decyzja użytkownika):** punkty są **kolejnymi numerami (10, 11, …), nie podpunktami**; wykonuję **po kolei, po każdym: testy krótkie, commit + push, opublikowanie artefaktu (https://claude.ai/artifact/KqRh8cYnMbqEnTdCYN85kd), krótki raport i STOP do zgody „kontynuuj”** (użytkownik testuje w tym czasie). Pętle zawodów nie rozwijamy głębiej (Twierdza to inspiracja, nie wzorzec do kopiowania). Dotychczasowe „Faza 10 — integracja i dostawa” i „Faza 11 — audyt wizualny” przechodzą na **punkty 17 i 18** (po funkcjach), bo numery 10–14 zajmują nowe zadania.

| Pkt | Zadanie | Zakres i podejście |
|---|---|---|
| **10 ✔** | **Praca na zewnątrz i w budynku** | Dwie klasy ról w `Data.ROLES` (pole `where: 'out' \| 'in'`). **Na zewnątrz** (większość: Tartak, drwal, leśnik, kamieniołom, kopalnie, pola, sad, mleczarnia, rybak, wodonosz, spalarnia węgla, zbieracze…) — robotnik pracuje przy budynku na stałym stanowisku obok, nie w drzwiach (np. Tartak: kozioł do piłowania obok chaty). **W budynku** (piekarnia, młyn, kuźnia, zbrojownia, huta, tkalnia, garncarnia, miodosytnia, winiarnia, woskarnia, garbarnia, kasza, kadzidło, łaźnie, świątynia) — robotnik idzie do drzwi, **wchodzi (znika)**, a w czasie pracy w oknach budynku **świecą światła** (nakładka okien w rysowaniu `kind:'b'`, bez pełnych animacji), po cyklu wychodzi z towarem. Zmiany: `Workers.cycleOf` (krok `enter`/`exit`), `Game.render` (światła okien wg stanu pracy), `Workers.describe`, test `chain.js`/`workers.js`, tabela ról (rozdz. 12) z kolumną „gdzie”. **TODO (poza zakresem):** pełne animacje pracy wewnątrz budynku (jak w Twierdzy). |
| **11 ✔** | **Cele misji i informacja zwrotna** | Dziś gra **nie ma żadnych warunków końca**. Dodać: (1) **ekran celu** przy starcie misji (cel: „przetrwaj N terminów haraczu seniora”, co to haracz, jaki łańcuch budowy, terminy); (2) **komunikat po każdym terminie** (sukces/porażka, bilans `met/missed`, co dalej) — z `Tribute.tick` (hook po `t.terms++`), toast + wpis w panelu Doradcy; (3) **warunki końca**: zwycięstwo po spełnieniu N terminów (N zależne od trudności: np. 8), porażka po **3 niespełnionych terminach z rzędu** lub wymarciu osady; (4) **ekran podsumowania** (zwycięstwo/porażka, statystyki z `s.stats`, czas, ludność, budynki, haracz) z przyciskami „Wróć do menu” / „Kontynuuj budowanie” (po wygranej wolna gra). Nowy moduł `Mission` (stan `s.mission`), testy headless (`tools/mission.js`: wygrana, porażka, terminy) i przeglądarkowy; flagi `settings.mission` (testy spec 58 scenariuszy bez zmian). |
| **12 ✔** | **Tryb „Wolne budowanie”** | Wpis w menu głównym (obok Kampania/Piaskownica): jak misja, **bez haraczu i bez celów** (`tribute: off`, `mission: off`), bez napadów i kryzysów domyślnie, wybór nacji/klimatu/mapy/rozmiaru jak w Piaskownicy; w HUD brak haraczu. Najprościej: preset startu w `UI.startGame`/`Menu` ustawiający `settings.mission=false`, `tribute off`, `raids=false`; krótki opis w menu. Test `browser_menu.js` + `mission.js`. |
| **13 ✔** | **Mury obronne** | Nowe narzędzie budowy „Mur” w zakładce **Drogi** (lub nowej „Obrona”) jak wytyczanie dróg (`Roads.lay`-podobne `Walls.lay`): segment 1×1 pole ciągły, koszt w kamieniu/deskach per pole (Frankowie kamień, Saraceni glina, Wikingowie/Słowianie drewno-palisada), budowniczowie stawiają po kolei jako place; **wygląd** — nowe sprite'y murów w `prototyp/src` (segmenty N–S/E–W, rogi, końcówki; 4 nacje) generowane silnikiem sprite'ów, wypiek jak budynki; **blokują ruch** (A* i `Terrain.passable`, `occup`), więc walidacja: nie wolno zamurować budynków/Dworu (test osiągalności `Terrain.ringReachable`); burzenie muru. Tylko wygląd i bariera ruchu (bez wartości militarnej). **Zrobione:** zakładka **Mury** (Mur / Rozbierz mur, dwa kliknięcia, linia prosta lub „L”), `Walls` + `tile.wall` (nieprzechodnie dla A*, ludzi i zwierząt), koszt 1 surowca/pole wg nacji (Frankowie kamień, Saraceni glina, Wikingowie i Słowianie deski), walidacja „nie odcina budynku od Dworu”, mur stawiany od razu (bez budowniczych — decyzja uproszczenia); sprite'y: 16 wariantów sąsiedztwa na nację w `prototyp/src/56_walls.js` — Frankowie i Saraceni jak ich zamki (kamień, blanki, wieżyczki), Wikingowie i Słowianie palisada (uwaga użytkownika); testy `tools/walls.js` (72), `tools/browser_walls.js` (14). |
| **14 ✔** | **Bramy** | Brama = pole `tile.wall` 2/3 (przechodnie), 1 pole, zawsze otwarta, jedno kliknięcie (na murze, wolnym polu lub drodze), oś z sąsiadów, koszt wyższy niż mur (Frankowie 4 kamienia + 2 deski, Saraceni 4 gliny + 2 deski, Wikingowie i Słowianie 5 desek); pierścień muru z bramą dozwolony, teren zamknięty bez bramy — odmowa budowy (`Walls.ringOpen`); droga przez bramę; sprite'y `gate`/`gate@1` w 4 nacjach (baszty / słupy z belką); testy `walls.js` (144), `browser_walls.js` (18). |
| 15 | **Odpoczynek przed domem** | Animacja „siedzi na krześle i odpoczywa” (sugestywna relaksacja: odchylony, kołysanie, rozciąganie, popijanie) w kroku `rest` pętli pracy i dla wolnych mieszkańców przed domem; **bez krzeseł w sprite'ach budynków** — krzesło rysowane jako rekwizyt pod postacią (pojawia się znikąd na czas odpoczynku). |
| 16 | **Muzyka** | Nowy punkt od użytkownika: **3–4-minutowe utwory pod każdy klimat**, spokojne, do spokojnej rozgrywki. **Saraceni** — w stylu muzyki z Twierdzy Krzyżowiec, **Frankowie** — w stylu Twierdzy, **Słowianie i Wikingowie** — bardziej folkowo, powoli i niskobrzmiąco, uspokajająco. Technika do ustalenia przed startem (generowanie proceduralne w WebAudio kontra gotowe pliki audio), przełącznik głośności/wyciszenia w menu, odtwarzanie w pętli po zmianie nacji. |
| 17 | Integracja i dostawa (dawna Faza 10) | legenda UI, spójność Doradcy, wzorzec `baseline6`, duże testy, ZIP, opis PR, `?classic=1` |
| 18 | Audyt wizualny (dawna Faza 11) | lista poprawek sprite'ów i ekranów |

**Lista TODO (zapisana, nie planowana teraz):** pełne animacje pracy w środku budynków (kowal przy kowadle, piekarz przy piecu — jak w Twierdzy); głębsze pętle zawodów (dojrzewanie krów, sekcje upraw, stosy kamienia z wozem); obrót wszystkich budynków w 4 kierunkach (9C-4); osobny Spichlerz na żywność; wydeptywane ścieżki; punkty pracy drwala ustawiane przez gracza.

**Weryfikacja każdego punktu:** krótkie testy headless (`scenarios` 58/58, `workers`, `chain`, nowy test punktu), testy przeglądarkowe dotyczące zmiany (`browser_ui`, `browser_play`, `browser_mobile*`, `browser_menu`), zrzut ekranu, PDF/dokumentacja (rozdz. 12/14/16/17, PLAN), `git push`, publikacja artefaktu, STOP.

## 1. Gdzie jesteśmy

Gra to jeden plik `Nova_Roma.html` (JavaScript, canvas 2D, 4 nacje: Frankowie, Saraceni, Wikingowie, Słowianie). Gotowe: ekonomia ze specyfikacji v3.6 (58 scenariuszy), teren v2 (4 klimaty × 6 typów map), ścieżki i drogi, zabudowa z przerwą, fauna z polowaniem, menu RTS z Piaskownicą, ludzie wykonujący pracę, fizyczna logistyka i kosmetyczne karawany. Dokumentacja PDF: 95 stron, brakuje rozdz. 18 i aneksu A oraz zrzutów ekranu.

**Repozytorium:** tylko `/home/user/novaroma_2d`, gałąź `claude/festive-meitner-ejo4l1`, szkic PR #1 → `main` (aktualizujemy pushem, nie tworzymy nowych PR, nie scalamy). Commity po polsku ze stopkami Claude; push z ponawianiem 2/4/8/16 s.

## 2. Teraz w toku

**Faza 9C — obrót budynków, Przystań i Okręt na wodzie** (zamówienie użytkownika po uwadze kolegi: port budował się jak zwykły budynek, pomostem w stronę lądu).

| Etap | Zakres | Stan |
|---|---|---|
| 9C-1 | warianty grafiki Przystani i Okrętu w 4 kierunkach (`vikings_dock@1…3`, `vikings_ship@1…3`), katalog i `SPRITE_META` z wariantami | ✔ |
| 9C-2 | logika: `rot` w budynku i placu, strefy ląd/woda (`Data.zonesOf`), Przystań = szopa na lądzie + molo na wodzie morza, Okręt = tylko woda przy molo, wejście od strony lądu, Okręt płynie w stronę dziobu | ✔ (`tools/rotation.js` 44/44, scenariusze 58/58, bramka bilansu Wikingów 82% / 94%) |
| 9C-3 | sterowanie: klawisz R / przycisk ⟳ (także telefon), auto-obrót pod kursorem, podświetlenie wody; bot wybiera kierunek (100 map nadmorskich bez niepowodzeń) | ✔ |
| 9C-docs | rozdziały 11, 14, 15, 16, 17, C, D, tabele stanu, README testów | ✔ |
| 9C-4 | **obracanie pozostałych ~80 budynków w 4 kierunkach** (decyzja użytkownika: wszystkie w 4 kierunkach). Wymaga dorysowania tylnych ścian (północnej i zachodniej) w silniku sprite'ów, bo dziś modelowane są tylko ściany S i E; dekoracje „na ścianie” (tarcze, szyldy, liny) trzeba oznaczyć ścianą. Plan: najpierw wspólny mechanizm obrotu brył w `prototyp/src` (rzut z obrotem + widoczność ścian), potem nacja po nacji z kontrolą wizualną; wejście budynku wybiera gracz (drogi, ścieżki) | ○ osobny duży etap |

**Faza 9D — większe mapy, druga wioska, składy wyspecjalizowane** (zamówienie użytkownika po uwagach kolegów: zabudowa zajmuje całą mapę, budynki stoją „wokół kopalń”; chcą drugiej wioski i magazynów tylko dla kopalń w górach i dla lasów przy oddalonych kopalniach).

| Etap | Zakres | Stan |
|---|---|---|
| 9D-1 | **rozmiar mapy do wyboru w Piaskownicy**: Mała 48, Średnia 72 (domyślna), Duża 96; skalowanie K = N/48 (cechy i drzewa ×K², odległości ×K, złoża ×K), fauna i kamera z rozmiaru; testy i 58 scenariuszy zostają na 48 (bit-w-bit jak dotąd); `tools/mapsize.js` 360 sprawdzeń | ✔ |
| 9D-2 | **Osada** (druga wioska, 4 nacje, grafika 4×3): miejsca dwóch Chat, +40 szt. każdego towaru, punkt zbiorczy z bonusem 3 pól, baza budowniczych; stawiana tylko ≥ 12·K pól od Dworu i ≥ 10·K od innej Osady, limit N/24 − 1 (48: 1, 72: 2, 96: 3); koszt np. Frankowie 14 desek + 6 kamienia + 100 zł | ✔ |
| 9D-3 | **Składy wyspecjalizowane**: górniczy (ruda, węgiel, kamień, glina, sztabki) i drzewny (pień, deski) — +100 szt. tylko swoich towarów, obsługują producenta, którego wszystkie towary przyjmują; logistyka liczy najbliższy pasujący węzeł (`via`), mapa ciepła i Doradca podpowiadają właściwy węzeł; `tools/hubs.js` 112 sprawdzeń | ✔ |
| 9D-docs | rozdz. 10, 12, 14, 15, 16, 17, 06, aneks E, README testów | ◐ agenci dokumentacji w toku |

**Faza 9E — uwagi z gry kolegów** (zgłaszane na bieżąco): ✔ robotnik Tartaku pracuje przy niepełnym wejściu (Doradca: „Za mało wejścia … N%”); ✔ Leśnik sadzi na polach, gdzie rosną drzewa (ręka pusta, powrót po sadzonkę, rosnące drzewko); ✔ złoża kamienia odróżnialne od skał + podświetlenie pól złóż przy wyborze kopalni; ✔ karta postaci z przyciskiem „Idź do budynku”; ✔ opis Targu (karta, menu, Doradca); ✔ **oczyszczanie terenu** — budowa na drzewach i bagnie (0,6 min / drzewo, 2 min / pole bagna; rzeki, klify, złoża blokują). Testy: `chain.js`, `clearing.js`, `browser_figure.js`.

Do sprawdzenia przy dużych testach: wydajność 96×96 na telefonie (pomiar tylko w Chromium: start 4,4 s, tick 0,17 ms), bilans botów na mapach 72/96 (wzorzec `baseline6`).

Wcześniej w tej serii (✔): kopalnie tylko w górach (masyw), zwierzęta unikają miasta i odradzają się w punktach spawnu, karawana kosmetyczna, `L_ref` 5, gra jako artefakt (https://claude.ai/artifact/KqRh8cYnMbqEnTdCYN85kd), ekran diagnostyczny startu.

Na koniec (duże testy, wg ustaleń): pełna regresja `regress.sh`, bramka `physical.js --full`, scenariusze ekonomii, nowy wzorzec `baseline6`.

## 3. Kolejka (po zmianach 1–3 i Fazie 9D)

1. **Zamknięcie 9B-5:** wzorzec regresji `baseline6` (do Fazy 10 w scratchpadzie, potem `tools/baseline/` + `tools/regress.sh` w repo), PDF, WIP.
2. **Dokumentacja do v1.0:** rozdz. 18 (spec a implementacja) i aneks A (wyniki symulatora ze specyfikacji) — wymagają treści specyfikacji; zrzuty ekranu (`docs/img`, `docs/shots.js`); przegląd wizualny wszystkich stron PDF; wpis w rozdz. 17 o każdej decyzji.
3. **Faza 10 — integracja i dostawa:** legenda UI (teren, woda, drogi, zwierzyna), spójność Doradcy (wyrównanie, brak dojścia, przetrzebiona zwierzyna), regresja w repo, raport FPS i czasu wypieku, ZIP + `Nova_Roma.html` + `grafika_prototyp.html` + PDF, opis PR #1, pytanie o `?classic=1`.
4. **Faza 11 — audyt wizualny** (lista poprawek w sekcji 7).

## 4. Decyzje

**Podjęte przez użytkownika (wiążące):**
- przerwa między budynkami = 1 pole; strefa wydłużonego czasu budowy = pola w odległości 2–3 (+10% za sąsiada, maks. +40%), widoczna przed wyborem miejsca;
- drogi przyspieszają ruch ×1,6, A\* je preferuje; wzgórza do wyrównania nie utrudniają startu;
- Chata myśliwego nie wymaga lasu; menu główne RTS z Piaskownicą; tryb pracy „auto” (bez dopytywania, commit + push + WIP po fazie);
- **Faza 9B:** ludzie naprawdę pracują (drwal, cieśla, budowniczowie, karawana), drogi ważniejsze, magazyn centralny = Dwór, bez zepsucia balansu;
- **karawana Saracenów kosmetyczna** (złoto od razu, jak w Twierdzy); **odległość boli mocniej** (`RULES.cycle.ref` 8 → 5), bramka bilansu ≥ 75% wyniku bazowego i ≥ 85% dawnej krzywej (osiągnięte: 79% / 91%); bot N tylko informacyjnie (kruchy);
- **rozmiar mapy do wyboru (48/72/96) i druga wioska: Osada + Składy wyspecjalizowane (górniczy, drzewny)** zamiast jednego dużego Składu; Dwór nadal jest magazynem centralnym;
- **kopalnie tylko w górach, masyw na każdej mapie**; **Przystań (szopa na lądzie, molo na wodzie) i Okręt (na wodzie przy molo) z obrotem; wszystkie budynki docelowo w 4 kierunkach**; zwierzęta unikają miasta, są rzadsze i odradzają się w legowiskach;
- dziennik pracy agentów w `docs/DZIENNIK_AGENTOW.md`.

**Otwarte (czekają na użytkownika):**
1. Czy zostawić styl klasyczny `?classic=1` po Fazie 10.
2. Pomysły na później (nie planowane): wydeptywane ścieżki, osobny Spichlerz na żywność, punkty pracy drwala ustawiane przez gracza, promień pracy drwala.
3. Kopalnia darniowa Wikingów i glinianka Saracenów zostają w swoich biomach (nie w górach) — potwierdzić.
4. Środowisko blokuje WebFetch do wielu domen (poradniki gier) — czy potrzebny inny dostęp.

## 5. Zasady pracy

- Rozwój ma jedno wejście do gry (`UI.startGame`); globalny `RNG` jest nietknięty (własne PRNG, wizualne „cienie symulacji”); bloków `Sprites` i `SPRITE_META` nie edytujemy ręcznie (`node prototyp/build.js && node prototyp/build_game.js`).
- Nowe mechaniki stoją za przełącznikami `settings.*`, wyłączonymi w testach specyfikacji (raids, voyageGuard, shoreSpots, logistics, fauna, workers, physical).
- **Podział ról:** rodzic = architektura, niejednoznaczne wymagania, głębokie debugowanie, integracja i walidacja. Agenci Haiku (`.claude/agents/`): `haiku-tester` (uruchamia testy), `haiku-documentation` (rozdziały po zmianie kodu), `haiku-researcher` (badania tylko do odczytu), `haiku-plan-updater` (porządkowanie planu), `haiku-worker`/`haiku-worker-b` (drobne zmiany). Rodzic zawsze sprawdza wynik; wpis do dziennika agentów.
- Kod wyjścia testów czytamy bez `| tail` (maskuje porażkę).

**Bramka każdej fazy:** (1) testy headless: `scenarios` (58/58), `normal`, `mapstats`, `raids`, `store`, `fauna`, `terrain`, `path`, `walkers`, `roads`, `spacing`, `leveling`, `logistics`, `footprints`, `workers`, `physical`, `minimap`; (2) testy przeglądarkowe: `browser_ui`, `browser_play`, `browser_menu`, `browser_mobile`, `browser_sprites`, `browser_terrain`, `browser_fauna`, `browser_workers`; (3) zrzuty i krótki przegląd; (4) dokumentacja (aneks D, `node docs/build.js`, wpis w rozdz. 17); (5) nowy wzorzec regresji; (6) commit + push + opis PR; (7) WIP gry dla użytkownika (`SendUserFile`) + raport po polsku; (8) odhaczenie w tym planie.

## 6. Dokumentacja PDF — stan rozdziałów

Generator: `node docs/build.js` (`--check`, `--html`), tabele i wykresy liczone z kodu (`docs/tables.js`, `diagrams.js`), wyniki testów `docs/collect.js`.

| Rozdziały | Stan |
|---|---|
| 1–17, B, C, D, E | ✔ napisane (11, 13, 15 uzupełnione z kodu; E = analiza i wyniki Fazy 9B) |
| 18 Spec a implementacja, A Wyniki symulatora | ○ zalążki — wymagają treści specyfikacji |
| Zrzuty ekranu, diagramy | ○ |

Definicja „gotowe” (v1.0): brak zalążków, `--check` bez uwag, przegląd wizualny stron, zrzuty (HUD, tryb budowy, klimaty, fauna), wpis o każdej decyzji.

## 7. Faza 11 — lista poprawek wizualnych (po powstaniu produktu)

Zasada: każda zmiana sprawdzana od razu, pełny audyt na końcu.
- **Frankowie (sprite'y):** barracks — drzwi hali zasłonięte skrzydłem (`S.door.at 0.5→0.2`, `S.win.n 2→1`); keep — usunąć drzwi donżonu od S, okno z witrażem przesunąć (ścięte przez wieżę SE); temple — gzyms `lv*0.46→lv*0.55`; hut — usunąć szyld piekarza i okno w szczycie, `S.win.n 2→1`; store — `nuS2:4→3`, brama `h 0.44→0.36`; forester — przerwa w płocie przy drzwiach; dairy — usunąć osamotniony płotek; orchard — kosze na `(0.5, 0.55)`; watercarrier — beczki od drzwi; mill — skrzydła `L 150f→125f`; armory — baner/tarcze/łuk drzwi; winery — prasa (bez „krzyża”), beczki od drzwi; bakery — słup pod oknem; hunter — usunąć `deco1`.
- **Saraceni, Wikingowie, Słowianie:** audyt arkuszy `prototyp/podglad/`, weryfikacja pikseli, poprawki realnych defektów.
- **Ekrany gry:** klimaty × typy map, menu, zwierzęta, nowy masyw górski; plamy bagien w śniegu wyglądają „klockowo”; spójność sprite'ów z terenem; grafika robotników, narzędzi, ładunków, wielbłądów i okrętów.
- Po poprawkach: `node prototyp/build.js`, `node katalog.js`, `node prototyp/build_game.js --check`, `sh prototyp/podglady.sh`, ponowna dostawa.

## 8. Ryzyka

- **Limit tokenów / przerwanie sesji:** małe bramki, commit + push po każdej; plan i dokumentacja są w repo.
- **Determinizm spec:** nowe mechaniki za przełącznikami, własne PRNG (fauna, masyw), zero wywołań globalnego `RNG`.
- **Mapa Franków a bilans:** kopalnie w masywie leżą 11–30 pól od Dworu — sprawdzić bramkę `physical.js` i scenariusze Franków (F1–F6).
- **Wydajność:** ≤ ~100 zwierząt, `Fauna.tick` ≤ 0,25 ms, FPS z fauną ≥ 85% FPS bez niej.
- **Środowisko testów:** `regress.sh` wymaga `bash` (nie `sh`); testy przeglądarkowe przez `?menu=0` lub `?play=`.
- **Dokumentacja a kod:** liczby z kodu przy budowie PDF; zmiany zasad wymagają poprawy tekstu.

## 9. Historia faz (skrót)

| Faza | Efekt | Commit |
|---|---|---|
| Etapy 1–6 | ekonomia wg spec. v3.6, Słowianie, Doradca, boty R/D/N | `361cd3d`…`a2ad568` |
| Prototyp grafiki, 0–4 | 88 budynków 4 nacji, silnik sprite'ów, obrysy `w×h` | `d04fcc4`…`fd38ee8` |
| 5 | teren v2 | `7e6d575`, `c4beb2a` |
| 6, 6b, 6c, 7 | A\*, drogi, zabudowa, logistyka, wyrównywanie | `b8b4cb7`…`b5ea3af` |
| 8 | fauna i polowanie z łukiem | `ee1271d` |
| 9 | menu RTS, Piaskownica | `cf37876` |
| 9B-0…9B-4 | tempo 12 s/min, role i czynności, fizyczna logistyka, karawany | `c2f1c36`…`3115d69` |
| 9B-5 (część) | karawana kosmetyczna, `ref` 5, histereza robotników, bramka 75% | `ce00013` |
| Dokumentacja | generator PDF, rozdziały, dziennik agentów | `ee4eaea`…`67ce580` |
