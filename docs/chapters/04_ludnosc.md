# Ludność, jedzenie i popularność {#ludnosc}

Ludność jest sprzężona z jedzeniem, mieszkaniami i popularnością (rysunek poniżej). Wzrost jest **monotoniczny do poziomu, który da się wykarmić** — bramka imigracji patrzy na *potencjalną* produkcję jedzenia, więc ludność nie „piłuje się” (20 → 13 → 32), jak w pierwszych wersjach modelu.

{{diagram:petle}}

## Jedzenie {#jedzenie}

Jedzenie to **jedna wspólna pula sześciu rodzajów**: ryby, chleb, mięso, ser, owoce i daktyle (kasza Słowian liczy się jako chleb, zbiory leśne jako owoce). Rodzaje są wymienne — mieszkaniec zjada porcję dowolnego z nich.

- **Zużycie ludzi:** `ludność / 6 × racje` porcji na minutę (1 porcja na 6 minut na osobę przy racjach ×1; 1 porcja/min żywi 6 osób). Racje ustawia gracz: ×0,5 / ×1 / ×1,5 / ×2.
- **Budowniczowie w pracy** (noszący lub budujący) zjadają 1,5 racji: dodatek `0,5 × racje / 6` porcji/min na osobę; czekający 1 rację (są częścią ludności).
- **Kopalnie i Wytwórnia kadzidła** („podatek górniczy”): Kopalnia żelaza i węgla 0,5, Wytwórnia kadzidła 0,5, Kopalnia darniowa 0,25 porcji/min — ale **tylko z nadwyżki**: gdy zapas jedzenia jest mniejszy niż 5 minut zużycia ludności, budynek stoi, a ludność ma pierwszeństwo.
- **Kolejność poboru:** najpierw **ryby**, potem pozostałe rodzaje **proporcjonalnie do zapasów**.
- **Zapas startowy:** 36 porcji pierwszego rodzaju (chleb / daktyle / ryby / kasza), ok. 15 minut dla 14 osób.

Źródła jedzenia (jeden obsadzony budynek, racje ×1):

Tabela: Źródła jedzenia
| Źródło | Nacje | Porcje/min | Osób | Porcje na robotnika | Uwagi |
|---|---|---|---|---|---|
| Sad | wszystkie | 1,0 | 6,0 | 1,0 | bez wejść |
| Mleczarnia | wszystkie | 1,0 | 6,0 | 1,0 | bez wejść („krowy doją się same”) |
| Chata myśliwego | wszystkie | 0,8 | 4,8 | 0,8 | plon × min(1, drzewa / 80) × min(1, zwierzyna / 5) |
| Łańcuch chleba (Farma + Młyn + Piekarnia + 0,5 nosiwody) | Frankowie | 3,3 | 19,8 | 0,94 | wejścia: zboże 1,5, mąka 1,5, woda 0,75 |
| Gaj daktylowy (+ 0,4 nosiwody) | Saraceni | 1,6 | 9,6 | 1,14 | wymaga wody 0,6/min |
| Chata rybaka | Wikingowie | 1,1 | 6,6 | 1,1 | pole nad morzem, zasób nieskończony, limit miejsc na brzegu |
| Chata zbieracza | Słowianie | 1,0 × gęstość lasu | do 6 | do 1,0 | zbiory leśne liczą się jako owoce; zależy od Puszczy |
| Pole stałe + Kaszarnia | Słowianie | 2,25 (Kaszarnia) | 13,5 | — | kasza liczy się jako chleb |

## Głód {#glod}

Gdy w ticku zabraknie jedzenia (`niedobór > 0`), rośnie `starveTimer`; gdy jedzenia wystarcza, wraca do 0. Po **5 minutach** ciągłego głodu ludność maleje o 1 osobę na minutę, **nie poniżej 10 osób**. W czasie głodu (`starveTimer ≥ 5`) producenci żywności pracują z pełną mocą, a pozostałe budynki tracą 25% wydajności (`hungerK = 0,75`). Głód to miękka porażka: podłoga 10 jest zawsze możliwa do wykarmienia przez dwa tanie budynki żywności, więc kryzys nie przekreśla gry. Statystyka `stats.starveMin` zlicza minuty głodu po upływie tych 5 minut (ludność ginie albo stoi już na podłodze 10 osób).

## Mieszkania i imigracja {#imigracja}

**Mieszkania:** 20 bazowych (Dwór) + 6 na każdą Chatę (Wikingowie: Długi dom — 8). Nowy osadnik przybywa tylko wtedy, gdy spełnione są **wszystkie** warunki:

1. brak głodu w tym ticku (jedzenia starczyło),
2. **potencjał produkcji jedzenia ≥ 110% zużycia** (ludzie + budowniczowie w pracy + kopalnie),
3. ludność < liczba mieszkań,
4. popularność ≥ 45.

Tempo: jedna osoba co `0,5 × 50 / max(10, popularność)` minuty (przy popularności 50: co 0,5 min).

