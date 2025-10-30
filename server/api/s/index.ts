import type { SourceID, SourceResponse } from "@shared/types"
import { getters } from "#/getters"
import { getCacheTable } from "#/database/cache"
import type { CacheInfo } from "#/types"

export default defineEventHandler(async (event): Promise<SourceResponse> => {
  try {
    const query = getQuery(event)
    const latest = query.latest !== undefined && query.latest !== "false"
    let id = query.id as SourceID
    const isValid = (id: SourceID) => !id || !sources[id] || !getters[id]

    if (isValid(id)) {
      const redirectID = sources?.[id]?.redirect
      if (redirectID) id = redirectID
      if (isValid(id)) throw new Error("Invalid source id")
    }

    const cacheTable = await getCacheTable()
    // Date.now() in Cloudflare Worker will not update throughout the entire runtime.
    const now = Date.now()
    let cache: CacheInfo | undefined
    if (cacheTable) {
      cache = await cacheTable.get(id)
      if (cache) {
        // interval 刷新间隔，如果缓存时间小于数据源的刷新间隔，直接返回缓存
        if (now - cache.updated < sources[id].interval) {
          return {
            status: "success",
            id,
            updatedTime: now,
            items: cache.items,
          }
        }
        // 超过 interval 时间，继续往下获取新数据
      }
    }

    try {
      const newData = (await getters[id]()).slice(0, 30)
      if (cacheTable && newData.length) {
        if (event.context.waitUntil) event.context.waitUntil(cacheTable.set(id, newData))
        else await cacheTable.set(id, newData)
      }
      logger.success(`fetch ${id} latest`)
      return {
        status: "success",
        id,
        updatedTime: now,
        items: newData,
      }
    } catch (e) {
      if (cache!) {
        return {
          status: "cache",
          id,
          updatedTime: cache.updated,
          items: cache.items,
        }
      } else {
        throw e
      }
    }
  } catch (e: any) {
    logger.error(e)
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "Internal Server Error",
    })
  }
})
