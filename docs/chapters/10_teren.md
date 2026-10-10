# Teren, klimaty i mapy {#teren}

Teren to warstwa przestrzenna dodana do ekonomii w Fazie 5 („teren v2”). Jej zasada: **klimat zmienia teren, wygląd i faunę — nie ekonomię**. Te same liczby (koszty, tempa, haracz) obowiązują na każdej mapie; mapa wpływa na to, gdzie da się budować, jak daleko jest do surowców i czy trzeba iść brodem. Generator jest deterministyczny: ta sama nacja, klimat, typ i ziarno dają tę samą mapę.

## Mapa i kafle {#mapa}

Mapa ma **48 × 48 pól** (`MapGen.SIZE`). Dwór (4×4) stoi pośrodku: jego obrys zaczyna się w polu (22, 22), środek planu to (24, 24). Pole (kafel) ma strukturę opisaną w rozdz. {{ref:stan-gry}}: `h` (0 woda, 1 ląd, 2 skała), `e` (poziom wysokości 1–4), `wk` (rodzaj wody), `k` (cecha terenu), `trees`, `deposit`, `occup`, `road`, `pad`. Po wygenerowaniu mapa dostaje `map.meta`: `climate`, `type`, `seed`, `fid`, `attempt`, `valid`, `why` (lista powodów odrzucenia), `stats` (liczniki z walidacji) oraz `river` (punkty rzeki i brody) i `fx` (parametry wizualne).

## Klimaty i typy map {#klimaty}

Cztery klimaty × sześć typów map daje 24 kombinacje (Wikingowie zawsze dostają mapę nadmorską, więc dla nich 4). Skrót `?play=nacja&climate=…&map=…&seed=N` uruchamia dowolną; domyślnie nacja startuje w swoim klimacie (Frankowie: umiarkowany, Saraceni: pustynny, Wikingowie: śnieżny, Słowianie: Europa Wschodnia), na mapie nadmorskiej i ze stałym ziarnem (777 / 888 / 999 / 1111) — układ drzew i złóż jak w pierwszych wersjach.

{{tabela:klimaty}}

{{tabela:typy_map}}

Nazwy typów map zależą od klimatu (`Data.mapTypeName`): np. w pustyni „rzeczna” to „Dolina rzeki”, „jeziorna” — „Oazy”, „bagnista” — „Wydmy i oazy”, „górzysta” — „Mesy i kaniony”; w śniegu „nadmorska” to „Fiordy”, „jeziorna” — „Jeziorna (zamarznięta)”, „bagnista” — „Torfowiska”; w Europie Wschodniej „bagnista” to „Rozlewiska”, a „nizinna” — „Step i puszcza”.

## Potok generatora {#generator}

`MapGen.generate(fid, opts)` buduje najpierw bazę starym generatorem (zasiewa globalny `RNG`): pas morza przy zachodniej krawędzi (tylko mapa nadmorska; dla Wikingów szeroki — start zawsze nad morzem), skały (nie bliżej niż 9 pól od środka), kępy drzew, złoża (gwarantowana liczba miejsc z danych nacji, poza placem Dworu), wyczyszczony plac 8×8 pod Dwór i dopasowanie liczby drzew do celu nacji (300 / 150 / 450 / 300). Potem `Terrain.apply` nakłada teren v2 **własnym PRNG** (`Terrain.prng`), więc dotychczasowy układ drzew i złóż oraz przeplot losowań logiki pozostają takie jak dawniej.

{{diagram:teren}}

`Terrain.apply` próbuje **do 8 razy** (ziarno próby: `hash(klimat|typ) ⊕ (ziarno + 7919 × próba)`); pierwsza próba, która przejdzie walidację, wygrywa, a gdy żadna nie przejdzie, mapa zostaje z `meta.valid = false` i listą powodów (testy wymagają `valid` dla całej macierzy nacja × klimat × typ × ziarna).

### Woda {#woda-teren}

- **Morze** (`sea`) — pas z generatora; w klimacie śnieżnym przy brzegu pojawia się lód.
- **Jeziora i stawy** (`blobWater`): nieregularne plamy o promieniu 2,6–4,2 (typ „jeziorna”: 3,2–6,0) i 1,3–2,3 (stawy); liczby wg typu mapy; nie bliżej Dworu niż `plac + promień + 2,5`, nie na istniejącej wodzie. W klimacie śnieżnym zamarzają (`ice` — **przechodnie**), w pustynnym każde jezioro i staw otacza oaza.
- **Rzeka** (`makeRiver`, typ „rzeczna”): meandrująca krzywa w poprzek mapy w odległości ≥ 9,5 + 1,6 pola od Dworu, szerokość 1,6–2,6; **trzy brody** (`ford`, przechodnie płycizny): najbliższy Dworowi punkt rzeki i po jednym w odległości 24–34 punktów wzdłuż biegu.

### Wysokości, płaski start i wzgórza {#wysokosci}

Wysokość `e` powstaje z szumu fbm: pola lądu są szeregowane rangą i dzielone na poziomy wg udziałów typu mapy (`shares`; typ „górzysty” ma 4 poziomy, „bagnista” 1). Potem: (1) **płaski plac** wokół Dworu (promień {{v:Terrain.PLAZA_R}} pola) i **obszar początkowej zabudowy** (do {{v:Terrain.EARLY_R}} pola wszystko ma `e = 1` — nic nie utrudnia pierwszych budynków, wzgórza zaczynają się dalej); (2) niziny przy wodzie (plaże, doliny rzek); (3) usunięcie pojedynczych kolców wysokości; (4) **„wzgórza decyzyjne”**: 2–4 płaskowzgórza (`e = 2`) w pierścieniu 16–24 pól od Dworu (0 w typie „górzystym”, 1 w „bagnistym”), których stoki wymagają wyrównania (rozdz. {{ref:zabudowa}}) — wpływają na wybór miejsc dopiero po rozbudowie osady.

