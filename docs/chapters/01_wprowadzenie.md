# Wprowadzenie {#wstep}

## Czym jest Nova Roma {#czym}

Nova Roma to gra strategiczno-ekonomiczna w stylu RTS lat 90. i 2000. (Settlers, Twierdza, Age of Empires), zapisana w **jednym pliku HTML** (`Nova_Roma.html`): JavaScript bez zależności, rysowanie na `canvas` 2D, grafika w całości proceduralna (żadnych plików graficznych). Gracz zakłada osadę wokół Dworu, buduje łańcuchy produkcji, dba o ludność i popularność, a jedyną presją jest **haracz seniora**: w ustalonych terminach trzeba dostarczyć towar w walucie swojej nacji. Nikt nie walczy na mapie — gra jest „czysto ekonomiczna”.

Do wyboru są cztery nacje, każda z innym napięciem ekonomicznym:

| Nacja | Hasło | Waluta haraczu | Oś napięcia |
|---|---|---|---|
| Frankowie | kamień, chleb i żelazo | żołnierze (broń + osoba + żołd) | jedzenie ↔ kopalnie, podatek ↔ żołd |
| Saraceni | woda, daktyle i handel | złoto z handlu trzema towarami | woda i daktyle ↔ kadzidło, nasycenie rynku, napady |
| Wikingowie | drewno, morze i wyprawy | wyprawy okrętów | ludzie i miód pitny ↔ wyprawy, zużycie drewna |
| Słowianie | puszcza, bartnictwo i futra | danina koszykowa (futro, miód, wosk) | zdrowie lasu i dobór koszyka |

Poza ekonomią — którą opisuje specyfikacja v3.6 — gra ma warstwę przestrzenną dodaną w kolejnych fazach prac: **teren w czterech klimatach i sześciu typach map**, ruch po ścieżkach i drogach, zasady zabudowy (przerwa, ciasna zabudowa, wyrównywanie wzgórz), sprawność logistyczną producentów oraz **faunę z polowaniem z łukiem**. Warstwa przestrzenna jest rozłączna z ekonomią: scenariusze akceptacyjne specyfikacji liczą się z wyłączoną logistyką i fauną i dają te same wyniki co przed jej dodaniem (rozdz. {{ref:testy}}).

## Zakres dokumentu i hierarchia źródeł {#zrodla}

Dokument opisuje **całą logikę gry takiej, jaka jest w kodzie**, oraz decyzje projektowe, które do niej doprowadziły. Powstał na podstawie czterech źródeł; przy sprzeczności obowiązuje kolejność od góry:

1. **Kod** (`Nova_Roma.html`, `tools/`, `prototyp/`) — prawda o tym, jak gra działa. Tabele i wartości oznaczone w tekście jako „z kodu” są generowane z silnika podczas budowy dokumentu, więc nie rozjeżdżają się z grą.
2. **Specyfikacja ekonomii do wdrożenia (v3.6)** — zamknięta specyfikacja czterech nacji (w tytule pliku PDF wciąż widnieje „v3.2”, treść nosi oznaczenie v3.6). To ona jest źródłem liczb ekonomii (rozdz. {{ref:ekonomia}}–{{ref:haracz}}) i kryteriów akceptacji (aneks {{ref:aneks-spec}}).
3. **„Ekonomia Nova Roma — wersja finalna”** — starszy dokument historyczny (wersja v3.2 trzech nacji): uzasadnia, dlaczego mechaniki wyglądają tak, a nie inaczej (naprawione błędy v2, balans, decyzje). Część liczb została później zmieniona w v3.6; różnice zebrano w rozdz. {{ref:spec-kod}}.
4. **Plan faz i decyzje użytkownika** — wszystko, co dodano ponad specyfikację ekonomii: teren, zabudowa, ruch, fauna, menu (rozdz. {{ref:decyzje}}).

> [!wazne] **Konwencje.** *d* = deska, *k* = kamień, *gl* = glina, *zł* = złoto, **T** = budynek wymaga narzędzia przy obsadzeniu. „Minuta” oznacza minutę czasu gry (w grze {{v:Data.RULES.clock.secPerMin}} s realnych = 1 min przy prędkości ×1). „Pole” to jednostka planu mapy (mapa ma 48 × 48 pól). *Osobominuta* to minuta pracy jednej osoby — wspólna miara, do której sprowadzono poziomy haraczu wszystkich nacji. Wartości liczbowe zapisujemy z przecinkiem dziesiętnym.

## Stan projektu {#stan}

Prace prowadzono w fazach; każda kończy się bramką (testy, regresja względem wzorca, commit, wersja do ręcznego sprawdzenia). Stan na dzień zbudowania dokumentu:

