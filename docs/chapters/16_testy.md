# Testy i jakość {#testy}

Gra jest silnikiem ekonomicznym z dużą liczbą współzależnych liczb, więc **główną ochroną jakości są testy liczbowe**, a nie ręczne klikanie. Cały zestaw jest w katalogu `tools/` (rozdz. {{ref:skrypty}}) i dzieli się na trzy warstwy.

## Trzy warstwy testów {#warstwy-testow}

Tabela: Warstwy testów
| Warstwa | Narzędzie | Co chroni | Czas |
|---|---|---|---|
| **Silnik** (headless) | `tools/headless.js` ładuje cały skrypt gry w `node:vm` z atrapami DOM i eksportuje moduły | ekonomię, haracz, zdarzenia, teren, ścieżki, fauna, drogi, logistykę, podgląd mapy | sekundy do ok. 5 min (`normal.js`) |
| **Przeglądarka** (Playwright + Chromium) | `tools/browser_*.js` | UI, dotyk, wypiek sprite'ów, start każdej kombinacji klimat × typ, menu i Piaskownicę, brak błędów JS, FPS | ok. 0,5–3 min każdy |
| **Regresja** (porównanie z wzorcem) | wzorce `baselineN_*.txt` (w Fazie 10 trafią do `tools/baseline/` wraz z `tools/regress.sh`) | **identyczność** wyników liczbowych po zmianach niezwiązanych z ekonomią | porównanie `diff` |

**Zasada nadrzędna:** zmiana, która nie ma zmieniać ekonomii, musi dać **bajt w bajt ten sam wynik** `scenarios.js` (58 scenariuszy), `normal.js`, `mapstats.js`, `raids.js` i `store.js`. Dlatego nowe mechaniki (logistyka, fauna, drogi, a docelowo fizyczna logistyka) są za przełącznikami `settings.*`, wyłączonymi w testach specyfikacji (rozdz. {{ref:settings}}), a każda z nich ma własny test parytetu „wyłączona = jak dawniej”.

## Boty testowe {#boty}

`TestBots` rozgrywa grę bez człowieka, w trzech wariantach (rozdz. {{ref:b-normalna}}):

- **R** — odtwarza przepis budowy nacji (`RECIPE`) z szumem ε (nieuwaga gracza: pominięte lub spóźnione kroki),
- **D** — ten sam przepis z opóźnieniem decyzji (co 2 min),
- **N** — reaktywny, bez przepisu: patrzy na brakujące wejścia i stan żywności.

Boty ustawiają budynki przez `TestBots.findPlace` (miejsce spełniające zasady zabudowy i wyrównywania terenu, rozdz. {{ref:zabudowa}}); Chata myśliwego jest stawiana przy lesie, choć gra tego nie wymaga — dzięki temu wyniki wzorca zostają nietknięte po zmianie reguły „myśliwy nie wymaga lasu”.

## Scenariusze i niezmienniki {#scenariusze-niezmienniki}

`tools/scenarios.js` uruchamia **58 scenariuszy akceptacyjnych** specyfikacji: normalną grę, warunki brzegowe (np. brak narzędzi, pełne magazyny, zero ludzi do pracy) i kryzysy (rozdz. {{ref:kryzysy}}). W **każdym ticku** każdego scenariusza sprawdzane są niezmienniki:

- zapasy nie są ujemne i nie przekraczają limitu towaru (wyjątek: start 14 narzędzi przy limicie 10);
- ludność ≥ 10 w każdej chwili, liczba narzędzi ≥ 0;
- co najmniej 2 czynnych budowniczych;
- załoga na wyprawie + obsadzeni pracownicy ≤ ludność (+ 2 zapasu na zaokrąglenia);
- ceny Saracenów leżą na krzywej rynku (kadzidło 0,9–4,2, tkanina 0,9–3,6, ceramika 0,6–2,4; ×1,2 z Karawanseraju — rozdz. {{ref:ekonomia}}).

Wyniki scenariuszy i botów publikuje aneks {{ref:wyniki-gry}} (odświeżane przez `docs/collect.js`).

## Testy modułów {#testy-modulow}

