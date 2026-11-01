// Shared helpers for building the .docx files with docx-js
const fs = require('fs');
const D = require('docx');
const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType,
        ImageRun, HeadingLevel, LevelFormat, PageBreak, Footer, PageNumber } = D;

// mini-markup: **bold**, *italic*, _{sub}, ^{sup}, `code`
function parse(text, base = {}) {
  const parts = String(text).split(/(\*\*.+?\*\*|\*[^*]+?\*|_\{.*?\}|\^\{.*?\}|`.+?`)/g).filter(s => s !== '');
  const out = [];
  for (const p of parts) {
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) out.push(...parse(p.slice(2, -2), { ...base, bold: true }));
    else if (p.startsWith('*') && p.endsWith('*') && p.length > 2) out.push(...parse(p.slice(1, -1), { ...base, italics: true }));
    else if (p.startsWith('_{')) out.push(new TextRun({ ...base, text: p.slice(2, -1), subScript: true }));
    else if (p.startsWith('^{')) out.push(new TextRun({ ...base, text: p.slice(2, -1), superScript: true }));
    else if (p.startsWith('`') && p.length > 2) out.push(new TextRun({ ...base, text: p.slice(1, -1), font: 'Courier New', size: Math.max((base.size || 20) - 2, 14) }));
    else out.push(new TextRun({ ...base, text: p }));
  }
  return out;
}

function img(path, wpx, hpx) {
  return new ImageRun({ type: 'png', data: fs.readFileSync(path), transformation: { width: wpx, height: hpx },
    altText: { title: path, description: path, name: path } });
}

function cell(text, w, o = {}) {
  const base = { font: o.font, size: o.size, bold: o.bold };
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: o.fill ? { fill: o.fill, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: o.mt ?? 30, bottom: o.mt ?? 30, left: o.ml ?? 60, right: o.ml ?? 60 },
    borders: o.borders,
    verticalAlign: 'center',
    children: String(text).split('\n').map(line => new Paragraph({
      alignment: o.align || AlignmentType.LEFT, spacing: { before: 0, after: 0 },
      children: parse(line, base) })),
  });
}

// generic table: rows = array of arrays of strings, widths in DXA
function table(rows, widths, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const line = { style: BorderStyle.SINGLE, size: 4, color: o.borderColor || '808080' };
  const borders = o.plain ? { top: line, bottom: line, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } }
                          : { top: line, bottom: line, left: line, right: line };
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({ tableHeader: i === 0 && !o.noHeader,
      cantSplit: true,
      children: r.map((c, j) => cell(c, widths[j], { size: o.size, font: o.font, borders,
        bold: i === 0 && !o.noHeader, fill: i === 0 && !o.noHeader ? (o.headFill || 'E8E8E8') : (o.rowFill && o.rowFill(i, j)) || undefined,
        align: (j === 0 || (o.leftCols && o.leftCols.includes(j))) ? AlignmentType.LEFT : (o.align || AlignmentType.CENTER) })) })),
  });
}

module.exports = { D, parse, img, cell, table };
