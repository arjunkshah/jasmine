# Firebase Setup for Jasmine

Jasmine uses Firebase for project storage and authentication. Without Firebase configured, the app works as before (no persistence).

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → name it **jasmine**
3. Disable Google Analytics if you prefer
4. Create the project

## 2. Enable Authentication

1. In the Firebase Console, go to **Build** → **Authentication**
2. Click **Get started**
3. Enable **Email/Password** (first provider)
4. Enable **Google** (add provider → Google → enable)

## 3. Create Firestore database

1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Start in **production mode**
4. Choose a region

## 4. Deploy security rules and indexes

From the project root:

```bash
# Install Firebase CLI if needed
npm i -g firebase-tools

# Login and link your project
firebase login
firebase use jasmine-3aade   # or your project ID

# Deploy rules + indexes (firebase.json points to firestore.rules and firestore.indexes.json)
firebase deploy --only firestore
```

Or run `npm run firebase:deploy` if you've added that script.

If you skip this, Firebase will prompt you to create the index when the first `listProjects` query runs (click the link in the console).

## 5. Get your config

1. Go to **Project settings** (gear icon) → **General**
2. Under **Your apps**, click the web icon `</>`
3. Register app (e.g. "jasmine-web")
4. Copy the config object

## 6. Add to .env

Add these to your `.env` file (or `.env.local`):

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 7. Authorized domains

In **Authentication** → **Settings** → **Authorized domains**, add:

- `localhost` (for dev)
- Your production domain (e.g. `your-app.vercel.app`)

## Done

Restart the dev server. You'll see the sign-in screen. Create an account or sign in with Google to start saving projects.
