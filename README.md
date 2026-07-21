# l1nux Portfolio

A responsive purple-and-black cyber security portfolio for **l1nux**, built with plain HTML, CSS, and JavaScript.

## Features

- Animated GIF profile image and aurora background
- TryHackMe rank, room, badge, streak, and level display
- Daily TryHackMe data refresh with GitHub Actions
- GitHub, write-ups, and Discord links
- Filterable certificate cards
- Safe simulated terminal with command history
- Responsive and reduced-motion-friendly design

## Local preview

The site loads JSON files with `fetch`, so preview it through a local server instead of opening `index.html` directly:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

1. Push these files to a GitHub repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.
5. Open **Actions → Update TryHackMe stats** and run it once manually.

The scheduled workflow runs once per day. The page also attempts a direct live profile request in the visitor's browser and falls back to `data/stats.json` when TryHackMe blocks that request.

## Add certificate links

Edit [`data/certificates.json`](data/certificates.json). Replace an empty `url` with the public certificate URL:

```json
{
  "title": "Certificate name",
  "provider": "Provider",
  "category": "security",
  "url": "https://example.com/verify"
}
```

Supported categories are `tryhackme`, `security`, and `other`.
