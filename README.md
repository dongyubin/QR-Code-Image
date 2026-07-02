# QR Code Image

Browser-first QR code image scanner and generator for screenshots, URLs, image links, Wi-Fi credentials, common QR code types, and batch SVG exports.

Production URL: https://qr-code-image.wwkejishe.top

## Features

- Scan QR code images from uploaded files, pasted screenshots, drag-and-drop images, or camera input.
- Create QR code images from URLs, text, email, SMS, phone numbers, X links, Bitcoin payment URIs, Wi-Fi credentials, PDF URLs, and hosted image URLs.
- Generate random QR content by selected QR code type for testing, placeholders, and mockups.
- Download generated QR codes as PNG, JPG, or SVG.
- Batch-generate multiple QR code SVG files and export them as a ZIP archive.
- Use a Wi-Fi form with SSID, password, security type, and hidden network options instead of raw Wi-Fi payload editing.
- Browse a QR Code Types section with descriptions and one-click handoff into the generator.
- Read SEO-focused FAQ content in a right-arrow accordion layout.
- Multilingual route support with English, Chinese, and Japanese navigation/content files.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- next-intl
- qrcode for QR image generation
- html5-qrcode for image, screenshot, and camera scanning
- JSZip for batch ZIP export
- Vercel Analytics
- pnpm

## Project Structure

```text
app/                  Next.js app routes, sitemap, robots, API routes
components/home/      Main QR Code Image workspace and landing sections
components/header/    Top navigation
components/footer/    Footer navigation
config/site.ts        Site name, production URL, metadata source
i18n/messages/        English, Chinese, and Japanese navigation text
lib/qr-content.ts     Features, use cases, and FAQ content
public/               Logo, favicon, and static assets
```

## Local Development

Requirements:

- Node.js 20.9 or newer
- pnpm 11.7.0 or newer

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Start the production server locally:

```bash
pnpm start
```

## Environment Variables

For production on Vercel, keep the public site URL aligned with the deployed domain:

```env
NEXT_PUBLIC_SITE_URL=https://qr-code-image.wwkejishe.top
NEXT_PUBLIC_LOCALE_DETECTION=false
NEXT_PUBLIC_OPTIMIZED_IMAGES=false
```

Optional analytics and email/newsletter variables are listed in `.env.example`. The newsletter UI is currently hidden in the footer, but the API files remain in the project for future use.

## SEO And Domain Consistency

The production domain is defined in `config/site.ts`:

```ts
export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://qr-code-image.wwkejishe.top";
```

The following files all use `siteConfig.url`, so canonical URLs, sitemap URLs, and robots.txt sitemap references stay on the same domain:

- `lib/metadata.ts`
- `app/sitemap.ts`
- `app/robots.ts`

Before deploying, make sure Vercel uses:

```env
NEXT_PUBLIC_SITE_URL=https://qr-code-image.wwkejishe.top
```

Expected production URLs:

- Canonical home URL: `https://qr-code-image.wwkejishe.top`
- Sitemap: `https://qr-code-image.wwkejishe.top/sitemap.xml`
- Robots: `https://qr-code-image.wwkejishe.top/robots.txt`

## Vercel Deployment

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Set `NEXT_PUBLIC_SITE_URL` to `https://qr-code-image.wwkejishe.top`.
4. Use the default install command:

```bash
pnpm install
```

5. Use the default build command:

```bash
pnpm build
```

6. Add the custom domain `qr-code-image.wwkejishe.top` in Vercel.

## Notes

- The scanner and generator run in the browser for a faster and more privacy-friendly workflow.
- Uploaded images used for scanning do not need to be sent to a server by the main tool.
- Image-to-QR workflows encode hosted image URLs. If future uploads are required, add object storage such as Cloudflare R2 or S3.

## License

MIT
