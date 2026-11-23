# For Bawanya, with love

## Final birthday polish

The sequence is **personal welcome → envelope/video surprise → all 65 memories → three-click gift opening → two-sided Mintpay card → denim note → tomorrow's secret**. The initial envelope click unlocks and automatically plays the original video with sound. Three separate taps untie the ribbon, unwrap the paper and reveal the voucher, with original Web Audio rustles and a reveal sparkle. The actual public **LKR 6,100** artwork flips into a private password form; successful server verification reveals the original activation QR and enables downloading the original PDF.

The soundtrack tries to start from the opening page at 50%; if autoplay is blocked, the first click starts it. The sound control adjusts the music and an original Web Audio photo sparkle. The local soundtrack is Dream Culture by Kevin MacLeod (CC BY 4.0), a gentle piano instrumental. Required attribution is available through Credits beside the controls. It continues while scrolling. Music is given lower priority than video dialogue. Hover sounds are limited to intentional desktop mouse entry, one per photo per page session, with a cooldown.

**Before deployment:** configure `VOUCHER_ACCESS_PASSWORD` and `VOUCHER_SESSION_SECRET` as described in [DEPLOYMENT.md](DEPLOYMENT.md). Neither value belongs in frontend code. The QR and original PDF are private server files and are excluded from the public build. No deployment has been made.

The downloaded PDF was checked against its source and rendered successfully. Browser video playback was unmuted and completed; its AAC stereo stream decoded as non-silent. Direct audible monitoring was unavailable. Background music playback, scrolling, mute and video priority were checked in the browser.

A local React + Vite birthday scrapbook, made for 24 November. The original timeline, image pipeline, photo viewer and portable build are preserved, with an animated personal note, original teddy and bunny illustrations, handwritten captions, a mouse heart trail, and an opening birthday gift at the end.

## Open the website

Double-click **`START-BIRTHDAY.cmd`**, or open **`dist/OPEN-BIRTHDAY.html`** in your browser. This portable version opens the scrapbook, video and voucher front directly from disk. The protected QR and PDF need the server; use the local preview instructions in DEPLOYMENT.md to test them. Keep the whole `dist` folder together.

For live editing, run this command from the project folder:

```powershell
npm.cmd run dev
```

Then open http://127.0.0.1:5173 in your browser. Keep the terminal open while viewing. Close it or press Ctrl+C when finished. If dependencies need reinstalling, run `npm.cmd install` first.

## Edit your memories

The central editable file is **`src/data/memories.json`**. Each of the 65 photographs has:

- `source`, `filename`, and (when relevant) `archiveEntry`: unchanged original filenames.
- `date`: actual date in `YYYY-MM-DD` format, used to sort the timeline.
- `displayDate`: the date as shown on the page, such as `20 February 2024`.
- `originalComment`: the exact comment originally extracted from the filename, including its original spelling. An empty string means the filename contained only a date.
- `caption`: the refined, casual caption shown on the website. Edit freely.
- `captionBasis`: whether that note comes from a filename comment or only from the visible photograph.
- `sourceHistory`: previous source names when an existing image was renamed; image IDs and optimized paths stay stable.
- `image` and `smallImage`: local, optimized copies used by the website.
- `width`, `height`, and `background`: original orientation and photo-derived ambient colours. Edit `background.paperPrimary`, `paperSecondary` and `paperAccent` to override a memory's scrapbook lighting; `hue` and the earlier dark palette are retained too.
- `review`: notes for information that was missing in the filename.

All 65 photos now have a short, casual caption. Thirty had no personal comment in their filenames; their `originalComment` remains empty and their `review` explains that the new caption is based only on the visible photo. Those captions describe selfies, food or the person in the picture without assigning an unsupported event or location. Archive entries use the date and comment from their containing ZIP, rather than WhatsApp's export timestamps. Same-day photos retain a stable order; no time-of-day sequence is assumed.

Date decisions are recorded in `src/data/date-corrections.json`. The three earlier confirmations remain: `1st march 2002.zip` → 1 March 2024; `7th match 2026…` → 7 March 2026; `6th nov at chicken depot.jpeg` → 6 November 2026. This update also corrects the tuk-tuk and brought-flowers photos from 20 February 2024 to **20 February 2025**: their current source filenames explicitly say 2025, and SHA-256 hashes prove they are the same images as the old entries. The other 20 memories dated 2024 retain their recorded dates. No source photographs were renamed or modified by this update. See `.qa/date-audit.json` for evidence.

