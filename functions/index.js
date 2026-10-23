const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

initializeApp();
const db = getFirestore();

const SMTP_HOST = defineSecret("SMTP_HOST");
const SMTP_PORT = defineSecret("SMTP_PORT");
const SMTP_USER = defineSecret("SMTP_USER");
const SMTP_PASS = defineSecret("SMTP_PASS");
const EMAIL_FROM = defineSecret("EMAIL_FROM");
const BAKERY_EMAIL = "msohaib1845@gmail.com";

const secrets = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM];
const money = n => `Rs. ${Math.round(Number(n || 0)).toLocaleString("en-PK")}`;
const safe = v => String(v || "").replace(/[<>&"]/g, ch => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;" }[ch]));
function orderSummary(o, id) {
  const items = (o.items || []).map(i =>
    `• ${i.name} — ${i.size} × ${i.qty}\n  Toppings: ${(i.toppings || []).join(", ") || "None"}\n  Cake message: ${i.message || "None"}\n  Instructions: ${i.instructions || "None"}\n  Line total: ${money(i.lineTotal)}`
  ).join("\n");
  return `SWEET CAKES — NEW ORDER\nOrder ID: ${id}\nCustomer: ${o.customerName}\nEmail: ${o.customerEmail}\nPhone: ${o.customerPhone}\nAddress: ${o.deliveryAddress}\nPreferred date: ${o.preferredDate || "Not specified"}\nPayment: ${o.paymentMethod}\n\n${items}\n\nTOTAL: ${money(o.total)}\nStatus: ${o.status || "pending"}`;
}
async function sendEmail(to, subject, textBody, htmlBody) {
  const port = Number(SMTP_PORT.value() || 465);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST.value(), port, secure: port === 465,
    auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() }
  });
  await transporter.sendMail({ from: EMAIL_FROM.value(), to, subject, text: textBody, html: htmlBody });
}
exports.onOrderCreated = onDocumentCreated({ document: "orders/{orderId}", secrets }, async event => {
  const snap = event.data;
  if (!snap) return;
  const o = snap.data();
  const id = event.params.orderId;
  const summary = orderSummary(o, id);
  const tasks = [];
  // Email the full order details to the bakery and send confirmation to the customer.
  const customerText = `Hi ${o.customerName}, thank you for ordering from Sweet Cakes!\n\nWe have received your order ${id} for ${money(o.total)}.\nWe will contact you if we need to confirm any details.\n\nOrder status: Pending\nSweet Cakes`;
  const customerHtml = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#34232b"><h2 style="color:#6f2846">Thank you for your order!</h2><p>Hi ${safe(o.customerName)}, we have received your Sweet Cakes order.</p><p><b>Order reference:</b> ${safe(id)}<br><b>Total:</b> ${money(o.total)}<br><b>Status:</b> Pending</p><pre style="white-space:pre-wrap;background:#fff4f5;padding:14px;border-radius:6px">${safe(summary)}</pre><p>We will email you when your cake is ready.</p><p>Sweet Cakes ♡</p></div>`;
  tasks.push(sendEmail(o.customerEmail, `Sweet Cakes order received — ${id}`, customerText, customerHtml));
  tasks.push(sendEmail(BAKERY_EMAIL, `New Sweet Cakes order — ${id}`, summary, `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${safe(summary)}</pre>`));
  const results = await Promise.allSettled(tasks);
  const failures = results.filter(r => r.status === "rejected");
  if (failures.length) {
    console.error(`Order ${id}: ${failures.length} notification(s) failed`, failures.map(f => String(f.reason)));
    await snap.ref.update({ notificationWarning: `${failures.length} notification(s) failed` });
  } else {
    await snap.ref.update({ notificationsSentAt: new Date().toISOString() });
  }
});
exports.onOrderReady = onDocumentUpdated({ document: "orders/{orderId}", secrets }, async event => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!before || !after || before.status === after.status || after.status !== "ready") return;
  const id = event.params.orderId;
  const body = `Hi ${after.customerName}, great news! Your Sweet Cakes order ${id} is ready.\n\nOrder total: ${money(after.total)}\nPlease contact the bakery if you need to coordinate collection or delivery.\n\nThank you for choosing Sweet Cakes!`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#34232b"><h2 style="color:#6f2846">Your cake is ready! ♡</h2><p>Hi ${safe(after.customerName)}, your Sweet Cakes order is ready.</p><p><b>Order reference:</b> ${safe(id)}<br><b>Total:</b> ${money(after.total)}</p><p>Please contact the bakery to coordinate collection or delivery.</p><p>Thank you for choosing Sweet Cakes!</p></div>`;
  await sendEmail(after.customerEmail, `Your Sweet Cakes order is ready — ${id}`, body, html);
});
