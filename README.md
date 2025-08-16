# TimePortal

A simple Netlify-deployed SPA with Auth0 login and a live clock.

## Setup

1. In Auth0 Dashboard → Applications:
   - Create a **Single Page Application**.
   - Note your **Domain** and **Client ID**.
   - Set Allowed Callback URLs, Logout URLs, and Web Origins:
     - `https://YOUR-SITE.netlify.app/`
     - `http://localhost:8888/` (Netlify Dev)

2. In Netlify → Site Settings → Environment variables:
   - `AUTH0_DOMAIN = dev-ppsnetwf.us.auth0.com`
   - `AUTH0_CLIENT_ID = v8SikCjLbbH0ioHuoKSkADBHcofOOWHj`

3. Deploy to Netlify:
   ```sh
   git init
   git remote add origin https://github.com/YOURNAME/time-portal.git
   git add .
   git commit -m "Initial commit"
   git push origin main