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
 * Standard calendar integration constraints
 */
export const CALENDAR_INTEGRATION_CONSTRAINTS = [
  '**Time block creation (STRICT RULES)**: ONLY use the calendar.events tool when you have explicitly identified that a task requires a dedicated time block in your output. Do NOT use calendar.events tool for regular reminders or tasks that can be completed flexibly. Use calendar events ONLY when:',
  '  - You have explicitly identified in your analysis that a task needs a fixed time slot (e.g., "2-hour deep work session", "Scheduled code review block")',
  '  - The task benefits from calendar integration (visible in calendar apps, prevents double-booking)',
  '  - You have determined a specific start and end time that should be blocked',
  '  - You have stated in your output that you are creating a time block for this task',
  '  - **CRITICAL**: If you include "Time block:" or similar time block references in a reminder note, you MUST also create a calendar event for that time block. Do NOT mention time blocks in notes without creating the corresponding calendar event.',
  '  - When adjusting or creating multiple reminders due today with explicit due times, convert the cluster into calendar.events blocks aligned to those due windows to prevent overcommitment.',
];

/**
 * Standard batching and idempotency constraints
 */
export const BATCHING_CONSTRAINTS = [
  'Run idempotency checks before creating anything: search for likely duplicates by normalized title (lowercase, trimmed, punctuation removed). Prefer updating an existing reminder over creating a duplicate.',
  'Group actions for efficiency: Batch tool calls (creates/updates) in logical chunks to minimize the number of calls.',
  'Batch tool calls when executing multiple changes to reduce overhead and keep actions atomic by concern (e.g., all creates, then updates).',
  'Avoid duplicate reminders: perform a similarity check on titles before creating; if a near-duplicate exists, update or annotate instead of creating a new one.',
  'No duplicate reminders are created; similar items are merged or updated.',
  'Tool calls are batched sensibly; the number of calls is minimized while keeping actions atomic.',
];

/**
 * Time windows and task duration constants
 */
export const TIME_WINDOWS = {
  IMMEDIATE_HOURS: 2,
  QUICK_WIN_MINUTES: 15,
  QUICK_WIN_MAX_HOURS: 4,
  STANDARD_TASK_MIN_MINUTES: 30,
  STANDARD_TASK_MAX_MINUTES: 60,
  EOD_HOUR: 18,
  WORK_START_HOUR: 9,
  WORK_END_HOUR: 18,
} as const;

/**
 * Deep work configuration constants
 */
