import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rawPhone = process.argv[2] || "";
let phone = rawPhone.replace(/\D/g, "");

if (phone.length === 13 && phone.startsWith("86")) {
  phone = phone.slice(2);
}

if (!phone) {
  console.error("Usage: node tools/add-phone.mjs <phone-number>");
  process.exit(1);
}

const hash = crypto.createHash("sha256").update(phone).digest("hex");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.resolve(__dirname, "../authorized-phones.js");
const content = fs.readFileSync(authFile, "utf8");

if (content.includes(hash)) {
  console.log(`Already authorized: ${phone}`);
  console.log(hash);
  process.exit(0);
}

const updated = content.replace(
  /window\.AUTHORIZED_PHONE_HASHES\s*=\s*\[\s*([\s\S]*?)\s*\];/,
  (match, existing) => {
    const trimmed = existing.trim();
    const nextLine = `  "${hash}"`;
    return `window.AUTHORIZED_PHONE_HASHES = [\n${trimmed ? `${trimmed.replace(/,\s*$/, "")},\n${nextLine}` : nextLine}\n];`;
  }
);

if (updated === content) {
  console.error("Could not update authorized-phones.js");
  process.exit(1);
}

fs.writeFileSync(authFile, updated);
console.log(`Authorized phone added: ${phone}`);
console.log(hash);
