import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-container">
      <div className="about-content">
        <header className="about-header">
          <h2>About Aitodidactia</h2>
        </header>

        <section className="about-section">
          <p>Aitodidactia began partly as an academic exercise, but mostly to serve an emerging human need to develop mental strength and fitness in a demanding modern world.</p>
          <br></br>
          <br></br>
          <p>We are a team of developers, AI Prompt engineers, teachers, public speakers, personal coaches, and researchers who share the human values of personal development, equality and charity.<p>
          <br></br>
          <br></br>
          <p><b>We are Building Something Brilliant, in order to help People.</b></p>
           <br></br>
          <br></br>
          <p><i>Feel free to call Aito for a chat about us…</i></p>
        </section>

        <section className="about-section">
          <h3>What is Aito</h3>
          <p>Aito is an online personal development platform with a difference. It encourages users to approach significant personal change by regularly, week to week, using bite sized pieces of guided self-discovery as a platform to create change in their lives.</p>
          <br></br>
          <br></br>
          <p>The Aito service learns from real, anonymous, examples from actual users which are actively validated against established philosophies. This makes Aito's knowledge and suggestions as relevant as they can be for a modern audience.</p>
          <br></br>
          <br></br>
          <p>And why is it different? Books, search engines, podcasts although useful are not directed, and not specific. The reader or listener is left to process lots of information, sift it, and then convert that information into something that they may or may not be able to implement in their lives. Aito works with the user one-to-one to pinpoint an area of life or mental fitness to be strengthened, shares specific bite sized Precepts that the user can grasp manageably, helps them to set an intention to work towards. This is, like most things in life, an ongoing process; so Aito regularly meets with the user to maintain progress.</p>
           
        </section>
      </div>
    </div>
  );
};

export default About;
