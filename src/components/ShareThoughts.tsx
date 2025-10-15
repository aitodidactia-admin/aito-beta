import React, { useState } from 'react';
import { apiService } from '../services/api';
import './ShareThoughts.css';

interface Feedback {
  message: string;
}

const ShareThoughts: React.FC = () => {
  const [feedback, setFeedback] = useState<Feedback>({
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedback(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      console.log('📝 Submitting feedback:', feedback);
      
      const response = await apiService.submitFeedback({ message: feedback.message });
      
      if (response.success) {
        console.log('✅ Feedback submitted successfully:', response.feedbackId);
        setSubmitStatus('success');
        setFeedback({
          message: '',
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

  return (
    <div className="share-thoughts-container">
      <div className="share-thoughts-content">
        <header className="share-header">
          <h2>Share Your Thoughts</h2>
        </header>

        <section>
          <h2>What Can You Do Here?</h2>
          <br></br>
          <h3>Join the Beta Test</h3>
          <br></br>
          <p>Just send us your first name and email address, and one of the human team will be in touch. It's free to join and use the Aito Beta Test, but contributions are extremely important in supporting our development and running costs. If you feel you'd like to help, please use the 'Donate' Button above…</p>
          <br></br>
          <h3>Send us Feedback</h3>
          <br></br>
          <p>We're continually evolving Aito based on your comments. We love to hear good things, but we can only make Aito work better for you by hearing the things we need to work on...</p>
          <br></br>
          <h3>Want to Work with Us</h3>
          <p>Aito can be configured with ANY content, and is an excellent coaching and training platform for soft skills in particular. Reach out if you'd like to know more..</p>
          <br></br>
          <p><i>You can also reach us through Aito – he'll pass on your message to the team.</i></p>
          <form onSubmit={handleSubmit} className="feedback-form">
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
        </section>

      </div>
    </div>
  );
};

export default ShareThoughts;
