# Ekonomia przepływowa {#ekonomia}

Moduł `Economy` implementuje specyfikację v3.6 jako **model przepływowy**: obsadzony budynek produkuje stałą ilość towaru na minutę gry, o ile ma zapłacone wejścia i miejsce w magazynie. Brak wejścia albo pełny magazyn zatrzymuje budynek **bez żadnej kary** (i bez zużycia wejść). Model nie zna tras ani wozów — robotnik „fizycznie” nosi towar tylko na ekranie (cień symulacji), a wydajności są nominalne; odległość uwzględnia opcjonalna sprawność logistyczna (rozdz. {{ref:ruch}}).

## Zasady nadrzędne {#zasady}

1. **Produkcja powstaje tylko z zapłaconych wejść**, a nadwyżka bez popytu zatrzymuje budynek (limity magazynu).
2. **Jeden pracownik na budynek.** Chata, Skład, Przystań, Okręt i Dwór nie mają pracownika. Tempa w tabelach to szt./min na jeden obsadzony budynek.
3. **Premie nigdy nie są warunkiem przetrwania:** popularność, różnorodność jedzenia i Dobrobyt tylko przyspieszają grę (żaden budynek ani łańcuch nie wymaga Dobrobytu do działania).
4. **Zawory bezpieczeństwa zamiast blokad:** pierwsza Chata drwala jest darmowa, Dwór ma piłę zamkową, narzędzia można dokupić na Targu lub dorobić w kuźni zamkowej, a ludność nigdy nie spada poniżej 10 osób. Żadna sekwencja budowy nie może zablokować gry bez wyjścia (kryteria w aneksie {{ref:aneks-spec}}).
5. **Żaden towar nie zalega bez odbiorcy, którego da się zbudować** (niezmiennik zaprojektowany w specyfikacji; zalegające towary handlowe Saracenów trafiają od razu na Targ).

## Jednostki i czas {#jednostki}

Czas gry liczy się w minutach (`state.time`). `Economy.tick(dt)` przyjmuje `dt` w minutach; przy `dt ≤ 0` nie robi nic. Wszystkie tempa są „na minutę”, więc wynik dla kroku `dt` to `tempo × dt`. Ułamkowe części sztuk zbierają akumulatory (`treeFrac`, `plantFrac`, `immigrantTimer`, `starveTimer`).

## Zasoby i magazyny {#magazyny}

Zasoby gry to towary z tabeli limitów oraz trzy zasoby specjalne: **złoto** (`res.złoto`, bez limitu), **narzędzia** (`res.narzędzia`, limit 10) i **popularność** (`res.popularity`, 0–100). Każdy towar ma twardy górny limit w całej osadzie:

{{tabela:limity}}

Faktyczną pojemność towaru w danej chwili wyznacza `Economy.capOf` — wzór ze specyfikacji („Składy i logistyka”):

```
pojemność(towar) = min( limit(towar),  6 × (czynni producenci towaru)  +  20 (komora Dworu)  +  80 × (liczba Składów) )
```

Producent odkłada towar „u siebie” (6 szt. każdego wytwarzanego towaru); dopóki jest miejsce, produkcja idzie. Gdy lokalny zapas jest pełny, a Składu nie ma lub jest pełny, producent **stoi** (status **Z**) — towar nie ginie. Skład (+80 szt. każdego towaru, bez pracownika i bez narzędzia) jest neutralny w zwykłej grze, a niezbędny przy dużych jednorazowych zadaniach (np. 40 żołnierzy naraz, 12 sztuk miodu i broni na wielką wyprawę, daniny Słowian powyżej poziomu 6). „Czynny producent” to budynek **obsadzony**, którego dowolne wyjście jest danym towarem.

> [!pulapka] Pojemność liczy się per towar, a nie per budynek: np. trzy tartaki i jeden Skład dają pojemność desek `min(250, 18 + 20 + 80) = 118`. Dlatego bez Składu deski potrafią zatrzymać Tartak, gdy gracz nie wydaje ich dość szybko (Doradca ostrzega, gdy ≥ 2 budynki stoją z pełnym magazynem).

## Obsada pracowników {#obsada}

W każdym ticku `Economy.staff` wyznacza od nowa, które budynki są obsadzone (`state.staffed[uid]`):

