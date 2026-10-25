const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const asyncHandler = require('../utils/asyncHandler');
const { monthlyReport } = require('../services/report.service');

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fileStem = (r) => `report-${r.year}-${String(r.month).padStart(2, '0')}`;

exports.monthly = asyncHandler(async (req, res) => {
  const report = await monthlyReport(req.user._id, req.query.month, req.query.year);
  res.json({ success: true, ...report });
});

exports.excel = asyncHandler(async (req, res) => {
  const r = await monthlyReport(req.user._id, req.query.month, req.query.year);
  const wb = new ExcelJS.Workbook();

  const summary = wb.addWorksheet('Summary');
  summary.columns = [{ width: 24 }, { width: 18 }];
  summary.addRows([
    [`${MONTH_NAMES[r.month - 1]} ${r.year}`],
    [],
    ['Income', r.income],
    ['Expenses', r.expense],
    ['Balance', r.balance],
    ['Savings rate (%)', r.savingRate],
    [],
    ['Category', 'Spent'],
    ...r.categories.map((c) => [c.category, c.total]),
  ]);
  summary.getRow(1).font = { bold: true, size: 14 };
  summary.getRow(8).font = { bold: true };

  const sheet = wb.addWorksheet('Transactions');
  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Category', key: 'category', width: 16 },
    { header: 'Payment', key: 'paymentMethod', width: 12 },
    { header: 'Amount', key: 'amount', width: 14, style: { numFmt: '#,##0.00' } },
    { header: 'Note', key: 'note', width: 36 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  r.transactions.forEach((t) => sheet.addRow({ ...t, date: new Date(t.date) }));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileStem(r)}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

exports.pdf = asyncHandler(async (req, res) => {
  const r = await monthlyReport(req.user._id, req.query.month, req.query.year);
  const cur = req.user.currency;
  const money = (n) => `${cur} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileStem(r)}.pdf"`);
  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(22).fillColor('#3b5bdb').text('Monthly report');
  doc.font('Helvetica').fontSize(11).fillColor('#667').text(`${MONTH_NAMES[r.month - 1]} ${r.year}  |  ${req.user.name}`);
  doc.moveDown(1.2);

  [['Income', r.income], ['Expenses', r.expense], ['Balance', r.balance]].forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(12).fillColor('#222').text(label, 48, doc.y, { continued: true, width: 200 });
    doc.font('Helvetica-Bold').text(money(value), { align: 'right' });
  });
  doc.font('Helvetica').fillColor('#222').text(`Savings rate: ${r.savingRate}%`);

  doc.moveDown(1.2).font('Helvetica-Bold').fontSize(14).text('Spending by category');
  doc.moveDown(0.4).font('Helvetica').fontSize(11);
  if (!r.categories.length) doc.fillColor('#667').text('No expenses this month.');
  r.categories.forEach((c) => doc.fillColor('#222').text(`${c.category}: ${money(c.total)} (${c.percent}%)`));

  doc.moveDown(1.2).font('Helvetica-Bold').fontSize(14).fillColor('#222').text('Transactions');
  doc.moveDown(0.4).font('Helvetica').fontSize(10);
  r.transactions.slice(0, 300).forEach((t) => {
    if (doc.y > 770) doc.addPage();
    const sign = t.type === 'income' ? '+' : '-';
    doc.fillColor(t.type === 'income' ? '#0b7285' : '#c92a2a').text(
      `${new Date(t.date).toISOString().slice(0, 10)}   ${t.title.slice(0, 40)}   [${t.category}]   ${sign}${money(t.amount)}`
    );
  });
  doc.end();
});
