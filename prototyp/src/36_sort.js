/* ====================== SORTOWANIE GŁĘBI (wspólne dla sceny pokazowej i gry) ======================
   Obiekt do narysowania: { d: x+y środka, rect?: {x0,y0,x1,y1,big} obrys w polach, bb: [x0,y0,x1,y1] prostokąt na ekranie, x, y: środek w polach }. */
/* kolejność rysowania: najpierw wg głębokości środka, potem korekta dla dużych obrysów (budynki) porównaniem prostokątów */
const behindRect = (a, b) => a.x1 <= b.x0 + 0.02 || a.y1 <= b.y0 + 0.02;
function cmpRect(a, b) { const ab = behindRect(a, b), ba = behindRect(b, a); return ab && !ba ? -1 : ba && !ab ? 1 : 0; }
function sortDrawables(list) {
  list.sort((a, b) => a.d - b.d);
  const big = list.filter(it => it.rect && it.rect.big);
  for (let pass = 0; pass < 2; pass++) for (const B of big) {
    let ib = list.indexOf(B);
    for (let i = 0; i < list.length; i++) {
      const O = list[i]; if (O === B) continue;
      if (B.bb[2] < O.bb[0] || B.bb[0] > O.bb[2] || B.bb[3] < O.bb[1] || B.bb[1] > O.bb[3]) continue;     // nie zachodzą na siebie na ekranie
      const c = cmpRect(B.rect, O.rect || { x0: O.x, x1: O.x, y0: O.y, y1: O.y });
      if (c < 0 && i < ib) { list.splice(i, 1); list.splice(ib, 0, O); ib--; i--; }                    // B jest „za" O, a rysowane wcześniej O → przenieś O za B
      else if (c > 0 && i > ib) { list.splice(i, 1); list.splice(ib, 0, O); ib++; }                    // B jest „przed" O → O ma być przed B
    }
  }
}
