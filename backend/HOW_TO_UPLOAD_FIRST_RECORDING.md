# How to Upload Your First Recording

## Why Your Collection is Empty

The `interviewrecordings` collection exists but has **0 documents** because you haven't uploaded any recordings yet. Let me show you how to add recordings.

---

## Method 1: Using Postman (Easiest)

### Step 1: Start Your Backend Server

```bash
cd SmartHR/backend
npm run dev
```

Server should be running at: http://localhost:5000

---

### Step 2: Login to Get Token

**Request:**
```
POST http://localhost:5000/api/v1/auth/login
```

**Body (JSON):**
```json
{
  "email": "admin@hrms.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

📋 **Copy the token** - you'll need it for the next steps

---

### Step 3: Get an Application ID

**Request:**
```
GET http://localhost:5000/api/v1/applications
```

**Headers:**
```
Authorization: Bearer {paste-your-token-here}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "673f8a9b5e4d3c2a1b0f9e8d",  // ← Copy this ID
      "applicant": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "job": {
        "title": "Software Engineer"
      }
    }
  ]
}
```

📋 **Copy the `_id`** from any application

---

### Step 4: Upload a Recording

**Request:**
```
POST http://localhost:5000/api/v1/interview-recordings/upload
```

**Headers:**
```
Authorization: Bearer {paste-your-token-here}
```

**Body (form-data):** ⚠️ Important: Select "form-data" NOT "JSON"

| Key | Type | Value |
|-----|------|-------|
| `recording` | File | [Click "Select Files" and choose a video/audio file] |
| `applicationId` | Text | `673f8a9b5e4d3c2a1b0f9e8d` (paste the ID from Step 3) |
| `interviewType` | Text | `ai_voice` |
| `notes` | Text | `Test recording` |

**Supported File Types:**
- Video: MP4, WebM, MOV, AVI
- Audio: MP3, WAV, OGG

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "674abc123def456789012345",
    "recordingUrl": "https://res.cloudinary.com/dpo9va1vv/video/upload/v1234567890/SmartHR/InterviewRecordings/interview_xxx.mp4",
    "applicant": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "fileName": "my-interview.mp4",
    "fileSize": 52428800,
    "status": "ready"
  }
}
```

✅ **Success!** The recording is now uploaded to Cloudinary and saved in MongoDB.

---

## Method 2: Using the Test Script

I've created a test script for you. Here's how to use it:

### Step 1: Prepare a Test File

1. Get any video or audio file
2. Place it in `SmartHR/backend/` folder
3. Rename it to `test-recording.mp4` (or update the script)

### Step 2: Run the Script

```bash
cd SmartHR/backend
node test-upload-recording.js
```

The script will:
- ✅ Login automatically
- ✅ Get an application ID
- ✅ Upload the recording
- ✅ Display the Cloudinary URL
- ✅ List all recordings

---

## Method 3: Using PowerShell (Windows)

```powershell
# Step 1: Login
$loginBody = @{
    email = "admin@hrms.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" `
    -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token

# Step 2: Get applications
$headers = @{ "Authorization" = "Bearer $token" }
$apps = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/applications" -Headers $headers
$appId = $apps.data[0]._id

# Step 3: For file upload, use Postman (PowerShell multipart is complex)
Write-Host "Application ID: $appId"
Write-Host "Use Postman to upload with this application ID"
```

---

## Verify Upload

### Check MongoDB

Refresh your MongoDB Data Explorer:
```
Database: hrms
Collection: interviewrecordings
```

You should now see documents like:
```json
{
  "_id": "...",
  "recordingUrl": "https://res.cloudinary.com/dpo9va1vv/...",
  "applicant": ObjectId("..."),
  "application": ObjectId("..."),
  "fileName": "interview.mp4",
  "status": "ready"
}
```

### Check Cloudinary

1. Go to https://cloudinary.com
2. Login with your account (cloud name: `dpo9va1vv`)
3. Click **Media Library**
4. Navigate to **SmartHR** → **InterviewRecordings**
5. You should see your uploaded file

---

## Troubleshooting

### "Application not found"
- Make sure you have at least one application in the database
- Check that the applicationId is correct

### "Please upload a recording file"
- In Postman, make sure you selected "form-data" (not JSON)
- Make sure the key is exactly `recording` (lowercase)
- Make sure you selected a file

### "Failed to upload file to cloud storage"
- Check Cloudinary credentials in `.env` (they look correct)
- Restart your backend server
- Check internet connection

### Backend not responding
```bash
cd SmartHR/backend
npm run dev
```

---

## Quick Test Checklist

- [ ] Backend server is running
- [ ] Logged in and got token
- [ ] Got application ID from /applications endpoint
- [ ] Have a video/audio file ready
- [ ] Used Postman with form-data (not JSON)
- [ ] Upload successful
- [ ] Recording visible in MongoDB
- [ ] Recording visible in Cloudinary

---

## What Happens When You Upload

1. **File uploaded** → Multer receives the file in memory
2. **Validation** → Checks file type and size
3. **Cloudinary upload** → File uploaded to `SmartHR/InterviewRecordings` folder
4. **Database save** → Recording metadata saved to MongoDB
5. **Response** → Returns Cloudinary URL and recording details

**Cloudinary URL format:**
```
https://res.cloudinary.com/dpo9va1vv/video/upload/v{version}/SmartHR/InterviewRecordings/interview_{applicantId}_{timestamp}.mp4
```

This URL is what gets saved in the `recordingUrl` field.

---

## Next Steps After First Upload

Once you have at least one recording:

1. **Test GET endpoints:**
   ```
   GET /api/v1/interview-recordings
   GET /api/v1/interview-recordings/:id
   GET /api/v1/interview-recordings/application/:applicationId
   ```

2. **Test download:**
   ```
   GET /api/v1/interview-recordings/:id/download
   ```

3. **View in Cloudinary dashboard**

4. **Build frontend upload component**

---

**Need Help?**

Run the test script with help:
```bash
node test-upload-recording.js --help
```

Or check the full documentation:
- [INTERVIEW_RECORDINGS_GUIDE.md](INTERVIEW_RECORDINGS_GUIDE.md)
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
