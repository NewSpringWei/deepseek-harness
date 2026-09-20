---
description: "Highcom Work brand occupants for the Web client's sidebar and conversation-hero slots; for deployments that replace the official brand presentation."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-brand-highcom

English | [中文](README.zh.md)

## Summary

This package gives a Highcom Work client build the deployment's mark and name in the sidebar, and the deployment's mark on the blank-session hero. It registers under every client build profile except `official`, where the official occupant package claims the same single slots; the two packages are mutually exclusive by construction. Choose it for deployments branded Highcom Work. The package keeps no runtime state and does not affect model requests.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount this plugin in the browser roster of a deployment whose identity is Highcom Work, then build the client with any profile other than `official` — the packaged desktop build sets `DSH_CLIENT_BUILD_PROFILE=highcom`.

### Choosing the profile

`DSH_CLIENT_BUILD_PROFILE` selects which brand renders, and the two occupant packages read it in opposite directions. `@deepseek-ai/dsh-client-ui-brand-official` registers only when the value is exactly `official`; this package registers for every other value, including an unset one. The sidebar slots are `single`, so the two sets can never both install, and a build that reaches neither shows the shell fallbacks — the fish mark and the local-build label — rather than an identity nobody chose. The document title is separate: it comes from the build-time `DSH_CLIENT_TITLE`, and this package cannot set it.

### Replacing the brand

A deployment with a third identity leaves both occupant packages out and composes its own package over the same three slots. Occupying a slot is the only composition route; there is no brand configuration surface here.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The occupants install as two declaration-aware sets: nested `ctx.slots.inject()` calls wait on the sidebar's mark and name, and a separate injection waits on the hero mark. Each set works whether this row activates before or after its declarer, withdraws whole when that declaration collapses, and leaves no partial brand mix during HMR. They are separate because the sidebar shell declares its brand slots once for the application's lifetime, while the hero mark is declared under `main.conversation`, which re-registers per session — one shared set would tear the stable sidebar occupants down on every one of those changes. Each occupant registers below the default rank, so an occupant that is already there is replaced instead of reported as a conflict. The browser half is [`src/client/index.ts`](src/client/index.ts); the node half is an empty Loader seat.

The mark is a 256x256 PNG carried as a data URI in [`src/client/mark.ts`](src/client/mark.ts). The Client bundle pipeline compiles CSS but loads no raster assets, and the loader serves one artifact per plugin (`lib/client.js`), so a sibling image file would have no route to the browser. The artwork's source of truth is `apps/desktop/build-highcom/icon.png`, which is also the packaged application icon.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the brand surface is not enough. They move from the slots this package occupies to the shell that renders them.

- [ui-sidebar](../ui-sidebar/README.md) — declares `sidebar.brand.mark` and `sidebar.brand.name` and renders their fallbacks.
- [ui-conversation](../ui-conversation/README.md) — declares `conversation.hero.brand.mark` in the hero.
- [ui-brand-official](../ui-brand-official/README.md) — the sibling occupant set this package is mutually exclusive with.
- [Web client architecture](../../../.agents/notes/implemented/architecture/2026-07-19-gui-web-client-architecture.md) — how browser plugin rows load and register slots.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package contributes browser presentation only; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define how this deployment's brand presentation is supplied. They are current package constraints, not a brand-design comparison or a task backlog.

- **The mark is a raster** — the artwork ships as a PNG data URI, so it does not follow the theme's ink colour and its bytes sit in `lib/client.js`. A vector mark would remove both costs.
- **The name is shell type** — the sidebar owns the name's typeface, size, weight, and baseline, so this package contributes the string alone and inherits whatever the deployment's client build renders. A wordmark would need the artwork supplied as outlines.
- **The name is not translated** — [`src/client/locale.ts`](src/client/locale.ts) owns the string as a proper noun rather than a per-language table.
- **The document title is independent** — `DSH_CLIENT_TITLE` selects title text at build time rather than through a UI slot, so it must be set to the same product name as this package's dictionary.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

`src/client/mark.ts` is generated from the application icon; edit the icon and regenerate rather than editing the constant.

</details>

**Runtime invariant:** No companion is published. The package retains no mutable state, and its three slot occupants install and leave through one transactional effect.
