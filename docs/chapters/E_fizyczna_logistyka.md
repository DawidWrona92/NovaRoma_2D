# Fizyczna logistyka i ożywienie ludzi — analiza i projekt (Faza 9B) {#aneks-fizyka}

Ten aneks opisuje **planowaną** zmianę: ludzie w grze mają naprawdę wykonywać swoje zadania, a czas i odległość mają wpływ na ekonomię (drogi stają się ważniejsze), **bez zepsucia dotychczasowego bilansu**. Powstał jako odpowiedź na prośbę projektową i zawiera analizę wykonalności z pomiarami, model, zasady ochrony bilansu, plan etapów i bramki. Faza 9B następuje po Fazie 9 (menu i Piaskownica), a przed Fazą 10 (integracja) i 11 (audyt wizualny).

## Zamówienie {#e-zamowienie}

> [!decyzja] **Prośba użytkownika (cytat w skrócie):** „Trzeba ożywić ludzi — drwal musi fizycznie ściąć drewno, cieśla zabrać [pień], dostarczyć do siebie i przeciąć, budowniczy musi dojść na plac budowy i zacząć budowę, karawana wyruszyć, dojść na koniec mapy, a potem wrócić i tak dalej. Każda postać musi wykonywać swoje zadanie. Nie zepsuj przy tym balansu rozgrywki. Tym bardziej ważne będą drogi. Możesz zainspirować się grą Kings and Merchants [Knights and Merchants]; był w niej centralny magazyn — jeśli może pomóc w balansie i niczego nie zepsuje, można go dodać. Sprawdź, czy te zmiany nie zepsują balansu; mimo wszystko chciałbym je wprowadzić, więc postaraj się.”

Wymagania wynikające z prośby: (1) czynności postaci są **widoczne i kauzalne** (budynek nie ruszy, dopóki budowniczy nie dojdzie; towar nie trafi do magazynu, dopóki ktoś go nie przyniesie), (2) bilans ekonomii **nie ulega pogorszeniu** na typowej osadzie, (3) **drogi i magazyny** zyskują znaczenie, (4) rozważamy centralny magazyn.

## Stan obecny {#e-stan}

Dziś ruch jest „cieniem symulacji” (rozdz. {{ref:ruch}}): ekonomia liczy nominalne tempa, a ludzie na ekranie chodzą w tle. Prędkości widocznych postaci (0,25 / 0,35 / 1,4 / 2,2 pola na minutę) nie mają związku z czasem logiki (budowniczy nosi sztukę materiału „w 0,2 min” bez względu na odległość; producent odkłada towar w Składzie bez czasu). Jedyną zależnością od odległości jest sprawność `Logistics` (producent daleko od Składu daje do −30% mniej) — liniowa i niezależna od rodzaju budynku. Postaci nie wykonują więc swoich zadań: drwal nie ścina konkretnego drzewa, a „nosiciel” jest ozdobą.

## Wniosek 1: tempo gry decyduje o tym, jak szybko mogą chodzić ludzie {#e-tempo}

Czas gry biegnie dziś **4 s na minutę gry** (przy prędkości ×1). Tempa ekonomii są „na minutę” (drwal: 1 pień/min, Tartak: 2 deski/min), więc w czasie rzeczywistym drwal powinien produkować pień co 4 sekundy. Jeśli ludzie mają fizycznie chodzić po drzewa i do magazynu (odległości 5–25 pól), muszą się poruszać **szybko albo gra musi biec wolniej**: widoczna prędkość = `pola/min ÷ sekundy na minutę`.

{{tabela:tempo}}

Żeby fizyczny transport miał narzut rzędu 9% na typowej odległości 12 pól (tyle ma dziś model liniowy), ludzie muszą pokonywać ok. **18 pól na minutę gry**. Przy obecnym tempie 4 s/min to **4,5 pola na sekundę** (postać „biegnie” po ekranie 4× szybciej niż spacerujący), przy tempie 12 s/min — **1,5 pola/s**, czyli zwykły marsz (pole ma 128 px szerokości). Wniosek: aby postacie wyglądały wiarygodnie, **bazowe tempo gry należy spowolnić do ok. 12 s na minutę gry** (przyciski prędkości ×1 / ×2 / ×3 / ×6, gdzie ×3 odpowiada dzisiejszemu ×1). Zmiana nie dotyka bilansu: ekonomia, testy i terminy haraczu liczone są w minutach gry; zmienia się tylko, ile sekund trwa minuta.