Tabela: Fazy projektu
| Faza | Zakres | Stan |
|---|---|---|
| Etapy 1–6 | ekonomia wg specyfikacji v3.6, Słowianie, Doradca, statusy budynków, boty testowe R/D/N, scenariusze akceptacyjne | ✔ |
| Prototyp grafiki | proceduralne sprite'y 88 budynków czterech nacji, ludzie, przyroda | ✔ |
| 0–3 | wzorzec testów, głowy smocze Wikingów, Słowianie bez głów, silnik sprite'ów w grze | ✔ |
| 4 | obrysy budynków w×h, render sprite'ami, Dwór 4×4 | ✔ |
| 5 | teren v2: 4 klimaty × 6 typów map, podłoże w chunkach | ✔ |
| 6, 6b, 6c | A\* i piesi (cień symulacji), drogi, przerwa i kara za ciasną zabudowę, sprawność logistyczna | ✔ |
| 7 | wyrównywanie terenu pod budynki, wzgórza decyzyjne | ✔ |
| 8 | fauna (18 gatunków) i polowanie z łukiem | ✔ |
| 9 | menu główne RTS i Piaskownica (nacja, klimat, typ mapy), ☰ Menu w grze | ✔ |
| 9B | ożywienie ludzi: tempo gry, role i czynności, fizyczna sprawność transportu, drwal, budowniczowie, karawany i okręty (aneks {{ref:aneks-fizyka}}) | ✔ |
| 10 | integracja: legenda, spójność Doradcy, zestaw regresji w repozytorium, dostawa | planowane |
| 11 | audyt wizualny całości i poprawki | planowane |

Szczegółowy stan na okładce dokumentu pochodzi z pliku `docs/meta.json`; ten rozdział aktualizujemy po każdej fazie (rozdz. {{ref:aktualizacja}}).

## Struktura repozytorium {#repo}

Tabela: Zawartość repozytorium
| Ścieżka | Zawartość |
|---|---|
| `Nova_Roma.html` | **gra** — cały kod w jednym pliku (ok. 10 700 linii; bloki `Sprites` i `SPRITE_META` są generowane) |
| `README.md` | opis projektu i zasad dodanych w nowym stylu |
| `tools/` | testy silnika bez przeglądarki (`node:vm` + atrapy DOM), testy w Playwright, `headless.js` (harness) |
| `prototyp/` | źródła silnika grafiki (`src/*.js`), `build.js`, `build_game.js` (osadza sprite'y w grze), `grafika_prototyp.html`, podglądy |
| `docs/` | **ta dokumentacja**: rozdziały (`chapters/*.md`), generator PDF (`build.js`), tabele z kodu (`tables.js`), wynik `Nova_Roma_dokumentacja.pdf` |

Gałąź robocza to `claude/festive-meitner-ejo4l1`, szkic pull requestu #1 do `main`. Pełne polecenia budowy i testów — aneks {{ref:aneks-repo}}.

## Uruchamianie i parametry adresu {#uruchamianie}

Grę otwiera się z pliku (`file://`) w nowoczesnej przeglądarce; pokazuje się **menu główne** (rozdz. {{ref:menu}}), z którego Piaskownica prowadzi do wyboru nacji, klimatu i typu mapy. Po Starcie następuje wypiek grafiki (1–3 s), wypiek podłoża mapy i gra. Parametry adresu (wszystkie opcjonalne):

Tabela: Parametry adresu (query string)
| Parametr | Działanie |
|---|---|
| `?menu=0` | pomija menu główne i pokazuje dawny ekran wyboru nacji czterema kartami (kontrakt dla testów przeglądarkowych) |
| `?play=nacja` | pomija menu i ekran wyboru nacji: `franks`, `saracens`, `vikings`, `slavs` (ta sama ścieżka `UI.startGame` co wybór kartą) |
| `&climate=` | klimat: `temperate`, `eastern`, `snow`, `desert` (domyślnie klimat nacji) |
| `&map=` | typ mapy: `coast`, `plain`, `river`, `lakes`, `mountains`, `wetlands` (Wikingowie zawsze `coast`) |
| `&seed=N` | ziarno mapy (liczba całkowita); bez niego stałe ziarno nacji (777 / 888 / 999 / 1111) |
| `?q=1` lub `?q=2` | jakość wypieku sprite'ów (1 = lżejsza, 2 = ostra; domyślnie 2 na ekranach HiDPI) |
| `?classic=1` | bez sprite'ów — dawne procedury rysowania `Gfx.ART` (zapas) |
| `?fauna=0` | wyłącza faunę i polowanie (domyślnie włączone w grze) |
| `?logistics=0` | wyłącza sprawność logistyczną (domyślnie włączona w grze) |
| `?physical=0` | dawna krzywa liniowa zamiast modelu cyklu pracy (drwal przy najbliższym drzewie, dojście i noszenie budowniczych, karawany) — domyślnie włączony razem z logistyką |
| `?workers=0` | dawne cienie (obywatele i nosiciele) zamiast robotników z narzędziami (rozdz. {{ref:workers}}) |
| `?tempo=N` | sekundy rzeczywiste na minutę gry przy prędkości ×1 (domyślnie {{v:Data.RULES.clock.secPerMin}}; np. `?tempo=4` — dawne tempo, używane przez niektóre testy) |

Przycisk „Nowa mapa” w menu w grze i „Menu główne” działają przez zmianę parametrów adresu (rozdz. {{ref:menu-gry}}).

> [!uwaga] Parametry `?play=` oraz `?menu=0` są kontraktem dla testów przeglądarkowych — nie wolno zmieniać ich znaczenia bez aktualizacji `tools/browser_*.js`.
