import Vapi from '@vapi-ai/web';

class VapiService {
  constructor() {
    this.vapi = null;
    this.currentSession = null;
    this.isInitialized = false;
    this.eventListeners = {};
  }

  /**
   * Initialize Vapi with API key
   * @param {string} apiKey - Vapi API key
   */
  async initialize(apiKey) {
    try {
      console.log('Initializing Vapi service with API key:', apiKey ? 'PROVIDED' : 'MISSING');
      
      if (this.isInitialized) {
        console.log('Vapi service already initialized');
        return this.vapi;
      }

      // Use the public key for frontend initialization
      const publicKey = 'dd93d7a5-51fe-4014-9ddb-42c006182e14';
      this.vapi = new Vapi(publicKey);

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('Vapi initialized successfully');
      return this.vapi;
    } catch (error) {
      console.error('Failed to initialize Vapi:', error);
      throw error;
    }
  }

  /**
   * Set up Vapi event listeners
   */
  setupEventListeners() {
    if (!this.vapi) return;

    // Call start event
    this.vapi.on('call-start', (event) => {
      console.log('Call started:', event);
      this.currentSession = event.call;
      this.emit('call-start', event);
    });

    // Call end event
    this.vapi.on('call-end', (event) => {
      console.log('Call ended:', event);
      this.currentSession = null;
      this.emit('call-end', event);
    });

    // Speech start event
    this.vapi.on('speech-start', (event) => {
      console.log('Speech started:', event);
      this.emit('speech-start', event);
    });

    // Speech end event
    this.vapi.on('speech-end', (event) => {
      console.log('Speech ended:', event);
      this.emit('speech-end', event);
    });

    // Message event (for transcripts)
    this.vapi.on('message', (event) => {
      console.log('Message received:', event);
      this.emit('message', event);
    });

    // Error event
    this.vapi.on('error', (event) => {
      console.error('Vapi error:', event);
      this.emit('error', event);
    });

    // Conversation update event
    this.vapi.on('conversation-update', (event) => {
      console.log('Conversation update:', event);
      this.emit('conversation-update', event);
    });
  }

  /**
   * Start an AI interview session
   * @param {Object} config - Interview configuration
   * @param {string} config.assistantId - Vapi assistant ID
   * @param {Object} config.model - Model configuration
   * @param {Object} config.voice - Voice configuration
   * @param {Array} config.messages - Initial messages
   */
  async startInterview(config) {
    try {
      if (!this.vapi) {
        throw new Error('Vapi not initialized');
      }

      const callConfig = {
        assistantId: config.assistantId || '78f66dae-06aa-4b30-a6c9-81a7618451cb',
        model: config.model || {
          provider: "openai",
          model: "gpt-3.5-turbo",
          temperature: 0.7,
        },
        voice: config.voice || {
          provider: "11labs",
          voiceId: "burt",
        },
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
        },
        firstMessage: config.firstMessage || "Hello! I'm excited to interview you today. Let's begin with your introduction.",
        systemMessage: config.systemMessage || "You are a professional interviewer conducting a job interview. Be friendly, ask relevant questions, and provide constructive feedback.",
      };

      const result = await this.vapi.start(callConfig);
      console.log('Interview started:', result);
      return result;
    } catch (error) {
      console.error('Failed to start interview:', error);
      throw error;
    }
  }

  /**
   * Start interview with assistant ID and optional overrides
   * @param {string} assistantId - Vapi assistant ID
   * @param {Object} overrides - Optional assistant overrides
   */
  async startInterviewWithAssistant(assistantId, overrides = {}) {
    try {
      if (!this.vapi) {
        throw new Error('Vapi not initialized');
      }

      const result = await this.vapi.start(assistantId, overrides);
      console.log('Interview started with assistant:', result);
      return result;
    } catch (error) {
      console.error('Failed to start interview with assistant:', error);
      throw error;
    }
  }

  /**
   * Stop the current interview
   */
  async stopInterview() {
    try {
      if (!this.vapi) {
        throw new Error('Vapi not initialized');
      }

      await this.vapi.stop();
      console.log('Interview stopped');
    } catch (error) {
      console.error('Failed to stop interview:', error);
      throw error;
    }
  }

  /**
   * Send a message to the interview
   * @param {string} message - Message to send
   */
  async sendMessage(message) {
    try {
      if (!this.vapi) {
        throw new Error('Vapi not initialized');
      }

      await this.vapi.send({
        type: 'conversation-initation',
        conversation: {
          type: 'message',
          content: message,
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get current call status
   */
  getCallStatus() {
    return this.vapi ? this.vapi.call : null;
  }

  /**
   * Check if interview is active
   */
  isInterviewActive() {
    return this.currentSession !== null;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.vapi) {
      this.vapi.stop();
      this.vapi = null;
    }
    this.currentSession = null;
    this.isInitialized = false;
    this.eventListeners = {};
    console.log('Vapi service destroyed');
  }

  /**
   * Validate the connection with Vapi service
   * @returns {Promise<boolean>} - True if connection is valid
   */
  async validateConnection() {
    try {
      if (!this.vapi || !this.isInitialized) {
        console.log('Vapi validation failed: Service not initialized');
        return false;
      }

      // Try to get the Vapi client status
      const status = this.vapi.getStatus?.() || {};
      console.log('Vapi connection status:', status);

      // Check if we have a valid Vapi instance
      const isValid = !!this.vapi && 
                     typeof this.vapi.start === 'function' && 
                     typeof this.vapi.stop === 'function';

      console.log('Vapi service validation:', isValid ? 'PASSED' : 'FAILED');
      return isValid;
    } catch (error) {
      console.error('Vapi validation error:', error);
      return false;
    }
  }
}

// Create singleton instance
const vapiService = new VapiService();

export default vapiService;
