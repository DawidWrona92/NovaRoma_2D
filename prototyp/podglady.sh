#!/bin/sh
# Odświeża podglądy w podglad/ (wymaga Node + Playwright + Chromium; patrz shot.js / sheet.js).
# Użycie: sh podglady.sh            — wszystkie podglądy po kolei (kilka minut)
cd "$(dirname "$0")" || exit 1
node build.js || exit 1
mkdir -p podglad
P=podglad
node shot.js $P/scena.jpg "" 1                                                   # widok domyślny (1280×720)
node shot.js $P/scena_HD.jpg "" 2                                                # to samo na ekranie Retina (2560×1440)
SETZOOM=0.6 node shot.js $P/scena_oddalona.jpg "cx=17&cy=12.5" 1                 # oddalenie do całej mapy
node shot.js $P/scena_siatka.jpg "grid=1&z=1.1&cx=17.5&cy=13" 1 1700 950         # siatka pól z obrysami i rozmiarami
node shot.js $P/dzielnica_slowianie.jpg "cx=6&cy=19" 1
node shot.js $P/dzielnica_wikingowie.jpg "cx=26&cy=8" 1
node shot.js $P/dzielnica_saraceni.jpg "cx=27&cy=20" 1
node shot.js $P/scena_telefon.jpg "" 2 390 844                                   # telefon: widok domyślny
SETZOOM=0.19 node shot.js $P/scena_telefon_oddalona.jpg "cx=17&cy=12.5" 2 390 844   # telefon: cała mapa po oddaleniu
SW=1800 SH=1500 node sheet.js $P/arkusz_rozmiary.jpg 1 '#sheet-r'                # wszystkie budynki w jednej skali z obrysami
SW=1500 SH=900 node sheet.js $P/arkusz_ludzie.jpg 1 '#sheet-f-1.4'               # mieszkańcy
