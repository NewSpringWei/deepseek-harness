/** Stage local-branded DSH packages for unsigned Desktop builds without a publication record. */

import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import {
  readClientBuildRecord,
  repositoryClientBuildEnvironment,
  resolveClientBuildEnvironment,
} from '../../../scripts/client-build-environment.ts'
import { releaseFamily } from '../../../scripts/release/families.ts'
import { packFamilyMembers, parsePackConcurrency } from '../../../scripts/release/pack.ts'

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { out: { type: 'string' }, concurrency: { type: 'string' } },
    allowPositionals: false,
  })
  if (values.out === undefined) throw new Error('desktop local pack: --out must name the package staging directory')
  const concurrency = parsePackConcurrency(values.concurrency)
  const root = process.cwd()
  // Upstream asserts the named local profile (which recomputes and discards inherited values).
  // Company client profiles are injected as a complete DSH_CLIENT_* set by the packaging entry
  // and are not expressible in resolveClientBuildEnvironment, so those skip the environment
  // assertion and rely on the artifact digest.
  const profile = repositoryClientBuildEnvironment(root).DSH_CLIENT_BUILD_PROFILE
  const expected = profile === undefined || profile === 'local' || profile === 'official'
    ? resolveClientBuildEnvironment(repositoryClientBuildEnvironment(root), profile ?? 'local')
    : undefined
  readClientBuildRecord(root, expected)
  const destination = resolve(root, values.out)
  const packed = await packFamilyMembers(root, releaseFamily('dsh'), destination, concurrency)
  console.log(`desktop local pack: ${String(packed.length)} tarball(s) in ${destination}`)
}

await main()
