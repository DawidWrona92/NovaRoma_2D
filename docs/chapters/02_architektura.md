# Architektura programu {#architektura}

## Jeden plik, wiele modułów {#moduly}

Cały kod gry mieści się w jednym znaczniku `<script>` pliku `Nova_Roma.html`. Moduły to wyrażenia IIFE (`const Economy = (() => { … return { … }; })();`) ułożone w kolejności zależności — bez bundlera i bez `import`. Każdy moduł eksportuje niewielkie API, a pozostałe moduły wołają je przez nazwę (`World.state()`, `Economy.tick(dt)`…). Dwa bloki — **`SPRITE_META`** (katalog obrysów budynków) i **`Sprites`** (silnik grafiki) — są *generowane* z katalogu `prototyp/` skryptem `node prototyp/build_game.js` i nie wolno ich edytować ręcznie (rozdz. {{ref:grafika}}).

{{tabela:moduly}}

Warstwy modułów pokazuje rysunek poniżej. Najważniejsza reguła: **logika gry nie zna renderu** — `World`, `Economy`, `Build`, `Tribute`, `Events` i `Fauna` operują wyłącznie na stanie `World.state()` i mogą działać bez przeglądarki (testy headless ładują cały plik w `node:vm` z atrapami DOM). Render (`Game`), interfejs (`UI`, `BuildMode`, `Advisor`) i ruch widocznych postaci (`Walkers`) tylko czytają stan.

{{diagram:warstwy}}

## Zależności między modułami {#zaleznosci}

Macierz poniżej liczona jest z kodu: dla każdej pary modułów zlicza odwołania typu `Moduł.` w tekście (po usunięciu komentarzy). Wiersz = moduł używający, kolumna = moduł używany. Pozwala szybko zobaczyć, co trzeba przetestować po zmianie danego modułu (kolumna) i czego dany moduł potrzebuje (wiersz).

{{tabela:zaleznosci}}

{{tabela:zaleznosci_lista}}

> [!kod] Zależności „w dół” są jawne: `Economy` używa `World`, `Data`, `Fauna.gameMult` i `Logistics.effOf`; `World` woła `Economy`, `Build`, `Tribute`, `Events` i `Fauna` tylko w `World.tick`. Jedyna zależność „w górę” to `Economy → Fauna/Logistics`, ale tylko przez wąskie funkcje czytające stan (mnożniki plonu), które przy wyłączonych przełącznikach zwracają 1.

## Stan gry {#stan-gry}

Cały stan gry mieści się w jednym obiekcie `World.state()`. Jest **JSON-owy** (bez referencji obiekt → obiekt; powiązania przez `uid`), dlatego `TestBots.snapshot()` i `restore()` klonują go przez `JSON.parse(JSON.stringify(…))` — na tym opiera się „odtwarzalność” testów (rozdz. {{ref:testy}}). Pola robocze budynków (`st`, `eff`, `logi`, `huntAcc`…) są częścią budynku i przeżywają snapshot.

{{tabela:stan_gry}}

Kafel mapy (`map.tiles[i]`) ma pola: `h` (0 woda / 1 ląd / 2 skała), `e` (wysokość 1–4; woda 0), `wk` (rodzaj wody: `sea`, `lake`, `river`, `ford`, `ice`), `k` (cecha: `bog`, `dune`, `quick`, `oasis`, `cliff`, `drift`), `trees` (0–3), `deposit` (`stone`, `iron`, `coal`, `clay`, `peat`), `occup` (uid budynku lub placu), `road` (0/1) oraz `pad` (pole zarezerwowane przez generator — drzewa tu nie odrastają).

## Pętla gry i kolejność ticku {#tick}

`Game.loop` jest wołana z `requestAnimationFrame`. Czas rzeczywisty (ograniczony do 0,05 s na klatkę) przeliczany jest na czas gry: `gameDt = realDt / secPerMin × speed`, gdzie `secPerMin` = {{v:Data.RULES.clock.secPerMin}} s (`Data.RULES.clock.secPerMin`; parametr adresu `?tempo=N` go zastępuje). Przy prędkości ×1 jedna minuta gry trwa więc {{v:Data.RULES.clock.secPerMin}} s realnych; przycisk prędkości przełącza ×{{v:Data.RULES.clock.speeds.join(' → ×')}}. Pauza to `speed = 0` ustawiane przez menu gry. Dla każdej klatki:

1. `World.tick(gameDt)` — logika (kolejność poniżej),
2. `Walkers.update(gameDt)` — ruch widocznych postaci po ścieżkach,
3. `UI.refreshHUD()` — co ¼ minuty gry,
4. `render(t)` — rysowanie.

W `World.tick` moduły wołane są **zawsze w tej samej kolejności**: `Economy` → `Build` → `Tribute` → `Events` → `Fauna`, a potem aktualizowany jest „cień symulacji” (obywatele i nosiciele). Kolejność ma znaczenie: `Build` zna obsadę wyliczoną przez `Economy`, a `Tribute` korzysta z ludności i zapasów po bieżącej produkcji.

{{diagram:tick}}

