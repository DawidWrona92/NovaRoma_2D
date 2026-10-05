# Próbka nowego stylu graficznego (prototyp)

Samodzielny prototyp — **nie zmienia gry** (`Nova_Roma.html`). Pokazuje, jak mógłby wyglądać render w stylu
Settlers IV / Twierdzy / AoE2 bez żadnych plików graficznych: wszystko jest rysowane kodem i wypiekane do sprite'ów.

- `grafika_prototyp.html` — gotowy plik do otwarcia w przeglądarce (kółko myszy: zoom, przeciągnięcie: przesuwanie).
  Adres z `#sheet-b-2.0` / `#sheet-n-2.0` pokazuje arkusz budynków / przyrody w powiększeniu.
- `src/*.js` — źródła (sklejane przez `node build.js` do pliku HTML):
  - `00_util.js` — generator liczb pseudolosowych, szum okresowy, miękkie cienie,
  - `10_tex.js` — tekstury proceduralne (zrąb, strzecha, dachówka, kamień, piaskowiec, tynk, ziemia…),
  - `20_scene.js` — „piekarnik" sprite'ów: ściany/połacie jako równoległoboki z teksturą, światło z lewej-góry, cienie rzucane, obrys,
  - `30_buildings.js` — budynki: chata słowiańska, dom ryglowy i wieża (Frankowie), dom i meczet (Saraceni), długi dom i okręt (Wikingowie), studnia, stóg,
  - `40_nature.js` — trawa/woda/pola w płaszczyźnie świata, drzewa (dąb, sosna, palma), skały, kępy trawy, mieszkańcy,
  - `90_main.js` — scena pokazowa: teren z jeziorem, plażą, piaskiem, drogami i polami; sortowanie po głębi; animacje (woda, dym, drzewa, ludzie, okręt).
- `shot.js`, `sheet.js` — zrzuty ekranu w Chromium (Playwright); `PERF=1 node shot.js …` wypisuje koszt wypieku i klatki.

Zasada: **model 3D z prymitywów → raz wypiekany sprite (2× supersampling) → w grze tylko `drawImage`**.
Place i cienie nieruchomych obiektów są wypiekane do warstwy terenu (w grze: do kafli terenu odświeżanych po zmianie).