Tabela: Co sprawdza test każdego modułu świata
| Test | Moduł | Kluczowe sprawdzenia |
|---|---|---|
| `terrain.js` | `MapGen`, `Terrain` | 4 nacje × 4 klimaty × 6 typów × ziarna: niezmienniki pól, łączność lądu, liczba drzew i złóż, miejsce pod zabudowę, brody, brzeg Wikingów |
| `mapstats.js` | `MapGen` | cele liczby drzew (300/150/450/300), złoża, brzeg |
| `path.js` | `Path` | koszt = niezależny Dijkstra, trasa tylko po polach przechodnich, brak ścinania rogów, brak RNG, determinizm, szybkość |
| `walkers.js` | `Walkers` | postacie tylko na wolnych polach, nosiciele dochodzą do drzwi, **logika identyczna z Walkers i bez** (cień symulacji) |
| `roads.js` | `Roads` | koszt tylko za nowe pola, odmowy, zdejmowanie drogi przez budowę, preferowanie drogi przez A\*, JSON |
| `spacing.js`, `leveling.js` | `World.canPlace`, `Build` | przerwa 1 pole, strefa kary 2–3, wyrównywanie stoków, wzgórza decyzyjne |
| `logistics.js` | `Logistics` | blisko Składu bez kary, daleko spadek do minimum, drogi i Skład pomagają, ekonomia produkuje mniej |
| `fauna.js` | `Fauna` | zaludnienie map, pozycje tylko na wolnych polach, zero RNG globalnego, determinizm, snapshot, parytet z fauną |
| `footprints.js` | obrysy `w×h` | zgodność z katalogiem sprite'ów, zajętość i zwolnienie pól, złoża pod kopalnią, place budowy |
| `minimap.js` | `Minimap` | opis i podsumowanie 24 kombinacji klimat × typ, rysunek na atrapie kanwy (każde pole = 1 prostokąt, ramka Dworu), **podgląd = mapa gry** (to samo ziarno → te same pola), mapa niepoprawna i mapa bez `meta` |
| `workers.js` | `Workers`, `Walkers` | jeden robotnik na obsadzony budynek z rolą, **nikt nie stoi bezczynnie > 1 min**, pętla wejście → praca → wyjście do Składu, budowniczowie bez placu czekają przy Dworze, widoczni obywatele = wolna ludność, logika identyczna z robotnikami i bez, zero RNG i zero śladów w stanie gry |
| `raids.js`, `store.js` | `Events`, `Economy` | strata średnia po 24 ziarnach ze Strażnicami i bez; wpływ Składu na pojemność koszyka Słowian |

## Testy w przeglądarce {#testy-przegladarka}

| Test | Zakres |
|---|---|
| `browser_ui.js` | przepływy UI dla 4 nacji: budowa kliknięciem, karta budynku, haracz (preset i poziom 1–11), przełączniki, Doradca, żywa pętla gry |
| `browser_play.js` | bot buduje osadę, zrzuty z Doradcą i kartą budynku |
| `browser_mobile.js` | widok telefonu (dotyk): HUD, ⚙ Więcej, Doradca |
| `browser_sprites.js` | wypiek sprite'ów każdej nacji: wszystkie budynki, obrysy = katalog, niepuste warstwy, czas |
| `browser_terrain.js` | każda kombinacja klimat × typ startuje przez `?play=…`: brak błędów JS, wypieczone chunki, FPS |
| `browser_fauna.js` | zaludnienie, myśliwy przechodzi fazy wyprawy, strzała w locie, FPS z fauną vs bez |
| `browser_menu.js` | **menu główne** (tylko Piaskownica aktywna, klawiatura, hover), **Piaskownica** (przepływ nacja → klimat → typ → Start dla każdej nacji; mapa gry = meta podglądu; blokada Wikingów na nadmorskiej; pamięć wyboru w `localStorage`), **☰ Menu** i priorytet Esc, „Nowa mapa” i „Menu główne”, `?menu=0`, `?play=`, telefon 390 × 844 (bez poziomego przewijania), 0 błędów JS |
| `browser_workers.js` | robotnicy na ekranie: czynności, narzędzia i ładunki każdej nacji, `?workers=0` (dawne cienie), FPS z robotnikami ≥ 85% FPS bez nich, 0 błędów JS |

