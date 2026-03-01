## Paws2Help: A Web App to List Stray Animals and Pets for Adoption

[![Netlify Status](https://api.netlify.com/api/v1/badges/24196f87-2857-40ac-b4ec-52b5f6110872/deploy-status)](https://app.netlify.com/sites/paws2help/deploys)

The primary goal for this web app is to allow pet owners to list their pets up for adoption. Along with some planned features for local communities to report stray animals and lost pets.

## Feature Roadmap Notes

- [x] In-app chat MVP between listing owners and interested adopters
  - Start chat from a map marker popup ("Message Owner")
  - Real-time conversation panel for signed-in users
  - Firestore security rules to restrict chat access to conversation participants
- [x] Chat moderation (block user and anti-spam controls)
- [ ] Push notifications for new chat messages

## Build Pipeline

Netlify automatically builds the web app from each new commit to the main branch

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

Clone the repository and then install dependencies

```sh
git clone https://github.com/MagusWyvern/paws2help.git
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```
