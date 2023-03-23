import axios, { AxiosResponse } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { RequestConfig, RequestInterceptors, CreateRequestConfig } from './types';

class Request {
  // axios 实例
  instance: AxiosInstance;

  // 拦截器对象
  interceptorsObj?: RequestInterceptors<AxiosResponse>;

  // * 存放取消请求控制器Map
  abortControllerMap: Map<string, AbortController>;

  constructor(config: CreateRequestConfig) {
    this.instance = axios.create(config);
    // * 初始化存放取消请求控制器Map
    this.abortControllerMap = new Map();
    this.interceptorsObj = config.interceptors;
    // *拦截器执行顺序 接口请求 -> 实例请求 -> 全局请求 -> 实例响应 -> 全局响应 -> 接口响应
    this.instance.interceptors.request.use(
      (req: InternalAxiosRequestConfig) => {
        const controller = new AbortController();
        const url = req.url || '';
        req.signal = controller.signal;
        this.abortControllerMap.set(url, controller);
        console.log('全局请求');
        return req;
      },
      (err: unknown) => err,
    );

    // *使用实例拦截器
    this.instance.interceptors.request.use(
      this.interceptorsObj?.requestInterceptors,
      this.interceptorsObj?.requestInterceptorsCatch,
    );
    this.instance.interceptors.response.use(
      this.interceptorsObj?.responseInterceptors,
      this.interceptorsObj?.responseInterceptorsCatch,
    );
    // *全局响应拦截器保证最后执行
    this.instance.interceptors.response.use(
      // *因为我们接口的数据都在res.data下，所以我们直接返回res.data
      (res: AxiosResponse) => {
        const url = res.config.url || '';
        this.abortControllerMap.delete(url);
        console.log('全局响应');
        return res.data;
      },
      (err: unknown) => err,
    );
  }

  request<T>(config: RequestConfig<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // *如果我们为单个请求设置拦截器，这里使用单个请求的拦截器
      let customConfig = config;
      if (config.interceptors?.requestInterceptors) {
        customConfig = config.interceptors.requestInterceptors(config as InternalAxiosRequestConfig);
      }
      this.instance
        .request<unknown, T>(customConfig)
        .then((res) => {
          // *如果我们为单个响应设置拦截器，这里使用单个响应的拦截器
          let customRes = res;
          if (config.interceptors?.responseInterceptors) {
            customRes = config.interceptors.responseInterceptors(res);
          }

          resolve(customRes);
        })
        .catch((err: unknown) => {
          reject(err);
        });
    });
  }

  /**
   * 取消全部请求
   */
  cancelAllRequest() {
    this.abortControllerMap.forEach((controller) => {
      controller.abort();
    });
    this.abortControllerMap.clear();
  }

  /**
   * 取消指定的请求
   * @param url 待取消的请求URL
   */
  cancelRequest(url: string | string[]) {
    const urlList = Array.isArray(url) ? url : [url];
    urlList.forEach((urlItem) => {
      this.abortControllerMap.get(urlItem)?.abort();
      this.abortControllerMap.delete(urlItem);
    });
  }

  setHeader<K>(headers: K): void {
    if (!this.instance) {
      return;
    }
    Object.assign(this.instance.defaults.headers.common, headers);
  }

  get<T>(config: RequestConfig<T>): Promise<T> {
    return this.request({ ...config, method: 'GET' });
  }

  post<T>(config: RequestConfig<T>): Promise<T> {
    return this.request({ ...config, method: 'POST' });
  }

  put<T>(config: RequestConfig<T>): Promise<T> {
    return this.request({ ...config, method: 'PUT' });
  }

  delete<T>(config: RequestConfig<T>): Promise<T> {
    return this.request({ ...config, method: 'DELETE' });
  }
}

export default Request;
export { RequestConfig, RequestInterceptors };