Testy przeglądarkowe czekają na `window.__gameReady === true` (gra startuje po wypieku sprite'ów) i — poza `browser_menu.js` — wchodzą do gry przez `?menu=0` lub `?play=`, żeby nie zależeć od menu (rozdz. {{ref:parametry-adresu}}).

## Bramka każdej fazy {#bramka}

Każda faza prac (rozdz. {{ref:decyzje}}) kończy się tym samym zestawem: (1) testy modułu nowej fazy i regresja headless — `scenarios` identycznie z wzorcem, `normal`, `mapstats`, `raids`, `store`, `fauna`, `terrain`, `path`, `walkers`, `roads`, `spacing`, `leveling`, `logistics`, `footprints`, `minimap`; (2) testy przeglądarkowe; (3) zrzuty zmienianych ekranów; (4) **aktualizacja tej dokumentacji** (aneks {{ref:aktualizacja}}); (5) nowy wzorzec regresji; (6) commit i push; (7) wersja WIP do przeklikania przez użytkownika.

## Wydajność {#wydajnosc}

Budżety, których pilnują testy: wypiek sprite'ów nacji (`browser_sprites.js`), FPS widoku (`browser_terrain.js --fps`), `Fauna.tick` ≤ 0,25 ms, zwierzęta ≤ ~100 naraz, FPS z fauną ≥ 85% FPS bez niej, A\* na 48 × 48 w milisekundach (`path.js`). Plan Fazy 9B dodaje budżet FPS ≥ 85% sprzed zmian dla fizycznej logistyki (aneks {{ref:aneks-fizyka}}).

## Trudność i krzywa nauki {#trudnosc}

**Skala nacji.** Gra ma kampanię „w gwiazdkach”: **Słowianie ★☆☆☆ (nacja wprowadzająca)**, **Frankowie ★★☆☆ (najłatwiejsza z dotychczasowych)**, **Wikingowie ★★★☆ (etap średni: miód, broń, wyprawy)**, **Saraceni ★★★★ (etap późny: handel, woda, napady)**. Kolejność odpowiada liczbie zasad, które gracz musi opanować naraz: Słowianie to zbieractwo i koszyk daniny, Frankowie dokładają łańcuch metalurgii i żołd, Wikingowie wyprawy z załogą, a Saraceni rynek z nasycaniem cen i napady na karawanę.

**Tempo i presja.** Pierwszy termin haraczu pada po {{v:Tribute.FIRST_TERM.franks}} / {{v:Tribute.FIRST_TERM.saracens}} / {{v:Tribute.FIRST_TERM.vikings}} / {{v:Tribute.FIRST_TERM.slavs}} minutach (Frankowie / Saraceni / Wikingowie / Słowianie), potem co 15 min. Presety (Łatwy poz. 3, Normalny 5–6, Trudny 6–8, Mistrz 7–12) skalują presję tak, by w każdej nacji podobny odsetek casualowych graczy przechodził dany poziom (rozdz. {{ref:presety}}).

**Krzywa nauki** — co gracz odkrywa i w jakiej kolejności:

1. *0–10 min:* wybór miejsca pod pierwsze budynki (przerwa 1 pole, strefa kary, wyrównywanie stoku), deski jako wąskie gardło; pierwsza Chata drwala jest darmowa.
2. *10–30 min:* żywność (łańcuch, P_max i brama imigracji 110%), obsada z priorytetem jedzenia, narzędzia (Targ lub kuźnia), Skład i droga jako lek na odległości.
3. *30–60 min:* haracz — pierwszy termin, Koszary 30 min wcześniej (Frankowie), pierwsza wyprawa lub rynek; pułapka podatku 3.
4. *Później:* popularność i dobrobyt, napady, zagospodarowanie złóż, rozbudowa ludności ponad P_max.

**Pułapki, które gra wykrywa i opisuje w Doradcy:** podatek 3 (popularność < 45 zamraża imigrację), brak Koszar przed terminem, brak narzędzia w kolejce, magazyn pełny przy braku Składu, producent daleko od Dworu, przetrzebiona zwierzyna w łowisku Chaty myśliwego. Ich zestaw służy też jako lista kontrolna przy ocenie, czy nowy mechanizm nie podnosi trudności ponad miarę.

**Zmiany, które trudność podnoszą, trzeba mierzyć.** Dlatego fizyczna logistyka (Faza 9B) ma jako bramkę bilans botów R/D/N: co najmniej 90% wyniku bazowego i zasadę „tylko na niekorzyść”, a wszystkie wyniki trafiają do rozdz. {{ref:b-normalna}}.
