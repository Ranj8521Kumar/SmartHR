# AI Interview Recording Upload to Cloudinary

## Overview
Implement full audio/video recording of AI interviews and upload to Cloudinary for storage and retrieval.

## Tasks

### 1. Database Schema Updates
- [ ] Update Application.js model to add recording URL fields in aiInterview schema
- [ ] Add fields for localVideoRecordingUrl and combinedRecordingUrl

### 2. Backend Upload Service
- [ ] Create media upload service in backend/utils/mediaUpload.js
- [ ] Add endpoint for uploading video recordings to Cloudinary
- [ ] Update applicationController.js with recording upload endpoint

### 3. Frontend Recording Service
- [ ] Create recordingService.js for MediaRecorder API integration
- [ ] Implement start/stop recording functions
- [ ] Handle recording permissions and error states

### 4. Frontend Integration
- [ ] Modify AIInterviewPage.jsx to integrate video recording
- [ ] Start recording when interview begins
- [ ] Stop recording when interview ends
- [ ] Upload recording to backend on completion

### 5. Service Updates
- [ ] Update interviewService.js to include recording upload methods
- [ ] Modify submitInterviewResults to upload local recordings

### 6. Testing
- [ ] Test recording permissions and functionality
- [ ] Test upload to Cloudinary
- [ ] Test complete interview flow with recordings

## Technical Details
- Use MediaRecorder API for browser-based recording
- Record in WebM format for broad compatibility
- Upload recordings as video files to Cloudinary
- Store URLs in MongoDB for later retrieval
- Handle both Vapi recordings and local video recordings
