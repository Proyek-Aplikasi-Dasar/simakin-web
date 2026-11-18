const DEFAULT_TTL = 60_000
const store = new Map() 

export function cachedRequest(key, loader, ttl = DEFAULT_TTL) {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < hit.ttl) return hit.promise

  const entry = { at: Date.now(), ttl, done: false }
  const promise = loader().then(
    (value) => {
      entry.done = true
      return value
    },
    (err) => {
      if (store.get(key)?.promise === promise) store.delete(key)
      throw err
    }
  )
  entry.promise = promise
  store.set(key, entry)
  return promise
}

export function dropPendingRequests() {
  for (const [key, entry] of store) {
    if (!entry.done) store.delete(key)
  }
}

export function clearRequestCache() {
  store.clear()
}
