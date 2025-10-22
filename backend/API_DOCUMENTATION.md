# HRMS Backend API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "employee",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "employee"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

### Update User Details
```http
PUT /auth/updatedetails
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "address": {
    "city": "San Francisco",
    "state": "CA",
    "country": "USA"
  }
}
```

### Update Password
```http
PUT /auth/updatepassword
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

### Logout
```http
GET /auth/logout
Authorization: Bearer {token}
```

---

## Jobs

### Get All Jobs
```http
GET /jobs?page=1&limit=10&department=Engineering&status=open
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `department` (optional): Filter by department
- `status` (optional): Filter by status (open, closed, on-hold, filled)
- `location` (optional): Filter by location
- `employmentType` (optional): Filter by employment type
- `experienceLevel` (optional): Filter by experience level
- `search` (optional): Text search in title, description, skills

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "title": "Senior Software Engineer",
      "description": "We are looking for...",
      "department": "Engineering",
      "location": "San Francisco, CA",
      "employmentType": "Full-time",
      "experienceLevel": "Senior Level",
      "salary": {
        "min": 120000,
        "max": 180000,
        "currency": "USD"
      },
      "skills": ["JavaScript", "React", "Node.js"],
      "status": "open",
      "applicationsCount": 15,
      "viewsCount": 120,
      "createdAt": "2023-06-25T10:30:00.000Z"
    }
  ]
}
```

### Get Single Job
```http
GET /jobs/:id
```

### Create Job
```http
POST /jobs
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Senior Software Engineer",
  "description": "We are looking for an experienced software engineer...",
  "department": "Engineering",
  "location": "San Francisco, CA",
  "employmentType": "Full-time",
  "experienceLevel": "Senior Level",
  "salary": {
    "min": 120000,
    "max": 180000,
    "currency": "USD"
  },
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
  "qualifications": ["Bachelor's degree in CS", "5+ years experience"],
  "responsibilities": ["Design applications", "Mentor junior developers"],
  "benefits": ["Health insurance", "401k", "Remote work"],
  "openings": 2,
  "deadline": "2024-12-31"
}
```

**Required Roles:** hr_recruiter, manager, admin

### Update Job
```http
PUT /jobs/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "closed",
  "openings": 0
}
```

### Delete Job
```http
DELETE /jobs/:id
Authorization: Bearer {token}
```

---

## Applications

### Get Applications
```http
GET /applications?page=1&limit=10&status=submitted&job=60d5ec49f1b2c72b8c8e4f1a
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status
- `job`: Filter by job ID
- `applicant`: Filter by applicant ID (HR/Manager/Admin only)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 50,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1b",
      "job": {
        "_id": "60d5ec49f1b2c72b8c8e4f1a",
        "title": "Senior Software Engineer",
        "department": "Engineering"
      },
      "applicant": {
        "_id": "60d5ec49f1b2c72b8c8e4f1c",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "status": "submitted",
      "aiScore": {
        "overallScore": 85,
        "skillsMatch": 90,
        "experienceMatch": 80,
        "qualificationMatch": 85
      },
      "createdAt": "2023-06-25T10:30:00.000Z"
    }
  ]
}
```

### Get Single Application
```http
GET /applications/:id
Authorization: Bearer {token}
```

### Submit Application
```http
POST /applications
Authorization: Bearer {token}
Content-Type: application/json

{
  "job": "60d5ec49f1b2c72b8c8e4f1a",
  "resume": "60d5ec49f1b2c72b8c8e4f1d",
  "coverLetter": "I am excited to apply for this position..."
}
```

### Update Application Status
```http
PUT /applications/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "shortlisted",
  "notes": "Good candidate, schedule for interview"
}
```

**Status Options:**
- submitted
- under_review
- shortlisted
- interview_scheduled
- interviewed
- offer_extended
- accepted
- rejected
- withdrawn

**Required Roles:** hr_recruiter, manager, admin

### Schedule Interview
```http
POST /applications/:id/interview
Authorization: Bearer {token}
Content-Type: application/json

{
  "scheduledDate": "2024-07-15T14:00:00.000Z",
  "type": "technical",
  "interviewer": "60d5ec49f1b2c72b8c8e4f1e",
  "notes": "Technical round with senior engineer"
}
```

**Interview Types:**
- phone
- video
- in-person
- technical
- hr

---

## Resumes

### Upload Resume
```http
POST /resumes/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

