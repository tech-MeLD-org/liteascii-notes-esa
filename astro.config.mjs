// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// ─── Path Aliases Configuration ────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Shared: Astro glob-loader slug algorithm ─────────────────────────────────
// Mirrors what Astro's glob loader does to file paths when generating note.id
// e.g. "200 PC中的指令/2.4 Git/2.4.1 安装 Git.md"
//   → "200-pc中的指令/24-git/241-安装-git"
function pathToSlug(filePath) {
  return filePath
    .replace(/\.md$/i, '')           // strip .md
    .split('/')
    .map(seg =>
      seg
        .toLowerCase()
        .replace(/\./g, '')          // remove dots (2.4 → 24)
        .replace(/\s+/g, '-')        // spaces → hyphens
        .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf-]/g, '') // keep CJK, word chars, hyphens
        .replace(/-+/g, '-')         // collapse multiple hyphens
        .replace(/^-|-$/g, '')       // trim leading/trailing hyphens
    )
    .join('/');
}

// ─── Remark plugin: rewrite Obsidian internal links ──────────────────────────
// Handles two cases:
//   1. Cross-doc links: [text](../path/to/note.md#anchor)
//      → /notes/<slug>#anchor
//   2. Same-doc anchor links: [text](#heading%20text)
//      → #heading-text  (matches remark-generated heading ids)
function remarkObsidianLinks() {
  function visitLinks(node, fn) {
    if (node.type === 'link') fn(node);
    if (node.children) node.children.forEach(c => visitLinks(c, fn));
  }

  // Convert anchor text to the id remark generates for headings:
  // decode %XX, lowercase, spaces/special → hyphens
  function anchorToId(anchor) {
    let decoded;
    try { decoded = decodeURIComponent(anchor); } catch { decoded = anchor; }
    return decoded
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  return (tree, file) => {
    const filePath = file.history?.[0];
    if (!filePath) return;

    const contentDir = path.resolve('src/content');
    const fileDir = path.dirname(filePath);

    visitLinks(tree, (node) => {
      const url = node.url;
      if (!url) return;

      // ── Case 1: same-doc anchor only (#...) ──────────────────────────────
      if (url.startsWith('#')) {
        const anchor = url.slice(1);
        node.url = '#' + anchorToId(anchor);
        return;
      }

      // ── Case 2: relative .md link (may include #anchor) ──────────────────
      // Skip absolute URLs, data URIs, and non-.md links
      if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return;

      // Split path and anchor
      const hashIdx = url.indexOf('#');
      const rawPath = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
      const rawAnchor = hashIdx >= 0 ? url.slice(hashIdx + 1) : '';

      // Only process .md links
      let decodedPath;
      try { decodedPath = decodeURIComponent(rawPath); } catch { decodedPath = rawPath; }
      if (!decodedPath.endsWith('.md')) return;

      // Resolve absolute path of target file, then make relative to content dir
      const absTarget = path.resolve(fileDir, decodedPath);
      const relToContent = path.relative(contentDir, absTarget).replace(/\\/g, '/');

      // Convert to Astro slug
      const slug = pathToSlug(relToContent);

      // Build final URL
      const anchorPart = rawAnchor ? '#' + anchorToId(rawAnchor) : '';
      node.url = `/notes/${slug}${anchorPart}`;
    });
  };
}


// ─── Remark plugin: rewrite Obsidian relative image paths ─────────────────────
// Transforms: ![](attachments/xxx.png)
//         to: ![](/content/700 笔记/attachments/xxx.png)
function remarkObsidianImages() {
  const CONTENT_PREFIX = '/content';

  function visitImages(node, fn) {
    if (node.type === 'image') fn(node);
    if (node.children) node.children.forEach(c => visitImages(c, fn));
  }

  return (tree, file) => {
    const filePath = file.history?.[0];
    if (!filePath) return;

    const contentDir = path.resolve('src/content');
    const fileDir = path.dirname(filePath);
    const relDir = path.relative(contentDir, fileDir).replace(/\\/g, '/');

    visitImages(tree, (node) => {
      const url = node.url;
      if (url && !url.startsWith('/') && !url.startsWith('http') && !url.startsWith('data:')) {
        node.url = `${CONTENT_PREFIX}/${relDir}/${url}`;
      }
    });
  };
}

// ─── Vite plugin: serve src/content as /content/ in dev ──────────────────────
function viteContentPlugin() {
  const CONTENT_DIR = path.resolve('src/content');

  return {
    name: 'serve-obsidian-content',
    configureServer(server) {
      server.middlewares.use('/content', (req, res, next) => {
        try {
          const url = decodeURIComponent((req.url || '').split('?')[0]);
          const filePath = path.join(CONTENT_DIR, url);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mime = /** @type {Record<string,string>} */ ({
              '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
              '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
              '.pdf': 'application/pdf',
            });
            res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
            res.setHeader('Cache-Control', 'max-age=86400');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        } catch {
          next();
        }
      });
    },
  };
}

// ─── Astro integration: copy content assets to dist/content/ on build ─────────
function obsidianContentIntegration() {
  function copyNonMd(src, dest) {
    if (!fs.existsSync(src)) return;
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyNonMd(srcPath, destPath);
      } else if (!entry.name.endsWith('.md') && !entry.name.endsWith('.ts')) {
        fs.mkdirSync(dest, { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  return {
    name: 'obsidian-content-build',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const contentDir = path.resolve('src/content');
        const destDir = path.join(fileURLToPath(dir), 'content');
        copyNonMd(contentDir, destDir);
        console.log('[obsidian] Copied content assets to dist/content/');
      },
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [tailwindcss(), viteContentPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@types': path.resolve(__dirname, './src/types'),
        '@styles': path.resolve(__dirname, './src/styles'),
      },
    },
  },
  integrations: [svelte(), obsidianContentIntegration()],
  markdown: {
    remarkPlugins: [remarkObsidianImages, remarkObsidianLinks],
    shikiConfig: {
      theme: 'github-dark',
      
      wrap: true,
    },
  },
});