> [!kod] Testy botów wołają `World.tick(0.1)` w pętli (krok 0,1 min — tyle samo, ile w symulatorze specyfikacji). W grze `dt` jest zmienny; model przepływowy jest od kroku niezależny (akumulatory `treeFrac`, `plantFrac`, `immigrantTimer` itd. zbierają ułamki).

## Losowość i determinizm {#rng}

Gra ma **jeden globalny generator** `RNG` (mulberry32) i kilka lokalnych PRNG ze stanem w danych. Rozdział odpowiedzialności jest sztywny, bo każdy dodatkowy `RNG.next()` w logice zmieniłby przebieg gier w testach specyfikacji:

Tabela: Kto używa losowości
| Moduł | Źródło losowości | Uwagi |
|---|---|---|
| `MapGen.generate` | globalny `RNG` (zasiewany ziarnem mapy) | stary generator: morze, skały, drzewa, złoża; zasiewa strumień — `World.init` zasiewa go ponownie |
| `Terrain.apply` | własny PRNG `Terrain.prng(ziarno)` | nie dotyka globalnego `RNG` (test `terrain.js`) |
| `World.takeTrees`, `World.addTree`, obywatele i nosiciele (cień) | globalny `RNG` | to jest „przeplot RNG” logiki, który testy specyfikacji zakładają |
| `Events` (napady na karawanę) | globalny `RNG` | jedyne losowe zdarzenie ekonomii (Saraceni) |
| `Path`, `Roads`, `Logistics`, `Walkers` | brak | deterministyczne z natury |
| `Fauna` | własne mulberry32, stan w `state.fauna.rs` | liczba całkowita w JSON; zero wywołań `RNG` (test `fauna.js`) |
| Render (`Game`) | własny `fxRand`, ziarna per obiekt | wygląd, nie logika |
| Prototyp grafiki (`Sprites`) | mulberry32 per tekstura / sprite | deterministyczne — te same wypieki za każdym razem |

Skutek: ta sama nacja, klimat, typ i ziarno dają tę samą mapę; ta sama kolejność decyzji bota daje ten sam wynik; włączenie fauny, logistyki i dróg nie zmienia strumienia `RNG`, więc scenariusze specyfikacji pozostają bez zmian przy wyłączonych przełącznikach.

## Cień symulacji {#cien}

Obywatele i nosiciele w `World.tick` poruszają się po prostych liniach i losują cele z globalnego `RNG`. Chcemy jednak, by na ekranie ludzie chodzili po ścieżkach (omijali wodę, klify i budynki), nie zmieniając tego strumienia. Rozwiązanie to **cień symulacji**: logika zostaje jak była („cień”), a moduł `Walkers` utrzymuje osobne, widoczne postacie, które dążą do celów cienia po trasach `Path` i same niczego nie losują. Stan `Walkers` żyje **poza stanem gry** (nie trafia do snapshotu), a testy sprawdzają, że stan logiki z `Walkers` i bez niego jest identyczny. Ten sam wzorzec zastosowano dla pozycji myśliwego (czysta funkcja czasu gry) i animacji w renderze.

## Przełączniki scenariusza {#settings}

`state.settings` zawiera przełączniki, które w testach specyfikacji mają wartości „neutralne”, a w grze ustawia je `UI.startGame`:

Tabela: Przełączniki w `state.settings`
| Ustawienie | W testach | W grze | Znaczenie |
|---|---|---|---|
| `raids` | `true` | `true` (przycisk 🏴, tylko Saraceni) | napady na karawanę (rozdz. {{ref:zdarzenia}}) |
| `voyageGuard` | `true` | `true` (przycisk ⛵ Zapas załogi) | wysyłka Wikingów zostawia ≥ 90% robotników |
| `shoreSpots` | `6` | `6` | maks. liczba Chat rybaka na brzegu (parametr generatora map) |
| `logistics` | `false` | `true` (`?logistics=0` wyłącza; przycisk 🚚) | sprawność logistyczna producentów (rozdz. {{ref:ruch}}) |
| `fauna` | `false` | `true` (`?fauna=0` wyłącza) | zwierzęta i plon Chaty myśliwego zależny od zwierzyny (rozdz. {{ref:fauna}}) |

Wzorzec jest jednolity: stan domyślny „neutralny” w literale stanu i w `World.init` (żeby testy ze specyfikacji nie zmieniły ani jednej liczby), włączenie przez `UI.startGame`, a funkcja pomocnicza (`Logistics.effOf`, `Fauna.gameMult`) zwraca 1 przy wyłączeniu.

## Wejście do gry: `UI.startGame` {#startgame}

Jedynym wejściem do rozgrywki jest `UI.startGame(fid, opts)` (jednorazowe: flaga `gameStarted`). Używają go: karta nacji na ekranie wyboru, skrót `?play=`, testy przeglądarkowe i — w fazie 9 — Piaskownica. Kolejność kroków: wypiek sprite'ów wybranej nacji i klimatu (`Sprites.bake`) → `World.init(fid, opts)` (mapa, zasoby, Dwór, 14 obywateli) → ustawienie kamery na Dwór → budowa paska budowy → wypiek podłoża mapy w chunkach (`Game.initGround`) → podpięcie przycisków HUD i przełączników → `Fauna.enable` → `Game.start()` → `window.__gameReady = true` (znacznik dla testów).
