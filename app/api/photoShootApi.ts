// api/photoShootApi.ts
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL + "/photoShoot";

export const fetchPhotoShoots = async (page: number, limit: number) => {
  const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`);
  return response.data;
};

export const createPhotoShoot = async (data: any) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("type", data.type);
  formData.append("status", data.status);
  formData.append("featured", data.featured);
  formData.append("performers", data.performers);
  formData.append("photographers", data.photographers);
  formData.append("category", data.category);
  // formData.append("createdAt", data.createdAt);

  if (data.images) {
    data.images.forEach((file: File) => {
      formData.append("files", file);
    });
  }

  if (data.coverImage) {
    formData.append("coverImageFile", data.coverImage);
  }

  const response = await axios.post(API_URL, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

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
