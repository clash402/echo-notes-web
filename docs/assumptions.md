# Echo Notes Web Assumptions

## Step 1: Audio Recording Hook

- Browsers used for v1 support `navigator.mediaDevices.getUserMedia` and `MediaRecorder`.
- Recording format is selected from supported types in this order: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/wav`.
- Recording length limits (30-120s typical) are enforced at the UI layer later, not inside the low-level hook.

## Step 2-5: Capture, API, Notes, Detail

- All API responses are wrapped in `{ data, meta }`; the client validates `data` with Zod and safely accepts unknown `meta` fields.
- `meta.request_id` is present on API failures in most cases; when available it is logged and surfaced in UI errors.
- `GET /notes` may vary by backend version, so summary fields are normalized using fallback order:
  `reflection_summary` -> `summary` -> `reflection.summary`.
- `GET /notes/:id` may return `linked_notes` as IDs or objects; both are normalized for display.
- `POST /notes` currently stores transcript + reflection only in v1 web flow because audio upload persistence endpoint is not yet part of the contract.
