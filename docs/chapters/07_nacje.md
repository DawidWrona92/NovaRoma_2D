# Nacje {#nacje}

Cztery nacje mają to samo szkielet ekonomii (rozdz. {{ref:ekonomia}}–{{ref:budowa}}), ale **inną oś napięcia** i inną walutę haraczu. Poziomy trudności i kolejność kampanii wynikają z pomiarów botami (rozdz. {{ref:trudnosc}}): Słowianie → Frankowie → Wikingowie → Saraceni; trudniejsza nacja jest odblokowywana później, zamiast wyrównywać liczby na siłę.

{{tabela:start}}

Każda nacja startuje z 14 osobami; podatek poziom 1 i racje ×1; budowniczowie 3 / 2 / 5 (domyślnie / minimum / maksimum); komora Dworu 20 szt. każdego towaru. Mapa musi gwarantować minimum złóż nacji (rozdz. {{ref:teren}}), a Wiking dodatkowo startuje zawsze nad morzem.

## Frankowie {#frankowie}

Frank jest nacją bez ograniczeń miejsca i bez zależności od mapy: ma najpełniejszy zestaw budynków (23) i jest najbardziej stabilny, ale jego napięcie leży w tym, że **kopalnie zjadają chleb**, a **haracz w żołnierzach wymaga podatku**, który obniża popularność. Etap kampanii 2/4.

Tabela: Łańcuchy Franków
| Łańcuch | Proporcja | Wyjście | Uwagi |
|---|---|---|---|
| Drewno | 1 drwal : 1 leśnik : 1 tartak | 2,0 deski/min | 3 robotników |
| Chleb | 1 Farma : 1 Młyn : 1 Piekarnia (+ 0,5 nosiwody) | 3,3 chleba/min = 19,8 osoby | 3,5 robotnika na 3,3 porcji (0,94 na robotnika); wejścia: zboże 1,5, mąka 1,5, woda 0,75 |
| Broń | 1 Kopalnia żelaza : 2 Kopalnie węgla : 1 Huta : 1 Zbrojownia | do 1,0 broni/min | 5 robotników + 1,5 porcji/min (tylko z nadwyżki); sztuka broni ≈ 6,3 osobominuty |
| Narzędzia | Huta + Kuźnia narzędzi | do 1,2 narzędzia/min | konkuruje ze Zbrojownią o sztabki i węgiel |
| Wino | 1 Winnica : 1 Winiarz | 1,0 wina/min | starcza na 3 kościoły (0,3/min każdy) |

{{diagram:lancuch|franks}}

**Haracz:** żołnierz = 1 broń + 1 osoba + 3 zł żołdu; dostawa wymaga czynnych **Koszar**; złoto na żołd chroni automatyczna rezerwa na najbliższy termin (rozdz. {{ref:haracz}}). Pojemność przepisu wynosi 9 poziomów, po rozbudowie ludności 13. **Podatek 3 jest pułapką** (popularność 42 < 45 zamraża imigrację), więc podatek 1 lub 2 jest rozsądnym zakresem; Koszary stawiamy najpóźniej 30 minut przed pierwszym terminem, a Doradca przypomina o nich w 30. minucie.

**Przepis na gospodarkę** (kolejność budowy z testu normalnej gry): (1) dwie Chaty drwala (pierwsza gratis), Tartak, Sad, Chata myśliwego, Kamieniołom, Leśniczówka; (2) Chata nosiwody, Farma, Młyn, Piekarnia, Koszary, dwie Chaty, Mleczarnia, Targ, Skład; (3) druga Leśniczówka, trzeci drwal, Kopalnia żelaza, dwie Kopalnie węgla, Huta, Zbrojownia; (4) drugi Tartak, drugi łańcuch chleba, Chata, Kuźnia narzędzi, kolejne Chaty.

