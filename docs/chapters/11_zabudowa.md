# Zasady zabudowy {#zabudowa}

Gracz stawia budynek, wskazując lewy górny róg obrysu na mapie. Gra sprawdza wtedy `World.canPlace(id, x, y, rot)`, które zwraca `{ ok }` albo `{ ok: false, reason }` — powód jest pokazywany w podglądzie i w Doradcy. Argument `rot` (kierunek 0–3) ma wartość 0 dla większości budynków; obraca się tylko Przystań i Okręt (sekcja {{ref:obrot}}). Ta sama funkcja jest wołana przez budowę (`Build.enqueue`), przez generator botów testowych i przez `Fauna` i `Path` przy ocenie pól. Obrys budynku (w×h pól) pochodzi z katalogu `SPRITE_META` (`Data.footprint(id, fid, rot)`), więc wymiary są opisane w rozdz. {{ref:budynki}}.

## Przerwa między budynkami {#przerwa}

Między obrysami musi zostać wolna przerwa: `Data.RULES.gap` = {{v:Data.RULES.gap}} pole. Żaden inny budynek ani plac nie może leżeć w pierścieniu tej szerokości wokół nowego obrysu — w grze to „ulica”, po której idą piesi i na której może powstać droga (rozdz. {{ref:ruch}}). Naruszenie daje komunikat „Za blisko innego budynku — zostaw wolne pole (ulicę)”.

## Strefa kary za ciasną zabudowę {#kara}

Tuż za przerwą leży pas szerokości `Data.RULES.crowd.ring` = {{v:Data.RULES.crowd.ring}} pola (pola 2–3 od budynku). Każdy budynek lub plac w tym pasie dodaje do czasu budowy `crowd.per` = {{v:Data.RULES.crowd.per * 100}} %, najwyżej `crowd.max` = {{v:Data.RULES.crowd.max * 100}} %. `World.crowdOf(id, x, y)` zwraca liczbę sąsiadów (`n`) i procent kary (`pct`). Przy zakładaniu placu czas pracy budowniczych mnoży się przez `(1 + pct)`, więc kara działa na etapie budowy, nie na koszcie materiałów.

{{tabela:zasady_zabudowy}}

## Wyrównywanie terenu {#wyrownanie}

Plac nie musi leżeć na płaskim terenie, ale różnica wysokości między polami obrysu może wynosić najwyżej 1 poziom (`eMax − eMin ≥ 2` odrzuca miejsce: „Zbyt nierówny teren”). Mniejsze nierówności wyrównuje etap 0 budowy. `World.levelOf(id, x, y)` wybiera poziom docelowy jako najczęstszy wśród pól obrysu (przy remisie niższy), a potrzebną pracę liczy jako sumę |e − cel| pomnożoną przez `Data.RULES.level.per` = {{v:Data.RULES.level.per}} min na pole i poziom. Po zakończeniu etapu wszystkie pola obrysu dostają poziom docelowy, a mapa odświeża podłoże tych chunków.

> [!uwaga] Wyrównanie nie wymaga osobnego przycisku: po otwarciu placu budowniczowie najpierw zrównują teren, a dopiero potem noszą materiały i stawiają budynek. Czas wyrównania jest wliczony w czas, po którym budynek staje się gotowy (rozdz. {{ref:budowa}}).

## Oczyszczanie terenu {#czyszczenie}

Od Fazy 9E (przełącznik `settings.clearing`, w grze włączony; `?clearing=0` przywraca dawny zakaz) wolno stawiać budynki na polach z **drzewami** i z **bagnem**. Budowniczowie wykonują to w etapie 0 placu, razem z wyrównywaniem terenu: najpierw ścinają drzewa (z siekierą), potem osuszają bagno (z kilofem). Koszt czasu to {{v:Data.RULES.clear.tree}} min pracy na drzewo i {{v:Data.RULES.clear.bog}} min na pole bagna (`World.clearOf`); sumuje się z czasem wyrównania i dzieli między przydzielonych budowniczych. Podgląd w trybie budowy pokazuje „+X min czyszczenia (N drzew, M pól bagna)”. Drzewa znikają z placu po kolei, w miarę postępu etapu 0, a po jego końcu pole jest czyste.

Nadal blokują: woda (morze, jezioro, **rzeka**), klify, wydmy, ruchome piaski i głęboki śnieg; złoże pozostaje zarezerwowane dla pasującej kopalni. Dekoracyjne krzaki i kępy trawy nie blokowały zabudowy wcześniej i nie blokują jej teraz — znikają, gdy pole zajmie plac.

