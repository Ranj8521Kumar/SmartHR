const axios = require('axios');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Transcribe audio using Hugging Face Whisper
// @route   POST /api/v1/transcriptions
// @access  Private (HR/Manager/Admin/Candidate with link)
exports.transcribeAudio = asyncHandler(async (req, res, next) => {
  try {
    if (!req.files || !req.files.audio) {
      return next(new ErrorResponse('No audio file provided', 400));
    }

    const audioFile = req.files.audio; // express-fileupload
    const hfToken = process.env.HF_ACCESS_TOKEN;
    const modelId = process.env.HF_WHISPER_MODEL || 'openai/whisper-large-v3';

    if (!hfToken) {
      return next(new ErrorResponse('Transcription service not configured', 500));
    }

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${modelId}`,
      audioFile.data,
      {
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': audioFile.mimetype || 'audio/webm'
        },
        timeout: 300000
      }
    );

    // HF can return different shapes; normalize to text
    let text = '';
    if (Array.isArray(response.data)) {
      // Some models return an array of segments with text
      text = response.data.map(seg => seg.text || '').join(' ').trim();
    } else if (typeof response.data === 'object' && response.data.text) {
      text = response.data.text;
    } else if (typeof response.data === 'string') {
      text = response.data;
    }

    return res.status(200).json({ success: true, data: { text } });
  } catch (error) {
    console.error('Whisper transcription error:', error?.response?.data || error.message);
    return next(new ErrorResponse('Failed to transcribe audio', 500));
  }
});

module.exports = {
  transcribeAudio: exports.transcribeAudio,
};




