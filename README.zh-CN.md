# Apple Reminders MCP Server ![Version 1.0.1](https://img.shields.io/badge/version-1.0.1-blue) ![License: MIT](https://img.shields.io/badge/license-MIT-green)

[![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

English | [简体中文](README.zh-CN.md)

一个为 macOS 提供原生 Apple Reminders 集成的 Model Context Protocol (MCP) 服务器。该服务器允许你通过标准化接口与 Apple Reminders 进行交互，具有全面的管理功能。

[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/fradser-mcp-server-apple-reminders-badge.png)](https://mseep.ai/app/fradser-mcp-server-apple-reminders)

## 功能特性

### 核心功能
- **列表管理**：查看所有提醒事项和提醒事项列表的高级过滤选项
- **提醒事项操作**：完整的CRUD操作（创建、读取、更新、删除）提醒事项
- **丰富内容支持**：完全支持标题、备注、截止日期、URL和完成状态
- **原生macOS集成**：使用EventKit框架直接与Apple Reminders集成

### 高级功能
- **智能组织**：按优先级、截止日期、类别或完成状态的自动分类和智能过滤
- **强大搜索**：包括完成状态、截止日期范围和全文搜索的多条件过滤
- **批量操作**：使用优化的数据访问模式高效处理多个提醒事项
- **权限管理**：自动验证和请求所需的macOS系统权限
- **灵活日期处理**：支持多种日期格式（YYYY-MM-DD、ISO 8601）并具有时区感知能力
- **Unicode支持**：完整的国际字符支持和全面的输入验证

### 技术优势
- **Clean Architecture**：遵循Clean Architecture原则的4层架构，包含依赖注入
- **类型安全**：使用Zod模式验证进行运行时类型检查的完整TypeScript覆盖
- **高性能**：用于Apple Reminders性能关键操作的Swift编译二进制文件
- **健壮的错误处理**：具有详细诊断信息的一致错误响应
- **Repository Pattern**：标准化的CRUD操作的数据访问抽象
- **函数式编程**：在适当情况下使用纯函数和不可变数据结构

## 系统要求

- **Node.js 18 或更高版本**
- **macOS**（Apple Reminders 集成所需）
- **Xcode Command Line Tools**（编译 Swift 代码所需）
- **pnpm**（推荐用于包管理）

## 快速开始

通过 npm 全局安装：

```bash
npm install -g mcp-server-apple-reminders
```

## 配置说明

### 配置 Cursor

1. 打开 Cursor
2. 打开 Cursor 设置
3. 点击侧边栏中的 "MCP"
4. 点击 "Add new global MCP server"
5. 使用以下设置配置服务器：
    ```json
    {
      "mcpServers": {
        "apple-reminders": {
          "command": "mcp-server-apple-reminders",
          "args": []
        }
      }
    }
    ```

### 配置 ChatWise

1. 打开 ChatWise
2. 进入设置
3. 导航至工具部分
4. 点击 "+" 按钮
5. 使用以下设置配置工具：
   - 类型：`stdio`
   - ID：`apple-reminders`
   - 命令：`mcp-server-apple-reminders`
   - 参数：（留空）

### 配置 Claude Desktop

你需要配置 Claude Desktop 以识别 Apple Reminders MCP 服务器。有两种方式可以访问配置：

#### 方式 1：通过 Claude Desktop 界面

1. 打开 Claude Desktop 应用
2. 从左上角菜单栏启用开发者模式
3. 打开设置并导航至开发者选项
4. 点击编辑配置按钮打开 `claude_desktop_config.json`

#### 方式 2：直接访问文件

macOS：
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Windows：
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

### 2. 添加服务器配置

将以下配置添加到你的 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "apple-reminders": {
      "command": "mcp-server-apple-reminders",
      "args": []
    }
  }
}
```

### 3. 重启 Claude Desktop

要使更改生效：

1. 完全退出 Claude Desktop（不仅仅是关闭窗口）
2. 重新启动 Claude Desktop
3. 查看工具图标以验证 Apple Reminders 服务器是否已连接

## 使用示例

配置完成后，你可以让 Claude 与你的 Apple Reminders 进行交互。以下是一些示例提示：

### 创建提醒事项
```
创建一个明天下午 5 点的"买杂货"提醒。
添加一个"打电话给妈妈"的提醒，备注"询问周末计划"。
在"工作"列表中创建一个下周五到期的"提交报告"提醒。
创建一个带URL的提醒"查看这个网站：https://google.com"。
```


### 更新提醒事项
```
将"买杂货"提醒的标题更新为"买有机杂货"。
将"打电话给妈妈"提醒更新为今天下午 6 点到期。
更新"提交报告"提醒并将其标记为已完成。
将"买杂货"的备注更改为"别忘了牛奶和鸡蛋"。
```

### 管理提醒事项
```
显示我的所有提醒事项。
列出"购物"列表中的所有提醒事项。
显示我已完成的提醒事项。
```

### 处理列表
```
显示所有提醒事项列表。
显示"工作"列表中的提醒事项。
```

服务器将：
- 处理你的自然语言请求
- 与 Apple 原生提醒事项应用交互
- 向 Claude 返回格式化结果
- 维护与 macOS 的原生集成

## 结构化提示库

该服务器提供统一的提示注册表，可通过 MCP 的 `ListPrompts` 和 `GetPrompt` 端点访问。每个模板都共享使命、上下文输入、编号流程、约束、输出格式和质量标准，让下游助手获得可预测的框架，而无需解析松散的自由格式示例。

- **daily-task-organizer** —— 可选 `today_focus`（你今天最想完成的重点）生成当日执行蓝图，在优先级工作与恢复时间之间保持平衡。支持智能任务聚类、专注时间段安排和自动提醒列表组织。
- **smart-reminder-creator** —— 可选 `task_idea`（你想做的一句话描述），生成优化调度的提醒结构。
- **reminder-review-assistant** —— 可选 `review_focus`（如“逾期”或某个清单名）用于审计与优化现有提醒。
- **weekly-planning-workflow** —— 可选 `user_ideas`（您本周想要完成的想法和目标）指导周一至周日的重置，时间区块与现有列表相关联。

### 设计约束与验证

- 提示严格限制在 Apple Reminders 原生能力范围内（无第三方自动化），并在提交不可逆操作前询问缺失上下文。
- 共享格式使输出可渲染为 Markdown 部分或表格，无需客户端应用程序的额外解析胶水。
- 每次修改提示文案后运行 `pnpm test -- src/server/prompts.test.ts` 以断言元数据、模式兼容性和叙述组装。

## 可用的 MCP 工具

此服务器提供两个统一的 MCP 工具用于全面的 Apple Reminders 管理：

### 提醒事项工具

**工具名称**：`reminders`

一个支持基于操作的 Apple Reminders 管理的综合工具。通过单个统一接口支持所有提醒事项操作。

**操作**：`read`, `create`, `update`, `delete`

**主要处理函数**：
- `handleReadReminders()` - 使用过滤选项读取提醒事项
- `handleCreateReminder()` - 创建新提醒事项
- `handleUpdateReminder()` - 更新现有提醒事项
- `handleDeleteReminder()` - 删除提醒事项

#### 按操作的参数

**读取操作**（`action: "read"`）：
- `id` *(可选)*：要读取的特定提醒事项的唯一标识符
- `filterList` *(可选)*：要显示的提醒事项列表名称
- `showCompleted` *(可选)*：包含已完成的提醒事项（默认：false）
- `search` *(可选)*：按标题或内容搜索提醒事项
- `dueWithin` *(可选)*：按截止日期范围筛选（"today"、"tomorrow"、"this-week"、"overdue"、"no-date"）

**创建操作**（`action: "create"`）：
- `title` *(必需)*：提醒事项标题
- `dueDate` *(可选)*：截止日期，格式为 'YYYY-MM-DD' 或 'YYYY-MM-DD HH:mm:ss'
- `targetList` *(可选)*：要添加到的提醒事项列表名称
- `note` *(可选)*：要附加到提醒事项的备注文本
- `url` *(可选)*：要与提醒事项关联的 URL

**更新操作**（`action: "update"`）：
- `id` *(必需)*：要更新的提醒事项的唯一标识符
- `title` *(可选)*：提醒事项的新标题
- `dueDate` *(可选)*：新的截止日期，格式为 'YYYY-MM-DD' 或 'YYYY-MM-DD HH:mm:ss'
- `note` *(可选)*：新的备注文本
- `url` *(可选)*：要附加到提醒事项的新 URL
- `completed` *(可选)*：将提醒事项标记为已完成/未完成
- `targetList` *(可选)*：包含提醒事项的列表名称

**删除操作**（`action: "delete"`）：
- `id` *(必需)*：要删除的提醒事项的唯一标识符

#### 使用示例

```json
{
  "action": "create",
  "title": "购买杂货",
  "dueDate": "2024-03-25 18:00:00",
  "targetList": "购物",
  "note": "别忘了牛奶和鸡蛋",
  "url": "https://example.com/shopping-list"
}
```

```json
{
  "action": "read",
  "filterList": "工作",
  "showCompleted": false,
  "dueWithin": "today"
}
```

```json
{
  "action": "delete",
  "id": "reminder-123"
}
```

### 列表工具

**工具名称**：`lists`

管理提醒事项列表 - 查看现有列表或创建新列表用于组织提醒事项。

**操作**：`read`, `create`, `update`, `delete`

**主要处理函数**：
- `handleReadReminderLists()` - 读取所有提醒事项列表
- `handleCreateReminderList()` - 创建新提醒事项列表
- `handleUpdateReminderList()` - 更新现有提醒事项列表
- `handleDeleteReminderList()` - 删除提醒事项列表

#### 按操作的参数

**读取操作**（`action: "read"`）：
- 无需额外参数

**创建操作**（`action: "create"`）：
- `name` *(必需)*：新提醒事项列表的名称

**更新操作**（`action: "update"`）：
- `name` *(必需)*：要更新的列表的当前名称
- `newName` *(必需)*：提醒事项列表的新名称

**删除操作**（`action: "delete"`）：
- `name` *(必需)*：要删除的列表名称

#### 使用示例

```json
{
  "action": "create",
  "name": "项目阿尔法"
}
```

#### 响应格式

**成功响应**：
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully created reminder: Buy groceries"
    }
  ],
  "isError": false
}
```

