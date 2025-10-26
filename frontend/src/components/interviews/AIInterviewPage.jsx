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
  RotateCcw
} from 'lucide-react';
import interviewService from '../../services/interviewService';
import vapiService from '../../services/vapiService';

export default function AIInterviewPage() {
  const { link } = useParams();
  const navigate = useNavigate();

  // Interview state
  const [interview, setInterview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vapi state
  const [isVapiReady, setIsVapiReady] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('waiting'); // waiting, active, paused, completed

  // UI state
  const [showTranscript, setShowTranscript] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchInterviewDetails();
    return () => {
      // Cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      vapiService.destroy();
    };
  }, [link]);

  const fetchInterviewDetails = async () => {
    try {
      setIsLoading(true);
      const response = await interviewService.getAIInterviewByLink(link);

      if (response.success) {
        setInterview(response.data);
        setTimeRemaining(response.data.duration * 60); // Convert to seconds

        // Initialize Vapi
        await initializeVapi(response.data);
      } else {
        setError(response.error || 'Failed to load interview');
      }
    } catch (err) {
      setError(err.message || 'Failed to load interview');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeVapi = async (interviewData) => {
    try {
      // Get Vapi config from backend
      const configResponse = await interviewService.getVapiConfig(interviewData.application._id);

      if (configResponse.success) {
        const { apiKey, assistantId, model, voice } = configResponse.data;

        // Initialize Vapi service
        await vapiService.initialize(apiKey);

        // Set up event listeners
        setupVapiEventListeners();

        setIsVapiReady(true);
      } else {
        throw new Error('Failed to get Vapi configuration');
      }
    } catch (err) {
      console.error('Failed to initialize Vapi:', err);
      setError('Failed to initialize voice system');
    }
  };

  const setupVapiEventListeners = () => {
    vapiService.on('call-start', (event) => {
      console.log('Call started:', event);
      setIsInterviewActive(true);
      setInterviewStatus('active');
      startTimer();
    });

    vapiService.on('call-end', async (event) => {
      console.log('Call ended:', event);
      setIsInterviewActive(false);
      setInterviewStatus('completed');
      stopTimer();

      // Auto-submit interview data
      await submitInterviewResults(event);
    });

    vapiService.on('speech-start', (event) => {
      setIsMicEnabled(true);
    });

    vapiService.on('speech-end', (event) => {
      setIsMicEnabled(false);
    });

    vapiService.on('message', (event) => {
      if (event.type === 'transcript') {
        setTranscript(prev => [...prev, {
          id: Date.now(),
          speaker: event.speaker || 'AI',
          text: event.text,
          timestamp: new Date()
        }]);
      }
    });

    vapiService.on('conversation-update', (event) => {
      if (event.type === 'question') {
        setCurrentQuestion(event.question);
      }
    });

    vapiService.on('error', (event) => {
      console.error('Vapi error:', event);
      setError('Voice system error occurred');
    });
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

  const startInterview = async () => {
    try {
      setError(null);

      if (!interview) return;

      // Start Vapi interview with assistant overrides
      const assistantOverrides = {
        recordingEnabled: false,
        variableValues: {
          name: interview.candidate?.firstName || 'Candidate',
        },
      };

      await vapiService.startInterviewWithAssistant(
        interview.vapiAssistantId || '5966f84b-85ec-47ca-b294-9b1ca366ac2f',
        assistantOverrides
      );

      // Request microphone permission
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setIsMicEnabled(true);

        // You could set up video stream here if needed
        // videoRef.current.srcObject = stream;
      }

    } catch (err) {
      console.error('Failed to start interview:', err);
      setError('Failed to start interview. Please check your microphone permissions.');
    }
  };

  const pauseInterview = async () => {
    try {
      await vapiService.stopInterview();
      setInterviewStatus('paused');
      stopTimer();
    } catch (err) {
      console.error('Failed to pause interview:', err);
    }
  };

  const resumeInterview = async () => {
    try {
      await startInterview();
    } catch (err) {
      console.error('Failed to resume interview:', err);
    }
  };

  const endInterview = async () => {
    try {
      await vapiService.stopInterview();
      setInterviewStatus('completed');
      stopTimer();

      // Submit results
      await submitInterviewResults();
    } catch (err) {
      console.error('Failed to end interview:', err);
    }
  };

  const submitInterviewResults = async (vapiEvent = null) => {
    try {
      setIsSubmitting(true);

      const interviewData = {
        status: 'completed',
        transcript: transcript,
        vapiCallId: vapiEvent?.call?.id,
        recordingUrl: vapiEvent?.call?.recordingUrl,
        duration: interview?.duration * 60 - timeRemaining,
        feedback: feedback,
        completedAt: new Date()
      };

      await interviewService.updateAIInterviewWithVapi(
        interview.application._id,
        interview._id,
        interviewData
      );

      // Navigate to completion page or show success message
      setInterviewStatus('submitted');

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
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  {interviewStatus === 'waiting' && (
                    <div className="text-center text-white">
                      <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Ready to start your interview</p>
                      <p className="text-sm opacity-75 mt-2">Click "Start Interview" to begin</p>
                    </div>
                  )}

                  {interviewStatus === 'active' && (
                    <div className="text-center text-white">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div className={`w-4 h-4 rounded-full ${isMicEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">AI Interview in Progress</span>
                      </div>
                      <p className="text-sm opacity-75">Listen carefully and respond naturally</p>
                    </div>
                  )}

                  {interviewStatus === 'paused' && (
                    <div className="text-center text-white">
                      <Pause className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Interview Paused</p>
                    </div>
                  )}

                  {interviewStatus === 'completed' && (
                    <div className="text-center text-white">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                      <p className="text-lg">Interview Completed</p>
                      <p className="text-sm opacity-75 mt-2">Thank you for participating</p>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>

                {/* Interview Controls */}
                <div className="flex items-center justify-center gap-4">
                  {interviewStatus === 'waiting' && (
                    <Button
                      onClick={startInterview}
                      disabled={!isVapiReady}
                      size="lg"
                      className="px-8"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Interview
                    </Button>
                  )}

                  {interviewStatus === 'active' && (
                    <>
                      <Button onClick={pauseInterview} variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                      <Button onClick={endInterview} variant="destructive">
                        <PhoneOff className="h-4 w-4 mr-2" />
                        End Interview
                      </Button>
                    </>
                  )}

                  {interviewStatus === 'paused' && (
                    <>
                      <Button onClick={resumeInterview}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
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
                  <CardTitle className="text-lg">Current Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{currentQuestion}</p>
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
