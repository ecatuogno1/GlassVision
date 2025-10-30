# GlassVision

GlassVision is an interactive palette explorer for architectural and specialty glass. It showcases a curated dataset of glass tones together with optical performance metrics so designers can quickly compare candidates before committing to a build.

## Features

- 🔍 **Powerful filtering** – Search by name, hue family, or tags and refine by use category or light transmission band.
- 🎨 **Visual palette** – Browse rich cards with swatches, reflectance values, and quick optical stats.
- 🧪 **Detailed profiles** – Inspect each tone with material descriptions, dominant elements, and recommended applications.
- 📊 **At-a-glance insights** – View collection-wide metrics including average reflectance and top usage categories.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Build for production (for Firebase hosting or any static host):

   ```bash
   npm run build
   ```

4. Preview the production build locally:

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

## Firebase deployment notes

- Run `npm run build` and deploy the generated `dist` directory with `firebase deploy --only hosting`.
- Enable Firebase Authentication (e.g., Google or email link) and wrap routes with your preferred auth guards. The UI exposes hooks where you can add authenticated states once your backend is ready.
- For dynamic datasets, replace the static import with Firestore or Realtime Database queries and feed the resolved array into the existing components.

## License

This project is provided as-is for demonstration purposes.
