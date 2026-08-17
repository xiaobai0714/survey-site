'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456789';
const SESSION_TTL = 1000 * 60 * 60 * 24; // 24h

// ---- storage ----
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}
ensureStore();

function readSubmissions() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}
function writeSubmissions(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
}

// ---- sessions (in-memory) ----
const SESSIONS = new Map(); // token -> { username, expires }

function isAuthed(req) {
  const token = parseCookies(req)['admin_token'];
  if (!token) return false;
  const s = SESSIONS.get(token);
  if (!s) return false;
  if (s.expires < Date.now()) {
    SESSIONS.delete(token);
    return false;
  }
  return true;
}

// ---- helpers ----
function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((c) => {
    const idx = c.indexOf('=');
    if (idx > -1) {
      const k = c.slice(0, idx).trim();
      const v = c.slice(idx + 1).trim();
      if (k) out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

function setCookie(res, name, value, maxAge) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'HttpOnly', 'Path=/', 'SameSite=Lax'];
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}
function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${name}=; HttpOnly; Path=/; Max-Age=0`);
}
function sendJSON(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy(); // 1MB limit
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};

function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

// ---- server ----
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  try {
    // 提交意见（匿名，无需登录，全部选填）
    if (pathname === '/api/submit' && method === 'POST') {
      const body = await readBody(req);
      let data;
      try {
        data = JSON.parse(body || '{}');
      } catch (e) {
        return sendJSON(res, 400, { error: '数据格式错误' });
      }
      // 匿名收集：仅保存意见文本，无任何必填项
      const opinion = data.opinion ? String(data.opinion).slice(0, 2000) : '';
      const list = readSubmissions();
      const entry = {
        id: crypto.randomUUID(),
        opinion,
        submittedAt: new Date().toISOString()
      };
      list.push(entry);
      writeSubmissions(list);
      return sendJSON(res, 200, { ok: true });
    }

    // 管理员登录
    if (pathname === '/api/login' && method === 'POST') {
      const body = await readBody(req);
      let data;
      try {
        data = JSON.parse(body || '{}');
      } catch (e) {
        return sendJSON(res, 400, { error: '数据格式错误' });
      }
      if (data.username === ADMIN_USER && data.password === ADMIN_PASS) {
        const token = crypto.randomBytes(24).toString('hex');
        SESSIONS.set(token, { username: ADMIN_USER, expires: Date.now() + SESSION_TTL });
        setCookie(res, 'admin_token', token, SESSION_TTL / 1000);
        return sendJSON(res, 200, { ok: true });
      }
      return sendJSON(res, 401, { error: '账号或密码错误' });
    }

    // 当前登录状态
    if (pathname === '/api/me' && method === 'GET') {
      return sendJSON(res, 200, { authed: isAuthed(req) });
    }

    // 获取所有问卷（需登录）
    if (pathname === '/api/submissions' && method === 'GET') {
      if (!isAuthed(req)) return sendJSON(res, 401, { error: '未登录' });
      return sendJSON(res, 200, { items: readSubmissions() });
    }

    // 退出登录
    if (pathname === '/api/logout' && method === 'POST') {
      const token = parseCookies(req)['admin_token'];
      if (token) SESSIONS.delete(token);
      clearCookie(res, 'admin_token');
      return sendJSON(res, 200, { ok: true });
    }

    // 静态文件
    let filePath;
    if (pathname === '/') filePath = path.join(PUBLIC, 'index.html');
    else filePath = path.join(PUBLIC, pathname);
    if (!filePath.startsWith(PUBLIC)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    serveStatic(res, filePath);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJSON(res, 500, { error: '服务器内部错误' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 问卷网站已启动: http://0.0.0.0:${PORT}`);
});
