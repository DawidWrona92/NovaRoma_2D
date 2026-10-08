# Interfejs, menu i Doradca {#ui}

Interfejs to cienka warstwa nad logiką: czyta `World.state()`, wywołuje publiczne funkcje modułów (`Build.enqueue`, `Roads.lay`, `Tribute.setLevel` …) i niczego nie liczy sam. Poniżej: wejście do gry (menu główne i Piaskownica), pasek stanu, pasek budowy, panele informacyjne i Doradca.

## Wejście do gry: menu główne i Piaskownica {#menu}

Od Fazy 9 gra otwiera się **menu głównym** w stylu RTS lat 90./2000. (moduł `Menu`, ekrany `#mainMenu`, `#sandbox` i `#pauseMenu`). Jedyną ścieżką startu rozgrywki pozostaje `UI.startGame(fid, {climate, type, seed})` — używają jej Piaskownica, parametr `?play=` i dawny ekran wyboru nacji, więc żaden test nie zależy od menu.

Tabela: Ekrany przed grą i w grze
| Ekran | Kiedy | Zawartość |
|---|---|---|
| **Menu główne** | domyślnie po załadowaniu strony | logo, panorama (SVG w tle), lista: Kampania, Potyczka, **Piaskownica**, Wieloosobowa, Samouczek, Edytor map, Ustawienia, Twórcy, Wyjście — poza Piaskownicą pozycje są szare z podpowiedzią „Wkrótce” |
| **Piaskownica** | Menu główne → Piaskownica | nacja (cztery karty), klimat (4 kafle), typ mapy (6 kafli), podgląd mapy, opis, ziarno, „Losuj mapę”, Wstecz, Start |
| **Wybór nacji kartami** | `?menu=0` | dawny ekran z czterema kartami; klik karty = start gry na domyślnej mapie nacji (używany przez testy `browser_*`) |
| **☰ Menu w grze** | przycisk `☰ Menu` (pierwszy w pasku stanu) lub Esc | Wznów, Nowa mapa, Opcje (szare), Menu główne |

**Sterowanie menu:** ↑/↓ i Enter, mysz i dotyk; Esc w Piaskownicy wraca do menu głównego. Nieaktywne pozycje nie przejmują fokusu klawiatury, nawet gdy kursor znajduje się nad nimi. Na telefonie (szerokość ≤ 720 px lub wysokość ≤ 640 px) układ jest pionowy: podgląd mapy nad kartami, kafle w dwóch kolumnach, przyciski o większej powierzchni dotyku.

### Piaskownica {#piaskownica}

Wybór ma trzy osie, a **podgląd odświeża się po każdej zmianie** (po 60 ms zwłoki):

1. **Nacja** — karty te same, co na dawnym ekranie wyboru (`UI.buildFactionCards(wrap, onPick, compact)` — wersja `compact` jest mniejsza i nie startuje gry, tylko woła `onPick`).
2. **Klimat** — {{v:Object.keys(Data.CLIMATES).length}} klimaty (rozdz. {{ref:teren}}). Domyślnie klimat własny nacji (oznaczony „klimat nacji”); po ręcznej zmianie klimatu wybór zostaje przy zmianie nacji.
3. **Typ mapy** — {{v:Object.keys(Data.MAPTYPES).length}} typów, nazwy zależne od klimatu (np. „Wydmy i oazy” zamiast „Bagnista” na pustyni). **Wikingowie są zablokowani na typie „Nadmorska”**, bo ich budynki (Przystań, Okręt) wymagają morza; przy wyborze Wikingów pole typu przełącza się na nadmorską i wyświetla się odpowiednia uwaga.

**Podgląd** (`Minimap`, kanwa 192×192 px, 1 pole = 4 px) rysuje mapę z tych samych danych, z których powstanie gra: `Minimap.generate` woła `MapGen.generate` z identycznymi argumentami, więc po Starcie świat jest **identyczny z podglądem** (jedyna różnica to rezerwacja pól Dworu — test `tools/minimap.js` porównuje pole po polu). Kolory: woda wg rodzaju (morze, jezioro, rzeka, bród, lód), skały, cechy terenu (bagno, wydma, ruchome piaski, oaza, zaspa, klif), złoża (kamień, żelazo, węgiel, glina, ruda darniowa), zagęszczenie drzew; biała ramka 4×4 pośrodku oznacza Dwór. Pod podglądem widać opis („Dolina rzeki · Pustynny · ziarno 597318”) i podsumowanie: udział wody i wzgórz, liczba drzew, rzeki z brodami / jeziora / morze, cechy terenu, złoża.

