// 使用全局 Jest 函数，避免额外依赖

// Mock child_process and logger
const mockExecSync = jest.fn();
const mockDebugLog = jest.fn();

jest.mock('child_process', () => ({
  execSync: mockExecSync,
}));
jest.mock('./logger.js', () => ({
  debugLog: mockDebugLog,
}));

import {
  createRemindersScript,
  executeAppleScript,
  quoteAppleScriptString,
} from './applescript.js';

describe('AppleScript Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecSync.mockReturnValue(Buffer.from('test output'));
  });

  describe('quoteAppleScriptString', () => {
    test('should properly escape double quotes', () => {
      const input = 'String with "quotes"';
      const result = quoteAppleScriptString(input);

      expect(result).toBe('"String with \\"quotes\\""');
    });

    test('should properly escape single quotes', () => {
      const input = "String with 'apostrophes'";
      const result = quoteAppleScriptString(input);

      expect(result).toBe('"String with \'apostrophes\'"');
    });

    test('should properly escape backslashes', () => {
      const input = 'String with \\ backslashes';
      const result = quoteAppleScriptString(input);

      expect(result).toBe('"String with \\\\ backslashes"');
    });

    test('should handle mixed special characters', () => {
      const input = 'Complex "string\' with \\ all types';
      const result = quoteAppleScriptString(input);

      expect(result).toBe('"Complex \\"string\' with \\\\ all types"');
    });

    test('should handle empty string', () => {
      const input = '';
      const result = quoteAppleScriptString(input);

      expect(result).toBe('""');
    });

    test('should handle newlines and tabs', () => {
      const input = 'String with\nnewlines\tand tabs';
      const result = quoteAppleScriptString(input);

      expect(result).toBe('"String with\nnewlines\tand tabs"');
    });
  });

  describe('executeAppleScript', () => {
    test('should use heredoc syntax for security', () => {
      const script = 'tell application "Reminders" to get name of every list';

      executeAppleScript(script);

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining("osascript << 'EOF'"),
      );
      expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('EOF'));
    });

    test('should prevent shell injection via script content', () => {
      const maliciousScript = 'tell application "Reminders"; rm -rf /';

      executeAppleScript(maliciousScript);

      const callArgs = mockExecSync.mock.calls[0][0] as string;
      expect(callArgs).toContain("osascript << 'EOF'");
      expect(callArgs).toContain(maliciousScript);
      expect(callArgs).toContain('EOF');
      // Verify the malicious content is contained within the heredoc
      expect(callArgs).not.toMatch(/rm -rf \/ && /);
    });

    test('should handle script with single quotes safely', () => {
      const script = "tell application 'Reminders' to get lists";

      executeAppleScript(script);

      const callArgs = mockExecSync.mock.calls[0][0] as string;
      expect(callArgs).toContain("osascript << 'EOF'");
      expect(callArgs).toContain(script);
    });

    test('should return trimmed output', () => {
      mockExecSync.mockReturnValue(Buffer.from('  test output  \n'));

      const result = executeAppleScript('test script');

      expect(result).toBe('test output');
    });

    test('should handle execution errors gracefully', () => {
      const error = new Error('AppleScript execution failed');
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      expect(() => executeAppleScript('test script')).toThrow(
        'AppleScript execution failed',
      );
      expect(mockDebugLog).toHaveBeenCalledWith(
        'AppleScript execution error:',
        error,
      );
    });

    test('should handle scripts with heredoc-like content', () => {
      const script = 'tell app "Test" to do something << "EOF"';

      executeAppleScript(script);

      const callArgs = mockExecSync.mock.calls[0][0] as string;
      expect(callArgs).toContain("osascript << 'EOF'");
      expect(callArgs).toContain(script);
      expect(callArgs).toContain('\nEOF');
    });
  });

  describe('createRemindersScript', () => {
    test('should wrap script body with tell application block', () => {
      const scriptBody = 'get name of every list';
      const result = createRemindersScript(scriptBody);

      expect(result).toBe(
        'tell application "Reminders"\nget name of every list\nend tell',
      );
    });

    test('should handle empty script body', () => {
      const scriptBody = '';
      const result = createRemindersScript(scriptBody);

      expect(result).toBe('tell application "Reminders"\n\nend tell');
    });

    test('should handle multiline script body', () => {
      const scriptBody =
        'set targetList to list "Work"\nmake new reminder at end of targetList';
      const result = createRemindersScript(scriptBody);

      expect(result).toBe(
        'tell application "Reminders"\nset targetList to list "Work"\nmake new reminder at end of targetList\nend tell',
      );
    });
  });

  describe('Injection Prevention Integration Tests', () => {
    test('should prevent command injection through malicious reminder title', () => {
      const maliciousTitle = 'Test"; rm -rf /; echo "';
      const quotedTitle = quoteAppleScriptString(maliciousTitle);
      const scriptBody = `set reminderProps to {name:${quotedTitle}}`;
      const fullScript = createRemindersScript(scriptBody);

      executeAppleScript(fullScript);

      const callArgs = mockExecSync.mock.calls[0][0] as string;
      expect(callArgs).toContain("osascript << 'EOF'");
      // The malicious content should be properly escaped and contained within the heredoc
      expect(callArgs).toContain('Test\\"; rm -rf /; echo \\"');
      // Verify it's within the AppleScript context, not executed as shell commands
      expect(callArgs).toMatch(
        /tell application "Reminders"[\s\S]*Test\\"; rm -rf \/; echo \\"[\s\S]*end tell/,
      );
    });

    test('should prevent injection through malicious list name', () => {
      const maliciousListName = 'Work`; rm -rf /; echo `';
      const quotedListName = quoteAppleScriptString(maliciousListName);
      const scriptBody = `set targetList to list ${quotedListName}`;
      const fullScript = createRemindersScript(scriptBody);

      executeAppleScript(fullScript);

      const callArgs = mockExecSync.mock.calls[0][0] as string;
      expect(callArgs).toContain('Work`; rm -rf /; echo `');
      // Verify it's properly contained within the AppleScript heredoc
      expect(callArgs).toMatch(
        /tell application "Reminders"[\s\S]*Work`; rm -rf \/; echo `[\s\S]*end tell/,
      );
    });

    test('should prevent injection through malicious note content', () => {
      const maliciousNote =
        'Note content\'; tell application "System Events" to do shell script "rm -rf /"; \'';
      const quotedNote = quoteAppleScriptString(maliciousNote);
      const scriptBody = `set reminderProps to {body:${quotedNote}}`;
      const fullScript = createRemindersScript(scriptBody);

      executeAppleScript(fullScript);

      const callArgs = mockExecSync.mock.calls[0][0] as string;
      expect(callArgs).toContain("Note content\\'; tell application");
      // Verify it's contained within the AppleScript heredoc and not executed as separate commands
      expect(callArgs).toMatch(
        /tell application "Reminders"[\s\S]*Note content\\'; tell application[\s\S]*end tell/,
      );
    });

    test('should handle unicode and special characters safely', () => {
      const unicodeTitle = 'Task with émojis 🚀 and unicode ñáéíóú';
      const quotedTitle = quoteAppleScriptString(unicodeTitle);
      const scriptBody = `set reminderProps to {name:${quotedTitle}}`;
      const fullScript = createRemindersScript(scriptBody);

      executeAppleScript(fullScript);

      const callArgs = mockExecSync.mock.calls[0][0] as string;
      expect(callArgs).toContain(unicodeTitle);
    });
  });
});
