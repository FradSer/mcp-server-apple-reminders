/**
 * urlHelpers.test.ts
 * Tests for URL handling utilities
 */

// Jest globals are available automatically
import {
  combineNoteWithUrl,
  extractNoteContent,
  extractUrlsFromNotes,
  formatNoteWithUrls,
  formatUrlSection,
  isValidUrl,
  parseReminderNote,
  removeUrlSections,
  updateNoteWithUrls,
} from './urlHelpers.js';

describe('extractUrlsFromNotes', () => {
  test('should extract URLs from structured format', () => {
    const notes = `Task notes here

URLs:
- https://example.com
- https://test.com`;

    const urls = extractUrlsFromNotes(notes);
    expect(urls).toEqual(['https://example.com', 'https://test.com']);
  });

  test('should extract single URL from structured format', () => {
    const notes = `Some note

URLs:
- https://single.com`;

    const urls = extractUrlsFromNotes(notes);
    expect(urls).toEqual(['https://single.com']);
  });

  test('should extract URLs from unstructured content as fallback', () => {
    const notes = 'Check https://example.com and https://test.com for info';

    const urls = extractUrlsFromNotes(notes);
    expect(urls).toEqual(['https://example.com', 'https://test.com']);
  });

  test('should return empty array for notes without URLs', () => {
    const notes = 'Just some text without any URLs';

    const urls = extractUrlsFromNotes(notes);
    expect(urls).toEqual([]);
  });

  test('should handle null/undefined notes', () => {
    expect(extractUrlsFromNotes(null)).toEqual([]);
    expect(extractUrlsFromNotes(undefined)).toEqual([]);
    expect(extractUrlsFromNotes('')).toEqual([]);
  });

  test('should handle mixed protocols', () => {
    const notes = `Check these

URLs:
- https://secure.com
- http://insecure.com`;

    const urls = extractUrlsFromNotes(notes);
    expect(urls).toEqual(['https://secure.com', 'http://insecure.com']);
  });

  test('should handle notes with multiple URL sections', () => {
    const notes = `Task description

URLs:
- https://first.com
- https://second.com

More content here

URLs:
- https://third.com
- https://fourth.com`;

    const urls = extractUrlsFromNotes(notes);
    expect(urls).toEqual([
      'https://first.com',
      'https://second.com',
      'https://third.com',
      'https://fourth.com',
    ]);
  });

  test('should handle notes with single URL in multiple sections', () => {
    const notes = `Task

URLs:
- https://example.com

Content

URLs:
- https://another.com`;

    const urls = extractUrlsFromNotes(notes);
    expect(urls).toEqual(['https://example.com', 'https://another.com']);
  });
});

describe('formatNoteWithUrls', () => {
  test('should format note with single URL', () => {
    const result = formatNoteWithUrls('Task description', [
      'https://example.com',
    ]);

    expect(result).toBe(`Task description

URLs:
- https://example.com`);
  });

  test('should format note with multiple URLs', () => {
    const result = formatNoteWithUrls('Task description', [
      'https://example.com',
      'https://test.com',
    ]);

    expect(result).toBe(`Task description

URLs:
- https://example.com
- https://test.com`);
  });

  test('should handle empty note with URLs', () => {
    const result = formatNoteWithUrls('', ['https://example.com']);

    expect(result).toBe(`URLs:
- https://example.com`);
  });

  test('should handle null/undefined note with URLs', () => {
    const result = formatNoteWithUrls(null, ['https://example.com']);

    expect(result).toBe(`URLs:
- https://example.com`);
  });

  test('should return note content when no URLs provided', () => {
    const result = formatNoteWithUrls('Just a note', []);

    expect(result).toBe('Just a note');
  });

  test('should filter out invalid URLs', () => {
    const result = formatNoteWithUrls('Task', [
      'https://valid.com',
      'invalid-url',
      'ftp://not-http.com',
      'http://valid-too.com',
    ]);

    expect(result).toBe(`Task

URLs:
- https://valid.com
- http://valid-too.com`);
  });

  test('should clean existing URL sections before adding new ones', () => {
    const noteWithExistingUrls = `Task description

URLs:
- https://old.com
- https://existing.com`;

    const result = formatNoteWithUrls(noteWithExistingUrls, [
      'https://new.com',
    ]);

    expect(result).toBe(`Task description

URLs:
- https://new.com`);
  });

  test('should handle multiple existing URL sections', () => {
    const noteWithMultipleUrlSections = `Task

URLs:
- https://first.com

Content

URLs:
- https://second.com`;

    const result = formatNoteWithUrls(noteWithMultipleUrlSections, [
      'https://replacement.com',
    ]);

    expect(result).toBe(`Task
Content

URLs:
- https://replacement.com`);
  });
});

describe('formatUrlSection', () => {
  test('should format single URL section', () => {
    const result = formatUrlSection(['https://example.com']);

    expect(result).toBe(`URLs:
- https://example.com`);
  });

  test('should format multiple URLs section', () => {
    const result = formatUrlSection([
      'https://example.com',
      'https://test.com',
    ]);

    expect(result).toBe(`URLs:
- https://example.com
- https://test.com`);
  });

  test('should return empty string for empty URLs', () => {
    const result = formatUrlSection([]);

    expect(result).toBe('');
  });
});