**Potencjał jedzenia** liczy produkcję jedzenia „przy dostępnych wejściach”: obsadzone budynki żywności, których wejścia leżą w magazynie albo są wytwarzane przez inny czynny budynek (chleb liczy Piekarnia; Farma i Młyn same nie są jedzeniem). Potencjał uwzględnia las i zwierzynę (Myśliwy, Puszcza) oraz sprawność logistyczną, ale **nie** premię popularności. Margines 110% (a nie 105%) pochłania narzut transportu i błędy casualowego gracza: przy bramie 1,05 casualowi Frankowie przechodzili poziom 4 w 85% przypadków, przy 1,10 w 95%, kosztem ok. 5 minut wolniejszego startu.

**Maksymalna ludność** wynikająca z bramki (pokazywana w panelu Żywność i w Doradcy jako „Maks. ludność”):

```
P_max  =  ⌊ ( F / 1,1  −  B  −  E ) / (racje / 6) ⌋ + 1
F — potencjał jedzenia [porcji/min],  B — budowniczowie w pracy (0,5/6 na osobę × racje),  E — podatek górniczy kopalń (0,5 / 0,25 porcji/min na obsadzoną)
```

> [!spec] Przykład ze specyfikacji (wersja z bramą 105%): 2 łańcuchy chleba, Chata myśliwego, Mleczarnia, Sad i 3 kopalnie dają F = 8,8 i P_max ≈ 41,7; symulator ustabilizował ludność na 42. W grze z bramą 110% wartość jest odpowiednio niższa; Doradca pokazuje ją na bieżąco.

## Popularność {#popularnosc}

Popularność startuje od 50 i jest sumą modyfikatorów ograniczoną do 0–100. Wpływa na **wydajność** (`popMult`, 0,8–1,2) i na **tempo imigracji**, a poniżej 45 zamraża imigrację.

{{tabela:popularnosc}}

**Racje.** Wyższe racje (×1,5 i ×2) są w tej gospodarce pułapką: w teście dawały głód 47 i 123 minuty, bo zużycie rośnie szybciej niż popularność; racje ×0,5 zamrażają imigrację (popularność 37 < 45).

**Podatki.** Poziom 1 jest domyślny. Poziom 0 daje popularność, ale nie wystarcza na Koszary i żołd (Frankowie) — to świadomy wybór „popularność kosztem haraczu”. Poziom 3 jest pułapką startową (−16 → popularność poniżej progu 45); Doradca ostrzega przed nim, a Kościół z winem pozwala go sensownie podnieść w grze środkowej.

{{tabela:podatki}}

**Różnorodność jedzenia** liczy rodzaje, których zapas przekracza 5 porcji (+4 za każdy poza pierwszym), więc zbudowanie Sadu czy Mleczarni obok głównego źródła podnosi popularność o 4–8.

## Dobrobyt {#dobrobyt}

Dobrobyt zastępuje manę z wcześniejszych wersji: kościół lub meczet spala dobro własnej nacji (0,3/min) i daje **+10 popularności**, a Saraceni i Słowianie dostają dodatkowo **+6** z Łaźni lub Bani. Jeden budynek obsługuje 50 osób: premia obowiązuje, gdy `liczba zasilonych budynków × 50 ≥ ludność`; liczba zasilonych liczona jest w ticku produkcji (zapas dobra musi pokryć zużycie tej chwili) i dopiero w następnym ticku wchodzi do popularności.

Tabela: Dobrobyt według nacji
| | Frankowie | Saraceni | Wikingowie | Słowianie |
|---|---|---|---|---|
| Budynek | Kościół 8 d + 80 zł | Meczet 6 d + 4 gl + 80 zł; Łaźnia 6 d + 6 gl + 40 zł | Kościół 12 d + 80 zł | Kapliczka 8 d + 80 zł; Bania 6 d + 40 zł |
| Dobro (0,3/min) | {{v:Economy.DOBRO.franks}} (Winnica + Winiarz) | {{v:Economy.DOBRO.saracens}} (z łańcucha) | {{v:Economy.DOBRO.vikings}} (z łańcucha) | {{v:Economy.DOBRO.slavs}} (z łańcucha miodu i wosku) |
| Premia | +10 | +10 (Meczet), +6 (Łaźnia: woda 0,5/min) | +10 | +10 (Kapliczka), +6 (Bania: woda 0,3 + pień 0,2/min) |
| Koszt dobra | 0,3 wina/min | ok. 0,6–1,3 zł/min utraconej sprzedaży | konkuruje z Okrętem | ok. 0,9 osobominuty/min utraconej daniny |

Decyzja gracza jest łagodna, ale prawdziwa: Frank kupuje dwoma budynkami na wino zdolność do podatku 3, Saracen wybiera między sprzedażą kadzidła a spaleniem go oraz między Łaźnią a wodą dla Gajów (przepis bez Meczetu i Łaźni daje pojemność haraczu 9 wobec 8: Dobrobyt kosztuje 1 poziom), Wiking — między miodem na wyprawę a miodem do kościoła, a Słowianin — między woskiem do Kapliczki a daniną. Zaklęcia, gdyby kiedyś wróciły, mają być wydatkiem tego samego zasobu, a nie nowym łańcuchem.
