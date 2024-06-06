// api/photoShootApi.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/photoShoot';

export const fetchPhotoShoots = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createPhotoShoot = async (data: any) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

export const updatePhotoShoot = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deletePhotoShoot = async (id: string) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const fetchPhotoShootById = async (id: string) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};
