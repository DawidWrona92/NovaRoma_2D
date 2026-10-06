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

Tabela: Prędkości widocznych postaci (pola na minutę gry; po zmianie tempa w Fazie 9B-0)
| Postać | Prędkość | Uwaga |
|---|---|---|
| Obywatel (cień) | {{v:Data.RULES.clock.secPerMin / 4 * 0.25}} (0,25 × {{v:Data.RULES.clock.secPerMin / 4}}) | spacer wokół budynków, cele losuje logika; przeskalowana, by na ekranie szedł tak jak przy dawnym tempie |
| Nosiciel (cień) | {{v:Data.RULES.walk.carrier}} | od drzwi producenta do drzwi Składu / Dworu; kosmetyczny (max 12 naraz) |
| Budowniczy | {{v:Data.RULES.walk.builder}} | Dwór → plac; noszenie i budowa |
| Myśliwy | {{v:Data.FAUNA_RULES.hunterSpeed}} (powrót z łupem × 0,9) | pozycja jako funkcja czasu (`Data.FAUNA_RULES.hunterSpeed`) |

**Tempo gry.** Minuta gry trwa przy prędkości ×1 **{{v:Data.RULES.clock.secPerMin}} s** (`Data.RULES.clock.secPerMin`; dawniej 4 s), a przyciski prędkości przełączają ×{{v:Data.RULES.clock.speeds.join(' → ×')}}. Prędkość ×3 odpowiada dawnemu ×1, więc dotychczasowe wyniki i terminy haraczu nie zmieniają się — zmienia się wyłącznie liczba sekund na minutę. Parametr adresu `?tempo=N` ustawia własną liczbę sekund (testy przeglądarkowe nie muszą go używać). Prędkość marszu postaci 18 pól/min przy 12 s/min to 1,5 pola/s; zob. aneks {{ref:e-tempo}}.

> [!uwaga] Te prędkości są **kosmetyczne i niespójne z czasem logiki**: logika zakłada, że budowniczy nosi sztukę materiału w 0,2 min niezależnie od odległości, a producent „odkłada” towar w Składzie bez czasu; widoczny budowniczy idzie do placu kilka minut gry. To jedyny powód, dla którego ludzie dziś tylko *wyglądają*, jakby pracowali — dlatego powstała Faza 9B (aneks {{ref:aneks-fizyka}}).

## Robotnicy i ich czynności: moduł Workers {#workers}

Od Fazy 9B-1 (przełącznik `settings.workers`, w grze włączony; `?workers=0` przywraca dawne cienie) **każdy obsadzony budynek z rolą ma jednego widocznego robotnika**, który wykonuje swoją pętlę pracy. Moduł `Workers` korzysta z `Walkers` (ścieżki, drogi, ewakuacja spod placów), ale nie zmienia logiki gry: tak jak piesi jest „cieniem symulacji” — stan żyje poza stanem gry, nie losuje (miejsca pracy wybiera funkcja skrótu z `uid` budynku) i nie wywołuje globalnego `RNG`. Na ekranie widać więc to, co dzieje się w ekonomii, ale niczego to nie zmienia w wynikach.

**Pętla pracy** (`Workers.cycleOf`): *weź wejście ze Składu lub Dworu* → *idź na miejsce pracy* (z wejściem w rękach, które tam odkłada) → *pracuj* (animacja narzędzia; kilka odcinków w różnych miejscach, jeśli praca trwa dłużej niż {{v:Data.RULES.cycle.spell}} min) → *weź wyjście i zanieś je do najbliższego Składu lub Dworu*. Czas pracy w jednej pętli to `ładunek / tempo wyjścia`, gdzie ładunek wynosi {{v:Data.RULES.cycle.load}} szt. (pojemność lokalnego składziku); marsz trwa tyle, ile wynika z odległości, prędkości {{v:Data.RULES.walk.v}} pola/min i terenu (droga ×1,6, bagno i bród wolniej). Dlatego **droga i bliski Skład skracają marsz** — to ten sam cykl, z którego w Fazie 9B-2 wynika sprawność transportu (aneks {{ref:e-model}}).

