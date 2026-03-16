import axios from 'axios';

const API_BASE = '/api';

export const uploadAudio = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await axios.post(`${API_BASE}/upload-and-process-local`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return data;
};

export const getSessionStatus = async (sessionId, poll = false) => {
  const { data } = await axios.get(`${API_BASE}/session/${sessionId}`, {
    params: { poll }
  });
  return data;
};

export const getSoapNote = async (sessionId) => {
  const { data } = await axios.get(`${API_BASE}/session/${sessionId}/soap`);
  return data;
};

export const getReportUrl = (sessionId) => {
  return `${API_BASE}/session/${sessionId}/report`;
};
