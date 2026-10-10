# Zasady zabudowy {#zabudowa}

Gracz stawia budynek, wskazując lewy górny róg obrysu na mapie. Gra sprawdza wtedy `World.canPlace(id, x, y)`, które zwraca `{ ok }` albo `{ ok: false, reason }` — powód jest pokazywany w podglądzie i w Doradcy. Ta sama funkcja jest wołana przez budowę (`Build.enqueue`), przez generator botów testowych i przez `Fauna` i `Path` przy ocenie pól. Obrys budynku (w×h pól) pochodzi z katalogu `SPRITE_META` (`Data.footprint`), więc wymiary są opisane w rozdz. {{ref:budynki}}.

## Przerwa między budynkami {#przerwa}

Między obrysami musi zostać wolna przerwa: `Data.RULES.gap` = {{v:Data.RULES.gap}} pole. Żaden inny budynek ani plac nie może leżeć w pierścieniu tej szerokości wokół nowego obrysu — w grze to „ulica”, po której idą piesi i na której może powstać droga (rozdz. {{ref:ruch}}). Naruszenie daje komunikat „Za blisko innego budynku — zostaw wolne pole (ulicę)”.

## Strefa kary za ciasną zabudowę {#kara}

Tuż za przerwą leży pas szerokości `Data.RULES.crowd.ring` = {{v:Data.RULES.crowd.ring}} pola (pola 2–3 od budynku). Każdy budynek lub plac w tym pasie dodaje do czasu budowy `crowd.per` = {{v:Data.RULES.crowd.per * 100}} %, najwyżej `crowd.max` = {{v:Data.RULES.crowd.max * 100}} %. `World.crowdOf(id, x, y)` zwraca liczbę sąsiadów (`n`) i procent kary (`pct`). Przy zakładaniu placu czas pracy budowniczych mnoży się przez `(1 + pct)`, więc kara działa na etapie budowy, nie na koszcie materiałów.

{{tabela:zasady_zabudowy}}

## Wyrównywanie terenu {#wyrownanie}

Plac nie musi leżeć na płaskim terenie, ale różnica wysokości między polami obrysu może wynosić najwyżej 1 poziom (`eMax − eMin ≥ 2` odrzuca miejsce: „Zbyt nierówny teren”). Mniejsze nierówności wyrównuje etap 0 budowy. `World.levelOf(id, x, y)` wybiera poziom docelowy jako najczęstszy wśród pól obrysu (przy remisie niższy), a potrzebną pracę liczy jako sumę |e − cel| pomnożoną przez `Data.RULES.level.per` = {{v:Data.RULES.level.per}} min na pole i poziom. Po zakończeniu etapu wszystkie pola obrysu dostają poziom docelowy, a mapa odświeża podłoże tych chunków.

> [!uwaga] Wyrównanie nie wymaga osobnego przycisku: po otwarciu placu budowniczowie najpierw zrównują teren, a dopiero potem noszą materiały i stawiają budynek. Czas wyrównania jest wliczony w czas, po którym budynek staje się gotowy (rozdz. {{ref:budowa}}).

## Wymagania budynków {#wymagania}

Każdy budynek może mieć pole `req` opisujące wymóg terenowy. Sprawdzenie odbywa się w `canPlace` na obrysie powiększonym o jednopolowy pierścień sąsiedztwa:

Tabela: Wymagania terenowe budynków (pole `req` w `Data.BUILDINGS`)
| Wymóg | Co sprawdza gra | Budynki w grze | Komunikat przy braku |
|---|---|---|---|
| `deposit:<rodzaj>` | złoże tego rodzaju na co najmniej jednym polu obrysu | kopalnie i kamieniołom (Frankowie, Saraceni, Wikingowie) | „Wymaga złoża (…)” |
| `shore` | morze, jezioro lub lód w obrysie albo pierścieniu | Chata rybaka (Wikingowie) | „Wymaga brzegu morza lub jeziora” |
| `waterEdge` | morze w obrysie albo pierścieniu | Przystań, Okręt (Wikingowie) | „Wymaga bezpośredniego dostępu do morza” |
| `forest` | co najmniej 4 drzewa w obrysie i pierścieniu | żaden budynek (kod istnieje, lecz nie jest używany) | „Wymaga lasu w pobliżu” |

