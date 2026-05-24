import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const authFile = path.join(rootDir, "authorized-phones.js");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 8010);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function normalizePhone(rawPhone) {
  let phone = String(rawPhone || "").replace(/\D/g, "");
  if (phone.length === 13 && phone.startsWith("86")) phone = phone.slice(2);
  return phone;
}

function hashPhone(phone) {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function addPhone(rawPhone) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, message: "请输入手机号。" };

  const hash = hashPhone(phone);
  const content = fs.readFileSync(authFile, "utf8");

  if (content.includes(hash)) {
    return { ok: true, added: false, phone, hash };
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
    return { ok: false, message: "无法更新 authorized-phones.js。" };
  }

  fs.writeFileSync(authFile, updated);
  return { ok: true, added: true, phone, hash };
}

function serveFile(req, res) {
  const rawUrl = new URL(req.url, `http://${req.headers.host}`);
  const requested = rawUrl.pathname === "/" ? "/admin.html" : decodeURIComponent(rawUrl.pathname);
  const filePath = path.resolve(rootDir, `.${requested}`);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/add-phone") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const result = addPhone(payload.phone);
      json(res, result.ok ? 200 : 400, result);
    } catch (error) {
      json(res, 500, { ok: false, message: error.message || "服务错误。" });
    }
    return;
  }

  if (req.method === "GET") {
    serveFile(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(port, host, () => {
  const url = `http://localhost:${port}/admin.html`;
  console.log(`授权管理已启动：${url}`);
  console.log("按 Ctrl+C 停止服务。");
  execFile("open", [url], () => {});
});
