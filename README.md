# SmartHR – AI-Powered Recruitment System

## Overview
SmartHR is a full-stack Human Resource Management System designed to streamline recruitment using AI-powered resume parsing, analytics, and automated workflows. It features a modern React frontend and a robust Express/MongoDB backend.

---

## Features
- **Authentication & Authorization**: JWT-based auth with RBAC (Admin, Manager, HR Recruiter, Employee)
- **AI Resume Parsing**: Automatic resume analysis using NLP and ML
- **AI Video Interview**: Conduct and record video interviews, with AI-powered analysis
- **Interview Recording & Upload**: Secure video/audio recording and upload to cloud
- **Face Expression Detection**: Analyze candidate facial expressions during interviews
- **Eye Tracking**: Detect candidate attention and engagement using webcam
- **Transcript Generation**: Automatic transcription of interview recordings
- **Text-to-Speech (TTS)**: TTS features for accessibility and interview playback
- **Intelligent Candidate Screening**: ML-powered analytics and matching
- **Email Integration**: Automated notifications via Nodemailer
- **Smart Search**: Advanced filtering and search
- **Analytics Dashboard**: Recruitment metrics and insights
- **Role-Based Access**: Custom permissions for each user type
- **Job Management**: Create, update, and manage job postings
- **Application Management**: Submit and track job applications
- **Resume Management**: Upload, parse, and view resumes
- **User Management**: Admin and HR controls for users
- **Cloud Uploads**: Cloudinary integration for file storage
- **Notifications**: Automated email and dashboard notifications
- **OAuth Login**: Google and LinkedIn login support

---

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, face-api.js, recharts
- **Backend**: Express.js, MongoDB (Mongoose), OpenAI, HuggingFace, PDF-Parse, Mammoth, Natural, Nodemailer
- **Security**: Helmet, rate limiting, XSS protection, JWT, bcrypt
- **Other**: Cloudinary (file uploads), Multer, Passport.js

---

## Project Structure
```
HRMS/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── uploads/
│   ├── logs/
│   ├── scripts/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.jsx, main.jsx, etc.
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Setup Instructions

### Backend
1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```
2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set required variables:
     ```
     MONGODB_URI=mongodb://localhost:27017/hrms
     JWT_SECRET=your-secret-key
     EMAIL_USER=your-email
     EMAIL_PASS=your-password
     OPENAI_API_KEY=your-openai-key
     ```
3. **Start MongoDB**
   - Local: `net start MongoDB`
   - Or use MongoDB Atlas (update `MONGODB_URI`)
4. **Seed database**
   ```bash
   npm run seed
   ```
5. **Start server**
   ```bash
   npm run dev
   # or for production
   npm start
   ```

### Frontend
1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```
2. **Start development server**
   ```bash
   npm run dev
   ```
3. **Configure API URL**
   - Set `VITE_API_URL` in `.env` (frontend) to match backend

---

## API Endpoints
See `backend/API_DOCUMENTATION.md` for full details.

**Authentication**
- `POST /api/v1/auth/register` – Register user
- `POST /api/v1/auth/login` – Login
- `GET /api/v1/auth/logout` – Logout
- `GET /api/v1/auth/me` – Current user

**Jobs**
- `GET /api/v1/jobs` – List jobs
- `POST /api/v1/jobs` – Create job

**Applications**
- `POST /api/v1/applications` – Submit application

**Resumes**
- `POST /api/v1/resumes/upload` – Upload resume
- `POST /api/v1/resumes/parse` – AI parse resume

**Analytics**
- `GET /api
---

## Roles & Permissions
- **Admin**: Full access
- **Manager**: Manage jobs, view analytics
- **HR Recruiter**: Process applications, screen candidates
- **Employee**: View jobs, submit applications

---

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License
MIT

---

*For more details, see individual `README.md` files in `backend/` and `frontend/`.*