**Wynik w grze** (bot R bez szumu, haracz Łatwy): ludność @20/40/60/90/150 = {{v:N('franks','R',0,'easy').pop}}, minuta 36 osób: {{v:N('franks','R',0,'easy').pop36}}, głód {{v:N('franks','R',0,'easy').famine}} min, terminy {{v:N('franks','R',0,'easy').tribute}}, dostarczonych żołnierzy {{v:N('franks','R',0,'easy').delivered}}, w skarbcu {{v:N('franks','R',0,'easy').gold}} zł. Specyfikacja (model bez przestrzeni) podaje 20 / 22 / 43 / 43 / 39 po haraczu poziomu 3 i 28 żołnierzy; gra jest zgodna co do kryteriów (6/6 terminów, brak głodu, ludność 43), a różnice na początku wynikają z modelu budowy i bramy imigracji.

## Saraceni {#saraceni}

Saracen płaci haracz **złotem z handlu trzema towarami** (kadzidło, tkanina, ceramika). Jego napięcie leży w wodzie, w daktylach dzielonych między ludzi i Wytwórnię kadzidła, w nasyceniu rynku i w ryzyku napadu na zgromadzone złoto. To nacja trudniejsza, planowana na późniejszy etap kampanii (4/4): słaby gracz przechodzi u niego poziom 3 w 62% przypadków (Frankowie 83%, Wikingowie 67%, Słowianie 100%).

Tabela: Łańcuchy Saracenów
| Łańcuch | Proporcja | Wyjście | Uwagi |
|---|---|---|---|
| Daktyle | 1 Gaj + 0,4 nosiwody | 1,6 porcji/min = 9,6 osoby | 1,14 porcji na robotnika |
| Kadzidło | 1 Las kadzidlany : 1 Wytwórnia | 1,0 kadzidła/min | Wytwórnia zjada 0,5 porcji/min (z nadwyżki) |
| Tkanina | 1 Plantacja : 1 Tkalnia | 1,0 tkaniny/min | nadwyżka 0,2 bawełny/min się marnuje (magazyn 40) |
| Ceramika | 1 Garncarnia + część Glinianki | 1,0 ceramiki/min | zużywa 1,0 gliny i 0,3 pnia/min; konkuruje z budową o glinę i drewno |
| Woda | 1 nosiwoda na 2,5 odbiorcy; 1 Qanat na 7 | 1,5 lub 4,5 wody/min | Qanat opłaca się przy ≥ 6 odbiorcach |

{{diagram:lancuch|saracens}}

**Rynek:** Targ kupuje trzy towary po osobnych cenach; każdy towar ma własną krzywą, a sprzedaż odbywa się z całego zapasu naraz (wykres w rozdz. {{ref:haracz}}). **Karawanseraj** podnosi ceny bazowe i podłogi o 20% i liczy się jak 2 Targi — pojemność przepisu Saracena rośnie z 6 do 8 (drugi Karawanseraj niczego nie dodaje); bez niego Saraceni mieliby najniższy sufit z czterech nacji o ponad 2 poziomy.

**Napad na karawanę i Strażnica:** im więcej złota w skarbcu, tym większa szansa napadu (rozdz. {{ref:zdarzenia}}); Strażnica zmniejsza ryzyko za cenę utrzymania. Pierwsze 150 zł jest nietykalne, więc zwykli i słabi gracze napadów nie odczuwają.

**Przepis na gospodarkę:** (1) dwie Chaty drwala, Tartak, Chata nosiwody, pierwszy Gaj, Glinianka, dwie Leśniczówki, Chata myśliwego; (2) druga nosiwoda, drugi Gaj, Targ, Skład, Las kadzidlany i Wytwórnia, dwie Chaty; (3) Qanat, Plantacja bawełny i Tkalnia, trzeci Gaj, Mleczarnia, Sad, Chata; (4) Meczet, Garncarnia, Łaźnia, druga para Las + Wytwórnia, drugi Targ, Karawanseraj, kolejne Chaty, druga Plantacja i Tkalnia.