Kilka reguł stoi poza tabelą. Złoże jest zarezerwowane: pole ze złożem może zająć tylko kopalnia pasującego rodzaju (pozostałe budynki dostają „Złoże — miejsce tylko na kopalnię”). Chata rybaka ma dodatkowy limit `settings.shoreSpots` (domyślnie 6) miejsc na wybrzeżu. Okręt wymaga, by w osadzie stała już Przystań. Chata myśliwego nie ma żadnego wymogu terenowego — zwierzyna jest liczona w łowisku, a nie przez las (rozdz. {{ref:fauna}}).

> [!pulapka] Flaga `forest` w katalogu budynków (Słowianie: Chata zbieracza, Barć, Chata łowcy futer) wpływa na plon, a nie na miejsce budowy: plon to × min(1, drzewa / próg nacji). Wymóg `req: 'forest'` istnieje w `canPlace`, ale żaden budynek go nie ustawia, więc te budynki da się postawić także bez lasu.

## Pola niebudowlane i zajęte {#pola}

Pole obrysu musi spełniać trzy warunki: być lądem (`h = 1`), nie być zajęte (`occup`) i nie mieć drzewa. Cechy `bog`, `dune`, `quick`, `cliff` i `drift` są wykluczone (`Terrain.BLOCK_K`), a odpowiedni komunikat podaje powód (np. „Ruchome piaski!”). Wody i skał nie da się zabudować. Oprócz tego musi istnieć dojście: obrys z pierścieniem musi stykać się z obszarem osiągalnym dla pieszych (`Terrain.ringReachable`), inaczej budynek odcinałby się od reszty osady („Brak dojścia”).

Rezerwacja pól działa na dwóch poziomach. Generator mapy (`MapGen`, funkcja `reserve`) zaznacza pola pod Dwór i pod pierwsze budynki (`pad = 1`), a drzewa tam nie odrastają. Gdy plac zostaje otwarty, `World.occupy` wpisuje jego `uid` w pola `occup` i zdejmuje z nich drogę; `World.release` zwalnia je po anulowaniu lub zakończeniu budowy. Dwór (4×4) nie może być ani zbudowany, ani zburzony.

## Anulowanie placu {#anulowanie}

Anulowanie (`Build.cancel(site)`) jest możliwe przed końcem budowy. Gra zwraca to, co dowieziono na plac: każdy dostarczony towar wraca do magazynu, złoto zapłacone przy otwarciu placu wraca do `res.złoto`, a pola obrysu zostają zwolnione. Statystyka zużytych desek (`stats.planksSpent`) jest korygowana o zwrócone deski. Materiał jeszcze niedowieziony nie jest liczony.

## Funkcje i dane {#funkcje}

- `World.canPlace(id, x, y)` — walidacja (powody odmowy, przerwa, wymagania `req`, dojście);
- `World.crowdOf(id, x, y)` — kara za ciasną zabudowę (`n`, `pct`);
- `World.levelOf(id, x, y)` — wyrównanie terenu (`target`, `need`, `minutes`);
- `Build.enqueue` / `Build.cancel` — otwarcie i anulowanie placu, rezerwacja pól przez `World.occupy` / `World.release`;
- `Data.RULES` — wszystkie stałe zabudowy: `gap`, `crowd`, `level`, `logistics` (sprawność dojścia do Składu).

> [!kod] Stałe czasu budowy `Build.BASE_WORK` = 1,0 min, `Build.PER_PIECE` = 0,1 min na sztukę i `Build.PIECE_MIN` = 0,2 min noszenia są w module `Build`, nie w `Data.RULES`. Czas pracy placu to `(BASE_WORK + PER_PIECE × sztuk) × (1 + pct)`.
