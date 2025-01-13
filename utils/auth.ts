import axios from 'axios';

export const login = async (email: string, password: string) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/login/admin`,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      data: {
        email,
        password
      }
    });
    return response;
  } catch (error) {
    return error;
  }
};

export const googleLogin = async (token: string | undefined) => {
  try {
    const response = await axios({
      url: `${process.env.NEXT_PUBLIC_SERVER_URL}/google/auth`,
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      data: {
        token,
        authProvider: 'google'
      }
    });
    return response;
  } catch (error) {
    return error;
  }
};
