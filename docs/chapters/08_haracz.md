# Haracz seniora {#haracz}

Haracz jest **jedynym sposobem wywierania presji** w tej grze: scenarzysta (gracz w menu HUD) wybiera preset trudności albo poziom 1–11, a gra przelicza go na jednostki nacji tak, żeby każda płaciła w przybliżeniu tyle samo pracy. Za niedobór nie ma kary ekonomicznej w locie — niedobór zwiększa licznik braków (reputacja albo porażka misji to decyzja scenariusza). Moduł `Tribute` obsługuje terminy, płatności nacji, rynek Targu i wyprawy Wikingów.

## Poziomy i osobominuty {#poziomy}

Poziom **L** żąda **2L osobominut pracy na minutę** (1 osoba pracująca minutę = 1 osobominuta), czyli ok. 5% siły roboczej na poziom przy 42 osobach. Wartość osoby (10 osobominut) i ceny jednostek są założeniami modelu. Nacje płacą różnymi jednostkami:

Tabela: Waluta haraczu według nacji
| | Frankowie | Saraceni | Wikingowie | Słowianie |
|---|---|---|---|---|
| Jednostka | żołnierz | złoto | wyprawa okrętu | koszyk daniny: futro wyprawione, miód, wosk |
| Koszt jednostki | ok. 19 osobominut: broń 6,3 + żołd 3 zł (2,7) + osoba 10 | 1 zł ≈ 1,1 osobominuty | ok. 60: załoga 60 + miód 8 + broń 9,4 + osoba 10 − łup 27 | wartość towaru w osobominutach: futro 2,8, miód 1,5, wosk 3,0 |
| Warunek dostawy | czynne Koszary, broń, 3 zł żołdu na żołnierza, ludność ponad 10 | złoto w skarbcu | Przystań i Okręt (wielka: 2 Okręty), miód pitny, broń i załoga | towary w magazynach w terminie; łączna wartość ≥ żądanie, każdy towar ≥ 50% swojego udziału |
| Pierwszy termin | {{v:Tribute.FIRST_TERM.franks}}. min | {{v:Tribute.FIRST_TERM.saracens}}. min | {{v:Tribute.FIRST_TERM.vikings}}. min | {{v:Tribute.FIRST_TERM.slavs}}. min |

Pierwszy termin zależy od czasu dojścia do pierwszej dostawy: Wiking potrzebuje Miodosytni, nosiwody, Wypalarek, Huty, Zbrojowni, Przystani i Okrętu, więc dostaje 50 minut więcej niż Frank. Przesunięcie z 95. na 110. minutę podniosło odsetek przejść poziomów 7 / 8 przez zwykłego gracza z 67 / 33% do 83 / 75%.

### Skala poziomów {#skala}

Wartość żądana na 15 minut (jedna „rata”), wg tabeli `Tribute.RATE`:

{{tabela:haracz_skala}}

Wykres poniżej pokazuje, że po przeliczeniu na osobominuty wszystkie cztery nacje płacą tyle samo pracy na każdym poziomie (linie nakładają się na prostą 30 × poziom):

{{wykres:haraczu}}

## Presety i terminy {#presety}

Presety dobrano tak, żeby przechodził je podobny odsetek casualowych graczy w każdej nacji (wyniki w aneksie {{ref:aneks-spec}}). Poziom Wikinga w presecie Mistrz (12) wykracza poza tabelę — żądanie liczone jest liniowo od poziomu 1 (`RATE[1] × L`).

{{tabela:presety}}

{{tabela:terminy}}

**Terminy co 15 minut**, żądanie jest **skumulowane**: w terminie nr *n* liczy się łączna dostawa od początku haraczu względem `⌊ rata × n ⌋` (wyprawy zaokrągla się w dół), a braki przechodzą na następny termin. **Ogłoszenie** pojawia się 30 minut przed pierwszym terminem — komunikat z listą budynków łańcucha, których jeszcze nie ma (`Tribute.NEED_LIST`), ponawiany w Doradcy aż do ukończenia łańcucha. Wynik każdego terminu zapisuje `tribute.log` (`n`, czas, wymagane, dostarczone, spełnione), a liczniki `met` i `missed` pokazuje panel Haracz.

