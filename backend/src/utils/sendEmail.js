const nodemailer = require('nodemailer');

let transporter;
const getTransporter = () => {
  if (!process.env.MAIL_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      auth: process.env.MAIL_USER ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined,
    });
  }
  return transporter;
};

module.exports = async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`\n[email:dev] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM, to, subject, html, text });
  } catch (err) {
    console.error('Email failed:', err.message);
  }
};
