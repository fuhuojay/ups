import crypto from "node:crypto";

const rawPhone = process.argv[2] || "";
let phone = rawPhone.replace(/\D/g, "");

if (phone.length === 13 && phone.startsWith("86")) {
  phone = phone.slice(2);
}

if (!phone) {
  console.error("Usage: node tools/hash-phone.mjs <phone-number>");
  process.exit(1);
}

console.log(crypto.createHash("sha256").update(phone).digest("hex"));
