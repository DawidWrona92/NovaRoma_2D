# Decyzje projektowe i historia {#decyzje}

Rozdział zbiera **decyzje, które nie wynikają z kodu ani ze specyfikacji ekonomii**: zamówienia użytkownika, wybory projektowe i ich uzasadnienia. Dzięki niemu kolejne zmiany nie cofają przez przypadek czegoś, co było świadomym wyborem. Do każdej decyzji podano rozdział, który ją opisuje.

## Historia prac {#historia}

Tabela: Fazy prac i ich efekty (commity w gałęzi `claude/festive-meitner-ejo4l1`)
| Faza | Efekt | Commit |
|---|---|---|
| Etapy 1–6 (autor) | ekonomia przepływowa, haracz, zdarzenia, Słowianie, Doradca, boty testowe i scenariusze wg spec. v3.6 | `361cd3d`, `51227c7`, `a2ad568` |
| Prototyp grafiki | proceduralne sprite'y w stylu Settlers / Twierdza: 88 budynków 4 nacji, ludzie, przyroda | `d04fcc4` … `f653211` |
| 0–4 | wzorzec testów, silnik sprite'ów w grze, obrysy `w×h`, Dwór 4×4 | `fd38ee8` |
| 5 | teren v2: 4 klimaty × 6 typów map, podłoże w chunkach | `7e6d575`, `c4beb2a` |
| 6, 6b, 6c, 7 | A\* i piesi, drogi, przerwa i kara za ciasną zabudowę, logistyka, wyrównywanie terenu | `b8b4cb7`, `8466112`, `b5ea3af` |
| 8 | fauna (18 gatunków) i polowanie z łukiem | `fd9aefb`, `d09c70a`, `ee1271d` |
| Dokumentacja | generator PDF, rozdziały, analiza fizycznej logistyki | `ee4eaea`, `231dc77`, `8484777` |
| 9 | menu główne RTS, Piaskownica, ☰ Menu, podgląd mapy | `cf37876` |
| 9B-0, 9B-1 | tempo gry 12 s/min; role i czynności postaci (`Workers`) | `c2f1c36`, `c158a7c` |
| 9B-2 … 9B-4 | fizyczna sprawność transportu, drwal, budowniczowie, karawany, okręty | (ten etap) |
| 9B-5 | strojenie: karawana kosmetyczna (złoto od razu), L_ref 5, histereza robotników (`tools/workers.js` 60/60), bramka bilansu 75% bazowej i 85% krzywej | `ce00013` |
| 9C | obrót budynków, Przystań i Okręt na wodzie (strefy ląd/woda), kopalnie w górach, fauna unikająca miasta, artefakt, ekran diagnostyczny startu | `693f686` |
| 9D-1 | rozmiar mapy 48 / 72 / 96 do wyboru w Piaskownicy (domyślnie Średnia 72) | `e9b8312` |
| 9E | poprawki z gry kolegów: Tartak i Leśnik, złoża kamienia, karta postaci, opis Targu, oczyszczanie terenu | (ten etap) |
| 9D-2, 9D-3 | Osada (druga wioska) i Składy wyspecjalizowane (górniczy, drzewny); węzły logistyczne `hub` | `a7b37a3` |

Stan i plan dalszych prac: `docs/PLAN.md` (kopia w repozytorium).

## Decyzje użytkownika (wiążące) {#decyzje-uzytkownika}

