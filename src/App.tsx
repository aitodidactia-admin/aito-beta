import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import VoiceAgent from './components/VoiceAgent';
import Admin from './components/Admin';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/backoffice" element={<Admin />} />
          <Route path="/" element={<VoiceAgent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
