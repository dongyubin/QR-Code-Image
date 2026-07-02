import { SiteConfig } from "@/types/siteConfig";

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://qr-code-image.wwkejishe.top";

export const SOURCE_CODE_URL = "https://github.com/dongyubin/QR-Code-Image";
export const PRO_VERSION = "https://qr-code-image.wwkejishe.top";

const TWITTER_URL = 'https://x.com/wwkjs666'
const BSKY_URL = ''
const EMAIL_URL = 'itxh888@gmail.com'
const GITHUB_URL = 'https://github.com/dongyubin/QR-Code-Image'
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL

export const siteConfig: SiteConfig = {
  name: "Free Online QR Code Image",
  tagLine: 'Scan and create QR code images',
  description:
    "Scan QR code images from screenshots, create QR code images from URLs or text, and download PNG, JPG, SVG, or ZIP files.",
  url: BASE_URL,
  authors: [
    {
      name: "QR Code Image",
      url: BASE_URL,
    }
  ],
  creator: '@qrcodeimage',
  socialLinks: {
    discord: DISCORD_URL,
    twitter: TWITTER_URL,
    github: GITHUB_URL,
    bluesky: BSKY_URL,
    email: EMAIL_URL
  },
  themeColors: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  defaultNextTheme: 'system', // next-theme option: system | dark | light
  icons: {
    icon: "/favicon.ico",
    shortcut: "/logo.png",
    apple: "/logo.png", // apple-touch-icon.png
  },
}
