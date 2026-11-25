# Talha Masood — Portfolio

Personal portfolio site built with Next.js (App Router), React, TypeScript and Tailwind CSS, deployed on Vercel.

## Local development

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in your email and phone in `.env.local`, then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other commands:

```bash
npm run build      # production build
npm run lint       # ESLint
npm run test:e2e   # static checks in tests/e2e
```

## Content

- Page text, experience, projects and skills live in `src/data/portfolio.ts`.
- To replace the profile photo, overwrite `public/images/profile.jpg` with a square or portrait image (1200px or larger).
- To update the resume, overwrite `public/Talha_Masood_Resume.pdf`.

The resume and photo are committed, so keep this repository private.

## Deploy (Vercel)

1. Push the repository to a private GitHub repository.
2. In Vercel, choose **Add New → Project** and import it. The defaults for Next.js need no changes.
3. Under **Settings → Environment Variables**, add:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_CONTACT_EMAIL` | Email shown on the site |
   | `NEXT_PUBLIC_CONTACT_PHONE` | Phone shown on the site |
   | `NEXT_PUBLIC_SITE_URL` | The site's public URL, e.g. `https://your-project.vercel.app` |

   `NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.
4. Every push to `main` deploys to production; other branches get preview URLs.

### Custom domain

In the Vercel project, open **Settings → Domains**, add the domain and create the DNS records Vercel shows. Then set `NEXT_PUBLIC_SITE_URL` to the new domain and redeploy.

## Troubleshooting

- **Contact details missing on the live site:** the `NEXT_PUBLIC_CONTACT_*` variables are not set in Vercel, or were added after the last build. Set them and redeploy.
- **Link previews or the sitemap point at localhost:** `NEXT_PUBLIC_SITE_URL` is not set. Set it and redeploy.
