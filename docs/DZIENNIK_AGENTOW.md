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
| 12.10 | haiku-documentation | góry i fauna: rozdz. 10, 12, 13, 16 | 112 tys. | 22 | 170 s | P | limit 14 tur bez raportu; rozdz. 17, `tables.js` i PDF dokończył rodzic |
| 12.10 | haiku-documentation | obrót, Przystań i Okręt: rozdz. 11 i inne | 144 tys. | 21 | 148 s | N | limit 14 tur: zdążył tylko zacząć rozdz. 11 i zostawił odwołanie do nieistniejącej sekcji; resztę (11, 14, 15, 16, 17, tabele, README) napisał rodzic |
| 12.10 | haiku-documentation (nowa definicja, 40 tur) | rozdz. C i D po obrocie, artefakcie i dzienniku | 69 tys. | 15 | 105 s | T | pełny raport w formacie z definicji; 15 narzędzi (starym limitem 14 by się urwał); jedyna usterka: uznał za niespójność, że „skrypt diagnostyczny startu” nie jest plikiem (to blok wewnątrz gry) — bez wpływu na tekst |

| 12.10 | haiku-documentation | rozmiary map 9D-1: rozdz. 10, 14, 16, README | 97 tys. | 16 | 110 s | N | limit 14 tur bez raportu, nic nie zapisał na dysku; całość napisał rodzic |
| 12.10 | haiku-documentation | Osada i składy 9D-2/3: rozdz. 12, 06, 15, E | 134 tys. | 28 | 121 s | P | limit 14 tur bez raportu; zapisał rozdz. 12 (dobry, zgodny z faktami), 06 i 15 (błędne `{{v:SPRITE_META…}}` poprawił rodzic); aneksu E nie dotknął |
| 13.10 | Sonnet (worktree) | muzyka Punkt 16: test `tools/music.js` + dokumentacja | 127 tys. | 26 | 420 s | T | 89 sprawdzeń, `docs --check` czysto; worktree startował z `main` (bez gry) — agent sam przełączył się na bazę; uwagi o module (toggle, martwy kod) wdrożyłem |
| 13.10 | Sonnet (worktree) | muzyka: strój Franków | 112 tys. | 24 | 420 s | T | nuty ręczne zamiast losowych, dobre liczby; scalone bez poprawek |
| 13.10 | Sonnet (worktree ×3) | muzyka: strój Saracenów, Wikingów, Słowian | ? | ? | ? | N | pierwszy przebieg zatrzymany przez użytkownika w trakcie (zostały niezatwierdzone zmiany) |
| 13.10 | Sonnet (kontynuacja ×3) | muzyka: dokończenie strojów Saracenów, Wikingów, Słowian | 118/94/96 tys. | 17/15/9 | 540/330/170 s | T | pracowali na niezatwierdzonych zmianach poprzedników w tych samych worktree; własne pomiary (`music_analyze.js`) potwierdziły raporty; scalone bez poprawek |

## Błędy rodzica (do porównania)
- Commit fazy 9B przy padającym `tools/workers.js` (kod wyjścia zamaskowany przez `| tail`).
- Bramka `physical.js --full` nie została uruchomiona po ostatnim strojeniu (wyszła awaria bota N dopiero później).
- Definicja agenta dokumentacji ma `maxTurns: 40`, ale narzędzie `Agent` zatrzymuje go po 14 turach; poprawka definicji z 12.10 nie pomogła. Wniosek: dawać mu jeden plik i gotowy tekst do wklejenia albo pisać dokumentację samemu.
- Muzyka (13.10): nie doczekałem raportów przed pierwszym „stop”; wznowienie zatrzymanych agentów jest niemożliwe (trzeba uruchamiać nowych, wskazując istniejące worktree). Worktree agentów startują z `main` bez gry — w briefie podać `git merge --ff-only <gałąź>` albo katalog roboczy.
