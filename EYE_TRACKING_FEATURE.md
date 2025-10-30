# Eye Tracking Feature Documentation

## Overview

The SmartHR AI Interview system now includes **real-time eye tracking** to monitor candidate behavior during interviews. This feature uses facial landmark detection to ensure candidates remain focused on the interview.

## Features

### 1. **Real-Time Face Detection**
- Uses TensorFlow.js and face-api.js for browser-based face detection
- Detects face position and facial landmarks
- No external API calls required - runs entirely in the browser

### 2. **Gaze Direction Analysis**
- Tracks where the candidate is looking (left, right, up, down, center)
- Analyzes eye position relative to face center
- Detects when candidate looks away from the camera

### 3. **Live Warning System**
- **Visual Warnings**: Red banner appears when candidate looks away
- **Violation Tracking**: Counts how many times candidate looked away
- **Duration Tracking**: Records total time spent looking away
- **Status Indicator**: Shows eye-tracking status (active/inactive)

### 4. **Statistics Dashboard**
- Real-time display of:
  - Total look-away count
  - Total look-away duration (in seconds)
  - Current status (looking at screen or away)

### 5. **Interview Submission Integration**
- Eye-tracking data is saved with interview results
- Includes:
  - Total violations
  - Total look-away duration
  - Look-away count

## Technical Implementation

### Libraries Used
- **face-api.js**: Face detection and facial landmark extraction
- **@tensorflow/tfjs-core**: TensorFlow.js core library
- **@tensorflow/tfjs-converter**: Model conversion utilities

### Models Required
The following pre-trained models are downloaded and stored in `public/models/`:
- `tiny_face_detector_model`: Fast face detection
- `face_landmark_68_model`: 68-point facial landmark detection

### Eye Tracking Service

Location: `frontend/src/services/eyeTrackingService.js`

**Key Methods:**
- `loadModels()`: Loads face detection models
- `startTracking(videoElement, callbacks)`: Starts eye tracking
- `detectFaceAndGaze()`: Analyzes face position and gaze
- `analyzeGaze(landmarks)`: Determines gaze direction
- `stopTracking()`: Stops tracking and returns statistics
- `getStatistics()`: Returns current tracking statistics

### Detection Algorithm

1. **Face Detection**: Detects face in video frame every 100ms
2. **Landmark Extraction**: Extracts 68 facial landmark points
3. **Gaze Analysis**:
   - Calculates eye centers
   - Determines nose position
   - Compares nose-to-face-center offset
   - Triggers warning if offset exceeds thresholds:
     - Horizontal: ±15 pixels
     - Vertical: ±20 pixels

4. **Violation Detection**:
   - Requires 10 consecutive frames (1 second) before triggering warning
   - Prevents false positives from quick glances

## User Interface

### Warning Display

When candidate looks away:
```
┌───────────────────────────────────────────────┐
│ ⚠️ Warning: Looking Away Detected            │
│ Please look at the camera. You appear to be  │
│ looking to the left.                          │
│                                    [3]        │
│                                 violations    │
└───────────────────────────────────────────────┘
```

### Status Indicators

**Top Left (Eye Tracking Status):**
- 🟢 Green: "Eye Tracking Active" - Candidate looking at camera
- 🔴 Red: "Eyes Not Detected" - Face not detected or looking away

**Statistics Panel:**
```
Look-Away Count: 5
Duration: 23s
```

**Top Right (Recording Status):**
- 🔴 Red: "Recording" - Interview is being recorded

## Backend Integration

### Application Model Update

Add eye-tracking data to the interview object:

```javascript
interviews: [{
  // ... existing fields
  eyeTrackingData: {
    totalLookAwayCount: Number,
    lookAwayDuration: Number,  // in seconds
    violations: Number
  }
}]
```

## Configuration

### Thresholds (in eyeTrackingService.js)

```javascript
lookAwayThreshold: 10,        // Frames before warning (10 = 1 second)
horizontalThreshold: 15,      // Pixels for left/right detection
verticalThreshold: 20,        // Pixels for up/down detection
detectionInterval: 100        // Detection frequency (100ms)
```