> [!decyzja] **Budowa wokół złóż** (decyzja użytkownika, Faza 9E, po uwadze, że złoża są obrośnięte lasem): zamiast zakazu — oczyszczanie przez budowniczych za cenę dłuższej budowy. Czasy zatwierdził użytkownik.

## Wymagania budynków {#wymagania}

Każdy budynek może mieć pole `req` opisujące wymóg terenowy. Sprawdzenie odbywa się w `canPlace` na obrysie powiększonym o jednopolowy pierścień sąsiedztwa:

Tabela: Wymagania terenowe budynków (pole `req` w `Data.BUILDINGS`)
| Wymóg | Co sprawdza gra | Budynki w grze | Komunikat przy braku |
|---|---|---|---|
| `deposit:<rodzaj>` | złoże tego rodzaju na co najmniej jednym polu obrysu | kopalnie i kamieniołom (Frankowie, Saraceni, Wikingowie) | „Wymaga złoża (…)” |
| `shore` | morze, jezioro lub lód w obrysie albo pierścieniu | Chata rybaka (Wikingowie) | „Wymaga brzegu morza lub jeziora” |
| `waterEdge` | morze w obrysie albo pierścieniu, gdy budynek nie ma stref wody | żaden budynek (dawny wymóg Przystani i Okrętu zastąpiły strefy, sekcja {{ref:obrot}}) | „Wymaga bezpośredniego dostępu do morza” |
| `forest` | co najmniej 4 drzewa w obrysie i pierścieniu | żaden budynek (kod istnieje, lecz nie jest używany) | „Wymaga lasu w pobliżu” |

Kilka reguł stoi poza tabelą. Złoże jest zarezerwowane: pole ze złożem może zająć tylko kopalnia pasującego rodzaju (pozostałe budynki dostają „Złoże — miejsce tylko na kopalnię”). Chata rybaka ma dodatkowy limit `settings.shoreSpots` (domyślnie 6) miejsc na wybrzeżu. Okręt wymaga, by w osadzie stała już gotowa Przystań, a jego kadłub styka się bokiem z molem tej Przystani. Chata myśliwego nie ma żadnego wymogu terenowego — zwierzyna jest liczona w łowisku, a nie przez las (rozdz. {{ref:fauna}}).

> [!uwaga] Przystań i Okręt wciąż mają w katalogu `req: 'waterEdge'`, ale ten warunek w `canPlace` jest pomijany, gdy budynek ma strefy (`Data.zonesOf` zwraca obiekt), a obie jednostki je mają. Wymóg działa więc tylko dla hipotetycznego budynku bez stref.

> [!pulapka] Flaga `forest` w katalogu budynków (Słowianie: Chata zbieracza, Barć, Chata łowcy futer) wpływa na plon, a nie na miejsce budowy: plon to × min(1, drzewa / próg nacji). Wymóg `req: 'forest'` istnieje w `canPlace`, ale żaden budynek go nie ustawia, więc te budynki da się postawić także bez lasu.

## Pola niebudowlane i zajęte {#pola}

Pole obrysu musi spełniać trzy warunki: być lądem (`h = 1`), nie być zajęte (`occup`) i nie mieć drzewa. Cechy `bog`, `dune`, `quick`, `cliff` i `drift` są wykluczone (`Terrain.BLOCK_K`), a odpowiedni komunikat podaje powód (np. „Ruchome piaski!”). Wody i skał nie da się zabudować. Oprócz tego musi istnieć dojście: obrys z pierścieniem musi stykać się z obszarem osiągalnym dla pieszych (`Terrain.ringReachable`), inaczej budynek odcinałby się od reszty osady („Brak dojścia”).

Rezerwacja pól działa na dwóch poziomach. Generator mapy (`MapGen`, funkcja `reserve`) zaznacza pola pod Dwór i pod pierwsze budynki (`pad = 1`), a drzewa tam nie odrastają. Gdy plac zostaje otwarty, `World.occupy` wpisuje jego `uid` w pola `occup` i zdejmuje z nich drogę; `World.release` zwalnia je po anulowaniu lub zakończeniu budowy. Dwór (4×4) nie może być ani zbudowany, ani zburzony.

## Anulowanie placu {#anulowanie}

