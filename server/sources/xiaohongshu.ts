interface XiaohongshuRes {
  code: number
  msg: string
  data: XiaohongshuItem[]
  debug: string
  exec_time: number
  user_ip: string
  log_id: string
}

interface XiaohongshuItem {
  rank: number
  name: string
  date: string
  viewnum: string
  icon: string | null
  word_type: string
  url: string
}

export default defineSource(async () => {
  const apiUrl = "https://api.itapi.cn/api/hotnews/xiaohongshu?key=2dSYDPYEjrjtNaDVHAaefDPV8w"
  const res: XiaohongshuRes = await myFetch(apiUrl)

  if (res.code !== 200 || !res.data) {
    throw new Error(`Failed to fetch Xiaohongshu data: ${res.msg}`)
  }

  return res.data.map((item) => {
    return {
      id: item.rank.toString(),
      title: item.name,
      url: item.url,
      extra: {
        info: item.viewnum,
        icon: item.icon && {
          url: proxyPicture(item.icon),
          scale: 1.5,
        },
      },
    }
  })
})


