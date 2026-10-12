# Ruch, drogi i logistyka {#ruch}

Ruch ludzi jest w grze osobną warstwą nad ekonomią. Dziś składa się z czterech części: **Path** (A\* po polach mapy), **Walkers** (widoczni piesi — „cień symulacji”), **Roads** (drogi przyspieszające ruch) i **Logistics** (sprawność producentów zależna od odległości do najbliższego węzła: Składu, Dworu, Osady lub Składu wyspecjalizowanego; zob. {{ref:wezly}}). Tylko ostatnia z nich wpływa na liczby ekonomii; pozostałe są wizualne lub służą kontroli dostępu. Plan ożywienia ludzi tak, by ich czynności były spójne z ekonomią (Faza 9B), opisuje aneks {{ref:aneks-fizyka}}.

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
- **Budowniczowie** noszą materiały z najbliższej bazy budowy — Dworu, Składu lub Osady (etap noszenia), potem budują przy obrysie; bez przydziału lub po ukończeniu wracają do tej bazy i znikają.
- **Nosiciele** wychodzą z drzwi producenta i kończą marsz przy drzwiach najbliższego węzła, który przyjmuje ich towar (cel wybiera logika; zob. {{ref:wezly}}).
- **Myśliwi** nie są częścią `Walkers`: ich pozycja to czysta funkcja czasu gry (rozdz. {{ref:fauna}}).

Tabela: Prędkości widocznych postaci (pola na minutę gry; po zmianie tempa w Fazie 9B-0)
| Postać | Prędkość | Uwaga |
|---|---|---|
| Obywatel (cień) | {{v:Data.RULES.clock.secPerMin / 4 * 0.25}} (0,25 × {{v:Data.RULES.clock.secPerMin / 4}}) | spacer wokół budynków, cele losuje logika; przeskalowana, by na ekranie szedł tak jak przy dawnym tempie |
| Nosiciel (cień) | {{v:Data.RULES.walk.carrier}} | od drzwi producenta do drzwi Składu / Dworu; kosmetyczny (max 12 naraz) |
| Budowniczy | {{v:Data.RULES.walk.builder}} | Dwór → plac; noszenie i budowa |
| Myśliwy | {{v:Data.FAUNA_RULES.hunterSpeed}} (powrót z łupem × 0,9) | pozycja jako funkcja czasu (`Data.FAUNA_RULES.hunterSpeed`) |

**Tempo gry.** Minuta gry trwa przy prędkości ×1 **{{v:Data.RULES.clock.secPerMin}} s** (`Data.RULES.clock.secPerMin`; dawniej 4 s), a przyciski prędkości przełączają ×{{v:Data.RULES.clock.speeds.join(' → ×')}}. Prędkość ×3 odpowiada dawnemu ×1, więc dotychczasowe wyniki i terminy haraczu nie zmieniają się — zmienia się wyłącznie liczba sekund na minutę. Parametr adresu `?tempo=N` ustawia własną liczbę sekund (testy przeglądarkowe nie muszą go używać). Prędkość marszu postaci 18 pól/min przy 12 s/min to 1,5 pola/s; zob. aneks {{ref:e-tempo}}.

> [!uwaga] Bez przełącznika `settings.physical` (testy specyfikacji, `?physical=0`) prędkości postaci są **kosmetyczne**: logika zakłada, że budowniczy nosi sztukę materiału w 0,2 min niezależnie od odległości, a producent „odkłada” towar w Składzie bez czasu. Z włączonym przełącznikiem (domyślnie w grze) czas marszu **wchodzi do ekonomii** — rozdział „Fizyczna sprawność z cyklu pracy” poniżej i aneks {{ref:aneks-fizyka}}.

## Pętle pracy: przegląd ról {#petle-pracy}

Faza 9F (uwaga graczy: *mleczarz doi, chodząc po mapie i zatrzymując się w losowych miejscach*) przeglądnęła pętle wszystkich ról. Wspólne zasady, wzorowane na pętlach z gier w rodzaju Twierdzy, ale bez ich liczb:

- **Cykl ma jasne etapy**, a bieżący etap widać na karcie postaci („Etap: Niesie ser do Składu”) i opis całego cyklu na karcie budynku („Cykl pracownika: …”).
- **Stałe miejsca pracy.** Rola z polami nie wędruje po okolicy: mleczarz doi w jednym miejscu przy zagrodzie, sadownik i zbieracze mają po trzy stałe miejsca, rolnik cztery sekcje pola (kolejne cykle zaczynają od następnego miejsca), a robotnik wraca w te same punkty. Miejsca są deterministyczne i zależą tylko od budynku.
- **Praca na zewnątrz albo w budynku** (Punkt 10, pole `where` w `Data.ROLES`). Większość ról pracuje **na zewnątrz**, na stałym stanowisku obok budynku (kopalnie — wyrobisko, studnia, pole, sad, zagroda). **Wyjątek: Tartak** — cieśla piłuje deski **tuż przy drzwiach własnej wiaty** (`spot: 'door'`), widoczny przez cały czas pracy; wcześniej jego stanowisko leżało w pierścieniu 3,5–5,8 pola od drzwi i wyglądało, jakby piłował „po całym zamku” (test `chain.js`: każda próbka piłowania ≤ 2,5 pola od drzwi). Pnie bierze ze Składu i deski tam odnosi, ale sam cykl piłowania odbywa się przy domu. Sprite Tartaku to otwarta wiata bez okien, więc robotnik nie wchodzi do środka. Role **w budynku** (młyn, piekarnia, kasza, huta, kuźnia narzędzi, zbrojownia, winiarnia, kadzidło, tkalnia, garncarnia, miodosytnia, woskarnia, garbarnia) idą do drzwi, **wchodzą (znikają z ekranu)**, a w oknach budynku **świeci się światło**, dopóki ktoś pracuje w środku; po cyklu robotnik wychodzi z towarem. Okna biorą się z metadanych sprite'a (`SPRITE_META.wins`, rejestrowane w `facade()` silnika sprite'ów). Pełnych animacji pracy w środku (jak w Twierdzy) nie ma — zapisane na liście TODO.
- **Po cyklu robotnik wraca do domu i odpoczywa** (krótko, 0,35 min gry; to wyłącznie ilustracja, produkcji nie zmienia).
- **Wejście niesie się ze Składu do miejsca pracy, wyjście z miejsca pracy do Składu** (lub węzła, rozdz. {{ref:wezly}}); budynek, który stoi (brak wejścia, pełny magazyn), zamiata i sprawdza zapas, a przy częściowym wejściu pracuje (rozdz. {{ref:workers}}).
- **Leśnik** bierze sadzonkę w domu, idzie na pole wybrane przez logikę, sadzi i wraca po następną; **kapłan** idzie do najbliższych domów i błogosławi; budowniczowie niosą materiał z najbliższej bazy.

{{tabela:role_pracy}}

> [!uwaga] Pętle są wizualizacją. Czasy i plony liczy ekonomia (rozdz. {{ref:ekonomia}}); „odpoczynek” i drogi nie zmieniają produkcji poza dawną karą za dystans do Składu (rozdz. {{ref:logistyka}}). Prawdziwe zależności z gier-wzorców (dojrzewanie krów i upraw, pojemność stosów, wózki) nie są modelowane — to kandydaci na przyszły etap.

### Odpoczynek na krześle {#odpoczynek}

Po zakończonym cyklu robotnik wraca do drzwi i **odpoczywa na krześle** (Punkt 15): krok `rest` z flagą `sit` trwa ok. 0,9 min gry (przy ×1 ok. 11 s). Podobnie **wolni mieszkańcy** (`Walkers`, `driveCitizen`): gdy postać dojdzie do celu, z prawdopodobieństwem `REST.p` = 25% idzie do najbliższych drzwi Chaty lub Osady w promieniu 6 pól i siada na jednym z miejsc obok drzwi (dwa po bokach, potem dalsze i tuż przed drzwiami; miejsce musi być wolne, bez drzewa, bagna, muru i budynku, jedno miejsce — jedna osoba) na 0,5–1,2 min, po czym wstaje i idzie do bieżącego celu cienia. Warstwa jest **czysto wizualna** (cień symulacji z RNG idzie dalej, własny hasz zamiast `RNG`) i działa tylko przy `settings.workers`. Krzesło nie jest częścią sprite'ów budynków: to rekwizyt rysowany pod postacią na czas odpoczynku (rozdz. {{ref:mieszkancy}}). Ręce odpoczywającego rysuje wyłącznie gra (`drawSeated`), a tułów pochodzi z wariantu **bez rąk** (`*WorkerSit`, `*WorkerBSit`, `noArms` w `CAST`) — wcześniej dorysowane ręce przy rozciąganiu i popijaniu nakładały się na wiszące ręce sprite'a (błąd „cztery ręce”). Test: `tools/rest.js` (siadają i robotnicy, i wolni mieszkańcy; miejsca wolne i przechodnie; jedno miejsce — jedna osoba; nikt nie siedzi dłużej niż 1,4 min; logika identyczna z postaciami i bez), `tools/browser_rest.js`.

## Robotnicy i ich czynności: moduł Workers {#workers}

Od Fazy 9B-1 (przełącznik `settings.workers`, w grze włączony; `?workers=0` przywraca dawne cienie) **każdy obsadzony budynek z rolą ma jednego widocznego robotnika**, który wykonuje swoją pętlę pracy. Moduł `Workers` korzysta z `Walkers` (ścieżki, drogi, ewakuacja spod placów), ale nie zmienia logiki gry: tak jak piesi jest „cieniem symulacji” — stan żyje poza stanem gry, nie losuje (miejsca pracy wybiera funkcja skrótu z `uid` budynku) i nie wywołuje globalnego `RNG`. Na ekranie widać więc to, co dzieje się w ekonomii, ale niczego to nie zmienia w wynikach.

