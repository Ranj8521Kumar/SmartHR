# HRMS Backend - Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```powershell
npm install
```

### 2. Environment Configuration

Copy the `.env.example` file to `.env`:

```powershell
Copy-Item .env.example .env
```

Then edit `.env` file with your configuration:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/hrms

# JWT secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email configuration (for Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

### 3. Start MongoDB

If using local MongoDB:

```powershell
# Start MongoDB service
net start MongoDB
```

Or use MongoDB Atlas cloud service.

### 4. Seed Database (Optional)

To populate the database with sample data:

```powershell
npm run seed
```

This creates:
- Admin user: admin@hrms.com / admin123
- HR user: hr@hrms.com / hr123456
- Manager: manager@hrms.com / manager123
- Employee: employee@hrms.com / employee123
- Sample job postings

### 5. Start Development Server

```powershell
npm run dev
```

The server will start on `http://localhost:5000`

### 6. Start Production Server

```powershell
npm start
```

## Testing the API

### Health Check

```powershell
curl http://localhost:5000/health
```

### Register a User

```powershell
$body = @{
    firstName = "John"
    lastName = "Doe"
    email = "john@example.com"
    password = "password123"
    role = "employee"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/register" -Method Post -Body $body -ContentType "application/json"
```

### Login

```powershell
$body = @{
    email = "admin@hrms.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token
```

### Get Jobs

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/jobs" -Method Get
```

### Get Protected Resource

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/me" -Method Get -Headers $headers
```

## Project Structure

```
backend/
├── config/           # Database and app configuration
├── controllers/      # Request handlers
├── middleware/       # Custom middleware (auth, error handling, etc.)
├── models/          # Mongoose schemas
├── routes/          # API routes
├── services/        # Business logic (AI, resume parsing)
├── utils/           # Helper functions (email, logger, etc.)
├── uploads/         # File uploads directory
├── logs/            # Application logs
├── scripts/         # Database seeds and utilities
├── server.js        # Entry point
├── package.json     # Dependencies
└── .env             # Environment variables
```

## API Endpoints

All API endpoints are prefixed with `/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `PUT /auth/updatedetails` - Update user details
- `PUT /auth/updatepassword` - Update password

### Jobs
- `GET /jobs` - Get all jobs (public)
- `GET /jobs/:id` - Get single job
- `POST /jobs` - Create job (HR/Manager/Admin)
- `PUT /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job

### Applications
- `GET /applications` - Get applications
- `GET /applications/:id` - Get single application
- `POST /applications` - Submit application
- `PUT /applications/:id` - Update application status
- `POST /applications/:id/interview` - Schedule interview

### Resumes
- `POST /resumes/upload` - Upload resume
- `POST /resumes/parse/:id` - Parse resume with AI
- `GET /resumes` - Get my resumes
- `GET /resumes/:id` - Get single resume
- `DELETE /resumes/:id` - Delete resume

### Analytics (HR/Manager/Admin)
- `GET /analytics/dashboard` - Dashboard metrics
- `GET /analytics/applications` - Application analytics
- `GET /analytics/jobs` - Job analytics
- `POST /analytics/candidate-match` - AI candidate matching

### Users (Admin only)
- `GET /users` - Get all users
- `GET /users/:id` - Get single user
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Troubleshooting

### MongoDB Connection Error

If you see "MongooseServerSelectionError":
1. Make sure MongoDB is running
2. Check your MONGODB_URI in .env
3. Verify network connectivity

### Port Already in Use

If port 5000 is already in use:
1. Change PORT in .env file
2. Or stop the process using port 5000:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
   ```

### Email Not Sending

1. For Gmail, use App-Specific Password
2. Enable "Less secure app access" or use OAuth2
3. Check EMAIL_* variables in .env

## Development Tips

- Use Postman or Thunder Client for API testing
- Check logs in `logs/` directory for errors
- Enable MongoDB debug mode: `mongoose.set('debug', true)`
- Use `npm run dev` for auto-restart on file changes

## Security Considerations

- Change JWT_SECRET to a strong random string
- Use HTTPS in production
- Set NODE_ENV=production in production
- Enable rate limiting (already configured)
- Keep dependencies updated

## Deployment

### Render.com

1. Push code to GitHub
2. Create new Web Service on Render
3. Set environment variables
4. Deploy

### Heroku

```powershell
heroku create hrms-backend
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
git push heroku main
```

## Support

For issues or questions, check the main README.md or open an issue.
