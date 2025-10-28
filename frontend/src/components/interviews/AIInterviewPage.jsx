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
  const [interviewStatus, setInterviewStatus] = useState('waiting'); // waiting, active, paused, completed
  const [videoStream, setVideoStream] = useState(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [uploadedRecordingUrl, setUploadedRecordingUrl] = useState(null);

  // UI state
  const [showTranscript, setShowTranscript] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);
  // Helper: save recording locally for testing
  const downloadRecordingLocally = (blob, baseName = 'interview') => {
    try {
      if (!blob) return;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${baseName}_${ts}.webm`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      console.log('Saved local copy:', filename);
    } catch (e) {
      console.warn('Failed to save local copy:', e);
    }
  };

  const fullscreenRef = useRef(null);
  const interviewRef = useRef(null);
  const ttsUtteranceRef = useRef(null);

  useEffect(() => {
    fetchInterviewDetails();

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
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        setIsMicEnabled(true);
        setIsVideoEnabled(true);
        setVideoStream(stream);

        // Set up video stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Video stream assigned to video element');

          // Start recording using the recording service with the existing stream
          try {
            await recordingService.startRecording(stream);
            setIsRecording(true);
            console.log('Recording started via service');
          } catch (recordErr) {
            console.error('Failed to start recording:', recordErr);
            // Continue with interview even if recording fails
          }

          // Enter fullscreen mode after video is set up
          try {
            if (videoRef.current.requestFullscreen) {
              await videoRef.current.requestFullscreen();
            } else if (videoRef.current.webkitRequestFullscreen) {
              await videoRef.current.webkitRequestFullscreen();
            } else if (videoRef.current.msRequestFullscreen) {
              await videoRef.current.msRequestFullscreen();
            }
            console.log('Entered fullscreen mode');
          } catch (fullscreenErr) {
            console.warn('Failed to enter fullscreen mode:', fullscreenErr);
            // Continue with interview even if fullscreen fails
          }
        }
      }

      // Kick off the first question shortly after entering fullscreen
      setTimeout(() => {
        try {
          if (interview?.aiInterview?.questions?.length) {
            // Friendly intro via TTS, then first question
            const name = interview.candidate?.firstName || 'Candidate';
            speakOutLoud(`Hi ${name}, let's begin. I will ask you five questions related to the ${interview.job?.title || 'role'}.`);
            setTimeout(() => {
              sendNextQuestion();
            }, 800);
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
          // Save a local copy for testing
          downloadRecordingLocally(blob, 'ai_interview');
        } catch (stopErr) {}
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

      // Upload recording if available
      let recordingUrl = undefined;
      const blobToUpload = finalBlob || recordingBlob;
      if (blobToUpload && !recordingUrl) {
        try {
          setIsUploadingRecording(true);
          console.log('Uploading interview recording...');
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
            setUploadedRecordingUrl(recordingUrl || null);
            console.log('Recording uploaded successfully. URL:', recordingUrl);
            if (uploadResponse.data.publicId) {
              console.log('Cloudinary public ID:', uploadResponse.data.publicId);
            }
          } else {
            console.warn('Failed to upload recording:', uploadResponse.error);
          }
        } catch (uploadErr) {
          console.error('Error uploading recording:', uploadErr);
        } finally {
          setIsUploadingRecording(false);
        }
      }

      // Optionally transcribe local recording for a text transcript
      try {
        if (recordingBlob) {
          const tr = await interviewService.transcribeAudio(recordingBlob);
          if (tr?.success && tr.data?.text) {
            setTranscript(prev => [...prev, { id: Date.now(), speaker: 'Transcript', text: tr.data.text, timestamp: new Date() }]);
          }
        }
      } catch (e) {
        console.warn('Transcription failed, continuing without transcript');
      }

      // Fallback: if upload didn't return a URL but we still have a blob, inline as base64
      let recordingBase64;
      if (!recordingUrl && (finalBlob || recordingBlob)) {
        try {
          const blobToEncode = finalBlob || recordingBlob;
          const toBase64 = (blob) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          recordingBase64 = await toBase64(blobToEncode);
          console.log('Prepared base64 fallback for recording.');
        } catch (e) {
          console.warn('Failed to create base64 fallback, continuing without video.');
        }
      }

      // Prefer sending multipart with file on completion if we have a blob
      const hasBlob = Boolean(finalBlob || recordingBlob);
      if (hasBlob && !recordingUrl) {
        try {
          const form = new FormData();
          form.append('status', 'completed');
          form.append('transcript', JSON.stringify(transcript || []));
          form.append('duration', String((interview?.duration * 60 - timeRemaining) || 0));
          form.append('feedback', feedback || '');
          form.append('completedAt', new Date().toISOString());
          const fileBlob = finalBlob || recordingBlob;
          form.append('recording', fileBlob, 'interview.webm');

          await interviewService.updateAIInterviewStatus(
            interview.application._id,
            interview._id,
            form
          );
        } catch (e) {
          console.warn('Multipart completion failed, falling back to JSON payload.');
          const interviewData = {
            status: 'completed',
            transcript: transcript,
            recordingUrl: recordingUrl,
            recordingBase64,
            duration: interview?.duration * 60 - timeRemaining,
            feedback: feedback,
            completedAt: new Date()
          };
          await interviewService.updateAIInterviewStatus(
            interview.application._id,
            interview._id,
            interviewData
          );
        }
      } else {
        const interviewData = {
          status: 'completed',
          transcript: transcript,
          recordingUrl: recordingUrl,
          recordingBase64,
          duration: interview?.duration * 60 - timeRemaining,
          feedback: feedback,
          completedAt: new Date()
        };
        await interviewService.updateAIInterviewStatus(
          interview.application._id,
          interview._id,
          interviewData
        );
      }

      // Navigate to completion page or show success message
      setInterviewStatus('submitted');
      setError(null);

    } catch (err) {
      console.error('Failed to submit interview results:', err);
      setError('Failed to save interview results');
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
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-10">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank you for completing your interview</h2>
              <p className="text-gray-600 mb-4">Your responses have been successfully saved.</p>
              {uploadedRecordingUrl && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Recording URL:</p>
                  <a className="text-sm text-blue-600 underline break-all" href={uploadedRecordingUrl} target="_blank" rel="noreferrer">
                    {uploadedRecordingUrl}
                  </a>
                </div>
              )}
              <Button onClick={() => navigate('/')}>Return Home</Button>
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
    <div className="min-h-screen bg-gray-50">
      {/* Recording Indicator */}
      {interviewStatus === 'active' && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg ${isRecording ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'}`}>
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-white/90'}`}></span>
          <span className="text-sm font-medium">{isRecording ? 'Recording' : 'Preparing recorder...'}</span>
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">AI Video Interview</h1>
              <Badge variant={getStatusBadgeVariant(interviewStatus)}>
                {getStatusLabel(interviewStatus)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
              {interviewStatus === 'active' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className={questionTimeRemaining <= 30 ? 'text-red-600 font-medium' : ''}>
                    {formatTime(questionTimeRemaining)}
                  </span>
                </div>
              )}
              {interviewStatus !== 'submitted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exitInterview}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit Interview
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {showTranscript ? 'Hide' : 'Show'} Transcript
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video/Interview Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Interview Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-900 rounded-lg relative mb-4">
                  {/* Video Element - Always present */}
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    muted
                    playsInline
                  />

                  {/* Status Overlays - Show when video is not active or not enabled */}
                  {interviewStatus === 'active' && !isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <div className={`w-4 h-4 rounded-full ${isMicEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm">AI Interview in Progress</span>
                        </div>
                        <p className="text-sm opacity-75">Listen carefully and respond naturally</p>
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
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                      <p className="text-lg">Interview Completed</p>
                      <p className="text-sm opacity-75 mt-2">Thank you for participating</p>
                    </div>
                  )}
                </div>

                {/* Waiting Status Banner - Below Video */}
                {interviewStatus === 'waiting' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Video className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-lg font-medium text-blue-900">Ready to start your interview</p>
                        <p className="text-sm text-blue-700">Click "Start Interview" to begin</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interview Controls */}
                <div className="flex items-center justify-center gap-4">
                  {interviewStatus === 'waiting' && (
                    <Button
                      onClick={startInterview}
                      disabled={isLoading || !interview}
                      size="lg"
                      className="px-8"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Interview
                    </Button>
                  )}

                  {interviewStatus === 'active' && (
                    <>
                      <Button onClick={nextQuestionNow} variant="outline">
                        Next Question
                      </Button>
                      <Button onClick={endInterview} variant="destructive">
                        <PhoneOff className="h-4 w-4 mr-2" />
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

                  {interviewStatus === 'completed' && !isSubmitting && (
                    <Button onClick={submitInterviewResults} disabled={isSubmitting}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Results
                    </Button>
                  )}

                  {isSubmitting && (
                    <Button disabled>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            {currentQuestion && interviewStatus === 'active' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Current Question</span>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className={questionTimeRemaining <= 30 ? 'text-red-600 font-medium' : ''}>
                        {formatTime(questionTimeRemaining)}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{currentQuestion}</p>
                  <Progress
                    value={(questionTimeRemaining / 120) * 100}
                    className="mt-3"
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
            <Card>
              <CardHeader>
                <CardTitle>Interview Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium">{interview.job?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{interview.job?.company || 'SmartHR'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{interview.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Remaining</p>
                  <p className="font-medium">{formatTime(timeRemaining)}</p>
                  <Progress
                    value={(timeRemaining / (interview.duration * 60)) * 100}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Transcript */}
            {showTranscript && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcript.length === 0 ? (
                      <p className="text-gray-500 text-sm">No transcript available yet</p>
                    ) : (
                      transcript.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <Badge variant={message.speaker === 'AI' ? 'default' : 'secondary'} className="text-xs">
                            {message.speaker}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{message.text}</p>
                            <p className="text-xs text-gray-500">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
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
