# PagePilot 三层架构技术设计文档

> **版本**: v1.0  
> **日期**: 2026-07-20  
> **作者**: 后端开发  
> **状态**: MVP 初始设计

---

## 一、架构总览

PagePilot 采用三层架构，实现框架与业务的完全解耦：

```
┌─────────────────────────────────────────────────────────┐
│                    宿主应用层 (Host)                      │
│   健康体检管理后台 / 其他后台系统（独立部署，PagePilot 不感知）  │
└────────────────────────────┬────────────────────────────┘
                             │ 嵌入 (script / iframe / npm)
┌────────────────────────────▼────────────────────────────┐
│                  PagePilot 框架层 (Core)                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  │ 交互 │ │ 理解 │ │ 执行 │ │ 反馈 │ │ 任务 │ │ 安全 │ │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
└────────────────────────────┬────────────────────────────┘
                             │ 加载配置
┌────────────────────────────▼────────────────────────────┐
│                  SitePack 配置层 (Config)                 │
│   系统说明 / 标准流程 / 产品入口 / 页面声明 / 风险规则       │
└─────────────────────────────────────────────────────────┘
```

**核心原则**：
1. 框架层不包含任何业务硬编码
2. 所有业务知识通过 SitePack 配置注入
3. 替换 SitePack 即可适配不同后台系统

---

## 二、框架层模块划分

### 2.1 交互模块 (Interaction)

**职责**：管理用户与 PagePilot 助手的交互界面。

| 组件 | 功能 | MVP 优先级 |
|------|------|-----------|
| FloatingEntry | 右下角悬浮入口，唤起/收起助手面板 | Must |
| ChatPanel | 对话界面，支持多轮上下文 | Must |
| TaskPanel | 任务面板，展示目标、步骤进度、结果 | Must |
| ConfirmDialog | 操作确认对话框（「帮我操作」按钮） | Must |

**接口定义**：
```typescript
interface InteractionModule {
  mount(container: HTMLElement): void
  unmount(): void
  showMessage(msg: AssistantMessage): void
  showPlan(plan: OperationPlan): void
  requestConfirmation(plan: OperationPlan): Promise<boolean>
  showResult(result: TaskResult): void
}
```

### 2.2 理解模块 (Understanding)

**职责**：识别当前页面元素，理解页面结构和状态。

| 能力 | 说明 | MVP 优先级 |
|------|------|-----------|
| 识别菜单、按钮、链接 | 扫描 DOM 中的可交互元素 | Must |
| 识别输入框、下拉框、日期选择器 | 识别表单控件及必填标记 | Must |
| 识别表格字段、分页、状态标签 | 读取数据表格结构 | Must |
| 识别弹窗（Modal/Drawer） | 检测覆盖层及其内表单 | Must |
| 每次操作前重新理解 | 页面变化后刷新理解 | Must |

**接口定义**：
```typescript
interface UnderstandingModule {
  analyzePage(): PageSnapshot
  findElement(selector: ElementSelector): ElementInfo | null
  getTableData(tableSelector: string): TableData
  detectOverlay(): OverlayInfo | null
}

interface PageSnapshot {
  url: string
  title: string
  navItems: NavItem[]
  buttons: ButtonInfo[]
  forms: FormInfo[]
  tables: TableInfo[]
  overlays: OverlayInfo[]
}
```

### 2.3 执行模块 (Execution)

**职责**：在页面上执行原子操作。

| 操作 | 说明 | MVP 优先级 |
|------|------|-----------|
| click | 点击菜单、按钮、链接 | Must |
| fill | 填写文本输入框 | Must |
| select | 选择下拉框、日期选择器 | Must |
| navigate | 跳转到指定页面 | Must |
| observe | 查看页面状态（等待加载） | Must |
| multiStep | 多步连续执行 | Must |

**接口定义**：
```typescript
interface ExecutionModule {
  execute(action: AtomicAction): Promise<ActionResult>
  executePlan(plan: OperationPlan, onStep: StepCallback): Promise<PlanResult>
}

type AtomicAction =
  | { type: 'click'; selector: string }
  | { type: 'fill'; selector: string; value: string }
  | { type: 'select'; selector: string; value: string }
  | { type: 'navigate'; url: string }
  | { type: 'observe'; timeout?: number }
```

### 2.4 反馈模块 (Feedback)

**职责**：向用户展示操作过程的视觉反馈。

| 反馈类型 | 说明 | MVP 优先级 |
|----------|------|-----------|
| 元素高亮 | 当前操作目标蓝色轮廓 | Must |
| 状态说明 | 当前步骤描述文字 | Must |
| 虚拟光标 | 模拟鼠标移动 | Should |
| 屏幕光环 | 操作进行中的整体感知 | Should |

**接口定义**：
```typescript
interface FeedbackModule {
  highlight(selector: string): void
  clearHighlight(): void
  showStatus(text: string): void
  hideStatus(): void
}
```

### 2.5 任务模块 (Task)

**职责**：管理任务生命周期。

**状态机**：
```
idle → understanding → planning → confirming → executing → completed
                                                       ↘ failed → recovery
```