## Wniosek 2: skala transportu {#e-skala}

Pomiar w osadach botów (tabela poniżej; skrypt `tools/probe_logistyki.js`) pokazuje, ile towaru trzeba przenieść: **27–32 szt./min wyjść i 10–16 szt./min wejść** (w 90. minucie), średnio ok. 12 pól od magazynu, czyli obciążenie transportu rzędu **400–780 sztuko-pól na minutę** (w 40. minucie ok. 370–540).

{{tabela:sonda_logistyki}}

Konsekwencje:

1. **Nosiciele z puli ludności nie wchodzą w grę.** Przy ładunku 6 szt. i prędkości 18 pól/min jeden nosiciel przenosi 54 szt.·pole/min, czyli potrzeba 7–14 nosicieli, a wolnych ludzi (ludność − pracownicy − budowniczowie) jest 2–11. Gdyby nosiciele byli ludnością, osada byłaby ograniczona transportem o 30–70% i ekonomia zostałaby przestrojona od nowa (nominalne tempa specyfikacji są „netto po marszu robotnika” — praca przy noszeniu jest już w nich zawarta).
2. **Producent sam noszący towar** (model ze specyfikacji) działa tylko dla producentów o małych przepływach: Tartak (2 deski/min wyjścia i 1 pień wejścia) zająłby przy 12 polach ok. 2/3 czasu pracownika, Piekarnia (3,3 chleba/min) więcej niż cały czas. Czas noszenia **musi więc być interpretowany jako sprawność (narzut), a nie dosłowna wędrówka jedynego robotnika.**
3. **Magazyn centralny** istnieje już w grze: Dwór (komora 20 szt. każdego towaru) jest celem transportu, gdy nie ma Składu, a Skład (+80 szt.) jest magazynem okręgowym; odległość do najbliższego z nich wyznacza sprawność. Osobny budynek „Magazyn centralny” nie jest potrzebny do bilansu (rozważamy go dopiero, jeśli bramki bilansu wykażą, że gracz nie ma jak naprawić odległych producentów — „Duży Skład” z większym promieniem bez kary).

## Model: sprawność z cyklu pracy {#e-model}

Fizyczny model jest **kalibrowany do tego, co już zatwierdzono** (reguła specyfikacji: „kalibruj prędkość chodu i rozmiar ładunku, nie liczby z tabeli”). Każdy producent dostaje cykl `czas pracy + czas marszu`, a ekonomia dostaje sprawność:

```
Tw    =  ładunek / Σ wyjść                            ładunek (RULES.cycle.load), Σ wyjść [szt./min]
trips =  max(1, Σ wejść / Σ wyjść)                    kursy po wejścia i wyjścia: ładunek niesie się w obie strony naraz
Th(L) =  trips · (2·L / v + t_obsługi)
eff   =  min( 1,  (Tw + Th(L_ref)) / (Tw + Th(L)) )
```

W projekcie wstępnym przyjęto ładunek 6 szt. i `L_ref` = 6 pól; **po strojeniu na botach (aneks {{ref:e-wyniki}}) wartości końcowe to ładunek {{v:Data.RULES.cycle.load}} szt., `L_ref` = {{v:Data.RULES.cycle.ref}} pól**, obsługa {{v:Data.RULES.cycle.handle}} min, v = {{v:Data.RULES.walk.v}} pól/min.

Cechy modelu:

- **Tylko na niekorzyść:** `eff ≤ 1` — mała odległość nie daje nadwyżki ponad tempo nominalne, więc **nic nie może przyspieszyć gospodarki ponad specyfikację**; odległość powyżej `L_ref` obniża plon.
- **Kalibracja do dzisiejszej krzywej:** dla producenta o tempie ok. 1 szt./min model odtwarza dawną krzywą liniową z błędem do ok. 0,15 w całym zakresie 0–40 pól (jest łagodniejszy za `L_ref`, bo nie ma „dna” 0,7); średnia sprawność w osadach botów wychodzi zbliżona do dawnej (0,88–0,90).
- **Drogi** zmniejszają koszt pola do 0,6 (a prędkość rośnie ×1,6): ta sama odległość po drodze daje wyższą sprawność — **droga naprawdę się zwraca**.

{{wykres:fizyczny}}

### Role i ich cykle {#e-role}

