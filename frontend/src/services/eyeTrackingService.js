import * as faceapi from 'face-api.js';

class EyeTrackingService {
  constructor() {
    this.modelsLoaded = false;
    this.isTracking = false;
    this.detectionInterval = null;
    this.videoElement = null;
    this.canvas = null;
    this.onLookingAway = null;
    this.onLookingAtScreen = null;
    this.consecutiveLookAwayFrames = 0;
    this.lookAwayThreshold = 30; // Number of consecutive frames before triggering warning (~6 seconds)
    this.totalLookAwayCount = 0;
    this.lookAwayDuration = 0; // in seconds
    this.lastDetectionTime = null;
  }

  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      console.log('Loading face detection models...');

      // Try using models from a CDN first (more reliable)
      const CDN_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

      console.log('Attempting to load models from CDN:', CDN_URL);

      try {
        // Load only essential models for face and landmark detection
        console.log('Loading TinyFaceDetector from CDN...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL);
        console.log('✅ TinyFaceDetector loaded from CDN');

        console.log('Loading FaceLandmark68Net from CDN...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL);
        console.log('✅ FaceLandmark68Net loaded from CDN');

        this.modelsLoaded = true;
        console.log('✅ All face detection models loaded successfully from CDN');
        return;
      } catch (cdnError) {
        console.warn('⚠️ CDN loading failed, trying local models...', cdnError.message);

        // Fallback to local models
        const MODEL_URL = '/models';
        console.log('Loading TinyFaceDetector from local...', MODEL_URL);
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log('✅ TinyFaceDetector loaded locally');

        console.log('Loading FaceLandmark68Net from local...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log('✅ FaceLandmark68Net loaded locally');

        this.modelsLoaded = true;
        console.log('✅ All face detection models loaded successfully from local storage');
      }
    } catch (error) {
      console.error('❌ Error loading face detection models:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Make sure model files exist in public/models/ directory');
      throw error;
    }
  }

  async startTracking(videoElement, callbacks = {}) {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    this.videoElement = videoElement;
    this.onLookingAway = callbacks.onLookingAway || (() => {});
    this.onLookingAtScreen = callbacks.onLookingAtScreen || (() => {});
    this.isTracking = true;
    this.consecutiveLookAwayFrames = 0;
    this.lastDetectionTime = Date.now();

    console.log('👁️ Starting eye tracking...');

    // Create canvas for debugging (optional)
    if (callbacks.debugCanvas) {
      this.canvas = faceapi.createCanvasFromMedia(videoElement);
      callbacks.debugCanvas.appendChild(this.canvas);
    }

    // Start detection loop
    this.detectionInterval = setInterval(async () => {
      await this.detectFaceAndGaze();
    }, 200); // Check every 200ms (5 times per second - less aggressive)
  }

  async detectFaceAndGaze() {
    if (!this.videoElement || !this.isTracking) return;

    try {
      const currentTime = Date.now();
      const timeDiff = (currentTime - this.lastDetectionTime) / 1000;
      this.lastDetectionTime = currentTime;

      // Detect face with landmarks
      const detection = await faceapi
        .detectSingleFace(this.videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (!detection) {
        // No face detected - candidate might be looking away or face not visible
        this.consecutiveLookAwayFrames++;

        if (this.consecutiveLookAwayFrames >= this.lookAwayThreshold) {
          this.lookAwayDuration += timeDiff;
          this.onLookingAway({
            type: 'no_face_detected',
            message: 'Face not detected. Please look at the camera.',
            consecutiveFrames: this.consecutiveLookAwayFrames,
            totalLookAwayCount: this.totalLookAwayCount,
            lookAwayDuration: this.lookAwayDuration
          });
        }
        return;
      }

      // Face detected - analyze gaze direction
      const landmarks = detection.landmarks;
      const gazeAnalysis = this.analyzeGaze(landmarks);

      if (gazeAnalysis.isLookingAway) {
        this.consecutiveLookAwayFrames++;

        if (this.consecutiveLookAwayFrames === this.lookAwayThreshold) {
          this.totalLookAwayCount++;
        }

        if (this.consecutiveLookAwayFrames >= this.lookAwayThreshold) {
          this.lookAwayDuration += timeDiff;
          this.onLookingAway({
            type: 'looking_away',
            message: gazeAnalysis.message,
            direction: gazeAnalysis.direction,
            consecutiveFrames: this.consecutiveLookAwayFrames,
            totalLookAwayCount: this.totalLookAwayCount,
            lookAwayDuration: this.lookAwayDuration
          });
        }
      } else {
        // Looking at screen
        if (this.consecutiveLookAwayFrames >= this.lookAwayThreshold) {
          this.onLookingAtScreen({
            message: 'Thank you for looking at the camera',
            totalLookAwayCount: this.totalLookAwayCount,
            lookAwayDuration: this.lookAwayDuration
          });
        }
        this.consecutiveLookAwayFrames = 0;
      }

      // Draw canvas if enabled (for debugging)
      if (this.canvas) {
        const dims = faceapi.matchDimensions(this.canvas, this.videoElement, true);
        const resizedDetection = faceapi.resizeResults(detection, dims);
        this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
        faceapi.draw.drawDetections(this.canvas, resizedDetection);
        faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetection);
      }
    } catch (error) {
      console.error('Error in face detection:', error);
    }
  }

  analyzeGaze(landmarks) {
    // Get key facial landmarks
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const nose = landmarks.getNose();
    const jaw = landmarks.getJawOutline();

    // Calculate eye centers
    const leftEyeCenter = this.getCenter(leftEye);
    const rightEyeCenter = this.getCenter(rightEye);
    const noseCenter = this.getCenter(nose);

    // Calculate face center
    const faceCenter = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2
    };

    // Calculate horizontal deviation (left/right looking)
    const noseToFaceCenterX = noseCenter.x - faceCenter.x;
    const horizontalThreshold = 55; // pixels - balanced: allows natural movement but detects clear looking away

    // Calculate vertical deviation (up/down looking)
    const eyeToNoseY = noseCenter.y - faceCenter.y;
    const verticalThreshold = 60; // pixels - balanced: allows natural movement but detects clear looking away

    // Determine gaze direction
    let isLookingAway = false;
    let direction = 'center';
    let message = '';

    if (Math.abs(noseToFaceCenterX) > horizontalThreshold) {
      isLookingAway = true;
      if (noseToFaceCenterX > 0) {
        direction = 'right';
        message = 'Please look at the camera. You appear to be looking to the right.';
      } else {
        direction = 'left';
        message = 'Please look at the camera. You appear to be looking to the left.';
      }
    }

    if (Math.abs(eyeToNoseY) > verticalThreshold) {
      isLookingAway = true;
      if (eyeToNoseY > verticalThreshold) {
        direction = 'down';
        message = 'Please look at the camera. You appear to be looking down.';
      } else if (eyeToNoseY < -verticalThreshold) {
        direction = 'up';
        message = 'Please look at the camera. You appear to be looking up.';
      }
    }

    return {
      isLookingAway,
      direction,
      message,
      leftEyeCenter,
      rightEyeCenter,
      noseCenter,
      faceCenter
    };
  }

  getCenter(points) {
    const sum = points.reduce((acc, point) => {
      return { x: acc.x + point.x, y: acc.y + point.y };
    }, { x: 0, y: 0 });

    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  stopTracking() {
    console.log('⏹️ Stopping eye tracking');
    this.isTracking = false;

    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }

    return {
      totalLookAwayCount: this.totalLookAwayCount,
      lookAwayDuration: this.lookAwayDuration
    };
  }

  getStatistics() {
    return {
      totalLookAwayCount: this.totalLookAwayCount,
      lookAwayDuration: Math.round(this.lookAwayDuration),
      isCurrentlyLookingAway: this.consecutiveLookAwayFrames >= this.lookAwayThreshold
    };
  }

  reset() {
    this.consecutiveLookAwayFrames = 0;
    this.totalLookAwayCount = 0;
    this.lookAwayDuration = 0;
    this.lastDetectionTime = Date.now();
  }
}

// Create singleton instance
const eyeTrackingService = new EyeTrackingService();

export default eyeTrackingService;
