# Codebase Index

## Stack
- Vue 3 (Vite)
- Firebase Auth + Firestore
- Leaflet + marker icons/clustering assets
- Bulma CSS
- Vitest + Vue Test Utils

## Top-Level Layout
- `src/`: Vue app source
- `public/`: static assets (PWA icons, map icons, service worker, privacy page)
- `dist/`: built output
- `index.html`: Vite HTML entry
- `vite.config.js`: Vite config + `@` alias to `src/`
- `firebase.json`: Firebase Hosting + emulator ports
- `package.json`: scripts and dependencies

## Runtime Entry Points
- `src/main.js`: mounts `App.vue` and imports Leaflet cluster styles.
- `src/App.vue`: app shell; registers service worker and composes sections:
  - `PageHero`
  - `AuthenticationSection`
  - `MapView`
  - `PetListing`
  - `Footer`

## Feature Map
- Authentication:
  - `src/components/AuthenticationSection.vue`
  - `src/authenticateUser.js`
  - Uses Firebase Google sign-in redirect flow and auth state listener.
- Map + marker rendering:
  - `src/components/MapView.vue`
  - `src/components/icons/LeafletIcon.js`
  - Reads `pet-coords` from Firestore and renders markers/popups.
- Listing creation:
  - `src/components/PetListing.vue`
  - `src/addPetCoords.js`
  - Opens modal, collects form fields from DOM, reverse-geocodes with Nominatim, writes to Firestore.
- Chat:
  - `src/components/ChatPanel.vue`
  - Starts from map marker popup events and persists conversations/messages in Firestore.
- PWA behavior:
  - `src/components/PageHero.vue` handles install prompt UI.
  - `public/service-worker.js` sets Workbox image caching.

## Source File Index (`src/`)
- `src/main.js`: Vue bootstrap.
- `src/App.vue`: top-level page composition.
- `src/authenticateUser.js`: shared auth helper state + handlers.
- `src/addPetCoords.js`: Firestore write path for listing coordinates and metadata.
- `src/components/AuthenticationSection.vue`: sign-in/out UI and user listing cards.
- `src/components/MapView.vue`: Leaflet map initialization and Firestore marker subscription.
- `src/components/PetListing.vue`: listing modal and submit trigger.
- `src/components/PageHero.vue`: header/hero and install prompt wiring.
- `src/components/Footer.vue`: footer/reminder content.
- `src/components/ChatPanel.vue`: real-time listing conversations for authenticated users.
- `src/components/icons/LeafletIcon.js`: Leaflet icon definitions.
- `src/components/icons/*.vue`: SVG-like Vue icon components for UI.
- `src/components/__tests__/App.spec.js`: basic `PageHero` render test.
- `src/assets/*`: CSS and image assets.

## Data + External Integrations
- Firebase project/config duplicated in:
  - `src/authenticateUser.js`
  - `src/addPetCoords.js`
  - `src/components/AuthenticationSection.vue`
  - `src/components/MapView.vue`
- Firestore collection: `pet-coords`
- Firestore collections:
  - `pet-coords`
  - `stray-reports`
  - `conversations` with nested `messages` subcollection
- Reverse geocoding API: `https://nominatim.openstreetmap.org/reverse`
- Map tiles: Mapbox style endpoint in `src/components/MapView.vue`

## Dev Commands
- `npm run dev`: start Vite dev server
- `npm run build`: production build
- `npm run preview`: preview build on port 4173
- `npm run test:unit`: run Vitest tests in jsdom

## Quick Navigation (ripgrep)
- Components:
  - `rg --files src/components`
- Firebase usage:
  - `rg -n "firebase|Firestore|getAuth|onAuthStateChanged" src`
- Firestore collection writes/reads:
  - `rg -n "pet-coords|setDoc|onSnapshot|collection\\(" src`
- Service worker + PWA:
  - `rg -n "serviceWorker|beforeinstallprompt|workbox" src public`

## Notes
- Current unit test coverage is minimal (`src/components/__tests__/App.spec.js`).
