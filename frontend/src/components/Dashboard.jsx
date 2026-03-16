import { useState } from 'react';
import ClinicalNote from './ClinicalNote';
import TranscriptView from './TranscriptView';
import './Dashboard.css';

function Dashboard({ sessionId, filename, transcript, soap, onDownloadReport, onReset }) {
  const [activeTab, setActiveTab] = useState('clinical');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="patient-info">
          <div className="avatar">👤</div>
          <div className="patient-details">
            <h2>Medical Consultation</h2>
            <p className="session-meta">Session: {sessionId.slice(0, 8)}... • File: {filename}</p>
          </div>
        </div>
        <div className="dashboard-actions">
          <button onClick={onDownloadReport} className="btn-download">
            📄 Download Report
          </button>
          <button onClick={onReset} className="btn-new">
            ➕ New Session
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'clinical' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinical')}
        >
          Clinical Note
        </button>
        <button
          className={`tab ${activeTab === 'transcript' ? 'active' : ''}`}
          onClick={() => setActiveTab('transcript')}
        >
          Transcript
        </button>
        <button
          className={`tab ${activeTab === 'noteworthy' ? 'active' : ''}`}
          onClick={() => setActiveTab('noteworthy')}
        >
          Noteworthy
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'clinical' && soap && <ClinicalNote soap={soap} />}
        {activeTab === 'transcript' && transcript && <TranscriptView transcript={transcript} />}
        {activeTab === 'noteworthy' && (
          <div className="noteworthy-placeholder">
            <p>Key insights and important points will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
