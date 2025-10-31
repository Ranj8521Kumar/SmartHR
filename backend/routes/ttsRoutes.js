const express = require('express');
const router = express.Router();
const axios = require('axios');

// @desc    Generate speech using HuggingFace TTS (Microsoft SpeechT5)
// @route   POST /api/v1/tts/speak
// @access  Public (used during interview)
router.post('/speak', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_ACCESS_TOKEN;

    if (!HF_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'HuggingFace API key not configured'
      });
    }

    // Use Microsoft SpeechT5 TTS model
    const modelId = process.env.HF_TTS_MODEL || 'microsoft/speecht5_tts';

    console.log(`🎤 Generating TTS for text: "${text.substring(0, 50)}..." using model: ${modelId}`);

    // Call HuggingFace Inference API
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        inputs: text
      },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000 // 60 seconds timeout for TTS generation
      }
    );

    // Return audio as base64
    const audioBase64 = Buffer.from(response.data, 'binary').toString('base64');

    console.log(`✅ TTS generated successfully, audio size: ${audioBase64.length} bytes`);

    res.status(200).json({
      success: true,
      audio: audioBase64,
      contentType: 'audio/flac' // SpeechT5 returns FLAC audio
    });

  } catch (error) {
    console.error('HuggingFace TTS Error:', error.response?.data || error.message);

    // If model is loading, inform the user
    if (error.response?.status === 503) {
      return res.status(503).json({
        success: false,
        message: 'TTS model is loading, please try again in a few seconds',
        error: 'Model loading'
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to generate speech',
      error: error.response?.data || error.message
    });
  }
});

// @desc    Get TTS status and available models
// @route   GET /api/v1/tts/status
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || process.env.HF_ACCESS_TOKEN;

    res.status(200).json({
      success: true,
      provider: 'HuggingFace',
      model: process.env.HF_TTS_MODEL || 'microsoft/speecht5_tts',
      configured: !!HF_API_KEY,
      availableModels: [
        'microsoft/speecht5_tts', // Good quality, fast
        'facebook/mms-tts-eng', // Multilingual
        'suno/bark' // High quality, slower
      ]
    });

  } catch (error) {
    console.error('TTS Status Error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch TTS status',
      error: error.message
    });
  }
});

module.exports = router;