**Pętla pracy** (`Workers.cycleOf`): *weź wejście z najbliższego węzła* → *idź na miejsce pracy* (z wejściem w rękach, które tam odkłada) → *pracuj* (animacja narzędzia; kilka odcinków w różnych miejscach, jeśli praca trwa dłużej niż {{v:Data.RULES.cycle.spell}} min) → *weź wyjście i zanieś je do najbliższego węzła, który je przyjmuje*. Czas pracy w jednej pętli to `ładunek / tempo wyjścia`, gdzie ładunek wynosi {{v:Data.RULES.cycle.load}} szt. (pojemność lokalnego składziku); marsz trwa tyle, ile wynika z odległości, prędkości {{v:Data.RULES.walk.v}} pola/min i terenu (droga ×1,6, bagno i bród wolniej). Dlatego **droga i bliski Skład skracają marsz** — to ten sam cykl, z którego w Fazie 9B-2 wynika sprawność transportu (aneks {{ref:e-model}}).

Tabela: Role robotników w grze (z kodu)
{{tabela:role_robotnikow}}

**Miejsca pracy:** `door` — przy drzwiach (warsztaty), `field` — wolne pola w pierścieniu wokół budynku (rolnicy, zbieracze, sadownicy, nacinacze żywicy — kolejne odcinki pracy w różnych punktach pola), `tree` — najbliższe drzewo (drwal), `shore` — pole lądu przy wodzie (rybak), `service` — obsługa budynków bez produkcji (Targ, świątynia, łaźnia, strażnica): krąży 2–3 punktami przy drzwiach.

**Zasada „każdy ma zajęcie”.** Każdy człowiek na mapie wykonuje jakąś czynność; jedyni, którzy stoją w miejscu, to **budowniczowie bez placu do budowy** (czekają przy Dworze — nie znikają jak dawniej) i wolni obywatele, którzy spacerują i przystają. Konkretnie: (1) robotnik **czynnego** budynku chodzi po pętli pracy; (2) robotnik budynku, który **stoi** (brak wejścia, pełny magazyn, „jedzenie tylko z nadwyżki”, wyczerpane złoże), **nie stoi bezczynnie**: przy braku wejścia idzie do Składu lub Dworu sprawdzić, czy towar już jest, a poza tym zamiata i porządkuje wokół budynku (to nie zmienia produkcji — ją wstrzymuje logika, a Doradca podaje powód postoju); (3) robotnicy budynków usługowych (Targ, świątynia, łaźnia, strażnica, koszary) krążą 2–3 punktami przy drzwiach; (4) myśliwy bez włączonej fauny poluje w pobliżu, a przy włączonej — prowadzi go `Fauna`; (5) budynek **bez obsady** (brak wolnej ludności albo brak narzędzia) jest pusty, bo nikt do niego nie jest przypisany. Przełączanie trybu ma **histerezę**: status budynku potrafi migać (np. kopalnia stojąca z głodu), więc robotnik przechodzi do zamiatania dopiero po 1,0 min nieprzerwanego postoju, a wraca do pracy po 0,3 min pracy. Bez tego każda zmiana kasowała rozpoczęty cykl robotnika. Rozebrany lub nieobsadzony budynek zwalnia robotnika — wraca do Dworu i dołącza do wolnych obywateli.

**Wolni obywatele** to ludność, która nie pracuje: `⌊ludność⌋ − pracownicy − załoga na wyprawie − czynni budowniczowie`; tylu obywateli widać na ekranie (stroll jak dotąd), a cienie-nosiciele znikają, bo towar niosą robotnicy. **Budowniczowie** są rysowani tym samym robotniczym wyglądem z młotkiem (przy wyrównywaniu terenu z kilofem) i niosą materiał danego placu (deski, kamień, glinę); gdy brakuje placu do budowy, **czekają przy Dworze** (czynnych budowniczych jest tylu, ile ustawia przycisk 👷, pomniejszone o brak wolnej ludności).

**Myśliwi** nadal prowadzi `Fauna` (rozdz. {{ref:fauna}}); bez włączonej fauny myśliwy chodzi jak inni robotnicy.

**Wygląd.** Robotnicy to dwa warianty koloru na nację (`frankWorker`, `sarWorker`, `vikWorker`, `slavWorker` i `…B`) w silniku sprite'ów, bez rekwizytów w ręku; narzędzia i ładunki dorysowuje gra (`drawTool`, `drawLoad`) i animuje według czynności (uderzenie, wymachy, przysiad). Pełną oprawę graficzną ocenia audyt w Fazie 11.

