/**
 * Highcom Work packaging configuration for the desktop application.
 *
 * This file wraps the upstream configuration so the deployment's identity lives
 * in company-owned paths. The upstream default export is already the evaluated
 * result of `createElectronBuilderConfig()`, and calling that factory a second
 * time would run its signing and notarization side effects twice. Spreading the
 * result keeps the upstream `afterPack`/`afterSign` hooks, which resolve their
 * own relative imports against the upstream module.
 */
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import base from './electron-builder.config.mjs'
import { resolveDesktopTargetBuildPaths } from './scripts/desktop-build-paths.mjs'

const run = promisify(execFile)

export default {
  ...base,
  productName: 'Highcom Work',
  artifactName: 'highcom-work-${version}-${os}-${arch}.${ext}',
  // Electron resolves `app.getName()` from the packaged package.json and prefers
  // `productName`, so without this the branded build keeps the upstream package name
  // and therefore the upstream userData directory. Two consequences: the branded app
  // shares its settings directory with an upstream install, and their single-instance
  // locks collide, so the later launch calls app.quit() and exits 0 without a window.
  extraMetadata: { ...base.extraMetadata, productName: 'Highcom Work' },
  directories: {
    ...base.directories,
    buildResources: 'build-highcom',
  },
  win: {
    ...base.win,
    icon: fileURLToPath(new URL('./build-highcom/icon.png', import.meta.url)),
  },
  // Upstream's scripts/installer.nsh is reached through this deployment's include, which
  // declares INSTALLER_STRINGS_FILE first so the installer's own copy is Highcom Work's.
  // Replacing the include rather than appending is required: NSIS resolves `!define /ifndef`
  // in processing order, so upstream's file must read the symbol as already defined.
  nsis: {
    ...base.nsis,
    include: fileURLToPath(new URL('./build-highcom/installer/installer-highcom.nsh', import.meta.url)),
  },
  // The protocol registration's display name reaches the OS registration and any
  // "open with" prompt; the `dsh` scheme itself stays upstream's.
  protocols: (base.protocols ?? []).map(protocol => ({ ...protocol, name: 'Highcom Work' })),
  // The MIT notice and the aggregated third-party disclosure travel with the
  // application. Every packed dependency already carries its own LICENSE, but the
  // Electron shell is first-party code and the upstream `files` list does not
  // include one, so the shipped shell would otherwise carry no notice at all.
  extraResources: [
    // The packaged `icon.png` is what the native About panel and the update surfaces
    // read; upstream sources it from its own `icon-windows.png`, so replace that entry.
    ...base.extraResources.filter(entry => entry.to !== 'icon.png'),
    { from: fileURLToPath(new URL('./build-highcom/icon.png', import.meta.url)), to: 'icon.png' },
    { from: fileURLToPath(new URL('../../LICENSE', import.meta.url)), to: 'LICENSE' },
    {
      from: fileURLToPath(new URL('../../THIRD_PARTY_NOTICES.md', import.meta.url)),
      to: 'THIRD_PARTY_NOTICES.md',
    },
  ],
  // Upstream's preparation step rasterizes its own brand plates into the target's
  // installer-ui directory. This runs after it, overwriting those five plates with the
  // deployment's art. resolveDesktopTargetBuildPaths is upstream's own path resolver, so
  // renaming or removing that export fails this file loudly at load rather than silently
  // shipping upstream artwork in a branded installer.
  beforeBuild: async context => {
    const result = await base.beforeBuild(context)
    const installerUi = join(resolveDesktopTargetBuildPaths().root, 'installer-ui')
    if (existsSync(installerUi)) {
      await run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
        fileURLToPath(new URL('./build-highcom/installer/prepare-brand-assets.ps1', import.meta.url)),
        '-OutputDirectory', installerUi], { windowsHide: true })
    }
    return result
  },
}
