/** Validate the assembled application, including native Office conversion outside ASAR. */
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { resolveDesktopBuildTarget, resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { readDesktopRuntime, verifyDesktopRuntime } from '../src/runtime-tree.ts'
import { verifyWindowsCode } from './windows-runtime-signature.mjs'
import { smokePreparedRuntime } from './smoke-prepared-runtime.ts'
import { resolveDesktopPackageTarget } from './package-target.ts'

const paths = resolveDesktopTargetBuildPaths()
const { values } = parseArgs({ options: { unsigned: { type: 'boolean', default: false } }, allowPositionals: false })
const target = resolveDesktopBuildTarget()
const windows = target === 'win-x64'
if (values.unsigned && !windows) throw new Error('desktop smoke: unsigned artifacts require Windows')
const artifacts = values.unsigned ? paths.unsignedArtifacts : paths.artifacts
// electron-builder names the assembled application after the product name; a deployment
// packaging environment supplies its own through DSH_CLIENT_TITLE.
const productName = process.env.DSH_CLIENT_TITLE ?? 'DeepSeek Harness'
const application = windows ? join(artifacts, 'win-unpacked')
  : join(artifacts, target === 'mac-arm64' ? 'mac-arm64' : 'mac', `${productName}.app`, 'Contents')
const resources = join(application, windows ? 'resources' : 'Resources')
const executable = windows ? join(application, `${productName}.exe`) : join(application, 'MacOS', productName)
const descriptor = await verifyDesktopRuntime(paths.dsh, readDesktopRuntime(paths.dsh).release.version,
  resolveDesktopPackageTarget(target))
if (windows && !values.unsigned) await verifyWindowsCode(application)
await smokePreparedRuntime(join(resources, 'app.asar', 'dsh'), executable, join(resources, 'runtime'), descriptor)
