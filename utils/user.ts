import axios from 'axios';

export const getAllUsers = async (
  page: number,
  token: string,
  limit: number
) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/user/getall?page=${page}&limit=${limit}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      method: 'GET'
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

export const getUser = async (id: any, token: string) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/user?user_id=${id}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      method: 'GET'
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

export const updateUser = async (formData: any, id: any, token: string) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/user/update?user_id=${id}`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'POST',
      data: formData
    });
    return response;
  } catch (error) {
    return error;
  }
};
