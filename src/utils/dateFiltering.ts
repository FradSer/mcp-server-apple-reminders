/**
 * dateFiltering.ts
 * Reusable utilities for filtering reminders by date criteria
 */

import type { Reminder } from '../types/index.js';
import { getTodayStart, getTomorrowStart, getWeekEnd } from './dateUtils.js';

/**
 * Date range filters for reminders
 */
export type DateFilter =
  | 'today'
  | 'tomorrow'
  | 'this-week'
  | 'overdue'
  | 'no-date';

/**
 * Date range boundaries
 */
interface DateBoundaries {
  today: Date;
  tomorrow: Date;
  weekEnd: Date;
}

/**
 * Creates standardized date boundaries for filtering operations
 */
function createDateBoundaries(): DateBoundaries {
  const today = getTodayStart();
  const tomorrow = getTomorrowStart();
  const weekEnd = getWeekEnd();

  return { today, tomorrow, weekEnd };
}

/**
 * Filters reminders based on due date criteria
 */
function filterRemindersByDate(
  reminders: Reminder[],
  filter: DateFilter,
): Reminder[] {
  if (filter === 'no-date') {
    return reminders.filter((reminder) => !reminder.dueDate);
  }

  const { today, tomorrow, weekEnd } = createDateBoundaries();

  return reminders.filter((reminder) => {
    if (!reminder.dueDate) return false;

    const dueDate = new Date(reminder.dueDate);

    switch (filter) {
      case 'overdue':
        return dueDate < today;

      case 'today':
        return dueDate >= today && dueDate < tomorrow;

      case 'tomorrow': {
        const dayAfterTomorrow = getTomorrowStart();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        return dueDate >= tomorrow && dueDate < dayAfterTomorrow;
      }

      case 'this-week':
        return dueDate >= today && dueDate <= weekEnd;

      default:
        return true;
    }
  });
}

/**
 * Filters for reminder search operations
 */
export interface ReminderFilters {
  showCompleted?: boolean;
  search?: string;
  dueWithin?: DateFilter;
  list?: string;
}

/**
 * Applies multiple filters to a list of reminders
 */
export function applyReminderFilters(
  reminders: Reminder[],
  filters: ReminderFilters,
): Reminder[] {
  let filteredReminders = [...reminders];

  // Filter by completion status
  if (filters.showCompleted !== undefined) {
    filteredReminders = filteredReminders.filter(
      (reminder) => filters.showCompleted || !reminder.isCompleted,
    );
  }

  // Filter by list
  if (filters.list) {
    filteredReminders = filteredReminders.filter(
      (reminder) => reminder.list === filters.list,
    );
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredReminders = filteredReminders.filter(
      (reminder) =>
        reminder.title.toLowerCase().includes(searchLower) ||
        reminder.notes?.toLowerCase().includes(searchLower),
    );
  }

  // Filter by due date
  if (filters.dueWithin) {
    filteredReminders = filterRemindersByDate(
      filteredReminders,
      filters.dueWithin,
    );
  }

  return filteredReminders;
}