**Wynik w grze** (bot R, bez szumu, haracz Łatwy): ludność {{v:N('saracens','R',0,'easy').pop}}, minuta 36 osób: {{v:N('saracens','R',0,'easy').pop36}}, głód {{v:N('saracens','R',0,'easy').famine}} min, terminy {{v:N('saracens','R',0,'easy').tribute}}, zapłacono {{v:N('saracens','R',0,'easy').delivered}} zł haraczu, w skarbcu {{v:N('saracens','R',0,'easy').gold}} zł (specyfikacja bez napadów: 891 zł, ludność 20 / 30 / 36 / 36 / 36).

## Wikingowie {#wikingowie}

Wiking opiera się na **drewnie, morzu i wyprawach**: wyprawy okrętów są rdzeniem jego mechaniki i jedyną walutą haraczu. Startuje wolno (36 osób dopiero ok. 52.–55. minuty), wydaje najwięcej desek i płaci haracz załogą, bronią i miodem pitnym, które okręt zabiera na kilkanaście minut. Węgiel pochodzi wyłącznie z Wypalarek (2 pnie → 1 węgiel), więc broń jest droższa niż u Franka (ok. 9,4 wobec 6,3 osobominuty), ale nie zjada jedzenia kopalń węgla. Ma najdłuższy łańcuch do pierwszej dostawy (Przystań i Okręt budują się ok. 20 minut od zebrania materiałów), więc jego **pierwszy termin przypada najpóźniej: w 110. minucie**. Etap kampanii 3/4.

Tabela: Łańcuchy Wikingów
| Łańcuch | Proporcja | Wyjście | Uwagi |
|---|---|---|---|
| Drewno | 1 drwal : 0,65 leśnika : 1 tartak | 2,6 deski/min | 450 drzew na mapie, dojrzewanie 3 min |
| Miód pitny | 1 Miodosytnia : 0,33 nosiwody | 1,0 miodu pitnego/min | starcza na wyprawy i kościół (miód z wody w jednym budynku — Pasieka usunięta) |
| Broń | 1 Kopalnia darniowa : 2 Wypalarki : 1 Huta : 1 Zbrojownia | do 1,0 broni/min | 4 pnie na sztukę; pracuje poniżej połowy mocy |
| Jedzenie | 4–6 Chat rybaka + Myśliwy + Mleczarnia + Sad | 7,2–9,4 porcji/min | ryby to ok. 60% dopływu |

{{diagram:lancuch|vikings}}

**Rybołówstwo.** Chata rybaka stoi nad morzem i działa jak pole: ryby są nieskończone, a ogranicza je tylko czas produkcji i **liczba miejsc na wybrzeżu** (domyślnie 6, `settings.shoreSpots`). Przy 3 miejscach ludność spada z 40 do 34, ale Chata myśliwego, Mleczarnia i Sad ją zastępują (ludność 50 w teście). Reguła generatora map: pozycja startowa Wikingów leży zawsze nad morzem, z co najmniej 6 miejscami pod Chaty rybaka i miejscem na Przystań i Okręty.

**Wyprawy** są deterministyczne i bez losu. Gracz ma dwa rodzaje; czas, załoga i łup dobrano tak, by wielka wyprawa była o ok. 25% tańsza w osobominutach na jednostkę haraczu, ale wymagała dużej osady i dwóch okrętów naraz:

Tabela: Wyprawy Wikingów
| | Wyprawa zwykła | Wielka wyprawa |
|---|---|---|
| Okręty | 1 | 2 jednocześnie |
| Załoga / miód pitny / broń | 6 / 6 / 6 | 12 / 12 / 12 |
| Czas | 10 min | 12 min |
| Straty po powrocie | 1 osoba i 1 broń | 2 osoby i 2 bronie |
| Łup | 30 zł | 80 zł i 2 narzędzia |
| Liczy się jako | 1 wyprawa | 3 wyprawy |
| Koszt w osobominutach | ok. 60 (miód 8 + załoga 60 + broń 9,4 + osoba 10 − łup 27) | ok. 135 (ok. 45 na jednostkę) |
| Wymagania do wypłynięcia | Przystań, wolny Okręt, 6 miodu i 6 broni w magazynie | Przystań, 2 wolne Okręty, 12 miodu i 12 broni w magazynie |
| Reguła wysyłki (obie) | po odjeździe zostaje ≥ 10 osób i — przy włączonym „Zapasie załogi” — ≥ 90% robotników potrzebnych budynkom (po odliczeniu budowniczych) | jak obok |

