/* ============================================================
   零依赖本地静态服务器 —— 服务本文件夹下的 dist/
   用法：node server.js   （或直接双击 启动.bat）
   无需 npm install，Node 自带模块即可运行。
   端口被占用时会自动换下一个（8080 → 8100）。
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const HOST = '127.0.0.1';   // 想让同一 Wi-Fi 的手机也能看：改成 '0.0.0.0'
const PORT_START = 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.hdr': 'application/octet-stream',
  '.wasm': 'application/wasm',
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

function handler(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    return send(res, 400, 'Bad Request', 'text/plain; charset=utf-8');
  }
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  const filePath = path.normalize(path.join(DIST, urlPath));
  if (filePath !== DIST && !filePath.startsWith(DIST + path.sep)) {
    return send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, '404 Not Found: ' + urlPath, 'text/plain; charset=utf-8');
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    send(res, 200, data, type);
  });
}

function startServer(port) {
  const server = http.createServer(handler);
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('  Port ' + port + ' busy, trying ' + (port + 1) + ' ...');
      startServer(port + 1);
    } else {
      console.error(e);
      process.exit(1);
    }
  });
  server.listen(port, HOST, () => {
    const url = 'http://localhost:' + port + '/';
    console.log('');
    console.log('  ============================================');
    console.log('   中国工业博物馆数字展馆 · 本地预览');
    console.log('  ============================================');
    console.log('');
    console.log('   首页：  ' + url);
    console.log('   展厅：  ' + url + '#/hall');
    console.log('');
    console.log('   停止：关闭本窗口，或按 Ctrl + C');
    console.log('');
    console.log('  ============================================');
    if (!process.env.NO_OPEN) {
      setTimeout(() => {
        try {
          if (process.platform === 'win32') {
            spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore' }).unref();
          } else if (process.platform === 'darwin') {
            spawn('open', [url], { stdio: 'ignore' }).unref();
          } else {
            spawn('xdg-open', [url], { stdio: 'ignore' }).unref();
          }
        } catch (e) { /* 打不开浏览器就手动复制地址 */ }
      }, 600);
    }
  });
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('[ERROR] dist/index.html 不存在 —— 请确认 dist/ 文件夹和本脚本在同一目录。');
  process.exit(1);
}

startServer(PORT_START);
