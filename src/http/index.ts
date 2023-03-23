import { AxiosResponse } from 'axios';
import Request from './request';

const http = new Request({
  baseURL: import.meta.env.VITE_API_BASEURL,
  timeout: 1000 * 60 * 5,
  interceptors: {
    // 请求拦截器
    requestInterceptors: (config) => {
      console.log('实例请求');
      return config;
    },
    // 响应拦截器
    responseInterceptors: (result: AxiosResponse) => {
      console.log('实例响应');
      return result;
    },
  },
});

export default http;
