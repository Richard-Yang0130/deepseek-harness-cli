<p align="center">
  <img src="docs/assets/terminal.png" alt="deepseek-harness-cli 终端界面" width="920">
</p>

<h1 align="center">deepseek-harness-cli</h1>

<p align="center">
  DeepSeek Harness 的全功能终端界面。<br>
  保留官方 <code>dsh</code> 运行时，用键盘优先的 Agent 交互完成仓库内工作。
</p>

<p align="center">
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/deepseek--harness--cli-0.7.2-4D6BFE?style=flat-square" alt="deepseek-harness-cli 0.7.2"></a>
  <a href="package.json"><img src="https://img.shields.io/badge/Node.js-22.19_%7C_24%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js 22.19 or 24+"></a>
  <a href="https://github.com/deepseek-ai/deepseek-harness"><img src="https://img.shields.io/badge/dsh-0.1.0--rc.6%2B-1F6FEB?style=flat-square" alt="dsh 0.1.0-rc.6+"></a>
  <img src="https://img.shields.io/badge/interface-terminal_TUI-111827?style=flat-square" alt="Terminal TUI">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0F766E?style=flat-square" alt="MIT License"></a>
</p>

<p align="center">
  <a href="#五分钟安装"><strong>快速安装</strong></a>
  ·
  <a href="#核心能力"><strong>核心能力</strong></a>
  ·
  <a href="#日常使用流程"><strong>使用流程</strong></a>
  ·
  <a href="#文档导航"><strong>文档</strong></a>
  ·
  <a href="README.md"><strong>English</strong></a>
</p>

> [!NOTE]
> 顶部截图使用合成演示工作区，不包含真实用户路径、密钥或会话数据。

