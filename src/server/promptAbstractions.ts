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
 */
export const CONFIDENCE_CONSTRAINTS = [
  'Assess confidence levels for each potential action (high >80%, medium 60-80%, low <60%).',
  'For high-confidence actions (>80%), immediately call the tool to execute. For medium-confidence actions, provide recommendations in tool call format. For low-confidence actions, ask for user confirmation.',
  'Only ask for confirmation when confidence is low (<60%) or when decisions significantly impact user workflow.',
  'Provide brief rationale for medium-confidence decisions before taking action.',
];

/**
 * Standard time consistency constraints
 */
export const TIME_CONSISTENCY_CONSTRAINTS = [
  'CRITICAL time consistency rules: ALWAYS align due dates with action urgency and list importance:',
  '- "RIGHT NOW", "IMMEDIATE", or "CRITICAL BLOCKER" actions → due within 2 hours of current time, assign to important/urgent list',
  '- "Quick Wins" (15-minute tasks) → due same day, ideally within 4 hours or end of work day (6PM)',
  '- "Today" actions → due before 6PM same day',
  '- "Critical blocker" tasks → urgent due dates (same day), assign to important list',
  '- NEVER set distant due dates (tomorrow or later) for time-sensitive actions described as immediate',
];

/**
 * Standard note formatting constraints
 */
export const NOTE_FORMATTING_CONSTRAINTS = [
  'Strict note modification rules: ONLY modify reminder notes when ALL conditions are met: (a) adding CRITICAL completion information (missing resources, blocking issues, required coordination), (b) confidence >90%, (c) information is essential for task completion, (d) user has not explicitly requested to preserve notes.',
  'Minimal intervention for creative workers: default to leaving notes untouched unless the added context clears a blocker or records a duration estimate required for planning.',
  'When notes must be updated, use concise single-line keywords (Blocked:, Depends:, Next:, See:, Note:, Duration:) followed by plain text. Preserve the original user note on its own line after any new annotations.',
  'Do NOT include reminder IDs, list names, or bracketed titles in notes. Keep references human-friendly (e.g., "See: Manager approval reminder" instead of listing IDs).',
  '**Note formatting rules**: Apple Reminders does NOT render markdown. When creating reminder notes:',
  '  - Use plain text bullet points with "-" (hyphen), NOT markdown checkbox format "- [ ]"',
  '  - Example CORRECT format: "Checklist:\\n- Review status\\n- Test functionality\\n- Verify results"',
  '  - Example INCORRECT format: "Checklist:\\n- [ ] Review status\\n- [ ] Test functionality"',
  '  - Do NOT use markdown syntax like "- [ ]", "- [x]", "**bold**", "# headers", etc. in reminder notes',
  '  - Use simple plain text formatting: "-" for bullet points, line breaks for separation',
];

/**
 * Standard batching and idempotency constraints
 */