Poszczególne klasy czynności mają własne składniki cyklu; wszystkie liczone są z tej samej mapy kosztów `Path.field`:

Tabela: Fizyczne składniki sprawności (plan)
| Rola | Cykl widoczny na ekranie | Co zależy od odległości (sprawność) |
|---|---|---|
| **Drwal** | idzie do konkretnego drzewa (pole z `trees > 0` najbliżej chaty), ścina (animacja, drzewo znika z pola), niesie pień do drzwi / Składu | odległość do najbliższego drzewa (próg 4 pola, spadek na 12 polach do min 0,5) — **las musi rosnąć blisko chaty** (Leśniczówka ma sens); kolejność ścinania deterministyczna (bez globalnego `RNG`) |
| **Leśnik** | idzie na wolne pole obok, sadzi sadzonkę, wraca | odległość do wolnego pola pod sadzonkę |
| **Cieśla (Tartak)** | idzie po pień (do Składu / drwala), niesie do tartaku, piłuje (animacja), niesie deski do magazynu | odległość wejść (pnie) i wyjść (deski) |
| **Górnicy, kamieniarze, gliniarze** | schodzą w głąb obrysu, wracają z taczką do drzwi, wynoszą do magazynu | odległość wyjścia do magazynu |
| **Rolnicy, zbieracze, sadownicy, rybacy** | pracują w polu / sadzie / lesie / na brzegu (animacje narzędzi), niosą kosz / sieć | odległość wyjścia; rybak musi mieć dojście do brzegu |
| **Młynarz, piekarz, kasza, huta, kuźnia, zbrojownia…** | po drodze w obie strony: wejścia z magazynu, wyjścia do magazynu | odległość wejść i wyjść (dojazd łączony: ładunek w obie strony) |
| **Budowniczy** | z Dworu / Składu z materiałem **idzie na plac**; budowa startuje dopiero po dojściu; noszenie partiami po 4 szt. | czas dojścia przed pracą; czas noszenia = odległość Dwór/Skład → plac |
| **Myśliwy** | (jest) idzie, celuje, strzela, niesie | odległość do zwierzyny (jest) |
| **Karawana (Saraceni)** | wyrusza z Targu z partią towarów, **idzie do krawędzi mapy**, sprzedaje, wraca z kasą; złoto trafia do skarbca po powrocie | opóźnienie 2·L/v; liczba karawan = Targi i Karawanseraj |
| **Statek (Wikingowie)** | odpływa z Przystani na czas wyprawy i wraca z łupem (jest w logice) | bez zmian logiki; tylko ruch na ekranie |
| **Wolni obywatele** | siedzą, spacerują, idą na Targ / do Kościoła | brak (nie pracują) |

### Budowniczowie {#e-budowa}

Dziś budowniczy nosi sztukę w 0,2 min (5 szt./min) i buduje od razu. W modelu fizycznym: dojście z Dworu na plac trwa `L / v` (czas bez pracy), noszenie idzie partiami po `c = 4` szt.: `czas partii = 2·L_skład→plac / v + 0,1 min`, czyli `0,2 min/szt.` pozostaje przy odległości ≤ ok. 6 pól, a rośnie wraz z nią (na 14 polach ok. 0,4 min/szt.). Ponieważ w specyfikacji budowniczowie mają 60–73% bezczynności (wąskim gardłem są deski), wydłużenie noszenia o kilkadziesiąt procent na dalekich placach powinno mieścić się w tym luzie; sprawdza to bramka bilansu.

### Karawana {#e-karawana}

Targ sprzedaje dziś natychmiast z całego zapasu (rozdz. {{ref:haracz}}). W modelu fizycznym towar handlowy (kadzidło, tkanina, ceramika) zbiera się przy Targu do partii (6 szt. lub po 3 min), a karawana (wielbłądy) idzie do **najbliższej krawędzi mapy** (ok. 24 pola od Dworu, ≈ 1,3 min przy 18 polach/min), tam następuje sprzedaż po aktualnej krzywej cen, a złoto wraca w drugim 1,3 min. Przepływ jest ten sam, zmienia się opóźnienie ≈ 3 min (gotówka w pierwszej sprzedaży pojawia się później), co przy pierwszym terminie w 50. minucie nie ma znaczenia. Napady na karawanę zostają liczone ze skarbca (wg specyfikacji), a na ekranie ilustrowane zdarzeniem na trasie karawany.