> [!IMPORTANT]
> 这是独立社区终端项目，不是 DeepSeek 官方发布。它需要官方 [`dsh`](https://github.com/deepseek-ai/deepseek-harness) 运行时，不会替换、复制或修改 `dsh web`。

## deepseek-harness-cli 是什么

`deepseek-harness-cli` 是 DeepSeek Harness 的终端入口。Prompt、会话、工具、审批、结构化提问、模型、预设、命令、Skills、工作区和持久化事件都映射到官方 DSH 服务，不会另造一套 Agent 运行时。

项目由响应式 React 终端渲染器、DSH 适配层和独立 `dsh-cli` profile 组成。交互体验接近 Claude Code，实际执行与数据持久化仍由 Harness 负责。

## 为什么使用终端版

| 需求 | Web 端 | `deepseek-harness-cli` |
| --- | --- | --- |
| 在仓库中工作 | 在浏览器和 Shell 间切换 | 在目标目录直接启动 |
| 发现命令 | 通过页面导航 | 输入 `/` 查看实时命令和 Skill 目录 |
| 引用文件 | 通过页面选择 | 输入 `@` 完成工作区文件补全 |
| 调整运行中任务 | 使用 Web 交互 | 继续发送消息，在下一个支持的边界 steering |
| 处理审批 | 鼠标操作面板 | 键盘优先的审批和问题面板 |
| 观察长任务 | Web 活动视图 | 流式推理、工具卡片、Todos、Agents、Trace、Cost 和上下文状态 |

原有 Web 界面仍然保留。终端版改变的是呈现方式，不改变业务归属。

## 核心能力

| 领域 | 当前支持 |
| --- | --- |
| 终端体验 | 动态鲸鱼顶栏、响应式 inline/fullscreen 布局、流式 Markdown、推理、工具卡片、文本选择、主题和完整终端恢复 |
| 输入与补全 | `/` 命令补全、`@` 文件补全、历史搜索、外部编辑器、剪贴板图片、单词移动、多行输入和运行中 steering |
| 会话 | 新建、恢复、搜索、重命名、回溯分支、compact、导出、持久化标题和旧会话兼容 |
| 模型与预设 | Provider 路由、模型选择、effort/thinking 控制、Agent 预设和内置 `liangshen` 预设 |
| 工具与 Agents | 实时工具输出、审批、结构化提问、Todos、子 Agents、后台任务、MCP 工具和动态 DSH 命令/Skills |
| 工作区 | 工作区选择、相对路径附件、文件提示、会话工作目录和服务不可用时的降级处理 |
| 可观测性 | 活动状态行、Token 成本、上下文压力、TPS、事件轨迹、模型路由、权限模式和状态面板 |
| 跨平台 | macOS、Linux、Windows/ConPTY、非 TTY 纯文本 reporter、CJK 宽度处理、语言和主题配置 |
| 数据归属 | 官方 Harness Agent、Session、Tool、Approval、Question、Command、Skill 和 Workspace 服务仍是唯一事实来源 |

## 五分钟安装

### 环境要求

- Node.js `22.19.x` 或 Node.js `24+`
- Git、npm 和 pnpm 均可在终端中执行
- 官方 `@deepseek-ai/dsh` `0.1.0-rc.6` 或兼容的 `0.1.x` 版本

安装 npm 上已发布的官方 dsh 运行时和社区终端包：

```bash
npm install -g @deepseek-ai/dsh deepseek-harness-cli
```

GitHub 仓库可能会领先于 npm 发布版。如果要使用本 README 展示的 GitHub 当前版本，请构建并链接源码：

```bash
npm install -g @deepseek-ai/dsh
git clone https://github.com/Richard-Yang0130/deepseek-harness-cli.git
cd deepseek-harness-cli
corepack enable pnpm
pnpm install --frozen-lockfile
npm run build
npm link
```

进入希望 DeepSeek 操作的项目目录后启动：

```bash
cd /path/to/project
dsh-cli
```

启动器会检查 `dsh`，创建或迁移独立 `dsh-cli` profile，并在 bootstrap 前为受管 profile 文件保留迁移备份。现有会话、终端偏好和原有 Web profile 不会被删除。

可以直接带任务启动、恢复最近会话、恢复指定会话，或检查安装：

```bash
dsh-cli "运行测试并解释失败原因"
dsh-cli --resume
dsh-cli --resume <session-id>
dsh-cli doctor
```

## 日常使用流程

1. 在仓库目录中启动 `dsh-cli`，或直接传入工作区路径。
2. 输入任务。DeepSeek 工作期间继续发送消息，会将其 steering 到当前轮。
3. 输入 `/` 浏览本地操作、Harness 命令、工作流和用户可调用 Skills。
4. 输入 `@` 补全工作区文件，需要时从剪贴板或文件系统附加图片。
5. 不离开终端即可回答审批和结构化问题。
6. 使用 `/resume`、`/rewind`、`/rename` 和 `/compact` 管理持久化会话。
7. 长任务期间可查看 `/cost`、`/status`、`/trace`、Agents、Todos、工具卡片和上下文压力。

### 常用按键

| 按键 | 操作 |
| --- | --- |
| Enter | 发送输入；运行期间 steering 当前轮 |
| `/` | 在输入框下方打开命令菜单 |
| `@` | 打开工作区文件补全 |
| ↑ / ↓ | 在补全项和选择器中移动 |
| Esc | 关闭当前选择器或面板 |
| Ctrl+C | 取消当前轮；空闲时再按一次退出 |
| Shift+Tab | 轮换当前配置的会话模式 |
| Ctrl+O | 切换详细推理和工具输出 |
| Ctrl+T | 打开事件轨迹 |

## 命令

实时 `/` 菜单是最终权威目录。本地命令优先处理同名冲突，其他条目来自当前 DSH 命令和 Skill 注册表。

| 用途 | 命令 |
| --- | --- |
| 对话 | `/new`、`/resume`、`/rewind`、`/rename`、`/compact`、`/export` |
| 运行时 | `/model`、`/effort`、`/thinking`、`/preset`、`/provider` |
| 工作区 | `/workspace`、`/permissions`、`/config`、`/doctor` |
| 扩展 | `/mcp`、`/hooks`、`/memory`、`/agents` |
| 呈现 | `/theme`、`/lang`、`/activity`、`/status`、`/cost`、`/trace` |
| Provider 访问 | `/login`、`/logout` |

兼容别名 `/sessions`、`/models`、`/presets`、`/stats` 和 `/subagents` 会路由到对应的标准实现。`/permission`、`/plan`、`/goal` 等 Harness 原生命令和插件工作流会动态透传。

完整参数和行为说明见 [命令参考](docs/commands.md)。

## Harness 与 Web 能力对应

| 能力 | 终端呈现 | 事实来源 |
| --- | --- | --- |
| Prompt、steer、cancel | 输入框、Enter、Ctrl+C | Harness Agent |
| 流式文本与推理 | 对话记录 | 持久化会话事件 |
| 工具 | 实时卡片和展开输出 | 工具注册表和会话事件 |
| 会话 | `/new`、`/resume`、`/rewind`、`/rename` | DSH 持久化 |
| 模型与预设 | `/model`、`/preset`、`/effort` | Scoped DSH 服务 |
| 命令与 Skills | `/` 补全 | Command 与 Skill 注册表 |
| 审批与提问 | 键盘面板 | 官方 Approval/Question 服务 |
| 工作区与文件 | `/workspace`、`@` 补全 | Workspace 注册表和文件系统策略 |
| Goal、Plan、Permission | 动态命令和状态面板 | 持久化事件和注册处理器 |

本项目不复制 Web 业务逻辑，也不创建影子会话存储。CLI 负责终端呈现，官方 Harness 服务负责实际工作。

## 配置、插件与 MCP

| 约定 | 值 |
| --- | --- |
| 包名 | `deepseek-harness-cli` |
| 命令与 profile | `dsh-cli` |
| 终端偏好 | `~/.dsh-cli` |
| DSH profile | `$DSH_HOME/profiles/dsh-cli` 或 `~/.dsh/profiles/dsh-cli` |
| 环境变量前缀 | `DSH_CLI_` |

profile 是 Cordis 组合。兼容的 DSH 插件会自动向 `/` 贡献命令，MCP 工具使用官方 Harness 工具注册表。MCP 密钥应放在环境变量中，不要把明文密钥提交到 `cordis.patch.yml`。

修改 profile 前请阅读 [配置](docs/configuration.md)、[插件与 MCP](docs/plugins.md) 和 [主题](docs/themes.md)。

## 安全与数据边界

- 终端使用 DSH 当前选中的权限模式执行工具。请认真复核审批面板，并为工作区选择权限最小的合适预设。
- Provider 凭据由官方服务管理，终端 UI 不会回显密钥。
- 会话日志保存在 DSH 持久化中，终端专属偏好保存在 `~/.dsh-cli`。
- profile 迁移会在 bootstrap 前创建受管备份，不会删除用户会话或偏好。
- 本地或 stdio MCP Server 是 Agent 沙箱外的受信任进程，启用前应审核其来源。
- 不要在公开 Issue 中发布密钥、私密会话日志或本地文件系统信息。安全漏洞请通过 GitHub 私密安全公告报告。

## 架构

```text
dsh-cli launcher
  -> 独立 dsh profile（Cordis 组合）
    -> 官方 Harness 服务与持久化会话事件
      -> DSH adapter / Channel
        -> React 终端屏幕与组件
          -> 终端渲染、输入、选择、布局与清理
```

适配器边界让终端机制可以迭代，同时不需要 fork Harness 领域服务。详见 [架构说明](docs/architecture.md) 和 [交互模型](docs/interaction.md)。

## 文档导航

| 文档 | 内容 |
| --- | --- |
| [快速上手](docs/getting-started.md) | 启动、profile bootstrap、会话恢复和路径 |
| [命令参考](docs/commands.md) | 标准命令、兼容别名和动态条目 |
| [能力映射](docs/capability-matrix.md) | 终端呈现与 Harness 业务归属 |
| [配置](docs/configuration.md) | 偏好、环境变量与 profile 约定 |
| [插件与 MCP](docs/plugins.md) | Cordis 插件、MCP 设置和凭据指南 |
| [主题](docs/themes.md) | 内置与自定义终端主题 |
| [故障排查](docs/troubleshooting.md) | 安装、渲染、profile 与运行时问题 |
| [更新日志](CHANGELOG.md) | 发布历史与当前版本 |

## 更新与卸载

源码安装方式可通过更新仓库并重新构建来升级：

```bash
git pull --ff-only
pnpm install --frozen-lockfile
npm run build
npm link
```

卸载全局命令：

```bash
npm uninstall -g deepseek-harness-cli
```

独立 DSH profile 和 `~/.dsh-cli` 偏好会保留，便于以后重新安装；只有用户主动清理时才会删除。

## 项目性质

这是独立社区终端项目，遵循官方 DSH 公开服务合约，原有 Web 界面保持不变。

欢迎提交聚焦的改进。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，普通问题通过 [GitHub Issues](https://github.com/Richard-Yang0130/deepseek-harness-cli/issues) 反馈，安全问题按 [SECURITY.md](SECURITY.md) 私密报告。

## 许可证

[MIT](LICENSE)
