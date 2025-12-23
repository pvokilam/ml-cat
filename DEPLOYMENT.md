# Railway Deployment Guide

This guide will help you deploy your ML grocery categorization app to Railway.

## Prerequisites

- A GitHub account (for connecting to Railway)
- Your code pushed to a GitHub repository

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"** or **"Login"**
3. Sign up using your GitHub account (recommended) or email
4. Authorize Railway to access your GitHub repositories when prompted

## Step 2: Deploy Your Project

### Option A: Deploy from GitHub (Recommended)

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository (`ml-cat`)
4. Railway will automatically detect the project and start building

### Option B: Deploy using Railway CLI

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Initialize and deploy:
   ```bash
   railway init
   railway up
   ```

## Step 3: Configure Environment Variables (if needed)

Railway should automatically detect:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: Railway automatically sets `PORT` environment variable

No additional environment variables are required for basic deployment.

## Step 4: Get Your App URL

1. Once deployment completes, Railway will provide a public URL
2. Click on your service in Railway dashboard
3. Go to the **"Settings"** tab
4. Under **"Domains"**, you'll see your Railway-provided domain (e.g., `your-app.up.railway.app`)
5. You can also add a custom domain if desired

## Step 5: Test Your Deployment

1. Visit your Railway URL
2. Wait for the ML model to load (first request may take 30-60 seconds)
3. Test the app by typing grocery items like "milk", "apple", "bread"

## Troubleshooting

### Model Loading Issues

- The first request may take longer as the model downloads (~100MB)
- Check Railway logs: In Railway dashboard → Your service → **"Deployments"** → Click on latest deployment → **"View Logs"**

### Build Failures

- Ensure `groceryEmbeddings.json` exists in `src/data/`
- Run `npm run precompute` locally if needed
- Check that all dependencies are in `package.json`

### API Not Working

- Verify the server is running: Check Railway logs
- Ensure `/api/health` endpoint responds
- Check that embeddings file is copied to `dist/src/data/`

## Notes

- Railway provides **$5 free credit** monthly
- The ML model will be downloaded on first startup (~100MB)
- Cold starts may take 30-60 seconds
- Railway automatically handles HTTPS/SSL certificates

## Support

If you encounter issues:
1. Check Railway logs in the dashboard
2. Verify all files are committed to GitHub
3. Ensure `package.json` scripts are correct
4. Check that `groceryEmbeddings.json` exists and is committed

