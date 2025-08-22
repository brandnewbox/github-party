# GitHub Party! 🎉

See who else is viewing GitHub issues in real-time! This project consists of two parts:
1. A partykit app to store information about who is viewing issues
2. A Chrome extension that integrates with GitHub's interface

Welcome to the party, pal!

This is a [Partykit](https://partykit.io) project, which lets you create real-time collaborative applications with minimal coding effort.

[`server.ts`](./src/server.ts) is the server-side code, which is responsible for handling WebSocket events and HTTP requests.

[`web-extension`](./web-extension) is the code for the Google Chrome extension. It connects to the partykit socket and stores information about currently viewing users. It uses esbuild to build into `web-extension-dist` (which is where you should install the extension from during development).

## Prerequisites
- Node.js (v22 or higher)

## Installation

1. Clone this repository
2. Install dependencies:
```bash
docker compose run app npm install
```
3. Install Chrome extension (instructions below)

## Deployment
TODO: Will be handled by CircleCI (using `npm run deploy` and packaging the Chrome extension)


## Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `web-extension-dist` directory from this project

## Development

To run the web service in development mode with auto-reload:
```bash
docker compose up
``` 