import { useState } from 'react';
import { uploadAudio } from '../api/client';
import AudioRecorder from './AudioRecorder';
import './UploadForm.css';

function UploadForm({ onSuccess, onFilenameChange }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
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

  return (
    <div className="upload-form-container">
      <div className="upload-card">
        <h2>Upload Medical Consultation Audio</h2>
        <p className="upload-subtitle">
          Supported formats: WAV, MP3, M4A, OGG, FLAC, WEBM (max 1GB)
        </p>

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
              {file ? file.name : 'Choose audio file'}
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading & Processing...' : 'Upload & Process'}
          </button>
        </form>

        <AudioRecorder onRecordingComplete={handleRecordingComplete} />

        <div className="info-box">
          <strong>Note:</strong> Processing typically takes 1-3 minutes depending on audio length.
          The API must be publicly accessible for diarization to work.
        </div>
      </div>
    </div>
  );
}

export default UploadForm;