resume: [file]
```

**Supported formats:** PDF, DOC, DOCX  
**Max size:** 5MB

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1d",
    "user": "60d5ec49f1b2c72b8c8e4f1c",
    "fileName": "resume_60d5ec49f1b2c72b8c8e4f1c_1624615849123.pdf",
    "fileUrl": "/uploads/resumes/resume_60d5ec49f1b2c72b8c8e4f1c_1624615849123.pdf",
    "fileType": "pdf",
    "fileSize": 524288,
    "isParsed": false,
    "createdAt": "2023-06-25T10:30:00.000Z"
  }
}
```

### Parse Resume
```http
POST /resumes/parse/:id
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1d",
    "isParsed": true,
    "parsedData": {
      "personalInfo": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "linkedIn": "https://linkedin.com/in/johndoe"
      },
      "skills": [
        { "name": "JavaScript", "category": "Programming Languages" },
        { "name": "React", "category": "Frontend" }
      ],
      "experience": [...],
      "education": [...]
    },
    "aiAnalysis": {
      "keywords": ["software", "developer", "javascript"],
      "skillsExtracted": ["JavaScript", "React", "Node.js"],
      "experienceYears": 5,
      "educationLevel": "Bachelor's Degree",
      "overallScore": 85
    }
  }
}
```

### Get My Resumes
```http
GET /resumes
Authorization: Bearer {token}
```

### Get Single Resume
```http
GET /resumes/:id
Authorization: Bearer {token}
```

### Get User Resumes (HR/Manager/Admin)
```http
GET /resumes/user/:userId
Authorization: Bearer {token}
```

### Delete Resume
```http
DELETE /resumes/:id
Authorization: Bearer {token}
```

---

## Analytics

**Required Roles:** hr_recruiter, manager, admin

### Dashboard Analytics
```http
GET /analytics/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalJobs": 25,
      "openJobs": 15,
      "totalApplications": 250,
      "pendingApplications": 80,
      "totalUsers": 150,
      "activeUsers": 145
    },
    "applicationsByStatus": [
      { "_id": "submitted", "count": 50 },
      { "_id": "under_review", "count": 30 }
    ],
    "jobsByDepartment": [
      { "_id": "Engineering", "count": 12, "openPositions": 8 }
    ],
    "recentApplications": [...],
    "topJobs": [...]
  }
}
```

### Application Analytics
```http
GET /analytics/applications?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applicationsTrend": [...],
    "avgTimeToHire": 21,
    "conversionRates": {
      "applicationToShortlist": "32.50",
      "shortlistToInterview": "60.00",
      "interviewToHire": "45.00"
    },
    "totalApplications": 250
  }
}
```

### Job Analytics
```http
GET /analytics/jobs
Authorization: Bearer {token}
```

### AI Candidate Matching
```http
POST /analytics/candidate-match
Authorization: Bearer {token}
Content-Type: application/json

{
  "jobId": "60d5ec49f1b2c72b8c8e4f1a",
  "minScore": 70
}
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "application": {...},
      "matchScore": 92,
      "details": {
        "overallScore": 92,
        "skillsMatch": 95,
        "experienceMatch": 90,
        "qualificationMatch": 88,
        "keywordMatch": 85,
        "recommendation": "Highly Recommended"
      }
    }
  ]
}
```

---

## Users (Admin Only)

### Get All Users
```http
GET /users?page=1&limit=10&role=employee&department=Engineering
Authorization: Bearer {token}
```

### Get Single User
```http
GET /users/:id
Authorization: Bearer {token}
```

### Create User
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "hr_recruiter",
  "department": "HR"
}
```

### Update User
```http
PUT /users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "isActive": false,
  "role": "manager"
}
```

### Delete User
```http
DELETE /users/:id
Authorization: Bearer {token}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

API is rate limited to 100 requests per 15 minutes per IP address.

When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

---

## Roles & Permissions

- **employee**: Can view jobs, submit applications, manage own profile
- **hr_recruiter**: All employee permissions + manage applications, view analytics
- **manager**: All hr_recruiter permissions + create/manage jobs
- **admin**: Full system access

---

## Testing with PowerShell

```powershell
# Login and get token
$loginBody = @{
    email = "admin@hrms.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token

# Use token for authenticated requests
$headers = @{
    "Authorization" = "Bearer $token"
}

# Get current user
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/me" -Method Get -Headers $headers

# Get jobs
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/jobs" -Method Get -Headers $headers
```
