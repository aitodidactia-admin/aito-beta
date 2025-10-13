import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <header className="about-header">
          <h1>About Aito</h1>
          <p className="subtitle">Your Intelligent Voice Assistant</p>
        </header>

        <section className="about-section">
          <h2>🤖 What is Aito?</h2>
          <p>
            Aito is an advanced voice AI agent powered by ElevenLabs technology. 
            It provides natural, conversational interactions through voice commands, 
            making technology more accessible and human-friendly.
          </p>
        </section>

        <section className="about-section">
          <h2>✨ Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3>Voice Interaction</h3>
              <p>Natural conversation through voice commands and responses</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>AI-Powered</h3>
              <p>Advanced artificial intelligence for intelligent responses</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👤</div>
              <h3>Personalized</h3>
              <p>Remembers your name and creates personalized experiences</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Tracks conversations and provides insights</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🔧 Technology Stack</h2>
          <div className="tech-list">
            <div className="tech-item">
              <strong>Frontend:</strong> React.js with TypeScript
            </div>
            <div className="tech-item">
              <strong>Backend:</strong> Node.js with Express.js
            </div>
            <div className="tech-item">
              <strong>Database:</strong> MongoDB with Mongoose
            </div>
            <div className="tech-item">
              <strong>Voice AI:</strong> ElevenLabs Agent Platform
            </div>
            <div className="tech-item">
              <strong>Styling:</strong> Modern CSS with responsive design
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🎯 How It Works</h2>
          <div className="workflow">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Start Conversation</h3>
                <p>Click the microphone button to begin talking with Aito</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Natural Interaction</h3>
                <p>Have a natural conversation - Aito will ask for your name</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Data Collection</h3>
                <p>Your conversation is securely stored for analytics</p>
              </div>
            </div>
            <div className="workflow-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>End Call</h3>
                <p>End the conversation when you're done - data is saved</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>🔒 Privacy & Security</h2>
          <p>
            Your privacy is important to us. All conversations are securely stored 
            in our MongoDB database with proper encryption. We only collect necessary 
            information like your IP address for user identification and conversation 
            data for improving our service.
          </p>
          <ul>
            <li>✅ Secure data encryption</li>
            <li>✅ IP-based user identification</li>
            <li>✅ Conversation history tracking</li>
            <li>✅ No personal data sharing</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>📈 Analytics & Insights</h2>
          <p>
            We collect anonymous analytics to improve our service:
          </p>
          <ul>
            <li>📊 Conversation duration and frequency</li>
            <li>👥 User engagement metrics</li>
            <li>💬 Message patterns and topics</li>
            <li>🎯 Usage statistics and trends</li>
          </ul>
        </section>

        <footer className="about-footer">
          <p>Built with ❤️ using cutting-edge AI technology</p>
          <p className="version">Version 1.0.0</p>
        </footer>
      </div>
    </div>
  );
};

export default About;