> [!spec] **Kryterium przejścia** poziomu w testach: co najmniej 80% terminów z żądaniem spełnionych, spełniony ostatni termin, najwyżej 10 min głodu i co najmniej 24 osoby na końcu. Ocena na 6 terminach po pierwszym (okno 150 / 140 / 200 / 150 min dla Franków / Saracenów / Wikingów / Słowian — `TestBots.EVAL_END`).

## Frankowie: żołnierze {#h-franks}

Gdy haracz jest ogłoszony, a **Koszary są obsadzone**, co minutę przybywa do 2 żołnierzy (`soldierFrac += 2 × dt`), dopóki dostawa nie pokryje żądania na najbliższy termin. Każdy żołnierz zużywa **1 broń**, **3 zł żołdu** i **1 osobę** (`ludność −1`), pod warunkiem że ludność wynosi więcej niż 10; gdy któregoś brakuje, dostawy wstrzymuje licznik. Nie ma losu — jeśli broń, złoto i ludzie są, żołnierz jest dostarczony.

**Rezerwa złota (`soldierReserve`):** po ogłoszeniu haraczu zakup narzędzia na Targu i otwarcie placu z kosztem w złocie nie mogą zejść poniżej `3 zł × brakujący żołnierze do najbliższego terminu`. To zawór bezpieczeństwa Franka przed „pułapką złota” — bez niego casual wydawał żołd na budynki. Żołd wiąże haracz z podatkami: poziom wymaga podatku ≥ 1, a bardzo wysokie poziomy (≥ 10) — rozbudowy ludności, podatku 2 i wina (Dobrobyt).

## Saraceni: złoto i rynek {#h-saracens}

W terminie skarbiec płaci `min(złoto, brakująca część żądania)`; zapłacone złoto zwiększa `delivered` (płatność częściowa się liczy, braki przechodzą dalej). Źródłem złota jest **sprzedaż na Targu** — czynny Targ (lub Karawanseraj) sprzedaje **z całego zapasu naraz** trzy towary po osobnych cenach:

{{tabela:rynek}}

Algorytm (`marketTick`): liczba efektywnych Targów `nM = Targi + min(2, 2 × Karawanseraje)`; mnożnik cen 1,2 przy dowolnym Karawanseraju (bez kumulacji). Co tick cena odnawia się o 1,43% luki do ceny bazowej na minutę; zapas towaru jest sprzedawany **po jednej sztuce**, każda po aktualnej cenie (nie niższej niż podłoga), a po każdej sztuce cena spada o `0,05 / nM`. Ponieważ boty i gracz sprzedają zapas na bieżąco, krzywa sprowadza się do równowagi „dochód ≈ odnowa”; w normalnej grze po 150 minutach wszystkie ceny leżą przy podłodze, więc kolejna wytwórnia tego samego towaru nic nie daje, a kolejny towar albo drugi Targ już tak.

{{wykres:cen}}

> [!decyzja] Ceny w specyfikacji są o 40% niższe niż w pierwszej wersji (trzy towary po dawnych cenach dawały 2500 zł nadwyżki przy zerowym haraczu). Karawanseraj jest świadomym pogłębieniem handlu: podnosi bazę i podłogi o 20% i liczy się jak 2 Targi.

## Wikingowie: wyprawy {#h-vikings}

`voyagesTick` działa niezależnie od haraczu (wyprawy przynoszą też łup): **po powrocie** statku (czas `until`) załoga wraca do puli, ludność maleje o stratę (1 osoba, wielka 2), magazyn traci broń (1 / 2), skarbiec dostaje łup (30 zł; wielka 80 zł i 2 narzędzia), a do haraczu doliczają się 1 lub 3 wyprawy. Wypłynięcie jest automatyczne, gdy stoi Przystań, jest wolny Okręt, a magazyn zawiera miód pitny i broń na wyprawę oraz spełniona jest reguła wysyłki (rozdz. {{ref:wikingowie}}). W trybie „Mieszane” najpierw próbowana jest wielka wyprawa na dwóch wolnych okrętach, potem zwykła na jednym. Załoga na morzu (`crewAway`) nie pracuje i nie liczy się do wolnych ludzi.

## Słowianie: danina koszykowa {#h-slavs}

