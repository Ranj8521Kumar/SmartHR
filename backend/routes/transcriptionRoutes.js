const express = require('express');
const router = express.Router();
const { transcribeAudio } = require('../controllers/transcriptionController');

// Note: If you want auth, import protect/authorize and add to route
router.post('/', transcribeAudio);

module.exports = router;




