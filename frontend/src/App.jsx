import { useState } from 'react';
import UploadForm from './components/UploadForm';
import StatusPoller from './components/StatusPoller';
import Dashboard from './components/Dashboard';
import { getReportUrl } from './api/client';
import './App.css';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [soap, setSoap] = useState(null);
  const [filename, setFilename] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);

  const handleUploadSuccess = (data) => {
    setSessionId(data.session_id);
    setStatus('processing');
    setTranscript(null);
    setSoap(null);
    // Extract filename from audio_url if available
    if (data.audio_url) {
      const urlParts = data.audio_url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const localAudioUrl = `/files/${filename}`;
      setAudioUrl(localAudioUrl);
    }
  };

  const handleStatusUpdate = (data) => {
    setStatus(data.status);
    if (data.transcript) {
      setTranscript(data.transcript);
    }
    // Get audio URL from status response
    if (data.audio_url && !audioUrl) {
      setAudioUrl(data.audio_url);
    }
  };

  const handleSoapGenerated = (soapData) => {
    setSoap(soapData.soap);
  };

  const handleReset = () => {
    setSessionId(null);
    setStatus(null);
    setTranscript(null);
    setSoap(null);
    setFilename('');
    setAudioUrl(null);
  };

  const handleDownloadReport = () => {
    const url = getReportUrl(sessionId);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${sessionId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleComplete = () => {
    // Reset all state to return to home page
    setSessionId(null);
    setStatus(null);
    setTranscript(null);
    setSoap(null);
    setFilename('');
    setAudioUrl(null);
  };

  return (
    <div className="app">
      {/* Professional Header */}
      <header className="app-header">
        <div className="doctor-info">
          <div className="doctor-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <span className="doctor-name">User</span>
        </div>
        
        <div className="header-actions">
          {sessionId && (
            <>
              {/* <button onClick={handleDownloadReport} className="btn-secondary">
                Download Report
              </button> */}
              <button onClick={handleComplete} className="btn-complete">
                Complete
              </button>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {!sessionId ? (
          <UploadForm onSuccess={handleUploadSuccess} onFilenameChange={setFilename} />
        ) : status === 'processing' ? (
          <StatusPoller
            sessionId={sessionId}
            onStatusUpdate={handleStatusUpdate}
            onSoapGenerated={handleSoapGenerated}
          />
        ) : status === 'succeeded' && transcript ? (
          <Dashboard
            sessionId={sessionId}
            filename={filename}
            transcript={transcript}
            soap={soap}
            audioUrl={audioUrl}
            onDownloadReport={handleDownloadReport}
            onReset={handleReset}
          />
        ) : null}
      </main>

      <footer className="app-footer">
        <p>AI-generated content must be reviewed by a licensed healthcare professional</p>
      </footer>
    </div>
  );
}

export default App;
