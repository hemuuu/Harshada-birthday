# Harshada's Room ♡

A mobile-first pixel-room birthday experience inspired by the supplied `a little party room` reference.

## Modes

- `/?mode=home` — landing room
- `/?mode=wish` — public wishers link; visitors enter name + message, no account
- `/?mode=harshada` — private birthday experience; tap notes, then open the celebration overlay
- `/?mode=admin` — admin control panel

## Current prototype

The included prototype works immediately with local browser storage, so you can click through all four modes without a backend. The admin password in this demo is `harshada5k`.

For the real shared version, connect the app to Supabase (the SQL schema is included). Public visitors should be allowed to insert/read visible notes. Admin deletes/uploads should be handled by a server-side endpoint or Supabase Edge Function; never put a Supabase service-role key in the browser.

## Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and add your Supabase URL/key when you are ready to make notes shared across devices.

## What I need from you for the final version

1. 5–10 photos of you + Harshada for the polaroids.
2. The exact line you want instead of/alongside `Vihag ev mukt` if capitalization/spelling is specific.
3. Your preferred admin password.
4. Whether the Harshada link should be completely secret (unguessable URL) or just a `?mode=harshada` link.
5. Birthday date/time if you want the room to unlock only at a particular time.
6. Optional: a portrait/reference for the pixelated Raja Ravi Varma artwork you want used.