**URL 字段说明**：`url` 字段完全支持 EventKit API。当您创建或更新带有 URL 参数的提醒事项时，URL 会存储在两个位置以实现最大兼容性：

1. **EventKit URL 字段**：URL 存储在原生 `url` 属性中（在 Reminders 应用详细视图中通过 "i" 图标可见）
2. **备注字段**：URL 也以结构化格式附加到备注中，便于解析和多个 URL 支持

**双重存储方法**：
- **URL 字段**：为 Reminders 应用 UI 显示存储单个 URL
- **备注字段**：以结构化格式存储 URL，支持多个 URL

```
Reminder note content here...

URLs:
- https://example.com
- https://another-url.com
```

这确保了 URL 在 Reminders 应用 UI 和通过 API/备注解析中都可访问。

**URL 提取**：你可以使用结构化格式或正则表达式回退从提醒事项备注中提取 URL：
```typescript
// 使用结构化格式（推荐）
import { extractUrlsFromNotes, parseReminderNote } from './urlHelpers';

// 仅提取 URL
const urls = extractUrlsFromNotes(reminder.notes);

// 解析为单独的备注内容和 URL
const { note, urls } = parseReminderNote(reminder.notes);

// 传统正则表达式方法（回退用于非结构化内容）
const urlsRegex = reminder.notes?.match(/https?:\/\/[^\s]+/g) || [];
```

