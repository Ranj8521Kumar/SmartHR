# SmartHR Backend

## Overview
This is the backend for SmartHR, an AI-powered recruitment platform. Built with Express.js and MongoDB, it provides RESTful APIs, AI/ML services, and secure authentication for all user roles.

---

## Features
- **Authentication & Authorization**: JWT-based auth with RBAC
- **Google & LinkedIn OAuth**: Social login support
- **AI Resume Parsing**: Automatic resume analysis using NLP and ML
- **AI Video Interview**: Video/audio interview recording and analysis
- **Interview Recording & Upload**: Secure video/audio recording and upload to cloud
- **Face Expression Detection**: Analyze candidate facial expressions
- **Eye Tracking**: Detect candidate attention and engagement
- **Transcript Generation**: Automatic transcription of interview recordings
- **Text-to-Speech (TTS)**: TTS features for accessibility and playback
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

---

## Tech Stack
- **Express.js**
- **MongoDB (Mongoose)**
- **OpenAI, HuggingFace** (AI/ML)
- **PDF-Parse, Mammoth, Natural** (resume/NLP)
- **Nodemailer** (email)
- **Cloudinary, Multer** (file uploads)
- **Passport.js** (OAuth)
- **Helmet, rate limiting, XSS protection, JWT, bcrypt** (security)

---

## Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   - Copy `.env.example` to `.env`
   - Set required variables:
     ```
     MONGODB_URI=mongodb://localhost:27017/hrms
     JWT_SECRET=your-secret-key
     EMAIL_USER=your-email
     EMAIL_PASS=your-password
     OPENAI_API_KEY=your-openai-key
     ```
3. Start MongoDB:
   - Local: `net start MongoDB`
   - Or use MongoDB Atlas (update `MONGODB_URI`)
4. Seed database:
   ```bash
   npm run seed
   ```
5. Start server:
   ```bash
   npm run dev
   # or for production
   npm start
   ```

---

## API Endpoints
See `API_DOCUMENTATION.md` for full details.

---

## Project Structure
```
backend/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── uploads/
├── logs/
├── scripts/
├── server.js
└── package.json
```

---

## Security Features
- JWT token authentication
- Password hashing (bcrypt)
- Rate limiting
- MongoDB sanitization
- XSS protection
- Security headers (Helmet)
- CORS configuration
- Input validation

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
