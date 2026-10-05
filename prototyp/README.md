# Próbka nowego stylu graficznego (prototyp, v3)

Samodzielny prototyp — **nie zmienia gry** (`Nova_Roma.html`). Pokazuje, jak mógłby wyglądać render w stylu
Settlers IV / Twierdzy / AoE2 bez żadnych plików graficznych: wszystko jest rysowane kodem i wypiekane do sprite'ów.

![scena](podglad/scena.jpg)

## Jak oglądać
- `grafika_prototyp.html` — otwórz w przeglądarce. Kółko / szczypanie / przyciski `+` `−` — zoom (30–180% widoku domyślnego),
  przeciągnięcie — przesuwanie, `⟲` — widok domyślny, `▦` (klawisz `G`) — siatka pól z obrysami budynków i ich rozmiarami.
- Parametry adresu: `?q=1|2` (rozdzielczość wypieku; domyślnie 2), `?z=2.4` (zoom domyślny), `?grid=1`, `?cx=26&cy=8` (środek kamery w polach),
  `?sprite=frankKeep,slavHut&zs=2` — pojedyncze sprite'y, `#sheet-b-3` / `#sheet-n-3` / `#sheet-f-3` — arkusz budynków / przyrody / postaci.
- Podglądy: `podglad/*.jpg`.

## Co zmieniło się w v3 (po uwagach)
1. **Budynki mają różne obrysy** — jak w AoE2 / Settlers: od domów 2×2 po Zamek 4×4, z prostokątami 4×2, 3×2, 2×3, 4×3.
   Każdy sprite jest rysowany pod swój obrys (a nie skalowany z jednego wzoru), z własną bryłą: kościół z wieżą i iglicą, młyn z domem
   młynarza, koszary z dziedzińcem, karawanseraj z dziedzińcem i wielbłądami, przystań na palach, długi dom z dachem darniowym…
2. **Duże, szczegółowe budynki** — pole ma na ekranie pulpitu 100–160 px (w v2: od 72 px). Domyślny kadr mieści Zamek 4×4.
   Mały ekran nie dostaje mniejszej grafiki — ratuje go **oddalanie** (do 30%: cała osada na jednym ekranie).
3. **Ślady życia** (system zużycia `src/25_wear.js`, rysowany na każdej ścianie i połaci przed oświetleniem):
   ziarno, wilgotne plamy i przybrudzenia u podstawy, zacieki od okapu, pęknięcia i wyszczerbienia kamienia, łaty napraw (inny odcień
   tego samego materiału w tym samym układzie desek / gontów / kamieni; gwoździe, sznur na łatach ze słomy), odpadający tynk,
   brakujące dachówki, mech. Deterministyczne (to samo ziarno = ten sam wygląd), natężenie sterowane parametrem `wear`.
