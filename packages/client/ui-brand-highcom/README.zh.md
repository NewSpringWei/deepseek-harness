---
description: "Highcom Work 品牌占用者，填充 Web 客户端的侧栏与空白会话首屏品牌 slot；供替换官方品牌呈现的部署阅读。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-brand-highcom

[English](README.md) | 中文

## 概述

本包让 Highcom Work 客户端构建在侧栏显示本部署的标志与名称，并在空白会话首屏显示本部署的标志。它在除 `official` 以外的每个客户端构建档位下注册；`official` 档位下由官方占用者包占据同一组 single slot，两个包在构造上互斥。身份为 Highcom Work 的部署应选择本包。本包不保留运行时状态，也不影响模型请求。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在身份为 Highcom Work 的部署中把本插件挂进浏览器插件名单，然后用 `official` 以外的任意档位构建客户端——打包的桌面端会设置 `DSH_CLIENT_BUILD_PROFILE=highcom`。

### 档位的选择

`DSH_CLIENT_BUILD_PROFILE` 决定渲染哪套品牌，而两个占用者包以相反的方向读它。`@deepseek-ai/dsh-client-ui-brand-official` 只在取值恰为 `official` 时注册；本包在其余所有取值下注册，包括未设置的情况。侧栏 slot 是 `single`，因此两组注册永不可能同时安装；两者都未触达的构建显示外壳回退——鱼形标志与本地构建标签——而不是没人选过的身份。文档标题是另一回事：它来自构建期的 `DSH_CLIENT_TITLE`，本包无法设置它。

### 替换品牌

第三方身份的部署应同时不组合这两个占用者包，改为组合自己的包来占据同样三个 slot。占据 slot 是唯一的组合路径；这里不存在任何品牌配置面。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部细节——点击展开</summary>

占用者作为两组声明感知的注册安装：嵌套的 `ctx.slots.inject()` 调用等待侧栏的标志与名称，另有一个独立的注入等待首屏标志。每组都无论本行在声明者之前还是之后激活都能工作；声明消失时整组撤回，HMR 期间也不会留下残缺的品牌混合。分成两组是因为：侧栏外壳的品牌 slot 在应用生命周期内只声明一次，而首屏标志声明在 `main.conversation` 之下，会随会话反复重建——合为一组会让稳定的侧栏占用者在每次变动时被整体拆掉。每个占用者都注册在默认等级之下，因此已存在的占用者会被替换，而不是报成冲突。浏览器半部是 [`src/client/index.ts`](src/client/index.ts)；node 半部是一个空 Loader 座位。

标志是一张以 data URI 承载的 256x256 PNG，位于 [`src/client/mark.ts`](src/client/mark.ts)。客户端打包链会编译 CSS，但不加载任何位图资源，而加载器每个插件只提供一个产物（`lib/client.js`），所以同级的图片文件没有通往浏览器的路由。素材的事实源是 `apps/desktop/build-highcom/icon.png`，它同时就是打包后的应用图标。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

当品牌面不够用时阅读以下页面。它们从本包占据的 slot 进入渲染这些 slot 的外壳。

- [ui-sidebar](../ui-sidebar/README.zh.md) — 声明 `sidebar.brand.mark` 与 `sidebar.brand.name` 并渲染其回退。
- [ui-conversation](../ui-conversation/README.zh.md) — 在首屏中声明 `conversation.hero.brand.mark`。
- [ui-brand-official](../ui-brand-official/README.zh.md) — 与本包互斥的同类占用者集。
- [Web 客户端架构](../../../.agents/notes/implemented/architecture/2026-07-19-gui-web-client-architecture.zh.md) — 浏览器插件行如何加载与注册 slot。

-----

<a id="model-experience"></a>
## 模型体验

无：本包只贡献浏览器呈现，此处没有任何东西到达模型请求。

#### KV 缓存影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

这些限制界定了本部署的品牌呈现如何供给。它们是当前包约束，不是品牌设计对比或任务积压。

- **标志是位图** —— 素材以 PNG data URI 形式发布，因此它不随主题墨色变化，其字节也留在 `lib/client.js` 里。矢量标志可同时消除这两项代价。
- **名称用外壳字体** —— 名称的字体、字号、字重与基线由侧栏拥有，因此本包只贡献字符串本身，随部署的客户端构建继承当时渲染的字体。要做字标需要外部提供轮廓素材。
- **名称不翻译** —— [`src/client/locale.ts`](src/client/locale.ts) 以专有名词而非多语言表的形式拥有该字符串。
- **文档标题独立** —— `DSH_CLIENT_TITLE` 在构建期选择标题文本，而非通过 UI slot，因此它必须被设为与本包字典相同的产品名。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>给维护者的工作上下文——点击展开</summary>

`src/client/mark.ts` 由应用图标生成；请修改图标后重新生成，不要直接编辑该常量。

</details>

**运行时不变式：** 未发布配套包。本包不保留可变状态，其三个 slot 占用者通过一个事务化 effect 安装与撤离。
