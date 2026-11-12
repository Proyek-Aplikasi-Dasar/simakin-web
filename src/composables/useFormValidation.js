import { reactive, watch, nextTick } from 'vue'

export function useFormValidation(form, schema, { external = () => ({}) } = {}) {
  const keys = Object.keys(schema)
  const errors = reactive({})
  const touched = reactive({})
  const stale = reactive({}) 

  function check(key) {
    for (const rule of schema[key]) {
      const msg = rule(form[key], form)
      if (msg) return msg
    }
    return ''
  }

  function validateField(key) {
    const msg = check(key)
    if (msg) errors[key] = msg
    else delete errors[key]
    return !msg
  }

  function errorOf(key) {
    return errors[key] || (stale[key] ? '' : (external()?.[key] ?? ''))
  }

  async function focusFirstError() {
    await nextTick()
    const key = keys.find((k) => errorOf(k))
    if (key) document.getElementById(key)?.focus()
  }

  function touch(key) {
    touched[key] = true
    return validateField(key)
  }

  function validate() {
    keys.forEach((k) => {
      touched[k] = true
      stale[k] = false
    })
    const ok = keys.map(validateField).every(Boolean)
    if (!ok) focusFirstError()
    return ok
  }

  function reset() {
    keys.forEach((k) => {
      delete errors[k]
      touched[k] = false
      stale[k] = false
    })
  }

  watch(
    () => keys.map((k) => form[k]),
    (now, old) => {
      keys.forEach((k, i) => {
        if (now[i] === old[i]) return
        stale[k] = true
        if (touched[k]) validateField(k)
      })
    }
  )

  return { errorOf, validate, validateField, touch, focusFirstError, reset }
}