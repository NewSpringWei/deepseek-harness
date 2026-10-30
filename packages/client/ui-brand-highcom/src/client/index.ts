/** Highcom Work occupants for the generic browser-brand slots. */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { HighcomBrandMark, HighcomBrandName, HighcomHeroBrandMark } from './Brand.tsx'

/** Required service: the UI slot registry. */
export const inject = ['slots']

/**
 * Registration rank for every occupant this package installs.
 *
 * These slots are `single`, and a second registration at the occupant's own
 * rank throws; a lower rank replaces it instead, leaving the earlier
 * registration alive but unrendered. The official occupant's profile gate is a
 * build-time constant, so a bundle built under the `official` profile keeps
 * registering unconditionally — without a lower rank, a workspace carrying one
 * such stale bundle fails this whole occupant set.
 */
const REPLACEMENT_PRIORITY = -1

/**
 * Fill the sidebar mark, the sidebar name, and the conversation hero mark.
 *
 * The sidebar pair and the hero mark install as two independent declaration-aware
 * sets. The sidebar shell declares its brand slots once for the application's
 * lifetime, while the hero mark is declared under `main.conversation`, which
 * re-registers per session — one shared set would tear the stable sidebar
 * occupants down on every one of those changes and re-register them.
 *
 * The gate inverts the official occupant package's gate: the official set claims
 * the slots only under the `official` profile, this one claims them under every
 * other value. A build that reaches neither shows the shell fallbacks instead of
 * an identity nobody chose.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  if (process.env.DSH_CLIENT_BUILD_PROFILE === 'official') return
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', function* () {
      yield ctx.slots.register(
        { name: 'sidebar.brand.mark', priority: REPLACEMENT_PRIORITY },
        HighcomBrandMark,
      )
      yield ctx.slots.register(
        { name: 'sidebar.brand.name', priority: REPLACEMENT_PRIORITY },
        HighcomBrandName,
      )
    }))
  ctx.slots.inject('conversation.hero.brand.mark', () =>
    ctx.slots.register(
      { name: 'conversation.hero.brand.mark', priority: REPLACEMENT_PRIORITY },
      HighcomHeroBrandMark,
    ))
}