1. Liczba wolnych ludzi = `floor(ludność) − budowniczowie w gangu − załoga na wyprawie`.
2. Budynki są sortowane: **najpierw budynki żywności** w kolejności listy priorytetów, potem reszta w kolejności budowy.
3. Dla każdego budynku z pracownikiem: gdy brakuje wolnych ludzi — status **P** (brak pracownika); gdy budynek wymaga narzędzia (T) i jeszcze go nie dostał — zużywa 1 narzędzie z magazynu (`tooled[uid] = true`, jednorazowo na budynek), a gdy narzędzi brak — status **T** i budynek czeka.
4. Obsadzony budynek zmniejsza pulę wolnych ludzi o 1.

{{tabela:priorytet_obsady}}

Obsada jest **dyskretna** (budynek jest obsadzony albo nie), a nie proporcjonalna — to implementacyjna realizacja zasady ze specyfikacji „gdy ludzi brakuje, najpierw obsadzane są budynki żywności”. Narzędzie raz wydane „przywiązuje się” do budynku (po wyburzeniu lub pożarze nie wraca).

## Algorytm produkcji budynku {#produkcja}

Dla każdego obsadzonego producenta (w kolejności z tabeli poniżej) `Economy.tick` wykonuje:

1. **Budynki jedzące z nadwyżki** (Kopalnia żelaza, Kopalnia węgla, Wytwórnia kadzidła, Kopalnia darniowa): jeśli zapas jedzenia jest mniejszy niż 5 minut zużycia ludności, budynek stoi (status **J**) — ludność ma pierwszeństwo.
2. **Świątynia** (Kościół / Meczet / Kapliczka) nie produkuje; spala `0,3 × dt` dobra nacji i — jeśli jest z czego — liczy się jako zasilona do Dobrobytu (rozdz. {{ref:ludnosc}}).
3. **Wyczerpane złoże** (tylko gdy ustawiono skończone złoża): status **X**.
4. **Wejścia.** Dla każdego wejścia `g` liczony jest ułamek `min(1, zapas g / popyt g)`, gdzie popyt to suma zapotrzebowania **wszystkich obsadzonych odbiorców** tego towaru w bieżącym ticku — gdy kilku odbiorców dzieli niedobór (pnie: Tartak, Wypalarka, Garncarnia, Bania; węgiel: Huta i Zbrojownia), każdy dostaje ten sam ułamek. Najmniejszy ułamek wejść daje `frac`.
5. **Drwal:** `frac` ogranicza liczba drzew na mapie (`drzewa / (tempo × dt)`).
6. **Mnożniki lasu i logistyki:** `frac ×= forestMult × Logistics.effOf`. `forestMult` to `min(1, drzewa / próg lasu)` dla budynków leśnych (dziś Słowianie), a dla Chaty myśliwego `Fauna.gameMult` (zwierzyna w łowisku; Chata myśliwego nie zależy od lasu); `effOf` to sprawność logistyczna (1 przy wyłączonej opcji).
7. **Kara głodu:** `hungerK = 0,75` dla producentów, którzy nie wytwarzają jedzenia, gdy trwa głód ≥ 5 min (producenci żywności pracują z pełną mocą), w przeciwnym razie 1.
8. **Pełny magazyn:** dla każdego wyjścia towaru z listy limitów `frac` jest ograniczany tak, by produkcja nie przekroczyła `pojemność − zapas`; wtedy status **Z** i wejścia **nie** są zużywane.
9. Zużycie wejść: `zapas −= wejście × frac × dt`.
10. Wyjścia: `zapas += tempo × skala × frac × popMult × hungerK × dt` (z ograniczeniem do wolnego miejsca). Leśniczówka zamiast towaru dodaje do `plantFrac`; Chata drwala zdejmuje z mapy tyle drzew, ile zrobiła pni; Chata myśliwego zwiększa licznik `huntAcc` (rozdz. {{ref:fauna}}).

Zbiorczo, wydajność obsadzonego budynku wynosi:

```
wyjście/min  =  tempo × skala_Wikingów × frac × popMult × hungerK
frac         =  min( 1,  ułamek_wejść,  drzewa_dla_drwala,  wolne_miejsce_w_magazynie )  ×  forestMult × logistyka
popMult      =  clamp( 1 + 0,004 × (popularność − 50),  0,8;  1,2 )
```

`popMult` jest liczony raz na tick z popularności bieżącego ticku; `b.eff = frac × popMult × hungerK` to liczba pokazywana w interfejsie jako „Pracuje — N% wydajności”.

> [!kod] Zużycie wejść **nie** jest mnożone przez `popMult` — wyższa popularność daje więcej towaru z tych samych wejść (premia), a niższa mniej. Skala Wikingów (`Economy.VIK_RATE`) mnoży zarówno wejścia, jak i wyjścia: Chata drwala 1,3, Leśniczówka 2,0, Tartak 1,3 (czyli 1,3 pnia → 2,6 deski).

