const api = window.dshDesktop

function payload() {
  const raw = window.location.hash.slice(1)
  if (raw === '') return undefined
  try {
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return undefined
  }
}

function setText(selector, text) {
  document.querySelector(selector).textContent = text
}

async function main() {
  const locale = await api.locale()
  const messages = locale.messages
  const message = (key, values = {}) => messages[key].replaceAll(/\{([^{}]+)\}/gu, (placeholder, name) => values[name] ?? placeholder)
  const info = payload()
  const resolved = (value, unavailable) => value ?? unavailable

  document.documentElement.lang = locale.id
  setText('#page-title', messages.aboutTitle)
  setText('#product', messages.aboutProduct)
  setText('#meta', message('aboutMeta', { version: resolved(info?.version, messages.aboutUnavailable) }))

  setText('#runtime-heading', messages.aboutRuntimeHeading)
  document.querySelector('#runtime').replaceChildren(...(info?.rows ?? []).map(row => {
    const entry = document.createElement('div')
    const term = document.createElement('dt')
    const detail = document.createElement('dd')
    term.textContent = messages[row.key] ?? row.key
    detail.textContent = resolved(row.value, messages.aboutUnavailable)
    entry.append(term, detail)
    return entry
  }))

  setText('#license-heading', messages.aboutLicenseHeading)
  setText('#license-note', messages.aboutLicenseNote)
  setText('#license-summary', messages.aboutLicenseText)
  setText('#license', resolved(info?.license, messages.aboutLicenseUnavailable))

  setText('#notices-summary', messages.aboutNoticesHeading)
  setText('#notices-text', resolved(info?.notices, messages.aboutNoticesUnavailable))
}

void main()
