# SmartHR Frontend

## Overview
This is the frontend for SmartHR, an AI-powered recruitment platform. Built with React and Vite, it provides a modern, responsive UI for candidates, HR, managers, and admins.

---

## Features
- **Authentication & Authorization**: Login, registration, role-based access
- **Google & LinkedIn OAuth**: Social login support
- **AI Video Interview**: Conduct and record video interviews
- **Face Expression Detection**: Analyze candidate facial expressions during interviews
- **Eye Tracking**: Detect candidate attention and engagement
- **Interview Recording**: Record and upload video/audio interviews
- **Resume Upload & Parsing**: Upload resumes and view parsed results
- **Job Listings & Applications**: Browse jobs, apply, and track status
- **Dashboard & Analytics**: Visualize recruitment metrics
- **Notifications**: Real-time feedback and alerts
- **Profile Management**: Update user details and profile photo
- **Responsive Design**: Mobile-friendly UI
- **Tailwind CSS**: Modern styling

---

## Tech Stack
- **React** (Vite)
- **Tailwind CSS**
- **face-api.js** (face/eye tracking)
- **recharts** (analytics)
- **react-hot-toast** (notifications)
- **radix-ui** (UI components)
- **axios** (API calls)

---

## Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure API URL:
   - Set `VITE_API_URL` in `.env` to your backend API endpoint
3. Start development server:
   ```bash
   npm run dev
   ```

---

## Project Structure
```
frontend/
├── public/
│   ├── models/ (face-api.js models)
│   └── styles/
├── src/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── hooks/
│   ├── services/
│   └── App.jsx, main.jsx, etc.
├── index.html
├── package.json
└── README.md
```

---

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## License
MIT
