# Interview Recordings Feature Documentation

## Overview

The Interview Recordings feature allows HR managers and recruiters to upload, store, and manage interview recordings linked to job applications. All recordings are stored securely in Cloudinary and matched to the respective applicant.

## Database Collection

A new collection called `interview_recordings` has been created in the `hrms` database.

## Features

- **Upload video/audio recordings** (MP4, WebM, QuickTime, AVI, MP3, WAV, etc.)
- **Automatic Cloudinary storage** in the `SmartHR/InterviewRecordings` folder
- **Link recordings to applications and applicants**
- **Support for multiple interview types**: AI voice, video, phone, in-person
- **Automatic metadata extraction**: file size, duration, format
- **Transcript storage** for AI interviews (Vapi integration)
- **Role-based access control**
- **Recording download with secure URLs**

---

## Setup Instructions

### 1. Environment Variables

Add your Cloudinary credentials to the `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**How to get Cloudinary credentials:**
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Sign up or log in
3. Go to Dashboard → Account Details
4. Copy your Cloud Name, API Key, and API Secret

### 2. Install Dependencies

The following packages are already installed:
- `cloudinary` - Cloudinary SDK
- `multer` - File upload handling

### 3. Restart Backend Server

```bash
cd SmartHR/backend
npm install
npm run dev
```

---

## API Endpoints

### Base URL
```
http://localhost:5000/api/v1/interview-recordings
```

---

### 1. Upload Interview Recording

**Endpoint:** `POST /upload`
**Access:** HR Manager, Manager, Admin
**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
```javascript
{
  recording: File,                    // Video or audio file (required)
  applicationId: String,              // Application ID (required)
  interviewType: String,              // 'ai_voice' | 'video' | 'phone' | 'in_person' (optional)
  notes: String,                      // Interview notes (optional)
  vapiCallId: String,                 // Vapi call ID for AI interviews (optional)
  transcript: String,                 // Interview transcript (optional)
  duration: Number                    // Duration in seconds (optional)
}
```

**Example (JavaScript/Axios):**
```javascript
const formData = new FormData();
formData.append('recording', fileInput.files[0]);
formData.append('applicationId', '507f1f77bcf86cd799439011');
formData.append('interviewType', 'ai_voice');
formData.append('notes', 'Excellent technical skills demonstrated');
formData.append('duration', '1800'); // 30 minutes

