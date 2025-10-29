import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  LogOut,
  Upload
} from 'lucide-react';
import interviewService, { uploadInterviewRecording, uploadInterviewRecordingByLink } from '../../services/interviewService';
import recordingService from '../../services/recordingService';

export default function AIInterviewPage() {
  const { link } = useParams();
  const navigate = useNavigate();

  // Interview state
  const [interview, setInterview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Voice/Interview state
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState(120); // default, replaced per-question
  const [totalQuestions] = useState(5); // Fixed to 5 questions
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('waiting'); // waiting, greeting, active, paused, completed
  const [videoStream, setVideoStream] = useState(null);
  const [hasGreeted, setHasGreeted] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [uploadedRecordingUrl, setUploadedRecordingUrl] = useState(null);

  // UI state
  const [showTranscript, setShowTranscript] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenExitAttempts, setFullscreenExitAttempts] = useState(0);

  // Refs
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const fullscreenContainerRef = useRef(null);
  const interviewRef = useRef(null);
  const ttsUtteranceRef = useRef(null);
  const fullscreenWarningTimeoutRef = useRef(null);

  // Define enterFullscreen function outside useEffect so it can be called from anywhere
  const enterFullscreen = async () => {
    try {
      const element = fullscreenContainerRef.current;
      if (!element) return;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (err) {
      console.warn('Failed to enter fullscreen:', err);
    }
  };

  useEffect(() => {
    // Only fetch if not already submitted
    if (interviewStatus !== 'submitted') {
      fetchInterviewDetails();
    }

    // Set up fullscreen event listeners
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement ||
                          document.webkitFullscreenElement ||
                          document.msFullscreenElement;

      if (isFullscreen && interviewStatus === 'active') {
        // Prevent picture-in-picture when in fullscreen
        document.addEventListener('keydown', preventShortcuts);
        document.addEventListener('contextmenu', preventContextMenu);
        document.addEventListener('visibilitychange', preventVisibilityChange);

        // Prevent picture-in-picture
        if (videoRef.current) {
          videoRef.current.disablePictureInPicture = true;
        }
      } else {
        // User is trying to exit fullscreen during active interview
        if (interviewStatus === 'active' && !isFullscreen) {
          setFullscreenExitAttempts(prev => prev + 1);
          setShowFullscreenWarning(true);

          // Auto-hide warning after 5 seconds
          if (fullscreenWarningTimeoutRef.current) {
            clearTimeout(fullscreenWarningTimeoutRef.current);
          }
          fullscreenWarningTimeoutRef.current = setTimeout(() => {
            setShowFullscreenWarning(false);
          }, 5000);

          // Try to re-enter fullscreen after a short delay
          setTimeout(() => {
            enterFullscreen();
          }, 100);
        }

        // Remove restrictions when exiting fullscreen
        document.removeEventListener('keydown', preventShortcuts);
        document.removeEventListener('contextmenu', preventContextMenu);
        document.removeEventListener('visibilitychange', preventVisibilityChange);

        if (videoRef.current) {
          videoRef.current.disablePictureInPicture = false;
        }
      }
    };

    const preventShortcuts = (e) => {
      // Prevent F11, Alt+F4, Alt+Tab, Ctrl+Shift+Esc, Windows key, etc.
      if (e.key === 'F11' ||
          (e.altKey && e.key === 'F4') ||
          (e.altKey && e.key === 'Tab') ||
          (e.ctrlKey && e.shiftKey && e.key === 'Escape') ||
          e.key === 'Meta' ||
          e.key === 'OS') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Allow ESC to exit fullscreen, but prevent other shortcuts
      if (e.key === 'Escape') {
        // Only allow ESC if we're in fullscreen and interview is active
        const isFullscreen = document.fullscreenElement ||
                            document.webkitFullscreenElement ||
                            document.msFullscreenElement;
        if (!isFullscreen) {
          e.preventDefault();
          return false;
        }
      }
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const preventVisibilityChange = () => {
      // Prevent tab switching or window minimization
      if (document.hidden && interviewStatus === 'active') {
        // Force focus back to the window
        window.focus();
      }
    };

    // Add fullscreen change listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (fullscreenWarningTimeoutRef.current) {
        clearTimeout(fullscreenWarningTimeoutRef.current);
      }
      // Stop any ongoing TTS
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // Remove event listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', preventShortcuts);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('visibilitychange', preventVisibilityChange);
    };
  }, [link, interviewStatus]);

  const fetchInterviewDetails = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching interview details for link:', link);
      const response = await interviewService.getAIInterviewByLink(link);
      console.log('Interview response:', response);

      // Check if authentication is required
      if (response.requiresAuth) {
        console.log('Authentication required, redirecting to login...');
        // Store the interview link to redirect back after login
        localStorage.setItem('redirectAfterLogin', `/ai-interview/${link}`);
        navigate('/', {
          state: {
            message: 'Please log in to access your interview',
            returnUrl: `/ai-interview/${link}`
          }
        });
        return;
      }

      // Check if wrong account is used
      if (response.requiresCorrectAccount) {
        console.log('Wrong account used');
        setError(
          `This interview is assigned to ${response.expectedEmail}. Please log out and log in with the correct account.`
        );
        return;
      }

      if (response.success && response.data) {
        // Validate interview data structure
        if (!response.data.application || !response.data.application._id) {
          console.error('Invalid interview data structure:', response.data);
          throw new Error('Invalid interview data: Missing application details');
        }

        console.log('Interview data:', {
          applicationId: response.data.application._id,
          duration: response.data.aiInterview?.duration,
          status: response.data.status
        });

        setInterview(response.data);
        const durationMinutes = response.data.aiInterview?.duration || 0;
        setTimeRemaining(durationMinutes * 60); // Convert to seconds

        // No external voice initialization required
        setIsInterviewActive(false);
      } else if (response.expired) {
        const errorMsg = response.error || 'This interview link has expired';
        console.error('Expired interview link:', errorMsg);
        setError(errorMsg);
      } else {
        const errorMsg = response.error || 'Failed to load interview';
        console.error('Failed to load interview:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Error in fetchInterviewDetails:', err);
      setError(err.message || 'Failed to load interview');
    } finally {
      setIsLoading(false);
    }
  };

  const speakOutLoud = (text) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      ttsUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopTimer();
          endInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startQuestionTimer = () => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up for this question, move to next
          stopQuestionTimer();
          sendNextQuestion();
          return 120; // Reset for next question
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQuestionTimer = () => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  };

  const stopMediaDevices = () => {
    try {
      if (videoStream) {
        videoStream.getTracks().forEach(t => {
          try { t.stop(); } catch {}
        });
      }
      if (videoRef.current) {
        try { videoRef.current.srcObject = null; } catch {}
      }
      setIsMicEnabled(false);
      setIsVideoEnabled(false);
      setVideoStream(null);
    } catch {}
  };

  // Allow manual advance to next question
  const nextQuestionNow = () => {
    try {
      stopQuestionTimer();
      sendNextQuestion();
    } catch (e) {
      console.warn('Failed to advance to next question');
    }
  };

  // Send the next question from the generated list
  const sendNextQuestion = async () => {
    try {
      if (!interview || !interview.aiInterview || !interview.aiInterview.questions) return;
      const questions = interview.aiInterview.questions;
      const nextIndex = (questionIndex || 0) + 1;

      if (nextIndex >= questions.length) {
        console.log('All questions asked');
        // Optionally end interview automatically when questions exhausted
        // await endInterview();
        return;
      }

      const q = questions[nextIndex];
      const qText = typeof q === 'string' ? q : (q.text || q.question || q.prompt || JSON.stringify(q));

      console.log('Asking next question:', { index: nextIndex, text: qText });
      setQuestionIndex(nextIndex);
      setCurrentQuestion(qText);
      const limit = typeof q === 'object' && q.timeLimit ? q.timeLimit : 120;
      setQuestionTimeRemaining(limit);

      // Start the question timer
      startQuestionTimer();

      // Ask aloud via browser TTS (optional)
      speakOutLoud(qText);
    } catch (err) {
      console.error('Error in sendNextQuestion:', err);
    }
  };

  const startInterview = async () => {
    try {
      setError(null);

      if (!interview) return;

      // Reset question index
      setQuestionIndex(-1);

      // Mark active and start timers
      setIsInterviewActive(true);
      setInterviewStatus('active');
      startTimer();

      // Request microphone and camera permissions
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Requesting camera and microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        console.log('✅ Media stream obtained:', {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
          videoTrackEnabled: stream.getVideoTracks()[0]?.enabled,
          audioTrackEnabled: stream.getAudioTracks()[0]?.enabled
        });

        console.log('Setting state updates...');
        setIsMicEnabled(true);
        setIsVideoEnabled(true);
        setVideoStream(stream);
        console.log('State updates set');

        // Wait for React to render the video element
        console.log('Waiting for video element to be available...');
        await new Promise((resolve) => {
          const checkVideoRef = () => {
            if (videoRef.current) {
              console.log('✅ Video element is now available');
              resolve();
            } else {
              console.log('⏳ Video element not ready yet, checking again...');
              setTimeout(checkVideoRef, 100);
            }
          };
          checkVideoRef();
        });

        // Set up video stream
        console.log('Checking videoRef.current:', videoRef.current ? 'exists' : 'NULL');
        if (videoRef.current) {
          console.log('Assigning stream to video element...');
          videoRef.current.srcObject = stream;
          console.log('✅ Video stream assigned to video element');

          // Wait for video to start playing with timeout
          try {
            await Promise.race([
              new Promise((resolve) => {
                videoRef.current.onloadedmetadata = () => {
                  console.log('✅ Video metadata loaded');
                  videoRef.current.play().then(() => {
                    console.log('✅ Video playing');
                    resolve();
                  }).catch((playErr) => {
                    console.warn('Video autoplay blocked, continuing anyway:', playErr);
                    resolve(); // Continue even if autoplay is blocked
                  });
                };
              }),
              new Promise((resolve) => setTimeout(() => {
                console.log('⚠️ Video metadata timeout, continuing anyway');
                resolve();
              }, 2000)) // 2 second timeout
            ]);
          } catch (videoErr) {
            console.warn('Video setup warning:', videoErr);
          }

          // Start recording using the recording service with the existing stream
          try {
            console.log('Starting recording service...');
            await recordingService.startRecording(stream);
            setIsRecording(true);
            console.log('✅ Recording started successfully');
          } catch (recordErr) {
            console.error('❌ Failed to start recording:', recordErr);
            setError(`Warning: Recording failed to start - ${recordErr.message}`);
            // Continue with interview even if recording fails
          }

          // Enter fullscreen mode after video is set up
          try {
            console.log('Entering fullscreen mode on entire interview page...');
            await enterFullscreen();
            console.log('✅ Entered fullscreen mode');
          } catch (fullscreenErr) {
            console.warn('⚠️ Failed to enter fullscreen mode:', fullscreenErr);
            // Continue with interview even if fullscreen fails
          }
        } else {
          console.error('❌ videoRef.current is NULL! Cannot assign video stream.');
        }
      } else {
        console.error('❌ navigator.mediaDevices.getUserMedia not available!');
      }

      // Start first question immediately
      setTimeout(() => {
        try {
          if (interview?.aiInterview?.questions?.length) {
            sendNextQuestion();
          }
        } catch {}
      }, 500);

    } catch (err) {
      console.error('Failed to start interview:', err);
      setError('Failed to start interview. Please check your microphone and camera permissions.');
    }
  };

  const pauseInterview = async () => {
    try {
      setInterviewStatus('paused');
      stopTimer();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (err) {
      console.error('Failed to pause interview:', err);
    }
  };

  const resumeInterview = async () => {
    try {
      setInterviewStatus('active');
      startTimer();
    } catch (err) {
      console.error('Failed to resume interview:', err);
    }
  };

  const endInterview = async () => {
    try {
      setInterviewStatus('completed');
      stopTimer();
      stopQuestionTimer();
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      // Stop recording if active
      let finalBlob = recordingBlob;
      if (isRecording) {
        try {
          const blob = await recordingService.stopRecording();
          finalBlob = blob;
          setRecordingBlob(blob);
          setIsRecording(false);
          console.log('Recording stopped successfully, blob size:', blob.size);
        } catch (stopErr) {
          console.error('Error stopping recording:', stopErr);
        }
      }

      // Stop camera and mic
      stopMediaDevices();

      // Submit results
      await submitInterviewResults(null, finalBlob);
    } catch (err) {
      console.error('Failed to end interview:', err);
    }
  };

  const exitInterview = async () => {
    try {
      // Stop the interview immediately
      setInterviewStatus('completed');
      stopTimer();
      stopQuestionTimer();
      if (window.speechSynthesis) window.speechSynthesis.cancel();

      // Submit results with current state
      await submitInterviewResults();

      // Navigate away or show completion message
      setInterviewStatus('submitted');

      // Stop camera and mic
      stopMediaDevices();
    } catch (err) {
      console.error('Failed to exit interview:', err);
      setError('Failed to exit interview');
    }
  };

  const submitInterviewResults = async (vapiEvent = null, finalBlob = null) => {
    try {
      setIsSubmitting(true);

      if (!interview || !interview.application || !interview.application._id) {
        console.error('Invalid interview data for submission:', interview);
        throw new Error('Invalid interview data: Missing application information');
      }

      // Upload recording to Cloudinary FIRST
      let recordingUrl = null;
      const blobToUpload = finalBlob || recordingBlob;

      if (blobToUpload) {
        try {
          setIsUploadingRecording(true);
          console.log('Uploading recording to Cloudinary...', {
            blobSize: blobToUpload.size,
            blobType: blobToUpload.type
          });

          let uploadResponse;
          if (link) {
            uploadResponse = await uploadInterviewRecordingByLink(
              link,
              blobToUpload,
              'video'
            );
          } else {
            uploadResponse = await uploadInterviewRecording(
              interview.application._id,
              interview._id,
              blobToUpload,
              'video'
            );
          }

          if (uploadResponse.success) {
            recordingUrl = uploadResponse.data.recordingUrl || uploadResponse.data.url;
            setUploadedRecordingUrl(recordingUrl);
            console.log('✅ Recording uploaded to Cloudinary successfully!', {
              url: recordingUrl,
              publicId: uploadResponse.data.publicId,
              size: uploadResponse.data.size,
              duration: uploadResponse.data.duration
            });
          } else {
            console.error('❌ Cloudinary upload failed:', uploadResponse.error);
            setError('Warning: Recording upload failed. Please contact support.');
            throw new Error('Recording upload failed: ' + (uploadResponse.error || 'Unknown error'));
          }
        } catch (uploadErr) {
          console.error('❌ Error uploading recording to Cloudinary:', uploadErr);
          setError('Failed to upload recording to cloud storage. Please try again or contact support.');
          setIsUploadingRecording(false);
          setIsSubmitting(false);
          return; // Stop here if upload fails
        } finally {
          setIsUploadingRecording(false);
        }
      } else {
        console.warn('No recording blob available to upload');
      }

      // Now submit interview completion with the Cloudinary URL
      const interviewData = {
        status: 'completed',
        transcript: transcript,
        recordingUrl: recordingUrl, // Cloudinary URL
        duration: interview?.duration * 60 - timeRemaining,
        feedback: feedback,
        completedAt: new Date()
      };

      console.log('Submitting interview completion data:', {
        status: interviewData.status,
        hasRecordingUrl: !!interviewData.recordingUrl,
        transcriptLength: transcript.length,
        duration: interviewData.duration
      });

      // Use public endpoint for status update
      await interviewService.updateAIInterviewStatusByLink(
        link,
        interviewData
      );

      console.log('✅ Interview submitted successfully');
      setInterviewStatus('submitted');
      setError(null);

      // Show success message and redirect to home/dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000); // 3 seconds to show the success message

    } catch (err) {
      console.error('Failed to submit interview results:', err);
      setError(err.message || 'Failed to save interview results. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      waiting: 'secondary',
      active: 'default',
      paused: 'secondary',
      completed: 'default',
      submitted: 'default'
    };
    return variants[status] || 'secondary';
  };

  const getStatusLabel = (status) => {
    const labels = {
      waiting: 'Ready to Start',
      active: 'In Progress',
      paused: 'Paused',
      completed: 'Completed',
      submitted: 'Submitted'
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (interviewStatus === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-2 border-green-100">
          <CardContent className="pt-8 pb-10">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-pulse">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You for Submitting the Interview</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Your interview responses and recording have been successfully submitted. You will be redirected to your dashboard shortly.
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Redirecting to dashboard...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Error</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>Return Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Interview Not Found</h2>
              <p className="text-gray-600 mb-4">The interview link is invalid or has expired.</p>
              <Button onClick={() => navigate('/')}>Return Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={fullscreenContainerRef} className="min-h-screen bg-gray-50">
      {/* Fullscreen Warning Modal */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-10 animate-in zoom-in-95 duration-300 border-4 border-red-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6 animate-pulse">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                ⚠️ Warning: Fullscreen Mode Required
              </h3>
              <p className="text-lg text-gray-700 mb-4 leading-relaxed font-medium">
                You must remain in fullscreen mode during the interview!
              </p>
              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                Exiting fullscreen mode may result in disqualification or invalid interview recording. Please stay in fullscreen until the interview is complete.
              </p>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-5 mb-8 w-full shadow-lg">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-base font-bold text-red-800">
                    Exit Attempts: {fullscreenExitAttempts}
                  </p>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  Multiple exit attempts are being recorded and may affect your application.
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowFullscreenWarning(false);
                  enterFullscreen();
                }}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xl py-7 shadow-xl font-bold"
              >
                ↩ Return to Fullscreen Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {interviewStatus === 'active' && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg ${isRecording ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'}`}>
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-white/90'}`}></span>
          <span className="text-sm font-medium">{isRecording ? 'Recording' : 'Preparing recorder...'}</span>
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shadow-xl border-b-4 border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 shadow-lg">
                <Video className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">AI Video Interview</h1>
                <Badge variant={getStatusBadgeVariant(interviewStatus)} className="mt-1.5 bg-white/20 text-white border-white/40 backdrop-blur-sm shadow-sm">
                  {getStatusLabel(interviewStatus)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {interviewStatus === 'active' && (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-3 rounded-xl shadow-lg border border-white/30">
                  <Clock className="h-5 w-5 text-white" />
                  <div className="text-white">
                    <p className="text-xs opacity-90 font-medium">Question Time</p>
                    <p className={`text-xl font-bold ${questionTimeRemaining <= 30 ? 'text-red-200' : ''}`}>
                      {formatTime(questionTimeRemaining)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video/Interview Area */}
            <Card className="shadow-xl border-2 border-purple-100 overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
                  {/* Video Element - Always present */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />

                  {/* Greeting Overlay - Removed */}

                  {/* Status Overlays - Show when video is not active or not enabled */}
                  {interviewStatus === 'active' && !isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-purple-900/80 to-blue-900/80 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center gap-4 mb-4 bg-white/10 rounded-full px-6 py-3">
                          <div className={`w-3 h-3 rounded-full ${isMicEnabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                          <span className="text-sm font-medium">Interview in Progress</span>
                        </div>
                        <p className="text-sm opacity-90">Listen carefully and respond naturally</p>
                      </div>
                    </div>
                  )}

                  {interviewStatus === 'paused' && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50">
                      <Pause className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Interview Paused</p>
                    </div>
                  )}

                  {interviewStatus === 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50">
                      <div className="text-center">
                        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                        <p className="text-lg">Interview Completed</p>
                        <p className="text-sm opacity-75 mt-2">Thank you for participating</p>
                        {isUploadingRecording && (
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <Upload className="h-4 w-4 animate-pulse" />
                            <p className="text-sm">Uploading recording to cloud storage...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Interview Controls */}
                <div className="p-6 bg-white border-t-2 border-gray-100">
                  {/* Waiting Status Banner */}
                  {interviewStatus === 'waiting' && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-6 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg flex-shrink-0">
                          <Video className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-900 mb-1">Ready to start your interview?</p>
                          <p className="text-sm text-gray-600">Make sure you're in a quiet environment with good lighting</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-4">
                  {interviewStatus === 'waiting' && (
                    <Button
                      onClick={startInterview}
                      disabled={isLoading || !interview}
                      size="lg"
                      className="px-12 py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                    >
                      <Play className="h-6 w-6 mr-3" />
                      Start Interview
                    </Button>
                  )}

                  {interviewStatus === 'active' && (
                    <>
                      <Button onClick={nextQuestionNow} variant="outline" size="lg" className="border-2 hover:bg-gray-50">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Next Question
                      </Button>
                      <Button onClick={endInterview} variant="destructive" size="lg" className="shadow-lg hover:bg-red-700">
                        <PhoneOff className="h-5 w-5 mr-2" />
                        End Interview
                      </Button>
                    </>
                  )}

                  {interviewStatus === 'paused' && (
                    <>
                      <Button onClick={endInterview} variant="destructive">
                        <PhoneOff className="h-4 w-4 mr-2" />
                        End Interview
                      </Button>
                    </>
                  )}

                  {interviewStatus === 'completed' && !isSubmitting && !isUploadingRecording && (
                    <Button onClick={submitInterviewResults} disabled={isSubmitting || isUploadingRecording}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Results
                    </Button>
                  )}

                  {isUploadingRecording && (
                    <Button disabled>
                      <Upload className="h-4 w-4 mr-2 animate-pulse" />
                      Uploading recording to cloud...
                    </Button>
                  )}

                  {isSubmitting && !isUploadingRecording && (
                    <Button disabled>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting interview...
                    </Button>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            {currentQuestion && interviewStatus === 'active' && (
              <Card className="shadow-lg border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {questionIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg">Question {questionIndex + 1} of {totalQuestions}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">Take your time to answer</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className={`text-sm font-semibold ${questionTimeRemaining <= 30 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatTime(questionTimeRemaining)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                    <p className="text-lg text-gray-800 leading-relaxed">{currentQuestion}</p>
                  </div>
                  <Progress
                    value={(questionTimeRemaining / 120) * 100}
                    className="mt-4 h-2"
                  />
                </CardContent>
              </Card>
            )}

            {/* Feedback Section */}
            {interviewStatus === 'completed' && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Feedback (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Any additional comments about your interview experience..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interview Info */}
            <Card className="shadow-lg border-2 border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  Interview Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Position</p>
                  <p className="font-bold text-gray-900 text-lg">{interview.application?.job?.title || interview.job?.title || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Candidate</p>
                  <p className="font-semibold text-gray-900">
                    {interview.application?.applicant?.firstName && interview.application?.applicant?.lastName
                      ? `${interview.application.applicant.firstName} ${interview.application.applicant.lastName}`
                      : 'Not specified'}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Duration</p>
                  <p className="font-bold text-blue-900 text-lg">{interview.aiInterview?.duration || interview.duration || 30} minutes</p>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Time Remaining</p>
                    <Clock className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="font-bold text-gray-900 text-2xl mb-3">{formatTime(timeRemaining)}</p>
                  <Progress
                    value={(timeRemaining / ((interview.aiInterview?.duration || interview.duration || 30) * 60)) * 100}
                    className="h-3"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {Math.round((timeRemaining / ((interview.aiInterview?.duration || interview.duration || 30) * 60)) * 100)}% remaining
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracker */}
            {interviewStatus === 'active' && (
              <Card className="shadow-lg border-2 border-green-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          i < questionIndex + 1
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md'
                            : i === questionIndex + 1
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md animate-pulse'
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                        }`}>
                          {i < questionIndex + 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            i < questionIndex + 1 ? 'text-green-600' : i === questionIndex + 1 ? 'text-blue-600' : 'text-gray-400'
                          }`}>
                            Question {i + 1}
                          </p>
                          {i < questionIndex + 1 && (
                            <p className="text-xs text-green-500">Completed</p>
                          )}
                          {i === questionIndex + 1 && (
                            <p className="text-xs text-blue-500">In progress...</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