### Kolejność przetwarzania {#kolejnosc}

Kolejność ma znaczenie tylko tam, gdzie dwa budynki sięgają po ten sam towar w jednym ticku. Producenci są przetwarzani w poniższej kolejności („woda i drewno → surowce → przetwórstwo → Dobrobyt”); budynki spoza listy idą na końcu:

{{tabela:kolejnosc_produkcji}}

Po pętli produkcji: dojrzewają sadzonki (`saplings` → drzewa), działają zawory Dworu, następuje zużycie jedzenia, podatki i imigracja (rozdz. {{ref:ludnosc}}).

## Narzędzia i zawory bezpieczeństwa {#narzedzia}

Jedno uniwersalne **narzędzie (T)** jest potrzebne wyłącznie do obsadzenia budynków specjalistycznych. Budynki podstawowe (drwal, leśnik, myśliwy, farma, rybak, las kadzidlany, winnica…) obsadza się bez narzędzia, bo klasyczna pułapka z Settlers (gracz zużywa narzędzia na proste budynki i staje bez żelaza) w testach zabijała casualowych Franków.

{{tabela:narzedzia_T}}

Źródła narzędzi i zawory:

- **zapas startowy** (Frankowie 14, Saraceni 8, Wikingowie 14, Słowianie 8), limit magazynu 10;
- **Kuźnia narzędzi** (Frankowie, Wikingowie): sztabka → narzędzie, 1,2/min;
- **kuźnia zamkowa** (zawór Dworu): 0,125 narzędzia/min, **tylko** gdy zapas narzędzi jest mniejszy niż 1 i jakiś budynek czeka na narzędzie (ok. 1 sztuka na 8 min, do pełnej sztuki);
- **zakup na Targu:** 20 zł za sztukę, automatycznie, gdy stoi czynny Targ, jest złoto i brakuje narzędzia. Frankowie nie wydają złota poniżej **rezerwy na żołd** brakujących do najbliższego terminu żołnierzy (`Tribute.soldierReserve`);
- **Targ nie wymaga narzędzia** (inaczej Saracen bez zapasu nie wyszedłby z blokady).

W normalnej grze po zmianach żaden budynek nie czeka na narzędzie; Targ zostaje ratunkiem przy błędnej kolejności budowy.

## Drewno i las {#drewno}

Drzewa są **globalnym zasobem mapy**: `World.treeCount()` sumuje `tile.trees`. Chata drwala zdejmuje drzewa (`World.takeTrees` — losowe pole z drzewami, globalny `RNG`) i nie wytnie więcej drzew, niż jest na mapie. Leśniczówka co chwilę „sadzi” sadzonki: `plantFrac` rośnie o `tempo × popMult × dt`, a każda całkowita jedynka tworzy sadzonkę, która po czasie dojrzewania nacji staje się drzewem (`World.addTree` — losowe wolne pole bez drogi, złoża i cechy blokującej, `trees < 3`).

Tabela: Las według nacji
| | Frankowie | Saraceni | Wikingowie | Słowianie |
|---|---|---|---|---|
| Drzewa na mapie | {{v:Data.FACTIONS.franks.treesTarget}} | {{v:Data.FACTIONS.saracens.treesTarget}} | {{v:Data.FACTIONS.vikings.treesTarget}} | {{v:Data.FACTIONS.slavs.treesTarget}} |
| Dojrzewanie [min] | {{v:Data.FACTIONS.franks.treeGrowthMin}} | {{v:Data.FACTIONS.saracens.treeGrowthMin}} | {{v:Data.FACTIONS.vikings.treeGrowthMin}} | {{v:Data.FACTIONS.slavs.treeGrowthMin}} |
| Chata drwala [pnie/min] | 1 | 1 | {{v:Economy.VIK_RATE.woodcutter}} | 1 |
| Leśniczówka [drzewa/min] | 1 | 1 | {{v:Economy.VIK_RATE.forester}} | 1 |
| Tartak | 1 pień → 2 deski | 1 → 2 | 1,3 → 2,6 | 1 → 2 |
| Próg gęstości lasu (plon × min(1, drzewa / próg)) | — | — | — | {{v:Data.FOREST_REF.slavs}} (Zbieracz, Barć, Łowca futer) |

