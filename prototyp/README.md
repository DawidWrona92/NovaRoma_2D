# Nowy styl graficzny (prototyp v4 — komplet budynków wszystkich nacji, osadzony w grze)

Render w stylu Settlers IV / Twierdzy / AoE2 bez żadnych plików graficznych: wszystko jest rysowane kodem i wypiekane do sprite'ów.
Narysowany jest **każdy budynek z katalogu gry (`Data.BUILDINGS`) dla każdej z czterech nacji — 88 sprite'ów** (Frankowie 24, Saraceni 23, Wikingowie 21, Słowianie 20)
z własnym obrysem (2×2 … 4×4 pola). `grafika_prototyp.html` to samodzielna próbka do oglądania; **silnik sprite'ów jest też osadzony w grze** (`Nova_Roma.html`, moduł `Sprites`) — patrz „Osadzenie w grze".

![scena](podglad/scena.jpg)

## Jak oglądać
- `grafika_prototyp.html` — otwórz w przeglądarce. Kółko / szczypanie / przyciski `+` `−` — zoom (30–180% widoku domyślnego),
  przeciągnięcie — przesuwanie, `⟲` — widok domyślny, `▦` (klawisz `G`) — siatka pól z obrysami budynków i ich rozmiarami.
- Arkusze budynków (z obrysem w polach i podpisem): `#sheet-r-franks`, `#sheet-r-saracens`, `#sheet-r-vikings`, `#sheet-r-slavs` (jedna nacja),
  `#sheet-r` (wszystkie w jednej skali); `?cols=4` — liczba kolumn. Wypiekane są tylko sprite'y potrzebne w danym widoku.