Test `tools/workers.js` sprawdza m.in., że każdy obsadzony budynek z rolą ma dokładnie jednego robotnika, że **żaden robotnik nie stoi bezczynnie dłużej niż minutę**, że budynek z wyjściem, który logika sam wstrzymała na ponad 3 min (np. głodowa kopalnia), nie musi kończyć cyklu w ok. 12 min, że liczba budowniczych na ekranie = czynni budowniczowie (bez placu stoją przy Dworze), że chodzą tylko po polach przechodnich, że robotnicy z wyjściem rzeczywiście niosą je do Składu i je tam zostawiają, że widoczni obywatele = wolna ludność, a logika jest identyczna z robotnikami i bez; `tools/browser_workers.js` sprawdza to samo na ekranie wraz z FPS.

## Drogi: moduł Roads {#drogi}

Droga to pole z `tile.road = 1` (zapisywane w kaflu, więc trafia do snapshotu). Gracz wytycza ją narzędziem **Drogi** w pasku budowy: pierwszy klik to początek, drugi koniec; trasę wyznacza `Path` (istniejące drogi są tańsze, więc są wykorzystywane), a kolejny klik kontynuuje od końca poprzedniego odcinka. Zasady:

- koszt: **1 deska za każde nowe pole** (pola z drogą nic nie kosztują); podgląd pokazuje liczbę pól i koszt przed potwierdzeniem,
- droga nie powstanie na wodzie, bagnie, wydmie, klifie, drzewach, złożach i zajętych polach; początek i koniec muszą leżeć na wolnym lądzie,
- budowa budynku lub placu zdejmuje drogę spod obrysu; narzędzie **Rozbierz drogę** usuwa pojedyncze pola (bez zwrotu),
- po drodze piesi i nosiciele idą **ok. 1,6× szybciej**, a A\* ją preferuje (koszt pola 0,6 — odpowiada prędkości ×1,6),
- **droga startowa** (Punkt 20): od drzwi Dworu na zewnątrz prowadzi bezpłatna droga długości `Data.RULES.start.road` = {{v:Data.RULES.start.road}} pól (`World.startRoad`; przerywana na pierwszym polu, którego nie da się utwardzić); budynek postawiony na niej po prostu ją zastępuje. Ponieważ każda mapa ma już drogę, A\* liczy heurystykę z kosztem drogi 0,6, więc średnie zapytanie jest ok. 2× wolniejsze niż na mapie bez dróg (1,2 → 2,8 ms w teście losowych par pól 48×48; w grze trasy są krótsze).

Test `tools/roads.js` sprawdza m.in. koszt tylko za nowe pola, odmowy, zdejmowanie drogi przez budowę, preferowanie drogi przez A\*, brak RNG i zapis przez JSON.

## Mury obronne: moduł Walls {#mury}

Mur (Punkt 13) to pole z `tile.wall = 1` — **nieprzechodnie** dla ludzi i zwierząt (`Terrain.passable`, więc `Path`, `Walkers`, `Workers` i `Fauna` je omijają), z zakazem budowy i kładzenia dróg. Gracz wytycza go narzędziem **Mur** w zakładce **Mury** (dwa kliknięcia: początek i koniec; odcinek prosty albo „L”: najpierw wzdłuż dłuższej osi). Mur jest **tylko ozdobą i przeszkodą** — bez wartości militarnej; stawia się go od razu (bez budowniczych). Zasady (`Walls.preview`/`Walls.lay`):

- koszt: **1 surowiec za pole**, zależny od nacji (`Data.RULES.wall.cost`): Frankowie — kamień, Saraceni — glina, Wikingowie i Słowianie — deski (palisada); podgląd pokazuje liczbę pól i koszt,
- mur nie powstanie na wodzie, bagnie, wydmie, klifie, drzewach (trzeba je wyciąć), złożach, drogach ani zajętych polach,
- **walidacja osiągalności** (`Walls.cutsOff`): mur nie może odciąć od Dworu żadnego budynku, do którego dało się wcześniej dojść; zamknięcie grodu wymaga bram (Punkt 14),
- narzędzie **Rozbierz mur** zdejmuje pojedyncze pola (bez zwrotu); każda zmiana podnosi `map.roadRev`, więc logistyka przelicza dojścia.

**Grafika:** każdy segment to osobny sprite 1×1 pole w 16 wariantach sąsiedztwa (maska N=1, E=2, S=4, W=8; `${nacja}_wall@${maska}`), wypiekany silnikiem sprite'ów jak budynki (`prototyp/src/56_walls.js`): Frankowie i Saraceni — ten sam kamień, blanki i wieżyczki co w ich zamkach (wieżyczka na zakrętach, rozgałęzieniach i końcach), Wikingowie i Słowianie — palisada z zaostrzonych pali i grubszym słupem narożnym. W trybie klasycznym (`?classic=1`) mur rysuje się dynamicznie z pryzm.

