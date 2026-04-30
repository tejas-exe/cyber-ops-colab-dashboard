import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

type GetTokenFn = () => string | null;
const env = (import.meta as ImportMeta).env;

class ApiService {
    private client: AxiosInstance;
    private refreshClient: AxiosInstance;
    private getToken?: GetTokenFn;

    constructor(baseURL = env.VITE_API_BASE_URL || "", timeout = 10_000, headers = {}, withCredentials: boolean = true,) {

        this.client = axios.create({
            baseURL,
            withCredentials,
            timeout,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...headers,
            },
        })
        this.refreshClient = axios.create({
            baseURL: this.client.defaults.baseURL,
            withCredentials: true,
        });
        this._attachRequestInterceptor();
        this._attachResponseInterceptor();
    }

    private _attachRequestInterceptor() {
        this.client.interceptors.request.use((config) => {
            if (this.getToken) {
                const token = this.getToken();

                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            return config;
        });
    }

    private _attachResponseInterceptor() {
        this.client.interceptors.response.use(
            (response) => {
                return response;
            },
            async (error) => {
                const originalRequest: any = error.config;
                if (!error.response) {
                    return Promise.reject(error);
                }
                if (error.response.status === 401) {
                    try {
                        await this.refreshClient.post("/auth/refresh");
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        console.log("refresh token failed", refreshError);
                        await this.client.post("/auth/logout");
                        window.location.href = "/login";
                        return Promise.reject(refreshError);
                    }
                }
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
