import './TranscriptView.css';

function TranscriptView({ transcript }) {
  if (!transcript || !transcript.segments) {
    return null;
  }

  const getSpeakerClass = (label) => {
    const lower = label.toLowerCase();
    if (lower.includes('doctor')) return 'doctor';
    if (lower.includes('patient')) return 'patient';
    return 'unknown';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="transcript-view-dashboard">
      {transcript.needs_role_assignment && (
        <div className="warning-box">
          Speaker roles have not been assigned. Use the API to set doctor/patient roles.
        </div>
      )}

      <div className="transcript-segments">
        {transcript.segments.map((seg, idx) => (
          <div key={idx} className={`transcript-segment ${getSpeakerClass(seg.speaker_label)}`}>
            <div className="segment-header">
              <span className={`speaker-badge ${getSpeakerClass(seg.speaker_label)}`}>
                {seg.speaker_label}
              </span>
              <span className="segment-time">{formatTime(seg.start)}</span>
            </div>
            <div className="segment-text">{seg.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TranscriptView;
