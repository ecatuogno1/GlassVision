# GlassVision

GlassVision is an interactive palette explorer for architectural and specialty glass. It showcases a curated dataset of glass tones together with optical performance metrics so designers can quickly compare candidates before committing to a build.

## Features

- 🔍 **Powerful filtering** – Search by name, hue family, or tags and refine by use category or light transmission band.
- 🎨 **Visual palette** – Browse rich cards with swatches, reflectance values, and quick optical stats.
- 🧪 **Detailed profiles** – Inspect each tone with material descriptions, dominant elements, and recommended applications.
- 📊 **At-a-glance insights** – View collection-wide metrics including average reflectance and top usage categories.
- 🔐 **Firebase-secured workspace** – Require an authenticated session before exploring the palette and manage accounts directly within the app.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Provide your Firebase credentials. Copy `.env.example` to `.env.local` (or similar) and fill in the values from your Firebase project:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | Web API key from the Firebase console. |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain (usually `<project>.firebaseapp.com`). |
   | `VITE_FIREBASE_PROJECT_ID` | Firebase project ID. |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket name (optional for auth-only apps). |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID. |
   | `VITE_FIREBASE_APP_ID` | Web app ID. |
   | `VITE_FIREBASE_AUTH_EMULATOR_URL` | Optional: URL to a local Auth emulator (e.g., `http://localhost:9099`). |

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Build for production (for Firebase hosting or any static host):

   ```bash
   npm run build
   ```

5. Preview the production build locally:

   ```bash
   npm run preview
   ```

The Vite build outputs static assets in `dist/`, ready to be deployed to Firebase Hosting. The project uses TypeScript and React 18.

## Data model

Each glass entry implements the following interface:

```ts
interface GlassColor {
  id: string;
  name: string;
  hueGroup: string;
  hex: string;
  lightTransmission: 'low' | 'medium' | 'high';
  reflectance: number;
  dominantElement: string;
  category: 'Architectural' | 'Art' | 'Laboratory' | 'Automotive' | 'Decorative';
  description: string;
  applications: string[];
  tags: string[];
}
```

The sample dataset lives in [`src/data/glassPalette.ts`](src/data/glassPalette.ts). Add, remove, or edit entries to reflect your real catalog.

## Firebase authentication notes

- Enable the **Email/Password** provider (or any other provider you plan to support) in Firebase Authentication. The in-app forms currently support email-based sign in, sign up, and password resets out of the box.
- Optional: start the Firebase Auth emulator (`firebase emulators:start --only auth`) and set `VITE_FIREBASE_AUTH_EMULATOR_URL` for local development without touching production users.
- The authentication state is exposed through `AuthContext`, making it easy to add role-based logic or connect Firestore/Realtime Database queries once your backend is ready.

## License

This project is provided as-is for demonstration purposes.
