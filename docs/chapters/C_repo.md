# Repozytorium, polecenia i budowa {#aneks-repo}

## Polecenia {#polecenia}

Tabela: Najczęstsze polecenia (z katalogu głównego repozytorium; Node 18+, testy przeglądarkowe wymagają Playwright z Chromium)
| Polecenie | Działanie |
|---|---|
| `node prototyp/build.js` | skleja `prototyp/src/*.js` w `prototyp/grafika_prototyp.html` |
| `node prototyp/build_game.js` | osadza silnik sprite'ów i katalog obrysów w `Nova_Roma.html`; `--check` sprawdza aktualność bloków |
| `sh prototyp/podglady.sh` | odświeża podglądy `prototyp/podglad/*.jpg` |
| `node tools/scenarios.js` | 58 scenariuszy akceptacyjnych + niezmienniki |
| `node tools/normal.js [plik] [nacja]` | normalna gra botów R/D/N (ok. 5 min dla wszystkich nacji) |
| `node tools/fauna.js`, `terrain.js`, `path.js`, `walkers.js`, `roads.js`, `spacing.js`, `leveling.js`, `logistics.js`, `footprints.js` | testy modułów (headless) |
| `node tools/browser_ui.js`, `browser_play.js`, `browser_terrain.js`, `browser_fauna.js`, `browser_sprites.js`, `browser_mobile.js` | testy w przeglądarce (Playwright) |
| `node docs/build.js` | buduje `docs/Nova_Roma_dokumentacja.pdf` (`--html` — tylko HTML, `--check` — sama walidacja) |
| `node docs/collect.js` | odświeża `docs/data/wyniki_testow.json` (uruchamia normal.js i scenarios.js; `--parse a.txt b.txt` — z gotowych wyjść) |

## Skrypty testowe {#skrypty}

{{tabela:narzedzia_testowe}}

## Zasady pracy z kodem {#zasady-pracy}

- **Nie edytować ręcznie** bloków `SPRITE_META` i `Sprites` w `Nova_Roma.html` — zmieniamy `prototyp/src/*.js`, a potem `node prototyp/build.js && node prototyp/build_game.js`.
- Kod ładowany przy starcie musi działać z atrapami DOM z `tools/headless.js` (bez `window.location` poza `typeof` i bez literalnego `</script>` w łańcuchach).
- Logika gry nie woła `RNG` poza modułami, które już to robią (rozdz. {{ref:rng}}); nowe moduły używają własnego PRNG ze stanem w JSON.
- Każda faza kończy się: testami modułu, regresją (`scenarios`, `normal`, `mapstats`, `raids`, `store`, `fauna`), commitem i **aktualizacją dokumentacji** (rozdz. {{ref:aktualizacja}}).