export const DEEP_WORK_CONFIG = {
  MIN_DURATION_MINUTES: 60,
  MAX_DURATION_MINUTES: 90,
  BREAK_MINUTES: 15,
  BREAK_MAX_MINUTES: 20,
  DAILY_BLOCKS_MIN: 2,
  DAILY_BLOCKS_MAX: 3,
  DAILY_TOTAL_HOURS_MIN: 2,
  DAILY_TOTAL_HOURS_MAX: 4,
  PEAK_START_HOUR: 9,
  PEAK_END_HOUR: 12,
} as const;

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
  '  - Time block length: 60-90 minutes recommended (avoid sessions shorter than 60 minutes as they are too brief to enter deep focus state; avoid sessions longer than 90 minutes to prevent fatigue). If the work fits inside a 15-30 minute burst, use the focus sprint guidance in TIME_BLOCK_CREATION_CONSTRAINTS instead of labeling it deep work.',
  '  - Scheduling priority: Place time blocks during peak energy hours (typically morning, 9am-12pm). Schedule 2-4 hours of deep work time total per day across multiple blocks (typically 2-3 blocks)',
  '  - Daily deep work capacity: Plan 2-3 deep work blocks per day, totaling 2-4 hours of deep work time (e.g., two 90-minute blocks = 3 hours, or three 60-minute blocks = 3 hours)',
  '  - Break intervals: Schedule 15-20 minute breaks between time blocks (these breaks are NOT calendar events—plan the pause without creating events). Do NOT create calendar events for breaks',
  '  - Distraction reduction: Include in notes: "Close notifications, inform others you are focusing, avoid email and social media"',
  '  - Clear objectives: Each time block should have a specific, clear goal stated in the notes. Include the specific objective or deliverable for that session',
  "  - Ensure the block spans the reminder's due time: start early enough that the session finishes exactly at or slightly before the due timestamp, or extend the block when the due time sits mid-session. Always anchor start times by subtracting the planned deep work duration from the due timestamp and move the window forward if that start would occur in the past.",
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
  '**Time block creation (STRICT RULES)**: ONLY use the calendar.events tool when you have explicitly identified that a task requires a dedicated time block in your output. Do NOT use calendar.events tool for regular reminders or tasks that can be completed flexibly. Use calendar events ONLY when:',
  '  - You have explicitly identified in your analysis that a task needs a fixed time slot (e.g., "2-hour deep work session", "Scheduled code review block")',
  '  - The task benefits from calendar integration (visible in calendar apps, prevents double-booking)',
  '  - You have determined a specific start and end time that should be blocked',
  '  - You have stated in your output that you are creating a time block for this task',
  '  - **CRITICAL**: If you include "Time block:" or similar time block references in a reminder note, you MUST also create a calendar event for that time block. Do NOT mention time blocks in notes without creating the corresponding calendar event.',
  '  - For HIGH CONFIDENCE (>80%) time blocks: Actually call the calendar.events tool with action="create". Format: "HIGH CONFIDENCE (90%): Creating time block\\nTool: calendar.events\\nArgs: {action: \\"create\\", title: \\"Deep Work — Project Phoenix\\", startDate: \\"2025-11-04 14:00:00\\", endDate: \\"2025-11-04 16:00:00\\", targetCalendar: \\"Work\\", note: \\"Focused time for uninterrupted work on Project Phoenix\\"}"',
  '  - For MEDIUM CONFIDENCE (60-80%) time blocks: Provide recommendation in tool call format. Format: "MEDIUM CONFIDENCE (70%): RECOMMENDATION - Create time block\\nSuggested tool call: calendar.events with {action: \\"create\\", title: \\"Deep Work — Project Phoenix\\", startDate: \\"2025-11-04 14:00:00\\", endDate: \\"2025-11-04 16:00:00\\", targetCalendar: \\"Work\\", note: \\"Focused time for uninterrupted work on Project Phoenix\\"}\\nRationale: [brief explanation]"',
  '  - Always use local time format "YYYY-MM-DD HH:mm:ss" for startDate and endDate (e.g., "2025-11-04 14:00:00" for today 2PM)',
  '  - Anchor calendar events to reminder due timestamps whenever they exist by subtracting the scheduled duration to determine the startDate. If that start would be in the past, move the window forward but preserve the duration.',
  '  - CRITICAL: If you mention "Time block:" in a reminder note, you MUST create the calendar event. If you are NOT creating a time block (neither in note nor calendar), use reminders.tasks tool only.',
  '  - For short-focus protection (15-30 minutes), create "Focus Sprint — [Outcome]" events sized to 15 or 30 minutes that finish at or just before the linked reminder due timestamp. Do not describe these shorter holds as deep work.',
  '  - Name deep work blocks using the pattern "Deep Work — [Project Name]" so the calendar highlights the project while allowing multiple related tasks within a single block.',
  '  - Clarify in notes when a deep work block spans multiple tasks for the same project; highlight the shared objective instead of individual task names.',
  '  - When adjusting or creating multiple reminders due today with explicit due times, convert the cluster into calendar.events blocks aligned to those due windows to prevent overcommitment.',
];

/**
 * Standard action queue output format
 */
export const getActionQueueFormat = (_currentDate: string): string[] => [
  '### Action queue — prioritized list of actions organized by confidence level (high/medium/low) and impact. IMPORTANT: High-confidence actions (>80%) should be EXECUTED immediately using MCP tool calls, not just described. Each action should specify:',
  '  - For HIGH CONFIDENCE (>80%): Actually call the tool with action="create" or action="update". Format: "HIGH CONFIDENCE (95%): Creating reminder\\nTool: reminders.tasks\\nArgs: {action: \\"create\\", title: \\"Submit report\\", targetList: \\"Work\\", dueDate: \\"2025-01-15 18:00:00\\", note: \\"CRITICAL: Blocked by - Need approval from manager first\\"}"',
  '  - For MEDIUM CONFIDENCE (60-80%): Provide recommendation in tool call format, marked as "RECOMMENDATION". Format: "MEDIUM CONFIDENCE (75%): RECOMMENDATION - Create reminder\\nSuggested tool call: reminders.tasks with {action: \\"create\\", title: \\"...\\", targetList: \\"...\\", dueDate: \\"YYYY-MM-DD HH:mm:ss\\"}\\nRationale: [brief explanation]"',
  '  - For LOW CONFIDENCE (<60%): Text description only, ask for confirmation. Format: "LOW CONFIDENCE (50%): Consider creating reminder for [task]. Should I proceed?"',
  '  - Each action must include: confidence level, action type (create/update/recommendation), exact properties (title, list, dueDate in format "YYYY-MM-DD HH:mm:ss" for local time, note if applicable, url if applicable), and brief rationale',
  '  - IMPORTANT: Use local time format "YYYY-MM-DD HH:mm:ss" for dueDate (e.g., "2025-11-04 18:00:00" for today 6PM). Do NOT use UTC format with "Z" suffix unless explicitly needed - this prevents timezone conversion errors.',
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
  ...CALENDAR_INTEGRATION_CONSTRAINTS,
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