## Usage

### Automatic Activation

Eye tracking starts automatically when:
1. Candidate clicks "Start Interview"
2. Camera permission is granted
3. Video stream is established

### Automatic Deactivation

Eye tracking stops when:
1. Interview ends
2. Candidate exits interview
3. Recording stops

## Privacy & Performance

### Privacy
- All processing happens in the browser (client-side)
- No video frames are sent to external servers
- Only statistics are saved (no images/video analyzed by external APIs)

### Performance
- Lightweight TinyFaceDetector model (< 200KB)
- Detection runs every 100ms (10 FPS)
- Minimal CPU usage (~5-10%)
- No impact on interview recording quality

## Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 80+ (recommended)
- ✅ Edge 80+
- ✅ Firefox 75+
- ✅ Safari 13+

**Requirements:**
- WebRTC support
- getUserMedia API
- WebAssembly support

## Troubleshooting

### Issue: Eye tracking not starting
**Solution**:
- Ensure camera permissions are granted
- Check browser console for model loading errors
- Verify models are downloaded to `public/models/`

### Issue: False positives (warnings when looking at screen)
**Solution**:
- Increase `lookAwayThreshold` value
- Adjust `horizontalThreshold` and `verticalThreshold`

### Issue: Models not loading
**Solution**:
- Verify files exist in `public/models/`:
  - `tiny_face_detector_model-weights_manifest.json`
  - `tiny_face_detector_model-shard1`
  - `face_landmark_68_model-weights_manifest.json`
  - `face_landmark_68_model-shard1`

### Issue: Performance issues
**Solution**:
- Reduce detection frequency (increase `detectionInterval` from 100ms to 200ms)
- Use lower resolution video stream

## Future Enhancements

1. **Emotion Detection**: Analyze candidate's emotional state during interview
2. **Attention Score**: Calculate overall attention score based on eye tracking
3. **Head Pose Estimation**: More accurate gaze direction using 3D head pose
4. **Blink Detection**: Monitor excessive blinking (stress indicator)
5. **Multiple Face Detection**: Handle scenarios with multiple people in frame
6. **Recording Integration**: Overlay eye-tracking warnings on recorded video
7. **Configurable Sensitivity**: Allow HR managers to adjust thresholds per job

## API Reference

### eyeTrackingService

#### `startTracking(videoElement, callbacks)`
Starts eye tracking on a video element.

**Parameters:**
- `videoElement` (HTMLVideoElement): Video element to track
- `callbacks` (Object):
  - `onLookingAway(data)`: Called when candidate looks away
  - `onLookingAtScreen(data)`: Called when candidate returns focus

**Returns:** Promise

#### `stopTracking()`
Stops eye tracking and returns final statistics.

**Returns:** Object with `totalLookAwayCount` and `lookAwayDuration`

#### `getStatistics()`
Gets current tracking statistics without stopping.

**Returns:** Object with current stats

## Testing

### Manual Testing Steps

1. Start an AI interview
2. Grant camera permissions
3. Verify eye-tracking indicator appears (top-left, green)
4. Look away from camera (left, right, up, down)
5. Verify warning appears after ~1 second
6. Return focus to camera
7. Verify warning disappears
8. Complete interview
9. Check that eye-tracking stats are included in submission

### Expected Behavior

- Warning should appear within 1 second of looking away
- Warning should disappear within 1 second of returning focus
- Statistics should update in real-time
- No false positives when looking at screen

## Security Considerations

1. **No Video Recording of Tracking**: Only statistics are saved
2. **Client-Side Processing**: Face detection happens entirely in browser
3. **No Biometric Data Storage**: Facial landmarks are not saved
4. **Consent**: Candidates should be informed about eye tracking
5. **Fairness**: Feature should not discriminate based on ethnicity, glasses, etc.

## Credits

- **face-api.js**: https://github.com/justadudewhohacks/face-api.js
- **TensorFlow.js**: https://www.tensorflow.org/js

---

**Version**: 1.0.0
**Last Updated**: 2025-10-30
**Author**: SmartHR Development Team
