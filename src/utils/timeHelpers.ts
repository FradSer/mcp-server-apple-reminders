/**
 * timeHelpers.ts
 * Time formatting and context utilities for prompt templates
 */

/**
 * Time context information for prompts
 */
export interface TimeContext {
  /** Current date and time in ISO format */
  currentDateTime: string;
  /** Current date in YYYY-MM-DD format */
  currentDate: string;
  /** Current time in HH:MM format */
  currentTime: string;
  /** Day of the week (Monday, Tuesday, etc.) */
  dayOfWeek: string;
  /** Whether it's currently working hours (9am-6pm) */
  isWorkingHours: boolean;
  /** Time of day description */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Formatted time description for prompts */
  timeDescription: string;
}

/**
 * Get comprehensive time context for prompt templates
 */
export function getTimeContext(): TimeContext {
  const now = new Date();

  // Date and time formatting
  const currentDateTime = now.toISOString();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  // Day of week
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

  // Working hours check (9am-6pm)
  const hour = now.getHours();
  const isWorkingHours = hour >= 9 && hour < 18;

  // Time of day categorization
  let timeOfDay: TimeContext['timeOfDay'];
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  // Human-readable time description
  const timeDescription = formatTimeDescription(
    now,
    dayOfWeek,
    timeOfDay,
    isWorkingHours,
  );

  return {
    currentDateTime,
    currentDate,
    currentTime,
    dayOfWeek,
    isWorkingHours,
    timeOfDay,
    timeDescription,
  };
}

/**
 * Create a human-readable time description for prompts
 */
function formatTimeDescription(
  now: Date,
  dayOfWeek: string,
  timeOfDay: TimeContext['timeOfDay'],
  isWorkingHours: boolean,
): string {
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  let description = `Current time: ${dayOfWeek} at ${timeStr}`;

  // Add context about time of day
  switch (timeOfDay) {
    case 'morning':
      description += ' (morning)';
      break;
    case 'afternoon':
      description += ' (afternoon)';
      break;
    case 'evening':
      description += ' (evening)';
      break;
    case 'night':
      description += ' (night)';
      break;
  }

  // Add working hours context
  if (isWorkingHours) {
    description += ' - working hours';
  } else {
    description += ' - outside working hours';
  }

  return description;
}

/**
 * Format a relative time description for scheduling
 */
export function formatRelativeTime(targetDate: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const targetDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  );

  if (targetDay.getTime() === today.getTime()) {
    return `today at ${targetDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  } else if (targetDay.getTime() === tomorrow.getTime()) {
    return `tomorrow at ${targetDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  } else {
    return targetDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}

/**
 * Get fuzzy time suggestions based on current time
 */
export function getFuzzyTimeSuggestions(): {
  laterToday: string;
  tomorrow: string;
  endOfWeek: string;
  nextWeek: string;
} {
  const now = new Date();
  const hour = now.getHours();

  // Later today
  const laterToday = new Date(now);
  laterToday.setHours(Math.min(hour + 4, 17), 0, 0, 0);

  // Tomorrow morning
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  // End of week (Friday 5pm)
  const endOfWeek = new Date(now);
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilFriday =
    currentDay === 0 ? 5 : currentDay <= 5 ? 5 - currentDay : 12 - currentDay;
  endOfWeek.setDate(now.getDate() + daysUntilFriday);
  endOfWeek.setHours(17, 0, 0, 0);

  // Next week
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  nextWeek.setHours(9, 0, 0, 0);

  return {
    laterToday: formatRelativeTime(laterToday),
    tomorrow: formatRelativeTime(tomorrow),
    endOfWeek: formatRelativeTime(endOfWeek),
    nextWeek: formatRelativeTime(nextWeek),
  };
}
