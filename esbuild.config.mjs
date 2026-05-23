import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
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
  ['src/chrome/options.html', 'dist/options.html'],
  ['src/chrome/options.css', 'dist/options.css']
];

async function writeManifest() {
  const [packageJson, manifestJson] = await Promise.all([
    readFile('package.json', 'utf8'),
    readFile('src/chrome/manifest.json', 'utf8')
  ]);
  const { version } = JSON.parse(packageJson);
  const manifest = JSON.parse(manifestJson);

  manifest.version = version;

  await writeFile('dist/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
}

async function copyStaticFiles() {
  await mkdir('dist', { recursive: true });
  await Promise.all(staticFiles.map(([from, to]) => copyFile(from, to)));
  await writeManifest();
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