Tryb wypraw (przycisk ⛵): **Zwykłe** (domyślny; w nim kalibrowano presety Łatwy, Normalny, Trudny) albo **Mieszane** (gdy są 2 wolne okręty i zapas na wielką wyprawę, wypływa wielka; tryb mistrza — liczba okrętów powinna być parzysta). Wyprawa wraca z łupem i liczy się do żądania **po powrocie**. Przycisk „Zapas załogi” włącza regułę 90% robotników (bez niej przeciążenie psuje osadę: poziom 8 przy wysyłce bez oglądu to 3/7 terminów i ludność 40 → 32).

**Przepis na gospodarkę:** (1) trzy Chaty drwala (pierwsza gratis), Tartak, Leśniczówka, dwóch rybaków, Chata myśliwego, dwie Chaty; (2) Chata nosiwody, druga Leśniczówka, drugi Tartak, czwarty drwal, trzeci rybak, Mleczarnia, Sad, Targ, Skład; (3) Miodosytnia, Kopalnia darniowa, dwie Wypalarki, Huta, Zbrojownia; (4) Przystań i pierwszy Okręt, Chata, Kuźnia narzędzi, Kościół, czwarta Chata, czwarty rybak, drugi Okręt, kolejne Chaty.

**Wynik w grze** (bot R, bez szumu, haracz Łatwy): ludność {{v:N('vikings','R',0,'easy').pop}}, minuta 36 osób: {{v:N('vikings','R',0,'easy').pop36}}, głód {{v:N('vikings','R',0,'easy').famine}} min, terminy {{v:N('vikings','R',0,'easy').tribute}}, {{v:N('vikings','R',0,'easy').delivered}} jednostek haraczu, w skarbcu {{v:N('vikings','R',0,'easy').gold}} zł (specyfikacja: 21 / 32 / 38 / 38 / 38, 11 wypraw, 677 zł).

## Słowianie {#slowianie}

Słowianin żyje z lasu i płaci haracz **w towarach**: puszcza daje mu jedzenie, futra, miód i wosk, a senior (poborca) zbiera daninę koszykiem tych towarów co 15 minut. Ma 19 budynków i jest nacją najłatwiejszą: bot reaktywny bez przepisu przechodzi u niego poziomy 3–8 w 96–100% przypadków (Frankowie 21%, Saraceni 17% na poziomie 3), więc to **nacja wprowadzająca** (etap kampanii 1/4). Głębia leży gdzie indziej niż u pozostałych: w zdrowiu lasu i w doborze koszyka.

**Mechanika własna 1: Puszcza.** Las jest żywym zasobem, nie tylko drewnem. Chata zbieracza, Barć, Chata łowcy futer i Chata myśliwego dają plon proporcjonalny do gęstości lasu: **plon × min(1, drzewa / {{v:Data.FOREST_REF.slavs}})**. Mapa Słowian ma {{v:Data.FACTIONS.slavs.treesTarget}} drzew z dojrzewaniem {{v:Data.FACTIONS.slavs.treeGrowthMin}} min; poniżej progu plony maleją liniowo (150 drzew = 75% plonu), więc wycinka (Drwal 1,0 pnia/min) konkuruje z daniną, a Leśniczówka (sadzi 1,0 drzewa/min) jest narzędziem gospodarki, nie ozdobą. Test poziomu 5: przepis (2 drwali, 2 leśników) kończy z 299 drzewami i spełnia 6/6 terminów; 5 drwali bez leśników kończy z 32 drzewami, ludność spada do 33 i haracz przechodzi 4 z 6 terminów; na poziomie 3 ten sam błąd daje 11 minut głodu (zbieracze przestają karmić).

