// Generador del PDF de la cuenta de cobro (formato Cipresco). Sin datos personales:
// el beneficiario, la cuenta bancaria y la firma llegan desde la configuracion local.

// ---------- Numeros a letras (pesos colombianos) ----------
const U = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
  'VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
const D = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const C = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function menorMil(n) {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100), r = n % 100;
  let s = C[c];
  if (r) {
    const dec = r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' Y ' + U[r % 10] : '');
    s = (s ? s + ' ' : '') + dec;
  }
  return s;
}

function menorMillon(n) {
  const miles = Math.floor(n / 1000), r = n % 1000;
  const partes = [];
  if (miles === 1) partes.push('MIL');
  else if (miles > 1) partes.push(menorMil(miles) + ' MIL');
  if (r) partes.push(menorMil(r));
  return partes.join(' ');
}

export function numeroALetras(valor) {
  const n = Math.round(Math.abs(Number(valor) || 0));
  if (n === 0) return 'CERO PESOS';
  const millones = Math.floor(n / 1e6), r = n % 1e6;
  const partes = [];
  if (millones === 1) partes.push('UN MILLÓN');
  else if (millones > 1) partes.push(menorMillon(millones) + ' MILLONES');
  if (r) partes.push(menorMillon(r));
  return partes.join(' ') + (millones && !r ? ' DE PESOS' : ' PESOS');
}

