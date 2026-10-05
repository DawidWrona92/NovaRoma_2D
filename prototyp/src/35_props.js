/* ====================== REKWIZYTY 1×1: stóg, drewno ====================== */
BAKED.hay = function () {
  const sc = new Scene(130, 120, 65, 96, { F: 1.5, wear: 0 });
  sc.shadow([[-0.2, -0.2, 0], [0.2, -0.2, 0], [0.2, 0.2, 0], [-0.2, 0.2, 0], [0, 0, 0.5]], { alpha: 0.42, blur: 6 });
  sc.contact(-0.17, -0.17, 0.17, 0.17, { alpha: 0.4 });
  haystack(sc, 0, 0);
  const o = sc.finish({ grain: 0.4 }); o.fw = 1; o.fh = 1; return o;
};
BAKED.logs = function () {
  const sc = new Scene(130, 110, 65, 84, { F: 1.5, wear: 0 });
  sc.shadowBox(-0.2, -0.08, 0.2, 0.08, 0.16, { alpha: 0.4, blur: 5 });
  sc.contact(-0.2, -0.08, 0.2, 0.08, { alpha: 0.4 });
  logPile(sc, 0, 0);
  const o = sc.finish({ grain: 0.4 }); o.fw = 1; o.fh = 1; return o;
};