**Bramy** (Punkt 14) to przejście w murze: pole `tile.wall = 2` (oś wschód–zachód) albo `3` (oś północ–południe), przechodnie dla ludzi i zwierząt (`Terrain.passable` blokuje tylko `wall === 1`), więc A\* prowadzi prosto przez bramę. Narzędzie **Brama** kładzie się jednym kliknięciem na polu muru (zastępuje je), na wolnym polu albo na drodze; oś wynika z sąsiednich pól muru (bez sąsiadów — wschód–zachód), a podgląd pokazuje przejście i koszt. Brama kosztuje więcej niż pole muru (`Data.RULES.wall.gate`: Frankowie 4 kamienia i 2 deski, Saraceni 4 gliny i 2 deski, Wikingowie i Słowianie 5 desek). Zasady:

- **mur z bramą może zamknąć gród**: walidacja `Walls.cutsOff` przepuszcza pierścień, w którym jest brama, bo brama nie blokuje dojścia; przed postawieniem bramy ostatni odcinek pierścienia zamykającego budynki jest odrzucany („zostaw przejście”),
- **teren zamknięty bez bramy**: `Terrain.ringReachable` liczy osiągalność z terenu, nie z murów, dlatego `World.canPlace` dodatkowo woła `Walls.ringOpen` (osiągalność od drzwi Dworu po polach przechodnich, z pamięcią podręczną po `map.roadRev`) i odmawia budowy wewnątrz pierścienia bez bramy: „Brak dojścia — mur zamyka ten teren; dobuduj bramę”,
- droga może przejść przez bramę (`Roads.free` dopuszcza `wall > 1`), a brama może stanąć na drodze; muru na drodze postawić nie można,
- pole muru i bramy nie jest miejscem postoju ludzi (`Workers`) ani zwierząt (`Fauna`); **Rozbierz mur** zdejmuje i mur, i bramę.

Test `tools/walls.js` sprawdza koszt, odmowy, nieprzechodniość i obejście przez A\*, odcięcie budynku, burzenie, brak wpływu przy braku murów, a dla bram: koszt, oś, przejście A\* prosto przez bramę, drogę przez bramę, brak surowców, teren zamknięty bez bramy i po jej dobudowaniu; `tools/browser_walls.js` — zakładkę z trzema narzędziami, kliknięcia (mur, brama, rozbiórka) i rysowanie w obu trybach.

## Sprawność logistyczna: moduł Logistics {#logistyka}

Producent daleko od Składu lub Dworu daje mniej. `Logistics.effOf` zwraca mnożnik plonu (przerobu) `eff`, który wchodzi do `Economy.tick` i `potentialFood` obok mnożnika lasu i zwierzyny:

```
dist  =  koszt drogi (Path.field) od drzwi producenta do drzwi najbliższego węzła, który przyjmuje jego towary
eff   =  1 − (1 − min) × clamp( (dist − free) / span, 0, 1 )
```

Parametry (`Data.RULES.logistics`): `free` = {{v:Data.RULES.logistics.free}} pól (bez kary), `span` = {{v:Data.RULES.logistics.span}} pól (zakres spadku), `min` = {{v:Data.RULES.logistics.min}} (najniższa sprawność). Węzły i zasady wyboru, w tym bonus Osady, opisuje sekcja {{ref:wezly}}.

Odległość liczona jest po polach z kosztami terenu: pole lądu kosztuje 1, **droga 0,6**, a budynki, bagna i woda wydłużają trasę (zajęte pola są blokadą). Producentem jest każdy budynek z wyjściem będącym towarem z listy limitów. Wynik jest pamiętany do zmiany układu (liczba budynków i placów, wersja dróg); budynek dostaje `b.logi = { eff, dist }` do pokazania w interfejsie („transport do Składu ≈ N pól (−X%): zbliż budynki lub połóż drogę”). Opcja `settings.logistics` jest wyłączona w testach specyfikacji (żaden scenariusz się nie zmienia) i włączona w grze (przycisk 🚚, `?logistics=0`).

{{wykres:logistyki}}

### Jak wygląda to w osadach botów {#sonda}

Poniższy pomiar (skrypt `tools/probe_logistyki.js`, liczony przy każdej budowie dokumentu) pokazuje, że w osadzie układanej przez bota **bez dróg** mediana odległości od Składu / Dworu wynosi ok. 12–13 pól, 90. percentyl ok. 17–21, a pojedyncze budynki (kopalnia darniowa Wikingów) leżą 40 pól od magazynu. Średnia sprawność modułu to ok. 0,88–0,90 — czyli osada „bez organizacji” traci ok. 10% produkcji, a drogi i Składy ten stan poprawiają. To budżet, którego nie wolno przekroczyć przy dalszych zmianach (spec. przyjmuje, że narzut transportu poniżej 10% jest akceptowalny, 15% już obniża ludność Franków o 18%).

