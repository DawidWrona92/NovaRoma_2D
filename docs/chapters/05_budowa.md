# Budowa i budowniczowie {#budowa}

Budynki powstają na **placach budowy**. Gracz wskazuje miejsce (rozdz. {{ref:zabudowa}}), gra rezerwuje pola pod obrys i pobiera złoto, a **budowniczowie** — rekrutowani z wolnej ludności — sami noszą materiały na plac, ewentualnie wyrównują teren i budują, aż budynek stanie. Cały proces obsługuje moduł `Build`.

{{diagram:budowa}}

## Otwarcie placu {#plac}

`Build.enqueue(id, x, y)`:

1. sprawdza `World.canPlace` (zasady zabudowy, teren, wymagania budynku);
2. **pierwsza Chata drwala jest darmowa** — także wtedy, gdy pierwszy plac stoi dopiero w kolejce;
3. sprawdza złoto: koszt złotem musi mieścić się w złocie **po odjęciu rezerwy na żołd** (`Tribute.soldierReserve`, Frankowie);
4. **pobiera złoto od razu** (materiały — dopiero przy wniesieniu na plac) i rezerwuje pola obrysu (`occup = uid placu`);
5. zapisuje potrzebny materiał (`need`), liczbę sztuk, **karę za ciasną zabudowę** (`crowd`), poziom docelowy i czas **wyrównania terenu** (`levelTotal`) oraz czas pracy `workNeed = (1,0 + 0,1 × sztuki) × (1 + kara)`.

Place są w **kolejce gracza**: wcześniejszy plac ma pierwszeństwo do materiałów. Kliknięcie placu poza trybem budowy **anuluje** go: materiały i złoto wracają do magazynu.

## Budowniczowie {#gang}

Liczbę budowniczych ustawia gracz (przycisk 👷): **domyślnie 3, minimum 2, maksimum 5**. Rekrutacja idzie z wolnej ludności (`ludność − załoga na wyprawie − pracownicy budynków`); pracownicy mają pierwszeństwo, ale gang nie schodzi poniżej 2. W testach 3 budowniczych odtwarza tempo dawnego modelu (2 min na budynek, 2 równolegle), a 1 budowniczy wywraca grę (ludność @20 spada do 10–15), dlatego minimum wynosi 2. Od 3 w górę budowniczowie nie są wąskim gardłem — tempo budowy ogranicza podaż desek, nie ręce.

**Przydział do placów** (w kolejności kolejki):

- plac **bez ani jednej dostępnej sztuki wymaganego materiału** (po rezerwacji przez wcześniejsze place) nie zajmuje budowniczych — przechodzą do następnego placu (bez tej reguły zacięty plac z gliną zablokował całą budowę Saracenów);
- jeden budowniczy na plac; plac z ponad 20 sztukami materiału dostaje +1 na każde 20 sztuk, najwyżej 3 (**Okręt 2, Przystań 1**);
- budowniczy zjada 1,5 racji w pracy (rozdz. {{ref:ludnosc}}).

## Etapy {#etapy}

Tabela: Etapy placu budowy
| Etap | Co się dzieje | Czas |
|---|---|---|
| **0 — wyrównanie** | plac na pochyłym terenie: budowniczowie kopią, materiałów jeszcze nie noszą; po zakończeniu pola obrysu dostają poziom docelowy (`flatten`) i chunk podłoża jest odświeżany | {{v:Data.RULES.level.per}} min × pola × Δe (pracy budowniczych; dzielone przez liczbę przydzielonych) |
| **1 — noszenie** | przydzieleni budowniczowie noszą materiały ze Składu / magazynu; plac czeka, dopóki nie dotrze komplet | {{v:Build.PIECE_MIN}} min budowniczego na sztukę |
| **2 — budowa** | przydzieleni budowniczowie budują razem; po zebraniu `workNeed` powstaje budynek | ({{v:Build.BASE_WORK}} + {{v:Build.PER_PIECE}} × sztuki) × (1 + kara za ciasną zabudowę) |