Tabela: Decyzje użytkownika
| Decyzja | Skutek w grze | Rozdz. |
|---|---|---|
| **Przerwa między budynkami = 1 pole** (twardy zakaz stawiania „ściana w ścianę”) | `World.canPlace` odmawia „Za blisko innego budynku — zostaw wolne pole (ulicę)” | {{ref:zabudowa}} |
| **Strefa wydłużonego czasu budowy** = pola w odległości 2 i 3 od budynku (+10% za sąsiada, maks. +40%), **widoczna przed wyborem miejsca** | kara `crowd` w placu budowy; podświetlenie w trybie budowy | {{ref:zabudowa}}, {{ref:budowa}} |
| **Drogi** przyspieszają ruch, A\* je preferuje | koszt pola 0,6, prędkość ×1,6, 1 deska za pole | {{ref:drogi}} |
| **Odpoczynek przed domem**: ludzie siadają na krześle (kołysanie, rozciąganie, popijanie); **bez krzeseł w sprite'ach budynków** | rekwizyt rysowany pod postacią; robotnicy po cyklu i część wolnych mieszkańców przy Chatach i Osadach; czysto wizualne | {{ref:odpoczynek}} |
| **Mury obronne** (prośba znajomych; tylko wygląd i punkty wejścia/wyjścia, bez wartości militarnej); wygląd jak mury zamkowe nacji, palisada u Wikingów i Słowian; **brama** = 1 pole, zawsze otwarta, droższa od muru, oś z sąsiadów | `Walls`, `tile.wall` 1/2/3, 16 + 2 sprite'y na nację; mur nie odcina budynków od Dworu, pierścień wymaga bramy, w zamkniętym terenie bez bramy nie wolno budować | {{ref:mury}} |
| **Wzgórza do wyrównania** mają własną grafikę i **nie utrudniają startu** | obszar startowy ≤ 13,5 pola od Dworu jest płaski; wyrównywanie wydłuża budowę | {{ref:teren}} |
| **Chata myśliwego nie wymaga lasu** („myśliwy i tak poluje na zwierzęta”) | plon = × min(1, zwierzyna w łowisku / próg); boty nadal stawiają ją przy lesie, więc wzorce regresji bez zmian | {{ref:fauna}} |
| **Menu główne w stylu RTS + Piaskownica** (nacja, klimat, typ mapy) | moduł `Menu`, `Minimap`, ☰ Menu w grze | {{ref:menu}} |
| **Ożywienie ludzi** (po Fazie 9, przed 10 i 11): drwal fizycznie ścina, cieśla niesie deskę, budowniczy dochodzi na plac, karawana idzie na koniec mapy i wraca; drogi ważniejsze, centralny magazyn jeśli pomoże; **bez zepsucia balansu** | Faza 9B: analiza i projekt w aneksie {{ref:aneks-fizyka}} | {{ref:ruch}} |
| **Jedna wspólna dokumentacja PDF** z kodu, dwóch dokumentów ekonomii i decyzji; w repozytorium; aktualizowana po każdym etapie | `docs/` (`node docs/build.js`) | {{ref:aktualizacja}} |
| **Tryb pracy „auto”** — działamy bez dopytywania, po każdej fazie commit, push i wersja WIP do przeklikania | procedura bramki | {{ref:bramka}} |
| **Karawana Saracenów jest kosmetyczna** (jak karawana w Twierdzy): złoto ze sprzedaży wpływa od razu, a towar zbiera się przy Targu i dopiero wtedy wyrusza karawana, która idzie na krawędź mapy i wraca | `settings.physical`: stos `state.caravanPile`, brak opóźnienia złota, karawana nie jest celem napadu | {{ref:karawany}}, {{ref:e-wzorce}} |
| **Surowsze parametry fizyki**: odległość odniesienia `RULES.cycle.ref` 8 → 5 pól („odległość boli mocniej”); bramka bilansu botów ≥ 75% wyniku bazowego i ≥ 85% wyniku z dawną krzywą (bot N tylko informacyjnie) | `Data.RULES.cycle.ref`, `tools/physical.js` | {{ref:fizyka}}, {{ref:e-wyniki}} |
| **Kopalnie (kamień, żelazo, węgiel) tylko w górach**; na mapach bez gór powstaje skalisty masyw (dziś dla Franków) | złoża tylko na polach o wysokości ≥ 3, masyw 17–25 pól od Dworu z własnym generatorem losowym, walidacja wymaga kompletu złóż | {{ref:teren}} |
| **Zwierzęta unikają miasta, są rzadsze i odradzają się w punktach spawnu** | strefa 3,5 pola wokół budynków, liczebność ok. 50% (łowna 70%), `ref` 4, punkty spawnu wałęsających się i ptaków | {{ref:fauna}} |
| **Przystań (szopa na lądzie, molo na wodzie) i Okręt (na wodzie przy molo) z obrotem; docelowo wszystkie budynki w 4 kierunkach** | strefy ląd/woda, `rot` w budynku i placu, klawisz R / przycisk ⟳; port i okręt w 4 kierunkach teraz, reszta jako osobny etap grafiki | {{ref:obrot}} |
| **Rozmiar mapy do wyboru w Piaskownicy**: Mała 48, Średnia 72 (domyślna), Duża 96; testy i 58 scenariuszy specyfikacji zostają na 48 | `MapGen.SIZES`, skalowanie K = N/48 (cechy ×K², odległości ×K, złoża ×K), fauna ×K; `tools/mapsize.js` | {{ref:teren}} |
| **Druga wioska i magazyny „tylko dla kopalń w górach” i „tylko dla lasów w oddalonych kopalniach”: Osada + Składy wyspecjalizowane** (zamiast jednego dużego Składu) | `Data.hub`, `RULES.hub`, `Logistics.distVia`; Osada: miejsca dwóch Chat, +40 szt., bonus 3 pól, baza budowniczych, tylko daleko od Dworu; Skład górniczy i drzewny przyjmują tylko swoje towary (+100 szt.) | {{ref:wezly}} |
| **Muzyka tła generowana w przeglądarce, bez plików dźwiękowych** (cztery utwory 3–4 min, po jednym na nację, wolne i uspokajające; nowy wariant przy każdym obiegu pętli; sterowanie z menu Esc i klawiszem M) | moduł `Music`: kompozytor z własnym PRNG (globalny `RNG` nietknięty), syntezator WebAudio (Karplus–Strong, flet, smyk, bębny, pogłos), start po pierwszym geście, poziom w `localStorage`; `tools/music.js`, `tools/music_analyze.js` | {{ref:muzyka}} |

