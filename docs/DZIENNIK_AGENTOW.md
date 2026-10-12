# Dziennik pracy agentów (Haiku) — Nova Roma

Cel: sprawdzić, czy delegowanie opłaca się względem pracy samodzielnej. Wpis dopisuje rodzic **po sprawdzeniu wyniku**. Kolumny: *Przyjęte* — T (bez poprawek), P (po poprawkach rodzica), N (odrzucone/powtórzone); *Poprawka rodzica* — co trzeba było dokończyć lub naprawić; tokeny i czas z raportu agenta (`?` = nie zapisano).

| Data | Agent | Zadanie | Tokeny | Narzędzia | Czas | Przyjęte | Poprawka rodzica |
|---|---|---|---|---|---|---|---|
| 10.10 | haiku-documentation | rozdz. 2 (tempo), 11, 13, literówka w E | ? | ? | ? | P | dwa przebiegi (limit tur → wznowienie z węższym zakresem) |
| 10.10 | haiku-documentation | rozdz. 15 (grafika) + PDF | 136 tys. | 7 | 142 s | T | sprawdzone parametry `?q`, `?classic` w kodzie; bez zmian |
| 10.10 | haiku-plan-updater | sprzątanie PLAN.md, lista decyzji | ? | ? | ? | P | usunięto zmyśloną „decyzję 8”; brak narzędzi TaskUpdate → zadania poprawił rodzic |
| 10.10 | haiku-tester | regresja headless + 11 testów | 60 tys. | 10 | 30 s | P | raport niekompletny; `regress.sh` ma bashizmy (wina rodzica); wyniki odczytane z plików |
| 10.10 | haiku-documentation | dokumentacja 9B-5 (12, 16, 17, tables, README) | ? | ? | ? | P | pominięty aneks E (6 miejsc) — poprawił rodzic |
| 10.10 | haiku-tester | 8 testów przeglądarkowych | ? | ? | ? | T | 8/8 exit 0, bez poprawek |

## Błędy rodzica (do porównania)
- Commit fazy 9B przy padającym `tools/workers.js` (kod wyjścia zamaskowany przez `| tail`).
- Bramka `physical.js --full` nie została uruchomiona po ostatnim strojeniu (wyszła awaria bota N dopiero później).
