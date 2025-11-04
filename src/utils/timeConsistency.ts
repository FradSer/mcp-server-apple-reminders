/**
 * timeConsistency.ts
 * Time consistency validation and priority alignment utilities
 */

/**
 * Action urgency indicators
 */
export type ActionUrgency =
  | 'right-now'
  | 'immediate'
  | 'critical-blocker'
  | 'urgent'
  | 'today'
  | 'quick-win'
  | 'normal'
  | 'low-priority';

/**
 * Time consistency validation result
 */
export interface TimeConsistencyResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  correctedDueDate?: string;
  correctedPriority?: string;
}

/**
 * Priority levels for consistency mapping
 */
export type PriorityLevel = 'high' | 'medium' | 'low';

/**
 * Detect action urgency from action description
 */
export function detectActionUrgency(actionDescription: string): ActionUrgency {
  const description = actionDescription.toLowerCase();

  // Check for immediate/critical indicators
  if (description.includes('right now') || description.includes('right-now')) {
    return 'right-now';
  }
  if (
    description.includes('immediate') ||
    description.includes('立刻') ||
    description.includes('立即')
  ) {
    return 'immediate';
  }
  if (
    description.includes('critical blocker') ||
    description.includes('critical-blocker')
  ) {
    return 'critical-blocker';
  }
  if (
    description.includes('urgent') ||
    description.includes('紧急') ||
    description.includes('asap')
  ) {
    return 'urgent';
  }

  // Check for same-day indicators
  if (
    description.includes('today') ||
    description.includes('今天') ||
    description.includes('本日')
  ) {
    return 'today';
  }
  if (
    description.includes('quick win') ||
    description.includes('quick-win') ||
    description.includes('15 minutes')
  ) {
    return 'quick-win';
  }

  // Check for low priority indicators
  if (
    description.includes('low priority') ||
    description.includes('可以稍后') ||
    description.includes('later')
  ) {
    return 'low-priority';
  }

  return 'normal';
}

/**
 * Determine appropriate due date based on urgency and current time
 */
export function calculateAppropriateDueDate(
  urgency: ActionUrgency,
  currentTime: Date,
): string {
  const currentHour = currentTime.getHours();
  const isWorkingHours = currentHour >= 9 && currentHour < 18;

  switch (urgency) {
    case 'right-now':
    case 'immediate': {
      // Within 2 hours
      const twoHoursLater = new Date(currentTime);
      twoHoursLater.setHours(twoHoursLater.getHours() + 2);
      return formatDueDate(twoHoursLater);
    }

    case 'critical-blocker':
    case 'urgent': {
      // Within 4 hours or end of work day
      const fourHoursLater = new Date(currentTime);
      fourHoursLater.setHours(fourHoursLater.getHours() + 4);

      const endOfWorkDay = new Date(currentTime);
      endOfWorkDay.setHours(17, 30, 0, 0); // 5:30 PM

      const urgentDueDate =
        isWorkingHours && fourHoursLater > endOfWorkDay
          ? endOfWorkDay
          : fourHoursLater;
      return formatDueDate(urgentDueDate);
    }

    case 'today':
    case 'quick-win': {
      // Before end of work day (6 PM) or within 4 hours for quick wins
      const endOfDay = new Date(currentTime);
      endOfDay.setHours(17, 45, 0, 0); // 5:45 PM

      if (urgency === 'quick-win') {
        const quickWinDue = new Date(currentTime);
        quickWinDue.setHours(Math.min(currentHour + 4, 17), 30, 0, 0);
        return formatDueDate(quickWinDue);
      }

      return formatDueDate(endOfDay);
    }

    case 'normal': {
      // Tomorrow or next working day
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0); // 10 AM next day
      return formatDueDate(tomorrow);
    }

    case 'low-priority': {
      // 2-3 days from now
      const fewDaysLater = new Date(currentTime);
      fewDaysLater.setDate(fewDaysLater.getDate() + 2);
      fewDaysLater.setHours(10, 0, 0, 0);
      return formatDueDate(fewDaysLater);
    }

    default: {
      // Default to tomorrow
      const defaultTomorrow = new Date(currentTime);
      defaultTomorrow.setDate(defaultTomorrow.getDate() + 1);
      defaultTomorrow.setHours(10, 0, 0, 0);
      return formatDueDate(defaultTomorrow);
    }
  }
}

