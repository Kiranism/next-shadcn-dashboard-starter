import axios from 'axios';

const baseURL = `${process.env.NEXT_PUBLIC_API_URL}`;

export const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('[Axios Request]', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  }
);

// Response logging
axiosInstance.interceptors.response.use((response) => {
  console.log('[Axios Response]', {
    status: response.status,
    url: response.config.url,
    data: response.data
  });
  return response;
});

export default axiosInstance;