{{tabela:sonda_logistyki}}

## Fizyczna sprawność z cyklu pracy {#fizyka}

Przełącznik `settings.physical` (w grze domyślnie włączony razem z logistyką; `?physical=0` przywraca dawną krzywą liniową, w testach specyfikacji jest wyłączony) zastępuje liniową krzywą **modelem cyklu pracy**, tym samym, który widać na ekranie (rozdz. {{ref:workers}}). Robotnik producenta pracuje przez czas `Tw`, w którym wytwarza ładunek, a potem musi go zanieść do najbliższego Składu lub Dworu (i przynieść wejścia); w tym czasie nie produkuje:

```
Tw    =  ładunek / Σ wyjść [szt./min]                 ładunek = RULES.cycle.load
trips =  max(1, Σ wejść / Σ wyjść)                    kursy do węzła na cykl (wejście tam, wyjście z powrotem)
Th(L) =  trips · (2·L / v + obsługa)                  v = RULES.walk.v, L — koszt drogi (pole lądu 1, droga 0,6)
eff   =  min( 1,  (Tw + Th(L_ref)) / (Tw + Th(L)) )   L_ref = RULES.cycle.ref; bez dojścia: RULES.cycle.min
```

Stałe: ładunek **{{v:Data.RULES.cycle.load}} szt.**, obsługa {{v:Data.RULES.cycle.handle}} min, prędkość {{v:Data.RULES.walk.v}} pól/min, `L_ref` = **{{v:Data.RULES.cycle.ref}} pól** (bliżej nie ma ani kary, ani premii), najniższa sprawność {{v:Data.RULES.cycle.min}} (brak dojścia — Doradca pisze „brak dojścia do magazynu”). Cechy modelu:

- **Tylko na niekorzyść:** `eff ≤ 1` — nic nie przyspiesza gospodarki ponad specyfikację (test `tools/physical.js` sprawdza to dla każdego producenta każdej osady bota).
- **Wrażliwość zależy od budynku:** im szybciej producent wytwarza towar, tym większą część cyklu zajmuje marsz — Piekarnia (3,3 szt./min) traci przy tej samej odległości więcej niż drwal (1 szt./min), a Huta (dwa wejścia na jedno wyjście) jedzie po wejścia dwa razy.
- **Droga i Skład się opłacają:** koszt pola po drodze to 0,6, więc ta sama odległość daje wyższą sprawność, a Skład postawiony przy producencie zeruje marsz (wykres poniżej; w teście Skład lub droga podnoszą sprawność odległej farmy o ≥ 3 pp).
- **Kalibracja do dotychczasowego bilansu:** parametry dobrano tak, by boty R i D czterech nacji osiągały co najmniej **85% wyniku z dawną krzywą** (to, co gra już dostarczała) i co najmniej **75% wyniku bazowego** ze specyfikacji — wyniki strojenia w aneksie {{ref:e-wyniki}}. Przy odległości L_ref = {{v:Data.RULES.cycle.ref}} pól (wcześniej 8) bramka jest surowsza od dawnej: odległość boli mocniej.

{{wykres:fizyczny}}

Karta budynku pokazuje sekcję **Transport** (odległość do Składu / Dworu, czas pracy i marszu w cyklu, sprawność), a Doradca — „transport do Składu ≈ N pól (marsz X min na Y min pracy) (−Z%): zbliż budynki, postaw Skład lub połóż drogę”.

### Drwal i Leśniczówka {#drwal}

Przy `settings.physical` drwal **ścina najbliższe drzewo** (`World.nearestTree`: najmniejsza odległość w prostej od drzwi, przy remisie niższy indeks pola; zero wywołań `RNG`) zamiast losowego drzewa na całej mapie — las wokół chaty się przerzedza, a robotnik na ekranie ścina dokładnie to drzewo, które logika zabiera (czeka przy nim, aż ubędzie drzew na polu, i niesie kłodę do Składu). Rąbanie trwa **co najmniej `RULES.cycle.chopMin`** ({{v:Data.RULES.cycle.chopMin}} min gry): logika potrafi ściąć drzewo, zanim drwal dojdzie (w czasie dojścia ścina drzewa w tempie produkcji), i wcześniej rąbanie kończyło się po 0 s (błąd zgłoszony po Punkcie 15); teraz drwal rąbie przez ten minimalny czas także wtedy, a licznik (`w.actT`) nie zmienia logiki ani ekonomii. Dodatkowo plon drwala spada, gdy najbliższe drzewo jest dalej niż `RULES.cycle.treeRef` ({{v:Data.RULES.cycle.treeRef}}) pól: do każdego pnia musi dojść i wrócić (`Logistics.treeFactor`, odświeżany co minutę gry). **Leśniczówka** sadzi teraz przy swojej chacie: dojrzała sadzonka wyrasta na wolnym polu w promieniu 2,5–9 pól od jej drzwi (deterministycznie, z numeru sadzonki), więc Leśniczówka ma sens tylko obok drwala.

