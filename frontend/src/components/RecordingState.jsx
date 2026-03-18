import { useState, useRef, useEffect } from 'react';
import './RecordingState.css';

function RecordingState({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [audioLevels, setAudioLevels] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for waveform
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      microphone.connect(analyser);
      analyserRef.current = { analyser, dataArray };
      
      // Start waveform animation
      const updateWaveform = () => {
        if (analyserRef.current) {
          analyserRef.current.analyser.getByteFrequencyData(analyserRef.current.dataArray);
          const levels = Array.from(analyserRef.current.dataArray.slice(0, 24)).map(value => value / 255);
          setAudioLevels(levels);
          animationRef.current = requestAnimationFrame(updateWaveform);
        }
      };
      updateWaveform();
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
        onRecordingComplete(file);
        
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevels([]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!isRecording) {
    return (
      <div className="recording-state-container">
        <div className="recording-start-card">
          <div className="recording-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <h3>Ready to Record</h3>
          <p>Click the button below to start recording your medical consultation</p>
          {error && <div className="recording-error">{error}</div>}
          <button onClick={startRecording} className="btn-start-recording">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            Start Recording
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recording-state-container">
      <div className="recording-active-card">
        <div className="recording-header">
          <div className="recording-indicator">
            <span className="pulse-dot"></span>
            <span className="recording-text">Recording</span>
          </div>
          <div className="recording-timer">{formatTime(recordingTime)}</div>
        </div>
        
        <div className="waveform-container">
          <div className="waveform">
            {audioLevels.map((level, index) => (
              <div
                key={index}
                className="waveform-bar"
                style={{
                  height: `${Math.max(level * 100, 8)}%`,
                  animationDelay: `${index * 0.05}s`
                }}
              />
            ))}
          </div>
        </div>
        
        <button onClick={stopRecording} className="btn-stop-recording">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z"/>
          </svg>
          Stop Recording
        </button>
      </div>
    </div>
  );
}

export default RecordingState;