import { useState } from 'react';
import ClinicalNote from './ClinicalNote';
import TranscriptView from './TranscriptView';
import Noteworthy from './Noteworthy';
import AudioPlayer from './AudioPlayer';
import './Dashboard.css';

function Dashboard({ sessionId, filename, transcript, soap, audioUrl, onDownloadReport, onReset }) {
  const [rightPaneTab, setRightPaneTab] = useState('transcript');

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        {/* Left Pane - Clinical Note */}
        <div className="left-pane">
          <div className="clinical-note-container">
            {soap && <ClinicalNote soap={soap} />}
          </div>
        </div>

        {/* Right Pane - Transcript & Noteworthy */}
        <div className="right-pane">
          <div className="right-pane-header">
            <div className="right-pane-tabs">
              <button
                className={`right-tab ${rightPaneTab === 'transcript' ? 'active' : ''}`}
                onClick={() => setRightPaneTab('transcript')}
              >
                Transcript
              </button>
              <button
                className={`right-tab ${rightPaneTab === 'noteworthy' ? 'active' : ''}`}
                onClick={() => setRightPaneTab('noteworthy')}
              >
                Noteworthy
              </button>
            </div>
          </div>
          
          <div className="right-pane-content">
            {rightPaneTab === 'transcript' && transcript && (
              <TranscriptView transcript={transcript} />
            )}
            {rightPaneTab === 'noteworthy' && soap && (
              <Noteworthy soap={soap} />
            )}
          </div>
        </div>
      </div>

      {/* Fixed Audio Player at Bottom */}
      {audioUrl && <AudioPlayer audioUrl={audioUrl} />}
    </div>
  );
}

export default Dashboard;