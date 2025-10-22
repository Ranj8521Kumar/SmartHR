# HRMS Backend - Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      HRMS BACKEND SERVER                         │
│                     (Express.js on Node.js)                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │   SECURITY   │  │  MIDDLEWARE  │  │   LOGGING    │
         ├──────────────┤  ├──────────────┤  ├──────────────┤
         │ • Helmet     │  │ • CORS       │  │ • Winston    │
         │ • Rate Limit │  │ • Body Parse │  │ • Morgan     │
         │ • XSS Clean  │  │ • Cookies    │  │ • DB Logs    │
         │ • Mongo Safe │  │ • Compress   │  │ • Requests   │
         └──────────────┘  └──────────────┘  └──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ AUTHENTICATION │    │   MIDDLEWARE   │    │   UTILITIES    │
├────────────────┤    ├────────────────┤    ├────────────────┤
│ • JWT Tokens   │    │ • Auth Check   │    │ • Email Send   │
│ • Bcrypt Hash  │    │ • RBAC         │    │ • File Upload  │
│ • Login/Signup │    │ • Validation   │    │ • Error Class  │
│ • Password RST │    │ • Error Handle │    │ • Logger       │
└────────────────┘    └────────────────┘    └────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                        API ROUTES                            │
├─────────────────────────────────────────────────────────────┤
│  /auth   │  /users  │  /jobs  │  /apps  │  /resumes  │  /analytics
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                       CONTROLLERS                            │
├─────────────────────────────────────────────────────────────┤
│  Auth    │   User   │   Job   │   App   │  Resume  │  Analytics
└─────────────────────────────────────────────────────────────┘
        │
        ├──────────────────┬──────────────────┐
        ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  AI SERVICES   │  │    DATABASE    │  │  INTEGRATIONS  │
├────────────────┤  ├────────────────┤  ├────────────────┤
│ • Resume Parse │  │ • MongoDB      │  │ • Nodemailer   │
│ • NLP Analysis │  │ • Mongoose ODM │  │ • OpenAI API   │
│ • ML Matching  │  │ • Indexes      │  │ • HuggingFace  │
│ • Scoring      │  │ • Aggregation  │  │ • SMTP Server  │
└────────────────┘  └────────────────┘  └────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   USER       │  │     JOB      │  │ APPLICATION  │
│   MODEL      │  │    MODEL     │  │    MODEL     │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ • Auth Data  │  │ • Job Info   │  │ • Status     │
│ • Profile    │  │ • Skills     │  │ • Timeline   │
│ • Role       │  │ • Salary     │  │ • AI Score   │
│ • Activity   │  │ • Apps Count │  │ • Interviews │
└──────────────┘  └──────────────┘  └──────────────┘

        ▼                  ▼
┌──────────────┐  ┌──────────────┐
│   RESUME     │  │     LOG      │
│   MODEL      │  │    MODEL     │
├──────────────┤  ├──────────────┤
│ • File Info  │  │ • Level      │
│ • Parsed     │  │ • Category   │
│ • AI Score   │  │ • User       │
│ • Skills     │  │ • Metadata   │
└──────────────┘  └──────────────┘
```

## Request Flow Example: Submit Job Application

```
1. CLIENT REQUEST
   POST /api/v1/applications
   Authorization: Bearer <token>
   Body: { job, resume, coverLetter }
              │
              ▼
2. MIDDLEWARE CHAIN
   ├─> Rate Limiter (check request limit)
   ├─> Body Parser (parse JSON)
   ├─> Auth Middleware (verify JWT)
   ├─> RBAC Check (verify permissions)
   └─> Logger (log request)
              │
              ▼
3. CONTROLLER
   applicationController.createApplication()
   ├─> Validate input data
   ├─> Check job exists & is open
   ├─> Check resume exists & belongs to user
   └─> Check for duplicate application
              │
              ▼
4. DATABASE
   ├─> Create Application document
   ├─> Update Job applicationsCount
   └─> Add to timeline
              │
              ▼
5. AI SERVICE
   aiService.analyzeApplicationAI()
   ├─> Calculate skill match
   ├─> Calculate experience match
   ├─> Calculate qualification match
   └─> Generate overall score
              │
              ▼
6. INTEGRATION
   sendEmail()
   └─> Send confirmation to applicant
              │
              ▼
7. RESPONSE
   Status: 201 Created
   Body: { success: true, data: application }
```

## User Roles & Permissions

```
┌──────────────────────────────────────────────────────────────┐
│                     ROLE HIERARCHY                            │
└──────────────────────────────────────────────────────────────┘

ADMIN (Full Access)
├─> Manage Users (CRUD)
├─> Manage Jobs (CRUD)
├─> Manage Applications (CRUD)
├─> View Analytics
├─> System Configuration
└─> All Employee permissions

MANAGER
├─> Create/Edit/Delete Jobs
├─> View Applications
├─> Update Application Status
├─> Schedule Interviews
├─> View Analytics
└─> All HR Recruiter permissions

HR RECRUITER
├─> View Applications
├─> Update Application Status
├─> Schedule Interviews
├─> Parse Resumes
├─> View Analytics
└─> All Employee permissions