export const BATCHING_CONSTRAINTS = [
  'Run idempotency checks before creating anything: search for likely duplicates by normalized title (lowercase, trimmed, punctuation removed). Prefer updating an existing reminder over creating a duplicate.',
  'Batch tool calls when executing multiple changes to reduce overhead and keep actions atomic by concern (e.g., all creates, then updates).',
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
 * Deep work time block creation guidelines
 */
export const DEEP_WORK_CONSTRAINTS = [
  '**Deep work time block guidelines**:',
  '  - **When to create deep work blocks (trigger examples)**:',
  '    - Task note includes "Duration: 60分钟" or longer AND task has due date today → High confidence (90%) to create block',
  '    - Task title suggests cognitively demanding work (开发, 设计, 分析, 规划, 重构, 架构) with duration ≥60min → Medium-High confidence (75-85%)',
  '    - Multiple related tasks (same project/list) with explicit times due today, totaling ≥60min → High confidence (90%) to batch into single block',
  '    - Task notes mention "deep work", "focused time", "uninterrupted" → High confidence (85-90%)',
  '  - Time block length: 60-90 minutes. Tasks <60 minutes use Focus Sprint (15-30 min) instead.',
  '  - Scheduling: Peak energy hours (9am-12pm). Plan 2-3 blocks per day, totaling 2-4 hours.',
  '  - Break intervals: 15-20 minutes between blocks (NOT calendar events—implicit gaps only).',
  '  - Clear objectives: Each block has specific goal in notes.',
  '  - Anchor to due times: Start time = due time - duration. If past, move forward.',
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
 * Calendar permission troubleshooting guidelines
 */
export const CALENDAR_PERMISSION_CONSTRAINTS = [
  '**Calendar permission troubleshooting**: If calendar event creation fails, it may be due to insufficient permissions. macOS 14+ supports two permission levels: "Write-only" (can only create events) and "Full Access" (can create, read, and modify events). If creation fails, guide the user to:',
  '  - Open System Settings > Privacy & Security > Calendars',
  '  - Find and select the application (Terminal, Cursor, or the terminal app being used)',
  '  - Ensure "Full Access" is selected instead of "Write-only"',
  '  - Full Access permission is required for complete calendar functionality including reading existing events and modifying calendar properties',
];

/**
 * Time block creation strict rules
 */
export const TIME_BLOCK_CREATION_CONSTRAINTS = [
  '**Time block creation (CLEAR TRIGGERS)**: CREATE calendar.events time blocks immediately when tasks meet ANY of these criteria:',
  '  - Task has duration estimate ≥60 minutes (Deep Work category) with due date today',
  '  - Multiple related tasks with explicit times due today, totaling ≥60 minutes, that can be batched',
  '  - Task explicitly marked as requiring focused/uninterrupted time',
  '  - Task benefits from calendar visibility to prevent double-booking',
  '  - For HIGH CONFIDENCE (>80%): Execute calendar.events tool call immediately. Format: "HIGH CONFIDENCE (90%): Creating time block\\nTool: calendar.events\\nArgs: {action: \\"create\\", title: \\"Deep Work — Project Phoenix\\", startDate: \\"2025-11-04 14:00:00\\", endDate: \\"2025-11-04 16:00:00\\", targetCalendar: \\"Work\\", note: \\"Focused time for uninterrupted work\\"}"',
  '  - For MEDIUM CONFIDENCE (60-80%): Provide recommendation in tool call format. Format: "MEDIUM CONFIDENCE (70%): RECOMMENDATION - Create time block\\nSuggested tool call: calendar.events with {action: \\"create\\", title: \\"Deep Work — Project Phoenix\\", startDate: \\"2025-11-04 14:00:00\\", endDate: \\"2025-11-04 16:00:00\\"}\\nRationale: [brief explanation]"',
  '  - Always use local time format "YYYY-MM-DD HH:mm:ss" for startDate and endDate (e.g., "2025-11-04 14:00:00" for 2PM)',
  '  - Anchor calendar events to reminder due timestamps by subtracting duration to determine startDate. If start would be in the past, move forward but preserve duration.',
  '  - Name deep work blocks: "Deep Work — [Project Name]". Name focus sprints (15-30 min): "Focus Sprint — [Outcome]".',
  '  - When multiple tasks share a project, use single block with shared objective in notes.',
];

/**
 * Standard action queue output format
 */
export const getActionQueueFormat = (_currentDate: string): string[] => [
  '### Action queue — prioritized list of actions organized by confidence level (high/medium/low) and impact. IMPORTANT: High-confidence actions (>80%) should be EXECUTED immediately using MCP tool calls, not just described. Each action should specify:',
  '  - HIGH CONFIDENCE (>80%): Execute using tool calls. MEDIUM CONFIDENCE (60-80%): Provide recommendations in tool call format. LOW CONFIDENCE (<60%): Text description only, ask for confirmation.',
  '  - Each action must include: confidence level, action type (create/update/recommendation), exact properties (title, list, dueDate, note, url if applicable), and brief rationale',
  '  - Use local time format "YYYY-MM-DD HH:mm:ss" for dueDate (e.g., "2025-11-04 18:00:00"). Do NOT use UTC format with "Z" suffix.',
];

/**
 * Standard verification log format
 */
export const getVerificationLogFormat = (currentDate: string): string =>
  `### Verification log — bullet list confirming that each executed due date marked "today" uses ${currentDate} in the tool call output and persisted value (include reminder title + due date).`;

/**
 * Standard quality criteria for action execution
 */
export const ACTION_EXECUTION_QUALITY = [
  'Action queue prioritizes actions by confidence level and impact.',
  'High-confidence actions (>80%) are ACTUALLY EXECUTED using MCP tool calls, not just described. Medium-confidence actions are provided as recommendations in tool call format.',
  'Actions are clearly labeled with confidence levels (high >80%, medium 60-80%, low <60%) and include brief rationale.',
  'Time consistency is enforced: immediate actions have urgent due dates, quick wins have same-day due dates.',
  'Due dates and list assignments align with action urgency: critical blockers = urgent due dates + important list, quick wins = same-day due dates.',
];

/**
 * Build standard constraints block
 */
export const buildStandardConstraints = (): string[] => [
  ...CONFIDENCE_CONSTRAINTS,
  ...TIME_CONSISTENCY_CONSTRAINTS,
  ...NOTE_FORMATTING_CONSTRAINTS,
  ...BATCHING_CONSTRAINTS,
];

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