- Pojedyncze budynki: `?sprite=franks_keep,vikings_ship&zs=2` (nazwa sprite'a = `<nacja>_<id z gry>`).
- Parametry adresu: `?q=1|2` (rozdzielczość wypieku; domyślnie 2), `?z=2.4` (zoom), `?grid=1`, `?cx=26&cy=8` (środek kamery w polach), `?all=1` (wypiekaj wszystko), `?lint=1` (kontrola artefaktów), `?nowear=1` (bez śladów zużycia).
- Podglądy: `podglad/*.jpg` (odświeża je `sh podglady.sh`).

## Co jest w v4
1. **Komplet budynków:** Frankowie 24, Saraceni 23, Wikingowie 21, Słowianie 20 (tabele niżej) — każdy pod swój obrys, z rekwizytami pasującymi do funkcji
   (tartak z piłą, kopalnia z torami i wózkiem, kaszarnia ze stępą, garbarnia z kadziami, qanat z szybami, okręt z tarczami, …).
2. **Koniec „halucynacji" — budynki składane z brył, nie malowane „na oko".** Każdy budynek to zbiór brył (`src/26_build.js`, klasa `Build`):
   prostopadłościany, walce, dachy dwu-/czterospadowe/pulpitowe, kopuły, rekwizyty — każda z własnym obrysem w przestrzeni.
   - **kolejność rysowania ustala program** (nie autor): relacja „bliżej/dalej widza" + sortowanie topologiczne z przełamywaniem cykli,
     więc ściany nie „wchodzą" jedna w drugą, a dach, komin i rekwizyty są zawsze we właściwej warstwie;
   - **cienie** liczone z sumy brył (zakładki nie ciemnieją podwójnie);
   - **okna i drzwi układa `facade()`**: równe odstępy, nie nachodzą na narożniki ani na siebie, liczba okien jest ograniczona szerokością ściany;
   - **kontrola jakości `?lint=1`** (`node lint.js [nazwy]`): przenikanie się brył, zła kolejność, okna poza ścianą / nachodzące / zbyt gęste (>50% szerokości),
     elementy wystające poza obrys, ucięcie na brzegu płótna, nierozwiązywalne cykle głębi. **Wszystkie 88 budynków przechodzi z 0 ostrzeżeń.**
3. **Uwagi z przeglądu zrealizowane:** u Franków 2–3 okna na ścianę (ciemne szyby, jeden kolor okiennic, ryglówka dopasowana do okien), kościół przeprojektowany
   (nawa + przypory + 3 witraże + prosta wieża z iglicą — bez zegara, rozety i pinakli), u Wikingów kościół słupowy (nawa, nawy boczne, wieża), u Słowian „Święty krąg".
   **Smocze głowy** występują tylko u Wikingów i zawsze patrzą od budynku (na obu końcach kalenicy: `dragonEnd`, `side = s2·d`); budynki Słowian nie mają żadnych głów.
4. **Okrągła cegła na okrągłych bryłach** (wieże, studnie, kopuły bębnów, młyn): tekstura jest mapowana walcowo (`cylTexture`) — cegły zwężają się ku krawędziom
   i układają w łuki, zamiast płaskiej siatki jak na ścianach.
5. **Zużycie dopasowane do materiału:** łaty napraw na ciemnych deskach i gontach są tylko trochę jaśniejsze (nie rażą), na jasnych — wyraźne.
6. **Kotwice dymu i wejścia w sprite'ach:** `sprite.smoke` (kominy / otwory dymne — animowany dym w widoku) i `sprite.doors` (położenie drzwi), wyeksportowane do `katalog_budynkow.json`.

## Budynki (pola; nazwy sprite'ów = `<nacja>_<id>`)
### Frankowie — kamień, ryglówka, dachówka / łupek
| id | Budynek | Obrys | Uwagi |
|---|---|---|---|
| keep | Dwór (zamek) | 4×4 | mur kurtynowy, 4 baszty z cegłą walcową, brama z kratą, donżon, stajnia, studnia |
| hut | Chata | 2×2 | kamienny parter, piętro z ryglówki z nawisem, schody |
| temple | Kościół | 4×2 | nawa z witrażami i przyporami, wieża z iglicą |
| woodcutter / forester / hunter | Chaty drwala, leśnika, myśliwego | 2×2 | stosy kłód, grządka z sadzonkami, poroże i skóry |
| sawmill | Tartak | 3×2 | wiata, piła ramowa, kłody i deski |
| store | Skład | 3×2 | kamień + ryglówka, brama, worki |
| dairy / orchard / watercarrier / market | Mleczarnia, Sad, Chata nosiwody, Targ | 2×3 / 3×3 / 2×2 / 3×3 | bańki i sery; jabłonie w płocie; studnia z daszkiem; stragany i krzyż targowy |
| quarry / mill / farm / bakery | Kamieniołom, Młyn, Farma, Piekarnia | 3×3 / 3×3 / 4×3 / 2×3 | żuraw i bloki; wiatrak + dom młynarza; pole, stodoła; piec chlebowy |
| ironmine / coalmine / smelter / toolforge / armory | Kopalnie, Huta, Kuźnia narzędzi, Zbrojownia | 3×3 / 3×3 / 3×3 / 2×3 / 3×2 | wejście w ramie z bali, tory, wózek; palenisko; stojaki z bronią |
| vineyard / winery / barracks | Winnica, Winiarz, Koszary | 3×3 / 2×3 / 3×3 | rzędy winorośli; prasa i beczki; dziedziniec z palisadą |

### Saraceni — piaskowiec, kopuły, mozaika, markizy
| id | Budynek | Obrys | Uwagi |
|---|---|---|---|
| keep | Dwór (pałac) | 4×4 | mur z basztami i kopułami, brama-pishtak, wielka turkusowa kopuła, minaret, fontanna |
| hut / woodcutter / forester / hunter | Domy | 2×2 | płaski dach z attyką, mozaika, markiza, pergole z liści |
| sawmill / dairy / orchard / watercarrier / market / store | | 3×2 / 2×3 / 3×3 / 2×2 / 3×3 / 3×2 | sabil z kopułą; stragany pod pasiastymi płachtami; magazyn ze świetlikiem |
| temple | Meczet | 3×3 | kopuła na bębnie, iwan, dziedziniec z arkadą i fontanną, minaret |
| claypit / dategrove / incensewood / incense | Glinianka, Gaj daktylowy, Las kadzidlany, Wytwórnia kadzidła | 3×3 / 3×3 / 3×3 / 2×3 | skarpa i cegły schnące; palmy i kanał; kadzielnice |
| cotton / weaver / pottery / qanat | Plantacja bawełny, Tkalnia, Garncarnia, Qanat | 3×3 / 2×3 / 2×3 / 3×2 | krzewy z torebkami; krosno; piec z żarem; szyby i basen |
| bathhouse / caravanserai / guardpost | Łaźnia, Karawanseraj, Strażnica | 3×3 / 4×3 / 2×2 | trzy kopuły; dziedziniec i wielbłądy; wieża z blankami |

### Wikingowie — ciemne drewno, darń na dachach, smocze łby, tarcze
| id | Budynek | Obrys | Uwagi |
|---|---|---|---|
| keep | Dwór jarla | 4×4 | palisada z bramą ze smoczymi słupami, hala ze smoczymi łbami, dom gościnny, spichlerz na palach |
| hut / woodcutter / forester / hunter | Chaty | 2×2 | zrąb z wystającymi końcami bali, darń, suszarnie |
| sawmill / dairy / orchard / watercarrier / market / store | | 3×2 / 2×3 / 3×3 / 2×2 / 3×3 / 3×2 | kamień runiczny na targu |
| temple | Kościół słupowy | 3×3 | nawa pod gontem, nawy boczne, wieża z portalem, smocze łby, kamienie runiczne |
| fisherhut / peatmine / charburner / mead | Chata rybaka, Kopalnia darniowa, Wypalarka węgla, Miodosytnia | 2×2 / 3×3 / 3×3 / 2×3 | łódź na brzegu; torfowisko; mielerz z żarem; kadzie |
| dock / ship | Przystań, Okręt | 4×2 / 4×2 | pomost na palach z żurawikiem; okręt z tarczami, żaglem i smoczą głową |
| smelter / toolforge / armory | Huta, Kuźnia, Zbrojownia | 3×3 / 2×3 / 3×2 | piec szybowy z żarem; otwarta kuźnia; rzędy tarcz |

### Słowianie — zrąb, strzecha, drewniane bożki (bez rzeźbionych głów na dachach)
| id | Budynek | Obrys | Uwagi |
|---|---|---|---|
| keep | Gród (dwór) | 4×4 | wał z bali z częstokołem, brama z nadbudówką, dwupiętrowy dwór, dom gościnny, studnia-żuraw, bożek |
| hut / woodcutter / forester / hunter | Chaty | 2×2 | ganek pod pulpitowym daszkiem, sznury cebuli i ziół |
| sawmill / dairy / orchard / watercarrier / market / store | | 3×2 / 2×3 / 3×3 / 2×2 / 3×3 / 3×2 | studnia-żuraw; targ z bożkiem; spichlerz na palach z wciągarką |
| temple | Kapliczka (Święty krąg) | 3×3 | kopiec z kręgiem rzeźbionych bożków, ołtarz z ogniem |
| gatherer / field / kasha / bartnik | Zbieracz, Pole stałe, Kaszarnia, Barć | 2×2 / 3×3 / 2×3 / 3×3 | grzyby i jagody; zagony i snopki; stępa; kłody bartne wśród sosen |
| waxery / trapper / tannery / sauna | Woskarnia, Łowca futer, Garbarnia, Bania | 2×3 / 2×2 / 2×3 / 2×2 | pasieka i kocioł; ramy ze skórami; kadzie; para i dym |

## Zasady techniczne
- **Skala pól:** jednostka = 1 pole (128 px logicznych szerokości, rzut dimetryczny 2:1). Układ sprite'a: środek obrysu = (0,0), `x` w prawo-dół, `y` w lewo-dół, `z` w górę.
  Środek obrysu budynku z północnym rogiem (i, j) leży w polu (i + szer/2, j + wys/2).
- **Rozdzielczość `RES`:** domyślnie 2× (ostre duże budynki także po przybliżeniu); `?q=1` — lżejsza wersja (około połowa pamięci).
- **Elementy architektoniczne** (`src/30_buildings.js`): drzwi, okna (prostokątne, łukowe, witrażowe), ryglówka, komin, schody, markizy, kopuły, minarety…
  **Zestaw rekwizytów** (`src/27_kit.js`): tartaczne, górnicze, rolnicze, targowe, wojskowe; **domy** (`src/28_house.js`): wspólny szkielet z dachem, kominem i piętrem.
- **Ślady życia** (`src/25_wear.js`): ziarno, plamy, zacieki, pęknięcia, łaty napraw, mech, odpadający tynk, brakujące dachówki — deterministyczne.
- **Teren w prototypie:** kafle 512×512 px logicznych wypiekane na żądanie; cienie i place nieruchomych obiektów wypiekane razem z terenem. W grze tę rolę pełni moduł `Ground` (niżej).
- **Ludzie:** ~70 px wysokości przy zoomie domyślnym, widok z przodu i z tyłu, 2 klatki chodu, strój zależny od nacji i roli.
- **Zwierzęta (`src/43_fauna.js`):** 18 rodzajów rysowanych kodem (surowy canvas jak drzewa i postacie), profil w prawo — gra odbija go lustrzanie wg kierunku marszu; cień symetryczny.
  Trzy konstruktory ciała: czworonóg (sarna, królik, zając polarny, królik pustynny, lis, lis polarny, dzik, renifer, łoś, gazela, wielbłąd), ptak (bocian, żuraw, wrona, mewa, sęp — stojący + 3 klatki lotu)
  i niski korpus (foka, jaszczurka). `bakeFauna(rodzaj)` → `{ walk[4|2], idle[1], dead[1] (czworonogi), fly[3] (ptaki) }`; `faunaKinds(klimat)` — zestaw wypiekany z przyrodą klimatu
  (`Sprites.bake` → `Sprites.fauna(rodzaj)`). Arkusz do przeglądu: `node sheet.js out.png 1 '#sheet-a-2'` (osoba i pole 1×1 dla skali), gotowy: `podglad/arkusz_zwierzeta.jpg`.

## Katalog dla integracji (`katalog_budynkow.json`)
Generuje go `node katalog.js`. Dla każdego `nacja → id`: nazwa sprite'a, nazwa PL, `obrys` [szer, wys] w polach, `wejscie` (strona `S`/`E` i punkt w polach względem środka),
`dym` (lista kotwic [x, y, z] animowanego dymu) i rozmiar sprite'a `{w, h, ax, ay}` w px logicznych (`ax, ay` = środek obrysu na ziemi).

## Pomiary (Chromium headless, render programowy, bez GPU)
Patrz sekcja „Pomiary" na końcu — liczby poniżej to wypiek **jednej nacji** (tyle potrzebuje gra) i wszystkich czterech.

## Osadzenie w grze
Gra pozostaje **jednym plikiem** `Nova_Roma.html`; źródłem prawdy jest `prototyp/src`. Bloki w grze generuje skrypt (nie edytuje się ich ręcznie):
- `node prototyp/build_game.js` — wkleja do `Nova_Roma.html` (znaczniki `SPRITES:BEGIN/END`, `SPRITE_META:BEGIN/END` przed modułem DATA):
  moduł **`Sprites`** (IIFE: `src/00…54` + `game_api.js`, bez `90_main.js`) oraz **`SPRITE_META`** (obrys, wejście, dym, rozmiar sprite'a każdego budynku z `katalog_budynkow.json`).
  `--check` sprawdza, czy bloki są aktualne. Silnik ładuje się bez DOM (testy headless widzą obrysy bez wypieku); skrypt przerywa, gdy katalog nie obejmuje wszystkich budynków nacji.
- `Sprites.bake(nacja, postęp, { deposits })` wypieka **tylko wybraną nację** + przyrodę jej klimatu + jej mieszkańców (ekran „Wypiekanie grafiki"; q=1 ≈ 1–1,5 s, q=2 ≈ 2,5–3,5 s);
  `Sprites.get(nacja, id)`, `Sprites.draw(ctx, sprite, warstwa, x, y, k, dpr)` (warstwy `p` plac, `u` cień, `c` obiekt; dobór mipmapy), `Sprites.sort(lista)` (głębia wg prostokątów obrysów, `src/36_sort.js`),
  `Sprites.engine` (`Scene`, `tex`, generatory — dla modułów terenu/zwierząt).
- W grze: `Data.footprint(id)` (obrys z katalogu) zastępuje stałe rozmiary; `World/Build/Events/TestBots` operują na pełnym obrysie; Dwór 4×4 na środku mapy; `Game.render` rysuje sprite'y
  (budynki, drzewa, złoża, mieszkańcy, place budowy, duch budynku, dym z kominów, plakietki). `?classic=1` — dawne procedury `Gfx.ART` (zapas), `?q=1|2` — jakość wypieku.
- **Podłoże mapy (`src/42_ground.js`, klasa `Ground`; `Sprites.makeGround(mapa, { climate, statics, sigOf })`):** zamiast 2304 kafli na klatkę teren jest wypiekany w chunkach
  512×512 px logicznych planu sprite'ów (3 poziomy rozdzielczości: 1, ½, ¼ — najgrubszy dla całej mapy powstaje na ekranie ładowania, więc nigdy nie ma dziur).
  Grunt: tekstura klimatu (+ druga, obrócona i przeskalowana warstwa oraz wielkoskalowe plamy `GEN.vary` — bez widocznej powtarzalności), rodzaje gruntu (bagno, wydma, ruchome piaski,
  zaspy, oaza, skała) i woda nakładane przez maski z rozmytych wielokątów pól z progiem (kontur organiczny zamiast schodków rombów), plaża → mokry brzeg → piana → woda (morze / jezioro /
  rzeka / oaza / zimne morze / lód) → głębia, bród = żwir + płytka woda, cieniowanie wzgórz (`soft-light`, światło z lewej góry), przycięcie do rombu mapy.
  Nakładka chunka (osobne płótno) niesie place, cienie i niskie dekory obiektów statycznych; gra podaje je wywołaniem `statics(tx0, ty0, tx1, ty1, emit)`, a zmianę wykrywa po `sigOf`
  (wycięte drzewo, nowy budynek) — wtedy odświeża się tylko nakładka. `draw()` rysuje widoczne chunki z zaokrągleniem do pikseli urządzenia (bez szwów), `drawFx()` — błyski na wodzie,
  `work(ms)` — wypiek brakujących poziomów w budżecie klatki, limit pamięci z wyrzucaniem najdawniej używanych.
  Tekstury gruntu: `GEN.grass` (zestawy green / eastern / sand / snow / tundra), `GEN.dune`, `GEN.drift`, `GEN.bog`, `GEN.quick`, `GEN.rock`, `GEN.gravel`, `GEN.water` (sea / lake / river / oasis / cold / ice).
- Po zmianie obrysu / wejścia / komina: `node build.js` → `node katalog.js` → `node build_game.js`; test: `node tools/browser_sprites.js` i `node tools/footprints.js`.
