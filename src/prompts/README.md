# MCP Prompts System

完全重构的 MCP 服务器 prompts 系统，提供模块化、类型安全、可扩展的 prompts 管理。

## 架构特点

### 🏗️ 模块化设计
- **分离关注点**: 每个功能类别有独立的模板文件
- **类型安全**: 完整的 TypeScript 类型定义和 Zod 验证
- **可扩展性**: 轻松添加新的 prompts 和类别

### 📁 文件结构
```
src/prompts/
├── types.ts              # 核心类型定义
├── registry.ts           # 中央注册表实现
├── index.ts              # 主入口和初始化
├── templates/            # 按类别组织的模板
│   ├── productivity.ts   # 生产力相关 prompts
│   ├── planning.ts       # 规划相关 prompts
│   ├── organization.ts   # 组织相关 prompts
│   ├── analysis.ts       # 分析相关 prompts
│   ├── goals.ts          # 目标相关 prompts
│   ├── automation.ts     # 自动化相关 prompts
│   └── custom.ts         # 自定义和高级 prompts
└── README.md            # 本文档
```

## 功能特性

### 🎯 智能分类
- **7 个主要类别**: productivity, planning, organization, analysis, goals, automation, custom
- **标签系统**: 支持多标签分类和搜索
- **元数据**: 版本、复杂度、预估时间等

### 🔧 高级功能
- **参数验证**: 使用 Zod 进行运行时类型验证
- **模板系统**: 支持参数化模板和动态内容生成
- **搜索功能**: 按名称、描述、标签搜索
- **注册表管理**: 动态注册、注销 prompts

### 📊 统计信息
- **类别统计**: 每个类别的 prompts 数量
- **性能监控**: 模板执行时间和错误跟踪
- **使用分析**: 可扩展的使用统计

## 使用方法

### 基本使用
```typescript
import { initializePrompts, getPrompt, getAllPrompts } from './prompts/index.js';

// 初始化系统
initializePrompts();

// 获取所有 prompts
const allPrompts = getAllPrompts();

// 获取特定 prompt
const prompt = getPrompt('daily-task-organizer');

// 执行模板
const result = prompt.template({
  task_category: 'work',
  priority_level: 'high',
  time_frame: 'today'
});
```

### 按类别获取
```typescript
import { getPromptsByCategory } from './prompts/index.js';

const productivityPrompts = getPromptsByCategory('productivity');
const planningPrompts = getPromptsByCategory('planning');
```

### 搜索功能
```typescript
import { searchPrompts } from './prompts/index.js';

// 按名称搜索
const dailyPrompts = searchPrompts('daily');

// 按描述搜索
const taskPrompts = searchPrompts('task management');

// 按标签搜索
const planningPrompts = searchPrompts('planning');
```

## 创建自定义 Prompts

### 1. 定义 Schema
```typescript
import { z } from 'zod';

const myPromptSchema = z.object({
  param1: z.string().optional().default('default value'),
  param2: z.enum(['option1', 'option2']).optional().default('option1'),
});
```

### 2. 创建 Prompt 定义
```typescript
import type { PromptDefinition } from './types.js';

export const myPrompt: PromptDefinition = {
  name: 'my-custom-prompt',
  description: 'My custom prompt description',
  category: 'custom',
  tags: ['custom', 'example'],
  arguments: [
    {
      name: 'param1',
      description: 'First parameter',
      required: false,
      schema: z.string(),
      defaultValue: 'default value',
    },
    // ... 更多参数
  ],
  template: (args) => {
    const { param1, param2 } = myPromptSchema.parse(args);
    
    return {
      description: `Custom prompt for ${param1}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Custom prompt content with ${param1} and ${param2}`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '1.0.0',
    complexity: 'intermediate',
    estimatedTime: '10-15 minutes',
  },
};
```

### 3. 注册 Prompt
```typescript
import { promptRegistry } from './registry.js';

promptRegistry.register(myPrompt);
```

## 可用的 Prompts

### 生产力类 (Productivity)
- `daily-task-organizer`: 日常任务组织工作流
- `smart-reminder-creator`: 智能提醒创建
- `productivity-analysis`: 生产力分析

### 规划类 (Planning)
- `weekly-planning-workflow`: 周计划工作流
- `monthly-goal-planning`: 月度目标规划
- `project-planning`: 项目规划

### 组织类 (Organization)
- `reminder-cleanup-guide`: 提醒清理指南
- `list-organization`: 列表组织
- `smart-categorization`: 智能分类

### 分析类 (Analysis)
- `reminder-review-assistant`: 提醒审查助手
- `productivity-insights`: 生产力洞察
- `habit-analysis`: 习惯分析

### 目标类 (Goals)
- `goal-tracking-setup`: 目标跟踪设置
- `smart-goals-creation`: 智能目标创建
- `goal-review-adjustment`: 目标审查调整

### 自动化类 (Automation)
- `context-aware-scheduling`: 上下文感知调度
- `automated-workflow-creation`: 自动化工作流创建
- `smart-notification-system`: 智能通知系统

### 自定义类 (Custom)
- `custom-prompt-builder`: 自定义 prompt 构建器
- `advanced-workflow-designer`: 高级工作流设计器
- `system-optimization`: 系统优化

## 技术细节

### 类型安全
- 所有 prompts 使用 TypeScript 严格类型
- Zod 运行时验证确保参数正确性
- 完整的类型推导和检查

### 性能优化
- 延迟加载模板内容
- 缓存注册表状态
- 高效的搜索算法

### 错误处理
- 优雅的错误处理和恢复
- 详细的错误信息和调试日志
- 参数验证失败时的友好提示

## 扩展指南

### 添加新类别
1. 在 `types.ts` 中更新 `PromptCategory` 类型
2. 在 `registry.ts` 中初始化新类别
3. 创建对应的模板文件

### 添加新功能
1. 在 `types.ts` 中定义新接口
2. 在 `registry.ts` 中实现功能
3. 更新 `index.ts` 导出新功能

### 测试新 Prompts
1. 在 `prompts.test.ts` 中添加测试用例
2. 确保所有测试通过
3. 验证模板执行正确性

## 最佳实践

1. **命名规范**: 使用 kebab-case 命名 prompts
2. **描述清晰**: 提供详细、准确的描述
3. **参数验证**: 始终使用 Zod 验证参数
4. **错误处理**: 提供有意义的错误信息
5. **文档完整**: 为每个 prompt 提供使用示例
6. **测试覆盖**: 确保所有功能都有测试覆盖

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 添加新的 prompts 或功能
4. 编写测试
5. 提交 Pull Request

---

这个新的 prompts 系统为 MCP 服务器提供了强大、灵活、可扩展的 prompts 管理能力，大大提升了开发效率和用户体验。