**结构化格式的优势**：
- **一致解析**：URL 始终位于可预测的位置
- **多 URL 支持**：可靠地处理每个提醒事项的多个 URL
- **清晰分离**：备注内容和 URL 明确分离
- **向后兼容**：非结构化 URL 仍作为回退检测

**列表响应**：
```json
{
  "reminders": [
    {
      "title": "购买杂货",
      "list": "购物",
      "isCompleted": false,
      "dueDate": "2024-03-25 18:00:00",
      "notes": "别忘了牛奶\n\nURLs:\n- https://grocery-store.com\n- https://shopping-list.com",
      "url": null
    }
  ],
  "total": 1,
  "filter": {
    "list": "购物",
    "showCompleted": false
  }
}
```

## URL 实用工具

服务器包含用于处理结构化 URL 格式的内置 URL 实用工具。这些工具从 `src/utils/urlHelpers.js` 导出：

### 主要函数

- `extractUrlsFromNotes(notes)` - 从结构化或非结构化备注中提取 URL
- `parseReminderNote(notes)` - 将备注解析为单独的内容和 URL 数组
- `formatNoteWithUrls(note, urls)` - 使用结构化 URL 格式化备注内容
- `removeUrlSections(notes)` - 删除 URL 部分以获取干净的备注内容
- `combineNoteWithUrl(note, url)` - 以结构化格式组合备注与单个 URL

### 使用示例

