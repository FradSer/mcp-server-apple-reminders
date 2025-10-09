# Apple Reminders MCP Server ![Version 0.8.0](https://img.shields.io/badge/version-0.8.0-blue) ![License: MIT](https://img.shields.io/badge/license-MIT-green)

[![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

[English](README.md) | 简体中文

一个为 macOS 提供原生 Apple Reminders 集成的 Model Context Protocol (MCP) 服务器。该服务器允许你通过标准化接口与 Apple Reminders 进行交互，具有全面的管理功能。

[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/fradser-mcp-server-apple-reminders-badge.png)](https://mseep.ai/app/fradser-mcp-server-apple-reminders)

## 功能特性

### 核心功能
- **列表管理**：查看所有提醒事项和列表的高级过滤功能
- **提醒事项操作**：创建、更新、删除和移动提醒事项
- **丰富内容**：支持标题、备注、截止日期、URL 和完成状态
- **原生集成**：与 macOS Apple Reminders 应用的无缝集成

### 高级功能
- **智能组织**：按优先级、截止日期、类别或完成状态自动分类
- **强大的搜索**：按完成状态、截止日期和搜索词过滤提醒事项
- **批量操作**：使用智能策略组织多个提醒事项
- **权限管理**：主动验证系统权限
- **灵活的日期处理**：支持仅日期和日期时间格式，并考虑区域设置
- **Unicode 支持**：完整的国际字符支持和验证

### 技术优势
- **统一 API**：基于操作的工具架构简化了复杂性
- **类型安全**：全面的 TypeScript 覆盖和 Zod 验证
- **性能优化**：用于性能关键操作的 Swift 二进制文件
- **错误处理**：一致的错误响应和详细反馈

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

## 自然语言时间支持

这个 MCP 服务器现在支持**自然语言时间表达式**来创建和更新提醒事项！你可以使用直观的时间表达式，而不是严格的日期格式。

### 支持的时间表达式

**英文表达式：**
- 相对时间：`"tomorrow"`、`"next week"`、`"in 3 hours"`、`"this evening"`
- 具体时间：`"tomorrow at 3pm"`、`"next Monday morning"`、`"Friday afternoon"`
- 时间段：`"this week"`、`"next month"`、`"this weekend"`

**中文表达式：**
- `"明天"`、`"下周一"`、`"后天下午"`、`"今天"`、`"昨天"`、`"这个周末"`

**示例：**
```
创建一个"审查文档"的提醒，2小时后到期
添加一个"打电话给牙医"的提醒，下周一上午到期
设置一个"团队会议"的提醒，明天下午3点
创建一个"计划假期"的提醒，本周末到期
将"买杂货"更新为明天晚上到期
```

## 使用示例

配置完成后，你可以让 Claude 与你的 Apple Reminders 进行交互。以下是一些示例提示：

### 创建提醒事项（支持自然语言时间）
```
创建一个明天下午 5 点的"买杂货"提醒。
添加一个"打电话给妈妈"的提醒，备注"询问周末计划"。
在"工作"列表中创建一个下周五到期的"提交报告"提醒。
创建一个带URL的提醒"查看这个网站：https://google.com"。

# 自然语言时间表达式（新功能！）
创建一个"审查文档"的提醒，2小时后到期。
添加一个"打电话给牙医"的提醒，下周一上午到期。
创建一个"计划假期"的提醒，本周末到期。
设置一个"团队会议"的提醒，明天下午3点。
创建一个"买礼物"的提醒，下周五下午到期。
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

## 可用的 MCP 工具

此服务器提供两个统一的 MCP 工具用于全面的 Apple Reminders 管理：

### 提醒事项工具

**工具名称**：`reminders`

一个支持基于操作的 Apple Reminders 管理的综合工具。通过单个统一接口支持所有提醒事项操作。

**操作**：`list`, `create`, `update`, `delete`, `bulk_create`, `bulk_update`, `bulk_delete`, `organize`

#### 按操作的参数

**列表操作**（`action: "list"`）：
- `list` *(可选)*：要显示的提醒事项列表名称
- `showCompleted` *(可选)*：包含已完成的提醒事项（默认：false）
- `search` *(可选)*：按标题或内容搜索提醒事项
- `dueWithin` *(可选)*：按截止日期范围筛选（"today"、"tomorrow"、"this-week"、"overdue"、"no-date"）

**创建操作**（`action: "create"`）：
- `title` *(必需)*：提醒事项标题
- `dueDate` *(可选)*：截止日期，格式为 'YYYY-MM-DD' 或 'YYYY-MM-DD HH:mm:ss'
- `list` *(可选)*：要添加到的提醒事项列表名称
- `note` *(可选)*：要附加到提醒事项的备注文本
- `url` *(可选)*：要与提醒事项关联的 URL

**更新操作**（`action: "update"`）：
- `title` *(必需)*：要更新的提醒事项的当前标题
- `newTitle` *(可选)*：提醒事项的新标题
- `dueDate` *(可选)*：新的截止日期，格式为 'YYYY-MM-DD' 或 'YYYY-MM-DD HH:mm:ss'
- `note` *(可选)*：新的备注文本
- `completed` *(可选)*：将提醒事项标记为已完成/未完成
- `list` *(可选)*：包含提醒事项的列表名称
- `url` *(可选)*：要附加到提醒事项的新 URL

**删除操作**（`action: "delete"`）：
- `title` *(必需)*：要删除的提醒事项标题
- `list` *(可选)*：包含提醒事项的列表名称

**批量创建操作**（`action: "bulk_create"`）：
- `items` *(必需)*：要创建的提醒事项对象数组

**批量更新操作**（`action: "bulk_update"`）：
- `criteria` *(必需)*：查找提醒事项的搜索条件
- `updates` *(必需)*：要更新的属性

**批量删除操作**（`action: "bulk_delete"`）：
- `criteria` *(必需)*：查找要删除的提醒事项的搜索条件

**组织操作**（`action: "organize"`）：
- `strategy` *(必需)*：组织策略（"priority"、"due_date"、"category"、"completion_status"）
- `sourceList` *(可选)*：要组织的源列表
- `createLists` *(可选)*：自动创建新列表（默认：true）

#### 使用示例

```json
{
  "action": "create",
  "title": "购买杂货",
  "dueDate": "2024-03-25 18:00:00",
  "list": "购物",
  "note": "别忘了牛奶和鸡蛋",
  "url": "https://example.com/shopping-list"
}
```

```json
{
  "action": "list",
  "list": "工作",
  "showCompleted": false,
  "dueWithin": "today"
}
```

```json
{
  "action": "organize",
  "strategy": "category",
  "sourceList": "收件箱",
  "createLists": true
}
```

### 列表工具

**工具名称**：`lists`

管理提醒事项列表 - 查看现有列表或创建新列表用于组织提醒事项。

**操作**：`list`, `create`, `update`, `delete`

#### 按操作的参数

**列表操作**（`action: "list"`）：
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
      "text": "成功创建提醒事项：购买杂货"
    }
  ],
  "isError": false
}
```

**列表响应**：
```json
{
  "reminders": [
    {
      "title": "购买杂货",
      "list": "购物",
      "isCompleted": false,
      "dueDate": "2024-03-25 18:00:00",
      "notes": "别忘了牛奶",
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

1. 安装依赖：
```bash
npm install
```

2. 构建用于 Apple Reminders 集成的 Swift 二进制文件：
```bash
npm run build
```

### 项目结构

```
.
├── src/                          # 源代码目录
│   ├── index.ts                  # 主入口点
│   ├── server/                   # MCP 服务器实现
│   │   ├── server.ts             # 服务器配置和生命周期
│   │   ├── handlers.ts           # 请求处理器和路由
│   │   └── *.test.ts             # 服务器测试
│   ├── swift/                    # 原生 Swift 集成代码
│   │   ├── bin/                  # 编译后的 Swift 二进制文件
│   │   ├── GetReminders.swift    # Swift 源文件
│   │   └── build.sh              # Swift 构建脚本
│   ├── tools/                    # MCP 工具定义和处理器
│   │   ├── definitions.ts        # 工具模式和验证
│   │   ├── handlers.ts           # 工具实现逻辑
│   │   ├── index.ts              # 工具注册
│   │   └── *.test.ts             # 工具测试
│   ├── types/                    # TypeScript 类型定义
│   │   └── index.ts              # 核心类型定义
│   ├── utils/                    # 辅助函数和实用工具
│   │   ├── __mocks__/            # 测试模拟
│   │   ├── *.ts                  # 实用工具模块
│   │   └── *.test.ts             # 实用工具测试
│   ├── validation/               # 模式验证实用工具
│   │   └── schemas.ts            # Zod 验证模式
│   └── test-setup.ts             # 测试环境设置
├── dist/                         # 编译后的 JavaScript 输出
│   ├── index.js                  # 主编译入口点
│   ├── swift/bin/                # 编译后的 Swift 二进制文件
│   ├── server/                   # 服务器编译文件
│   ├── tools/                    # 工具编译文件
│   ├── types/                    # 类型编译文件
│   ├── utils/                    # 实用工具编译文件
│   └── validation/               # 验证编译文件
├── node_modules/                 # Node.js 依赖
├── package.json                  # 包配置
├── tsconfig.json                 # TypeScript 配置
├── jest.config.mjs               # Jest 测试配置
├── pnpm-lock.yaml               # pnpm 锁定文件
└── *.md                         # 文档文件
```

### 可用脚本

- `npm run build` - 构建 TypeScript 和 Swift 组件（启动服务器前必需）
- `npm run build:ts` - 仅构建 TypeScript 代码
- `npm run build:swift` - 仅构建 Swift 二进制文件
- `npm run dev` - TypeScript 开发模式，支持文件监视
- `npm run start` - 启动 MCP 服务器
- `npm run test` - 运行全面的测试套件
- `npm run clean` - 清理构建产物

### 依赖

**运行时依赖：**
- `@modelcontextprotocol/sdk ^1.5.0` - MCP 协议实现
- `moment ^2.30.1` - 日期/时间处理实用工具
- `zod ^3.24.2` - 运行时类型验证

**开发依赖：**
- `typescript ^5.8.2` - TypeScript 编译器
- `@types/node ^20.0.0` - Node.js 类型定义
- `@types/jest ^29.5.12` - Jest 类型定义
- `jest ^29.7.0` - 测试框架
- `ts-jest ^29.1.2` - Jest TypeScript 支持

**构建工具：**
- Swift 二进制文件用于原生 macOS 集成
- TypeScript 编译用于跨平台兼容性

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.
