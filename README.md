# AMAN Admin — GitHub Pages Read-Only Preview

This repository hosts the **public, read-only interface preview** of the AMAN / أمان administrative console on GitHub Pages.

- **No login, no backend, no real data:** All records come from fictional in-browser fixtures in `pages-preview.js`, and `index.html` enforces `connect-src 'none'`.
- **Operational backend:** The full authenticated Node.js 22 + SQLite staff application lives in the separate [`hhvxvvf1-jpg/amanapp`](https://github.com/hhvxvvf1-jpg/amanapp) repository.
- **Windows local launcher:** `local.cjs`, `aman.ps1`, and the `*.cmd` scripts are used by the packaged Windows local-install bundle (which places `amanapp` and `node.exe` under `program/`).

## Local Verification

```bash
npm test
```

This checks JavaScript syntax across all `.js`/`.cjs` files and verifies `pages-preview.js` read-only behavior.
