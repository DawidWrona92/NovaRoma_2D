# Zdarzenia i kryzysy {#zdarzenia}

Moduł `Events` odpowiada za dwie rzeczy: **napady na karawanę** (Saraceni, losowe) i **kryzysy** wg harmonogramu (zaraza, pożary, krach cen, wylesienie) — scenariusze z kryteriów akceptacji, które sprawdzają, czy gra „da się uratować” po katastrofie. Silnik pozostaje deterministyczny: jedynym losowaniem jest napad na karawanę, rozstrzygany globalnym `RNG` z ziarnem.

## Napad na karawanę {#napad}

Dotyczy tylko **Saracenów** i można go wyłączyć w scenariuszu (przycisk 🏴 w HUD — `settings.raids`; dla presetu Łatwy, jeśli samouczek tego wymaga). Gromadzenie złota jest u Saracenów ryzykowne: im więcej złota w skarbcu, tym większa szansa napadu, a Strażnica zmniejsza ryzyko za cenę stałego utrzymania. To dynamiczny balans — napad dotyka tylko tego, kto ma nadwyżkę, a gracz w kłopotach go nie czuje.

Tabela: Reguły napadu na karawanę (Events.tick)
| Zasada | Wartość |
|---|---|
| Sprawdzenie napadu | co 10 min, od 40. minuty (`raids.next`) |
| Złoto bezpieczne | pierwsze 150 zł jest nietykalne (przy złocie ≤ 150 zł napadu nie ma) |
| Szansa napadu | `min(0,5; (złoto − 150) / 1000) × (1 − 0,40 × liczba czynnych Strażnic)` |
| Łup | `min(400 zł; 0,30 × (złoto − 150) × (1 − 0,25 × liczba czynnych Strażnic))` |
| Strażnica | 8 d + 6 gl + 40 zł, 1 pracownik, bez narzędzia; utrzymanie {{v:Events.GUARD_UPKEEP}} zł/min; **max {{v:Events.GUARD_MAX}} liczą się** w sumie |
| Utrzymanie | gdy złota brak, Strażnica nie działa w tym ticku (nie liczy się jako czynna) |

Szansa jest porównywana z jednym losowaniem `RNG.next()` na sprawdzenie (losowanie następuje tylko wtedy, gdy złoto przekracza 150 zł). Skutek: `złoto −= łup`, `raids.count++`, `raids.lost += łup` i komunikat „⚔ Napad na karawanę! Zrabowano N zł” (ze wzmianką o Strażnicach albo podpowiedzią „zbuduj Strażnicę!”).

> [!spec] **Wyniki testu (12 ziaren, mistrz, poziom 3, zapas ok. 890 zł):** bez napadów 891 zł; z napadami bez Strażnicy 586 zł (strata 305 zł, 2,7 napadu); z jedną Strażnicą 620 zł (strata 139 zł + 48 zł utrzymania); z dwiema 593 zł (strata 33 zł + 93 zł utrzymania). Strażnica zwraca się więc przy zapasie powyżej ok. 500 zł. Przy poziomie 6 (zapas ok. 400 zł) każda Strażnica obniża końcowe złoto (340 / 260 / 139 zł), bo koszt utrzymania przewyższa straty. Zwykli i słabi gracze napadów nie odczuwają (rzadko mają więcej niż 150 zł); przy poziomie maksymalnym napad nie ma czym zaszkodzić (pojemność 8 w każdym ziarnie), a Strażnica odbiera po 1 poziomie na sztukę.
>
> Gracz ma więc wybór: Strażnice przy dużym zapasie i niskim poziomie haraczu, brak Strażnic przy wysokim. Ostrzeżenie na 2 minuty przed napadem i napad na samą sprzedaż nie zostały zamodelowane (propozycja „wersji 2” mechanizmu).

W grze statystyka napadów jest w panelu **NAPADY** (liczba napadów, strata, czynne Strażnice), a Doradca informuje, gdy skarbiec przekracza 300 zł. Skrypt `tools/raids.js` zbiera rozkład strat po wielu ziarnach (ze Strażnicami i bez).

## Kryzysy wg harmonogramu {#kryzysy}

Przycisk 🔥 **Kryzysy** włącza `Events.setCrisis(true)`; od tej chwili `runCrisis` sprawdza w każdym ticku listę zdarzeń nacji i wykonuje te, których czas już minął. Scenariusze pochodzą z kryteriów akceptacji (v3.5):

{{tabela:kryzysy}}

Rodzaje zdarzeń:

- **Zaraza** (`plague`): ludność −12, nie poniżej 10.
- **Pożar** (`fire`): z listy typów budynków pali się **po jednym budynku każdego typu** (pierwszy znaleziony): zwalnia pola obrysu i usuwa budynek (`Events.destroy`) — bez zwrotu materiałów i narzędzia; odbudowa jest zwykłą budową.
- **Krach cen** (`priceCrash`): ceny trzech towarów handlowych spadają na podłogę krzywej (0,9 / 0,9 / 0,6 zł) i odnawiają się 1,43% luki na minutę.
- **Wylesienie** (`deforest`) i **pożar lasu** (`forestFire`): ścina zadaną liczbę lub 60% drzew; plony leśne Słowian maleją liniowo, gdy drzew < 200, a Leśniczówki odtwarzają las.

Każde zdarzenie dopisuje komunikat do `eventMsgs`, który `UI.refreshHUD` pokazuje w podpowiedzi u dołu ekranu.

Kryteria akceptacji wymagają, by po każdym z tych kryzysów gra dała się uratować bez „cheatów”: np. brak żywności do 40. minuty i późniejsza odbudowa kończy się u Franka głodem 31 min, ludnością 21 na końcu i terminami 6/6 (przy głodzie > 10 min przejście liczy się jako niezaliczone), zaraza nie zostawia trwałej straty, a pożar łańcucha produkcji (chleb i Sad; 2 Gaje i Qanat; Przystań i Okręt albo Miodosytnia) daje głód 0 i haracz 6/6. Pełne tabele wyników są w aneksie {{ref:aneks-spec}}, a bieżące wyniki scenariuszy w aneksie {{ref:wyniki-gry}}.
