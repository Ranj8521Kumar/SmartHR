# HRMS Backend - AI-Powered Recruitment System

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with RBAC
- 🤖 **AI-Powered Resume Parsing**: Automatic resume analysis using NLP
- 📊 **ML Analytics**: Intelligent candidate screening and matching
- 📧 **Email Integration**: Automated notifications via Nodemailer
- 🔍 **Smart Search**: Advanced filtering and search capabilities
- 📈 **Analytics Dashboard**: Comprehensive recruitment metrics
- 🎯 **Role-Based Access**: Manager, HR Recruiter, Employee, Admin roles

## Architecture

- **Backend Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **AI/ML Services**: OpenAI, HuggingFace
- **File Processing**: PDF-Parse, Mammoth
- **NLP**: Natural library
- **Email**: Nodemailer
- **Security**: Helmet, rate limiting, XSS protection

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your .env file with appropriate values

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Setup

1. Configure MongoDB connection
2. Set JWT secret key
3. Configure email service credentials
4. Add AI service API keys (OpenAI/HuggingFace)
5. Set CORS origin for frontend

## API Endpoints

### Authentication
- POST `/api/v1/auth/register` - User registration
- POST `/api/v1/auth/login` - User login
- GET `/api/v1/auth/logout` - User logout
- GET `/api/v1/auth/me` - Get current user
- PUT `/api/v1/auth/updatedetails` - Update user details
- PUT `/api/v1/auth/updatepassword` - Update password

### Users (Admin only)
- GET `/api/v1/users` - Get all users
- GET `/api/v1/users/:id` - Get single user
- PUT `/api/v1/users/:id` - Update user
- DELETE `/api/v1/users/:id` - Delete user

### Jobs
- GET `/api/v1/jobs` - Get all jobs
- GET `/api/v1/jobs/:id` - Get single job
- POST `/api/v1/jobs` - Create job (HR/Manager)
- PUT `/api/v1/jobs/:id` - Update job
- DELETE `/api/v1/jobs/:id` - Delete job

### Applications
- GET `/api/v1/applications` - Get applications
- GET `/api/v1/applications/:id` - Get single application
- POST `/api/v1/applications` - Submit application
- PUT `/api/v1/applications/:id` - Update application status
- DELETE `/api/v1/applications/:id` - Delete application

### Resumes
- POST `/api/v1/resumes/upload` - Upload resume
- POST `/api/v1/resumes/parse` - Parse resume with AI
- GET `/api/v1/resumes/:id` - Get resume details
- GET `/api/v1/resumes/user/:userId` - Get user resumes

### Analytics
- GET `/api/v1/analytics/dashboard` - Get dashboard metrics
- GET `/api/v1/analytics/applications` - Application analytics
- GET `/api/v1/analytics/jobs` - Job analytics
- POST `/api/v1/analytics/candidate-match` - AI candidate matching

## Project Structure

```
backend/
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic & AI services
├── utils/           # Utility functions
├── uploads/         # File uploads
├── logs/            # Application logs
├── scripts/         # Database seeds & scripts
├── server.js        # Entry point
└── package.json     # Dependencies
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- MongoDB sanitization
- XSS protection
- Security headers with Helmet
- CORS configuration
- Input validation

## Roles & Permissions

- **Admin**: Full system access
- **Manager**: Manage jobs, view analytics
- **HR Recruiter**: Process applications, screen candidates
- **Employee**: View jobs, submit applications

## License

MIT
