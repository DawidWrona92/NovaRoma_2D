# Katalog budynków {#budynki}

Budynki definiuje `Data.BUILDINGS`; ich liczby (koszty, wejścia, wyjścia, tempo) pochodzą ze specyfikacji v3.6, a obrysy z katalogu sprite'ów (`SPRITE_META`, rozdz. {{ref:grafika}}). Tabele w tym rozdziale są **generowane z kodu** podczas budowy dokumentu — jeśli zmieni się koszt lub tempo w `Data`, po przebudowie PDF zmieni się także tabela.

## Jak czytać tabele {#tabele}

- **Obrys** — szerokość × głębokość w polach (północny róg obrysu to `b.x, b.y`); wejście (drzwi) jest zdefiniowane w katalogu sprite'ów (strona S lub E i punkt na ścianie) i służy nosicielom, budowniczym i myśliwym jako cel marszu.
- **Koszt** — *d* deski, *k* kamień, *gl* glina, *zł* złoto (płatne przy otwarciu placu). **T** — budynek wymaga narzędzia przy obsadzeniu.
- **Prac.** — liczba pracowników (0 lub 1).
- **Wejścia / Wyjścia** — tempo na minutę gry przy obsadzie 1 pracownika i mnożniku 1 (Wikingowie: wartości już po skali nacji, np. Tartak 1,3 → 2,6). Dla budynków wielowyjściowych (Woskarnia) wyjścia dzielą się w podanej proporcji.
- **Wymagania terenu** — dodatkowe warunki `World.canPlace` (rozdz. {{ref:zabudowa}}).

Każda nacja ma zestaw własnych budynków i wspólnych, które różnią się kosztem (Frank płaci deskami i kamieniem, Saracen deskami i gliną, Wiking i Słowianin tylko deskami):

{{tabela:liczba_budynkow}}

## Budynki wspólne {#wspolne}

Jedenaście budynków występuje u wszystkich czterech nacji:

{{tabela:koszty_wspolne}}

U Wikingów Chata (Długi dom) mieści 8 osób zamiast 6, a drwal, leśnik i tartak pracują szybciej (rozdz. {{ref:ekonomia}}); u Słowian cennik bazuje na Wikingach bez zwiększonej Chaty (Chata 4 d, Tartak 8 d, reszta jak u Franków bez kamienia). Kościół nazywa się u Saracenów Meczetem, a u Słowian Kapliczką.

## Dwór {#dwor}

Dwór (obrys 4×4, wejście od południa, stoi pośrodku mapy) jest „sercem osady” i nie można go budować ani burzyć. Daje:

- **20 mieszkań** bazowych i komorę **20 sztuk każdego towaru** (zwiększa pojemność każdego towaru o 20, patrz rozdz. {{ref:ekonomia}}),
- **piłę zamkową** (do 0,6 pnia/min → deski) i zawory budulca (kamień dla Franków, glina dla Saracenów),
- cel nosicieli bez Składu, punkt startowy budowniczych i obywateli,
- ustawienie liczby budowniczych (przycisk 👷 w HUD; 2–5).

## Frankowie {#b-franks}

Najpełniejszy zestaw (23 budynki): łańcuch chleba (Farma → Młyn → Piekarnia), metalurgia (Kopalnie żelaza i węgla → Huta → Kuźnia narzędzi / Zbrojownia), wino (Winnica → Winiarz) i Koszary.

{{tabela:budynki:franks}}

## Saraceni {#b-saracens}

Saracen płaci haracz złotem z handlu trzema towarami; ma 22 budynki, w tym Strażnicę i Karawanseraj.

{{tabela:budynki:saracens}}

## Wikingowie {#b-vikings}

Wiking opiera się na drewnie, morzu i wyprawach: 20 budynków, węgiel wyłącznie z Wypalarek, Przystań i Okręt jako rdzeń mechaniki haraczu.

{{tabela:budynki:vikings}}

## Słowianie {#b-slavs}

Słowianin żyje z lasu i płaci haracz w towarach: 19 budynków, plony leśne zależne od gęstości lasu (Puszcza).

{{tabela:budynki:slavs}}
