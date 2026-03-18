import './TranscriptView.css';

function TranscriptView({ transcript }) {
  if (!transcript || !transcript.segments) {
    return (
      <div className="transcript-empty">
        <p>No transcript available</p>
      </div>
    );
  }

  const getSpeakerName = (label) => {
    // Handle generic speaker labels (Speaker 00, Speaker 01, etc.)
    if (label.toLowerCase().includes('speaker')) {
      const match = label.match(/speaker\s*(\d+)/i);
      if (match) {
        const speakerNum = parseInt(match[1]);
        return `Speaker ${String(speakerNum + 1).padStart(2, '0')}`; // Convert 0-based to 1-based with zero padding
      }
    }
    
    // Handle raw numeric labels (00, 01, 02)
    if (/^\d+$/.test(label)) {
      const speakerNum = parseInt(label);
      return `Speaker ${String(speakerNum + 1).padStart(2, '0')}`;
    }
    
    // Return original label if no pattern matches
    return label;
  };

  const isPatient = (label) => {
    // Remove patient-specific styling logic since we're not differentiating
    return false;
  };

  return (
    <div className="transcript-sidebar">
      {transcript.needs_role_assignment && (
        <div className="transcript-warning">
          <p>Speaker roles need to be assigned for better organization.</p>
        </div>
      )}

      <div className="transcript-messages">
        {transcript.segments.map((seg, idx) => {
          const speakerName = getSpeakerName(seg.speaker_label);
          const isPatientMessage = isPatient(seg.speaker_label);
          
          return (
            <div key={idx} className="transcript-message">
              <div className="message-speaker">{speakerName}</div>
              <div className="message-content">{seg.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TranscriptView;