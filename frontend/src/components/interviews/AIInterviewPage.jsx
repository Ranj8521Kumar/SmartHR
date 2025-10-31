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
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import interviewService, { uploadInterviewRecording, uploadInterviewRecordingByLink } from '../../services/interviewService';
import recordingService from '../../services/recordingService';
import eyeTrackingService from '../../services/eyeTrackingService';

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
  const [totalQuestions, setTotalQuestions] = useState(5); // Will be set dynamically from interview data
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('waiting'); // waiting, active, paused, completed
  const [videoStream, setVideoStream] = useState(null);
  const [isGreeting, setIsGreeting] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [uploadedRecordingUrl, setUploadedRecordingUrl] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // UI state
  const [showTranscript, setShowTranscript] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenExitAttempts, setFullscreenExitAttempts] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(null); // Cache selected voice

  // Eye tracking state
  const [isEyeTrackingActive, setIsEyeTrackingActive] = useState(false);
  const [showEyeTrackingWarning, setShowEyeTrackingWarning] = useState(false);
  const [eyeTrackingWarningMessage, setEyeTrackingWarningMessage] = useState('');
  const [eyeTrackingViolations, setEyeTrackingViolations] = useState(0);
  const [eyeTrackingStats, setEyeTrackingStats] = useState({
    totalLookAwayCount: 0,
    lookAwayDuration: 0,
    isCurrentlyLookingAway: false
  });

  // Refs
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const fullscreenContainerRef = useRef(null);
  const interviewRef = useRef(null);
  const ttsUtteranceRef = useRef(null);
  const fullscreenWarningTimeoutRef = useRef(null);
  const audioRef = useRef(null); // For ElevenLabs audio playback

  // Debug: Monitor timeRemaining changes
  useEffect(() => {
    console.log('🔍 timeRemaining changed to:', timeRemaining);
  }, [timeRemaining]);

  // Debug: Monitor interviewStatus changes
  useEffect(() => {
    console.log('🔍 interviewStatus changed to:', interviewStatus);
  }, [interviewStatus]);

  // Load voices on component mount and select best voice
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Trigger voice loading
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          console.log('✅ Voices loaded:', voices.length);
          console.log('🎤 Available voices:', voices.map(v => v.name).join(', '));

          // Select and cache the best voice
          const bestVoice = getBestVoice();
          if (bestVoice) {
            setSelectedVoice(bestVoice);
            console.log('🎯 Selected voice for interview:', bestVoice.name);
          }
        }
      };

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }

      // Try loading immediately
      loadVoices();
    }
  }, []);

  // Define enterFullscreen function outside useEffect so it can be called from anywhere
  const enterFullscreen = async () => {
    try {
      const element = fullscreenContainerRef.current;
      console.log('enterFullscreen called, element exists:', !!element);
      console.log('Element details:', {
        tagName: element?.tagName,
        id: element?.id,
        className: element?.className
      });

      if (!element) {
        console.error('❌ fullscreenContainerRef.current is null!');
        throw new Error('Fullscreen container element not found');
      }

      console.log('Attempting to request fullscreen...');
      console.log('Checking fullscreen APIs:', {
        requestFullscreen: !!element.requestFullscreen,
        webkitRequestFullscreen: !!element.webkitRequestFullscreen,
        mozRequestFullScreen: !!element.mozRequestFullScreen,
        msRequestFullscreen: !!element.msRequestFullscreen
      });

      // Try all possible fullscreen methods
      if (element.requestFullscreen) {
        console.log('Using element.requestFullscreen()');
        await element.requestFullscreen({ navigationUI: "hide" });
      } else if (element.webkitRequestFullscreen) {
        console.log('Using element.webkitRequestFullscreen()');
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        console.log('Using element.mozRequestFullScreen()');
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        console.log('Using element.msRequestFullscreen()');
        await element.msRequestFullscreen();
      } else {
        console.error('❌ No fullscreen API available!');
        console.error('Browser:', navigator.userAgent);
        throw new Error('Fullscreen API not supported by this browser');
      }

      console.log('✅ Fullscreen request completed');

      // Verify fullscreen was actually entered
      setTimeout(() => {
        const isFullscreen = document.fullscreenElement ||
                            document.webkitFullscreenElement ||
                            document.mozFullScreenElement ||
                            document.msFullscreenElement;
        console.log('Fullscreen verification after 500ms:', {
          isFullscreen: !!isFullscreen,
          fullscreenElement: isFullscreen?.tagName
        });
      }, 500);
    } catch (err) {
      console.error('❌ Failed to enter fullscreen:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      throw err; // Re-throw so caller can handle
    }
  };

  useEffect(() => {
    // Only fetch if not already submitted
    if (interviewStatus !== 'submitted') {
      fetchInterviewDetails();
    }

    // Define event handlers
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement ||
                          document.webkitFullscreenElement ||
                          document.mozFullScreenElement ||
                          document.msFullscreenElement;

      // Check if interview is in progress (active)
      const isInterviewInProgress = interviewStatus === 'active';

      if (isFullscreen && isInterviewInProgress) {
        // Prevent picture-in-picture when in fullscreen
        document.addEventListener('contextmenu', preventContextMenu);
        document.addEventListener('visibilitychange', preventVisibilityChange);

        // Prevent picture-in-picture
        if (videoRef.current) {
          videoRef.current.disablePictureInPicture = true;
        }
      } else {
        // User is trying to exit fullscreen during interview (active)
        if (isInterviewInProgress && !isFullscreen) {
          setFullscreenExitAttempts(prev => prev + 1);
          setShowFullscreenWarning(true);

          // Warning stays visible until user clicks button to return to fullscreen
          // No automatic timeout - user MUST manually click to continue interview
        }

        // Remove restrictions when exiting fullscreen
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

      // Block ESC key entirely during interview (active) to prevent fullscreen exit
      if (e.key === 'Escape' && interviewStatus === 'active') {
        e.preventDefault();
        e.stopPropagation();
        console.log('⚠️ ESC key blocked during interview');

        // Show warning - stays visible until user returns to fullscreen
        setShowFullscreenWarning(true);

        return false;
      }
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const preventVisibilityChange = () => {
      // Prevent tab switching or window minimization during interview (active)
      if (document.hidden && interviewStatus === 'active') {
        // Force focus back to the window
        window.focus();
      }
    };

    // Add fullscreen change listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Add keyboard shortcut prevention when interview is in progress (active)
    if (interviewStatus === 'active') {
      console.log('🔒 Adding keyboard event listener to block ESC key during interview');
      document.addEventListener('keydown', preventShortcuts, true); // Use capture phase
    }

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
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', preventShortcuts, true); // Match capture phase
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('visibilitychange', preventVisibilityChange);
    };
  }, [link, interviewStatus]);

  // Ensure video stream stays attached when status changes or stream updates
  useEffect(() => {
    console.log('🔄 Video attachment useEffect triggered:', {
      hasVideoRef: !!videoRef.current,
      hasStream: !!videoStream,
      status: interviewStatus,
      currentSrcObject: !!videoRef.current?.srcObject
    });

    if (videoRef.current && videoStream && interviewStatus === 'active') {
      console.log('🔄 useEffect: Ensuring video stream is attached for status:', interviewStatus);

      // Always re-attach when status changes to ensure stream is present
      console.log('📹 Re-attaching stream in useEffect');
      videoRef.current.srcObject = videoStream;

      // Force video properties
      videoRef.current.autoplay = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;

      // Ensure video is playing
      videoRef.current.play()
        .then(() => {
          console.log('✅ Video playing successfully in useEffect');
        })
        .catch(err => {
          console.warn('Video play error in useEffect:', err);
          // Try again after a short delay
          setTimeout(() => {
            if (videoRef.current && videoRef.current.srcObject) {
              videoRef.current.play().catch(e => console.error('Retry play failed:', e));
            }
          }, 100);
        });

      // Log video dimensions after a short delay
      setTimeout(() => {
        if (videoRef.current) {
          console.log('📹 Current video dimensions:', {
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
            srcObject: !!videoRef.current.srcObject,
            paused: videoRef.current.paused,
            readyState: videoRef.current.readyState
          });
        }
      }, 200);
    }
  }, [interviewStatus, videoStream]);

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

        // Set total questions dynamically from interview data
        const questionsCount = response.data.aiInterview?.questions?.length || 5;
        setTotalQuestions(questionsCount);
        console.log(`📊 Interview loaded: ${questionsCount} questions, ${durationMinutes} minutes total`);

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

  // Select the best available voice for interviews
  const getBestVoice = () => {
    if (!('speechSynthesis' in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));

    // Priority order of high-quality voices (INDIAN FEMALE voices first)
    const preferredVoices = [
      // Indian English Female Voices - HIGHEST PRIORITY (Neerja first)
      'Microsoft Neerja Online (Natural) - English (India)',
      'Microsoft Neerja - English (India)',
      'Neerja',
      'Microsoft Heera Online (Natural) - English (India)',
      'Microsoft Heera - English (India)',
      'Heera',
      'Microsoft Swara Online (Natural) - English (India)',
      'Microsoft Swara - English (India)',
      'Swara',
      'Google हिन्दी India',
      'Google UK English Female', // Often has Indian-accented option
      'Veena',

      // Microsoft Neural Voices (Windows 11/Edge) - BEST QUALITY - Very Natural
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Michelle Online (Natural) - English (United States)',
      'Microsoft Ana Online (Natural) - English (United States)',

      // Microsoft Edge Premium Voices - HIGH QUALITY
      'Microsoft Zira Desktop - English (United States)',
      'Microsoft Zira - English (United States)',

      // Google Voices (Chrome/Android) - GOOD QUALITY - Clear and professional
      'Google US English Female',
      'Google US English',

      // macOS Premium Voices - EXCELLENT QUALITY
      'Samantha (Enhanced)',
      'Samantha',
      'Ava (Enhanced)',
      'Ava',
      'Karen',
      'Allison',

      // iOS Voices - GOOD QUALITY
      'Nicky',
      'Samantha (Premium)',

      // Fallback regional English voices
      'en-IN', // Indian English
      'en-US',
      'en-GB',
      'en-AU'
    ];

    // Exclude male voices
    const maleVoiceKeywords = ['david', 'mark', 'ravi', 'male', 'man', 'guy', 'james', 'daniel', 'christopher'];

    // Try to find preferred voice (exact or partial match)
    for (const preferredName of preferredVoices) {
      const voice = voices.find(v => {
        const nameLower = v.name.toLowerCase();
        const preferredLower = preferredName.toLowerCase();

        // Skip male voices
        if (maleVoiceKeywords.some(keyword => nameLower.includes(keyword))) {
          return false;
        }

        return v.name === preferredName ||
               nameLower.includes(preferredLower) ||
               (v.lang.startsWith('en') && nameLower.includes(preferredLower.split(' ')[0]));
      });

      if (voice) {
        console.log('✅ Selected preferred voice:', voice.name, `[${voice.lang}]`);
        return voice;
      }
    }

    // Fallback 1: Find Indian English FEMALE voice (Neerja preferred, exclude Ravi which is male)
    const indianVoice = voices.find(v => {
      const nameLower = v.name.toLowerCase();
      // Exclude male Indian voices
      if (nameLower.includes('ravi')) return false;

      // Prioritize Neerja
      if (nameLower.includes('neerja')) return true;

      return v.lang.includes('IN') ||
        v.lang.includes('hi') ||
        nameLower.includes('india') ||
        nameLower.includes('heera') ||
        nameLower.includes('swara') ||
        nameLower.includes('veena');
    });
    if (indianVoice) {
      console.log('✅ Selected Indian voice:', indianVoice.name);
      return indianVoice;
    }

    // Fallback 2: Find any high-quality English female voice with "natural" or "neural" in name
    const premiumVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('natural') ||
       v.name.toLowerCase().includes('neural') ||
       v.name.toLowerCase().includes('enhanced') ||
       v.name.toLowerCase().includes('premium'))
    );
    if (premiumVoice) {
      console.log('✅ Selected premium voice:', premiumVoice.name);
      return premiumVoice;
    }

    // Fallback 3: Find any high-quality English female voice
    const englishFemaleVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('female') ||
       v.name.toLowerCase().includes('aria') ||
       v.name.toLowerCase().includes('zira') ||
       v.name.toLowerCase().includes('jenny') ||
       v.name.toLowerCase().includes('samantha') ||
       v.name.toLowerCase().includes('karen'))
    );
    if (englishFemaleVoice) {
      console.log('✅ Selected fallback female voice:', englishFemaleVoice.name);
      return englishFemaleVoice;
    }

    // Fallback 3: Any English voice
    const anyEnglishVoice = voices.find(v => v.lang.startsWith('en'));
    if (anyEnglishVoice) {
      console.log('⚠️ Using basic English voice:', anyEnglishVoice.name);
      return anyEnglishVoice;
    }

    console.warn('⚠️ No suitable voice found, using default');
    return null;
  };

  const speakOutLoud = async (text, isGreeting = false) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      console.log(`🗣️ Requesting HuggingFace Whisper TTS for: "${text.substring(0, 50)}..." (isGreeting: ${isGreeting})`);

      // Call backend API to get audio from HuggingFace
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tts/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TTS API returned error:', response.status, errorText);
        throw new Error(`Failed to generate speech: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ TTS API response:', { success: data.success, hasAudio: !!data.audio, audioLength: data.audio?.length, contentType: data.contentType });

      if (!data.success || !data.audio) {
        console.error('❌ Invalid TTS response:', data);
        throw new Error('Invalid response from TTS service');
      }

      // Convert base64 audio to blob and play
      // HuggingFace SpeechT5 returns FLAC audio
      const audioBlob = base64ToBlob(data.audio, data.contentType || 'audio/flac');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = audioUrl;

      // Add event listener for completion
      audioRef.current.onended = () => {
        console.log(`✅ ${isGreeting ? 'Greeting' : 'Question'} speech completed`);
        URL.revokeObjectURL(audioUrl); // Clean up
      };

      // Play the audio
      await audioRef.current.play();
      console.log('✅ HuggingFace Microsoft SpeechT5 TTS voice playing');

    } catch (e) {
      console.error('HuggingFace TTS error:', e);
      // Fallback to enhanced browser TTS if HuggingFace fails
      console.warn('⚠️ Falling back to browser TTS');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Use best available browser voice as fallback
        const voiceToUse = selectedVoice || getBestVoice();
        if (voiceToUse) {
          utterance.voice = voiceToUse;
        }

        utterance.rate = isGreeting ? 0.9 : 0.95;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  const startTimer = () => {
    if (timerRef.current) {
      console.warn('⚠️ Total timer already running, stopping previous timer');
      clearInterval(timerRef.current);
    }
    console.log('▶️ Starting total interview timer, initial time:', timeRemaining);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        console.log('⏱️ Total timer tick:', newTime, 'seconds remaining');
        if (newTime <= 0) {
          console.log('⏰ Total time expired, ending interview');
          stopTimer();
          endInterview();
          return 0;
        }
        return newTime;
      });
    }, 1000);
    console.log('✅ Total timer interval created:', timerRef.current);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      console.log('⏸️ Stopping total interview timer, ID:', timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('✅ Total timer stopped and cleared');
    } else {
      console.log('ℹ️ stopTimer called but timer is already null');
    }
  };

  const startQuestionTimer = () => {
    if (questionTimerRef.current) {
      console.warn('⚠️ Question timer already running, stopping previous timer');
      clearInterval(questionTimerRef.current);
    }
    console.log('▶️ Starting question timer');

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up for this question, move to next
          console.log('⏰ Question time expired, moving to next question');
          stopQuestionTimer();
          sendNextQuestion();
          return prev; // Keep current value, sendNextQuestion will set the new time
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQuestionTimer = () => {
    if (questionTimerRef.current) {
      console.log('⏸️ Stopping question timer');
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
      if (!interview || !interview.aiInterview || !interview.aiInterview.questions) {
        console.warn('⚠️ Cannot send next question: missing interview or questions data');
        return;
      }
      const questions = interview.aiInterview.questions;
      const nextIndex = (questionIndex || 0) + 1;

      if (nextIndex >= questions.length) {
        console.log('✅ All questions asked, no more questions remaining');
        // Optionally end interview automatically when questions exhausted
        // await endInterview();
        return;
      }

      const q = questions[nextIndex];
      const qText = typeof q === 'string' ? q : (q.text || q.question || q.prompt || JSON.stringify(q));
      const limit = typeof q === 'object' && q.timeLimit ? q.timeLimit : 120;

      console.log('📝 Asking next question:', {
        index: nextIndex + 1,
        total: questions.length,
        timeLimit: limit,
        text: qText.substring(0, 50) + '...'
      });

      setQuestionIndex(nextIndex);
      setCurrentQuestion(qText);
      setQuestionTimeRemaining(limit);

      // Start the question timer
      startQuestionTimer();

      // Ask aloud via browser TTS (optional)
      speakOutLoud(qText);
    } catch (err) {
      console.error('❌ Error in sendNextQuestion:', err);
    }
  };

  const startInterview = async () => {
    try {
      setError(null);

      if (!interview) return;

      // Reset question index
      setQuestionIndex(-1);

      // Mark interview as active
      setIsInterviewActive(true);

      // Prepare greeting message (will be spoken, not displayed)
      const candidateName = interview.application?.applicant?.firstName || 'there';
      const position = interview.application?.job?.title || interview.job?.title || 'this position';

      const greetingMessage = `Hello ${candidateName}! Welcome to your AI interview for the ${position} role. I'm your AI interviewer. Let's begin with the first question.`;

      // Set to active status immediately
      setInterviewStatus('active');

      // Declare stream variable in outer scope so it's accessible for recording
      let stream = null;

      // Request microphone and camera permissions
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('Requesting camera and microphone access...');
        stream = await navigator.mediaDevices.getUserMedia({
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

          // Force video properties
          videoRef.current.autoplay = true;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;

          // Debug: Check video element state
          console.log('📹 Video element state:', {
            srcObject: !!videoRef.current.srcObject,
            readyState: videoRef.current.readyState,
            networkState: videoRef.current.networkState,
            paused: videoRef.current.paused,
            muted: videoRef.current.muted,
            autoplay: videoRef.current.autoplay
          });

          // Debug: Check stream tracks
          const videoTracks = stream.getVideoTracks();
          console.log('📹 Video stream tracks:', {
            trackCount: videoTracks.length,
            trackEnabled: videoTracks[0]?.enabled,
            trackReadyState: videoTracks[0]?.readyState,
            trackMuted: videoTracks[0]?.muted,
            trackSettings: videoTracks[0]?.getSettings()
          });

          // Simple play attempt - useEffect will handle re-attachment
          try {
            await videoRef.current.play();
            console.log('✅ Video playing');
          } catch (playErr) {
            console.log('Video play will be handled by useEffect:', playErr.message);
          }
        } else {
          console.error('❌ videoRef.current is NULL! Cannot assign video stream.');
        }
      } else {
        console.error('❌ navigator.mediaDevices.getUserMedia not available!');
      }

      // Start recording using the recording service with the existing stream
      if (stream) {
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
      } else {
        console.warn('⚠️ Cannot start recording: stream is null');
        setError('Warning: Could not start recording - camera/microphone access was not granted');
      }

      // Start eye tracking after video is set up
      if (videoRef.current) {
        try {
          console.log('👁️ Starting eye tracking...');
          await eyeTrackingService.startTracking(videoRef.current, {
            onLookingAway: (data) => {
              console.log('⚠️ Looking away detected:', data);
              setShowEyeTrackingWarning(true);
              setEyeTrackingWarningMessage(data.message);
              setEyeTrackingViolations(data.totalLookAwayCount);
              setEyeTrackingStats({
                totalLookAwayCount: data.totalLookAwayCount,
                lookAwayDuration: Math.round(data.lookAwayDuration),
                isCurrentlyLookingAway: true
              });
            },
            onLookingAtScreen: (data) => {
              console.log('✅ Looking at screen:', data);
              setShowEyeTrackingWarning(false);
              setEyeTrackingStats({
                totalLookAwayCount: data.totalLookAwayCount,
                lookAwayDuration: Math.round(data.lookAwayDuration),
                isCurrentlyLookingAway: false
              });
            }
          });
          setIsEyeTrackingActive(true);
          console.log('✅ Eye tracking started successfully');
        } catch (eyeErr) {
          console.error('❌ Failed to start eye tracking:', eyeErr);
          // Continue with interview even if eye tracking fails
        }
      }

      // Enter fullscreen mode after video is set up
      try {
        console.log('Entering fullscreen mode on entire interview page...');
        await enterFullscreen();
        console.log('✅ Entered fullscreen mode');

        // Speak the greeting and start interview
        setTimeout(() => {
          console.log('👋 Speaking greeting');
          setIsGreeting(true);
          speakOutLoud(greetingMessage, true);

          // Start timers immediately
          startTimer();

          // Start first question after greeting (8 seconds - longer pause for greeting to complete)
          setTimeout(() => {
            console.log('⏰ Starting first question');
            setIsGreeting(false);
            if (interview?.aiInterview?.questions?.length) {
              sendNextQuestion();
            }
          }, 8000); // 8 seconds to allow greeting to complete with pause
        }, 500);
      } catch (fullscreenErr) {
        console.warn('⚠️ Failed to enter fullscreen mode:', fullscreenErr);
        // Still proceed even if fullscreen fails
        setTimeout(() => {
          console.log('👋 Speaking greeting (fullscreen failed)');
          setIsGreeting(true);
          speakOutLoud(greetingMessage, true);

          // Start timers immediately
          startTimer();

          // Start first question after greeting (8 seconds - longer pause for greeting to complete)
          setTimeout(() => {
            console.log('⏰ Starting first question');
            setIsGreeting(false);
            if (interview?.aiInterview?.questions?.length) {
              sendNextQuestion();
            }
          }, 8000); // 8 seconds to allow greeting to complete with pause
        }, 500);
      }
    } catch (err) {
      console.error('Failed to start interview:', err);
      setError('Failed to start interview. Please check your microphone and camera permissions.');
    }
  };

  const pauseInterview = async () => {
    try {
      setInterviewStatus('paused');
      stopTimer();
      stopQuestionTimer();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (err) {
      console.error('Failed to pause interview:', err);
    }
  };

  const resumeInterview = async () => {
    try {
      setInterviewStatus('active');
      startTimer();
      startQuestionTimer();
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

      // Stop ElevenLabs audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Stop eye tracking and get final statistics
      if (isEyeTrackingActive) {
        const eyeTrackingFinalStats = eyeTrackingService.stopTracking();
        setEyeTrackingStats({
          totalLookAwayCount: eyeTrackingFinalStats.totalLookAwayCount,
          lookAwayDuration: Math.round(eyeTrackingFinalStats.lookAwayDuration),
          isCurrentlyLookingAway: false
        });
        setIsEyeTrackingActive(false);
        console.log('👁️ Eye tracking stopped. Final stats:', eyeTrackingFinalStats);
      }

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

      // Stop ElevenLabs audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

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

      // Transcribe the audio using Whisper
      let transcriptText = '';
      if (blobToUpload) {
        try {
          setIsTranscribing(true);
          console.log('🎤 Transcribing audio with Whisper...', {
            blobSize: blobToUpload.size,
            blobType: blobToUpload.type
          });

          const transcriptionResponse = await interviewService.transcribeAudio(blobToUpload);

          if (transcriptionResponse.success && transcriptionResponse.data?.text) {
            transcriptText = transcriptionResponse.data.text;
            setTranscript([{ text: transcriptText, timestamp: new Date() }]);
            console.log('✅ Audio transcribed successfully:', {
              length: transcriptText.length,
              preview: transcriptText.substring(0, 100)
            });
          } else {
            console.warn('⚠️ Transcription returned no text:', transcriptionResponse);
          }
        } catch (transcribeErr) {
          console.error('❌ Error transcribing audio:', transcribeErr);
          // Continue anyway - transcription is optional
        } finally {
          setIsTranscribing(false);
        }
      }

      // Now submit interview completion with the Cloudinary URL
      const interviewData = {
        status: 'completed',
        transcript: transcript,
        recordingUrl: recordingUrl, // Cloudinary URL
        duration: interview?.duration * 60 - timeRemaining,
        feedback: feedback,
        completedAt: new Date(),
        eyeTrackingData: {
          totalLookAwayCount: eyeTrackingStats.totalLookAwayCount,
          lookAwayDuration: eyeTrackingStats.lookAwayDuration,
          violations: eyeTrackingViolations
        }
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Fullscreen Mode Required
              </h3>
              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                Please remain in fullscreen mode during the interview. Exiting fullscreen may affect your interview recording.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 w-full">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Exit Attempts:</span> {fullscreenExitAttempts}
                </p>
              </div>
              <Button
                onClick={async () => {
                  console.log('Return to Fullscreen button clicked');
                  setShowFullscreenWarning(false);

                  // Clear any existing timeout
                  if (fullscreenWarningTimeoutRef.current) {
                    clearTimeout(fullscreenWarningTimeoutRef.current);
                    fullscreenWarningTimeoutRef.current = null;
                  }

                  // Try to enter fullscreen
                  try {
                    await enterFullscreen();
                    console.log('✅ Successfully re-entered fullscreen');
                  } catch (err) {
                    console.error('❌ Failed to re-enter fullscreen:', err);
                    // Show error message if fullscreen fails
                    alert('Failed to enter fullscreen mode. Please try pressing F11 or use your browser\'s fullscreen option.');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base py-3 font-medium"
              >
                Return to Fullscreen
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

      {/* Eye Tracking Warning */}
      {showEyeTrackingWarning && interviewStatus === 'active' && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-red-700 max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm mb-1">⚠️ Warning: Looking Away Detected</p>
                <p className="text-xs text-red-100">{eyeTrackingWarningMessage}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="bg-white/20 rounded-full px-2 py-1">
                  <span className="text-xs font-bold">{eyeTrackingViolations}</span>
                </div>
                <p className="text-[10px] text-red-200 mt-0.5">violations</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eye Tracking Status Indicator */}
      {isEyeTrackingActive && interviewStatus === 'active' && (
        <div className="fixed top-4 left-4 z-50">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg ${
            showEyeTrackingWarning ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {showEyeTrackingWarning ? (
              <EyeOff className="h-4 w-4 animate-pulse" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {showEyeTrackingWarning ? 'Eyes Not Detected' : 'Eye Tracking Active'}
            </span>
          </div>
          {/* Eye Tracking Stats */}
          <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-md text-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-gray-600 font-medium">Look-Away Count</p>
                <p className="text-lg font-bold text-gray-900">{eyeTrackingStats.totalLookAwayCount}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Duration</p>
                <p className="text-lg font-bold text-gray-900">{eyeTrackingStats.lookAwayDuration}s</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2.5 shadow-sm">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Video Interview</h1>
                <Badge variant={getStatusBadgeVariant(interviewStatus)} className="mt-0.5 text-xs">
                  {getStatusLabel(interviewStatus)}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {interviewStatus === 'active' && (
                <>
                  {/* Total Time Remaining */}
                  <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <div className="text-gray-900">
                      <p className="text-xs text-gray-500 font-medium">Total Time</p>
                      <p className={`text-lg font-semibold ${
                        timeRemaining <= 60 ? 'text-red-600 animate-pulse' :
                        timeRemaining <= 180 ? 'text-orange-600' :
                        'text-gray-900'
                      }`}>
                        {formatTime(timeRemaining)}
                      </p>
                    </div>
                  </div>

                  {/* Question Time */}
                  <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <div className="text-gray-900">
                      <p className="text-xs text-blue-600 font-medium">Question Time</p>
                      <p className={`text-lg font-semibold ${questionTimeRemaining <= 30 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                        {formatTime(questionTimeRemaining)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video/Interview Area */}
            <Card className="shadow-xl border-2 border-purple-100 overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden" style={{ maxHeight: '60vh' }}>
                  {/* Video Element - Always present */}
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                    style={{
                      display: 'block',
                      backgroundColor: '#1a1a1a',
                      minWidth: '100%',
                      minHeight: '100%',
                      opacity: 1,
                      visibility: 'visible',
                      zIndex: 0
                    }}
                  />

                  {/* Debug: Video status indicator */}
                  {interviewStatus === 'active' && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-xs font-mono z-50">
                      Video: {isVideoEnabled ? 'ON' : 'OFF'} |
                      Stream: {videoStream ? 'YES' : 'NO'} |
                      Dims: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}
                    </div>
                  )}

                  {/* Greeting Indicator - Show during greeting */}
                  {interviewStatus === 'active' && isGreeting && (
                    <div className="absolute bottom-4 left-4 right-4 bg-blue-600/90 backdrop-blur-sm rounded-lg p-4 shadow-2xl border-2 border-blue-400 z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center animate-pulse">
                          <MessageSquare className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 text-white">
                          <p className="text-base font-bold">🎤 AI is greeting you...</p>
                          <p className="text-sm opacity-90">First question will appear in a moment</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Overlays - Show when video is not active or not enabled */}
                  {interviewStatus === 'active' && !isVideoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-gradient-to-br from-purple-900/80 to-blue-900/80 backdrop-blur-sm z-10">
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
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50 z-10">
                      <Pause className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Interview Paused</p>
                    </div>
                  )}

                  {interviewStatus === 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-50 z-10">
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
                        {isTranscribing && (
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <Mic className="h-4 w-4 animate-pulse" />
                            <p className="text-sm">Transcribing audio with Whisper AI...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Display - Prominent position above controls */}
                {currentQuestion && interviewStatus === 'active' && !isGreeting && (
                  <div className="px-6 pt-4 pb-6 bg-gradient-to-b from-blue-50 to-white border-t-2 border-blue-100">
                    <div className="bg-white border-2 border-blue-200 rounded-xl shadow-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {questionIndex + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
                              Question {questionIndex + 1} of {totalQuestions}
                            </p>
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                              <Clock className="h-4 w-4 text-gray-600" />
                              <span className={`text-sm font-bold ${questionTimeRemaining <= 30 ? 'text-red-600' : 'text-gray-700'}`}>
                                {formatTime(questionTimeRemaining)}
                              </span>
                            </div>
                          </div>
                          <p className="text-lg text-gray-900 leading-relaxed font-medium break-words">
                            {currentQuestion}
                          </p>
                          <p className="text-xs text-gray-500 mt-3 italic">
                            Take your time to answer. Speak clearly into your microphone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interview Controls */}
                <div className="p-6 bg-white border-t-2 border-gray-100">
                  {/* Waiting Status Banner */}
                  {interviewStatus === 'waiting' && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white shadow-sm flex-shrink-0">
                          <Video className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-gray-900 mb-1">Ready to start your interview?</p>
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
                      className="px-8 py-6 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                    >
                      <Play className="h-5 w-5 mr-2" />
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

                  {interviewStatus === 'completed' && !isSubmitting && !isUploadingRecording && !isTranscribing && (
                    <Button onClick={submitInterviewResults} disabled={isSubmitting || isUploadingRecording || isTranscribing}>
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

                  {isTranscribing && (
                    <Button disabled>
                      <Mic className="h-4 w-4 mr-2 animate-pulse" />
                      Transcribing with Whisper AI...
                    </Button>
                  )}

                  {isSubmitting && !isUploadingRecording && !isTranscribing && (
                    <Button disabled>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting interview...
                    </Button>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>


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
            <Card className="shadow-md border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  Interview Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Position</p>
                  <p className="font-semibold text-gray-900 text-base">{interview.application?.job?.title || interview.job?.title || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Candidate</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {interview.application?.applicant?.firstName && interview.application?.applicant?.lastName
                      ? `${interview.application.applicant.firstName} ${interview.application.applicant.lastName}`
                      : 'Not specified'}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Total Duration</p>
                  <p className="font-semibold text-gray-900 text-base">{interview.aiInterview?.duration || interview.duration || 30} minutes</p>
                </div>
              </CardContent>
            </Card>

            {/* Progress Tracker */}
            {interviewStatus === 'active' && (
              <Card className="shadow-md border border-gray-200">
                <CardHeader className="bg-green-50 border-b border-green-200">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-900 font-semibold">Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm ${
                          i < questionIndex + 1
                            ? 'bg-green-600 text-white shadow-sm'
                            : i === questionIndex + 1
                            ? 'bg-blue-600 text-white shadow-sm animate-pulse'
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                        }`}>
                          {i < questionIndex + 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            i < questionIndex + 1 ? 'text-green-700' : i === questionIndex + 1 ? 'text-blue-700' : 'text-gray-400'
                          }`}>
                            Question {i + 1}
                          </p>
                          {i < questionIndex + 1 && (
                            <p className="text-sm text-green-600 font-semibold">✓ Completed</p>
                          )}
                          {i === questionIndex + 1 && (
                            <p className="text-sm text-blue-600 font-semibold">● In progress...</p>
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
