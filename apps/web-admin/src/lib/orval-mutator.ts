import type { AxiosRequestConfig } from "axios";

import { adminApi } from "./api";

// Orval-generated hooks call through this. Reuses adminApi so generated
// requests inherit the Bearer header + single-flight 401-refresh interceptor.
// Spec paths already carry the /api prefix, so adminApi's baseURL is the
// bare origin (no /api).
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  adminApi(config).then((response) => response.data as T);
