# SmartHR – AI-Powered Human Resource Management System (HRMS)

> **Theme:** Build the Future of HR Management with AI-Powered Solutions

---

## 📌 Overview

**SmartHR** is a next-generation, full-stack **Human Resource Management System (HRMS)** that leverages Artificial Intelligence to streamline and automate HR operations for modern workplaces. It goes far beyond recruitment — covering the entire employee lifecycle from onboarding to payroll, attendance, performance, and AI-driven analytics.

Built with a **React + TailwindCSS** frontend and a **Node.js / Express / MongoDB** backend, SmartHR is designed to support **5,000+ concurrent employee logins** with real-time data processing, role-based personalized dashboards, and deep AI automation across all HR functions.

---

## 🎯 Objectives & Project Requirements

- ✅ Incorporate **all core HRMS functionalities** — employee data management, attendance, payroll, and performance tracking.
- ✅ **AI-driven resume screening & evaluation** without human intervention.
- ✅ **AI-powered conversation & voice interaction** models for recruitment and candidate screening.
- ✅ **Multi-role login system** with tailored access for: Management Admin · Senior Manager · HR Recruiter · Employee.
- ✅ **Personalized dashboards** — each user sees their own activity; Admins view individual + company-wide dashboards.
- ✅ **Scalability** — supports 5,000+ employee logins with real-time data processing.
- ✅ **Clean, intuitive UI/UX**, optimized for both web and mobile (responsive) access.

---

## 🧩 Core HRMS Modules

### 1. 👤 Employee Management
- Employee onboarding and profile management
- Store and manage personal, professional, and document data
- Role assignment and department/team structuring
- Employee lifecycle tracking (hire → active → exit)
- Profile image upload via Cloudinary CDN

### 2. 🕐 Attendance Management
- Daily attendance marking and tracking
- Leave application and approval workflows
- Attendance history and summary reports
- Real-time attendance status per employee
- Integration with payroll for automated deductions

### 3. 💰 Payroll Management
- Automated payroll processing based on attendance and role
- Salary slip generation and management
- Razorpay integration for payment disbursements
- Tax and deduction calculations
- Payroll history and audit logs

### 4. 📈 Performance Tracking
- Goal setting and KPI management per employee
- Manager-led performance reviews and ratings
- Performance trend analytics over time
- Automated alerts for underperformance
- AI-assisted performance insights from analytics service

### 5. 🧑‍💼 Recruitment & Candidate Screening
- Job posting creation and management
- Bulk resume upload and AI-powered parsing (NLP, BERT, Embeddings)
- Automated candidate ranking and shortlisting without human intervention
- Application tracking and status management
- AI chatbot for candidate FAQ and pre-screening

### 6. 🎥 AI Video Interview System
- Conduct and record video interviews directly in the browser
- Speech-to-Text transcription of interview responses
- Sentiment analysis and facial expression detection
- Eye tracking for attention and engagement measurement
- AI-generated interview evaluation reports stored to MongoDB

### 7. 📊 Analytics & Real-Time Dashboards
- Role-specific dashboards (Admin, Manager, HR Recruiter, Employee)
- Company-wide HR metrics and insights for Admins
- Recruitment funnel analytics (applications → shortlisted → hired)
- Attendance, payroll, and performance dashboards
- Real-time data powered by the Analytics Service

### 8. 🔔 Notifications & Communication
- Automated email notifications via SMTP (Nodemailer)
- In-app dashboard notification center
- Candidate and employee status update emails
- HR event reminders and alerts

---

## 🤖 AI Automation Layer

| AI Component | Description |
|---|---|
| **AI Resume Screening** | NLP + BERT + Embeddings for resume analysis, scoring, and ranking |
| **Video Interview Evaluation** | Speech-to-Text + Sentiment Analysis for automated interview scoring |
| **AI Chatbot** | Optional FAQ & screening assistant for candidates during application |
| **NLP Analytics** | OpenAI / Hugging Face models for HR insights and performance analytics |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USERS                                      │
│   Manager | Employee | HR Recruiter | Admin                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ REST API (HTTPS)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Web App (React + TailwindCSS)                           │
│   Multi-Role Login · Dashboards · Resume Upload · Video Interviews   │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   API Gateway (Express.js)                           │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌───────────────┐  │
│  │ Auth & Role Svc  │  │  Integration Layer   │  │ Employee Mgmt │  │
│  │ (JWT, RBAC)      │  │ (Cloudinary, SMTP,   │  │ (Onboarding,  │  │
│  └──────────────────┘  │  Razorpay, AI APIs)  │  │  Attendance,  │  │
│                        └──────────────────────┘  │  Payroll)     │  │
│                                                  └───────────────┘  │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌───────────────┐  │
│  │ Recruitment Svc  │  │  Interview Service   │  │ Analytics Svc │  │
│  │ (Bulk Resume,    │  │  (Video Interviews,  │  │ (Real-Time    │  │
│  │  AI Screening)   │  │   AI Evaluation)     │  │  Dashboards)  │  │
│  └──────────────────┘  └──────────────────────┘  └───────────────┘  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
          ┌────────────────┼──────────────────────┐
          ▼                ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐
