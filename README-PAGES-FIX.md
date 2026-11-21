# AMAN Admin on GitHub Pages

The `/admin-aman/` site is a public, read-only interface preview. It opens without accounts or codes, uses only fictional sample records from `pages-preview.js`, and does not call APIs, send information, or manage users. Never put credentials or real data here. The AMAN staff system itself needs the [separate Node.js repository](https://github.com/hhvxvvf1-jpg/amanapp), a protected backend and secure staff sign-in.

## Publish to the existing project

Merge `fix/pages-direct-preview` into `main` to trigger the existing GitHub Pages workflow. Alternatively, upload the eight files from the `ADMIN-AMAN-Pages-Fix.zip` release directly to the root of this repository (do not upload the ZIP itself), replacing the same filenames. Existing Windows scripts and Pages settings need not change. After committing to `main`, check **Actions** and wait for the Pages job before refreshing `/admin-aman/`.

The Pages preview is designed to work at a project subpath: the CSS, JavaScript and logo use relative paths. The read-only behavior is enforced without backend connectivity; it is not the real administrative service.