EMPLOYEE (Basic Access)
├─> View Jobs
├─> Submit Applications
├─> Upload Resume
├─> View Own Applications
└─> Update Profile
```

## Database Schema Relationships

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│   USER   │         │   JOB    │         │  RESUME  │
│          │         │          │         │          │
│ _id      │◄────┐   │ _id      │◄────┐   │ _id      │
│ email    │     │   │ title    │     │   │ user ────┼──┐
│ password │     │   │ postedBy ├─────┘   │ fileName │  │
│ role     │     │   │ skills   │         │ parsed   │  │
└──────────┘     │   │ salary   │         └──────────┘  │
                 │   └──────────┘                       │
                 │         ▲                             │
                 │         │                             │
                 │   ┌─────┴──────┐                     │
                 │   │APPLICATION │                     │
                 │   │            │                     │
                 └───┤ applicant  │                     │
                     │ job        │                     │
                     │ resume ────┼─────────────────────┘
                     │ status     │
                     │ aiScore    │
                     │ timeline   │
                     └────────────┘
                           │
                           ▼
                     ┌──────────┐
                     │   LOG    │
                     │          │
                     │ level    │
                     │ message  │
                     │ user     │
                     │ metadata │
                     └──────────┘
```

## AI/ML Pipeline

```
RESUME UPLOAD
     │
     ▼
┌─────────────────┐
│  PDF/DOC/DOCX   │
│  File Upload    │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  Text Extract   │
│  • PDF Parse    │
│  • Mammoth      │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  NLP Analysis   │
│  • Tokenize     │
│  • TF-IDF       │
│  • Keywords     │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Data Extraction │
│ • Skills        │
│ • Experience    │
│ • Education     │
│ • Projects      │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│   AI Scoring    │
│ • Skills Match  │
│ • Exp Match     │
│ • Qual Match    │
│ • Overall Score │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Store Parsed    │
│ Data in DB      │
└─────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────┐
│                   CLOUD HOSTING                     │
│              (Render / Heroku / Vercel)             │
└────────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   EXPRESS    │ │   MONGODB    │ │  EMAIL/SMTP  │
│   SERVER     │ │   ATLAS      │ │   SERVICE    │
│              │ │              │ │              │
│ • REST API   │ │ • Cloud DB   │ │ • Nodemailer │
│ • WebSocket  │ │ • Backups    │ │ • Gmail/AWS  │
│ • Static     │ │ • Replicas   │ │ • Templates  │
└──────────────┘ └──────────────┘ └──────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
        ┌──────────────────────────────┐
        │      EXTERNAL SERVICES        │
        ├──────────────────────────────┤
        │ • OpenAI API (GPT)           │
        │ • HuggingFace (NLP)          │
        │ • Google Analytics           │
        │ • AWS S3 (Optional)          │
        └──────────────────────────────┘
```

## API Response Flow

```
REQUEST  ───────────>  SERVER
                        │
                        ├─> Middleware
                        ├─> Authentication
                        ├─> Authorization
                        ├─> Validation
                        │
                        ▼
                    Controller
                        │
                        ├─> Service Layer
                        ├─> Database Query
                        ├─> AI Processing
                        │
                        ▼
                    Format Response
                        │
                        ├─> Success (200-299)
                        │   └─> { success: true, data: {...} }
                        │
                        └─> Error (400-599)
                            └─> { success: false, error: "..." }
```

## File Structure Tree

```
backend/
│
├── 📁 config/
│   └── database.js
│
├── 📁 controllers/
│   ├── analyticsController.js
│   ├── applicationController.js
│   ├── authController.js
│   ├── jobController.js
│   ├── resumeController.js
│   └── userController.js
│
├── 📁 middleware/
│   ├── asyncHandler.js
│   ├── auth.js
│   ├── errorHandler.js
│   ├── logger.js
│   └── validate.js
│
├── 📁 models/
│   ├── Application.js
│   ├── Job.js
│   ├── Log.js
│   ├── Resume.js
│   └── User.js
│
├── 📁 routes/
│   ├── analyticsRoutes.js
│   ├── applicationRoutes.js
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   ├── resumeRoutes.js
│   └── userRoutes.js
│
├── 📁 services/
│   ├── aiService.js
│   └── resumeParserService.js
│
├── 📁 utils/
│   ├── errorResponse.js
│   ├── fileUpload.js
│   ├── logger.js
│   └── sendEmail.js
│
├── 📁 scripts/
│   └── seedData.js
│
├── 📁 tests/
│   └── api.test.js
│
├── 📁 uploads/resumes/
├── 📁 logs/
│
├── 📄 .env.example
├── 📄 .eslintrc.json
├── 📄 .gitignore
├── 📄 .prettierrc.json
├── 📄 API_DOCUMENTATION.md
├── 📄 IMPLEMENTATION_SUMMARY.md
├── 📄 jest.config.js
├── 📄 package.json
├── 📄 README.md
├── 📄 SETUP.md
└── 📄 server.js
```

## Technology Stack Summary

```
┌─────────────────────────────────────────────────┐
│              BACKEND STACK                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  RUNTIME:       Node.js v18+                    │
│  FRAMEWORK:     Express.js                      │
│  DATABASE:      MongoDB + Mongoose              │
│                                                  │
│  AUTH:          JWT + bcrypt                    │
│  SECURITY:      Helmet, Rate Limit, XSS         │
│                                                  │
│  AI/ML:         Natural (NLP)                   │
│  PARSING:       pdf-parse, mammoth              │
│  EMAIL:         Nodemailer                      │
│  LOGGING:       Winston + Morgan                │
│                                                  │
│  TESTING:       Jest + Supertest                │
│  LINTING:       ESLint + Prettier               │
│                                                  │
└─────────────────────────────────────────────────┘
```