│  AI AUTOMATION   │  │    STORAGE       │  │    INTEGRATIONS       │
│                  │  │                  │  │                       │
│ AI Resume Screen │  │ MongoDB          │  │ OpenAI / HuggingFace  │
│ (NLP,BERT,Embed) │  │ (User Data,      │  │ (NLP, Analytics)      │
│                  │  │  AI Results,     │  │                       │
│ Video Interview  │  │  Logs)           │  │ Razorpay              │
│ Eval (STT,       │  │                  │  │ (Payroll, Payments)   │
│  Sentiment)      │  │ Cloudinary       │  │                       │
│                  │  │ (Resumes,Images, │  │ SMTP Email            │
│ AI Chatbot       │  │  Videos, CDN)    │  │ (Notifications)       │
│ (FAQ/Screening)  │  │                  │  │                       │
└──────────────────┘  └──────────────────┘  └───────────────────────┘
```

---

## 🔐 Roles & Permissions

| Role | Access Level |
|---|---|
| **Management Admin** | Full system access — all modules, company-wide dashboards, user management, payroll approval |
| **Senior Manager** | Department-level employee management, performance reviews, team analytics |
| **HR Recruiter** | Recruitment pipeline, resume screening, interview scheduling, candidate communication |
| **Employee** | Personal dashboard, attendance, payslips, leave requests, profile management |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React (Vite) | SPA framework |
| TailwindCSS | Styling & responsive design |
| face-api.js | Facial expression detection |
| Recharts | Analytics dashboards |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | API Gateway & server |
| MongoDB + Mongoose | Primary database |
| JWT + bcrypt | Authentication & security |
| Multer | File upload handling |
| Nodemailer | Email notifications |
| PDF-Parse + Mammoth | Resume parsing |
| Natural (NLP) | Text processing |

### AI & Integrations
| Service | Purpose |
|---|---|
| OpenAI API | Resume analysis, NLP, chatbot |
| Hugging Face | BERT embeddings, sentiment analysis |
| Cloudinary | Media storage (resumes, images, videos) |
| Razorpay | Payroll disbursements & payments |
| SMTP | Automated email notifications |

### Security & Infrastructure
| Technology | Purpose |
|---|---|
| Helmet.js | HTTP security headers |
| Rate Limiting | API abuse prevention |
| XSS Protection | Input sanitization |
| Docker | Containerized deployment |

---

## 📁 Project Structure

```
HRMS/
├── backend/
│   ├── config/              # DB, cloud, and service configuration
│   ├── controllers/         # Route handlers for all HRMS modules
│   ├── middleware/          # Auth, RBAC, error handling, rate limiting
│   ├── models/              # MongoDB schemas (Employee, Attendance, Payroll, etc.)
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic (AI, email, payroll, etc.)
│   ├── utils/               # Helpers and utility functions
│   ├── uploads/             # Temporary local upload directory
│   ├── logs/                # Application and audit logs
│   ├── scripts/             # DB seeding and migration scripts
│   ├── server.js            # App entry point
│   └── package.json
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/          # Static assets
│       ├── components/      # Reusable UI components
│       ├── config/          # API URLs and app config
│       ├── context/         # React context (auth, theme, etc.)
│       ├── hooks/           # Custom React hooks
│       ├── services/        # API service calls
│       └── pages/           # Page-level components (Dashboard, HR, Payroll, etc.)
│   ├── index.html
│   └── package.json
├── docker-compose.yaml
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account
- OpenAI API key
- Razorpay account (for payroll features)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smarthr

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AI Services
OPENAI_API_KEY=your-openai-key
HUGGINGFACE_API_KEY=your-hf-key

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payments
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

Run the server:

```bash
# Start MongoDB (Windows)
net start MongoDB

# Seed database with roles and demo data
npm run seed

# Start development server
npm run dev

# Production
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

```bash
npm run dev
```

### Docker (Full Stack)

```bash
docker-compose up --build
```

---

## 📡 API Endpoints (Summary)

> See `backend/API_DOCUMENTATION.md` for full reference.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| GET | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user info |

### Employee Management
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/employees` | List all employees |
| POST | `/api/v1/employees` | Add new employee |
| PUT | `/api/v1/employees/:id` | Update employee |
| DELETE | `/api/v1/employees/:id` | Remove employee |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/attendance/mark` | Mark attendance |
| GET | `/api/v1/attendance/:employeeId` | Get attendance history |
| POST | `/api/v1/attendance/leave` | Apply for leave |

### Payroll
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/payroll/:employeeId` | Get payroll records |
| POST | `/api/v1/payroll/process` | Process monthly payroll |
| GET | `/api/v1/payroll/slip/:id` | Download payslip |

### Recruitment
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/jobs` | List job postings |
| POST | `/api/v1/jobs` | Create job posting |
| POST | `/api/v1/applications` | Submit application |
| POST | `/api/v1/resumes/upload` | Upload resume |
| POST | `/api/v1/resumes/parse` | AI parse & score resume |

### Interviews
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/interviews/start` | Start video interview session |
| POST | `/api/v1/interviews/upload` | Upload interview recording |
| GET | `/api/v1/interviews/:id/report` | Get AI evaluation report |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/analytics/dashboard` | Role-based dashboard metrics |
| GET | `/api/v1/analytics/recruitment` | Recruitment funnel stats |
| GET | `/api/v1/analytics/attendance` | Attendance summary |
| GET | `/api/v1/analytics/performance` | Performance overview |

---

## 📊 Scalability & Design Targets

- **5,000+ concurrent employee logins** with real-time data processing
- **Responsive UI/UX** — optimized for both web and mobile
- **Modular, service-oriented backend** — each HRMS domain is a separate service layer
- **CDN-backed media delivery** via Cloudinary for resumes, profile images, and interview videos
- **Horizontal scalability** supported via Docker containerization

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: describe your change"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT

---

*For module-specific details, see `backend/README.md` and `frontend/README.md`.*
