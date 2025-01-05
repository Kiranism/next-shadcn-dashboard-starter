import axios from 'axios';

export const getAllOrders = async (
  page: number,
  limit: number,
  token: string
) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/all?page=${page}&limit=${limit}`,
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

export const getOrder = async (orderId: any, token: string) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/get?orderId=${orderId}`,
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

export const getStoreOrderDetails = async (
  storeId: any,
  orderId: any,
  token: string
) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/order/store/get?storeId=${storeId}&orderId=${orderId}`,
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

export const completeOrder = async (
  orderId: any,
  storeId: any,
  trackingNumber: string,
  shippingProvider: string,
  shipmentDate: string,
  notes: string | any,
  token: string
) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/new/fulfillment`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      method: 'POST',
      data: {
        orderId,
        storeId,
        trackingNumber,
        shippingProvider,
        shipmentDate,
        notes
      }
    });
    return response.data;
  } catch (error) {
    return error;
  }
};
