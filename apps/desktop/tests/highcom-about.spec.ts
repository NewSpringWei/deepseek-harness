import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { highcomAboutInfo } from '../src/highcom-about.ts'
import { DESKTOP_RUNTIME_FILE } from '../src/runtime-tree.ts'

const RELEASE = {
  schemaVersion: 1,
  version: '0.1.5-rc.2',
  hostProtocolVersion: 3,
  nodeVersion: '24.17.0',
  pnpmVersion: '11.7.0',
} as const

const ROW_KEYS = [
  'aboutShellVersion',
  'aboutChromiumVersion',
  'aboutNodeVersion',
  'aboutV8Version',
  'aboutBundledNode',
  'aboutPnpmVersion',
  'aboutDshVersion',
  'aboutHostProtocol',
  'aboutPlatform',
] as const

const created: string[] = []

function fixture(): { runtimeRoot: string; resourcesRoot: string } {
  const root = mkdtempSync(join(tmpdir(), 'highcom-about-'))
  created.push(root)
  mkdirSync(join(root, 'runtime'), { recursive: true })
  writeFileSync(join(root, 'runtime', DESKTOP_RUNTIME_FILE), JSON.stringify({
    schemaVersion: 1,
    release: RELEASE,
    platform: process.platform,
    arch: process.arch,
    sharedPackages: ['@deepseek-ai/dsh', '@deepseek-ai/dsh-desktop-host'].map(name => ({
      name,
      version: RELEASE.version,
      path: `node_modules/${name}`,
    })),
    files: [],
  }))
  for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    copyFileSync(new URL(`../../../${name}`, import.meta.url), join(root, name))
  }
  return { runtimeRoot: join(root, 'runtime'), resourcesRoot: root }
}

function valueOf(rows: readonly { key: string; value: string | null }[], key: string): string | null {
  return rows.find(row => row.key === key)?.value ?? null
}

afterEach(() => {
  for (const root of created.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('Highcom Work About payload', () => {
  it('reports the bundled baseline and quotes both shipped documents', () => {
    const roots = fixture()
    const info = highcomAboutInfo({ version: '0.1.5-rc.2', ...roots })

    expect(info.version).toBe('0.1.5-rc.2')
    expect(info.rows.map(row => row.key)).toEqual([...ROW_KEYS])
    expect(valueOf(info.rows, 'aboutBundledNode')).toBe('24.17.0')
    expect(valueOf(info.rows, 'aboutPnpmVersion')).toBe('11.7.0')
    expect(valueOf(info.rows, 'aboutDshVersion')).toBe('0.1.5-rc.2')
    expect(valueOf(info.rows, 'aboutHostProtocol')).toBe('3')
    expect(valueOf(info.rows, 'aboutPlatform')).toBe(`${process.platform} ${process.arch}`)
    expect(info.license).toBe(readFileSync(new URL('../../../LICENSE', import.meta.url), 'utf8'))
    expect(info.notices).toBe(readFileSync(new URL('../../../THIRD_PARTY_NOTICES.md', import.meta.url), 'utf8'))
  })

  it('leaves values this build cannot report unavailable instead of failing the window', () => {
    const info = highcomAboutInfo({ version: '0.0.0', runtimeRoot: 'missing', resourcesRoot: 'missing' })

    expect(valueOf(info.rows, 'aboutDshVersion')).toBeNull()
    expect(valueOf(info.rows, 'aboutHostProtocol')).toBeNull()
    expect(valueOf(info.rows, 'aboutPlatform')).toBe(`${process.platform} ${process.arch}`)
    expect(info.license).toBeNull()
    expect(info.notices).toBeNull()
  })

  it('survives the URL fragment the About page parses', () => {
    const info = highcomAboutInfo({ version: '0.1.5-rc.2', ...fixture() })
    const parsed: unknown = JSON.parse(decodeURIComponent(encodeURIComponent(JSON.stringify(info))))

    expect(parsed).toEqual(info)
  })
})
