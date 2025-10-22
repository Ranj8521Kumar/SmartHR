# 📦 Database Seeding Scripts

## Available Scripts

### 1. `npm run seed` (Add Data Without Clearing)
**Use this to add sample data WITHOUT deleting existing records.**

```powershell
npm run seed
```

**What it does:**
- ✅ Checks if users exist before creating them
- ✅ Checks if jobs exist before creating them
- ✅ Preserves all existing data
- ✅ Only adds new records that don't exist

**Output Example:**
```
Starting seed process (without clearing existing data)...
- User already exists: admin@hrms.com
- User already exists: hr@hrms.com
✓ Created user: newuser@hrms.com

Total users in database: 5

✓ Created job: Backend Developer
- Job already exists: Senior Software Engineer

Total jobs in database: 4
```

**When to use:**
- Adding more sample data to existing database
- Testing with production-like data
- You don't want to lose existing applications/resumes

---

### 2. `npm run seed:reset` (Clear Everything & Start Fresh)
**Use this to completely RESET the database and start with fresh data.**

```powershell
npm run seed:reset
```

**⚠️ WARNING:** This deletes ALL data including:
- Users
- Jobs
- Applications
- Resumes
- Logs

**What it does:**
- ❌ Deletes all existing records
- ✅ Creates fresh sample users (4 users)
- ✅ Creates fresh sample jobs (3 jobs)

**Output Example:**
```
⚠️  WARNING: This will delete ALL existing data!
Starting database reset...

✓ Cleared users
✓ Cleared jobs
✓ Cleared applications
✓ Cleared resumes
✓ Cleared logs

📦 Inserting fresh seed data...

✓ Created 4 users
✓ Created 3 jobs

✅ Database reset and seeding completed successfully!
```

**When to use:**
- Starting fresh with a clean database
- Testing from scratch
- Development/testing environment only
- You want to remove test data

---

## 📋 Sample Data Created

### Users (4 accounts)

| Role | Email | Password | Department |
|------|-------|----------|------------|
| Admin | admin@hrms.com | admin123 | - |
| HR Recruiter | hr@hrms.com | hr123456 | HR |
| Manager | manager@hrms.com | manager123 | Engineering |
| Employee | employee@hrms.com | employee123 | - |

### Jobs (3 positions)

1. **Senior Software Engineer**
   - Department: Engineering
   - Location: San Francisco, CA
   - Salary: $120K - $180K
   - Type: Full-time
   - Level: Senior

2. **Frontend Developer**
   - Department: Engineering
   - Location: Remote
   - Salary: $80K - $120K
   - Type: Full-time
   - Level: Mid Level

3. **Data Scientist**
   - Department: Engineering
   - Location: New York, NY
   - Salary: $130K - $190K
   - Type: Full-time
   - Level: Senior

---

## 🚀 Usage Examples

### Scenario 1: First Time Setup
```powershell
# Run either command (both will work on empty database)
npm run seed
# or
npm run seed:reset
```

### Scenario 2: Adding More Sample Data
```powershell
# Keeps existing data, adds new sample data
npm run seed
```

### Scenario 3: Clean Slate for Testing
```powershell
# Deletes everything and starts fresh
npm run seed:reset
```

### Scenario 4: Adding Custom Data
Edit `scripts/seedData.js` and add your custom users/jobs to the arrays, then run:
```powershell
npm run seed
```

---

## 🛠️ Customizing Seed Data

### Add More Users

Edit `scripts/seedData.js`:

```javascript
const users = [
  // ... existing users
  {
    firstName: 'Your',
    lastName: 'Name',
    email: 'your.email@company.com',
    password: 'yourpassword',
    role: 'employee', // or 'hr_recruiter', 'manager', 'admin'
    phone: '+1234567890',
    department: 'Sales',
    isActive: true
  }
];
```

### Add More Jobs

Edit `scripts/seedData.js`:

```javascript
const jobs = [
  // ... existing jobs
  {
    title: 'Your Job Title',
    description: 'Job description here...',
    department: 'Marketing',
    location: 'Your City',
    employmentType: 'Full-time',
    experienceLevel: 'Entry Level',
    salary: {
      min: 50000,
      max: 70000,
      currency: 'USD'
    },
    skills: ['Skill1', 'Skill2'],
    qualifications: ['Requirement 1'],
    responsibilities: ['Task 1', 'Task 2'],
    benefits: ['Benefit 1'],
    openings: 1,
    status: 'open'
  }
];
```

---

## 🔍 Verification

After running seed scripts, verify the data:

### Check Users
```powershell
# In MongoDB Compass or mongosh
use hrms
db.users.find().pretty()
```

### Check Jobs
```powershell
db.jobs.find().pretty()
```

### Via API
```powershell
# Get all users (admin only)
curl http://localhost:5000/api/v1/users

# Get all jobs (public)
curl http://localhost:5000/api/v1/jobs
```

---

## ⚠️ Important Notes

1. **Always backup production data** before running `npm run seed:reset`
2. **Never run `seed:reset` in production** - it will delete all data!
3. Use `npm run seed` for production to safely add data
4. Test scripts in development environment first
5. Make sure MongoDB is running before executing scripts

---

## 🆘 Troubleshooting

### "User already exists" error?
This is expected with `npm run seed` - it skips existing users

### Want to update existing user password?
Delete the user first in MongoDB or use `npm run seed:reset`

### Script hangs?
- Check if MongoDB is running
- Check your MONGODB_URI in .env
- Press Ctrl+C to stop

### "Cannot find module" error?
Make sure you're in the `backend` directory:
```powershell
cd E:\HRMS\backend
npm run seed
```

---

## 📝 Summary

| Command | Clears DB? | Use Case |
|---------|-----------|----------|
| `npm run seed` | ❌ No | Add data safely |
| `npm run seed:reset` | ✅ Yes | Fresh start |

Choose based on your needs! 🎯