### Budowniczowie {#budowniczowie-fizyka}

Przy `settings.physical` budowa ma dwa czasy zależne od odległości: **dojście** budowniczych z ich bazy (najbliższego Dworu, Składu lub Osady) na plac (`odległość / v` minut, raz dla każdego przydziału — przez ten czas plac stoi) oraz **noszenie materiału kursami po `RULES.cycle.carry` ({{v:Data.RULES.cycle.carry}}) sztuk**: czas jednej sztuki to `max(0,2 min, (2·L / v + obsługa) / kurs)`, gdzie `L` to droga od najbliższej bazy do placu. Bliskie place budują się jak dawniej (0,2 min na sztukę), dalekie — dłużej, więc **droga do placu i Skład w pobliżu budowy skracają budowę**. Budowniczowie bez placu czekają przy Dworze (rozdz. {{ref:workers}}).

### Karawany Saracenów {#karawany}

Przy `settings.physical` karawana Saracenów jest **kosmetyczna**, jak karawana w Twierdzy (decyzja użytkownika; wzorce w aneksie {{ref:e-wzorce}}): **złoto ze sprzedaży wpływa od razu**, dokładnie tak jak bez przełącznika (test parytetu sprawdza te same ceny i to samo złoto). Sprzedany towar handlowy (kadzidło, tkanina, ceramika) zbiera się przy Targu w stosie `state.caravanPile` (szt. każdego towaru). Gdy stos osiągnie `RULES.caravan.load` ({{v:Data.RULES.caravan.load}} szt.) albo czeka `wait` ({{v:Data.RULES.caravan.wait}} min), z Targu **wyrusza karawana**: kupiec z dwoma wielbłądami idzie ścieżką `Path` do najbliższej osiągalnej krawędzi mapy ({{v:Data.RULES.walk.caravan}} pól/min), tam przez {{v:Data.RULES.caravan.sale}} min trwa sprzedaż na ekranie, i wraca. Jednocześnie jedzie najwyżej tyle karawan, ile Targów (Karawanseraj liczy się za 2). Karawana **nie opóźnia złota**, nie jest celem napadu i nie zmienia ekonomii; istnieje tylko na ekranie. Pozycja karawany to czysta funkcja czasu gry (`Walkers.caravanFigures`), a `state.caravans` jest JSON-owy. Gdy Targ nie ma drogi do krawędzi mapy, nic nie wyrusza (złoto i tak już wpłynęło).

**Napady** nadal liczą stratę ze skarbca (rozdz. {{ref:napad}}); gdy w chwili napadu karawana jest w drodze, na ekranie **trzech rabusiów z szablami otacza kupca** na ok. 0,9 min (`state.raids.last`).

### Okręty Wikingów {#okrety}

Gdy okręt jest w rejsie (`b.awayUntil`), na ekranie **odpływa** z przystani w głąb morza (najdalej 14 pól, w kierunku najdłuższego pasa wody) i wraca w chwili końca rejsu; położenie jest czystą funkcją czasu rejsu, a logika wypraw (załoga, miód, broń, 10 / 12 min) się nie zmienia. Załoga, która odpłynęła, znika z ekranu (jest odjęta od wolnych obywateli).

## Węzły logistyczne: Osada i Składy wyspecjalizowane {#wezly}

Faza 9D dodała do Dworu i Składu dwa nowe rodzaje węzłów, do których niesie się towar: **Osadę** (druga wioska) i **Składy wyspecjalizowane** (górniczy i drzewny). Węzeł to budynek, który przyjmuje towar od producentów i nosicieli oraz jest punktem startu budowniczych. Węzły zmieniają **odległość marszu i pojemność**, ale nie tworzą osobnych magazynów: cała osada nadal ma jedną pulę każdego towaru (zob. niżej).

Tabela: Węzły logistyczne i co przyjmują
| Węzeł | Przyjmuje | Rola |
|---|---|---|
| Dwór | wszystkie towary | magazyn centralny (komora 20 szt. każdego towaru), cel nosicieli bez Składu, baza budowniczych |
| Skład | wszystkie towary | +80 szt. każdego towaru; baza budowniczych |
| Osada | wszystkie towary | +{{v:Data.RULES.hub.cap}} szt. każdego towaru; miejsca jak dwie Chaty; baza budowniczych |
| Skład górniczy | ruda, węgiel, kamień, glina, sztabki | +{{v:Data.RULES.hub.special}} szt. tych towarów; skraca marsz kopalniom i hucie |
| Skład drzewny | pnie, deski | +{{v:Data.RULES.hub.special}} szt. tych towarów; skraca marsz drwalowi i tartakowi |