/**
 * Map urgency to priority level
 */
export function mapUrgencyToPriority(urgency: ActionUrgency): PriorityLevel {
  switch (urgency) {
    case 'right-now':
    case 'immediate':
    case 'critical-blocker':
      return 'high';
    case 'urgent':
    case 'today':
      return 'high';
    case 'quick-win':
      return 'medium';
    case 'normal':
      return 'medium';
    case 'low-priority':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Validate time consistency between action description and reminder properties
 */
export function validateTimeConsistency(
  actionDescription: string,
  dueDate?: string,
  priority?: string,
): TimeConsistencyResult {
  const urgency = detectActionUrgency(actionDescription);
  const currentTime = new Date();
  const appropriateDueDate = calculateAppropriateDueDate(urgency, currentTime);
  const appropriatePriority = mapUrgencyToPriority(urgency);

  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check if due date exists and is appropriate
  if (!dueDate) {
    issues.push('Missing due date for time-sensitive action');
    suggestions.push(`Set due date to: ${appropriateDueDate}`);
  } else {
    const dueDateTime = parseDueDate(dueDate);
    if (dueDateTime) {
      const hoursDifference =
        (dueDateTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

      // Validate consistency
      switch (urgency) {
        case 'right-now':
        case 'immediate':
          if (hoursDifference > 4) {
            issues.push(
              `Immediate action has distant due date (${hoursDifference.toFixed(1)} hours away)`,
            );
            suggestions.push(`Change due date to: ${appropriateDueDate}`);
          }
          break;

        case 'critical-blocker':
        case 'urgent':
          if (hoursDifference > 6) {
            issues.push(`Urgent action has non-urgent due date`);
            suggestions.push(`Change due date to: ${appropriateDueDate}`);
          }
          break;

        case 'quick-win':
          if (hoursDifference > 8 || !isSameDay(currentTime, dueDateTime)) {
            issues.push(`Quick win should be completed same day`);
            suggestions.push(`Change due date to: ${appropriateDueDate}`);
          }
          break;

        case 'today':
          if (!isSameDay(currentTime, dueDateTime)) {
            issues.push(`"Today" action scheduled for different day`);
            suggestions.push(`Change due date to: ${appropriateDueDate}`);
          }
          break;
      }
    }
  }

  // Check priority alignment
  if (priority) {
    const expectedPriority = appropriatePriority;
    if (
      priority.toLowerCase() !== expectedPriority &&
      !(
        (priority === 'high' && expectedPriority === 'medium') ||
        (priority === 'medium' && expectedPriority === 'low')
      )
    ) {
      issues.push(`Priority "${priority}" doesn't match action urgency`);
      suggestions.push(`Consider setting priority to: ${expectedPriority}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    correctedDueDate: issues.some((issue) => issue.includes('due date'))
      ? appropriateDueDate
      : undefined,
    correctedPriority: issues.some((issue) => issue.includes('Priority'))
      ? appropriatePriority
      : undefined,
  };
}

/**
 * Helper functions
 */
function formatDueDate(date: Date): string {
  return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
}

function parseDueDate(dueDate: string): Date | null {
  try {
    return new Date(dueDate);
  } catch {
    return null;
  }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Generate time consistency report for multiple actions
 */
export function generateTimeConsistencyReport(
  actions: Array<{
    description: string;
    dueDate?: string;
    priority?: string;
  }>,
): string {
  const reports = actions.map((action, index) => {
    const validation = validateTimeConsistency(
      action.description,
      action.dueDate,
      action.priority,
    );

    let report = `Action ${index + 1}: "${action.description}"\n`;
    report += `  Urgency: ${detectActionUrgency(action.description)}\n`;

    if (validation.isValid) {
      report += `  ✅ Time consistency: VALID\n`;
    } else {
      report += `  ❌ Time consistency: INVALID\n`;
      validation.issues.forEach((issue) => {
        report += `    Issue: ${issue}\n`;
      });
      validation.suggestions.forEach((suggestion) => {
        report += `    Suggestion: ${suggestion}\n`;
      });
    }

    return report;
  });

  return reports.join('\n');
}
