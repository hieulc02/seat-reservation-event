import axios from 'axios';
import apiEndpoint from '../config/apiConfig';
import Cookies from 'js-cookie';
import Router from 'next/router';
export const Axios = axios.create({
  baseURL: `${apiEndpoint}/api/users`,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
export const login = async (email, password) => {
  const res = await Axios.post(`/login`, { email, password });
  setToken(res.data?.token);
  return res.data;
};
export const updateMe = async (updateUser) => {
  const res = await axios.patch(
    `${apiEndpoint}/api/users/updateMe`,
    updateUser,
    {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${Cookies.get('token' || 'jwt')}`,
      },
    }
  );
  return res.data;
};
export const verifyEmail = async (query) => {
  const res = await Axios.get(`/email/confirmation?code=${query}`);
  return res.data;
};
export const getMe = async () => {
  const res = await Axios.get('me', {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${Cookies.get('token' || 'jwt')}`,
    },
  });
  return res.data;
};
export const signup = async (user) => {
  const res = await Axios.post('/signup', user);
  setToken(res.data?.token);
  return res.data;
};

export const logout = async () => {
  const res = await Axios.get('/logout');
  Cookies.remove('token');
  Router.push('/login');
  return res.data;
};

export const setToken = (token) => {
  Cookies.set('token', token, { secure: true, expires: 365 });
};
