import { useEffect, useState } from 'react';
import { getSessionStatus, getSoapNote } from '../api/client';
import './StatusPoller.css';

function StatusPoller({ sessionId, onStatusUpdate, onSoapGenerated }) {
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;

    const poll = async () => {
      try {
        const data = await getSessionStatus(sessionId, false);
        onStatusUpdate(data);

        if (data.status === 'succeeded') {
          setPolling(false);
          
          // Fetch SOAP note
          try {
            const soapData = await getSoapNote(sessionId);
            onSoapGenerated(soapData);
          } catch (err) {
            console.error('Failed to fetch SOAP note:', err);
          }
        } else if (data.status === 'failed') {
          setPolling(false);
          setError(data.error || 'Processing failed');
        }
      } catch (err) {
        setError('Failed to check status');
        setPolling(false);
      }
    };

    if (polling) {
      poll();
      interval = setInterval(poll, 3000);
    }

    return () => clearInterval(interval);
  }, [sessionId, polling, onStatusUpdate, onSoapGenerated]);

  if (error) {
    return (
      <div className="status-poller error">
        <div className="status-icon">❌</div>
        <h3>Processing Failed</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (polling) {
    return (
      <div className="status-poller processing">
        <div className="spinner"></div>
        <h3>Processing Audio...</h3>
        <p>Performing speaker diarization and transcription. This may take 1-3 minutes.</p>
        <div className="session-id">Session ID: {sessionId}</div>
      </div>
    );
  }

  return (
    <div className="status-poller success">
      <div className="status-icon">✓</div>
      <h3>Processing Complete</h3>
    </div>
  );
}

export default StatusPoller;