4. **Nowa osada 34×30 pól** — cztery dzielnice (Frankowie, Słowianie, Wikingowie z jeziorem i okrętem, Saraceni na piasku), drogi, pola, lasy.
5. **Sortowanie głębi dużych obrysów** — po środku, z korektą porównaniem prostokątów (budynek 4×4 nie „wchodzi" przed sąsiada).

## Rozmiary budynków (pola)
| Nacja | Budynek | Obrys | Uwagi |
|---|---|---|---|
| Frankowie | Dom ryglowy | 2×2 | dachówka, rygle, okiennice, skrzynki z kwiatami |
| | Kościół | 4×2 | wieża z iglicą, witraże, łupek |
| | Młyn | 3×3 | wiatrak + dom młynarza |
| | Koszary | 3×3 (L) | dziedziniec z palisadą, banery |
| | Kuźnia | 2×3 | otwarte zadaszenie, palenisko |
| | **Zamek** | 4×4 | mur, 4 baszty, brama z kratą, donżon |
| Słowianie | Chata | 2×2 | zrąb, strzecha, koniki na kalenicy, ganek |
| | Spichlerz | 3×2 | na palach, szeroka strzecha |
| | Woskarnia | 2×3 | pasieka, kocioł |
| | Święty krąg | 3×3 | bożki, ogień, kamienny krąg |
| Saraceni | Dom | 2×2 | płaski dach z kopułką, mashrabija, pergola |
| | Meczet | 3×3 | kopuła, 4 kopułki, iwan, fontanna, minaret |
| | Targ | 3×3 | stragany pod pasiastymi płachtami |
| | Karawanseraj | 4×3 | dziedziniec, wieże z kopułami, wielbłądy |
| Wikingowie | Długi dom | 4×2 | dach darniowy, smocze główki, tarcze |
| | Chata | 2×2 | |
| | Przystań | 4×2 | szopa na łodzie, pomost na palach, żurawik z liną, sieć na ramie |
| | Miodosytnia | 2×3 | beczki, kocioł |
| | Okręt | jednostka | żagiel w pasy, tarcze na burcie, smocza głowa; kołysze się na wodzie |
| (wspólne) | Studnia | 1×1 | |

Zakładam, że w grze rozmiary dobierzemy do roli budynku (np. Zamek 4×4, Karawanseraj 4×3, Kościół/świątynia 4×2, młyn/koszary/targ 3×3).

## Zasady techniczne
- **Skala pól:** jednostka = 1 pole; geometria sprite'a ma mnożnik `F`, a tekstury utrzymują stałą gęstość na ekranie, więc duży budynek nie jest
  „rozciągniętym" małym. Układ sprite'a: środek obrysu = (0,0), `x` w prawo-dół, `y` w lewo-dół, `z` w górę.
- **Rozdzielczość `RES`:** domyślnie 2× (ostre duże budynki także po przybliżeniu); `?q=1` — lżejsza wersja (około połowa pamięci).
- **Teren:** kafle 512×512 px logicznych wypiekane na żądanie (łąka, piasek, plaża, jezioro z pianą, drogi, pola); cienie i place nieruchomych obiektów
  są wypiekane razem z terenem; przy oddaleniu kafle w rozdzielczości 1× (pasek postępu, gdy trzeba je dopiec).
- **Ludzie:** ~70 px wysokości przy zoomie domyślnym, widok z przodu i z tyłu (lewo/prawo = odbicie), 2 klatki chodu, strój i rekwizyty zależne od nacji i roli.
- **Ładowanie:** wypiek w kawałkach z paskiem postępu; strona nie „wisi".

## Pomiary (Chromium headless, render programowy, bez GPU; okno 360×640 @2)
| | wypiek | pamięć płócien |
|---|---|---|
| `?q=1`, procesor zwykły | ≈ 2,6 s | ≈ 146 MB |
| `?q=2` (domyślnie), procesor zwykły | ≈ 5,0 s | ≈ 280 MB |
| `?q=1`, procesor 4× wolniejszy (symulacja) | ≈ 10,4 s | |
| `?q=2`, procesor 4× wolniejszy (symulacja) | ≈ 22 s | |

Klatka ≈ 20–39 FPS przy 1280×720 w renderze programowym; na GPU powinno być wyraźnie lepiej — **nie mierzone na prawdziwym urządzeniu.**
Ładowanie na prawdziwym sprzęcie jest zapewne krótsze, a w grze wypiek można zbuforować (np. IndexedDB) albo robić w tle.

## Co trzeba zmienić w grze, żeby użyć tych sprite'ów
Dziś w `Nova_Roma.html` budynek ma 1 pole (poza Zamkiem 2×2: `size = id === 'keep' ? 2 : 1` w kilku miejscach). Potrzebne:
- `footprint: [w, h]` w `Data.BUILDINGS` i użycie go w kolizjach, obsadzaniu pól, podglądzie budowy, drogach/„adjacency", AI botów;
- wejścia (punkt dojścia pracowników) po stronie drogi, a nie „środek pola";
- sortowanie głębi z prostokątami obrysów (jest w `src/90_main.js: sortDrawables`);
- wypiek sprite'ów przy starcie z paskiem postępu (`BAKED.*` + `sceneFor(fw, fh, wysokość)`).

## Pliki
- `src/00_util.js` — generator liczb pseudolosowych, szum okresowy, miękkie cienie, LOD,
- `src/10_tex.js` — tekstury proceduralne (zrąb, deski, strzecha, dachówka, gont, łupek, kamień, bruk, piaskowiec, tynk, mozaika, plecionka…),
- `src/20_scene.js` — „piekarnik" sprite'ów: ściany/połacie jako równoległoboki z teksturą, światło, cienie, obrys, plamy i place, mnożniki `F` i `RES`,
- `src/25_wear.js` — zużycie: plamy, zacieki, łaty, pęknięcia, mech, ziarno,
- `src/30_buildings.js` — zestaw elementów (drzwi, okna, ryglowanie, dachy dwuspadowe i piramidalne, kopuły, minarety, beczki, skrzynie…),
- `src/31_slavs.js`, `32_franks.js`, `33_saracens.js`, `34_vikings.js` — budynki nacji, `35_props.js` — stóg, drewno, studnia,
- `src/40_nature.js` — trawa/woda/pola, drzewa, skały, kępy trawy, mieszkańcy,
- `src/90_main.js` — plan osady, teren w kaflach, kamera, siatka, sortowanie, animacje, ładowanie,
- `build.js` — skleja `src/*.js` w `grafika_prototyp.html`; `shot.js`, `sheet.js` — zrzuty w Chromium (Playwright; `PERF=1` wypisuje koszt klatki).
