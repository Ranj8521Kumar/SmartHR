# TODO: Fix AI Interview Transcript Schema

## Issue
Mongoose error: `interviews.9.aiInterview.transcript: Cast to string failed for value "[]" (type Array)`. The schema defines `transcript` as `String`, but code tries to save an array of objects.

## Steps
- [ ] Update `models/Application.js` to change `aiInterview.transcript` from `String` to an array of objects with fields: `id` (Number), `speaker` (String), `timestamp` (Date), `message` (String).
- [ ] Restart the backend server to apply schema changes.
- [ ] Test the AI interview functionality to ensure transcripts save correctly as arrays.
- [ ] Verify frontend can handle the transcript as an array (if needed, update parsing logic).

## Notes
- This is Option 1 from the task: Update schema to store structured transcript data.
- Existing data might need migration if there are string transcripts, but assuming this is for new interviews.
