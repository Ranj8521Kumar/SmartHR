/**
 * Recording Service for AI Interview Video/Audio Recording
 * Handles MediaRecorder API for capturing video and audio during interviews
 */

class RecordingService {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingEndTime = null;
  }

  /**
   * Request camera and microphone permissions
   * @returns {Promise<MediaStream>} - Media stream for recording
   */
  async requestPermissions() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Use front camera
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      this.stream = stream;
      return stream;
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      throw new Error('Unable to access camera and microphone. Please check permissions.');
    }
  }

  /**
   * Start recording the interview
   * @param {MediaStream} stream - Optional existing stream to use for recording
   * @returns {Promise<void>}
   */
  async startRecording(stream = null) {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    if (stream) {
      this.stream = stream;
    } else if (!this.stream) {
      await this.requestPermissions();
    }

    try {
      // Use WebM format for better compatibility
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus'
      };

      // Fallback to VP8 if VP9 is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }

      // Final fallback
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.recordedChunks = [];
      this.recordingStartTime = new Date();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.recordingEndTime = new Date();
        this.isRecording = false;
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording');
    }
  }

  /**
   * Stop recording the interview
   * @returns {Promise<Blob>} - Recorded video blob
   */
  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = () => {
        this.recordingEndTime = new Date();
        this.isRecording = false;

        try {
          const blob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder.mimeType || 'video/webm'
          });

          console.log('Recording stopped, blob created:', {
            size: blob.size,
            type: blob.type,
            duration: this.getRecordingDuration()
          });

          resolve(blob);
        } catch (error) {
          reject(new Error('Failed to create recording blob'));
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get the duration of the current recording
   * @returns {number} - Duration in milliseconds
   */
  getRecordingDuration() {
    if (!this.recordingStartTime) return 0;

    const endTime = this.recordingEndTime || new Date();
    return endTime - this.recordingStartTime;
  }

  /**
   * Check if recording is currently active
   * @returns {boolean}
   */
  isCurrentlyRecording() {
    return this.isRecording;
  }

  /**
   * Get recording statistics
   * @returns {Object} - Recording stats
   */
  getRecordingStats() {
    return {
      isRecording: this.isRecording,
      duration: this.getRecordingDuration(),
      startTime: this.recordingStartTime,
      endTime: this.recordingEndTime,
      chunksCount: this.recordedChunks.length,
      mimeType: this.mediaRecorder?.mimeType
    };
  }

  /**
   * Stop all media tracks and clean up
   */
  stopMediaTracks() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
  }

  /**
   * Clean up recording resources
   */
  cleanup() {
    if (this.isRecording && this.mediaRecorder) {
      this.mediaRecorder.stop();
    }

    this.stopMediaTracks();
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingEndTime = null;
  }

  /**
   * Create a preview URL for the recorded blob (for testing/debugging)
   * @param {Blob} blob - Recorded video blob
   * @returns {string} - Object URL for preview
   */
  createPreviewUrl(blob) {
    return URL.createObjectURL(blob);
  }

  /**
   * Revoke preview URL to free memory
   * @param {string} url - Object URL to revoke
   */
  revokePreviewUrl(url) {
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
const recordingService = new RecordingService();
export default recordingService;
