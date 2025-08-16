Got it 🚀 Since you already have

.
├── index.html
├── netlify.toml
├── netlify/
│   └── functions/
│       ├── mgmt-selftest.js
│       └── mgmt-user.js
├── .gitignore
└── README.md

Here’s a clean README.md you can commit that explains how the project works, how to deploy, and what each file does:

⸻


# Auth0 + Netlify SPA Example

This project demonstrates how to use **Auth0** authentication in a static Single-Page Application (SPA) hosted on **Netlify**, with **Netlify Functions** acting as a secure backend for calling the Auth0 Management API.

---

## 🚀 How it works

1. **SPA Login (index.html)**  
   - The frontend uses the [Auth0 SPA JS SDK](https://github.com/auth0/auth0-spa-js).  
   - On page load, the app redirects users to Auth0 Universal Login.  
   - After login, Auth0 redirects back to the app with a code, which is exchanged for tokens.  

2. **Management API via Netlify Functions**  
   - Frontend calls Netlify Functions (`/api/mgmt-user`) to securely fetch user profile info.  
   - The function uses **Machine-to-Machine (M2M)** credentials stored as environment variables in Netlify.  
   - No secrets are ever exposed in the frontend.

3. **Environment Variables (set in Netlify Dashboard → Site settings → Environment variables)**

AUTH0_DOMAIN=dev-ppsnetwf.us.auth0.com
AUTH0_M2M_CLIENT_ID=xxxxxxxxxxxxxxxx
AUTH0_M2M_CLIENT_SECRET=xxxxxxxxxxxxxxxx

---

## 📂 File Structure

.
├── index.html               # Main SPA (auto-redirects to Auth0 login)
├── netlify.toml             # Netlify config (redirects all to index.html)
├── netlify/
│   └── functions/
│       ├── mgmt-selftest.js # Healthcheck: verifies env + Auth0 token
│       └── mgmt-user.js     # Secure API: fetches user profile via M2M
├── .gitignore               # Ignore node_modules, logs, etc.
└── README.md                # Project documentation

---

## 🛠 Development

### Run locally
You can test functions locally with [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install -g netlify-cli
netlify dev

This will serve the frontend and functions on http://localhost:8888.

Deploy

Push to GitHub → Netlify will auto-deploy.
Or manually:

netlify deploy --prod


⸻

🔑 Auth0 Setup
	1.	Create an SPA application in Auth0
	•	Allowed Callback URLs → http://localhost:8888/, https://YOUR-SITE.netlify.app/
	•	Allowed Logout URLs → http://localhost:8888/, https://YOUR-SITE.netlify.app/
	2.	Create a Machine-to-Machine application in Auth0
	•	Authorize it for the Management API.
	•	Add read:users scope.
	•	Copy its Client ID and Client Secret into Netlify environment variables.

⸻

✅ Functions

mgmt-selftest.js
	•	Verifies:
	•	Env vars are set
	•	M2M token works
	•	Management API responds

mgmt-user.js
	•	Returns profile data for the logged-in user
	•	Calls Auth0 Management API securely with M2M token

⸻

🧪 Test the setup
	•	Visit your deployed site → you should be redirected to Auth0 login
	•	Log in → redirected back → profile shown
	•	Open browser console → check /api/mgmt-user call returns JSON

⸻

📜 License

MIT

