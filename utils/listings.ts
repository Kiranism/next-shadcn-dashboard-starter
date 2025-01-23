import axios from 'axios';

export const getAllListing = async (page: number, limit: number) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/listing/get/all?page=${page}&limit=${limit}`,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

export const createListing = async (formData: any, token: string) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/listing/create`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'POST',
      data: formData
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getListing = async (listingId: any) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/listing/get/?listingId=${listingId}`,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
    });
    return response;
  } catch (error) {
    return error;
  }
};

export const updateListing = async (
  formData: any,
  token: string,
  listingId: any
) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/listing/update?id=${listingId}`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'PATCH',
      data: formData
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteListing = async (
  token: string,
  listingId: any,
  userId: string
) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/listing/delete?id=${listingId}&userId=${userId}`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'DELETE'
    });
    return response.data;
  } catch (error) {
    return error;
  }
};
