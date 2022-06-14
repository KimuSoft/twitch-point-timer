import axios from "axios"
import useSWR from "swr"

const fetcher = (url: string) => axios.get(url).then((x) => x.data)

export const useApi = <T = any,>(url: string) => {
  const { data } = useSWR(url, { fetcher, suspense: true })

  return data as T
}