const response = await axios.post(
  'http://localhost:5000/api/v1/interview-recordings/upload',
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "673f8a9b5e4d3c2a1b0f9e8d",
    "application": "507f1f77bcf86cd799439011",
    "applicant": {
      "_id": "507f1f77bcf86cd799439012",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "job": {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Senior Software Engineer",
      "department": "Engineering"
    },
    "interviewType": "ai_voice",
    "recordingUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/SmartHR/InterviewRecordings/interview_507f1f77bcf86cd799439012_1730214123456.mp4",
    "cloudinaryPublicId": "SmartHR/InterviewRecordings/interview_507f1f77bcf86cd799439012_1730214123456",
    "cloudinaryResourceType": "video",
    "fileName": "interview_recording.mp4",
    "fileSize": 52428800,
    "duration": 1800,
    "format": "mp4",
    "status": "ready",
    "createdAt": "2025-10-29T10:00:00.000Z"
  }
}
```

---

### 2. Get All Interview Recordings

**Endpoint:** `GET /`
**Access:** HR Manager, Manager, Admin

**Query Parameters (optional):**
- `applicationId` - Filter by application
- `applicantId` - Filter by applicant
- `jobId` - Filter by job
- `interviewType` - Filter by interview type
- `status` - Filter by status

**Example:**
```javascript
const response = await axios.get(
  'http://localhost:5000/api/v1/interview-recordings?interviewType=ai_voice&status=ready',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

### 3. Get Single Recording

**Endpoint:** `GET /:id`
**Access:** Authenticated users (own recordings) or HR/Manager/Admin

**Example:**
```javascript
const response = await axios.get(
  'http://localhost:5000/api/v1/interview-recordings/673f8a9b5e4d3c2a1b0f9e8d',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

### 4. Get Recordings by Application

**Endpoint:** `GET /application/:applicationId`
**Access:** Authenticated users

**Example:**
```javascript
const response = await axios.get(
  'http://localhost:5000/api/v1/interview-recordings/application/507f1f77bcf86cd799439011',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

### 5. Get Recordings by Applicant

**Endpoint:** `GET /applicant/:applicantId`
**Access:** Own applicant or HR/Manager/Admin

**Example:**
```javascript
const response = await axios.get(
  'http://localhost:5000/api/v1/interview-recordings/applicant/507f1f77bcf86cd799439012',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

### 6. Update Recording

**Endpoint:** `PUT /:id`
**Access:** HR Manager, Manager, Admin

**Request Body:**
```json
{
  "notes": "Updated notes",
  "feedback": "Strong candidate, recommend for next round",
  "status": "ready",
  "transcript": "Full interview transcript here...",
  "interviewer": "507f1f77bcf86cd799439014"
}
```

---

### 7. Delete Recording

**Endpoint:** `DELETE /:id`
**Access:** Admin only

**Example:**
```javascript
const response = await axios.delete(
  'http://localhost:5000/api/v1/interview-recordings/673f8a9b5e4d3c2a1b0f9e8d',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

### 8. Get Download Link

**Endpoint:** `GET /:id/download`
**Access:** Authenticated users (own recordings) or HR/Manager/Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://res.cloudinary.com/your-cloud/video/upload/fl_attachment/SmartHR/InterviewRecordings/interview_xxx.mp4",
    "fileName": "interview_recording.mp4"
  }
}
```

---

## Database Schema

### InterviewRecording Model

```javascript
{
  application: ObjectId (ref: Application),
  applicant: ObjectId (ref: User),
  job: ObjectId (ref: Job),
  interviewType: String (enum: ['ai_voice', 'video', 'phone', 'in_person']),

  // Cloudinary storage
  recordingUrl: String (Cloudinary secure URL),
  cloudinaryPublicId: String,
  cloudinaryResourceType: String,

  // File metadata
  fileName: String,
  fileSize: Number (bytes),
  duration: Number (seconds),
  format: String,

  // Interview details
  interviewDate: Date,
  interviewer: ObjectId (ref: User),

  // AI Interview (Vapi)
  vapiCallId: String,
  transcript: String,
  transcriptUrl: String,

  // Status and notes
  status: String (enum: ['uploaded', 'processing', 'ready', 'failed', 'archived']),
  notes: String,
  feedback: String,

  // AI Analysis (optional)
  aiAnalysis: {
    sentiment: String,
    keyPoints: [String],
    score: Number,
    confidence: Number
  },

  // Metadata
  uploadedBy: ObjectId (ref: User),
  isPublic: Boolean,
  expiresAt: Date,

  createdAt: Date,
  updatedAt: Date
}
```

---

## Finding Cloudinary URLs

### Method 1: Cloudinary Dashboard
1. Log in to [cloudinary.com](https://cloudinary.com)
2. Go to **Media Library**
3. Navigate to **SmartHR** → **InterviewRecordings** folder
4. Click on any recording
5. Copy the **Secure URL** from the right panel

### Method 2: MongoDB Database
1. Connect to MongoDB:
   ```bash
   mongosh "mongodb+srv://your-connection-string"
   ```
2. Query the collection:
   ```javascript
   use hrms
   db.interview_recordings.find({}).pretty()
   ```
3. Look for the `recordingUrl` field in each document

### Method 3: API Query
```javascript
const response = await axios.get(
  'http://localhost:5000/api/v1/interview-recordings',
  { headers: { 'Authorization': `Bearer ${token}` } }
);

// URLs are in response.data.data[].recordingUrl
response.data.data.forEach(recording => {
  console.log(recording.recordingUrl);
});
```

---

## Integration with Application Model

The `Application` model now has a virtual field `interviewRecordings` that automatically populates all related recordings:

```javascript
const application = await Application.findById(applicationId)
  .populate('interviewRecordings');

console.log(application.interviewRecordings); // Array of InterviewRecording documents
```

---

## Frontend Integration Example

### React Component for Upload

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const InterviewRecordingUpload = ({ applicationId, token }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('recording', file);
    formData.append('applicationId', applicationId);
    formData.append('interviewType', 'ai_voice');

    setUploading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/v1/interview-recordings/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert('Recording uploaded successfully!');
      console.log('Cloudinary URL:', response.data.data.recordingUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload recording');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input
        type="file"
        accept="video/*,audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Recording'}
      </button>
    </form>
  );
};

export default InterviewRecordingUpload;
```

---

## File Size Limits

- **Default:** 500MB per file
- **Supported formats:**
  - Video: MP4, WebM, QuickTime, AVI
  - Audio: MP3, WAV, WebM, OGG

To change the limit, modify [interviewRecordingController.js:24](../controllers/interviewRecordingController.js#L24):

```javascript
limits: {
  fileSize: 500 * 1024 * 1024 // Change to desired size in bytes
}
```

---

## Security

- **Authentication required** for all endpoints
- **Role-based access control**:
  - HR/Manager/Admin can upload and view all recordings
  - Applicants can only view their own recordings
  - Only Admin can delete recordings
- **Cloudinary public access** enabled for authenticated URLs
- **Secure HTTPS URLs** from Cloudinary

---

## Troubleshooting

### Issue: "Failed to upload file to cloud storage"

**Solution:**
1. Check Cloudinary credentials in `.env`
2. Verify Cloudinary account is active
3. Check internet connection
4. Review backend logs for detailed error

### Issue: Recording URL not accessible

**Solution:**
1. Ensure Cloudinary URLs have `access_mode: 'public'`
2. Check Cloudinary upload settings in [cloudinary.js:26](../utils/cloudinary.js#L26)
3. Verify the URL is using `https://` (secure URL)

### Issue: File too large

**Solution:**
1. Check file size limit in controller
2. Increase Express body parser limit in [server.js:39](../server.js#L39)
3. Check Cloudinary account upload limits

---

## Testing

### PowerShell Test Script

```powershell
# 1. Login to get token
$loginBody = @{
    email = "admin@hrms.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" `
    -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

# 2. Upload recording
$headers = @{ "Authorization" = "Bearer $token" }

# Prepare multipart form data
$filePath = "C:\path\to\interview.mp4"
$applicationId = "your-application-id"

# Note: PowerShell multipart upload is complex, use Postman or JavaScript instead
```

### Postman Collection

1. **Import** the API endpoints
2. **Set** Authorization to Bearer Token
3. **Upload** a video/audio file to `/upload`
4. **Verify** recording in Cloudinary dashboard
5. **Query** recordings via GET endpoints

---

## Next Steps

1. ✅ Create frontend upload component
2. ✅ Add recording player in application details
3. ✅ Implement automatic Vapi recording upload
4. ✅ Add transcript viewer
5. ✅ Implement AI analysis of recordings

---

## Support

For issues or questions:
- Check backend logs: `SmartHR/backend/logs/`
- Review Cloudinary logs in dashboard
- Contact development team

---

**Last Updated:** 2025-10-29
**Version:** 1.0.0
