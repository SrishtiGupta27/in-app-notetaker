import { useState } from 'react';
import { uploadAudio } from '../api/client';
import AudioRecorder from './AudioRecorder';
import RecordingState from './RecordingState';
import './UploadForm.css';

function UploadForm({ onSuccess, onFilenameChange }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showRecordingState, setShowRecordingState] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
    if (selectedFile) {
      onFilenameChange(selectedFile.name);
    }
  };

  const handleRecordingComplete = (recordedFile) => {
    setFile(recordedFile);
    onFilenameChange(recordedFile.name);
    setError(null);
    setShowRecordingState(false);
  };

  const handleStartRecording = () => {
    setShowRecordingState(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file or record audio');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const data = await uploadAudio(file);
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  if (showRecordingState) {
    return <RecordingState onRecordingComplete={handleRecordingComplete} />;
  }

  return (
    <div className="upload-form-container">
      <div className="upload-card">
        <div className="upload-header">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          <h2>Upload Medical Consultation Audio</h2>
          <p className="upload-subtitle">
            Supported formats: WAV, MP3, M4A, OGG, FLAC, WEBM (max 1GB)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="audio-file"
              accept=".wav,.mp3,.m4a,.ogg,.flac,.webm"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <label htmlFor="audio-file" className="file-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              {file ? file.name : 'Choose audio file'}
            </label>
          </div>

          <div className="upload-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            onClick={handleStartRecording}
            className="btn-record-new"
            disabled={uploading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            Record Audio
          </button>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <svg className="spinner" width="20" height="20" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Uploading & Processing...
              </>
            ) : (
              'Upload & Process'
            )}
          </button>
        </form>

        <div className="info-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,10.5A1.5,1.5 0 0,1 10.5,9A1.5,1.5 0 0,1 12,7.5A1.5,1.5 0 0,1 13.5,9A1.5,1.5 0 0,1 12,10.5Z"/>
          </svg>
          <div>
            <strong>Note:</strong> Processing typically takes 1-3 minutes depending on audio length.
            The API must be publicly accessible for diarization to work.
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadForm;