## Ochrona bilansu {#e-bilans}

Zasady, które mają zagwarantować „bez zepsucia balansu”:

1. **Przełącznik `settings.physical`** (jak `logistics` i `fauna`): w testach specyfikacji `false` — **58 scenariuszy daje dokładnie te same wyniki**; w grze włączony (`?physical=0` wyłącza).
2. **Nigdy ponad nominał:** `eff ≤ 1` dla każdej składowej; nowe składowe (wejścia, drzewa, budowa) mają własne odległości odniesienia dobrane tak, by **średnia sprawność w osadach botów nie spadła poniżej dzisiejszych 0,88** (budżet narzutu < 10–12% dla osady „bez organizacji”, ≈ 0–3% dla osady z drogami i Składami; spec.: narzut 15% obniża ludność Franków o 18%).
3. **Bramka bilansu w testach** (`tools/physical.js`): boty R, D i N czterech nacji przy `physical = true` osiągają ≥ 90% wyniku bazowego (ludność @60/90/150, terminy haraczu) i nie wchodzą w głód dłuższy niż 10 min; scenariusze kryzysowe (brak jedzenia, pożar, zaraza) dają się uratować; dodanie drogi lub Składu **podnosi** wynik (czułość: ≥ +3 pp sprawności na producenta oddalonego o ≥ 15 pól).
4. **Determinizm i JSON:** stan fizyczny w `state.phys` (JSON), zero wywołań globalnego `RNG` (wybór drzew deterministyczny: najbliższe pole z drzewami), snapshot / restore jak dotąd.
5. **Brak zakleszczeń:** brak dojścia (zabudowa odcięła drogę) daje sprawność minimalną (nie zero) i komunikat „brak dojścia” w Doradcy.
6. **Wydajność:** pola kosztów `Path.field` liczone raz na zmianę układu (jak dziś w `Logistics`), cykle w logice to wzory, a nie symulacja zdarzeń; ruch postaci to wizualizacja zsynchronizowana z tymi wzorami (`Walkers`).

### Rozważone i odrzucone warianty {#e-warianty}

- **Pełna symulacja zdarzeniowa towarów** (każda sztuka jako obiekt niesiony przez postać, produkcja dopiero po dojściu): najwierniejsza, ale przy dzisiejszym tempie i skali (30 szt./min na 12 pól) wymaga ~10–14 nosicieli, których gra nie ma (patrz wniosek 2), a każda niedokładność zmienia ekonomię specyfikacji — **odrzucona jako zbyt ryzykowna dla bilansu**.
- **Wspólna pula nosicieli z ludności (styl Knights and Merchants):** pojemność transportu byłaby ograniczona wolną ludnością (2–11), a wczesna gra nie ma wolnych ludzi; wymagałaby przestrojenia ekonomii. Może wrócić jako **opcja zaawansowana** („Nosiciele” w Składach), jeśli bramki pokażą, że lokalna sprawność jest zbyt łagodna.
- **Producent jako jedyny nosiciel:** niewykonalne dla budynków o dużych przepływach (Piekarnia, Tartak, Huta) — patrz wniosek 2.

## Wzorce z gier: Twierdza, The Settlers III/IV, Knights and Merchants {#e-wzorce}

Na prośbę użytkownika mechanikę porównano z opisami i poradnikami do gier, które rozwiązywały ten sam problem (**źródła: poradniki i wiki społeczności znalezione wyszukiwarką — strony nie dało się otworzyć z poziomu środowiska, więc korzystano z ich streszczeń**). Poniższa tabela zestawia, co jest znane z tych gier i jak wygląda to w Nova Roma.

