-- Semilla de tallas. Debe coincidir exactamente con TALLAS de
-- src/lib/tallas.ts: misma lista, mismos tramos, mismo orden.

insert into tallas (codigo, grupo, etiqueta, talla_eu, edad_meses_min, edad_meses_max, orden) values
  ('0-3-meses',   'meses', '0-3 meses',   '56',   0,   2,  10),
  ('3-6-meses',   'meses', '3-6 meses',   '62',   3,   5,  20),
  ('6-9-meses',   'meses', '6-9 meses',   '68',   6,   8,  30),
  ('9-12-meses',  'meses', '9-12 meses',  '74',   9,  11,  40),
  ('12-18-meses', 'meses', '12-18 meses', '80',  12,  17,  50),
  ('18-24-meses', 'meses', '18-24 meses', '86',  18,  23,  60),
  ('2-anos',      'anios', '2 años',      '92',  24,  35,  70),
  ('3-anos',      'anios', '3 años',      '98',  36,  47,  80),
  ('4-anos',      'anios', '4 años',      '104', 48,  59,  90),
  ('5-anos',      'anios', '5 años',      '110', 60,  71, 100),
  ('6-anos',      'anios', '6 años',      '116', 72,  83, 110),
  ('7-anos',      'anios', '7 años',      '122', 84,  95, 120),
  ('8-anos',      'anios', '8 años',      '128', 96, 107, 130),
  ('9-anos',      'anios', '9 años',      '134', 108, 119, 140),
  ('10-anos',     'anios', '10 años',     '140', 120, 131, 150),
  ('11-anos',     'anios', '11 años',     '146', 132, 143, 160),
  ('12-anos',     'anios', '12 años',     '152', 144, 155, 170),
  ('13-anos',     'anios', '13 años',     '158', 156, 167, 180),
  ('14-anos',     'anios', '14 años',     '164', 168, 179, 190)
on conflict (codigo) do update set
  grupo          = excluded.grupo,
  etiqueta       = excluded.etiqueta,
  talla_eu       = excluded.talla_eu,
  edad_meses_min = excluded.edad_meses_min,
  edad_meses_max = excluded.edad_meses_max,
  orden          = excluded.orden;
