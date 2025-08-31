import axios from "axios"
import type { AxiosInstance, AxiosRequestConfig } from "axios"
import { merge } from "lodash-es"

import { apiCode } from "./constants";
import { showError } from "./use-notifition";

function createInstance() {
  const instance = axios.create()

  instance.interceptors.request.use(
    config => {
      config.timeout = 20000;
      return config
    },
    error => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => {
      const apiData = response.data

      const responseType = response.request?.responseType
      if (responseType === "blob" || responseType === "arraybuffer") return apiData

      const code = apiData.code
      switch (code) {
        case apiCode.SUCCESS:
          return apiData.data
        case apiCode.NOT_LOGIN:
          window.location.href = apiData.data.loginUrl
          return
        default:
          showError(apiData.message)
          return Promise.reject(apiData.message || "Error")
      }
    },
    (error) => {
      return Promise.reject(error)
    }
  )
  return instance
}

function createRequest(instance: AxiosInstance) {
  return <T>(config: AxiosRequestConfig): Promise<T> => {
    const defaultConfig: AxiosRequestConfig = {
      baseURL: import.meta.env.PROD ? '/' : '/dev-api',
      headers: {
        "Content-Type": "application/json",
      },
      data: {},
      timeout: 20000,
      withCredentials: true
    }

    const mergeConfig = merge(defaultConfig, config)
    return instance(mergeConfig)
  }
}

const instance = createInstance()
const request = createRequest(instance)

export default request