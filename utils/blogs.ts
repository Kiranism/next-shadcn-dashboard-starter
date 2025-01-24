import axios from 'axios';

export const getBlogs = async () => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/blog/getall`
  );
  return response.data;
};

export const createBlog = async (formData: any, token: string) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/blog/create`,
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

export const getBlog = async (blogId: any) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/blog/get/?blogId=${blogId}`,
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

export const updateBlog = async (formData: any, token: string, blogId: any) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/blog/update?blogId=${blogId}`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'PUT',
      data: formData
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

export const deleteBlog = async (blogId: any, token: string) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/blog/delete?blogId=${blogId}`,
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
