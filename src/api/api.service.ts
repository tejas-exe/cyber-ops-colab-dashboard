import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

type GetTokenFn = () => string | null;
const env = (import.meta as ImportMeta).env;

class ApiService {
  private client: AxiosInstance;
  private getToken?: GetTokenFn;

    constructor(baseURL = env.VITE_API_BASE_URL || "", timeout = 10_000, headers = {}, getToken = null) {

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
        })
    this._attachRequestInterceptor();
    this._attachResponseInterceptor();
  }

  private _attachRequestInterceptor() {
    this.client.interceptors.request.use((config) => {
      if (this.getToken) {
        const token = this.getToken();
                if (token) {
                    if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
                    }
        }
      }
      return config;
    });
  }

  private _attachResponseInterceptor() {
    this.client.interceptors.response.use(
      (response) => response,
            (error) => {
                return Promise.reject(error);
            }
    );
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export { ApiService }
