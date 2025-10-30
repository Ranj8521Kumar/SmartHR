const cloudinary = require('cloudinary').v2;
const ErrorResponse = require('./errorResponse');

// Configure Cloudinary with extended timeout
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 600000, // 10 minutes for large video uploads
  upload_timeout: 600000 // 10 minutes upload timeout
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

    console.log('[Cloudinary] Starting video upload...', {
      bufferSize: buffer.length,
      bufferSizeMB: (buffer.length / (1024 * 1024)).toFixed(2) + ' MB',
      applicationId,
      interviewId,
      publicId,
      timestamp: new Date().toISOString()
    });

    // Use upload_stream for more efficient binary uploads
    const result = await new Promise((resolve, reject) => {
      let uploadedBytes = 0;

      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: 'video',
          use_filename: false,
          unique_filename: false,
          type: 'upload',
          access_mode: 'public',
          overwrite: false,
          // Video-specific options
          format: 'webm',
          quality: 'auto',
          timeout: 600000, // 10 minute timeout for large files
          chunk_size: 6000000, // 6MB chunks for better reliability
          // Async processing for large videos
          eager_async: true,
          eager: [
            { format: 'webm', quality: 'auto' }
          ],
          // Add metadata
          context: {
            application_id: applicationId,
            interview_id: interviewId,
            upload_type: 'interview_recording',
            uploaded_at: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary] Upload stream error:', error);
            console.error('[Cloudinary] Upload failed at', uploadedBytes, 'bytes');
            reject(error);
          } else {
            console.log('[Cloudinary] Upload completed successfully');
            resolve(result);
          }
        }
      );

      // Write buffer to stream in chunks for better reliability
      const chunkSize = 1024 * 1024; // 1MB chunks
      console.log('[Cloudinary] Writing buffer in', Math.ceil(buffer.length / chunkSize), 'chunks');

      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
        stream.write(chunk);
        uploadedBytes += chunk.length;

        // Log progress every 10%
        const progress = Math.floor((uploadedBytes / buffer.length) * 100);
        if (progress % 10 === 0 || uploadedBytes === buffer.length) {
          console.log(`[Cloudinary] Upload progress: ${progress}% (${(uploadedBytes / (1024 * 1024)).toFixed(2)} MB)`);
        }
      }

      console.log('[Cloudinary] Buffer write complete, finalizing upload...');
      stream.end();
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

    console.log('[Cloudinary] Uploading audio...', {
      bufferSize: buffer.length,
      applicationId,
      interviewId,
      publicId
    });

    // Use upload_stream for more efficient binary uploads
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: 'video', // Cloudinary treats audio as video resource
          use_filename: false,
          unique_filename: false,
          type: 'upload',
          access_mode: 'public',
          overwrite: false,
          format: 'webm',
          timeout: 600000, // 10 minute timeout for large files
          chunk_size: 6000000, // 6MB chunks for better reliability
          // Async processing for large files
          eager_async: true,
          eager: [
            { format: 'webm', quality: 'auto' }
          ],
          // Add metadata
          context: {
            application_id: applicationId,
            interview_id: interviewId,
            upload_type: 'interview_audio_recording',
            uploaded_at: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary] Upload stream error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write buffer to stream in chunks for better reliability
      const chunkSize = 1024 * 1024; // 1MB chunks
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
        stream.write(chunk);
      }
      stream.end();
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
      // Async processing for large videos
      eager_async: true,
      eager: [
        { format: 'webm', quality: 'auto' }
      ],
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