Drewno jest osią każdej nacji, ale w innym kierunku: Wiking opiera się na nim najmocniej (szybki wzrost i największe zużycie — 1 leśnik utrzymuje 1,5 drwala), Saracen najsłabiej (powolny wzrost, mała zależność). U Słowian las jest dodatkowo **źródłem plonu**: poniżej 200 drzew plony zbieracza, Barci i Chaty łowcy maleją liniowo (rozdz. {{ref:slowianie}}).

**Piła zamkowa** (zawór Dworu) zawsze przerabia do 0,6 pnia/min na deski w stosunku 1:1, jeśli są pnie i miejsce — chroni przed zablokowaniem gry bez tartaku.

**Zawory budulca:** gdy nie stoi Kamieniołom (Frankowie) albo Glinianka (Saraceni) i zapas kamienia (gliny) jest poniżej 6, Dwór dodaje 0,4 sztuki na minutę — pozwala zbudować pierwsze budynki wymagające tego surowca.

## Woda {#woda}

Woda jest zasobem globalnym (limit 40). Producenci: **Chata nosiwody** 1,5/min oraz **Qanat** (Saraceni) 4,5/min. Odbiorcy: Piekarnia 0,75, Gaj daktylowy 0,6, Plantacja bawełny 0,6, Miodosytnia 0,5, Łaźnia 0,5, Garbarnia 0,4, Bania 0,3 wody/min. Mieszkańcy czerpią ze studni tylko wizualnie. U Saracenów woda jest realnym ograniczeniem: trzeci Gaj przy jednej nosiwodzie pracuje na 83%; Qanat opłaca się dopiero przy 6 lub więcej odbiorcach wody (zastępuje trzy nosiwody jednym robotnikiem).

## Złoża {#zloza}

Kamieniołom, Kopalnia żelaza, Kopalnia węgla, Glinianka i Kopalnia darniowa stoją **tylko na złożu** swojego surowca (obrys 3×3 musi obejmować pole ze złożem), a złoże jest zarezerwowane dla pasującej kopalni (nie postawimy tam innego budynku). Liczba miejsc pod kopalnie nie jest parametrem gry, lecz **mapy**; generator gwarantuje minima, żeby gra się nie zacięła:

Tabela: Złoża na mapie (Data.FACTIONS[].deposits; minimum gwarantuje generator terenu)
| Budynek | Złoże | Domyślnie miejsc | Minimum | Skutek braku (spec.) |
|---|---|---|---|---|
| Kamieniołom (Frankowie) | kamień | {{v:Data.FACTIONS.franks.deposits.stone}} | 1 | 0 miejsc: brak Tartaku i Huty, haracz 0/7 |
| Kopalnia żelaza (Frankowie) | żelazo | {{v:Data.FACTIONS.franks.deposits.iron}} | 1 | 0: brak broni |
| Kopalnia węgla (Frankowie) | węgiel | {{v:Data.FACTIONS.franks.deposits.coal}} | 2 | 1 miejsce: pół broni; 0: haracz 2/7 (sztuka broni zużywa 2 węgle) |
| Glinianka (Saraceni) | glina | {{v:Data.FACTIONS.saracens.deposits.clay}} | 1 | 0: ludność 14, 22 budowy w kolejce |
| Kopalnia darniowa (Wikingowie) | ruda darniowa | {{v:Data.FACTIONS.vikings.deposits.peat}} | 1 | 0: 0 wypraw |
| Chata rybaka (Wikingowie) | brzeg morza | 6 miejsc na brzegu | 6 | limit `settings.shoreSpots` |

Opcjonalnie scenariusz może ustawić **skończone złoże** (`state.depositLeft`, np. `{ clay: 60 }`): kopalnia pracuje, aż zasób się wyczerpie, po czym stoi (status **X**) — wyczerpanie zatrzymuje budowę, a nie ekonomię.

## Złoto {#zloto}

Złoto pochodzi wyłącznie z **podatków** (0 / 0,05 / 0,10 / 0,15 zł na osobę na minutę), **sprzedaży na Targu** (Saraceni, rozdz. {{ref:haracz}}) i **łupu z wypraw** (Wikingowie: 30 zł, wielka wyprawa 80 zł); żaden budynek nie ma stałej produkcji złota. Wydatki: koszty złotem przy otwarciu placu (Kościół / Meczet / Kapliczka 80 zł, Koszary 60, Qanat 60, Łaźnia 40, Bania 40, Strażnica 40, Karawanseraj 100), zakup narzędzi (20 zł), żołd Franków (3 zł na żołnierza), utrzymanie Strażnicy (0,6 zł/min) i płatność haraczu (Saraceni).