describe('removeUrlSections', () => {
  test('should remove structured URL section', () => {
    const notes = `Task description

URLs:
- https://example.com
- https://test.com`;

    const result = removeUrlSections(notes);
    expect(result).toBe('Task description');
  });

  test('should remove legacy URL format', () => {
    const notes = `Task description

URL: https://example.com`;

    const result = removeUrlSections(notes);
    expect(result).toBe('Task description');
  });

  test('should handle multiple URL sections', () => {
    const notes = `Task description

URLs:
- https://example.com

URL: https://legacy.com`;

    const result = removeUrlSections(notes);
    expect(result).toBe('Task description');
  });

  test('should handle null/undefined input', () => {
    expect(removeUrlSections(null)).toBe('');
    expect(removeUrlSections(undefined)).toBe('');
    expect(removeUrlSections('')).toBe('');
  });

  test('should preserve content without URL sections', () => {
    const notes = 'Just regular content';
    const result = removeUrlSections(notes);
    expect(result).toBe('Just regular content');
  });
});

describe('combineNoteWithUrl', () => {
  test('should combine note with URL', () => {
    const result = combineNoteWithUrl('Task note', 'https://example.com');

    expect(result).toBe(`Task note

URLs:
- https://example.com`);
  });

  test('should handle empty note with URL', () => {
    const result = combineNoteWithUrl('', 'https://example.com');

    expect(result).toBe(`URLs:
- https://example.com`);
  });

  test('should handle note without URL', () => {
    const result = combineNoteWithUrl('Just a note', null);
    expect(result).toBe('Just a note');
  });

  test('should handle invalid URL', () => {
    const result = combineNoteWithUrl('Note', 'invalid-url');
    expect(result).toBe('Note');
  });

  test('should handle null/undefined inputs', () => {
    expect(combineNoteWithUrl(null, null)).toBe('');
    expect(combineNoteWithUrl(undefined, undefined)).toBe('');
  });
});

describe('isValidUrl', () => {
  test('should validate https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('https://subdomain.example.com/path')).toBe(true);
    expect(isValidUrl('https://example.com:8080/path?query=value')).toBe(true);
  });

  test('should validate http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
  });

  test('should reject invalid URLs', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('invalid-url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl(null)).toBe(false);
    expect(isValidUrl(undefined)).toBe(false);
  });

  test('should reject non-string inputs', () => {
    expect(isValidUrl(123)).toBe(false);
    expect(isValidUrl({})).toBe(false);
    expect(isValidUrl([])).toBe(false);
  });
});

describe('extractNoteContent', () => {
  test('should extract note content without URLs', () => {
    const notes = `Important task

URLs:
- https://example.com`;

    const result = extractNoteContent(notes);
    expect(result).toBe('Important task');
  });

  test('should handle notes without URL sections', () => {
    const notes = 'Regular note content';
    const result = extractNoteContent(notes);
    expect(result).toBe('Regular note content');
  });

  test('should handle null/undefined', () => {
    expect(extractNoteContent(null)).toBe('');
    expect(extractNoteContent(undefined)).toBe('');
  });
});

describe('parseReminderNote', () => {
  test('should parse note with structured URLs', () => {
    const notes = `Task description

URLs:
- https://example.com
- https://test.com`;

    const result = parseReminderNote(notes);

    expect(result).toEqual({
      note: 'Task description',
      urls: ['https://example.com', 'https://test.com'],
    });
  });

  test('should parse note without URLs', () => {
    const notes = 'Just a regular note';

    const result = parseReminderNote(notes);

    expect(result).toEqual({
      note: 'Just a regular note',
      urls: [],
    });
  });

  test('should handle empty/null input', () => {
    expect(parseReminderNote(null)).toEqual({
      note: '',
      urls: [],
    });

    expect(parseReminderNote('')).toEqual({
      note: '',
      urls: [],
    });
  });
});

describe('updateNoteWithUrls', () => {
  test('should update note with new URLs', () => {
    const existingNotes = `Old task

URLs:
- https://old.com`;

    const result = updateNoteWithUrls(existingNotes, [
      'https://new.com',
      'https://another.com',
    ]);

    expect(result).toBe(`Old task

URLs:
- https://new.com
- https://another.com`);
  });

  test('should create note with URLs when existing is empty', () => {
    const result = updateNoteWithUrls('', ['https://new.com']);

    expect(result).toBe(`URLs:
- https://new.com`);
  });

  test('should handle empty URLs array', () => {
    const existingNotes = `Task with old URLs

URLs:
- https://old.com`;

    const result = updateNoteWithUrls(existingNotes, []);
    expect(result).toBe('Task with old URLs');
  });

  test('should handle null existing notes', () => {
    const result = updateNoteWithUrls(null, ['https://new.com']);

    expect(result).toBe(`URLs:
- https://new.com`);
  });
});
