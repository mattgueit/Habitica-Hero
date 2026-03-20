# Habitica Hero

A companion app for Habitica. Useful for players in parties that require daily buffs and damage to bosses.

Use the app to cast multiple buffs at once, either immediately or at a later time.

Daily tasks can be checked off in case you've missed the new cron.

Log in using your regular Habitica credentials, this will fetch your user ID and API key which will be stored in the browser's session storage.

Note that there is a rate limit of 30 requests per minute (enforced by the Habitica API). Because of this, buffs are limited to 20 at a time.

**Development**

If you want to work locally, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
git clone https://github.com/mattgueit/Habitica-Hero.git Habitica-Hero

cd Habitica-Hero

npm i

npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
