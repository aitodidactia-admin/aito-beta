import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import VoiceAgent from './components/VoiceAgent';
import UserVoiceAgent from './components/UserVoiceAgent';
import AdminDashboard from './components/AdminDashboard';
import Admin from './components/Admin';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/backoffice" element={<Admin />} />
          <Route path="/" element={<VoiceAgent />} />
          <Route path="/presthun2025test" element={<UserVoiceAgent />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
