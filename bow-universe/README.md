# BOW Universe

A polished full-stack MVP social map for the Babson–Olin–Wellesley community. People are the nodes, confirmed human relationships form the constellations, and search/filtering illuminates people in one shared universe.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm start
```

Open `http://localhost:3000`. The demo works immediately with 42 fictional profiles and does not require credentials.

## Production data

The included Express API provides a zero-config demo backend. To move from demo storage to production, create a Supabase project, run `supabase/migrations/001_initial_schema.sql`, then set the values documented in `.env.example`. The schema includes UUID entities, connection confirmation states, and row-level security so people can edit only their own profile data.

## Features

- Canvas-rendered force network with pan, zoom, touch, hover, focus, and progressive edge disclosure
- 42 fictional students balanced across all three schools
- Full profiles with leadership, projects, skills, links, and discovery suggestions
- Full-universe search and filters—no separate results page
- Four-step profile onboarding
- Pending/confirmed/rejected connection model and request endpoint
- Responsive mobile profile sheet and reduced-motion support
- Health endpoint at `/health`

## Render

The repository's root `render.yaml` defines the `bow-universe` Node service with this folder as its root directory. No secrets are required for the seeded MVP.