```typescript
import {
  extractUrlsFromNotes,
  parseReminderNote,
  formatNoteWithUrls
} from 'mcp-server-apple-reminders/src/utils/urlHelpers.js';

// 从任何提醒事项备注中提取 URL
const urls = extractUrlsFromNotes(reminder.notes);
console.log(urls); // ['https://example.com', 'https://test.com']

// 将备注解析为内容和 URL
const { note, urls } = parseReminderNote(reminder.notes);
console.log(note); // "任务描述"
console.log(urls); // ['https://example.com']

// 创建结构化备注内容
const structured = formatNoteWithUrls("新任务", ['https://link1.com', 'https://link2.com']);
// 结果: "新任务\n\nURLs:\n- https://link1.com\n- https://link2.com"
```

## 组织策略

服务器通过四个内置策略提供智能提醒事项组织功能：

### 优先级策略
基于优先级关键词自动分类提醒事项：
- **高优先级**：包含"紧急"、"重要"、"关键"、"紧急"等词
- **中优先级**：标准提醒事项的默认类别
- **低优先级**：包含"稍后"、"某天"、"最终"、"也许"等词

### 截止日期策略
基于提醒事项的截止日期进行组织：
- **已过期**：过去的截止日期
- **今天**：今天到期的提醒事项
- **明天**：明天到期的提醒事项
- **本周**：本周内到期的提醒事项
- **下周**：下周到期的提醒事项
- **未来**：下周之后到期的提醒事项
- **无日期**：没有截止日期的提醒事项

### 类别策略
通过内容分析智能分类提醒事项：
- **工作**：商务、会议、项目、办公室、客户相关
- **个人**：家庭、朋友、自我护理相关
- **购物**：购买、商店、采购、杂货相关
- **健康**：医生、运动、医疗、健身、锻炼相关
- **财务**：账单、付款、金融、银行、预算相关
- **旅行**：旅行、假期、航班、酒店相关
- **教育**：学习、课程、学校、书籍、研究相关
- **未分类**：不匹配任何特定类别的提醒事项

### 完成状态策略
简单的二元组织：
- **活跃**：未完成的提醒事项
- **已完成**：已完成的提醒事项

### 使用示例

按优先级组织所有提醒事项：
```
按优先级组织我的提醒事项
```

对工作相关的提醒事项进行分类：
```
从工作列表按类别组织提醒事项
```

对过期项目进行排序：
```
按截止日期组织过期提醒事项
```

## 开发

1. 使用 pnpm 安装依赖（保持 Swift 桥接与 TypeScript 版本一致）：
```bash
pnpm install
```

2. 在启动前构建 Swift 二进制（TypeScript 使用运行时执行）：
```bash
pnpm build
```

3. 运行全量测试，验证 TypeScript、Swift 桥接和提示模板：
```bash
pnpm test
```

4. 在提交前执行 Biome 检查：
```bash
pnpm exec biome check
```

### 嵌套目录启动

CLI 入口内建项目根目录回退逻辑。即使从 `dist/` 等子目录或编辑器任务运行器启动，服务器也能在向上最多十层目录内定位 `package.json` 并加载随附的 Swift 二进制。若你自定义目录结构，请确保清单文件仍在该查找深度之内，以维持这一保证。

### 可用脚本

- `pnpm build` - 构建 Swift 二进制文件（启动服务器前必需）
- `pnpm build:swift` - 仅构建 Swift 二进制文件
- `pnpm dev` - 通过 tsx 以文件监视模式运行 TypeScript 开发服务器（运行时 TS 执行）
- `pnpm start` - 通过 stdio 启动 MCP 服务器（如果没有构建则自动回退到运行时 TS）
- `pnpm test` - 运行完整的 Jest 测试套件
- `pnpm check` - 运行 Biome 格式化和 TypeScript 类型检查

### 依赖

**运行时依赖：**
- `@modelcontextprotocol/sdk ^1.20.2` - MCP 协议实现
- `moment ^2.30.1` - 日期/时间处理实用工具
- `exit-on-epipe ^1.0.1` - 优雅的进程终止处理
- `tsx ^4.20.6` - TypeScript 执行和 REPL
- `zod ^4.1.12` - 运行时类型验证

**开发依赖：**
- `typescript ^5.9.3` - TypeScript 编译器
- `@types/node ^24.9.2` - Node.js 类型定义
- `@types/jest ^30.0.0` - Jest 类型定义
- `jest ^30.2.0` - 测试框架
- `babel-jest ^30.2.0` - Babel Jest 转换器
- `babel-plugin-transform-import-meta ^2.3.3` - Babel 导入元转换
- `ts-jest ^29.4.5` - Jest TypeScript 支持
- `@biomejs/biome ^2.3.2` - 代码格式化和静态检查

**构建工具：**
- Swift 二进制文件用于原生 macOS 集成
- TypeScript 编译用于跨平台兼容性

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.
