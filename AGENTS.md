# AGENT 指南

## 开发环境技巧
- 运行 `pnpm install` 安装依赖；pnpm 管理整个工作区。
- 使用 `pnpm dlx turbo run where <project_name>` 快速定位到目标包目录。
- 若本地工具缺少包依赖，运行 `pnpm install --filter <project_name>` 将其装入工作区。
- 核实包名以对应正确目录：查看各包内的 `package.json` 中的 `name` 字段，而非仓库根目录的配置。
- 默认脚本（`build`、`lint`、`test`、`typecheck` 等）会由 Turborepo 统一调度；本地开发文档仍使用 `pnpm docs:dev`。

## Turborepo 工作流
- 管线配置位于 `turbo.json`，缓存 `dist/**`、`doc_build/**` 等产物以加速重复构建。
- 通过 `pnpm turbo run <task>` 调用 Turborepo，可结合 `--filter`（如 `@internationalized/number-format`）按需执行。
- 保持包内脚本命名一致，确保 `turbo run` 能拾取并推导依赖顺序。
- 需要远程缓存时，在环境变量中配置 `TURBO_TOKEN` 与 `TURBO_TEAM`。

## 测试说明
- CI 配置位于 `.github/workflows`，可参考流水线了解必跑任务。
- 执行 `pnpm turbo run test --filter <project_name>` 触发指定包的全部测试相关任务。
- 在包根目录直接运行 `pnpm test` 也能启动该包的 Vitest 测试。
- 聚焦单个用例时使用 `pnpm vitest run -t "<test name>"`。
- 若移动文件或改动类型，请运行 `pnpm lint --filter <project_name>` 确认 ESLint、TS 检查通过。
- 覆盖率场景使用 `pnpm turbo run test:coverage --filter <project_name>`，并修复所有报错直至测试全绿。
- 修改业务逻辑时务必补充或更新对应测试。

## 文档 & 发布
- `pnpm docs:dev`：本地调试 Rspress 文档。
- `pnpm turbo run docs:build`：在 Turborepo 流水线上构建文档并输出 `doc_build/`。
- `pnpm turbo run build --filter <project_name>`：验证单包构建链路，可在发布前确保依赖已准备好。

## PR 提交流程
- PR 标题格式为 `[<project_name>] <Title>`。
- 提交前至少运行 `pnpm lint` 与 `pnpm test`，确保与 CI 要求一致。
