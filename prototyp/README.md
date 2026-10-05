# Próbka nowego stylu graficznego (prototyp, v2)

Samodzielny prototyp — **nie zmienia gry** (`Nova_Roma.html`). Pokazuje, jak mógłby wyglądać render w stylu
Settlers IV / Twierdzy / AoE2 bez żadnych plików graficznych: wszystko jest rysowane kodem i wypiekane do sprite'ów.

![scena](podglad/scena.jpg)

## Jak oglądać
- `grafika_prototyp.html` — otwórz w przeglądarce. Kółko / szczypanie / przyciski `+` `−` — zoom, przeciągnięcie — przesuwanie,
  `⟲` — widok domyślny, `▦` (klawisz `G`) — siatka pól i ślady budynków.
- Parametry adresu: `?q=1|2` (rozdzielczość wypieku), `?z=2.4` (zoom domyślny), `?grid=1`.
  `#sheet-b-3` / `#sheet-n-3` / `#sheet-f-3` — arkusz budynków / przyrody / postaci w powiększeniu.
- Podglądy: `podglad/*.jpg` (scena, siatka, oddalenie, telefon, Retina, arkusze).

## Zasady (v2)
- **Skala pól:** każdy budynek mieści się w jednym polu (Zamek: 2×2, jak w grze). Skala geometrii sprite'a to `F`;
  tekstury zachowują stałą gęstość na ekranie, więc większy budynek nie jest „rozciągniętym" małym.
- **Ludzie** ~70 px wysokości przy zoomie 2 (wcześniej ~30): widok z przodu i z tyłu (lewo/prawo = odbicie), 2 klatki chodu,
  strój i rekwizyty zależne od nacji i roli (8 postaci).
- **Kamera:** zoom domyślny zależy od ekranu (≈10 pól na szerokość, min. 72 px na pole), zakres 50–180% domyślnego,
  przy oddaleniu LOD (mipmapy) zamiast poszarpanych krawędzi.
- **Rozdzielczość `RES`:** wypiek w 1× (zwykły ekran) lub 2× (Retina/telefony; przy ≤2 GB RAM zostaje 1×).
- **Teren:** kafle 512×512 px logicznych wypiekane na żądanie (łąka, piasek, plaża, jezioro, drogi, pola); cienie i place
  nieruchomych obiektów są wypiekane razem z terenem.
- **Ładowanie:** wypiek w kawałkach z paskiem postępu (strona nie „wisi" na wolnym telefonie).

## Pomiary (Chromium headless, render programowy, bez GPU)
| | wypiek | uwagi |
|---|---|---|
| ×1, procesor zwykły | ≈ 0,9 s | budynki ≈ 0,25 s, teren ≈ 0,3 s |
| ×2, procesor zwykły | ≈ 1,9 s | |
| ×1, procesor 4× wolniejszy (symulacja) | ≈ 4,5 s | z paskiem postępu |
| ×2, procesor 4× wolniejszy (symulacja) | ≈ 9,8 s | |
Klatka ≈ 20 FPS przy 1280×720 w renderze programowym (na GPU powinno być wyraźnie lepiej — nie mierzone na prawdziwym urządzeniu).

## Pliki
- `src/00_util.js` — generator liczb pseudolosowych, szum okresowy, miękkie cienie, LOD,
- `src/10_tex.js` — tekstury proceduralne (zrąb, strzecha, dachówka, kamień, piaskowiec, tynk, ziemia…),
- `src/20_scene.js` — „piekarnik" sprite'ów: ściany/połacie jako równoległoboki z teksturą, światło, cienie, obrys, mnożniki `F` i `RES`,
- `src/30_buildings.js` — budynki: chata słowiańska, dom ryglowy, wieża i Zamek (Frankowie), dom i meczet (Saraceni), długi dom i okręt (Wikingowie), studnia, stóg, drewno,
- `src/40_nature.js` — trawa/woda/pola w płaszczyźnie świata, drzewa, skały, kępy trawy, mieszkańcy,
- `src/90_main.js` — scena, teren w kaflach, kamera, siatka, animacje, ładowanie,
- `build.js` — skleja `src/*.js` w `grafika_prototyp.html`; `shot.js`, `sheet.js` — zrzuty w Chromium (Playwright; `PERF=1` wypisuje koszt klatki).