**Ziarno.** Pole liczbowe i przycisk „🎲 Losuj mapę” ustalają ziarno; to samo ziarno z tym samym klimatem i typem daje tę samą mapę. Jeśli generator uzna mapę za niepoprawną (`meta.valid = false`: np. zbyt mało drzew lub brak złóż w zasięgu — rozdz. {{ref:teren}}), Piaskownica **automatycznie próbuje kolejnych ziaren** (do 8 prób) i wpisuje w pole ziarno, które zadziałało.

**Pamięć wyboru.** Ostatnia nacja, klimat, typ i ziarno są zapisywane w `localStorage` (klucz modułu `Menu`), zawsze w `try/catch` — w trybie prywatnym lub z zablokowanymi danymi witryny gra działa bez pamięci.

### ☰ Menu w grze {#menu-gry}

Przycisk `☰ Menu` jest **pierwszym elementem paska stanu** (także na telefonie) i otwiera nakładkę o wyższym z-index niż reszta interfejsu. Otwarcie menu **zatrzymuje czas** (`speed = 0`, etykieta przycisku prędkości zmienia się na „Pauza”); „Wznów” przywraca poprzednią prędkość. Klawisze kamery są podczas pauzy zerowane, żeby gra po wznowieniu nie „uciekała” z przytrzymanym klawiszem.

- **Nowa mapa** — ta sama nacja, klimat i typ, **nowe ziarno**.
- **Menu główne** — wraca do ekranu startowego.
- **Opcje** — pozycja nieaktywna („Wkrótce”).

Obie ostatnie pozycje działają przez **nawigację strony** (`location.href` z parametrami `?play=…&climate=…&map=…&seed=…`, a dla menu głównego bez `play`), a nie przez ponowną inicjalizację świata. To świadoma decyzja (rozdz. {{ref:decyzje}}): stan modułów UI (`gameStarted`, ostatni panel, aktywna kategoria, prędkość, otwarty Doradca) i kilkaset obiektów zostaje czysto zresetowane bez ryzyka przecieków i rozjazdu zegarów.

**Priorytet Esc w grze:** (1) zamyka otwarte menu; (2) jeśli wybrano budynek do postawienia albo przypięto kartę budynku — anuluje wybór (stare zachowanie); (3) dopiero wtedy otwiera menu. W HUD obok pogrubionej nazwy nacji pojawia się dodatkowo opis mapy (np. „Dolina rzeki · Pustynny · ziarno 597318”; na telefonie ukryty), a Doradca zaczyna od wiersza „🗺 Mapa: …”.

### Parametry adresu {#parametry-adresu}

`?menu=0` (stary wybór nacji), `?play=nacja&climate=…&map=…&seed=…` (bezpośredni start — pomija menu), `?logistics=0`, `?classic=1` i inne opisuje rozdział {{ref:wstep}}. Testy przeglądarkowe wchodzą do gry przez `?menu=0` (`browser_ui`, `browser_play`, `browser_mobile`, `browser_sprites`, `browser_contact`) lub `?play=`; samo menu sprawdza `tools/browser_menu.js` (rozdz. {{ref:testy}}).

## Pasek stanu (HUD) {#hud}

Pasek u góry ekranu zawiera: **☰ Menu**, nazwę gry, nację i opis mapy, **⏱ czas** (minuty gry), **👥 ludność**, **💛 popularność**, **🪙 złoto**, **🔧 narzędzia**, **🍖 jedzenie** (zapas w minutach zużycia), **👷 praca** (zajęte / dostępne miejsca) i **🏠 mieszkania**. Po nich — kontrolki:

Tabela: Kontrolki paska stanu
| Kontrolka | Działanie | Rozdział |
|---|---|---|
| **Racje: ×N** | racje żywności ×0,5 / ×1 / ×1,5 / ×2 (zużycie i popularność), przycisk przełącza cyklicznie | {{ref:ludnosc}} |
| **Podatek: N** | poziom 0–3 (cyklicznie): złoto i popularność | {{ref:ludnosc}} |
| **👷 Budowniczowie: N** | liczba budowniczych 2–5 (po 5 wraca do 2) | {{ref:budowa}} |
| **Haracz** (lista) | „Haracz: wyłączony”, preset (Łatwy / Normalny / Trudny / Mistrz — z poziomem dla nacji) albo „Własny poziom 1–11” | {{ref:haracz}} |
| **⛵ Wyprawy** i **Zapas załogi** | tylko Wikingowie: tryb wypraw „Zwykłe” / „Mieszane” (wielka wyprawa z 2 okrętów) i reguła wysyłki (zapas załogi 90% / brak) | {{ref:haracz}} |
| **🏴 Napady** | tylko Saraceni: napady na karawanę włączone / wyłączone | {{ref:zdarzenia}} |
| **🔥 Kryzysy** | harmonogram kryzysów (zaraza, pożary, krach cen, wylesienie — rozdz. {{ref:kryzysy}}) włączony / wyłączony; domyślnie wyłączony | {{ref:zdarzenia}} |
| **🚚 Logistyka** | przełącza logistykę producentów **i** model cyklu pracy (`settings.logistics` + `settings.physical`): marsz do Składu, dojście i noszenie budowniczych, karawany | {{ref:logistyka}}, {{ref:fizyka}} |
| **Prędkość: ×N** | czas gry ×1 / ×2 / ×3 / ×6 (cyklicznie; ×1 = {{v:Data.RULES.clock.secPerMin}} s realnych na minutę gry) | {{ref:e-tempo}} |
| **🧭 Doradca** | otwiera panel Doradcy | niżej |
| **⚙ Więcej** | tylko na małych ekranach: rozwija rzadko używane kontrolki (oznaczone `sec`) | niżej |

