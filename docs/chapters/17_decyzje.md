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

Stan i plan dalszych prac: `docs/PLAN.md` (kopia w repozytorium).

## Decyzje użytkownika (wiążące) {#decyzje-uzytkownika}

Tabela: Decyzje użytkownika
| Decyzja | Skutek w grze | Rozdz. |
|---|---|---|
| **Przerwa między budynkami = 1 pole** (twardy zakaz stawiania „ściana w ścianę”) | `World.canPlace` odmawia „Za blisko innego budynku — zostaw wolne pole (ulicę)” | {{ref:zabudowa}} |
| **Strefa wydłużonego czasu budowy** = pola w odległości 2 i 3 od budynku (+10% za sąsiada, maks. +40%), **widoczna przed wyborem miejsca** | kara `crowd` w placu budowy; podświetlenie w trybie budowy | {{ref:zabudowa}}, {{ref:budowa}} |
| **Drogi** przyspieszają ruch, A\* je preferuje | koszt pola 0,6, prędkość ×1,6, 1 deska za pole | {{ref:drogi}} |
| **Wzgórza do wyrównania** mają własną grafikę i **nie utrudniają startu** | obszar startowy ≤ 13,5 pola od Dworu jest płaski; wyrównywanie wydłuża budowę | {{ref:teren}} |
| **Chata myśliwego nie wymaga lasu** („myśliwy i tak poluje na zwierzęta”) | plon = × min(1, zwierzyna w łowisku / próg); boty nadal stawiają ją przy lesie, więc wzorce regresji bez zmian | {{ref:fauna}} |
| **Menu główne w stylu RTS + Piaskownica** (nacja, klimat, typ mapy) | moduł `Menu`, `Minimap`, ☰ Menu w grze | {{ref:menu}} |
| **Ożywienie ludzi** (po Fazie 9, przed 10 i 11): drwal fizycznie ścina, cieśla niesie deskę, budowniczy dochodzi na plac, karawana idzie na koniec mapy i wraca; drogi ważniejsze, centralny magazyn jeśli pomoże; **bez zepsucia balansu** | Faza 9B: analiza i projekt w aneksie {{ref:aneks-fizyka}} | {{ref:ruch}} |
| **Jedna wspólna dokumentacja PDF** z kodu, dwóch dokumentów ekonomii i decyzji; w repozytorium; aktualizowana po każdym etapie | `docs/` (`node docs/build.js`) | {{ref:aktualizacja}} |
| **Tryb pracy „auto”** — działamy bez dopytywania, po każdej fazie commit, push i wersja WIP do przeklikania | procedura bramki | {{ref:bramka}} |

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

## Decyzje otwarte {#decyzje-otwarte}

Poniższe wartości mają **domyślne rozstrzygnięcie**, które użytkownik może zmienić jedną stałą (aneks {{ref:e-decyzje}}):

- tempo bazowe czasu gry 12 s na minutę gry (Faza 9B-0; dziś 4 s);
- napady na karawanę pozostają rozliczane ze skarbca (karawana ilustruje i opóźnia sprzedaż, ale nie jest „celem” napadu);
- magazyn centralny = Dwór;
- po Fazie 10: czy zostawić styl „klasyczny” (`?classic=1`) jako zapas.