### Klify {#klify}

Pole lądu, którego sąsiad leży o co najmniej 2 poziomy niżej, zostaje **klifem** (`cliff`); dodatkowo najbardziej strome stoki (udział `cliff` typu mapy: 0–30%) oraz skarpy nad morzem (z szumem) — wszystko z dala od Dworu. Klif nie jest przechodni ani budowlany.

### Cechy klimatu {#cechy}

Cechy blokujące zabudowę wybierane są z kwantyli szumu spośród pól lądu poza placem startowym i poza pasem 2 pól od wody w pobliżu Dworu (żeby zostało miejsce pod Przystań, Okręt i rybaków):

- **bagno** (`bog`, na poziomie 1): udział `bog × mnożnik typu` (typ „bagnista”: co najmniej 22%, maks. 45%),
- **zaspy** (`drift`, na poziomie ≤ 2) — klimat śnieżny, **wydmy** (`dune`) — pustynny (mnożnik typu: 2,2 dla „wydm i oaz”, 0,45 dla gór),
- **ruchome piaski** (`quick`) — skupiska 3×3 (80% pól), ≥ 11,5 pola od Dworu; nieprzechodnie,
- **oazy** (`oasis`) — zielone pierścienie wokół każdej wody (pustynia); drzewa rosną tylko tu.

### Łączność {#lacznosc}

`ensureConnected` zapewnia, że ląd nie jest podzielony na odcięte kępy: każdą kępę ≥ 6 pól łączy z obszarem osiągalnym z Dworu najkrótszą ścieżką (Dijkstra po koszcie przeszkód), **przekopując** ją — woda na trasie zamienia się w bród, klif w obniżony stok, cecha blokująca znika. Osiągalność (`Terrain.reachSet`) liczona jest od Dworu po polach przechodnich i zapamiętywana per mapa.

### Drzewa i złoża {#drzewa-zloza}

- **`rePlant`**: usuwa drzewa z pól nieosiągalnych i cech blokujących, po czym dosadza do celu nacji z wagą rosnącą w kępach (szum), słabszą na wzgórzach; pustynia: tylko przy wodzie i oazach; Europa Wschodnia ×1,25, śnieg ×0,9. Drzewa nie rosną na polach z `pad`.
- **`reDeposit`**: złoże musi mieć wolny obrys 3×3 pod kopalnię z przerwą (`Data.RULES.gap`), osiągalny z Dworu, w odległości 7–22 pól od środka (do 30 przy trudnościach; w górach najpierw na wzgórzach). Obrys kopalni jest **rezerwowany** (`pad = 1`, drzewa usunięte) — gracz nie może go zalesić ani wyciąć, więc generator gwarantuje miejsce.
- **Pas brzegu Wikingów:** w promieniu 20 pól od Dworu i ≤ 3 pola od morza drzewa są usuwane i pola rezerwowane — miejsce na Przystań, 2 Okręty i 4–6 Chat rybaka.

## Walidacja {#walidacja}

`Terrain.validate` odrzuca mapę, gdy: łączność lądu < 80%, złoża są nieosiągalne, osiągalne są < 85% drzew, w odległości ≤ 14 pól od Dworu jest mniej niż 280 wolnych pól budowlanych, rzeka nie ma brodu w zasięgu 16 pól, złoże nie mieści kopalni 3×3, a dla Wikingów na mapie nadmorskiej: brzegu jest za mało (≥ 12 pól w zasięgu 16, najbliższy ≤ 13) lub nie mieści się 9 budynków nadmorskich (Przystań, 2 Okręty, 6 Chat rybaka — `shoreCapacity`). Test `tools/terrain.js` sprawdza całą macierz.

## Rodzaje pól: koszty i przechodniość {#koszty-pol}

{{tabela:cechy_terenu}}

Predykaty `Terrain.passable`, `buildable`, `cost`, `isWater` używane są też przez `World.canPlace`, `Path` i `Fauna`; droga (`road`) obniża koszt pola lądu do {{v:Terrain.ROAD_COST}}, a prędkość pieszych podnosi ×{{v:Terrain.ROAD_SPEED}}.

## Statystyki map domyślnych {#statystyki}

Wynik `tools/mapstats.js` dla ziaren domyślnych nacji (mapa nadmorska w klimacie nacji): liczba drzew równa się celowi nacji; złoża zgodne z danymi.

Tabela: Statystyki map domyślnych
| Nacja | Drzewa / cel | Pola wody | Złoża | Brzeg (pola ≤ 16) | Najbliższy brzeg |
|---|---|---|---|---|---|
| Frankowie | 300 / 300 | 489 | żelazo 2, kamień 3, węgiel 3 | 95 | 10,6 |
| Saraceni | 150 / 150 | 518 | glina 2 | 152 | 12,0 |
| Wikingowie | 450 / 450 | 666 | ruda darniowa (torf) 2 | 121 | 8,1 |
| Słowianie | 300 / 300 | 457 | brak | 67 | 12,0 |