Tabela: Wzorce z innych gier i ich odpowiedniki
| Mechanika w grze wzorcowej | Gra | W Nova Roma |
|---|---|---|
| Drwal **sam niesie** pień: idzie do drzewa, ścina, wraca (do chaty / składu); „na jeden kurs do składu przypadają dwa do drzewa”; ładunek 12 szt.; **odległość drzewa i składu decyduje o wydajności**; las blisko składu | Twierdza (Stronghold, poradniki Steam i forum Heaven Games) | robotnik producenta sam nosi ładunek (rozdz. {{ref:workers}}); ładunek {{v:Data.RULES.cycle.load}} szt.; sprawność z cyklu pracy (rozdz. {{ref:fizyka}}); drwal i odległość od lasu (`treeFactor`) |
| Drwal wybiera **najbliższe drzewo**, nawet jeśli mija inne | Twierdza | `World.nearestTree` — najbliższe od drzwi, deterministycznie (rozdz. {{ref:drwal}}) |
| Drwal sadzi sam, gdy lasu brak; las warto mieć przy chacie; **1 leśnik : 2 drwale : 1 tartak** | KaM Remake, Settlers III (poradniki) | Leśniczówka sadzi przy swojej chacie; Doradca podpowiada „jedna na dwóch drwali” |
| **Budynki o krótkim czasie produkcji stawiaj najbliżej magazynu**, o długim — dalej; błąd to ignorowanie czasu produkcji i drogi do magazynu | Settlers III (poradnik) | wrażliwość na odległość zależy od tempa wyjścia (`Tw`): Piekarnia traci więcej niż drwal (rozdz. {{ref:fizyka}}) |
| **Kilka magazynów blisko siebie skraca marsz**; **kursor przy planowanym magazynie pokazuje czasy dojścia** | Settlers III/IV (poradniki) | Skład zeruje marsz lokalnie; przy stawianiu Składu — **mapa ciepła zasięgu**, a przy budynkach produkcyjnych napis „transport ≈ N pól → X% wydajności” (`Logistics.previewAt`, `fieldWith`) |
| **Dostawy na place budowy mają pierwszeństwo** przed odkładaniem do magazynu | Settlers IV (opis) | plac wcześniejszy w kolejce ma pierwszeństwo do materiałów; budowniczowie niosą materiał kursami, czas zależy od drogi (rozdz. {{ref:budowniczowie-fizyka}}) |
| Budowniczy najpierw **wyrównuje teren**, potem nosi się materiał; **buduje tylko z dostarczonym materiałem**; konieczna droga od budynku do składu | Knights and Merchants Remake (wiki) | etap 0 wyrównania, etap 1 noszenie, etap 2 budowa; dojście budowniczych na plac |
| Transport **tylko po drogach** (KaM) albo **ścieżki same się utwardzają i przyspieszają ruch** na często używanych trasach (Settlers III/IV) | KaM; Settlers III/IV | drogi **wytycza gracz** i przyspieszają ruch ×1,6 (rozdz. {{ref:drogi}}); wydeptywane ścieżki to możliwe rozszerzenie |
| Gdy towar nie jest odbierany (brak nosicieli lub popytu), **leży przed drzwiami i produkcja staje**; zator przy magazynie opóźnia dostawy | Settlers III, KaM | pełny magazyn zatrzymuje producenta bez zużywania wejść; robotnik stoi → zamiata (rozdz. {{ref:workers}}) |
| Handel przy **Targu jest natychmiastowy**, a wędrujący kupiec **jest kosmetyczny**; w Settlers III towary wożą **statki** o ustalonej pojemności (np. 3 stosy po 8 towarów) | Twierdza Crusader; Settlers III | karawana Saracenów idzie na koniec mapy i wraca, a złoto wpływa po powrocie (opóźnienie ok. 3 min) — decyzja użytkownika; okręty Wikingów odpływają na czas rejsu; **gdyby gra miała kłopot z bilansem, można zrobić karawanę kosmetyczną jak w Twierdzy** |

Wnioski dla projektu: (1) model „robotnik sam niesie ładunek” z nominalnym czasem pracy jest dokładnie tym, co robi Twierdza, a poradniki Settlers III uzasadniają jego główną konsekwencję — **wrażliwość zależną od tempa produkcji**; (2) pomysł **podglądu czasów dojścia pod kursorem** z Settlers IV został dodany jako nowa funkcja interfejsu; (3) ładunek ok. 10–12 szt. na kurs jest zgodny z Twierdzą (12 szt.); (4) rozszerzenia warte rozważenia w przyszłości: wydeptywane ścieżki, osobny „Spichlerz” na żywność (Twierdza rozdziela spichlerz i magazyn), ustawiane przez gracza punkty pracy drwala (KaM Remake).

Źródła (wyszukiwanie): poradniki i wiki Steam „Knights and Mechants Gameplay Guide”, kamremake.wiki.gg (Storehouse, Serf, Woodcutter, Buildings), stronghold.fandom.com (Wood Camp, Woodcutter, Market), poradnik Steam „Economy and building placement 101”, forum Heaven Games „Stronghold” (Woodcutter Tricks, Trees and wood), strategywiki.org i settlers.jakelee.co.uk (Settlers III), docs.settlers-united.com (Settlers IV: Buildsite priority), poradniki Settlers 3/4 na tripod i santassettlers.

