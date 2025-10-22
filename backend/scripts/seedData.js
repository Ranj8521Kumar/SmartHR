const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Job = require('../models/Job');

// Load env vars
dotenv.config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

// Sample data
const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@hrms.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1234567890',
    isActive: true
  },
  {
    firstName: 'HR',
    lastName: 'Recruiter',
    email: 'hr@hrms.com',
    password: 'hr123456',
    role: 'hr_recruiter',
    phone: '+1234567891',
    department: 'HR',
    isActive: true
  },
  {
    firstName: 'John',
    lastName: 'Manager',
    email: 'manager@hrms.com',
    password: 'manager123',
    role: 'manager',
    phone: '+1234567892',
    department: 'Engineering',
    isActive: true
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'employee@hrms.com',
    password: 'employee123',
    role: 'employee',
    phone: '+1234567893',
    isActive: true
  }
];

const jobs = [
  {
    title: 'Senior Software Engineer',
    description: 'We are looking for an experienced software engineer to join our team.',
    department: 'Engineering',
    location: 'San Francisco, CA',
    employmentType: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 120000,
      max: 180000,
      currency: 'USD'
    },
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
    qualifications: ['Bachelor\'s degree in Computer Science', '5+ years of experience'],
    responsibilities: [
      'Design and develop web applications',
      'Collaborate with cross-functional teams',
      'Mentor junior developers'
    ],
    benefits: ['Health insurance', '401k', 'Remote work', 'Unlimited PTO'],
    openings: 2,
    status: 'open'
  },
  {
    title: 'Frontend Developer',
    description: 'Join our frontend team to build amazing user interfaces.',
    department: 'Engineering',
    location: 'Remote',
    employmentType: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 80000,
      max: 120000,
      currency: 'USD'
    },
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'],
    qualifications: ['Bachelor\'s degree or equivalent', '3+ years of experience'],
    responsibilities: [
      'Build responsive web applications',
      'Implement UI/UX designs',
      'Optimize performance'
    ],
    benefits: ['Health insurance', 'Remote work', 'Learning budget'],
    openings: 1,
    status: 'open'
  },
  {
    title: 'Data Scientist',
    description: 'Help us build AI-powered features for our HRMS platform.',
    department: 'Engineering',
    location: 'New York, NY',
    employmentType: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 130000,
      max: 190000,
      currency: 'USD'
    },
    skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Analysis', 'SQL'],
    qualifications: ['Master\'s degree in Data Science or related field', '4+ years of experience'],
    responsibilities: [
      'Develop ML models for resume screening',
      'Analyze recruitment data',
      'Implement AI features'
    ],
    benefits: ['Health insurance', '401k', 'Stock options', 'Conference budget'],
    openings: 1,
    status: 'open'
  }
];

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Job.deleteMany();

    console.log('Data cleared...');

    // Insert users
    const createdUsers = await User.create(users);
    console.log(`${createdUsers.length} users created...`);

    // Insert jobs (assign to manager)
    const manager = createdUsers.find(u => u.role === 'manager');
    const jobsWithPostedBy = jobs.map(job => ({
      ...job,
      postedBy: manager._id
    }));

    const createdJobs = await Job.create(jobsWithPostedBy);
    console.log(`${createdJobs.length} jobs created...`);

    console.log('Seed data inserted successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@hrms.com / admin123');
    console.log('HR: hr@hrms.com / hr123456');
    console.log('Manager: manager@hrms.com / manager123');
    console.log('Employee: employee@hrms.com / employee123');

    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
