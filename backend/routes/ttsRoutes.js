const express = require('express');
const router = express.Router();
const axios = require('axios');

// @desc    Generate speech using ElevenLabs TTS
// @route   POST /api/v1/tts/speak
// @access  Public (used during interview)
router.post('/speak', async (req, res) => {
  try {
    const { text, voiceId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    // Default to Rachel voice if not specified
    const selectedVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM';

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'ElevenLabs API key not configured'
      });
    }

    // Call ElevenLabs API
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    // Return audio as base64
    const audioBase64 = Buffer.from(response.data, 'binary').toString('base64');

    res.status(200).json({
      success: true,
      audio: audioBase64,
      contentType: 'audio/mpeg'
    });

  } catch (error) {
    console.error('ElevenLabs TTS Error:', error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to generate speech',
      error: error.response?.data || error.message
    });
  }
});

// @desc    Get available voices
// @route   GET /api/v1/tts/voices
// @access  Public
router.get('/voices', async (req, res) => {
  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'ElevenLabs API key not configured'
      });
    }

    const response = await axios.get(
      'https://api.elevenlabs.io/v1/voices',
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
        }
      }
    );

    res.status(200).json({
      success: true,
      voices: response.data.voices
    });

  } catch (error) {
    console.error('ElevenLabs Voices Error:', error.response?.data || error.message);

    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch voices',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