Postęp pokazywany w HUD (`Build.progressOf`) to 50% noszenie + 50% budowa. Na ekranie plac jest rusztowaniem odsłaniającym sprite od dołu, ze stosami materiałów przy rogu; budowniczowie (Walkers) noszą z Dworu na plac i stoją przy obrysie.

### Przykładowe czasy {#czasy}

Poniższa tabela jest wynikiem **symulacji w grze** (wygenerowana podczas budowy dokumentu): 3 budowniczych, płaski teren (brak etapu 0), brak sąsiadów (brak kary), pełny magazyn materiałów. W prawdziwej grze dochodzi czas oczekiwania na deski, wyrównania stoku i kara za sąsiadów.

{{tabela:czasy_budowy}}

Dla przykładu Chata Franków (4 d) to 0,8 min noszenia (4 szt. × 0,2 min, jeden budowniczy) i 1,4 min pracy (1,0 + 0,1 × 4), razem 2,2 min. Specyfikacja podaje dla swojego modelu: Chata ok. 3,3 min, Przystań (15 d) ok. 9 min, Okręt (40 d) ok. 11 min — z czekaniem na deski. W grze, przy zapasie materiałów, czasy są krótsze (Chata 2,2, Przystań 5,7, Okręt 6,7 min); realny czas wydłużają kolejka materiałów, kara za ciasną zabudowę (do +40% czasu pracy) i wyrównanie stoku. Noszenie jest w modelu budowy czasem budowniczego, a nie drogi, więc odległości uwzględnia dopiero sprawność logistyczna producentów (rozdz. {{ref:ruch}}).

## Dojście i noszenie przy fizycznej logistyce {#budowa-fizyka}

Podane wyżej czasy (0,2 min noszenia na sztukę, budowa od razu po przydziale) to model **nominalny**. Przy `settings.physical` (domyślnie w grze) budowniczowie najpierw **dochodzą z Dworu na plac** (`odległość / {{v:Data.RULES.walk.v}}` minut, bez pracy), a materiał noszą **kursami po {{v:Data.RULES.cycle.carry}} sztuk**: czas jednej sztuki to `max(0,2 min, (2·L / v + {{v:Data.RULES.cycle.handle}}) / kurs)`, gdzie L — odległość drogi od najbliższego Składu lub Dworu. Bliskie place budują się tak samo szybko jak dawniej, a dalekie wolniej, więc **droga do placu i Skład przy budowie skracają czas** (rozdz. {{ref:budowniczowie-fizyka}}).

## Złoto, rezerwa, anulowanie {#zloto-budowy}

- Koszt w złocie (Kościół, Qanat, Łaźnia, Bania, Karawanseraj, Koszary, Strażnica) jest pobierany **przy otwarciu placu**.
- **Frankowie:** otwarcie placu z kosztem w złocie i zakup narzędzia nie schodzą poniżej złota potrzebnego na żołd brakujących do najbliższego terminu żołnierzy (3 zł × brakujący) — Doradca przypomina o Koszarach 30 minut przed pierwszym terminem.
- Anulowanie placu zwraca wniesione materiały i złoto; wyburzenie gotowego budynku (zdarzenie pożaru) nie zwraca niczego, a narzędzie „przywiązane” do budynku przepada.
- Budowniczowie, którzy nic nie mają do roboty (brak materiału na każdym placu), stoją bezczynnie — w teście 3 budowniczych jest bezczynnych 60–73% czasu, co potwierdza, że wąskim gardłem są deski.

## Odbudowa po pożarze {#odbudowa}

Odbudowa 6 budynków produkcyjnych po pożarze w 100. minucie trwa w modelu specyfikacji ok. 9 / 9 / 10 minut (Frankowie / Saraceni / Wikingowie) przy 3 budowniczych, 7 min przy 5; z jednym budowniczym 24–49 minut. Reguła pierwszeństwa pracowników jest konieczna: bez niej trzech bezczynnych budowniczych blokowało odbudowę Franka po głodzie do 40. minuty na stałe (ludność 10 do końca gry); z regułą ludność wraca do 26 i haracz do 6/7.
