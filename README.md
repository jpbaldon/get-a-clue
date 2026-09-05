# Get a Clue

Get a Clue is a client-only Next.js party game for live groups. Hosts sign in with Google, create question sets in Firestore, and run live rooms from Realtime Database. Players join anonymously from their devices.

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Fill `.env.local` with the Firebase web app values from Project settings. The app shows a setup banner instead of crashing if the public Firebase values are missing.

Hosts use two devices: `/host/{code}/board` for the Discord screen-share, and `/host/{code}/control` for answers and judging. See `docs/host-screens.md`.

## Firebase Spark Setup

1. Create a Firebase project on the Spark plan.
2. Add a web app and copy its public config into `.env.local`.
3. Enable Authentication providers: Google and Anonymous.
4. Create Firestore in production mode.
5. Create Realtime Database in locked mode.
6. Deploy rules:

```bash
firebase deploy --only firestore:rules,database
```

The app does not require Cloud Functions or paid Firebase services. Firestore stores `questionSets` by owner. Realtime Database stores live games under `games/{code}` and team conferral separately under `confer/{code}` so players do not read host answers or other teams' conferral data.

## Vercel Setup

1. Import the repo into Vercel.
2. Add all `NEXT_PUBLIC_FIREBASE_*` variables from `.env.example`.
3. Deploy with the default Next.js settings.

Because Firebase runs entirely in the browser, Vercel does not need server secrets for this app.

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm exec tsc --noEmit
```