| 能力 | 说明 | MVP 优先级 |
|------|------|-----------|
| 任务生命周期管理 | 目标→规划→确认→执行→完成/失败 | Must |
| 缺少信息追问 | 检测必填参数缺失，向用户追问 | Must |
| 失败恢复 | 重试/放弃路径 | Must |
| 重新规划 | 根据最新页面状态调整计划 | Should |

**接口定义**：
```typescript
interface TaskModule {
  createTask(goal: string): Task
  planTask(task: Task, sitePack: SitePack): OperationPlan
  executeTask(task: Task, plan: OperationPlan): Promise<TaskResult>
  recoverTask(task: Task, error: ExecutionError): RecoveryOption[]
}
```

### 2.6 安全模块 (Security)

**职责**：根据风险策略控制操作执行。

| 风险等级 | 处理方式 | 示例 |
|----------|----------|------|
| 低 | 直接执行 | 筛选、查看 |
| 中 | 展示计划后确认 | 新建任务、生成名单 |
| 高 | 禁止自动执行 | 删除、覆盖、批量通知 |

**接口定义**：
```typescript
interface SecurityModule {
  assessRisk(action: AtomicAction, sitePack: SitePack): RiskLevel
  requireConfirmation(action: AtomicAction): boolean
  isBlocked(action: AtomicAction): boolean
}

type RiskLevel = 'low' | 'medium' | 'high'
```

---

## 三、SitePack 加载机制

### 3.1 加载流程

```
框架启动 → 检测当前域名/路径 → 匹配 SitePack 注册表 → 加载配置 → 初始化模块
```

### 3.2 注册方式

```typescript
// 方式一：静态导入（MVP 推荐）
import healthExamSitePack from '@sitepack/instances/health-exam-admin/sitepack.json'
PagePilot.registerSitePack(healthExamSitePack)

// 方式二：远程加载（后续迭代）
PagePilot.loadSitePack('https://config.example.com/sitepacks/health-exam.json')
```

### 3.3 匹配规则

SitePack 通过 `match` 字段声明适用的宿主应用：
- `domain`: 域名匹配
- `pathPrefix`: 路径前缀匹配
- `metaTag`: 页面 meta 标签匹配（MVP 推荐）

---

## 四、宿主嵌入方式

### 4.1 MVP 嵌入方式：同应用集成

MVP 阶段，PagePilot 作为 React 组件直接集成在宿主应用中：

```tsx
import { PagePilotProvider, PagePilotAssistant } from '@pagepilot/core'
import sitePack from '@sitepack/instances/health-exam-admin/sitepack.json'

function App() {
  return (
    <PagePilotProvider sitePack={sitePack}>
      <HostApp />
      <PagePilotAssistant />
    </PagePilotProvider>
  )
}
```

### 4.2 后续嵌入方式（预留）

| 方式 | 适用场景 | 说明 |
|------|----------|------|
| Script 标签 | 传统多页应用 | `<script src="pagepilot.js" data-sitepack="...">` |
| iframe | 跨域隔离 | 独立部署，通过 postMessage 通信 |
| npm 包 | React/Vue 应用 | 组件化集成 |
| 浏览器扩展 | 通用场景 | Chrome Extension 注入 |

---

## 五、目录结构

```
pagepilot/
├── src/
│   ├── pagepilot/           # 框架层
│   │   ├── core/            # 核心引擎（初始化、模块注册、生命周期）
│   │   │   ├── PagePilot.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── modules/         # 六大功能模块
│   │       ├── interaction/
│   │       ├── understanding/
│   │       ├── execution/
│   │       ├── feedback/
│   │       ├── task/
│   │       └── security/
│   ├── host-app/            # 模拟宿主应用
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── components/
│   │   └── data/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
├── sitepack/
│   ├── schema/              # SitePack JSON Schema
│   │   └── sitepack.schema.json
│   └── instances/           # SitePack 实例
│       └── health-exam-admin/
│           └── sitepack.json
├── docs/                    # 技术文档
├── tests/                   # 测试
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 六、技术选型

| 领域 | 选择 | 理由 |
|------|------|------|
| 框架 | React 18 + TypeScript | 设计参考系统推荐栈，组件化能力强 |
| 构建 | Vite 5 | 快速 HMR，ESM 原生支持 |
| 路由 | React Router 6 | 标准路由方案 |
| 状态管理 | Zustand | 轻量，适合模块间通信 |
| 样式 | CSS（设计令牌） | 直接复用设计系统 token |
| Schema 校验 | Ajv | JSON Schema 标准校验库 |
| 测试 | Vitest | 与 Vite 生态一致 |

---

## 七、MVP 数据流

```
用户输入自然语言
    ↓
[交互模块] 接收消息，传递给任务模块
    ↓
[任务模块] 创建任务，调用理解模块获取页面快照
    ↓
[理解模块] 分析当前页面，返回 PageSnapshot
    ↓
[任务模块] 结合 SitePack 标准流程，生成 OperationPlan
    ↓
[交互模块] 展示计划，请求用户确认
    ↓
[安全模块] 评估每步操作风险等级
    ↓
[任务模块] 用户确认后，逐步调用执行模块
    ↓
[执行模块] 执行原子操作 → [反馈模块] 高亮 + 状态说明
    ↓
[理解模块] 每步操作后重新理解页面
    ↓
[任务模块] 全部完成 → [交互模块] 反馈结果（业务语言）
```
