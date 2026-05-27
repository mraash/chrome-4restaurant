import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, rmSync, watch as fsWatch } from 'node:fs';
import { argv } from 'node:process';

const DIST = 'dist';
const SRC = 'src/chrome';
const STATIC_FILES = ['manifest.json', 'options.html', 'options.css'];
const ENTRIES = [
    `${SRC}/content-script.ts`,
    `${SRC}/service-worker.ts`,
    `${SRC}/options.ts`,
];

const watch = argv.includes('--watch');

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const ctx = await esbuild.context({
    entryPoints: ENTRIES,
    bundle: true,
    outdir: DIST,
    format: 'iife',
    target: 'chrome120',
    sourcemap: true,
    // Minify production builds to slim down content-script.js (which inlines ExcelJS).
    // Watch builds skip minification for faster rebuilds — sourcemaps cover debugging.
    minify: !watch,
    logLevel: 'info',
    legalComments: 'none',
});

await ctx.rebuild();
copyStaticFiles();

if (watch) {
    await ctx.watch();
    // Re-copy static files when they change too.
    for (const file of STATIC_FILES) {
        fsWatch(`${SRC}/${file}`, () => {
            try {
                cpSync(`${SRC}/${file}`, `${DIST}/${file}`);
                console.log(`[copy] ${file}`);
            } catch (err) {
                console.error(`[copy] failed for ${file}:`, err);
            }
        });
    }
    console.log(`Watching ${SRC}/ — Ctrl+C to stop.`);
} else {
    await ctx.dispose();
}

function copyStaticFiles() {
    for (const file of STATIC_FILES) {
        cpSync(`${SRC}/${file}`, `${DIST}/${file}`);
    }
}
