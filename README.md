# 4Restaurant Helper

A Chrome extension that adds extra functionality to the 4Restaurant restaurant management system.

## Setup

1. Clone the repository
2. `npm install`
3. `npm run build`
4. Chrome → `chrome://extensions` → **Load unpacked** → select the `dist/` folder

## Development

```bash
npm run dev        # watch mode — rebuild on changes
npm run build      # typecheck + full build
npm run typecheck  # TypeScript check only
npm run lint       # ESLint check
npm run lint:fix   # auto-fix lint issues
```

## Versioning

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0
```

Automatically bumps `package.json`, syncs `manifest.json`, creates a git commit and tag.

## Tech

TypeScript · Chrome Manifest V3 · esbuild · [ExcelJS](https://github.com/exceljs/exceljs)
