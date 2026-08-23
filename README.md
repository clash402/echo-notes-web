# Echo Notes Web

The Next.js interface for Echo Notes provides a voice-first capture flow and a timeline for reviewing stored reflections.

## Current Experience

- Record audio in supported browsers
- Transcribe a recording and generate a structured reflection
- Review transcript and reflection before saving
- Browse notes in reverse chronological order
- Open note details and related-note links

Routes:

- `/` — capture and reflection
- `/notes` — note timeline
- `/notes/{id}` — note detail

The API is maintained in [echo-notes-api](https://github.com/clash402/echo-notes-api).

## Local Development

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` to the Echo Notes API, normally `http://localhost:8000`.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

Automated web tests are not currently configured.

## Current Integration Status

The `main` branch client schemas and request field names have drifted from the current API contracts. The capture, save, list, and detail flows require contract alignment and integration tests before this client should be described as production-ready.
