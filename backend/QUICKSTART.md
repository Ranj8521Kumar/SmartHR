# 🚀 HRMS Backend - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies (2 min)
```powershell
cd backend
npm install
```

### Step 2: Configure Environment (1 min)
```powershell
# Copy example env file
Copy-Item .env.example .env

# Edit .env - Minimum required:
# MONGODB_URI=mongodb://localhost:27017/hrms
# JWT_SECRET=your-secret-key-here
```

### Step 3: Start MongoDB (30 sec)
```powershell
# If using local MongoDB
net start MongoDB

# Or use MongoDB Atlas (cloud) - just update MONGODB_URI in .env
```

### Step 4: Seed Database (30 sec)
```powershell
npm run seed
```

### Step 5: Start Server (30 sec)
```powershell
npm run dev
```

✅ **Server is now running on http://localhost:5000**

---

## 🧪 Test the API

### 1. Health Check
```powershell
curl http://localhost:5000/health
```

### 2. Login
```powershell
$body = @{
    email = "admin@hrms.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token

Write-Host "Token: $token"
```

### 3. Get Jobs
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/jobs"
```

### 4. Get Profile
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/me" -Headers $headers
```

---

## 📝 Default Test Accounts

| Role         | Email              | Password   |
|--------------|-------------------|------------|
| Admin        | admin@hrms.com    | admin123   |
| HR Recruiter | hr@hrms.com       | hr123456   |
| Manager      | manager@hrms.com  | manager123 |
| Employee     | employee@hrms.com | employee123|

---

## 🔧 Common Commands

```powershell
# Development (auto-restart)
npm run dev

# Production
npm start

# Run tests
npm test

# Seed database
npm run seed

# Lint code
npm run lint
```

---

## 📚 Key Files to Know

- **`server.js`** - Main entry point
- **`.env`** - Environment configuration
- **`routes/`** - API endpoints
- **`controllers/`** - Business logic
- **`models/`** - Database schemas
- **`services/`** - AI & parsing logic

---

## 🎯 Main Features

✅ User Authentication (JWT)  
✅ Role-Based Access Control  
✅ Job Management  
✅ Application Processing  
✅ AI Resume Parsing  
✅ Candidate Matching  
✅ Email Notifications  
✅ Analytics Dashboard  

---

## 🔗 API Endpoints Overview

- **Auth**: `/api/v1/auth/*`
- **Jobs**: `/api/v1/jobs/*`
- **Applications**: `/api/v1/applications/*`
- **Resumes**: `/api/v1/resumes/*`
- **Analytics**: `/api/v1/analytics/*`
- **Users**: `/api/v1/users/*` (Admin only)

---

## 📖 Full Documentation

- **Setup**: `SETUP.md`
- **API Reference**: `API_DOCUMENTATION.md`
- **Architecture**: `ARCHITECTURE.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## 🆘 Troubleshooting

### MongoDB Connection Error?
```powershell
# Check if MongoDB is running
Get-Service MongoDB

# Start MongoDB
net start MongoDB
```

### Port 5000 Already in Use?
```powershell
# Find and kill process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Or change port in .env
# PORT=5000
```

### Module Not Found?
```powershell
# Reinstall dependencies
Remove-Item node_modules -Recurse -Force
npm install
```

---

## 🌐 Deploy to Production

### Render.com (Recommended)
1. Push code to GitHub
2. Create Web Service on Render
3. Add environment variables
4. Deploy!

### Heroku
```powershell
heroku create hrms-backend
heroku config:set MONGODB_URI=your-mongodb-atlas-uri
git push heroku main
```

---

## 💡 Tips

- Use **Postman** or **Thunder Client** for API testing
- Check `logs/` folder for error details
- Enable hot-reload with `npm run dev`
- MongoDB Atlas for cloud database (free tier available)
- Use strong JWT_SECRET in production

---

## ✨ What's Next?

1. ✅ Backend is ready!
2. 🎨 Build frontend (React/Vue/Angular)
3. 📱 Create mobile app
4. 🚀 Deploy to production
5. 📊 Connect analytics tools

---

## 🎉 You're All Set!

The HRMS backend is now running and ready to handle:
- User authentication
- Job postings
- Application processing
- AI-powered resume screening
- Analytics and reporting

**Need help?** Check the documentation files or open an issue.

---

**Happy Coding! 🚀**