W terminie `settleBasket` rozlicza **brakującą wartość** `D = żądanie skumulowane − dotychczas dostarczone`:

1. dla każdego z trzech towarów liczy jego udział `udział × D` (futro wyprawione 40%, miód 35%, wosk 25%) i bierze z magazynu tyle sztuk, ile pokrywa ten udział (lub ile jest);
2. jeśli któryś towar pokrył mniej niż **50% swojego udziału**, termin nie może być spełniony (`minOk = false`);
3. gdy po kroku 1 nadal brakuje wartości, **nadwyżka** dowolnego towaru (ponad to, co już wzięto) zasila niedobór — najpierw ta o największej wartości;
4. pobrane towary znikają z magazynu, ich wartość trafia do `delivered` i `byGood`; termin jest spełniony, gdy łączna zapłata ≥ `D` i `minOk`.

Brak któregokolwiek towaru (np. wosk spalany przez Kapliczkę, brak Woskarni) daje 0/6 terminów — spec. potwierdza to scenariuszami W4–W7 i W11 (aneks {{ref:wyniki-gry}}). Panel Haracz pokazuje `koszyk`: stan magazynu względem wymaganego i minimalnego udziału każdego towaru.

## Pojemność przepisu {#pojemnosc}

**Pojemność** to najwyższy poziom, który zdrowa osada spełnia na 6 terminach po pierwszym. Są dwie wartości: stały *przepis nacji* i *przepis po rozbudowie ludności* (3 Chaty, Sad, Mleczarnia, Myśliwy na każdy krok), bo przepis jest ograniczony liczbą chat.

Tabela: Pojemność haraczu (specyfikacja v3.6)
| Nacja | Przepis nacji | Po rozbudowie ludności | Co ogranicza |
|---|---|---|---|
| Frankowie | 9 | 13 (11 po jednym kroku) | ludność: żołnierz zabiera osobę, a żołd bierze złoto z podatków |
| Saraceni | 8 (6 bez Karawanseraju) | 8 (7 po jednym kroku) | nasycenie rynku trzech towarów; rozbudowa ludności nic nie daje |
| Wikingowie, wyprawy zwykłe | 7 | 13 (10 po jednym kroku) | miód pitny i ludność |
| Wikingowie, tryb „Mieszane” | 8 | 16 (11 po jednym kroku) | ludność i liczba okrętów (parzysta) |
| Słowianie | 7 | 12 po trzech parach łańcuchów (9 / 11 po jednej i dwóch) | liczba par futer, miodu i wosku oraz pojemność magazynów |

Głębia jest inna w każdej nacji: Frank mierzy się z ludnością (rozbudowa daje +4 poziomy, podatek 3 jest pułapką), Saracen z handlem (trzy towary i drugi rynek dają +6 poziomów, a Dobrobyt i Strażnica kosztują po 1), Wiking z logistyką wypraw (wielka wyprawa daje do +3 poziomów po rozbudowie osady), a Słowianin z lasem i koszykiem daniny (każda para łańcuchów daje ok. +2 poziomy, Skład +1).

## Doradca a haracz {#h-doradca}

`Advisor.plan(s)` podaje dla wybranego poziomu **listę budynków** potrzebnych do jego spełnienia (np. Frank: Koszary 1, Zbrojownia / Huta / Kopalnia żelaza `⌈żołnierze/min⌉`, Kopalnie węgla ×2, Piekarnia; Saracen: Targ, nosiwoda, Las kadzidlany i Wytwórnia, od poziomu 3 druga para, od 4 bawełna i Tkalnia, od 5 Garncarnia, od 7 Karawanseraj i drugi Targ; Wiking: Przystań, Miodosytnia, nosiwoda, Kopalnia darniowa, 2 Wypalarki, Huta, Zbrojownia, Okręty wg poziomu; Słowianin: pary Barć + Woskarnia i Chata łowcy + Garbarnia wg `⌈2L / 4,58⌉`) z licznikiem „mam / potrzeba” oraz notatki o ograniczeniach. Dodatkowo `Advisor.warnings` ostrzega przed brakiem Koszar (od 30 min przed terminem), brakami łańcucha i zbyt dużym zapasem złota Saracena (napad).
