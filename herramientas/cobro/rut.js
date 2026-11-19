// Lector del RUT de la DIAN (formulario 001) a partir del texto que entrega pdf.js.
// Todo se procesa en el navegador: el PDF nunca sale del dispositivo.
// items: [{str, x, y}] de la pagina 1 (y crece hacia arriba, coordenadas PDF).

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function findLabel(items, prefix) {
  const p = norm(prefix);
  return items.find((it) => norm(it.str).startsWith(p));
}

// Valores debajo de una etiqueta: franja de y justo bajo la etiqueta, x entre la etiqueta y xMax.
function below(items, label, xMax, opts = {}) {
  if (!label) return [];
  const { dyMin = 3, dyMax = 16, xMin = label.x - 3 } = opts;
  return items
    .filter((it) => it !== label && it.y < label.y - dyMin && it.y > label.y - dyMax && it.x >= xMin && it.x < xMax)
    .sort((a, b) => a.x - b.x);
}

// Valores en la misma linea de la etiqueta (a la derecha).
function sameLine(items, label, xMax) {
  if (!label) return [];
  return items
    .filter((it) => it !== label && Math.abs(it.y - label.y) < 4 && it.x > label.x + 5 && it.x < xMax && !/^\d+\.\s/.test(it.str))
    .sort((a, b) => a.x - b.x);
}

const joinWords = (arr) => arr.map((i) => i.str.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
const joinDigits = (arr) => arr.map((i) => i.str.replace(/\s/g, '')).join('');
const onlyText = (arr) => arr.filter((i) => !/^[\d\s]+$/.test(i.str));

export function formatNit(nit, dv) {
  if (!nit) return '';
  const n = nit.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dv ? `${n}-${dv}` : n;
}

const titleCase = (s) =>
  s.toLowerCase().replace(/(^|[\s\-/(])([a-záéíóúñü])/g, (m, a, b) => a + b.toUpperCase());

export function parseRut(items) {
  const L = (p) => findLabel(items, p);
  const out = {};

  // NIT y DV
  const lNit = L('5. Número de Identificación Tributaria');
  const lDv = L('6. DV');
  const lSec = L('12. Dirección seccional');
  if (lNit && lDv) {
    out.nit = joinDigits(below(items, lNit, lDv.x - 1).filter((i) => /^\d+$/.test(i.str.replace(/\s/g, ''))));
    out.dv = joinDigits(below(items, lDv, lSec ? lSec.x : lDv.x + 40, { xMin: lDv.x - 3 }).filter((i) => /^\d$/.test(i.str.trim())));
  }

  // Persona juridica: razon social. Persona natural: apellidos y nombres.
  const lRazon = L('35. Razón social');
  const razon = lRazon ? joinWords(below(items, lRazon, 10000, { dyMax: 14 })) : '';
  const l31 = L('31. Primer apellido'), l32 = L('32. Segundo apellido'), l33 = L('33. Primer nombre'), l34 = L('34. Otros nombres');
  let natural = '';
  if (l31 && l32 && l33 && l34) {
    const parts = [
      joinWords(below(items, l33, l34.x)),
      joinWords(below(items, l34, 10000)),
      joinWords(below(items, l31, l32.x)),
      joinWords(below(items, l32, l33.x)),
    ].filter(Boolean);
    natural = parts.join(' ');
  }
  out.nombre = razon || natural;
  out.tipo = razon ? 'juridica' : natural ? 'natural' : '';

  const l36 = L('36. Nombre comercial'), l37 = L('37. Sigla');
  if (l36 && l37) {
    out.nombreComercial = joinWords(below(items, l36, l37.x)) || joinWords(below(items, l37, 10000));
  }

  // Ubicacion
  const l38 = L('38. País'), l39 = L('39. Departamento'), l40 = L('40. Ciudad');
  if (l39 && l40) {
    out.pais = l38 ? joinWords(onlyText(below(items, l38, l39.x))) : '';
    out.departamento = joinWords(onlyText(below(items, l39, l40.x)));
    out.ciudad = joinWords(onlyText(below(items, l40, 10000)));
  }
  const l41 = L('41. Dirección principal');
  if (l41) out.direccion = joinWords(below(items, l41, 10000));

  // Correo: cualquier texto con forma de correo (en el RUT queda en la misma linea de la etiqueta)
  const mail = items.find((it) => /[\w.+-]+@[\w-]+\.[\w.]+/.test(it.str));
  out.correo = mail ? mail.str.match(/[\w.+-]+@[\w-]+\.[\w.]+/)[0].toLowerCase() : '';

  const l44 = L('44. Teléfono 1'), l45 = L('45. Teléfono 2');
  const phone = (arr) => joinDigits(arr.filter((i) => /^[\d\s]+$/.test(i.str))).replace(/^(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3');
  out.telefonos = [l44 && l45 ? phone(sameLine(items, l44, l45.x)) : '', l45 ? phone(sameLine(items, l45, 10000)) : '']
    .filter(Boolean)
    .join(' / ');

  // Presentacion amable
  out.ciudadTexto = [out.ciudad, out.departamento].filter(Boolean).map(titleCase).join(', ') +
    (out.pais && norm(out.pais) !== 'colombia' ? ` — ${titleCase(out.pais)}` : out.ciudad ? ' — Colombia' : '');
  out.direccionTexto = prettyAddress(out.direccion || '');
  out.nitTexto = formatNit(out.nit, out.dv);
  return out;
}

// "CR 58 64 10" -> "Cra. 58 # 64 - 10" (solo si tiene la forma tipica de la DIAN)
export function prettyAddress(a) {
  const tipos = { CR: 'Cra.', KR: 'Cra.', CL: 'Cl.', CLL: 'Cl.', AV: 'Av.', AK: 'Av. Cra.', AC: 'Av. Cl.', TV: 'Tv.', DG: 'Dg.', CQ: 'Cir.' };
  const m = a.trim().match(/^([A-Z]{2,3})\s+(\S+(?:\s+[A-Z])?(?:\s+(?:SUR|ESTE|BIS))?)\s+(\d+\s?[A-Z]?)\s+(\d+.*)$/i);
  if (!m || !tipos[m[1].toUpperCase()]) return a;
  return `${tipos[m[1].toUpperCase()]} ${m[2]} # ${m[3]} - ${m[4]}`;
}
