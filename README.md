# CarePlus — Login Page (Next.js + TypeScript + Tailwind)

## 1. Create the project (if starting fresh)

```bash
npx create-next-app@latest careplus-login --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd careplus-login
```

When prompted, accept the defaults (App Router: yes).

## 2. Drop in these files

Copy the files from this bundle into your project, overwriting where needed:

```
careplus-login/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ImageCarousel.tsx
│   └── LoginPage.tsx
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── package.json
└── tsconfig.json
```

## 3. Install dependencies

```bash
npm install
```

## 4. Run the dev server

```bash
npm run dev
```

Visit http://localhost:3000 — the right-hand panel will auto-cycle through
3 images every 5 seconds with a smooth crossfade, with working arrow and
dot navigation.

## Customizing

- **Swap images**: edit the `SLIDES` array at the top of `components/LoginPage.tsx`.
  Replace the Unsplash URLs with your own hospital photography (place files in
  `/public/images` and reference them as `/images/your-file.jpg`, or use a CDN).
- **Timing**: change `intervalMs` (autoplay delay) or `transitionMs` (crossfade
  speed) on the `<ImageCarousel />` usage in `LoginPage.tsx`.
- **Auth wiring**: the `handleSubmit` function in `LoginPage.tsx` has a `TODO`
  marking where to call your real authentication endpoint.
- **Colors**: brand colors live in `tailwind.config.ts` under `theme.extend.colors.brand`.