The exact homepage text is editable in `src/components/PersonalMessage.jsx`. The closing message is in `BirthdayEnding` in `src/main.jsx`. Original SVG character art is in `src/components/ScrapbookIllustrations.jsx`; the existing layout CSS remains in `src/styles.css`, with the new visual layer in `src/scrapbook.css`.

## Privacy and portability

All photos and fonts are served locally. No external image hosts, analytics, or remote media services are used. The same-origin voucher API protects the private QR and PDF. Optional music is local. The originals remain in the parent `Pics` directory, including the three ZIP files. Browser images are proportionally resized WebP copies in `public/memories/`; nothing is cropped. The website does not need access to the originals once these copies exist.

Nothing has been published. To view on another computer, copy the entire `dist` folder and open `OPEN-BIRTHDAY.html`. The standard `dist/index.html` is also available for a local HTTP server; use the portable file when opening directly from disk.

## Rebuild or add photographs

```powershell
npm.cmd run prepare:memories
npm.cmd run verify
npm.cmd run build
```

The preparation script scans the parent workspace recursively, including JPEG, PNG, WebP and ZIP contents. It skips this project, dependencies and Git metadata. It reads images directly from ZIPs without extracting or changing the archives, respects EXIF orientation, creates two local sizes, and estimates a complementary colour palette from each photo.

To protect your edits, rerunning preparation writes **`src/data/memories.generated.json`** when `memories.json` already exists. It retains known image IDs by matching photograph bytes, including renamed sources, and carries forward original comments and refined captions. Compare and merge the generated file yourself rather than replacing edited captions. Newly discovered photographs appear in the generated file. Supply confirmed date corrections in `date-corrections.json` as needed.

## Experience and accessibility

The intro reveals no photographs. The supplied note fades in sentence by sentence and can be replayed with “Read my note again.” “Okayyy, let's go! 💗” leads to the envelope/video surprise and then three year chapters, with alternating portrait, landscape, journal and spotlight treatments. Stickers sit outside image areas, and only active memory characters animate. Photo hues are retained, with lighter complementary ambient colours for the paper aesthetic.

Click or tap a photo to view it uncropped; use Previous/Next or the left/right arrow keys, and Escape to close. The native dialog traps focus and returns it to the photo. After the last memory, three separate taps on the gift box run its ribbon, paper and voucher sequence. The card settles in view and can be flipped into the full-name challenge. The answer is stored only in the server environment. Its teddy can repeat the celebration. The exact denim message remains intact, followed by the small tomorrow teaser as the final content.

The normal cursor remains visible. The trail is limited to 24 particles, throttled with requestAnimationFrame and a time/distance guard, and each particle removes itself when its animation finishes. It is disabled below 701px, on coarse/touch pointers, in the photo viewer, and when reduced motion is requested. Reduced-motion preferences also disable character animation, gradual text reveals, smooth scrolling, particles, photo entrance motion and confetti; all text remains readable.

## Verification

`npm.cmd run verify` independently discovers the original photos and archive contents; checks one-to-one inclusion, SHA-256 hashes, confirmed dates, chronology, display dates, decoded image dimensions and derivative aspect ratios. It also checks the original comments and the two date changes against the pre-update data when that local audit snapshot exists. Its report is saved in `.qa/verification.json`. `node scripts/check-preview.mjs http://127.0.0.1:5173/` checks that the running local site serves all 130 image derivatives with the correct bytes. Contact sheets, date evidence, browser checks and rendered previews are kept in `.qa/` for local inspection.

`scripts/migrate-scrapbook.mjs` is the one-time editorial migration used for this update. It is not part of the normal build or photo preparation; edit `memories.json` directly for future caption changes.




A server-accepted full-name answer now triggers a short page-wide confetti celebration, a waving teddy, “Yayyy, you got it!” and original synthesized applause. Background music dips during the applause, and the master mute also mutes this effect. The overlay dismisses itself, never blocks interaction, and shows a static message without confetti when reduced motion is preferred. Incorrect answers never celebrate.
