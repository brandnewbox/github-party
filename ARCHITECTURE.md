# GitHub Party - Architecture Overview

## How the App Works

### 🔌 WebSocket = Phone call protocol (real-time communication)
- Enables instant, bidirectional communication between the browser extension and PartyKit server
- No polling or page refreshes needed - everything happens in real-time

### 🖥️ PartyKit Server (`src/server.ts`) = Does the tracking/user logic
- **Tracks who's connected to each GitHub issue**
  - Each GitHub repo/issue gets its own "room" (e.g., `facebook/react-123` for issue #123)
  - Maintains a `Map` of connected users per room
- **Broadcasts when users join/leave**
  - Sends `user_status` messages when someone connects/disconnects
  - Sends `connected_users` messages with the full list of active users
- **Manages the "room" for each issue**
  - Rooms are created dynamically based on the GitHub URL
  - No pre-configuration needed - rooms spawn automatically

### 📱 Chrome Extension (`web-extension/content.ts`) = Shows the user avatars
- **Creates the avatar container in bottom-right corner**
  - Fixed position overlay with clean styling
  - Doesn't interfere with GitHub's UI
- **Displays GitHub profile pictures**
  - Fetches avatars from `https://github.com/{username}.png`
  - Shows 32x32px circular avatars with hover tooltips
- **Updates the UI when users join/leave**
  - Listens for WebSocket messages from the server
  - Dynamically adds/removes avatars in real-time

## 🔄 The Perfect Flow

1. **User visits a GitHub issue page**
2. **Extension extracts repo/issue info** from the URL
3. **Extension connects to PartyKit room** for that specific issue
4. **Extension sends user info** (GitHub ID and username) to server
5. **Server broadcasts the new connection** to all users in that room
6. **All connected users see the new avatar** appear instantly
7. **When user leaves**, server broadcasts disconnection and avatars disappear

## 🎨 Division of Responsibilities

| Component | Responsibility | Emoji |
|-----------|---------------|-------|
| **Server** | "Keep track of who's where" | 🧠 |
| **Extension** | "Show pretty avatars on the page" | 🎨 |
| **WebSocket** | "Make it all happen in real-time" | ⚡ |


## What order do things need to be deployed in? 
I ask becasue we had a bug where in production the partyhost was wronlgy set to localhost:1999 so I am now setting it on line 10 of my package.json but my cto said  it doesn't look like this 
resolves to a real dns address. But I was under the impression somehow through the deployment process we were creating our partykit server and then that url would work. i now think thats wrong but i dont know how this process SHOULD work

**Answer:**

**Correct deployment sequence:**

1. **Deploy PartyKit server first**: `npm run deploy` - Creates the server at `https://multiplayer-github.willtcarey.partykit.dev`
2. **Build extension with production host**: `npm run build:extension:prod` - Uses the real PartyKit URL (not localhost)
3. **Package and distribute the extension**

**Key insight:** The PartyKit URL doesn't exist until deployment. The `PARTY_HOST` environment variable in the build script injects the correct URL during extension compilation.

## How This Should Work

Your setup is correct:
- `content.ts` uses `process.env.PARTY_HOST!` (environment variable) ✅
- `esbuild.mjs` injects the env var during build ✅  
- `package.json` sets `PARTY_HOST=https://multiplayer-github.willtcarey.partykit.dev` for production builds ✅

The localhost:1999 bug happened because the wrong environment was used during build, but your current approach with environment variables prevents hardcoding and handles dev vs production correctly.

## What's Going Wrong

If `multiplayer-github.willtcarey.partykit.dev` doesn't resolve to a real DNS address, then:

**Problem:** Either the PartyKit server deployment failed, or the URL `multiplayer-github.willtcarey.partykit.dev` is incorrect/not configured properly.

**Solution:** Check your deployment logs to see if PartyKit deployment succeeded, and verify the actual URL that PartyKit assigned to your project. The URL might be different than expected, or the deployment process might need PartyKit authentication/configuration. 