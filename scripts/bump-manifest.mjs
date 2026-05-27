// Called by `npm version` — syncs manifest.json version with package.json.
import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/chrome/manifest.json';
const manifest = JSON.parse(readFileSync(path, 'utf8'));
manifest.version = process.env.npm_package_version;
writeFileSync(path, JSON.stringify(manifest, null, 4) + '\n');
