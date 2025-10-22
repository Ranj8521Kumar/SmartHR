const express = require('express');
const {
  uploadResume,
  parseResumeById,
  getMyResumes,
  getResume,
  getUserResumes,
  deleteResume
} = require('../controllers/resumeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/upload', protect, uploadResume);
router.post('/parse/:id', protect, parseResumeById);
router.get('/', protect, getMyResumes);
router.get('/:id', protect, getResume);
router.get('/user/:userId', protect, authorize('hr_recruiter', 'manager', 'admin'), getUserResumes);
router.delete('/:id', protect, deleteResume);

module.exports = router;