Na telefonie pasek jest zwinięty: widać stan i najważniejsze przyciski, a pozostałe ukrywa **⚙ Więcej** (przycisk widoczny wyłącznie przy małej szerokości). Test `browser_mobile.js` sprawdza, że żaden element nie wychodzi poza ekran i że dotyk działa jak kliknięcie.

## Pasek budowy {#pasek-budowy}

U dołu ekranu leży pasek z **ośmioma kategoriami** (Mieszkania, Jedzenie, Drewno, Surowce, Rzemiosło, Handel, Militaria, Społeczne) oraz kategorią **Drogi** (narzędzia: wytycz drogę, rozbierz drogę). Każdy przycisk budynku pokazuje miniaturę sprite'a (z katalogu `SPRITE_META`), nazwę (zależną od nacji — `Data.nameOf`) i koszt. Wybór budynku włącza **tryb budowy** (`BuildMode`):

- **duch budynku** podąża za kursorem w obrysie `w×h` (rozdz. {{ref:zabudowa}}); zielony oznacza poprawne miejsce, czerwony — odmowę z powodem w podpowiedzi (np. „za blisko innego budynku”, „na wodzie”, „wymaga lasu”);
- pola w strefie wydłużonego czasu budowy (odległość 2–3 od sąsiada) są podświetlone **przed** kliknięciem, a podpowiedź podaje karę czasu;
- na pochyłym terenie podpowiedź pokazuje koszt **wyrównania** (rozdz. {{ref:teren}});
- **podgląd transportu** (inspiracja: Settlers IV, gdzie kursor przy planowanym budynku pokazuje czasy dojścia): dla budynku produkcyjnego pod duchem pojawia się napis „transport ≈ N pól → X% wydajności (marsz A min na B min pracy)” (`BuildMode.transportAt`, dane z `Logistics.previewAt`); część „marsz … min na … min pracy” jest tylko przy `settings.physical`, a przy wyłączonej logistyce napisu nie ma. Drwal dostaje dodatkowo „las N pól od drzwi”, gdy najbliższy las leży dalej niż {{v:Data.RULES.cycle.treeRef}} pól. Przy braku dojścia napis brzmi „brak dojścia do Składu / Dworu”;
- **mapa ciepła zasięgu Składu:** gdy wybrany jest **Skład** i włączona jest logistyka lub fizyka, na wolnych polach rysowana jest mapa ciepła (`BuildMode`, `heatDraw`, dane z `Logistics.fieldWith`): **zielone** — bez kary (koszt dojścia do L_ref = {{v:Data.RULES.cycle.ref}} pól), **żółte** do 14, **pomarańczowe** do 22, **czerwone** dalej (do kosztu 36; pola dalej nie są zaznaczane). Koszt liczy się od wszystkich Składów, Dworu i planowanego Składu, a drogi są tańsze niż pole zwykłe;
- klik = `Build.enqueue`; prawy przycisk i **Esc** anulują wybór; kliknięcie placu poza trybem budowy anuluje plac (rozdz. {{ref:budowa}}).

**Kamera:** przeciąganie prawym przyciskiem lub WASD, kółko myszy — zoom; na telefonie przeciąganie jednym palcem i szczypanie. Dotknięcie ekranu działa jak lewy klik (`BuildMode.click`).

## Panele informacyjne {#panele}

