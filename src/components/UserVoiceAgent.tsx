import React, { useState, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { apiService, User, ConversationSession, ConversationData } from '../services/api';
import About from './About';
import ShareThoughts from './ShareThoughts';
import './VoiceAgent.css';

type Page = 'home' | 'about' | 'share-thoughts';

const UserVoiceAgent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [, setConversationData] = useState<ConversationData>({ messages: [] });
  
  const conversationDataRef = useRef<ConversationData>({ messages: [] });

  // Initialize user on component mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const ipAddress = await apiService.getClientIP();
        const response = await apiService.createOrGetUser(ipAddress);
        if (response.success) {
          setUser(response.user);
          console.log('👤 User initialized:', response.user);
        }
      } catch (error) {
        console.error('❌ Failed to initialize user:', error);
      }
    };

    initializeUser();
  }, []);

  // Store session reference for cleanup
  const sessionRef = useRef<ConversationSession | null>(null);
  
  // Update session reference whenever currentSession changes
  useEffect(() => {
    sessionRef.current = currentSession;
  }, [currentSession]);

  // Cleanup effect to save session when component unmounts or page is closed
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const sessionToSave = sessionRef.current;
      if (sessionToSave && isConnected) {
        try {
          await apiService.endSession(sessionToSave.sessionId, conversationDataRef.current);
          console.log('📊 Session saved on page unload');
        } catch (error) {
          console.error('❌ Failed to save session on page unload:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && sessionRef.current && isConnected) {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected]);

  const conversation = useConversation({
    onConnect: async () => {
      console.log('🔌 Connected to ElevenLabs Agent');
      setIsConnected(true);
      setConnectionStatus('Connected');
      
      // Start session in database
      if (user) {
        try {
          const ipAddress = await apiService.getClientIP();
          const response = await apiService.startSession(user.userId, ipAddress);
          if (response.success) {
            setCurrentSession(response.session);
            console.log('📊 Session started:', response.session);
          }
        } catch (error) {
          console.error('❌ Failed to start session:', error);
        }
      }
    },
    onDisconnect: async (details?: any) => {
      const reason = details?.reason || 'unknown';
      const message = details?.message || '';
      console.log('🔌 Disconnected from ElevenLabs Agent', `(Reason: ${reason}${message ? ` - ${message}` : ''})`);
      console.log('🔌 Current session state:', currentSession);
      console.log('🔌 Conversation data:', conversationDataRef.current);
      
      setIsConnected(false);
      setIsRecording(false);
      setConnectionStatus('Disconnected');
      
      // Try to find and end any active session for this user
      let sessionToEnd = currentSession || sessionRef.current;
      const conversationData = conversationDataRef.current;
      
      // If both currentSession and sessionRef are null, try to find the most recent active session for this user
      if (!sessionToEnd && user) {
        console.log('🔍 Both current session and session ref are null, looking for active sessions for user:', user.userId);
        try {
          const userSessions = await apiService.getUserSessions(user.userId);
          const activeSession = userSessions.sessions.find(session => session.status === 'active');
          if (activeSession) {
            sessionToEnd = activeSession;
            console.log('📊 Found active session to end:', activeSession.sessionId);
          }
        } catch (error) {
          console.error('❌ Failed to fetch user sessions:', error);
        }
      }
      
      if (sessionToEnd) {
        console.log('📊 Ending session via disconnect:', sessionToEnd.sessionId);
        try {
          const response = await apiService.endSession(sessionToEnd.sessionId, conversationData);
          if (response.success) {
            console.log('✅ Session ended via disconnect:', response.session);
            setCurrentSession(null);
            setConversationData({ messages: [] });
            conversationDataRef.current = { messages: [] };
          } else {
            console.error('❌ API returned success: false', response);
          }
        } catch (error) {
          console.error('❌ Failed to end session via disconnect:', error);
        }
      } else {
        console.log('❌ No session found to end - this means no active session exists');
        // Clear the conversation data anyway
        setConversationData({ messages: [] });
        conversationDataRef.current = { messages: [] };
      }
    },
    onMessage: (message: any) => {
      console.log('📨 Message received:', message);
      
      // Determine role based on message source
      let role: 'user' | 'assistant' = 'assistant';
      if (message.source === 'user') {
        role = 'user';
      } else if (message.source === 'ai') {
        role = 'assistant';
      }
      
      // Add message to conversation data
      const newMessage = {
        role: role,
        content: message.message || message.content || message.text || JSON.stringify(message),
        timestamp: new Date()
      };
      
      console.log('📝 Adding message to conversation:', newMessage);
      
      const updatedData: ConversationData = {
        ...conversationDataRef.current,
        messages: [...conversationDataRef.current.messages, newMessage]
      };
      
      conversationDataRef.current = updatedData;
      setConversationData(updatedData);
      
      // Check if user mentioned their name and update username
      if (role === 'user' && newMessage.content && user && (user.username === 'Guest' || user.username.length > 20)) {
        console.log('🔍 Checking for name in message:', newMessage.content);
        console.log('👤 Current username:', user.username);
        
        // Enhanced name detection patterns - more precise to avoid capturing long sentences
        const namePatterns = [
          /(?:my name is|i am|i'm|call me|this is)\s+([A-Za-z]{1,20})(?:\s|$|[.,!?])/i,
          /^([A-Za-z]{1,20})(?:\s+is\s+(?:here|checking|testing))(?:\s|$|[.,!?])/i,
          /hi,?\s+([A-Za-z]{1,20})(?:\s+(?:here|is here))(?:\s|$|[.,!?])/i,
          /([A-Za-z]{1,20})(?:\s+(?:speaking|here))(?:\s|$|[.,!?])/i
        ];
        
        for (let i = 0; i < namePatterns.length; i++) {
          const pattern = namePatterns[i];
          const match = newMessage.content.match(pattern);
          console.log(`🔍 Pattern ${i + 1}:`, pattern, 'Match:', match);
          if (match) {
            const detectedName = match[1].trim();
            
            // Additional validation: name should be 1-20 characters, no spaces, and not common words
            const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'just', 'only', 'hello', 'hi', 'hey', 'yes', 'no', 'ok', 'okay'];
            const isValidName = detectedName.length >= 1 && 
                               detectedName.length <= 20 && 
                               !detectedName.includes(' ') && 
                               !commonWords.includes(detectedName.toLowerCase()) &&
                               /^[A-Za-z]+$/.test(detectedName);
            
            if (isValidName) {
              console.log('👤 Detected valid name in message:', detectedName);
              // Update username in database
              apiService.updateUsername(user.userId, detectedName)
                .then(response => {
                  if (response.success) {
                    console.log('✅ Username updated to:', detectedName);
                    setUser(prevUser => prevUser ? { ...prevUser, username: detectedName } : null);
                  }
                })
                .catch(error => console.error('❌ Failed to update username:', error));
              break; // Stop after first valid match
            } else {
              console.log('❌ Invalid name detected, ignoring:', detectedName);
            }
          }
        }
      }
      
      // Send message to database if session exists
      if (currentSession && newMessage.content) {
        console.log('💾 Saving message to database:', newMessage);
        apiService.addMessage(currentSession.sessionId, newMessage.role, newMessage.content)
          .then(response => console.log('✅ Message saved:', response))
          .catch(error => console.error('❌ Failed to save message:', error));
      } else {
        console.log('❌ Cannot save message - no current session or content');
      }
    },
    onError: (error: any) => {
      console.error('❌ Error:', error);
      setConnectionStatus('Error occurred');
    },
    onModeChange: (mode: { mode: string }) => {
      console.log('🔄 Mode changed:', mode);
      setIsRecording(mode.mode === 'listening');
    },
    onStatusChange: (status: { status: string }) => {
      console.log('📊 Status changed:', status);
      setConnectionStatus(status.status === 'connected' ? 'Connected' : 'Disconnected');
    }
  });

  const handleEndCall = async () => {
    console.log('🔴 End Call button clicked!');
    console.log('🔴 isConnected:', isConnected);
    console.log('🔴 currentSession:', currentSession);
    
    try {
      if (isConnected) {
        console.log('📞 User manually ending call...');
        
        // First, save the session data directly
        if (currentSession) {
          console.log('📊 Attempting to save session:', currentSession.sessionId);
          console.log('📊 Conversation data:', conversationDataRef.current);
          
          try {
            const response = await apiService.endSession(currentSession.sessionId, conversationDataRef.current);
            console.log('📊 API response:', response);
            
            if (response.success) {
              console.log('✅ Session ended manually:', response.session);
              setCurrentSession(null);
              setConversationData({ messages: [] });
              conversationDataRef.current = { messages: [] };
            } else {
              console.error('❌ API returned success: false', response);
            }
          } catch (error) {
            console.error('❌ Failed to end session manually:', error);
          }
        } else {
          console.log('❌ No current session to end');
        }
        
        // Then end the ElevenLabs conversation
        console.log('🔌 Ending ElevenLabs conversation...');
        await conversation.endSession();
        console.log('✅ ElevenLabs conversation ended');
      } else {
        console.log('❌ Not connected, cannot end call');
      }
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  };

  const toggleRecording = async () => {
    try {
      if (!isConnected) {
        console.log('🎤 Starting conversation...');
        
        // Request microphone access first as per documentation
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Get agent ID from environment variables
        const agentId = process.env.REACT_APP_USER_ELEVENLABS_AGENT_ID || 'agent_7601k4wgy5tfet1v4ettjh0ck8ed';
        console.log('🎯 Using agent ID from environment:', agentId);

        // Start session following the official documentation
        const conversationId = await conversation.startSession({
          agentId: agentId
          // No overrides - using agent's default configuration
        });
        
        console.log('✅ Conversation started with ID:', conversationId);
      } else {
        if (isConnected) {
          console.log('⏹️ Ending conversation...');
          await conversation.endSession();
        } else {
          console.log('▶️ Conversation is active');
        }
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      setConnectionStatus('Connection failed');
    }
  };

  return (
    <div className="voice-agent">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">Aito</div>
          <nav className="navigation">
            <>
            <button 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              Home
            </button>
            <button 
              className={`nav-link ${currentPage === 'about' ? 'active' : ''}`}
              onClick={() => setCurrentPage('about')}
            >
              About
            </button>
            <button 
              className={`nav-link ${currentPage === 'share-thoughts' ? 'active' : ''}`}
              onClick={() => setCurrentPage('share-thoughts')}
            >
              Contact
            </button>
            <a className="nav-donate" href='https://www.gofundme.com/f/help-launch-aito' target="_blank" rel="noopener noreferrer">Donate</a>

          </>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      {currentPage === 'about' && <About />}
      {currentPage === 'share-thoughts' && <ShareThoughts />}
      {currentPage === 'home' && (
        <>
          {/* Main Content */}
        
      <main className="main-content">
        <div className="microphone-container">
          {isConnected ?
          <>
              {/* Concentric rings */}
              <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>

          </>
          :null}
      
          
          {/* Microphone button */}
          <button
            className={`microphone-btn ${isRecording ? 'recording' : ''} ${isConnected ? 'connected' : ''}`}
            onClick={toggleRecording}
            disabled={!isConnected && connectionStatus === 'Connecting...'}
          >
            <div className="microphone-icon">
              {isConnected && !isRecording ? (
                // Muted microphone icon with diagonal line
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                // Active microphone icon
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Status Notification */}
        {/* {isConnected && (
          <div className="status-notification">
            <div className="status-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <span>Connected to voice service</span>
            {user && (
              <div className="user-info">
                <span className="user-name">{user.username}</span>
                <span className="session-count">Session #{user.totalSessions}</span>
              </div>
            )}
          
            {/* End Call Button }
            <button 
              className="end-call-btn"
              onClick={handleEndCall}
              title="End Call"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
              End Call
            </button>
          </div>
        )} */}
      </main>
        </>
      )}
    </div>
  );
};

export default UserVoiceAgent;
