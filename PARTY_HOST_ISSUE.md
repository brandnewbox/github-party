# PARTY_HOST Production Issue Analysis

## 🎯 Problem Summary
The Chrome extension is connecting to `localhost:1999` in production instead of the deployed PartyKit server URL.

## 🏗️ Architecture Overview
- **PartyKit Server**: Runs on PartyKit platform (`src/server.ts`)
- **Chrome Extension**: Client code that connects via WebSocket (`web-extension/content.ts`)
- **WebSocket Protocol**: Real-time communication between server and extension
- **Build Process**: esbuild compiles TypeScript and injects environment variables

## 🔄 How It Should Work

### Development
1. `docker compose up` sets `PARTY_HOST=http://localhost:1999`
2. PartyKit dev server runs on `localhost:1999`
3. `npm run build:extension` injects `localhost:1999` into extension
4. Extension connects to local PartyKit server ✅

### Production
1. `partykit deploy` deploys server to PartyKit cloud
2. PartyKit automatically runs `npm run build:extension` 
3. Should inject production PartyKit URL into extension
4. Extension should connect to deployed PartyKit server ❌ **BROKEN**

## 🚨 Current Issue

### What's Happening
- Production extension has `localhost:1999` hardcoded in built file
- This means `PARTY_HOST=localhost:1999` is being set during production build
- Extension tries to connect to localhost instead of production server

### Evidence
```javascript
// In web-extension-dist/content.js (built file):
var S=new x({host:"http://localhost:1999",room:P});
```

## 🔍 Root Cause Analysis

### The Injection Mechanism Works
```javascript
// esbuild.mjs - This part is correct
define: {
  "process.env.PARTY_HOST": `"${process.env.PARTY_HOST}"`
}
```

### The Problem
**Something is setting `PARTY_HOST=localhost:1999` during PartyKit's production build process.**

Possible sources:
1. **PartyKit platform default**: PartyKit might set this as a default environment variable
2. **Build environment inheritance**: Production build might inherit dev environment variables
3. **CI/CD configuration**: Some deployment process might be setting it

## 🎯 What We Know For Sure

- ✅ Injection mechanism works (esbuild correctly reads `process.env.PARTY_HOST`)
- ✅ Development works (Docker sets correct localhost value)
- ❌ Production gets wrong value (`localhost:1999` instead of production URL)

## 🛠️ Solution Needed

**Find how to set `PARTY_HOST` to the correct production URL during PartyKit deployment.**

When `partykit deploy` runs:
1. Deploy server → Get production URL (e.g., `https://your-app.partykit.dev`)
2. Set `PARTY_HOST` to that production URL
3. Run `npm run build:extension` with correct environment variable
4. Extension gets built with correct production host

## 🔧 Next Steps

1. **Research PartyKit deployment environment variables**
   - How to set environment variables during PartyKit builds
   - Whether PartyKit provides the deployment URL as an environment variable
   
2. **Modify build process to use production URL**
   - Either set `PARTY_HOST` explicitly in deployment config
   - Or modify `esbuild.mjs` to detect/use PartyKit's deployment URL

3. **Test production build**
   - Verify built extension connects to correct production server
   - Ensure development workflow remains unchanged

## 📝 Key Files
- `esbuild.mjs`: Build script that injects environment variables
- `partykit.json`: Defines build command that PartyKit runs
- `web-extension/content.ts`: Source code that uses `process.env.PARTY_HOST`
- `web-extension-dist/content.js`: Built extension (currently has wrong host)
- `docker-compose.yml`: Sets `PARTY_HOST` for development only
