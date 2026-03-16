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

  const handleUploadSuccess = (data) => {
    setSessionId(data.session_id);
    setStatus('processing');
    setTranscript(null);
    setSoap(null);
  };

  const handleStatusUpdate = (data) => {
    setStatus(data.status);
    if (data.transcript) {
      setTranscript(data.transcript);
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Medical Notes AI</h1>
        <p>AI-powered medical consultation transcription and clinical documentation</p>
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
