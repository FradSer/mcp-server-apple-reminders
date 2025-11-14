/**
 * server/promptAbstractions.ts
 * Shared abstractions for prompt templates - confidence levels, tool execution patterns, output formats
 */

/**
 * Confidence level thresholds for action execution
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 0,
} as const;

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Determine confidence level from percentage
 */
export const getConfidenceLevel = (percentage: number): ConfidenceLevel => {
  if (percentage > CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
  if (percentage >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
};

/**
 * Standard tool call format
 */
export interface ToolCall {
  tool:
    | 'reminders.tasks'
    | 'reminders.lists'
    | 'calendar.events'
    | 'calendar.calendars';
  args: Record<string, unknown>;
}

/**
 * Confidence-based action format
 */
export interface ConfidenceAction {
  confidence: ConfidenceLevel;
  percentage: number;
  action: string;
  toolCall?: ToolCall;
  rationale: string;
  isRecommendation?: boolean;
}

/**
 * Standard output structure for prompts with action queues
 */
export interface StandardActionOutput {
  currentState?: string;
  gapsFound?: string;
  actionQueue: ConfidenceAction[];
  questions?: string;
  verificationLog?: string;
  [key: string]: unknown; // Allow prompt-specific sections
}

/**
 * Build a confidence action with proper format
 */
export const buildConfidenceAction = ({
  percentage,
  action,
  toolCall,
  rationale,
  isRecommendation = false,
}: {
  percentage: number;
  action: string;
  toolCall?: ToolCall;
  rationale: string;
  isRecommendation?: boolean;
}): ConfidenceAction => {
  const confidence = getConfidenceLevel(percentage);
  return {
    confidence,
    percentage,
    action,
    toolCall,
    rationale,
    isRecommendation,
  };
};

/**
 * Format tool call for MCP output
 */
export const buildToolCall = (
  tool: ToolCall['tool'],
  args: Record<string, unknown>,
): ToolCall => ({
  tool,
  args,
});

/**
 * Format time string consistently (YYYY-MM-DD HH:mm:ss)
 */
export const buildTimeFormat = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format confidence action for output display
 */
export const formatConfidenceAction = (action: ConfidenceAction): string => {
  const {
    confidence,
    percentage,
    action: actionDesc,
    toolCall,
    rationale,
    isRecommendation,
  } = action;

  let output = `${confidence} CONFIDENCE (${percentage}%): `;

  if (isRecommendation) {
    output += `RECOMMENDATION - ${actionDesc}\n`;
    if (toolCall) {
      output += `Suggested tool call: ${toolCall.tool} with ${JSON.stringify(toolCall.args)}\n`;
    }
    output += `Rationale: ${rationale}`;
  } else {
    output += `${actionDesc}\n`;
    if (toolCall) {
      output += `Tool: ${toolCall.tool}\n`;
      output += `Args: ${JSON.stringify(toolCall.args, null, 2)}`;
    }
    if (rationale) {
      output += `\nRationale: ${rationale}`;
    }
  }

  return output;
};

/**
 * Standard confidence system constraints
 * Decision priority: (1) If scope is ambiguous → confirm, (2) Then apply confidence thresholds
 */
export const CONFIDENCE_CONSTRAINTS = [
  'Assess confidence levels for each potential action (high >80%, medium 60-80%, low <60%).',
  'Decision priority: First check if scope is ambiguous (if yes, request confirmation). Then apply confidence thresholds for clear-scope actions.',
  'For high-confidence actions (>80%), immediately call the tool to execute. For medium-confidence actions, provide recommendations in tool call format. For low-confidence actions, ask for user confirmation.',
  'Provide brief rationale for medium-confidence decisions before taking action.',
];

/**
 * Standard note formatting constraints (compressed from 14 lines to 5 lines)
 */
export const NOTE_FORMATTING_CONSTRAINTS = [
  'Existing reminders: ONLY edit notes when ALL conditions met: (a) adding essential info (duration/links), (b) confidence >80%, (c) essential for completion, (d) user has not objected.',
  'New reminders: Freely add execution context as long as formatting rules below are followed.',
  'Allowed keywords (one per line + plain text): See: [reference/URL], Note: [brief context], Duration: [time estimate].',
  'Forbidden syntax: No markdown (no "- [ ]", "**bold**", "# headers", etc.). Apple Reminders does NOT render markdown.',
  'Correct format: Use "-" for bullets, "\\n" for line breaks, plain text only.',
];

/**
 * Standard batching and idempotency constraints
 */
export const BATCHING_CONSTRAINTS = [
  'Run idempotency checks before creating anything: search for likely duplicates by normalized title (lowercase, trimmed, punctuation removed). Prefer updating an existing reminder over creating a duplicate.',
  'Batch tool calls when executing multiple changes to reduce overhead and keep actions atomic by concern (e.g., all creates, then updates).',
];

export const TASK_BATCHING_CONSTRAINTS = [
  '**Task batching strategy**: Group similar tasks together and complete in dedicated time blocks to minimize context switching.',
  '  - Examples: Batch all code reviews together, all emails together, all meetings together',
  '  - Naming pattern: "Code Review Batch — 3 PRs", "Email Processing — Inbox Zero", "Admin Batch — 5 tasks"',
  '  - Reduces context switching by 60-80% compared to handling tasks individually',
  '  - Schedule batches: Similar cognitive requirements, tools, or workflows = good batch candidates',
  '  - Avoid: Batching unrelated tasks that require different mental modes',
];

/**
 * Standard calibration guidance for overwhelming workloads
 */
export const WORKLOAD_CALIBRATION = [
  'When workload appears overwhelming, prioritize critical path tasks (using urgent due dates and important lists) and suggest deferring non-essential items.',
  'If multiple similar tasks exist, recommend consolidation or batching strategies.',
];

/**
 * Standard calibration for missing context
 */
export const CONTEXT_CALIBRATION = [
  'When creating reminders for unknown tasks, use clear, descriptive titles and suggest appropriate list placement.',
];

/**
 * Apple Reminders limitations reminder
 */
export const APPLE_REMINDERS_LIMITATIONS = [
  'Remember: Apple Reminders does not support priority fields. Use due date urgency and list importance to convey task importance.',
];

/**
 * Core constraints applied to all prompts
 */
export const CORE_CONSTRAINTS = [
  ...CONFIDENCE_CONSTRAINTS,
  ...NOTE_FORMATTING_CONSTRAINTS,
  ...BATCHING_CONSTRAINTS,
];



/**
 * Deep work time block execution details (trigger rules moved to TIME_BLOCK_CREATION_CONSTRAINTS)
 */
export const DEEP_WORK_CONSTRAINTS = [
  '**Deep work execution details** (apply when TIME_BLOCK_CREATION_CONSTRAINTS triggers are met):',
  '  - Time block length: Minimum 60 minutes, with 90-120 minutes recommended to sustain flow. Split anything beyond 120 minutes into multiple sessions.',
  '  - Flow state entry: Takes ~20 minutes to enter deep focus. Longer blocks (2 hours) maximize productive time in flow state.',
  '  - Scheduling: Peak energy hours (9am-12pm). Plan 2 blocks per day (e.g., two 2-hour sessions = 4 hours total).',
  '  - Break intervals: 15-30 minutes between blocks. Longer breaks (60+ minutes) after 4 hours of deep work.',
  '  - Clear objectives: Each block has specific goal in notes.',
  '  - Anchor to due times: Start time = due time - duration. If past, move forward.',
  '  - Naming pattern: "Deep Work — [Project Name]" (for tasks meeting deep work criteria).',
];

/**
 * Shallow tasks time block creation guidelines
 * Encompasses all non-deep-work activities: quick wins, routine tasks, administrative work
 */
export const SHALLOW_TASKS_CONSTRAINTS = [
  '**Shallow tasks time block guidelines**:',
  '  - Time block length: 15-60 minutes for all non-deep-work activities including quick wins, routine tasks, and administrative work',
  '  - Task examples: Email processing, status updates, meeting preparation, quick code reviews, administrative paperwork, scheduling, light coordination, quick fixes',
  '  - Scheduling strategy: Fill gaps between deep work blocks, schedule during lower energy periods (typically 2-4pm), batch similar tasks together',
  '  - Batching encouraged: Group similar shallow tasks into single blocks when possible (e.g., "Email & Admin" combining multiple small tasks)',
  '  - Calendar naming pattern: "Shallow Task — [Task Description]" or batch as "Shallow Tasks — [Category]" (e.g., "Shallow Tasks — Admin & Email")',
  '  - Energy awareness: Schedule during post-lunch dip, end-of-day, or gaps between meetings when cognitive capacity is lower',
];

/**
 * Daily capacity and workload balancing constraints
 * Includes implicit 20% buffer time allocation
 */
export const DAILY_CAPACITY_CONSTRAINTS = [
  '**Daily capacity limits and workload balancing**:',
  '  - Deep Work maximum: 4 hours per day (typically 2-3 blocks of 60-90 minutes). Research shows this is the sustainable maximum for focused cognitive work',
  '  - Implicit buffer allocation: When scheduling, automatically leave ~20% of working hours unscheduled (approximately 1.5-2 hours in 8-hour workday) as gaps between blocks and at day end',
  '  - Shallow Tasks fill remaining time after deep work allocation and implicit buffer time',
  '  - Total validation: Deep Work + Shallow Tasks + implicit buffer (~20%) should equal working hours (typically 8 hours)',
  '  - Energy alignment: Schedule deep work during peak energy (9am-12pm), shallow tasks during lower energy periods (2-4pm), with natural transition gaps',
  '  - Warn when overcommitted: If total scheduled work exceeds available hours or deep work exceeds 4 hours, flag the issue and suggest prioritization',
  '  - Buffer time handling: Do not create explicit "Buffer Time" calendar events. Instead, leave natural gaps (15-30 minutes) between major blocks for transitions, unexpected work, and flexibility',
];

/**
 * Time format specification (single source of truth)
 */
export const TIME_FORMAT_SPEC = 'YYYY-MM-DD HH:mm:ss (local time, no timezone suffix like "Z" or "+08:00")';

/**
 * Time block creation strict rules (includes trigger conditions from former DEEP_WORK_CONSTRAINTS)
 */
export const TIME_BLOCK_CREATION_CONSTRAINTS = [
  '**Time block creation triggers**: CREATE calendar.events time blocks when tasks meet ANY criteria:',
  '  - Task has duration estimate ≥60 minutes with due date today (applies DEEP_WORK_CONSTRAINTS for execution details)',
  '  - Task title suggests cognitively demanding work (开发, 设计, 分析, 规划, 重构, 架构) with duration ≥60min',
  '  - Multiple related tasks with explicit times due today, totaling ≥60 minutes, that can be batched',
  '  - Task notes mention "deep work", "focused time", "uninterrupted"',
  '  - Task explicitly marked as requiring focused/uninterrupted time',
  '  - Task benefits from calendar visibility to prevent double-booking',
  `  - Always use ${TIME_FORMAT_SPEC} format for startDate and endDate (e.g., "2025-11-04 14:00:00" for 2PM)`,
  '  - Anchor calendar events to reminder due timestamps by subtracting duration to determine startDate. If start would be in the past, move forward but preserve duration.',
  '  - When multiple tasks share a project, use single block with shared objective in notes.',
  '  - For confidence levels and execution: Follow standard CONFIDENCE_CONSTRAINTS (>80% execute, 60-80% recommend, <60% confirm). Apply DEEP_WORK_CONSTRAINTS for block sizing and scheduling.',
];

/**
 * Standard action queue output format
 */
export const getActionQueueFormat = (_currentDate: string): string[] => [
  '### Action queue — prioritized list of actions organized by confidence level (high/medium/low) and impact. IMPORTANT: High-confidence actions (>80%) should be EXECUTED immediately using MCP tool calls, not just described. Each action should specify:',
  '  - HIGH CONFIDENCE (>80%): Execute using tool calls. MEDIUM CONFIDENCE (60-80%): Provide recommendations in tool call format. LOW CONFIDENCE (<60%): Text description only, ask for confirmation.',
  '  - Each action must include: confidence level, action type (create/update/recommendation), exact properties (title, list, dueDate, note, url if applicable), and brief rationale',
  `  - Use ${TIME_FORMAT_SPEC} format for dueDate (e.g., "2025-11-04 18:00:00").`,
];

/**
 * Standard verification log format
 */
export const getVerificationLogFormat = (currentDate: string): string =>
  `### Verification log — bullet list confirming that each executed due date marked "today" uses ${currentDate} in the tool call output and persisted value (include reminder title + due date).`;

/**
 * Build standard output format sections
 */
export const buildStandardOutputFormat = (
  currentDate: string,
): {
  actionQueue: string[];
  verificationLog: string;
} => ({
  actionQueue: getActionQueueFormat(currentDate),
  verificationLog: getVerificationLogFormat(currentDate),
});
