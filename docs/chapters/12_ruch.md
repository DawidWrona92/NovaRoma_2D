# Ruch, drogi i logistyka {#ruch}

Ruch ludzi jest w grze osobną warstwą nad ekonomią. Dziś składa się z czterech części: **Path** (A\* po polach mapy), **Walkers** (widoczni piesi — „cień symulacji”), **Roads** (drogi przyspieszające ruch) i **Logistics** (sprawność producentów zależna od odległości do Składu lub Dworu). Tylko ostatnia z nich wpływa na liczby ekonomii; pozostałe są wizualne lub służą kontroli dostępu. Plan ożywienia ludzi tak, by ich czynności były spójne z ekonomią (Faza 9B), opisuje aneks {{ref:aneks-fizyka}}.

## Ścieżki: moduł Path {#path}

`Path` to siatkowy A\* po polach mapy: **8 kierunków, bez ścinania rogów**, bez losowości (nie dotyka `RNG`). Koszt wejścia na pole to `Terrain.cost` (ląd 1; wydma 1,5; zaspa 2; lód 2; bagno 3; bród 3; droga 0,6) plus `0,5 × |Δe|` za różnicę wysokości i narzut na drzewa (`0,6 + 0,4 × drzewa`); ruch po przekątnej mnoży koszt przez √2. Woda, klify, skała i ruchome piaski są nieprzechodnie (rzeka tylko brodem lub lodem). Opcja `opts.blocked(pole)` dodaje blokady (np. zajęte pola budynków); pole startu jest zawsze dozwolone.

Funkcje modułu:

- `Path.grid` — trasa jako lista indeksów pól (z kosztem w `.cost`),
- `Path.find` — A\* z **wygładzeniem**: odcinki proste zastępują zakręty siatki, jeśli nie są droższe niż trasa siatkowa (×1,04),
- `Path.field` — wielożródłowy Dijkstra: koszt dojścia z najbliższego źródła do każdego pola (te same koszty co A\*); używa go `Logistics`,
- `Path.nearest` i `Path.closest` — najbliższe przechodnie pole oraz pole osiągalne najbliższe celowi za wodą lub klifem.

Test `tools/path.js` porównuje A\* z niezależnym Dijkstrą (optymalność), sprawdza poprawność tras (tylko pola przechodnie, kroki sąsiednie, bez ścinania rogów, rzeka tylko brodem lub lodem), brak tras do wysp, brak RNG, determinizm i szybkość.

## Widoczni piesi: moduł Walkers {#walkers}

`Walkers` rysuje postacie idące po ścieżkach `Path`: obywateli, nosicieli i budowniczych. Logika gry (losowania w `World.tick`) zostaje „cieniem symulacji” (rozdz. {{ref:cien}}); widoczna postać dąży do celu cienia, a sama niczego nie losuje. Stan `Walkers` żyje poza stanem gry i nie trafia do snapshotu.

- **Drzwi budynku** (`Walkers.doorOf`): punkt tuż przed wejściem z katalogu sprite'ów (strona S lub E i punkt na ścianie), przesunięty na najbliższe wolne pole.
- **Prędkość na polu:** droga ×1,6, wolniej po bagnie, brodzie i wydmach (`1/√koszt`).
- **Ewakuacja:** gdy plac lub budynek stanie pod postacią, wychodzi prosto na najbliższe wolne pole, a potem wraca do celu.
- **Budowniczowie** noszą materiały z Dworu na plac (etap noszenia), potem budują przy obrysie; bez przydziału lub po ukończeniu wracają do Dworu i znikają.
- **Nosiciele** wychodzą z drzwi producenta i kończą marsz przy drzwiach najbliższego Składu lub Dworu (cel wybiera logika).
- **Myśliwi** nie są częścią `Walkers`: ich pozycja to czysta funkcja czasu gry (rozdz. {{ref:fauna}}).

Tabela: Prędkości widocznych postaci dziś (pola na minutę gry)
| Postać | Prędkość | Uwaga |
|---|---|---|
| Obywatel (cień) | 0,25 | spacer wokół budynków, cele losuje logika |
| Nosiciel (cień) | 0,35 | od drzwi producenta do drzwi Składu / Dworu; kosmetyczny (max 12 naraz) |
| Budowniczy | 1,4 | Dwór → plac; noszenie i budowa |
| Myśliwy | 2,2 (powrót z łupem × 0,9) | pozycja jako funkcja czasu (`Data.FAUNA_RULES.hunterSpeed`) |

