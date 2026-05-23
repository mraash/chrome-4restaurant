import { copyFile, mkdir } from 'node:fs/promises';
import { build, context } from 'esbuild';

const args = process.argv.slice(2);
const prod = args.includes('--prod');
const watch = args.includes('--watch');

const base = {
  entryPoints: ['src/chrome/background.ts', 'src/chrome/content.ts', 'src/chrome/options.ts'],
  bundle: true,
  format: 'esm',
  target: 'chrome118',
  minify: prod,
  sourcemap: watch ? 'inline' : false,
  outdir: 'dist',
  tsconfig: 'tsconfig.json',
  logLevel: 'info'
};

const staticFiles = [
  ['src/chrome/manifest.json', 'dist/manifest.json'],
  ['src/chrome/options.html', 'dist/options.html'],
  ['src/chrome/options.css', 'dist/options.css']
];

async function copyStaticFiles() {
  await mkdir('dist', { recursive: true });
  await Promise.all(staticFiles.map(([from, to]) => copyFile(from, to)));
}

const copyStaticFilesPlugin = {
  name: 'copy-static-files',
  setup(build) {
    build.onEnd(async result => {
      if (result.errors.length === 0) {
        await copyStaticFiles();
      }
    });
  }
};

base.plugins = [copyStaticFilesPlugin];

if (watch) {
  const ctx = await context(base);
  await ctx.watch();
  console.log('watching for changes...');
} else {
  await build(base).catch(() => process.exit(1));
}
