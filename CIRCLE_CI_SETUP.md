# Circle CI Setup for GitHub Party

This document explains how to set up Circle CI for building the web extension and deploying the PartyKit socket server.

## Overview

The Circle CI pipeline does the following:
1. **Builds the web extension** using `npm run build:extension`
2. **Stores the extension artifacts** for future deployment
3. **Deploys the PartyKit socket server** to PartyKit's hosting platform (main branch only)

## Required Environment Variables

You need to set up the following environment variables in your Circle CI project:

### 1. PARTYKIT_TOKEN
- **Description**: Your PartyKit authentication token for deployment
- **How to get it**: 
  1. Run `npx partykit auth login` locally
  2. Run `npx partykit auth token` to get your token
  3. Copy the token value
- **Where to set it**: Circle CI Project Settings → Environment Variables

### 2. PARTY_HOST
- **Description**: The PartyKit host URL for your deployed socket server
- **Example**: `your-project.your-username.partykit.dev`
- **Where to set it**: Circle CI Project Settings → Environment Variables
- **Note**: This gets injected into the web extension build for production

## Circle CI Context Setup

The pipeline uses a Circle CI context called `partykit-deploy` to manage environment variables securely.

### Setting up the Context:
1. Go to Circle CI Organization Settings
2. Navigate to "Contexts"
3. Create a new context named `partykit-deploy`
4. Add the environment variables (`PARTYKIT_TOKEN`, `PARTY_HOST`) to this context

## Deployment Workflow

### Branches that trigger builds:
- `main` - Full build + deployment
- `feature/*` - Build only (no deployment)
- `hotfix/*` - Build only (no deployment)

### What happens on each branch:
- **All branches**: Web extension is built and artifacts are stored
- **Main branch only**: PartyKit socket server is deployed

## Manual Setup Steps

1. **Add your PartyKit token to Circle CI**:
   ```bash
   # Get your token locally
   npx partykit auth token
   # Copy the output and add it as PARTYKIT_TOKEN in Circle CI
   ```

2. **Get your PartyKit host URL**:
   - After your first deployment, PartyKit will provide a host URL
   - Add this as `PARTY_HOST` in Circle CI environment variables

3. **Verify the setup**:
   - Push to a feature branch to test the build
   - Merge to main to test the full deployment

## Troubleshooting

### Common Issues:

1. **Authentication Failed**:
   - Verify `PARTYKIT_TOKEN` is correctly set in Circle CI
   - Make sure the token hasn't expired

2. **Build Fails**:
   - Check that `PARTY_HOST` is set for web extension builds
   - Verify all npm dependencies are correctly specified

3. **Deployment Fails**:
   - Ensure you're on the `main` branch
   - Check PartyKit service status
   - Verify your PartyKit account has deployment permissions

## Next Steps

Once the web extension has a deployment target (Chrome Web Store, Firefox Add-ons, etc.), we can add additional deployment steps to the Circle CI pipeline.