- **Magazyn** (`#resPanel`, prawa strona) składa się z sekcji: **MAGAZYN** (towary z ilością i pojemnością `ilość / cap`; pełny magazyn jest wyróżniony), **ŻYWNOŚĆ** (produkcja, zużycie ludzi, podatek górniczy, maksymalna ludność), „Głód za”, ostrzeżenia (narzędzie, popularność < 45, podatek 3), link do Doradcy z liczbą ostrzeżeń, budowniczowie (czynni / ustawieni), **BUDOWA** (do 4 placów z postępem), **HARACZ** (następna rata, dostawa / wymagane, terminy; koszyk daniny Słowian), załoga na morzu (Wikingowie) i **NAPADY** (Saraceni, gdy był już napad). Panel odświeża się co 0,2 min gry.
- **Karta budynku** (`#bInfo`): nazwa, **status z Doradcy** (kolor: czerwony / bursztynowy / szary / zielony — razem z wydajnością, transportem do Składu `b.logi` i zwierzyną w łowisku), wejście i wyjście na minutę (nazwy towarów zależne od nacji), informacja o narzędziu oraz sekcja **Transport**: odległość do Składu / Dworu, cykl pracy (praca + marsz w minutach) i sprawność (rozdz. {{ref:fizyka}}). Najechanie kursorem pokazuje kartę chwilowo, **kliknięcie ją przypina** (Esc odpina); przy otwartym Doradcy karta się nie pokazuje.
- **Znaczniki nad budynkami**: litera w kółku informuje o stanie budynku bez otwierania karty — **!** brak wejścia (czerwony), **T** czeka na narzędzie, **P** brak pracownika, **Z** magazyn pełny, **J** stoi (jedzenie tylko z nadwyżki), **X** wyczerpane złoże.

## Doradca {#doradca}

`Advisor` (Etap 6) to moduł tylko do odczytu, który zamienia stan gry w czytelne zdania. Otwiera go przycisk **🧭 Doradca** lub link w panelu Magazyn; panel odświeża się razem z interfejsem. Zaczyna od wiersza „🗺 Mapa: …” (opis mapy z `Minimap.describe`), a dalej składa się z części:

**1. Status budynku** (`Advisor.statusOf`) — jedno zdanie na budynek, w kolejności reguł: Dwór i budynki bez pracownika (opis), brak obsady („za mało wolnej ludności — żywność obsadzana pierwsza”), czekanie na narzędzie („Targ kupi je za 20 zł, kuźnia zamkowa dorobi ok. 1 szt. na 8 min”), **brak wejścia** (z listą budynków, które wytwarzają brakujący towar — np. „zbuduj: Tartak / Skład drewna”), pełny magazyn, stanie z powodu zasady „jedzenie tylko z nadwyżki”, wyczerpane złoże, a gdy wszystko jest dobrze — „Pracuje — N% wydajności” z dopiskiem o transporcie (`−X%`: „zbliż budynki lub połóż drogę”) i o zwierzynie w łowisku.

Przy fizycznej logistyce (`settings.physical`) dopisek o transporcie podaje odległość do Składu / Dworu oraz marsz i czas pracy w cyklu („marsz A min na B min pracy”); w trybie fizycznym producent bez dojścia dostaje „brak dojścia do Składu / Dworu (zabudowa odcina drogę) — sprawność minimalna”. Dla drwala, gdy najbliższe drzewo jest dalej niż {{v:Data.RULES.cycle.treeRef}} pól od drzwi, Doradca podaje odległość do drzewa i radę „postaw Leśniczówkę przy chacie (jedna na dwóch drwali)”.

**2. Ostrzeżenia ogólne** (`Advisor.warnings`), od najpilniejszych: głód (z odliczaniem do pierwszych zgonów), popularność poniżej progu imigracji, podatek 3 jako pułapka, **podatek górniczy** (ile porcji jedzenia zjadają kopalnie), limit ludności z żywności (P_max — rozdz. {{ref:ludnosc}}), pełne magazyny, skarbiec do ograbienia (Saraceni, > 300 zł), przypomnienie o Koszarach 30 minut przed pierwszym terminem haraczu (Frankowie).

**3. Żywność** — produkcja (potencjał), zużycie (ludzie, budowniczowie, kopalnie) i brama imigracji z maksymalną ludnością (rozdz. {{ref:ludnosc}}).

**4. Haracz — plan na wybrany poziom** (`Advisor.plan`) — lista budynków potrzebnych do wskazanego poziomu haraczu (✔ / ✘ `mamy / potrzeba`) i uwagi nacji (żołd Franków, nasycenie rynku Saracenów, załoga Wikingów, koszyk Słowian; rozdz. {{ref:haracz}}, „Doradca a haracz”). Przy wyłączonym haraczu Doradca podpowiada wybór presetu.

**5. Znaczniki na budynkach** — legenda liter z poprzedniej sekcji.

Doradca nie podejmuje żadnych decyzji ani nie zmienia stanu; testy sprawdzają go przez `tools/browser_ui.js` (wiersze statusów, ostrzeżenia, panel).

## Co jeszcze zaplanowano {#ui-plan}

Faza 10: **legenda** terenu, wody, dróg i zwierzyny (panel w grze), spójność Doradcy z nowymi mechanikami (wyrównanie, przetrzebiona zwierzyna). Faza 9B wprowadziła **tempo bazowe czasu gry** i prędkości ×1/×2/×3/×6 (aneks {{ref:aneks-fizyka}}, rozdz. {{ref:e-tempo}}), sekcję „Transport” w karcie budynku oraz komunikat „brak dojścia” w Doradcy.
