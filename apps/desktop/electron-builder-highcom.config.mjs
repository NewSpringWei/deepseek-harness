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
import { fileURLToPath } from 'node:url'
import base from './electron-builder.config.mjs'

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
  // The MIT notice and the aggregated third-party disclosure travel with the
  // application. Every packed dependency already carries its own LICENSE, but the
  // Electron shell is first-party code and the upstream `files` list does not
  // include one, so the shipped shell would otherwise carry no notice at all.
  extraResources: [
    ...base.extraResources,
    { from: fileURLToPath(new URL('../../LICENSE', import.meta.url)), to: 'LICENSE' },
    {
      from: fileURLToPath(new URL('../../THIRD_PARTY_NOTICES.md', import.meta.url)),
      to: 'THIRD_PARTY_NOTICES.md',
    },
  ],
}