## Ożywienie wizualne {#e-wizualne}

Postaci w grze zostają **jedyną widoczną reprezentacją** pracy; ich liczba odpowiada ludności: pracownicy obsadzonych budynków + budowniczowie + wolni obywatele (załoga na wyprawie znika z ekranu). Każdy obsadzony budynek ma swojego mieszkańca z pętlą czynności o okresie `1 / (tempo × eff)`, a stan budynku jest widoczny: praca, **postój** (brak wejścia, pełny magazyn — pracownik siedzi lub stoi w drzwiach), brak pracownika (pusty budynek). W razie przeszkód (zabudowanie drogi, zatopienie przejścia) czynność się zatrzymuje i Doradca pokazuje powód. Wymagane elementy graficzne to rekwizyty w ręku (siekiera, piła, kilof, motyka, sierp, młot, kosz, wiadro, sieć, worek, taczka) i niesione towary (pień, deska, kamień, worek mąki, chleb, ryba, sztabka…) w `prototyp/src/40_nature.js` (`bakeFigure`), a dla karawany i statków — sprite'y wielbłąda z towarem i łodzi.

## Plan etapów i bramki {#e-etapy}

Tabela: Etapy Fazy 9B
| Etap | Zakres | Bramka |
|---|---|---|
| **9B-0** | tempo gry (`sekundy na minutę`, domyślnie 12; przyciski ×1/×2/×3/×6, `?tempo=`), kalibracja prędkości postaci (≈ 18 pól/min), przegląd wizualny | testy bez zmian (dt-based); szybki przegląd ekranu |
| **9B-1** | role i czynności (wizualne, zsynchronizowane ze stanem logiki): mieszkaniec per budynek, pętle, rekwizyty, wolni obywatele; **zero zmian ekonomii** | scenariusze i `normal` identyczne; `browser_workers.js` (liczba postaci = ludność, każdy obsadzony budynek ma pracownika w zasięgu) |
| **9B-2** | `settings.physical`: sprawność z cyklu pracy (wyjścia, wejścia), panel „Transport”, status „brak dojścia”, droga i Skład zwracają się | `tools/physical.js`: parytet przy `false`, kalibracja krzywej, czułość na drogę i Skład, determinizm, snapshot |
| **9B-3** | drwal i leśnik fizycznie (najbliższe drzewo, deterministyczny wybór), budowniczowie (dojście, partie po 4 szt.) | bramka bilansu: boty R/D/N ≥ 90% wyniku bazowego; scenariusze kryzysowe do uratowania |
| **9B-4** | karawany (Saraceni) i statki (Wikingowie) na ekranie i w opóźnieniu logiki; napady zilustrowane na trasie | scenariusze Saracenów (S1–S7, SK1–SK4) w zakresie specyfikacji; raids.js bez zmian średniej straty |
| **9B-5** | strojenie, ew. „Duży Skład”/nosiciele opcjonalni, dokumentacja (rozdz. 12, aneks E → „Stan”), wersja WIP, nowy wzorzec regresji | komplet testów, FPS ≥ 85% sprzed zmian |

## Stan realizacji {#e-stan-realizacji}

Tabela: Postęp Fazy 9B
| Etap | Stan |
|---|---|
| 9B-0 tempo gry | ✔ 12 s na minutę gry, prędkości ×1/×2/×3/×6, marsz 18 pól/min (rozdz. {{ref:walkers}}) |
| 9B-1 role i czynności | ✔ moduł `Workers` (rozdz. {{ref:workers}}), `settings.workers`, `tools/workers.js`, `tools/browser_workers.js`; zero zmian ekonomii |
| 9B-2 sprawność z cyklu pracy | ✔ `settings.physical`, `Logistics.cycleEff`, sekcja „Transport” w karcie budynku, `tools/physical.js` (rozdz. {{ref:fizyka}}) |
| 9B-3 drwal, leśnik, budowniczowie | ✔ najbliższe drzewo, sadzonki przy chacie, dojście i kursy budowniczych (rozdz. {{ref:drwal}}, {{ref:budowniczowie-fizyka}}) |
| 9B-4 karawany i statki | ✔ karawany Saracenów, rabusie przy napadzie, okręty odpływające w rejs (rozdz. {{ref:karawany}}, {{ref:okrety}}) |
| 9B-5 strojenie i dostawa | ◐ strojenie zrobione (niżej), dokumentacja i nowy wzorzec regresji w toku |

