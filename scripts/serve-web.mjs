import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT ?? 8081);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!existsSync(resolve(root, 'index.html'))) {
  throw new Error('dist/index.html is missing. Run npm run build:web first.');
}

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const requested = resolve(root, `.${pathname}`);
  const safePath = requested === root || requested.startsWith(`${root}${sep}`);
  const assetPath =
    safePath && existsSync(requested) && statSync(requested).isFile()
      ? requested
      : resolve(root, 'index.html');

  response.statusCode = 200;
  response.setHeader(
    'Content-Type',
    contentTypes[extname(assetPath)] ?? 'application/octet-stream',
  );
  response.setHeader(
    'Cache-Control',
    assetPath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
  );
  createReadStream(assetPath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Athar web preview: http://127.0.0.1:${port}\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
