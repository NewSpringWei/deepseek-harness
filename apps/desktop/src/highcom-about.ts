/**
 * Baseline metadata rendered by the Highcom Work About window.
 *
 * The Electron shell serializes the returned payload into the About page URL fragment, so this module
 * imports no Electron API and resolves every value from the packaged resources it is given.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readDesktopRuntime, type DesktopRuntimeDescriptor } from './runtime-tree.ts'
import type { DesktopMessages } from './locale.ts'

/** One labeled baseline value; `null` marks a value this build cannot report. */
export interface HighcomAboutRow {
  readonly key: keyof DesktopMessages
  readonly value: string | null
}

/** Everything the About page renders besides locale-owned copy. */
export interface HighcomAboutInfo {
  readonly version: string
  readonly rows: readonly HighcomAboutRow[]
  readonly license: string | null
  readonly notices: string | null
}

/** Files the About window quotes verbatim from the packaged resources root. */
const DOCUMENTS = ['LICENSE', 'THIRD_PARTY_NOTICES.md'] as const

function readDocument(root: string, name: string): string | null {
  try {
    return readFileSync(join(root, name), 'utf8')
  } catch {
    // An absent document only removes its own panel; distribution compliance is verified during packaging.
    return null
  }
}

function readRelease(root: string): DesktopRuntimeDescriptor | undefined {
  try {
    return readDesktopRuntime(root)
  } catch {
    // A missing or malformed runtime tree leaves the bundled rows unavailable instead of failing the window.
    return undefined
  }
}

/**
 * Assemble the About window payload.
 * @param options - Application version, runtime tree root holding `desktop-runtime.json`, and resources root.
 * @returns Baseline rows plus the quoted license and third-party notice documents.
 */
export function highcomAboutInfo(options: {
  readonly version: string
  readonly runtimeRoot: string
  readonly resourcesRoot: string
}): HighcomAboutInfo {
  const runtime = readRelease(options.runtimeRoot)
  const release = runtime?.release
  const documents = DOCUMENTS.map(name => readDocument(options.resourcesRoot, name))
  return {
    version: options.version,
    rows: [
      { key: 'aboutShellVersion', value: process.versions.electron ?? null },
      { key: 'aboutChromiumVersion', value: process.versions.chrome ?? null },
      { key: 'aboutNodeVersion', value: process.versions.node ?? null },
      { key: 'aboutV8Version', value: process.versions.v8 ?? null },
      { key: 'aboutBundledNode', value: release?.nodeVersion ?? null },
      { key: 'aboutPnpmVersion', value: release?.pnpmVersion ?? null },
      { key: 'aboutDshVersion', value: release?.version ?? null },
      { key: 'aboutHostProtocol', value: release === undefined ? null : String(release.hostProtocolVersion) },
      { key: 'aboutPlatform', value: `${process.platform} ${process.arch}` },
    ],
    license: documents[0] ?? null,
    notices: documents[1] ?? null,
  }
}
