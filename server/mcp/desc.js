import sources from "../../shared/sources.json"

const entries = Object.entries(sources).filter(([_, source]) => {
  if (source.redirect) return false
  return true
})

export const ids = entries.map(([id]) => id)

export const description = entries
  .map(([id, source]) => (source.title ? `${source.name}-${source.title} id is ${id}` : `${source.name} id is ${id}`))
  .join(";")