Składy wyspecjalizowane **nie są bazą budowniczych** i nie dają miejsc w domach.

**Wybór węzła.** Producent i jego robotnik idą do najbliższego węzła, który przyjmuje **wszystkie** towary tego budynku (wejścia i wyjścia). Dlatego kopalnie żelaza i węgla, kamieniołom, glinianka, kopalnia darniowa i huta korzystają z Składu górniczego, drwal i tartak z drzewnego, a budynki mieszane (np. Wypalarka węgla, która bierze pnie i oddaje węgiel) i młyny — tylko z węzłów ogólnych. Producentom liczącym dojazd do Osady odejmuje się {{v:Data.RULES.hub.free}} pola od kosztu drogi (bonus `free`). Funkcja `Data.hubAccepts` decyduje, czy węzeł przyjmuje dany zestaw towarów; jej wynik widać w karcie budynku (`transport do Składu górniczego ≈ N pól drogi …`) i w podglądzie stawiania.

**Gdzie wolno stawiać Osadę.** Osada musi stać co najmniej {{v:Data.RULES.hub.minDist}} pól od Dworu i {{v:Data.RULES.hub.apart}} pól od innej Osady na mapie 48×48. Obie odległości rosną proporcjonalnie do rozmiaru mapy (`K` = rozmiar / 48). Liczba Osad jest ograniczona: `max(1, ⌊rozmiar / 24⌋ − 1)` — na mapie 48 pól jedna, na 72 dwie, na 96 trzy; liczą się też place budowy. Odmowę podaje komunikat w podglądzie: „Osada musi stać co najmniej X pól od Dworu”, „Limit Osad na tej mapie: N” lub „Za blisko innej Osady (min. X pól)”.

**Pojemność.** Każdy towar ma w osadzie limit `min(limit towaru, 6 × czynni producenci + 20 (komora Dworu) + 80 × Składy + 40 × Osady + 100 × Składy wyspecjalizowane przyjmujące ten towar)`. Zasady pojemności i wpływ na ekonomię opisuje rozdz. {{ref:ekonomia}}.

**Podgląd i Doradca.** Przy stawianiu Składu, Osady i Składów wyspecjalizowanych pokazuje się mapa ciepła zasięgu (`heatDraw`). Doradca sprawdza producentów o sprawności poniżej 85% i podpowiada węzeł: Skład górniczy przy kopalniach i hucie, drzewny przy drwalu i tartaku, a Skład albo Osadę, gdy daleko do magazynu jest co najmniej trzech innych budynków.

> [!uwaga] **Model gospodarki pozostaje globalny.** Węzły nie dzielą osady na wioski: deski do budowy, zapasy i popyt liczą się dla całej osady, a węzeł zmienia tylko to, ile pola kosztuje dojazd i ile towaru się w nim mieści. Osada daje miejsca w domach, pojemność i skrócony dojazd dla producentów wokół siebie, ale nie tworzy odrębnej gospodarki.

> [!decyzja] **Duży Skład odrzucony na rzecz Osady i Składów wyspecjalizowanych** (Faza 9D, decyzja użytkownika). Zamiast jednego dużego Składu z większym promieniem powstały trzy węzły z różnymi rolami. Dwór pozostaje magazynem centralnym, zgodnie z decyzją z Fazy 9B (aneks {{ref:e-decyzje}}).

Test `tools/hubs.js` sprawdza dane i sprite'y czterech nacji, reguły stawiania Osady na mapach 48, 72 i 96 pól, miejsca w domach i pojemność, wybór węzła przez logistykę, bonus Osady i bazę budowniczych oraz pełną budowę z kosztem.

## Co z tego wynika dla gracza {#wnioski}

- **Składy przy producentach i drogi do nich** podnoszą wydajność (do −10% bez nich); Skład ma więc dwie role: pojemność (rozdz. {{ref:ekonomia}}) i skrócenie transportu. Węzły wyspecjalizowane i Osada (sekcja {{ref:wezly}}) służą temu samemu celowi tam, gdzie Skład ogólny nie wystarcza.
- Dwór jest **magazynem centralnym** każdej osady: do niego idzie transport, gdy nie ma innego węzła; im bliżej Dworu stoi producent, tym mniejsza kara — kosztem zagęszczenia (przerwa i kara za ciasną zabudowę, rozdz. {{ref:zabudowa}}).
- Budynki daleko od wszystkiego (kopalnie na złożach, rybacy na brzegu) można „uleczyć” drogą lub własnym Składem. Kopalnie kamienia, żelaza i węgla leżą teraz w górskim masywie, 11–30 pól od Dworu (rozdz. {{ref:masyw}}), więc dla nich droga lub Skład bardziej się liczy.
