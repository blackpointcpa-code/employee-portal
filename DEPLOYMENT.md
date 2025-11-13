# Deployment Guide - Render.com

## Prerequisites
1. GitHub account
2. Render.com account (free)
3. Access to blackpointtax.com DNS settings

## Step 1: Push to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   cd "/Users/bigdog/Desktop/Blackpoint Tracking System"
   git init
   git add .
   git commit -m "Initial commit - Blackpoint Tracking System"
   ```

2. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Name: `blackpoint-tracking-system`
   - Privacy: Private (recommended)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/blackpoint-tracking-system.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Render

1. **Sign up/Login to Render**:
   - Go to https://render.com
   - Sign up with GitHub (easier integration)

2. **Connect Repository**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub account
   - Select `blackpoint-tracking-system` repository
   - Click "Connect"

3. **Deploy**:
   - Render will read the `render.yaml` file automatically
   - Click "Apply" to create both services
   - Wait 5-10 minutes for deployment
   - You'll get URLs like:
     - Backend: `https://blackpoint-api.onrender.com`
     - Frontend: `https://blackpoint-frontend.onrender.com`

## Step 3: Update Frontend API URL

Once deployed, update the client to use the production API:

1. **Create environment file**:
   ```bash
   cd client
   echo "REACT_APP_API_URL=https://blackpoint-api.onrender.com" > .env.production
   ```

2. **Update client code** to use environment variable:
   - In all API calls, change `/api/` to `${process.env.REACT_APP_API_URL}/api/`
   - Or update the proxy in `client/package.json` to point to production API

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add production API URL"
   git push
   ```
   - Render will automatically redeploy

## Step 4: Connect Custom Domain (blackpointtax.com)

### In Render Dashboard:

1. **Go to Frontend Service**:
   - Click on `blackpoint-frontend` service
   - Go to "Settings" tab
   - Scroll to "Custom Domain"
   - Click "Add Custom Domain"
   - Enter: `blackpointtax.com`
   - Click "Save"

2. **Get DNS Records**:
   - Render will show you the DNS records to add
   - Typically: A record or CNAME record

### In Your Domain Registrar (GoDaddy/Namecheap/etc):

1. **Login to your domain registrar**
2. **Go to DNS Management** for blackpointtax.com
3. **Add Records** (Render will show exact values):
   - **Type**: A or CNAME
   - **Name**: @ (or blank for root domain)
   - **Value**: (provided by Render)
   - **TTL**: 3600

4. **Optional - Add www subdomain**:
   - **Type**: CNAME
   - **Name**: www
   - **Value**: blackpointtax.com

5. **Save Changes**
   - DNS propagation takes 15 minutes to 48 hours
   - Usually works in 15-30 minutes

## Step 5: Enable SSL (HTTPS)

Render automatically provides free SSL certificates:
- Once DNS is verified, Render will auto-generate SSL certificate
- Your site will be accessible via `https://blackpointtax.com`
- This is automatic and free!

## Step 6: Test Everything

1. **Visit** https://blackpointtax.com
2. **Sign in** with employee name
3. **Test features**:
   - Clock in/out
   - Add tasks
   - Check off daily tasks
   - View payroll report
   - Export CSV

## Costs

- **Free Tier**:
  - Frontend: $0/month (static sites always free)
  - Backend: $0/month (spins down after 15 min inactivity)
  - ⚠️ Cold starts take 30-60 seconds after inactivity

- **Paid Tier** ($7/month):
  - Backend stays always-on (no cold starts)
  - Faster response times
  - Better for production use

## Upgrading to Paid (Recommended for production)

1. Go to `blackpoint-api` service in Render
2. Click "Upgrade Plan"
3. Select "Starter" ($7/month)
4. Your backend will always be ready instantly

## Database Backups

The SQLite database is stored in Render's persistent disk:
- **Automatic backups**: Not included in free tier
- **Manual backup**: Download via Render shell or add backup script
- **Recommended**: Upgrade to paid tier for disk persistence

## Environment Variables (if needed later)

In Render Dashboard → Service → Environment:
- Add any API keys
- Add configuration settings
- All are encrypted and secure

## Troubleshooting

**Site not loading?**
- Check DNS propagation: https://dnschecker.org
- Verify Render deployment is successful (green checkmark)
- Check browser console for errors

**API not connecting?**
- Verify CORS is enabled in server.js (already configured)
- Check API URL in frontend environment variables
- Test API directly: https://blackpoint-api.onrender.com/api/tasks

**Need help?**
- Render Docs: https://render.com/docs
- Render Support: support@render.com

---

## Quick Commands Reference

```bash
# View logs
render logs --service blackpoint-api

# Restart service
git commit --allow-empty -m "Restart"
git push

# Run shell on backend
# Go to Render Dashboard → Service → Shell tab
```

🎉 Your app is now live at **https://blackpointtax.com**!
