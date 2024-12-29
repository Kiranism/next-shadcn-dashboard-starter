import axios from 'axios';

export const getAllStores = async (page: number, limit: number) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/get/stores/all?page=${page}&limit=${limit}`,
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

export const getStore = async (storeName: any) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/get/store?storeName=${storeName}`,
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

export const getStoreListing = async (storeId: any) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/listing/store/get?storeId=${storeId}`,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'GET'
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return error;
  }
};
