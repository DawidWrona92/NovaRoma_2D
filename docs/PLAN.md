# Plan prac — Nova Roma (stan po Fazie 9B-4; 9B-5 wstrzymane; PAUZA — patrz „Kolejność dalej”)

> Ten plik jest kopią planu roboczego i leży w repozytorium, żeby przetrwał restart środowiska. Po każdej bramce faz aktualizujemy tabelę stanu i listy „do zrobienia”. Dokumentacja opisująca grę: `docs/Nova_Roma_dokumentacja.pdf` (budowana z `docs/chapters/*.md`).

## Kontekst i zasady

Gra to jeden plik `Nova_Roma.html` (JavaScript, canvas 2D, 4 nacje: Frankowie, Saraceni, Wikingowie, Słowianie). Celem jest produkt w stylu RTS lat 90./2000.: teren w 4 klimatach × 6 typach map, ruch po ścieżkach i drogach, sensowna zabudowa, fauna z polowaniem, menu główne z Piaskownicą — **bez regresji ekonomii** (58 scenariuszy ze specyfikacji v3.6).

**Repozytorium (decyzja użytkownika):** pracujemy wyłącznie w `/home/user/novaroma_2d` (https://github.com/DawidWrona92/NovaRoma_2D, origin: `…/novaroma_2d`), gałąź `claude/festive-meitner-ejo4l1`, szkic PR #1 do `main` (aktualizujemy pushem; **nie** tworzymy nowych PR i nie scalamy bez akceptacji). Stopki commitów: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` i `Claude-Session: https://claude.ai/code/session_015jPNpH2st24W1stsX5s45J`. Push przy błędzie 500 powtarzamy z opóźnieniem 2/4/8/16 s.

**Decyzje użytkownika (wiążące):** przerwa między budynkami = 1 pole (twardy zakaz); strefa wydłużonego czasu budowy = pola w odległości 2 i 3 od budynku (+10% za sąsiada, maks. +40%), widoczna przed wyborem miejsca; drogi przyspieszają ruch i A\* je preferuje; wzgórza do wyrównania mają własną grafikę i nie utrudniają startu (obszar startowy ≤ 13,5 pola od Dworu jest płaski); tryb pracy „auto” — działamy bez dopytywania; **Chata myśliwego nie wymaga lasu** (poluje na zwierzęta; plon zależy od zwierzyny w łowisku — zmiana wprowadzona po Fazie 8, boty nadal stawiają ją przy lesie, więc testy są bez zmian); **po Fazie 9, a przed 10 i 11: Faza 9B — ożywienie ludzi** (patrz niżej).

**Zasady pracy:** każdą zmianę sprawdzamy od razu (test + zrzut); pełny audyt wizualny dopiero w Fazie 11; globalny strumień `RNG` nietknięty (własne PRNG, wizualne „cienie symulacji”); jedno wejście do gry (`UI.startGame`); bloków `Sprites` i `SPRITE_META` nie edytujemy ręcznie (`node prototyp/build.js && node prototyp/build_game.js`); po każdej bramce commit + push + wersja WIP dla użytkownika (`SendUserFile`, kopia w scratchpadzie).

## Stan faz

| Faza | Zakres | Stan |
|---|---|---|
| Etapy 1–6 | ekonomia wg spec. v3.6, Słowianie, Doradca, statusy, boty R/D/N, scenariusze | ✔ |
| Prototyp grafiki | 88 budynków, ludzie, przyroda (proceduralnie) | ✔ |
| 0–3 | wzorzec testów, głowy Wikingów, Słowianie bez głów, silnik sprite'ów w grze | ✔ |
| 4 | obrysy w×h, render sprite'ami, Dwór 4×4 | ✔ |
| 5 | teren v2: 4 klimaty × 6 typów, podłoże w chunkach | ✔ |
| 6, 6b, 6c | A\* i piesi, drogi, przerwa i kara za ciasną zabudowę, logistyka | ✔ |
| 7 | wyrównywanie terenu, wzgórza decyzyjne | ✔ |
| bramka 6–7 | poprawki `pad`/brzeg, `browser_ui`, baseline v4 | ✔ |
| 8 (8a–8d) | fauna (18 gatunków) i polowanie z łukiem, baseline v5 | ✔ (commit `ee1271d`) |
| **Dokumentacja PDF** | generator + rozdziały + zrzuty (zadanie przekrojowe, niżej) | ◐ w toku (ostatnio `9c5fd7e`; zalążki: 11, 13, 15, 18, A) |
| 9 | menu RTS i Piaskownica (9a ekrany → 9b ☰ Menu → 9c testy) | ✔ (menu główne, Piaskownica z podglądem `Minimap`, ☰ Menu, `browser_menu.js`, `minimap.js`) |
| **9B** | **ożywienie ludzi: fizyczna logistyka, role i czynności, karawany, drogi/magazyn** (analiza i projekt gotowe: aneks E dokumentacji) | ◐ 9B-0…9B-4 ✔; 9B-5 ◐ wstrzymane (pauza; otwarty problem `tools/workers.js`, patrz Ryzyka) |
| 10 | integracja: legenda UI, spójność Doradcy, regress w repo, dostawa | ○ (wstrzymane) |
| 11 | audyt wizualny całości i poprawki | ○ (wstrzymane) |

## Dokumentacja PDF (zadanie przekrojowe)

**Cel:** jeden wspólny PDF opisujący całą logikę, zasady, zależności i decyzje projektowe (kod + dokumenty „Ekonomia — wersja finalna” i „specyfikacja ekonomii v3.6” + decyzje z prac). Leży w repozytorium i **jest aktualizowany po każdym etapie**.

**Narzędzia (gotowe):** `node docs/build.js` (PDF; `--html`, `--check`), `docs/tables.js` i `diagrams.js` (tabele, wykresy i diagramy liczone z kodu przez `tools/headless.js`), `docs/collect.js` (wyniki testów do `docs/data/wyniki_testow.json`), `docs/meta.json` (wersja i stan na okładce). Procedura aktualizacji: aneks D dokumentacji.

**Stan rozdziałów:**

| Rozdział | Stan |
|---|---|
| 1 Wprowadzenie, 2 Architektura, 3 Ekonomia, 4 Ludność, 5 Budowa, 6 Katalog budynków, 7 Nacje, 8 Haracz, 9 Zdarzenia, 10 Teren, 12 Ruch/drogi/logistyka | ✔ napisane |
| B Wyniki botów i scenariuszy, C Repozytorium i polecenia, D Procedura aktualizacji, **E Fizyczna logistyka (analiza i projekt Fazy 9B)** | ✔ napisane |
| 14 Interfejs, menu i Doradca, 16 Testy (+ trudność i krzywa nauki), 17 Decyzje i historia | ✔ napisane (po Fazie 9) |
| 11 Zasady zabudowy, 13 Fauna, 15 Grafika | ◐ zalążki — uzupełnia inny agent (w toku, zlecenie rodzica) |
| 18 Spec a implementacja, A Wyniki symulatora ze specyfikacji | ○ zalążki — wymagają treści specyfikacji |
| zrzuty ekranu (`docs/img`, skrypt `docs/shots.js`) i diagramy | ○ |

**Definicja „gotowe” (v1.0 dokumentacji):** wszystkie rozdziały bez zalążków, `node docs/build.js --check` bez problemów, przegląd wizualny wszystkich stron, zrzuty (HUD, tryb budowy ze strefami, klimaty, fauna), wpis w rozdz. 17 o każdej decyzji z tego planu i różnice spec/kod w rozdz. 18.

## Bramka każdej fazy (lista kontrolna)

1. Testy modułu nowej fazy + regresja headless: `scenarios` (58/58 identycznie z wzorcem), `normal`, `mapstats`, `raids`, `store`, `fauna`, `terrain`, `path`, `walkers`, `roads`, `spacing`, `leveling`, `logistics`, `footprints`.
2. Testy przeglądarkowe: `browser_ui`, `browser_play`, `browser_mobile`, `browser_terrain`, `browser_fauna`, `browser_sprites` (po Fazie 9 także `browser_menu`).
3. Zrzuty i krótki przegląd wizualny zmienianych ekranów.
4. **Aktualizacja dokumentacji** (aneks D: mapa zmian → rozdziały; `node docs/build.js`; `node docs/collect.js` gdy zmieniły się wyniki; wpis w rozdz. 17).
5. Nowy wzorzec regresji (do Fazy 10 w scratchpadzie `baselineN_*`, potem w repo `tools/baseline/`).
6. Commit (stopki) + push (z ponawianiem) + aktualizacja opisu PR #1 po większych etapach.
7. Wersja WIP gry (`Nova_Roma_stan_po_fazieN.html`) wysłana użytkownikowi do przeklikania + krótki raport po polsku.
8. Odhaczenie fazy w tym planie.

## Faza 9 — menu główne RTS i Piaskownica (✔ zrealizowana)

**Założenia (z badania kodu):** dziś ekran startowy to `#factionPick` (karty z `UI.buildFactionCards`; kliknięcie = `startGame(fid)`), a `UI.startGame(fid, opts)` jest jednorazowe (`gameStarted`) i jest jedyną ścieżką startu (używa jej także `?play=`); `localStorage` nie jest nigdzie używany (potrzebne `typeof` + `try/catch`); nie ma minimapy ani podglądu; `MapGen.generate` działa bez gry (10–25 ms) i zwraca `meta.stats`; z-index: `#factionPick` 50, `#loading` 55, panel botów 60 → menu przed grą 52–54, nakładka w grze 70.

- **9a — ekrany.** Znaczniki `#mainMenu`, `#sandbox` (z 52) i `#pauseMenu` (z 70); `#factionPick` zostaje jako tryb `?menu=0` (testy). Start strony: poprawne `?play=` → gra jak dziś; `?menu=0` → stary wybór nacji; inaczej menu. **Menu:** logo, panorama (JPEG ~150 KB z `tools/menu_bg.js`, zapas: gradient CSS), lista: Kampania · Potyczka · **Piaskownica (aktywna)** · Wieloosobowa · Samouczek · Edytor map · Ustawienia · Twórcy · Wyjście — poza Piaskownicą nieaktywne z podpowiedzią „Wkrótce”; ↑↓/Enter/Esc, dotyk, układ pionowy na telefonie. **Piaskownica:** nacja (refaktor `buildFactionCards(container, onPick)`), klimat (4 kafle), typ mapy (6 kafli z `Data.mapTypeName`; **Wikingowie zablokowani na „Nadmorska”**), podgląd z nowego czystego modułu `Minimap` (`describe(meta)`, `summary(map)`, `draw(canvas, map)`; ponowne losowanie gdy `!meta.valid`), pole ziarna + „Losuj mapę”, Start → `UI.startGame(fid, {climate, type, seed})`, Wstecz; wybór pamiętany w `localStorage`.
- **9b — ☰ Menu w grze.** `#btnMenu` jako pierwsze dziecko `#hud` (także na telefonie); nakładka z 70: Wznów · Nowa mapa (ta sama nacja/klimat/typ, nowe ziarno) · Opcje (szare) · Menu główne; pauza przez `speed = 0` z przywróceniem (synchronizacja etykiety `#btnSpeed`); priorytet Esc (zamknij menu → anuluj budowę → otwórz menu); „Nowa mapa” i „Menu główne” przez nawigację (`location.href`), co omija pułapki ponownego wejścia (`gameStarted`, `lastPanel`, `activeCat`, `speed`, `hud.open`); opis mapy w `#hudFaction` i Doradcy.
- **9c — testy.** `?menu=0` w `goto` testów `browser_ui/play/mobile`; nowy `tools/browser_menu.js` (tylko Piaskownica aktywna; przepływ nacja → klimat → typ → Start dla każdej nacji; `World.state().map.meta` = meta podglądu; blokada Wikingów; pamięć wyboru; telefon; Esc i ☰ Menu; 0 błędów JS); `Minimap` w `headless.js` (kod ładowany przy starcie tylko z atrap DOM).
- **Dokumentacja:** rozdz. 14 (menu i ekrany), 1 (parametry adresu `?menu=0`), 16 (nowe testy), 17 (decyzje).

## Faza 9B — ożywienie ludzi (fizyczna logistyka)

**Zamówienie użytkownika:** ludzie mają naprawdę wykonywać zadania (drwal ścina konkretne drzewo i niesie pień, cieśla niesie pień do tartaku i piłuje, budowniczy dochodzi na plac i dopiero wtedy buduje, karawana idzie na koniec mapy i wraca), drogi mają być ważniejsze (inspiracja: Knights and Merchants, centralny magazyn), **bez zepsucia bilansu**. Analiza wykonalności, pomiary, model i ryzyka: **aneks E dokumentacji** (`docs/chapters/E_fizyczna_logistyka.md`), zarys mechanizmów: rozdz. 12.

**Wnioski analizy (skrót):** (1) wykonalne, jeśli czas gry zwolni do ok. **12 s na minutę** (dziś 4 s/min wymagałoby chodu 4,5 pola/s) — tempo to stała; (2) osady botów mają mediana 12–13 pól do magazynu, średnia sprawność 0,88–0,90, obciążenie transportu 400–780 szt.·pole/min — nosiciele z ludności odpadają (wolnych ludzi 2–11, potrzeba 7–14), więc sprawność liczymy z cyklu pracy (kalibracja do dzisiejszej krzywej: ładunek 6, v = 18 pól/min, obsługa 0,1 min); (3) bilans chroni `settings.physical` (w testach spec. `false` → 58 scenariuszy bez zmian), zasada „tylko na niekorzyść” (`eff ≤ 1`) i bramka bilansu botów ≥ 90% wyniku bazowego; (4) centralny magazyn = Dwór (już jest), „Duży Skład” tylko jeśli bramki tego zażądają. Mechanikę porównano z Twierdzą, Settlers III/IV i Knights and Merchants (aneks E, rozdział Wzorce z gier); z Settlers IV wzięto podgląd czasów dojścia w trybie budowy.

| Etap | Zakres | Bramka | Stan |
|---|---|---|---|
| **9B-0** | tempo gry (`sekundy na minutę`, domyślnie 12; przyciski ×1/×2/×3/×6; `?tempo=`), prędkości postaci ≈ 18 pól/min | testy bez zmian (dt-based), przegląd ekranu | ✔ `c2f1c36` |
| **9B-1** | role i czynności (wizualne, zsynchronizowane ze stanem logiki): mieszkaniec per budynek, pętle, rekwizyty w `bakeFigure`, wolni obywatele; **zero zmian ekonomii** | scenariusze i `normal` identyczne; nowy `tools/browser_workers.js` | ✔ `c158a7c` (moduł Workers) |
| **9B-2** | `settings.physical`: sprawność z cyklu pracy (wyjścia, wejścia), panel „Transport”, status „brak dojścia” | nowy `tools/physical.js`: parytet przy `false`, kalibracja krzywej, czułość na drogę i Skład, determinizm, snapshot | ✔ `3115d69` |
| **9B-3** | drwal i leśnik fizycznie (najbliższe drzewo, deterministycznie), budowniczowie (dojście, partie 4 szt.) | bramka bilansu: boty R/D/N ≥ 90% wyniku bazowego; kryzysy do uratowania | ✔ `3115d69` (budowniczowie noszą kursami po 10 szt. — zmiana względem pierwotnych 4 szt.) |
| **9B-4** | karawany (Saraceni) i statki (Wikingowie): ruch i opóźnienie logiki; napady ilustrowane na trasie | scenariusze Saracenów w zakresie spec., `raids.js` bez zmian średniej straty | ✔ `3115d69` (opóźnienie wypłaty ok. 3 min; okręty odpływają w rejs; wielbłąd dla Saracenów) |
| **9B-5** | strojenie, opcjonalnie „Duży Skład”/nosiciele, dokumentacja (rozdz. 12, aneks E → stan), WIP, nowy wzorzec regresji | komplet testów, FPS ≥ 85% sprzed zmian | ◐ wstrzymane: wzorzec `baseline6` tylko w scratchpadzie; `tools/workers.js` 2 z 60 sprawdzeń; przebudowa PDF i WIP nie zrobione |

Dokumentacja 9B: `9c5fd7e` (rozdz. 12, aneks E, rozdz. 1, 5, 9, 14, 16, 17, C). Podgląd transportu w trybie budowy (napis + mapa ciepła Składu) jest w grze; porównanie wzorców z Twierdzą, Settlers III/IV i Knights and Merchants — aneks E.

**Decyzje domyślne do potwierdzenia przez użytkownika (zmiana = zmiana stałej):** tempo bazowe 12 s/min; napady na karawanę nadal ze skarbca (karawana ilustruje i opóźnia sprzedaż); magazyn centralny = Dwór. Stan: nie potwierdzone — patrz „Decyzje otwarte” w „Kolejność dalej”.

## Faza 10 — integracja końcowa i dostawa

Legenda terenu/wody/dróg/zwierzyny (panel w grze); spójność Doradcy (wyrównanie, brak dojścia, przetrzebiona zwierzyna); **zestaw regresji do repozytorium** (`tools/regress.sh` + `tools/baseline/*.txt`, dziś w scratchpadzie); `headless.js` (Fauna, Minimap); raport FPS i czasu wypieku; **dokumentacja v1.0 (komplet rozdziałów, zrzuty, przegląd wszystkich stron)**; ZIP `Nova_Roma_projekt.zip` + `Nova_Roma.html` + `grafika_prototyp.html` + PDF dokumentacji; aktualizacja opisu PR #1 (po akceptacji użytkownika można zdjąć status szkicu); wiadomość „gotowe” po polsku z pytaniem, czy zostawić styl „klasyczny” (`?classic=1`) jako zapas.

## Faza 11 — audyt wizualny i poprawki (po powstaniu produktu)

Zasada: każda zmiana sprawdzana od razu, **pełny audyt i podwójna walidacja dopiero na końcu**.

- **Frankowie (lista poprawek sprite'ów):** barracks — drzwi hali zasłonięte skrzydłem (`S.door.at 0.5→0.2`, `S.win.n 2→1`); keep — usunąć drzwi donżonu od S, okno z witrażem przesunąć (ścięte przez wieżę SE); temple — gzyms `lv*0.46→lv*0.55`; hut — usunąć szyld piekarza i okno w szczycie, `S.win.n 2→1`; store — `nuS2:4→3`, brama `h 0.44→0.36`; forester — przerwa w płocie przy drzwiach; dairy — usunąć osamotniony płotek; orchard — kosze na `(0.5, 0.55)`; watercarrier — beczki od drzwi; mill — skrzydła `L 150f→125f`; armory — baner/tarcze/łuk drzwi; winery — prasa (bez „krzyża”), beczki od drzwi; bakery — słup pod oknem; hunter — usunąć `deco1` (czaszka jelenia).
- **Saraceni, Wikingowie, Słowianie:** audyt arkuszy `prototyp/podglad/` + weryfikacja pikseli; poprawki realnych defektów.
- **Ekrany gry:** klimaty × typy map, menu, zwierzęta; plamy bagien w śniegu wyglądają „klockowo”; spójność sprite'ów z terenem.
- Po poprawkach: `node prototyp/build.js`, `node katalog.js`, `node prototyp/build_game.js --check`, `sh prototyp/podglady.sh`, ponowna dostawa.

## Ryzyka i środki

- **Limit tokenów / przerwanie sesji:** pracujemy małymi bramkami; po każdej commit + push; ten plan i dokumentacja są w repozytorium; po przerwaniu stan = ostatni commit + ten plik.
- **Determinizm spec:** fauna, logistyka i drogi wyłączone w testach (`settings`), własne PRNG ze stanem w JSON, zero wywołań globalnego `RNG`; parytet z fauną włączoną dla 1–2 myśliwych.
- **Środowisko testów:** kod ładowany przy starcie tylko z atrap DOM, bez literalnego `</script>` w łańcuchach; `localStorage` zawsze w `try/catch`.
- **Wydajność:** ≤ ~100 zwierząt, `Fauna.tick` ≤ 0,25 ms, FPS z fauną ≥ 85% FPS bez niej.
- **Re-wejście do gry z menu:** nawigacja zamiast ponownej inicjalizacji; testy przeglądarkowe przez `?menu=0` lub `?play=`.
- **Dokumentacja a kod:** generator bierze liczby z gry, więc po zmianie danych wystarczy przebudować PDF; zmiany zasad wymagają poprawy tekstu (aneks D).
- **Regresja `tools/workers.js` (otwarte, ◐):** 2 z 60 sprawdzeń nie przechodzi (zestaw franks/temperate/mountains: robotnicy niosący ładunek 13/16 przy progu 85%, zostawiający 12/16 przy progu 80%; `workers.js:72–73`). Regresja weszła w `3115d69` (9B-2…9B-4). Hipoteza niepotwierdzona: dłuższy cykl pracy (ładunek 10) vs próg testu ok. 38 min. **Decyzja użytkownika:** najpierw sprawdzić, czy to realny problem w grze; progu nie poluzowywać na ślepo; nie robić tego przed jego wytycznymi.

## Kolejność dalej

**PAUZA: rozwój gry wstrzymany na prośbę użytkownika do przeglądu stanu i wytyczenia kierunku (decyzje otwarte niżej).**

Do czasu wytycznych użytkownika nie zmieniamy kodu, testów ani rozdziałów (poza uzupełnianiem zalążków dokumentacji zleconym osobno). Po wytycznych kolejność wg planu poniżej, chyba że użytkownik zmieni priorytety.

1. **Faza 9B-5** (strojenie, wzorzec regresji, przebudowa PDF, WIP do przeklikania) — wstrzymane; najpierw wyjaśnienie `tools/workers.js` (Ryzyka).
2. Dokumentacja do v1.0: rozdz. 11 → 13 → 15 → 18 → A → zrzuty → przegląd stron (równolegle do faz; Faza 10 domyka).
3. Faza 10, potem Faza 11.

**Decyzje otwarte (dla użytkownika):**
1. `tools/workers.js` — realny problem w grze czy zbyt ostry próg testu (Ryzyka).
2. Karawana: opóźnienie wypłaty ok. 3 min (obecnie) czy kosmetyczna jak w Twierdzy.
3. Parametry cyklu pracy: ładunek 10, L_ref 8, budowniczy 10 szt. na kurs — zostają czy dostroić.
4. Pomysły na później: wydeptywane ścieżki (Settlers III/IV), osobny Spichlerz na żywność (Twierdza), punkty pracy drwala ustawiane przez gracza (KaM), promień pracy drwala.
5. Czy zostawić styl klasyczny `?classic=1` po Fazie 10.
6. Kolejność: dokończyć 9B-5 → Faza 10 → Faza 11, czy zmienić priorytety.
7. Środowisko blokuje WebFetch do wielu domen (poradniki) — korzystano ze streszczeń wyszukiwarki; do rozstrzygnięcia, czy potrzebny inny dostęp.
8. Stopki commitów: plan (linia 9) podaje `Co-Authored-By: Claude Sonnet 5.5`, a bieżące wytyczne przy commitach wskazują `Claude Haiku 5.5` — do ustalenia, który wzorzec obowiązuje.