**Mechanika własna 2: Danina koszykowa.** Poborca żąda *wartości*, nie sztuk. Trzy towary mają wartość w osobominutach: futro wyprawione {{v:Data.DANINA.values['futro wyprawione']}}, miód {{v:Data.DANINA.values['miód']}}, wosk {{v:Data.DANINA.values['wosk']}}; udziały w żądaniu: 40% / 35% / 25%. W terminie liczy się łączna wartość dostaw, a każdy z trzech towarów musi pokryć co najmniej {{v:Data.DANINA.minShareEach * 100}}% swojego udziału; nadwyżka jednego towaru może pokryć resztę niedoboru innego. Towar leży w magazynach do terminu, więc o poziomie 6 i wyżej decyduje **pojemność** (6 szt. u producenta + 20 w komorze + 80 na Skład) — bez Składu pojemność przepisu spada o 1 poziom.

Tabela: Łańcuchy Słowian
| Łańcuch | Proporcja | Wyjście | Uwagi |
|---|---|---|---|
| Miód i wosk | 1 Barć : 1 Woskarnia | 0,84 miodu + 0,36 wosku /min | jedna para daje oba towary w proporcji 2,3 : 1; wartość 2,34 osobominuty na 2 osobominuty pracy |
| Futra | 1 Chata łowcy : 1 Garbarnia : 0,27 nosiwody | 0,8 futra wyprawionego /min | wartość 2,24 na ok. 2,3 osobominuty; Garbarnia wymaga wody |
| Jedzenie | 3 Chaty zbieracza + Sad + Mleczarnia + 2 Pola + Kaszarnia | 7,25 porcji/min | zbieracze to 40% dopływu, więc zależą od lasu |
| Drewno | 2 Drwali : 2 Leśniczówki : 1 Tartak | 2,0 deski/min | Tartak 8 d; 300 drzew, dojrzewanie 6 min |

{{diagram:lancuch|slavs}}

**Warstwy mistrzostwa** (pojemność przepisu — najwyższy spełniany poziom): przepis nacji 7; + 1 / 2 / 3 pary łańcuchów (futra, miód i wosk) 9 / 11 / 12; rozbudowa ludności bez efektu; bez Składu 6; bez Kapliczki i Bani (Dobrobyt kosztuje 1 poziom) 8. **Pole żarowe** (wycinka lasu pod pole) przetestowano i odrzucono: nie zmienia pojemności (7 wobec 7).

**Przepis na gospodarkę:** (1) dwie Chaty drwala (pierwsza gratis), Tartak, dwie Chaty zbieracza, Leśniczówka, dwie Chaty, Sad, Chata nosiwody; (2) trzecia Chata zbieracza, dwa Pola, Kaszarnia, pierwsza para: Chata łowcy futer + Garbarnia + Barć + Woskarnia; (3) Chata, Mleczarnia, Skład, Targ, druga para łańcuchów, Chata; (4) Kapliczka, Bania, druga Leśniczówka, trzecia para miodu i wosku, dwie Chaty, trzecia para futer.

**Wynik w grze** (bot R, bez szumu, haracz Łatwy): ludność {{v:N('slavs','R',0,'easy').pop}}, minuta 36 osób: {{v:N('slavs','R',0,'easy').pop36}}, głód {{v:N('slavs','R',0,'easy').famine}} min, terminy {{v:N('slavs','R',0,'easy').tribute}}, {{v:N('slavs','R',0,'easy').delivered}} osobominut daniny, w skarbcu {{v:N('slavs','R',0,'easy').gold}} zł (specyfikacja: ludność 32 / 40 / 40 / 40, 36 osób w 25. minucie, 540 osobominut: futra 216, miód 189, wosk 135).

## Przepisy botów {#przepisy}

Przepis nacji to lista budynków w kolejności budowy, którą wykonują boty R i D (`TestBots.RECIPE`); jest to zarazem „samouczek ekonomii” — preset Łatwy zakłada, że gracz idzie za taką kolejnością (bot reaktywny N bez przepisu przechodzi poziom 3 tylko w 21% u Franków i 17% u Saracenów).

{{tabela:przepisy}}