> [!uwaga] Te prędkości są **kosmetyczne i niespójne z czasem logiki**: logika zakłada, że budowniczy nosi sztukę materiału w 0,2 min niezależnie od odległości, a producent „odkłada” towar w Składzie bez czasu; widoczny budowniczy idzie do placu kilka minut gry. To jedyny powód, dla którego ludzie dziś tylko *wyglądają*, jakby pracowali — dlatego powstała Faza 9B (aneks {{ref:aneks-fizyka}}).

## Drogi: moduł Roads {#drogi}

Droga to pole z `tile.road = 1` (zapisywane w kaflu, więc trafia do snapshotu). Gracz wytycza ją narzędziem **Drogi** w pasku budowy: pierwszy klik to początek, drugi koniec; trasę wyznacza `Path` (istniejące drogi są tańsze, więc są wykorzystywane), a kolejny klik kontynuuje od końca poprzedniego odcinka. Zasady:

- koszt: **1 deska za każde nowe pole** (pola z drogą nic nie kosztują); podgląd pokazuje liczbę pól i koszt przed potwierdzeniem,
- droga nie powstanie na wodzie, bagnie, wydmie, klifie, drzewach, złożach i zajętych polach; początek i koniec muszą leżeć na wolnym lądzie,
- budowa budynku lub placu zdejmuje drogę spod obrysu; narzędzie **Rozbierz drogę** usuwa pojedyncze pola (bez zwrotu),
- po drodze piesi i nosiciele idą **ok. 1,6× szybciej**, a A\* ją preferuje (koszt pola 0,6 — odpowiada prędkości ×1,6).

Test `tools/roads.js` sprawdza m.in. koszt tylko za nowe pola, odmowy, zdejmowanie drogi przez budowę, preferowanie drogi przez A\*, brak RNG i zapis przez JSON.

## Sprawność logistyczna: moduł Logistics {#logistyka}

Producent daleko od Składu lub Dworu daje mniej. `Logistics.effOf` zwraca mnożnik plonu (przerobu) `eff`, który wchodzi do `Economy.tick` i `potentialFood` obok mnożnika lasu i zwierzyny:

```
dist  =  koszt drogi (Path.field) od drzwi producenta do drzwi najbliższego Składu lub Dworu
eff   =  1 − (1 − min) × clamp( (dist − free) / span, 0, 1 )
```

Parametry (`Data.RULES.logistics`): `free` = {{v:Data.RULES.logistics.free}} pól (bez kary), `span` = {{v:Data.RULES.logistics.span}} pól (zakres spadku), `min` = {{v:Data.RULES.logistics.min}} (najniższa sprawność).

Odległość liczona jest po polach z kosztami terenu: pole lądu kosztuje 1, **droga 0,6**, a budynki, bagna i woda wydłużają trasę (zajęte pola są blokadą). Producentem jest każdy budynek z wyjściem będącym towarem z listy limitów. Wynik jest pamiętany do zmiany układu (liczba budynków i placów, wersja dróg); budynek dostaje `b.logi = { eff, dist }` do pokazania w interfejsie („transport do Składu ≈ N pól (−X%): zbliż budynki lub połóż drogę”). Opcja `settings.logistics` jest wyłączona w testach specyfikacji (żaden scenariusz się nie zmienia) i włączona w grze (przycisk 🚚, `?logistics=0`).

{{wykres:logistyki}}

### Jak wygląda to w osadach botów {#sonda}

Poniższy pomiar (skrypt `tools/probe_logistyki.js`, liczony przy każdej budowie dokumentu) pokazuje, że w osadzie układanej przez bota **bez dróg** mediana odległości od Składu / Dworu wynosi ok. 12–13 pól, 90. percentyl ok. 17–21, a pojedyncze budynki (kopalnia darniowa Wikingów) leżą 40 pól od magazynu. Średnia sprawność modułu to ok. 0,88–0,90 — czyli osada „bez organizacji” traci ok. 10% produkcji, a drogi i Składy ten stan poprawiają. To budżet, którego nie wolno przekroczyć przy dalszych zmianach (spec. przyjmuje, że narzut transportu poniżej 10% jest akceptowalny, 15% już obniża ludność Franków o 18%).

{{tabela:sonda_logistyki}}

## Co z tego wynika dla gracza {#wnioski}

- **Składy przy producentach i drogi do nich** podnoszą wydajność (do −10% bez nich); Skład ma więc dwie role: pojemność (rozdz. {{ref:ekonomia}}) i skrócenie transportu.
- Dwór jest **magazynem centralnym** każdej osady: do niego idzie transport, gdy nie ma Składu; im bliżej Dworu stoi producent, tym mniejsza kara — kosztem zagęszczenia (przerwa i kara za ciasną zabudowę, rozdz. {{ref:zabudowa}}).
- Budynki daleko od wszystkiego (kopalnie na złożach, rybacy na brzegu) można „uleczyć” drogą lub własnym Składem.
