import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";

/**
 * 生成简单的可观察性ID（Correlation ID）。
 * 结构：<timeHex>-<randomHex>
 */
function generateCorrelationId(): string {
  const timeHex = Date.now().toString(16);
  const randomHex = Math.floor(Math.random() * 0xffff_ffff)
    .toString(16)
    .padStart(8, "0");
  return `${timeHex}-${randomHex}`;
}

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新`token` */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 为每个请求注入 X-Correlation-ID（若外部已设置则保留）
        config.headers = config.headers || {};
        const hasCorrelationId =
          (config.headers["X-Correlation-ID"] as string | undefined) ||
          (config.headers["x-correlation-id"] as string | undefined);
        if (!hasCorrelationId) {
          config.headers["X-Correlation-ID"] = generateCorrelationId();
        }

        // 记录回调但不提前返回；确保在注入 Authorization 与其他头之后再调用回调，避免页面捕获不到最终请求头。
        const userBeforeRequestCb =
          typeof config.beforeRequestCallback === "function"
            ? config.beforeRequestCallback
            : PureHttp.initConfig.beforeRequestCallback;
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = ["/refresh-token", "/login"];
        return whiteList.some(url => config.url.endsWith(url))
          ? (() => {
              // 白名单请求：直接执行回调并返回
              if (typeof userBeforeRequestCb === "function") {
                userBeforeRequestCb(config);
              }
              return config;
            })()
          : new Promise(resolve => {
              const data = getToken();
              if (data) {
                const now = new Date().getTime();
                const expired = parseInt(data.expires) - now <= 0;
                if (expired) {
                  if (!PureHttp.isRefreshing) {
                    PureHttp.isRefreshing = true;
                    // token过期刷新
                    useUserStoreHook()
                      .handRefreshToken({ refreshToken: data.refreshToken })
                      .then(res => {
                        const token = res.data.accessToken;
                        config.headers["Authorization"] = formatToken(token);
                        PureHttp.requests.forEach(cb => cb(token));
                        PureHttp.requests = [];
                      })
                      .finally(() => {
                        PureHttp.isRefreshing = false;
                      });
                  }
                  // 由于需要等待刷新结果，原始请求将被加入队列；在真正发出前，回调会在 retryOriginalRequest 中再次触发。
                  const nextConfigPromise =
                    PureHttp.retryOriginalRequest(config);
                  nextConfigPromise.then(finalConfig => {
                    if (typeof userBeforeRequestCb === "function") {
                      userBeforeRequestCb(finalConfig);
                    }
                    resolve(finalConfig);
                  });
                } else {
                  config.headers["Authorization"] = formatToken(
                    data.accessToken
                  );
                  // 注入完成后再调用回调，确保页面能捕获到 Authorization
                  if (typeof userBeforeRequestCb === "function") {
                    userBeforeRequestCb(config);
                  }
                  resolve(config);
                }
              } else {
                /**
                 * 开发环境下的容错：若未登录或无 token，则为联调与演示自动注入一个临时的 Authorization。
                 * 注意：仅在 import.meta.env.DEV 为 true 时生效，生产环境不会注入。
                 * 该逻辑保证类似 Prism 的 mock 服务在启用安全策略时不会返回 401，从而提升前端联调效率。
                 */
                if (import.meta.env.DEV) {
                  config.headers["Authorization"] = "Bearer dummy";
                }
                // 注入完成后再调用回调，确保页面能捕获到 Authorization
                if (typeof userBeforeRequestCb === "function") {
                  userBeforeRequestCb(config);
                }
                resolve(config);
              }
            });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return response.data;
        }
        return response.data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