## Wyniki strojenia i bramki bilansu {#e-wyniki}

Parametry cyklu dobrano na botach R (przepis, bez szumu) i D (opóźnienie decyzji) czterech nacji, na mapach z ziarnem nacji, przy poziomie haraczu Łatwy. Poniższe liczby to **ludność w 150. minucie** (pozostałe terminy 60 / 90 dają wyniki zbliżone) dla trzech wariantów: bez logistyki (specyfikacja), z dawną krzywą liniową (to, co gra dostarczała do Fazy 9B) oraz z modelem cyklu.

Tabela: Ludność końcowa botów: specyfikacja (bez logistyki), dawna krzywa liniowa, model cyklu pracy (ładunek 10, L_ref 8, budowniczowie niosą po 10 szt.)
| Nacja · bot | Specyfikacja | Dawna krzywa | Model cyklu | Cykl / krzywa | Cykl / specyfikacja |
|---|---|---|---|---|---|
| Frankowie R | 43 | 37 | 39 | 105% | 91% |
| Frankowie D | 43 | 37 | 40 | 108% | 93% |
| Saraceni R | 38 | 34 | 36 | 106% | 95% |
| Saraceni D | 38 | 34 | 36 | 106% | 95% |
| Wikingowie R | 38 | 34 | 36 | 106% | 95% |
| Wikingowie D | 38 | 33 | 36 | 109% | 95% |
| Słowianie R | 40 | 36 | 38 | 106% | 95% |
| Słowianie D | 40 | 37 | 36 | 97% | 90% |

Wnioski ze strojenia:

1. **Frankowie są najwrażliwsi:** mają trzy budynki z dwoma wejściami (Piekarnia, Huta, Zbrojownia), więc przy małym ładunku (6 szt.) model dawał Frankom 79% wyniku specyfikacji, czyli mniej niż dawna krzywa (86%). Ładunek 10 i `L_ref` 8 przywracają ich do 91–93%.
2. **Czas noszenia budowniczych** jest największym ryzykiem dla Wikingów (drogie budynki, Okręt 40 desek): przy kursie 4 sztuk ludność Wikingów w 60. minucie spadała do 94% wyniku z dawną krzywą (31 wobec 33), przy 10 sztukach rośnie do 106%.
3. **Tryb drwala:** zbliżenie lasu (`treeRef` 5 pól) kosztuje do kilku procent ludności (Frankowie D: 37 zamiast 39) i wymaga Leśniczówki obok drwala — nie jest to ryzyko bilansu.
4. **Karawany** nie zmieniają sumy dostaw złota Saracenów (486 zł w obu modelach), tylko opóźniają jej pojawienie się w skarbcu o ok. 3 min; bot R spełnia 5 z 6 terminów haraczu (wobec 6 z 6), zgodnie z kryterium ≥ 80%.

**Bramka bilansu** (`tools/physical.js`): dla botów R i D (z `--full` także R z szumem i N) ludność @60 / @90 / koniec ≥ **95% wyniku z dawną krzywą** i ≥ **85% wyniku specyfikacji**, dostawy haraczu ≥ 85% dostaw z dawną krzywą, głód ≤ 10 min. Dla bota N Franków i Saracenów (reaktywny, bez przepisu) wynik bazowy to 10 osób i głód, więc tam bramka porównuje tylko stosunek.

## Decyzje do potwierdzenia {#e-decyzje}

Poniższe wartości przyjęto domyślnie; można je zmienić bez przebudowy architektury (są stałymi w danych):

1. **Tempo bazowe 12 s na minutę gry** (zamiast 4) i przyciski ×1/×2/×3/×6 — warunek wiarygodnego wyglądu postaci; ×3 odpowiada dawnemu tempu (zrealizowane).
2. **Napady na karawanę nadal ze skarbca** (specyfikacja), karawana tylko ilustruje i opóźnia sprzedaż.
3. **Magazyn centralny = Dwór**; nowy budynek („Duży Skład”) tylko jeśli bramki bilansu tego wymagają.
