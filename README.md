# lightHouse\*

Website for **lightHouse Speciality Coffee** — a single-page site with a night-first palette,
a scroll-driven V60 brew sequence, a filterable menu and a working table-booking system.

![no build step](https://img.shields.io/badge/build-none-0A0C0F) ![vanilla](https://img.shields.io/badge/stack-html%20%C2%B7%20css%20%C2%B7%20js%20%C2%B7%20glsl-FFB04A)

## Run it

```bash
python3 server.py            # http://localhost:8000
python3 server.py 3000       # or any port
```

`server.py` serves the static site **and** the reservations API. Nothing to install — Python 3
standard library only. Bookings are stored in `bookings.db` (SQLite), created on first run.

To serve the pages without the booking service, any static server works:

```bash
python3 -m http.server 8000
```

## Layout

```
index.html              the whole page
assets/css/style.css    tokens, layout, the two themes, scene colours
assets/js/main.js       motion: WebGL beam, dust, cursor, scroll choreography, brew sequence
assets/js/app.js        menu filtering and the booking flow
server.py               static server + bookings API (SQLite)
```

## Booking API

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/health` | service check, returns seat capacity |
| `GET` | `/api/availability?date=YYYY-MM-DD` | seats already taken, per sitting |
| `POST` | `/api/bookings` | create a booking, returns the stored row |
| `GET` | `/api/bookings?date=YYYY-MM-DD` | the day's book, for the counter |

Sittings run every half hour from opening until 90 minutes before close, 14 seats each.
The server refuses overbooked sittings, closed hours, past dates and duplicate references.

The front end picks its storage automatically: the claude.ai artifact database when the page is
published there, this API when it answers, and `localStorage` otherwise — the booking panel says
which one is live.

## Theme

The page is night-first. The **Evening / Daylight** switch in the header rewrites the colour
tokens, and everything reads from them: the illustrations, the brew rig, even the WebGL shader,
which samples the CSS variables each time the theme changes. The choice is remembered per browser.

## Motion

GSAP + ScrollTrigger with Lenis for smooth scrolling, three.js for the background shader, and
plain Canvas 2D for dust and steam. Every effect is behind a capability check, and
`prefers-reduced-motion` turns all of it off.

## Hosting

**GitHub Pages** (static site, no booking service). Push to `main` and the workflow in
`.github/workflows/pages.yml` publishes the repo. One switch is needed first:
*Settings -> Pages -> Build and deployment -> Source: **GitHub Actions***. The site then lands at
`https://<user>.github.io/<repo>/`. Everything but reservations works; with no API to reach, the
booking panel says so and keeps bookings in the visitor's own browser.

**Render** (site + working reservations). *New -> Blueprint* pointed at this repo reads
`render.yaml`: it runs `python3 server.py` with `HOST=0.0.0.0`, serves the same pages and keeps
`bookings.db` on a mounted disk. Any host that runs Python works the same way — the server reads
`PORT` and `HOST` from the environment, and needs no packages.

## Still to fill in

Address, phone and email in the Visit section are placeholders, marked in dashed terracotta.
Menu prices and opening hours are plausible defaults — swap them for the real ones in
`assets/js/app.js` (`MENU`) and `index.html`.
