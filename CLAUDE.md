# Ferno env — working rules

- **Changelog is mandatory.** Every major UI overhaul (a new or redesigned page) and every quality fix gets an entry in `CHANGELOG.md` in the same commit: New / Changed / Fixed, newest first, dated. Update the README's screen table when a screen is added or redesigned.
- **Public repo.** No personal data (real names, emails, tokens) in code, assets or commits. The demo user is Alex Morgan.
- **Design source** is the Figma file *TokenCraft › useFerno*; use the tokens in `src/styles.css`, don't hard-code new colours. Charts use the validated palette order in the README.
- **Liveline needs hex colours**, not CSS variables. Keep `LiveChart`'s one-day `STEP` (see the comment there).
- After installing a package while the dev server runs, delete `node_modules/.vite` and restart, or React loads twice.
- Verify in the browser at desktop, tablet (768) and phone (375) widths before shipping. `npm run build` must pass.
- Pushing to `main` deploys to https://ferno-env.vercel.app.
