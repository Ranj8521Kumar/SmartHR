const cloudinary = require('cloudinary').v2;
const ErrorResponse = require('./errorResponse');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload video recording to Cloudinary
 * @param {Buffer} buffer - Video file buffer
 * @param {string} filename - Original filename
 * @param {string} applicationId - Application ID for folder organization
 * @param {string} interviewId - Interview ID for unique identification
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadVideoRecording = async (buffer, filename, applicationId, interviewId) => {
  try {
    const folder = `SmartHR/InterviewVideo/${applicationId}`;
    const publicId = `interview_${interviewId}_${Date.now()}`;

    const result = await cloudinary.uploader.upload(buffer, {
      folder: folder,
      public_id: publicId,
      resource_type: 'video',
      use_filename: false,
      unique_filename: false,
      type: 'upload',
      access_mode: 'public',
      overwrite: false,
      // Video-specific options
      format: 'webm', // Keep original format, typically webm from MediaRecorder
      quality: 'auto',
      // Add metadata
      context: {
        application_id: applicationId,
        interview_id: interviewId,
        upload_type: 'interview_recording',
        uploaded_at: new Date().toISOString()
      }
    });

    // Helpful success log (non-sensitive)
    console.log('[Cloudinary] Video uploaded', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      bytes: result.bytes,
      duration: result.duration,
      format: result.format
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      duration: result.duration,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw new ErrorResponse('Failed to upload video recording to cloud storage', 500);
  }
};

/**
 * Upload audio recording to Cloudinary
 * @param {Buffer} buffer - Audio file buffer
 * @param {string} filename - Original filename
 * @param {string} applicationId - Application ID for folder organization
 * @param {string} interviewId - Interview ID for unique identification
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadAudioRecording = async (buffer, filename, applicationId, interviewId) => {
  try {
    const folder = `SmartHR/InterviewVideo/${applicationId}`;
    const publicId = `interview_audio_${interviewId}_${Date.now()}`;

    const result = await cloudinary.uploader.upload(buffer, {
      folder: folder,
      public_id: publicId,
      resource_type: 'video', // Cloudinary treats audio as video resource
      use_filename: false,
      unique_filename: false,
      type: 'upload',
      access_mode: 'public',
      overwrite: false,
      format: 'webm', // Common format for MediaRecorder audio
      // Add metadata
      context: {
        application_id: applicationId,
        interview_id: interviewId,
        upload_type: 'interview_audio_recording',
        uploaded_at: new Date().toISOString()
      }
    });

    // Helpful success log (non-sensitive)
    console.log('[Cloudinary] Audio uploaded', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      bytes: result.bytes,
      duration: result.duration,
      format: result.format
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      duration: result.duration,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Cloudinary audio upload error:', error);
    throw new ErrorResponse('Failed to upload audio recording to cloud storage', 500);
  }
};

/**
 * Delete recording from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Cloudinary delete response
 */
const deleteRecording = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });

    return result;
  } catch (error) {
    console.error('Cloudinary delete recording error:', error);
    throw new ErrorResponse('Failed to delete recording from cloud storage', 500);
  }
};

/**
 * Upload remote video URL to Cloudinary
 * @param {string} remoteUrl - Remote video URL
 * @param {string} applicationId - Application ID for folder organization
 * @param {string} interviewId - Interview ID for unique identification
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadRemoteVideoUrl = async (remoteUrl, applicationId, interviewId) => {
  try {
    const folder = `SmartHR/InterviewVideo/${applicationId}`;
    const publicId = `interview_${interviewId}_${Date.now()}`;

    const result = await cloudinary.uploader.upload(remoteUrl, {
      folder: folder,
      public_id: publicId,
      resource_type: 'video',
      type: 'upload',
      access_mode: 'public',
      overwrite: false,
      quality: 'auto',
      context: {
        application_id: applicationId,
        interview_id: interviewId,
        upload_type: 'interview_recording_remote',
        uploaded_at: new Date().toISOString()
      }
    });

    console.log('[Cloudinary] Remote video uploaded', {
      public_id: result.public_id,
      secure_url: result.secure_url,
      bytes: result.bytes,
      duration: result.duration,
      format: result.format
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      duration: result.duration,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('Cloudinary remote video upload error:', error);
    throw new ErrorResponse('Failed to upload remote video to cloud storage', 500);
  }
};

/**
 * Get recording info from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Cloudinary resource info
 */
const getRecordingInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video'
    });

    return result;
  } catch (error) {
    console.error('Cloudinary get recording info error:', error);
    throw new ErrorResponse('Failed to get recording info from cloud storage', 500);
  }
};

/**
 * Generate download URL for recordings
 * @param {string} publicId - Cloudinary public ID
 * @returns {string} - Download URL with proper flags
 */
const getRecordingDownloadUrl = (publicId) => {
  // Use cloudinary.url() to generate proper download URL with attachment flag
  return cloudinary.url(publicId, {
    resource_type: 'video',
    flags: 'attachment',
    secure: true
  });
};

module.exports = {
  cloudinary,
  uploadVideoRecording,
  uploadAudioRecording,
  uploadRemoteVideoUrl,
  deleteRecording,
  getRecordingInfo,
  getRecordingDownloadUrl
};
