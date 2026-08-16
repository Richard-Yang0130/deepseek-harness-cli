# DeepSeek Harness CLI

`deepseek-harness-cli` 是 DeepSeek Harness 的完整终端界面。它把官方 Harness Agent 运行时与响应式 Ink UI 结合起来：动态鲸鱼页头、流式回答与工具卡片、持久会话、审批、结构化提问、命令补全、主题，以及行内/全屏两种布局。

![DeepSeek Harness CLI 终端界面](docs/assets/terminal.png)

## 安装

需要 Node.js 22.19 或更高版本、npm 和 pnpm（可执行 `corepack enable pnpm`）。

```bash
npm install -g @deepseek-ai/dsh deepseek-harness-cli
```

在项目目录中启动：

```bash
dsh-cli
dsh-cli "检查这个仓库"
dsh-cli --resume
dsh-cli doctor
```

首次启动会创建隔离的 `dsh-cli` profile，并安装与启动器版本一致的包。受管 profile 迁移前会先备份；程序不会自动删除原 profile、会话或偏好数据。

## 终端体验

- DeepSeek 动态鲸鱼与 `DSH CLI` 标识，窄终端会自动降级为紧凑布局。
- 流式助手文本、可选思考过程、实时工具卡片、活动计时、token/上下文压力与 TPS 状态。
- `/` 命令菜单与子命令补全；`@` 文件补全与粘贴图片。
- 持久会话恢复、重命名、回退、导出、历史搜索与工作区切换。
- 键盘审批与结构化问题面板，遵循 Harness 的失败关闭权限语义。
- 剪贴板复制、全屏鼠标选择、保留普通终端回滚的行内模式，以及 CJK 宽字符布局。
- 浅色、深色、ANSI 和用户自定义主题。
- stdin 或 stdout 不是 TTY 时，自动切换为无 ANSI 的纯文本输出。

DSH 命令注册表始终是真实能力来源。当前 profile 提供的 `/permission`、`/plan`、`/goal` 等命令会动态出现，并原样接收参数。

## 常用操作

| 输入 | 作用 |
|---|---|
| Enter | 发送提示；当前轮运行时，在下一个 step 边界转向 |
| Ctrl+C | 取消当前轮；空闲时再按退出 |
| `/` | 打开命令补全 |
| `@` | 补全工作区文件 |
| Shift+Tab | 在已配置的会话模式中切换 |
| Ctrl+O | 切换详细思考/工具输出 |
| Ctrl+T | 切换轨迹面板 |
| Esc | 关闭当前选择器或决策面板 |

常用命令包括 `/new`、`/resume`、`/rewind`、`/rename`、`/export`、`/workspace`、`/model`、`/preset`、`/theme`、`/lang`、`/provider`、`/permissions`、`/mcp`、`/agents`、`/cost`、`/doctor` 和 `/help`。

兼容别名在唯一命令分发边界转换，不复制功能实现：

| 旧命令 | 当前命令 |
|---|---|
| `/sessions` | `/resume` |
| `/models` | `/model` |
| `/presets` | `/preset` |
| `/stats` | `/cost` |
| `/subagents` | `/agents` |

## 运行时约定

- npm 包：`deepseek-harness-cli`
- 命令：`dsh-cli`
- DSH profile：`dsh-cli`
- 偏好目录：`~/.dsh-cli`
- 环境变量前缀：`DSH_CLI_`
- profile patch：`~/.dsh/profiles/dsh-cli/cordis.patch.yml`（或 `$DSH_HOME/profiles/dsh-cli/cordis.patch.yml`）

常用环境变量：

```bash
export DSH_CLI_LANG=zh
export DSH_CLI_THEME=dark
export DSH_CLI_WORKSPACE_TARGET=/path/to/project
```

启动器会以只读方式兼容迁移前的偏好目录和已改名环境变量，但所有新写入都使用上述约定。

## 配置与扩展

profile 是基于官方 DSH 服务的 Cordis 组合。可在 profile patch 中添加 MCP 客户端或其他兼容插件，修改后重启 `dsh-cli`。密钥应通过环境变量引用，不要直接写入 YAML。

延伸阅读：

- [快速上手](docs/getting-started.md)
- [配置](docs/configuration.md)
- [交互模型](docs/interaction.md)
- [命令参考](docs/commands.md)
- [主题](docs/themes.md)
- [插件与 MCP](docs/plugins.md)
- [架构](docs/architecture.md)
- [故障排查](docs/troubleshooting.md)

## 更新与卸载

可在已安装 profile 中执行 `/update`，或更新全局包：

```bash
npm install -g @deepseek-ai/dsh@latest deepseek-harness-cli@latest
npm uninstall -g deepseek-harness-cli
```

卸载包不会删除 `~/.dsh-cli` 或 `$DSH_HOME/profiles/dsh-cli`。

## 项目定位

这是独立社区终端界面，不是 DeepSeek 官方发布。项目使用 DeepSeek Harness 的公开服务契约，并以 MIT 许可证发布。