export const formatCOP = (v) => '$' + Math.round(Number(v) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export function fechaLarga(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

export const pad2 = (n) => String(n).padStart(2, '0');

// ---------- PDF ----------
const NAVY = [31, 42, 60], BROWN = [160, 88, 29], GRAY = [90, 98, 110], LINE = [221, 227, 234],
  CREAM = [250, 246, 240], CREAM_B = [232, 222, 206], SOFT = [245, 247, 250], TEXT = [40, 44, 52];

/**
 * data: { numero, ciudadFecha, fechaISO, cliente:{nombre,nombreComercial,nitTexto,direccionTexto,ciudadTexto,correo,telefonos},
 *         items:[{descripcion,cantidad,valorUnitario}] }
 * cfg:  { empresa:{telefonos,regimen,web,ciudad}, perfil:{nombre,cc,celular,ubicacion,actividad,banco,tipoCuenta,numeroCuenta,firma} }
 */
export function buildPdf(jsPDF, data, cfg, logoDataUrl) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = 18, R = 192, W = R - L;
  const p = cfg.perfil, e = cfg.empresa;
  const num = pad2(data.numero);
  const fill = (c) => doc.setFillColor(...c), draw = (c) => doc.setDrawColor(...c), color = (c) => doc.setTextColor(...c);
  const font = (style, size) => { doc.setFont('helvetica', style); doc.setFontSize(size); };

  // Encabezado
  if (logoDataUrl) doc.addImage(logoDataUrl, 'JPEG', L, 12, 17, 19.7);
  color(NAVY); font('bold', 20); doc.text('CIPRESCO', 40, 21);
  color(BROWN); font('bold', 8.5); doc.text('DISEÑO Y PRODUCCIÓN — TODO EN MADERA', 40, 27);
  color(GRAY); font('normal', 8.5); doc.text('Servicio CNC Profesional | Caldas, Antioquia — Colombia', 40, 32);
  const right = (label, value, y) => {
    font('normal', 8.5); color(GRAY); const w = doc.getTextWidth(value);
    doc.text(value, R, y, { align: 'right' });
    font('bold', 8.5); color(TEXT); doc.text(label + ' ', R - w, y, { align: 'right' });
  };
  right('Web:', e.web || 'ciprescocnc.com', 17);
  if (e.telefonos) right('Teléfonos:', e.telefonos, 22);
  if (e.regimen) right('Régimen:', e.regimen, 27);
  draw(BROWN); doc.setLineWidth(0.6); doc.line(L, 37, R, 37);

  // Titulo
  let y = 42;
  fill(CREAM); draw(CREAM_B); doc.setLineWidth(0.2); doc.rect(L, y, W, 12, 'FD');
  fill(BROWN); doc.rect(L, y, 1.4, 12, 'F');
  color(NAVY); font('bold', 14); doc.text(`CUENTA DE COBRO N° ${num}`, L + 6, y + 8.2);
  color(GRAY); font('bold', 9); doc.text(data.ciudadFecha, R - 5, y + 7.8, { align: 'right' });

  // Cliente / Beneficiario
  y = 60;
  const colW = W / 2, pad = 4;
  fill(NAVY); doc.rect(L, y, W, 8, 'F');
  doc.setTextColor(255, 255, 255); font('bold', 9);
  doc.text('CLIENTE (DEUDOR)', L + pad, y + 5.4);
  doc.text('DEBE A (BENEFICIARIO)', L + colW + pad, y + 5.4);

  const lh = 4.6;
  const block = (x, yy, maxW, nombre, rows, dry) => {
    font('bold', 10); color(NAVY);
    const nl = doc.splitTextToSize(nombre || '', maxW);
    if (!dry) doc.text(nl, x, yy + 4); yy += nl.length * 5 + 1.5;
    for (const [lab, val] of rows) {
      if (!val) continue;
      font('bold', 9); const lw = doc.getTextWidth(lab + ' ');
      font('normal', 9);
      const first = doc.splitTextToSize(val, maxW - lw);
      // primera linea al lado de la etiqueta, el resto a todo el ancho
      const rest = first.length > 1 ? doc.splitTextToSize(first.slice(1).join(' '), maxW) : [];
      if (!dry) {
        font('bold', 9); color(TEXT); doc.text(lab, x, yy + 4);
        font('normal', 9); color(GRAY); doc.text(first[0], x + lw, yy + 4);
        if (rest.length) doc.text(rest, x, yy + 4 + lh);
      }
      yy += lh * (1 + rest.length) + 0.4;
    }
    return yy;
  };
  const c = data.cliente;
  const cliRows = [['Nombre Comercial:', c.nombreComercial], ['NIT:', c.nitTexto], ['Dirección:', c.direccionTexto],
    ['Ciudad:', c.ciudadTexto], ['Correo:', c.correo], ['Teléfonos:', c.telefonos]];
  const benRows = [['C.C.:', p.cc], ['Celular:', p.celular], ['Ubicación:', p.ubicacion], ['Actividad:', p.actividad]];
  const bodyTop = y + 8 + 2;
  const h1 = block(L + pad, bodyTop, colW - 2 * pad, c.nombre, cliRows, true);
  const h2 = block(L + colW + pad, bodyTop, colW - 2 * pad, (p.nombre || '').toUpperCase(), benRows, true);
  const bodyBottom = Math.max(h1, h2) + 3;
  draw(LINE); doc.setLineWidth(0.3); doc.rect(L, y + 8, W, bodyBottom - (y + 8)); doc.line(L + colW, y + 8, L + colW, bodyBottom);
  block(L + pad, bodyTop, colW - 2 * pad, c.nombre, cliRows, false);
  block(L + colW + pad, bodyTop, colW - 2 * pad, (p.nombre || '').toUpperCase(), benRows, false);

  // Valor total en letras
  const total = data.items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.valorUnitario) || 0), 0);
  y = bodyBottom + 6;
  font('bold', 10);
  const letras = doc.splitTextToSize(`${numeroALetras(total)} M/CTE (${formatCOP(total)} COP)`, W - 10);
  const vh = 9 + letras.length * 4.8;
  fill(SOFT); draw(LINE); doc.rect(L, y, W, vh, 'FD'); fill(NAVY); doc.rect(L, y, 1.4, vh, 'F');
  color(BROWN); font('bold', 8); doc.text('VALOR TOTAL A PAGAR', L + 6, y + 5.5);
  color(NAVY); font('bold', 10); doc.text(letras, L + 6, y + 10.8);
  y += vh + 6;

  color(NAVY); font('bold', 9.5); doc.text('DETALLE DEL CONCEPTO', L, y);
  draw(LINE); doc.line(L, y + 2, R, y + 2);
  y += 5;

  // Tabla
  const cols = [14, 82, 18, 30, 30]; // = 174
  const xs = cols.reduce((a, w, i) => (a.push(a[i] + w), a), [L]);
  fill(NAVY); doc.rect(L, y, W, 11, 'F');
  doc.setTextColor(255, 255, 255); font('bold', 8.5);
  doc.text('ÍTEM', xs[0] + 3, y + 6.8);
  doc.text('DESCRIPCIÓN DEL SERVICIO', xs[1] + 3, y + 6.8);
  doc.text('CANT.', xs[2] + cols[2] / 2, y + 6.8, { align: 'center' });
  doc.text(['VR.', 'UNITARIO'], xs[3] + cols[3] / 2, y + 4.6, { align: 'center' });
  doc.text('VR. TOTAL', xs[4] + cols[4] / 2, y + 6.8, { align: 'center' });
  y += 11;
  font('normal', 9);
  data.items.forEach((it, i) => {
    const lines = doc.splitTextToSize(it.descripcion || '', cols[1] - 6);
    const rh = Math.max(12, lines.length * 4.4 + 6);
    draw(LINE); doc.setLineWidth(0.3);
    for (let k = 0; k < cols.length; k++) doc.rect(xs[k], y, cols[k], rh);
    const mid = y + rh / 2 + 1.2;
    color(TEXT); font('normal', 9);
    doc.text(String(i + 1), xs[0] + cols[0] / 2, mid, { align: 'center' });
    doc.text(lines, xs[1] + 3, y + (rh - lines.length * 4.4) / 2 + 3.2);
    doc.text(String(it.cantidad), xs[2] + cols[2] / 2, mid, { align: 'center' });
    doc.text(formatCOP(it.valorUnitario), xs[3] + cols[3] - 3, mid, { align: 'right' });
    doc.text(formatCOP((Number(it.cantidad) || 0) * (Number(it.valorUnitario) || 0)), xs[4] + cols[4] - 3, mid, { align: 'right' });
    y += rh;
  });
  draw(BROWN); doc.setLineWidth(0.6); doc.line(L, y, R, y);
  fill(SOFT); draw(LINE); doc.setLineWidth(0.3);
  doc.rect(L, y, W - cols[4], 11, 'FD'); doc.rect(xs[4], y, cols[4], 11, 'FD');
  color(NAVY); font('bold', 10);
  doc.text('TOTAL A PAGAR:', xs[4] - 4, y + 7, { align: 'right' });
  doc.text(formatCOP(total), R - 3, y + 7, { align: 'right' });
  y += 11 + 7;

  // Informacion de pago
  if (p.numeroCuenta) {
    const partes = [
      [`Cuenta de ${p.tipoCuenta || 'Ahorros'}${p.banco ? ' ' + p.banco : ''} N°:`, p.numeroCuenta],
      ['Titular:', p.nombre], ['C.C.:', p.cc],
    ].filter(([, v]) => v);
    fill(CREAM); draw(CREAM_B); doc.rect(L, y, W, 16, 'FD');
    color(BROWN); font('bold', 8.5); doc.text('INFORMACIÓN PARA PAGO / TRANSFERENCIA', L + 5, y + 6);
    let x = L + 5;
    partes.forEach(([lab, val], i) => {
      if (i) { color(GRAY); font('normal', 9); doc.text('|', x + 1, y + 11.8); x += 4.5; }
      font('bold', 9); color(TEXT); doc.text(lab + ' ', x, y + 11.8); x += doc.getTextWidth(lab + ' ');
      font('normal', 9); color(GRAY); doc.text(val, x, y + 11.8); x += doc.getTextWidth(val) + 1;
    });
    y += 16 + 8;
  }

  // Firma
  if (y > 240) { doc.addPage(); y = 25; }
  color(TEXT); font('normal', 9.5); doc.text('Cordialmente,', L, y);
  y += 2;
  if (p.firma) {
    try {
      const props = doc.getImageProperties(p.firma);
      const fh = 15, fw = Math.min(60, (props.width / props.height) * fh);
      doc.addImage(p.firma, props.fileType || 'PNG', L, y, fw, fh);
    } catch (_) { /* firma invalida: se deja el espacio */ }
  }
  y += 17;
  draw(TEXT); doc.setLineWidth(0.3); doc.line(L, y, L + 70, y);
  color(NAVY); font('bold', 9.5); doc.text((p.nombre || '').toUpperCase(), L, y + 5);
  color(GRAY); font('normal', 9);
  const pie = [p.cc && `C.C. ${p.cc}`, p.celular && `Cel: ${p.celular}`, 'Cipresco Diseño y Producción CNC'].filter(Boolean);
  doc.text(pie, L, y + 9.6, { lineHeightFactor: 1.35 });

  // Pie de pagina
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    draw(LINE); doc.setLineWidth(0.3); doc.line(L, 282, R, 282);
    color(GRAY); font('normal', 8);
    doc.text(`CIPRESCO — Diseño y Producción CNC | Cuenta de Cobro N° ${num}`, L, 287);
    doc.text(`Página ${i} de ${pages}`, R, 287, { align: 'right' });
  }
  return { doc, total };
}