Anulowanie (`Build.cancel(site)`) jest możliwe przed końcem budowy. Gra zwraca to, co dowieziono na plac: każdy dostarczony towar wraca do magazynu, złoto zapłacone przy otwarciu placu wraca do `res.złoto`, a pola obrysu zostają zwolnione. Statystyka zużytych desek (`stats.planksSpent`) jest korygowana o zwrócone deski. Materiał jeszcze niedowieziony nie jest liczony.

## Obrót budynków i strefy ląd/woda {#obrot}

Każdy budynek i plac budowy może mieć pole `rot` (kierunek 0–3; brak pola oznacza 0). Obrys i wejście zależą od kierunku (`Data.footprint(id, fid, rot)`, `Data.entrance(id, fid, rot)`), a sprite i wpis w katalogu mają klucz `id` (kierunek 0) albo `id@rot`. Dostępne kierunki podaje `Data.rotsOf(id, fid)` z katalogu sprite'ów: dziś **cztery mają tylko Przystań i Okręt**, pozostałe budynki wyłącznie kierunek 0. Obracanie reszty w czterech kierunkach jest osobnym, dużym etapem grafiki (sprite'y modelują tylko ściany południową i wschodnią, więc trzeba dorysować tylne ściany), patrz plan prac.

**Strefy.** `Data.zonesOf(id, fid, rot)` dzieli obrys na pola lądu i wody (współrzędne od północnego rogu obrysu) albo zwraca `null`, gdy budynek stoi w całości na lądzie:

- **Przystań** ma obrys 4×2 (kierunki 0 i 2) albo 2×4 (1 i 3): szopa na 2 polach **lądu** na jednym krańcu i molo na 6 polach **wody morza** (3 pola długości) w stronę kierunku: 0 na wschód, 1 na południe, 2 na zachód, 3 na północ. Szopa leży na przeciwległym krańcu. Pola mola muszą być wolną wodą morza, pola szopy wolnym lądem jak dla innych budynków.
- **Okręt** (4×2 albo 2×4, dziób w kierunku 0–3) stoi w całości na wolnej wodzie morza i przynajmniej jednym polem styka się bokiem z molem istniejącej, gotowej Przystani (`World.dockPierTiles()`). Jest jedynym wyjątkiem od twardej przerwy: może stać tuż przy molu.

Komunikaty: „Szopa Przystani musi stać na wolnym lądzie”, „Molo musi stać na wolnej wodzie morza”, „Okręt stoi tylko na wolnej wodzie morza”, „Okręt musi stanąć przy molo Przystani”, „Okręt wymaga Przystani”, a dla budynku bez wariantu „Ten budynek nie obraca się w tym kierunku”. Plac i gotowy budynek zajmują (`occup`) także pola wody; wyrównanie terenu (`levelOf`) liczy tylko ląd. Wejście Przystani to najbliższe wolne pole lądu przy szopie (`Walkers.doorOf`), a Okręt na wyprawie odpływa w stronę dziobu, jeśli tam jest woda.

**Sterowanie.** W trybie budowy obracasz budynek klawiszem R (Shift+R w przeciwną stronę) albo przyciskiem „⟳ Obróć (R)”, widocznym tylko dla budynków, które się obracają, także na telefonie. Dopóki gracz nie obróci ręcznie, kierunek dobiera się sam pod kursorem (pierwszy dozwolony), więc molo zwykle samo ustawia się ku wodzie; podgląd zaznacza pola wody na niebiesko. Bot (`TestBots.findPlace`) zwraca także `rot` i na 100 mapach nadmorskich (4 klimaty po 25 ziaren) zawsze znajduje miejsce na Przystań i Okręt.

## Funkcje i dane {#funkcje}

- `World.canPlace(id, x, y)` — walidacja (powody odmowy, przerwa, wymagania `req`, dojście);
- `World.crowdOf(id, x, y)` — kara za ciasną zabudowę (`n`, `pct`);
- `World.levelOf(id, x, y)` — wyrównanie terenu (`target`, `need`, `minutes`);
- `Build.enqueue` / `Build.cancel` — otwarcie i anulowanie placu, rezerwacja pól przez `World.occupy` / `World.release`;
- `Data.RULES` — wszystkie stałe zabudowy: `gap`, `crowd`, `level`, `logistics` (sprawność dojścia do Składu).

> [!kod] Stałe czasu budowy `Build.BASE_WORK` = 1,0 min, `Build.PER_PIECE` = 0,1 min na sztukę i `Build.PIECE_MIN` = 0,2 min noszenia są w module `Build`, nie w `Data.RULES`. Czas pracy placu to `(BASE_WORK + PER_PIECE × sztuk) × (1 + pct)`.
