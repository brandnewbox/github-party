# GitHub Party! 🎉

See who else is viewing GitHub issues in real-time! This project consists of two parts:
1. A lightweight web service that tracks issue viewers
2. A Chrome extension that integrates with GitHub's interface

## Web Service Setup

### Prerequisites
- Node.js (v14 or higher)
- Redis server

### Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file and configure it:
```bash
cp .env.example .env
```

4. Update the `.env` file with your settings:
- `PORT`: The port to run the server on (default: 3000)
- `REDIS_URL`: Your Redis server URL (default: redis://localhost:6379)

5. Start the server:
```bash
npm start
```

### Deployment

The web service is designed to be easily deployed to platforms like:
- Railway.app (recommended, includes free Redis)
- Render.com
- Heroku

## Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension` directory from this project

### Configuration

After installing the extension:
1. Click the extension icon in your browser
2. Enter your:
   - GitHub username
   - Organization ID
   - API URL (where you deployed the web service)
3. Click Save

## How It Works

- The extension checks if you're viewing a GitHub issue page
- When on an issue page, it sends your viewing status to the web service
- The web service maintains this information for 30 seconds
- Other users viewing the same issue will see who else is currently viewing it
- The viewing status is automatically updated every 15 seconds

## Security & Privacy

- No issue content is stored, only URLs and usernames
- Viewing data expires after 30 seconds of inactivity
- All data is stored in Redis and is ephemeral
- The extension only activates on GitHub issue pages

## Development

To run the web service in development mode with auto-reload:
```bash
npm run dev
``` 