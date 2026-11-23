# Prepared for Vercel — not deployed

The public scrapbook is a Vite site. The activation QR and original PDF require the included Node function at `api/voucher.js`; they are never static public assets.

| Setting | Value |
| --- | --- |
| Root Directory | `bawanya-birthday` if the repository contains the parent Pics folder; otherwise this project folder |
| Framework | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

`vercel.json` includes `private/activation-qr.png` and `src/data/voucher.pdf` in the function bundle using Vercel's [includeFiles setting](https://vercel.com/docs/project-configuration/vercel-json#functions). The handler reads them from the project root, following Vercel's [Node file-access guidance](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions). Do not move either private file into `public` or import it in frontend code. Upload the source project through a **private repository**, because it contains the original redeemable files. Deploying only `dist` cannot provide protected voucher access.

## Required server environment

Configure these on Vercel before deploying, for every environment where access should work:

- `VOUCHER_ACCESS_PASSWORD`: the owner’s complete full name, all lowercase with single spaces, configured privately (16–256 characters). The frontend asks Bawanya to remember it; never put the answer in frontend code or this documentation. Update this value in Vercel before redeploying these changes.
- `VOUCHER_SESSION_SECRET`: an independent random secret of at least 32 characters. Keep it private; Bawanya does not need it. Generate one locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`.

Never prefix either name with `VITE_`. Do not put values into frontend code, deployment URLs, or committed files. `.env.example` contains names only. Missing or short values cause a closed 503 response; no private file is sent. Changing the session secret invalidates existing sessions. No production credentials have been created for you.

The server verifies the password with a constant-time digest comparison and issues a signed, host-bound session lasting ten minutes. The cookie is HttpOnly and SameSite=Strict, and Secure on deployed HTTPS hosts. Both private GET endpoints verify it independently. Responses use `private, no-store` and no-index headers. Only two fixed file names are allowed. Same-origin JSON login is required; five failed attempts per IP per function instance trigger a 15-minute wait. This small in-memory limit is not a distributed rate limiter; keep the answer out of public source. Any additional Vercel-wide rate limit would be a hosting setting, not part of this local project.

After a successful unlock, the browser shows the **original PNG**, including its quiet zone, without rebuilding the QR. Download fetches the **original PDF** and saves it as `Bawanya-Mintpay-Gift-Voucher.pdf`. The site never visits, activates or redeems the QR destination. An authorized recipient can save the original files, as intended.

## Included background music

The included local soundtrack is Dream Culture by Kevin MacLeod (CC BY 4.0), a relaxed piano instrumental. The 128 kbps copy in `src/data/background-music.mp3` has gentle edge fades for looping. A Credits link beside the controls opens `music-credits.html` with the required attribution and license link; keep both when sharing or deploying. No third-party media requests occur during playback. Source: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046 .

The soundtrack attempts audible playback from the beginning on page load; if the browser blocks autoplay, the first click starts it. See https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay . Music defaults to 50%, fades in over 1.1 seconds, and pauses synchronously before video playback. After the video ends, the soundtrack restarts from the beginning with a fade. Pausing the video resumes the soundtrack at its previous position. The master control mutes music and the original Web Audio sparkle; volume is adjustable. The hover effect runs once per photograph per page session, with a 1.2-second cooldown, only after a deliberate mouse entry on a wide, fine-pointer display. Scrolling and touch do not trigger it.

## Local preview

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
```

Fill the two values in `.env.local` locally; it is ignored by Git. Then:

```powershell
npm.cmd run build
npm.cmd run preview
```

Open the printed localhost URL. Development (`npm.cmd run dev`) and preview use the same voucher handler as Vercel and block direct private-file paths. The static `START-BIRTHDAY.cmd` / `dist/OPEN-BIRTHDAY.html` still opens the scrapbook without Node, including video and the public voucher front. Its reverse explains that the secret needs the hosted site; it contains no private QR or PDF. Keep the complete `dist` folder together.

## Validation

```powershell
npm.cmd run test:security
npm.cmd run verify
npm.cmd run build
node scripts/verify-media.mjs
```

Build includes a privacy guard that decodes the original QR internally and rejects its private bytes, activation URL, original PDF, base64 equivalents, source maps, or server configuration names in `dist`. It does not print the QR payload. All 65 source memories and the supplied public artwork/video remain unchanged. Local QA reports and screenshots are in `.qa` and excluded from the public output.

The real browser checks covered automatic unmuted playback, three-click unwrapping, the 3D flip, wrong/right passwords, original QR display, the actual PDF download, desktop/mobile sizing and photo sounds. The downloaded PDF's SHA-256 matches its source and it renders successfully. The added instrumental was decoded as non-silent. Browser playback, scrolling, mute and video priority were checked. Direct audible monitoring was unavailable. Video audio decoded and was non-silent; direct audible monitoring of its dialogue was unavailable. Vercel's deployed runtime has not been exercised because deployment was explicitly deferred.



Gift sounds are original procedural Web Audio ribbon swishes, paper crinkles and a final sparkle. Each click advances one stage only, rapid clicks during animation are ignored, and the master sound control mutes the effects. Reduced motion still requires three clicks.

During each unwrapping stage, music drops within 100 ms to 12% of its selected level, capped at 2.5% absolute volume, then gently returns after the stage. Gift effects retain their own level at the normal 50% music setting. The closing wish reads “Happy Birthday, Suduu! ❤️”.

The correct-answer celebration runs only after the server accepts the challenge. It uses a body-level visual overlay and locally synthesized applause; no new assets, services or environment variables are needed. It respects sound mute and reduced motion.
