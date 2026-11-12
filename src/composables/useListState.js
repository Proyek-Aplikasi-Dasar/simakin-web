import { onBeforeUnmount } from 'vue'

const saved = new Map()

function cameFromChild(prefixes) {
  const { back, forward } = window.history.state ?? {}
  return [back, forward].some((p) => typeof p === 'string' && prefixes.some((x) => p.startsWith(x)))
}

export function useListState(key, prefixes, { snapshot, restore }) {
  const prev = saved.get(key)
  saved.delete(key)
  if (prev && cameFromChild(prefixes)) restore(prev)

  onBeforeUnmount(() => saved.set(key, snapshot()))
}
