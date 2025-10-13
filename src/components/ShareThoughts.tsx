import React, { useState } from 'react';
import { apiService } from '../services/api';
import './ShareThoughts.css';

interface Feedback {
  name: string;
  email: string;
  message: string;
  rating: number;
  category: string;
}

const ShareThoughts: React.FC = () => {
  const [feedback, setFeedback] = useState<Feedback>({
    name: '',
    email: '',
    message: '',
    rating: 5,
    category: 'general'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'improvement', label: 'Improvement Suggestion' },
    { value: 'praise', label: 'Praise & Appreciation' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedback(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFeedback(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      console.log('📝 Submitting feedback:', feedback);
      
      const response = await apiService.submitFeedback({
        name: feedback.name,
        email: feedback.email,
        message: feedback.message,
        rating: feedback.rating,
        category: feedback.category
      });
      
      if (response.success) {
        console.log('✅ Feedback submitted successfully:', response.feedbackId);
        setSubmitStatus('success');
        setFeedback({
          name: '',
          email: '',
          message: '',
          rating: 5,
          category: 'general'
        });
      } else {
        console.error('❌ Feedback submission failed:', response.message);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type="button"
        className={`star ${index < feedback.rating ? 'filled' : ''}`}
        onClick={() => handleRatingChange(index + 1)}
        disabled={isSubmitting}
      >
        ⭐
      </button>
    ));
  };

  return (
    <div className="share-thoughts-container">
      <div className="share-thoughts-content">
        <header className="share-header">
          <h1>Share Your Thoughts</h1>
          <p className="subtitle">Your feedback helps us improve Aito</p>
        </header>

        <div className="feedback-grid">
          <div className="feedback-form-section">
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={feedback.name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={feedback.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={feedback.category}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Rating</label>
                <div className="rating-container">
                  {renderStars()}
                  <span className="rating-text">{feedback.rating} out of 5 stars</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Your Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={feedback.message}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  placeholder="Tell us what you think about Aito. What did you like? What could be improved? Any suggestions?"
                  rows={6}
                />
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>

              {submitStatus === 'success' && (
                <div className="success-message">
                  ✅ Thank you for your feedback! We appreciate your input.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="error-message">
                  ❌ There was an error submitting your feedback. Please try again.
                </div>
              )}
            </form>
          </div>

          <div className="feedback-info-section">
            <div className="info-card">
              <h3>💭 Why Your Feedback Matters</h3>
              <p>
                Your thoughts and experiences help us understand how Aito is being used 
                and how we can make it even better. Every piece of feedback is valuable!
              </p>
            </div>

            <div className="info-card">
              <h3>🎯 What We're Looking For</h3>
              <ul>
                <li>Your experience using the voice interface</li>
                <li>Suggestions for new features</li>
                <li>Any bugs or issues you encountered</li>
                <li>Ideas for improving the conversation flow</li>
                <li>General thoughts about AI assistants</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>📊 How We Use Feedback</h3>
              <ul>
                <li>Improve AI responses and conversation quality</li>
                <li>Add new features based on user needs</li>
                <li>Fix bugs and technical issues</li>
                <li>Enhance user experience and interface</li>
                <li>Guide future development priorities</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>🔒 Privacy Promise</h3>
              <p>
                All feedback is kept confidential and used solely for improving Aito. 
                We never share your personal information with third parties.
              </p>
            </div>
          </div>
        </div>

        <div className="alternative-contact">
          <h3>Other Ways to Connect</h3>
          <div className="contact-methods">
            <div className="contact-method">
              <span className="contact-icon">📧</span>
              <span>Email: feedback@aito-ai.com</span>
            </div>
            <div className="contact-method">
              <span className="contact-icon">💬</span>
              <span>Live Chat: Available 24/7</span>
            </div>
            <div className="contact-method">
              <span className="contact-icon">🐦</span>
              <span>Twitter: @AitoAI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareThoughts;
