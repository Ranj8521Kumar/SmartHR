# Vapi Interview Start Fix

## Issue
- Vapi interview start failing with 400 Bad Request error
- Root cause: startInterviewWithAssistant method was passing conflicting configurations (model, voice, transcriber) that override the Vapi assistant settings

## Changes Made
- [x] Modified `startInterviewWithAssistant` method in `vapiService.js`
- [x] Removed hardcoded model, voice, and transcriber configurations
- [x] Now only passes assistantId and minimal overrides (recordingEnabled)
- [x] This allows Vapi assistant to use its predefined settings

## Testing Required
- [ ] Test interview start functionality
- [ ] Verify no more 400 errors
- [ ] Confirm interview proceeds normally
- [ ] Check transcript and audio work correctly

## Files Modified
- SmartHR/frontend/src/services/vapiService.js
- SmartHR/backend/server.js