## Decyzje projektowe (z uzasadnieniem) {#decyzje-projektowe}

**Jeden plik HTML bez zależności.** Cała gra, silnik sprite'ów i dane żyją w `Nova_Roma.html`; wyniki testów i dokumentacja są liczone z tego samego pliku przez `tools/headless.js`. Dzięki temu nie ma rozjazdu „kod a dokumentacja” i można grę uruchomić z dysku bez serwera.

**Cień symulacji (wizualne warstwy bez wpływu na logikę).** Piesi, zwierzęta i myśliwy są rysowane po ścieżkach `Path`, ale logika gry (`World.tick`) niczego od nich nie czyta i niczego z nich nie losuje; własne PRNG (np. `state.fauna.rs`) i globalny `RNG` nietknięty. Efekt: **58 scenariuszy specyfikacji daje te same liczby z fauną, drogami i pieszymi i bez** (rozdz. {{ref:cien}}). To najważniejsza decyzja architektoniczna tej wersji.

**Nowe mechaniki za przełącznikami `settings.*`.** Napady, zapas załogi, miejsca pod rybaków, logistyka i fauna są wyłączone w testach specyfikacji i włączane przez `UI.startGame`; test parytetu każdej z nich dowodzi, że wyłączona zachowuje się jak dawniej (rozdz. {{ref:settings}}). Tak samo ma działać fizyczna logistyka (`settings.physical`, Faza 9B).

**Zasada „tylko na niekorzyść” dla transportu.** Sprawność logistyczna jest ≤ 1: producent blisko Składu lub Dworu nie dostaje premii ponad specyfikację, a daleki traci do 30%. Osada bota bez dróg traci średnio ok. 10% (rozdz. {{ref:sonda}}) — to budżet, którego nie wolno przekroczyć.

**Dwór jest magazynem centralnym.** Zamiast dodawać nowy budynek „Skład centralny” (inspiracja *Knights and Merchants*), przyjęto, że funkcję tę pełni Dwór; Skład zwiększa pojemność i skraca transport lokalnie. „Duży Skład” wróci do rozważenia tylko wtedy, gdy bramki bilansu Fazy 9B tego zażądają (aneks {{ref:aneks-fizyka}}).

**Menu: nawigacja zamiast ponownej inicjalizacji.** „Nowa mapa” i „Menu główne” przeładowują stronę z parametrami adresu zamiast resetować stan w miejscu. Powód: `UI.startGame` jest jednorazowe, a stan modułów UI (ostatni panel, aktywna kategoria, prędkość, otwarty Doradca) i obiekty świata łatwo przeciekają przy ponownym wejściu; przeładowanie jest tańsze i pewniejsze, a gracz traci tylko to, co chce porzucić (rozdz. {{ref:menu-gry}}).

**Wikingowie zablokowani na „Nadmorskiej” w Piaskownicy.** Ich budynki (Przystań, Okręt) wymagają morza, a generator mapy dla nich zawsze zwraca typ nadmorski (`World.init`); gdyby Piaskownica pozwalała wybrać inny, podgląd kłamałby względem gry (rozdz. {{ref:piaskownica}}).

