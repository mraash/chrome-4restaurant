import { build, context } from 'esbuild';

const args = process.argv.slice(2);
const prod  = args.includes('--prod');
const watch = args.includes('--watch');

const base = {
  entryPoints: ['src/chrome/background.ts', 'src/chrome/content.ts'],
  bundle: true,
  format: 'esm',
  target: 'chrome118',
  minify: prod,
  sourcemap: watch ? 'inline' : false,
  outdir: 'dist',
  tsconfig: 'tsconfig.json',
  logLevel: 'info'
};

if (watch) {
  const ctx = await context(base);
  await ctx.watch();
  console.log('⚡ watching for changes...');
} else {
  await build(base).catch(() => process.exit(1));
}
