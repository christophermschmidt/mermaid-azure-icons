# Contributing

## Adding or correcting icon slugs

Slug mappings live in `scripts/utils/slug.ts` (`FABRIC_SLUG_MAP`, `AZURE_SLUG_MAP`).
Submit a PR to add missing icons or fix naming.

## Running locally

```bash
npm install
npm run update    # fetch → convert → build
```

`raw/` and `dist/` are gitignored and always generated — never commit them manually.

## Phase status

See `CHECKPOINT.md` and `STATUS.md` for current build state.
