# Grafika i silnik sprite'ów {#grafika}

Gra nie używa plików graficznych: wszystko jest rysowane kodem i wypiekane do płócien (sprite'ów) przy starcie. Źródłem jest katalog `prototyp/`, a w pliku gry wypieka je moduł `Sprites`. Rozdział opisuje, jak to jest zbudowane i czego nie wolno ręcznie zmieniać.

## Dwa źródła w jednym pliku {#zrodla}

Silnik sprite'ów powstaje w `prototyp/src/` (kolejne pliki `00_util.js` … `90_main.js`: bryły, dachy, rekwizyty, drzewa, klimat, podłoże, fauna i cztery nacje). Z tych plików skrypty składają dwa bloki wklejane do `Nova_Roma.html`:

- `prototyp/build.js` i `prototyp/katalog.js` — tworzą `katalog_budynkow.json` (obrys w polach, wejście, kominy, kotwice dymu) dla każdego budynku z `Data.BUILDINGS`;
- `prototyp/build_game.js` — wkleja bloki **`SPRITE_META`** (katalog obrysów, źródło `Data.footprint`) i **`Sprites`** (silnik wypieku) między znaczniki `BEGIN`/`END` w `Nova_Roma.html`.

> [!pulapka] Bloki `SPRITE_META:BEGIN/END` i `SPRITES:BEGIN/END` są **generowane**. Ręczna edycja zostanie nadpisana przy następnym `node prototyp/build_game.js`. Zmiany obrysu, wejścia albo komina robi się w `prototyp/`: `node build.js`, `node katalog.js`, `node prototyp/build_game.js`, a potem testy `node tools/browser_sprites.js` i `node tools/footprints.js`.

Podgląd prototypu jest w `prototyp/grafika_prototyp.html` (arkusze budynków, `?sprite=`, `?lint=1` — kontrola artefaktów: przenikanie brył, źle ułożone okna, wystawanie poza obrys).

## Budynki w czterech stylach {#budynki}

Każdy budynek to zbiór brył (`src/26_build.js`): prostopadłościanów, walców, dachów, kopuł i rekwizytów. Kolejność rysowania ustala program (sortowanie po relacji „bliżej/dalej widza”), a okna i drzwi układa `facade()`. Prototyp rysuje **każdy budynek z katalogu gry dla każdej z czterech nacji** — po jednym sprite'cie na budynek i nację, każdy we własnym obrysie (od 2×2 do 4×4 pól). Style nacji wynikają z materiałów: Frankowie — kamień i ryglówka, Saraceni — piaskowiec i kopuły, Wikingowie — drewno i smocze głowy na kalenicy (tylko u nich), Słowianie — drewno i „Święty krąg”.

Zużycie (łaty, ślady) jest dopasowane do materiału i można je wyłączyć parametrem `?nowear=1` w prototypie. Każdy wypiek jest deterministyczny: tekstura i sprite powstają z ziarna per obiekt, więc za każdym razem wychodzą takie same.

## Mieszkańcy {#mieszkancy}

Postacie mają wygląd wspólny dla nacji, zapisany w tabeli `CAST` (kolory stroju, włosy, nakrycie głowy, rekwizyty). Robotnicy mają po dwa warianty na nację: `*Worker` i `*WorkerB` (np. `frankWorker`, `vikWorkerB`), dobierane według koloru stroju. Myśliwi z łukiem (`frankHunter` i pozostałe) dopisano na końcu tabeli, żeby nie przesunąć indeksów wybieranych w grze.

Narzędzie i ładunek nie są częścią sylwetki. Rysuje je `drawTool(kind, k, ang, t, ph)` (siekiera, piła, kilof, sadzonka, łuk…) w ręce w chwili pracy, a `drawLoad(load, k)` rysuje kształt towaru (kłoda, deski, worek, kosz, sztabki…) na plecach albo w dłoniach. Rodzaj narzędzia i ładunku wynika z `Data.ROLES` i `Data.LOADS` (tabela w rozdz. {{ref:ruch}}).

## Przyroda i fauna {#przyroda}

Drzewa, krzewy i dekory są rysowane jako osobne sprite'y (`src/40_nature.js`, `src/35_props.js`) z lekkim kołysaniem koron; kołysanie wyłącza się samo na wolnych urządzeniach. Zwierzęta (`src/43_fauna.js`) są rysowane z pozycji symulacji `Fauna` i mają stany: spacer, ucieczka, lot ptaka, padlina. Myśliwy na wyprawie jest rysowany z `Fauna.hunters` — pozycja, celowanie i strzała pochodzą z czasu gry (rozdz. {{ref:fauna}}).

## Podłoże w chunkach {#podloze}

Teren nie jest rysowany kafel po kaflu. Klasa `Ground` (`src/42_ground.js`, w grze `Game.initGround`) wypieka mapę w kwadratach `GCH` × `GCH` px (`GCH` = 512). Każdy chunk ma dwa płótna: **grunt** (`base`, wypiekany raz) i **nakładkę** (`over`: budynki, drzewa, złoża, dekory), która odświeża się tylko po zmianie sygnatury pól (wycięte drzewo, nowy budynek). Rodzaje gruntu i wody są nakładane maskami z rozmytych wielokątów; wysokość daje cieniowanie. Chunki mają trzy poziomy szczegółu (1, ½, ¼), więc przy oddaleniu nie ma dziur. Silnik nie zna reguł gry: obiekty statyczne i sygnaturę podaje gra przez `statics` i `sigOf`.

Klimat określa paletę gruntu (`base`, `vary`, plaża, woda). Gdy wypiek się nie uda, gra przechodzi na kafle klasyczne.

## Jakość i tryb klasyczny {#jakosc}

- `?q=1` lub `?q=2` wymusza rozdzielczość wypieku sprite'ów; bez parametru gra wybiera `2` na ekranach HiDPI (`devicePixelRatio ≥ 1,5`) i `1` na pozostałych.
- `?classic=1` pomija sprite'y i rysuje dawne kafle — przydatne na słabych urządzeniach i w testach porównawczych. Wypiek sprite'ów pokazuje pasek postępu przy starcie gry.

Budżety wydajności pilnuje `tools/browser_sprites.js` (wypiek nacji) i `tools/browser_terrain.js --fps` (rozdz. {{ref:testy}}).

> [!uwaga] **Pełny audyt wizualny jest zaplanowany na Fazę 11** (`docs/PLAN.md`): arkusze `prototyp/podglad/` dla Saracenów, Wikingów i Słowian oraz weryfikacja pikseli, z poprawkami realnych defektów. Do tego czasu braki wizualne zostają opisane w planie i nie są poprawiane w bieżących etapach.