**Podgląd = mapa gry.** `Minimap.generate` woła ten sam `MapGen.generate` z tymi samymi argumentami co `World.init`; test `tools/minimap.js` porównuje pole po polu. Dla map niepoprawnych Piaskownica sama dobiera następne ziarno.

**Bot układa Chatę myśliwego przy lesie.** Po zniesieniu wymogu lasu gra pozwala ją stawiać gdziekolwiek, ale `TestBots.findPlace` (`search(true)` przed `search(false)`) nadal szuka najpierw miejsca z lasem. Gdyby bot zmienił miejsca, zmieniłby się strumień zdarzeń, a razem z nim wszystkie wzorce regresji — a nie jest to zmiana ekonomii.

**Budowniczowie 2–5, domyślnie 3.** Jeden budowniczy wywraca grę (ludność @20 spada do 10–15), trzech odtwarza tempo dawnego modelu; od trzech wzwyż wąskim gardłem są deski, nie ręce (rozdz. {{ref:gang}}).

**Dokumentacja liczona z kodu.** Liczby w tabelach i wykresach (`{{v:…}}`, `{{tabela:…}}`) pochodzą z gry w chwili budowy PDF; tekst opisuje zasady. Dzięki temu zmiana danych wymaga tylko przebudowy dokumentu, a zmiana zasad — poprawy tekstu (aneks {{ref:aktualizacja}}).

**Fizyczna logistyka (Faza 9B) jako przełącznik z bramką bilansu.** Ludzie naprawdę wykonują pracę (rozdz. {{ref:workers}}), a czas marszu wchodzi do ekonomii przez `settings.physical` (rozdz. {{ref:fizyka}}). Zamiast przestrajać ekonomię specyfikacji, model cyklu pracy kalibrowano do niej: ładunek {{v:Data.RULES.cycle.load}} szt. i `L_ref` {{v:Data.RULES.cycle.ref}} pól wybrano tak, by boty miały ≥ 85% wyniku z dawną krzywą i ≥ 75% wyniku bazowego (aneks {{ref:e-wyniki}}); odległość odniesienia zaostrzono z 8 do {{v:Data.RULES.cycle.ref}} pól, bo po pierwszym strojeniu sprawność była zbyt łagodna. Zasada „tylko na niekorzyść” (`eff ≤ 1`) gwarantuje, że nic nie przyspiesza gospodarki.

**Tempo gry 12 s na minutę.** Warunek wiarygodnego ruchu postaci (marsz 18 pól/min = 1,5 pola/s); ×3 odpowiada dawnemu ×1, więc wyniki, terminy i testy nie zmieniają się (rozdz. {{ref:walkers}}).

**Każdy ma zajęcie** (decyzja użytkownika z Fazy 9B): robotnik budynku, który stoi, zamiata lub idzie sprawdzić Skład; jedynie budowniczowie bez placu i wolni obywatele stoją lub spacerują (rozdz. {{ref:workers}}).

**Magazyn centralny = Dwór** (do Fazy 9C bez nowego budynku; od Fazy 9D węzłami są także Osada i Składy wyspecjalizowane, rozdz. {{ref:wezly}}): Skład skraca marsz lokalnie, a gracz ma realny wybór między drogą, Składem i zagęszczeniem zabudowy. Karawany są tylko wizualizacją (złoto wpływa od razu, jak w Twierdzy), a okręty wizualizacją rejsu; napady nadal liczone ze skarbca.

## Decyzje otwarte {#decyzje-otwarte}

Poniższe wartości mają **domyślne rozstrzygnięcie**, które użytkownik może zmienić jedną stałą (aneks {{ref:e-decyzje}}):

- (rozstrzygnięte w Fazie 9B-0) tempo bazowe czasu gry — 12 s na minutę gry zamiast 4;
- napady na karawanę pozostają rozliczane ze skarbca (specyfikacja); karawana kosmetyczna nie jest ich „celem”;
- (rozstrzygnięte w Fazie 9D) magazyn centralny = Dwór, a oddalone grupy producentów obsługuje Osada i Składy wyspecjalizowane;
- po Fazie 10: czy zostawić styl „klasyczny” (`?classic=1`) jako zapas.