Tabela: Role robotników w grze (z kodu)
{{tabela:role_robotnikow}}

**Miejsca pracy:** `door` — przy drzwiach (warsztaty), `field` — wolne pola w pierścieniu wokół budynku (rolnicy, zbieracze, sadownicy, nacinacze żywicy — kolejne odcinki pracy w różnych punktach pola), `tree` — najbliższe drzewo (drwal), `shore` — pole lądu przy wodzie (rybak), `service` — obsługa budynków bez produkcji (Targ, świątynia, łaźnia, strażnica): krąży 2–3 punktami przy drzwiach.

**Zasada „każdy ma zajęcie”.** Każdy człowiek na mapie wykonuje jakąś czynność; jedyni, którzy stoją w miejscu, to **budowniczowie bez placu do budowy** (czekają przy Dworze — nie znikają jak dawniej) i wolni obywatele, którzy spacerują i przystają. Konkretnie: (1) robotnik **czynnego** budynku chodzi po pętli pracy; (2) robotnik budynku, który **stoi** (brak wejścia, pełny magazyn, „jedzenie tylko z nadwyżki”, wyczerpane złoże), **nie stoi bezczynnie**: przy braku wejścia idzie do Składu lub Dworu sprawdzić, czy towar już jest, a poza tym zamiata i porządkuje wokół budynku (to nie zmienia produkcji — ją wstrzymuje logika, a Doradca podaje powód postoju); (3) robotnicy budynków usługowych (Targ, świątynia, łaźnia, strażnica, koszary) krążą 2–3 punktami przy drzwiach; (4) myśliwy bez włączonej fauny poluje w pobliżu, a przy włączonej — prowadzi go `Fauna`; (5) budynek **bez obsady** (brak wolnej ludności albo brak narzędzia) jest pusty, bo nikt do niego nie jest przypisany. Rozebrany lub nieobsadzony budynek zwalnia robotnika — wraca do Dworu i dołącza do wolnych obywateli.

**Wolni obywatele** to ludność, która nie pracuje: `⌊ludność⌋ − pracownicy − załoga na wyprawie − czynni budowniczowie`; tylu obywateli widać na ekranie (stroll jak dotąd), a cienie-nosiciele znikają, bo towar niosą robotnicy. **Budowniczowie** są rysowani tym samym robotniczym wyglądem z młotkiem (przy wyrównywaniu terenu z kilofem) i niosą materiał danego placu (deski, kamień, glinę); gdy brakuje placu do budowy, **czekają przy Dworze** (czynnych budowniczych jest tylu, ile ustawia przycisk 👷, pomniejszone o brak wolnej ludności).

**Myśliwi** nadal prowadzi `Fauna` (rozdz. {{ref:fauna}}); bez włączonej fauny myśliwy chodzi jak inni robotnicy.

**Wygląd.** Robotnicy to dwa warianty koloru na nację (`frankWorker`, `sarWorker`, `vikWorker`, `slavWorker` i `…B`) w silniku sprite'ów, bez rekwizytów w ręku; narzędzia i ładunki dorysowuje gra (`drawTool`, `drawLoad`) i animuje według czynności (uderzenie, wymachy, przysiad). Pełną oprawę graficzną ocenia audyt w Fazie 11.

Test `tools/workers.js` sprawdza m.in., że każdy obsadzony budynek z rolą ma dokładnie jednego robotnika, że **żaden robotnik nie stoi bezczynnie dłużej niż minutę**, że liczba budowniczych na ekranie = czynni budowniczowie (bez placu stoją przy Dworze), że chodzą tylko po polach przechodnich, że robotnicy z wyjściem rzeczywiście niosą je do Składu i je tam zostawiają, że widoczni obywatele = wolna ludność, a logika jest identyczna z robotnikami i bez; `tools/browser_workers.js` sprawdza to samo na ekranie wraz z FPS.

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
