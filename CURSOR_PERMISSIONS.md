# Cursor/Claude Desktop Permission Setup Guide

## The Problem

When MCP servers are launched as subprocesses from GUI applications like Cursor or Claude Desktop, macOS's TCC (Transparency, Consent, and Control) system attributes permission requests to the **parent application** (Cursor), not the actual process that needs access (EventKitCLI).

This causes permission dialogs to NOT appear because:
1. Cursor doesn't have `NSCalendarsUsageDescription` or `NSRemindersUsageDescription` in its Info.plist
2. macOS determines the "responsible process" based on the parent-child relationship
3. Without proper usage descriptions, TCC silently blocks access without showing dialogs

## Solution Options

### Option 1: Pre-authorize from Terminal (Recommended)

Run the MCP server's permission helper script **from your terminal** before configuring it in Cursor:

```bash
cd /Users/FradSer/.mcp-server/mcp-server-apple-reminders
node scripts/request-permissions.mjs
```

When you run this from Terminal:
- Terminal.app (or iTerm/your terminal) will be the responsible process
- macOS **will** show permission dialogs with our custom messages
- Once granted, the permissions apply to the EventKitCLI binary itself
- The MCP server will work in Cursor after this setup

### Option 2: Manual TCC Database Grant (Advanced)

If the above doesn't work, you can manually grant permissions:

```bash
# Reset TCC permissions for testing (removes all EventKit permissions)
tccutil reset Calendar
tccutil reset Reminders

# Manually run the CLI to trigger permission prompts
./bin/EventKitCLI --action permission-status --target calendar
./bin/EventKitCLI --action permission-status --target reminders
```

Then check System Settings:
1. Open **System Settings > Privacy & Security > Calendars**
2. Look for "node", "EventKitCLI", or your terminal app
3. Ensure it's checked/enabled
4. Repeat for **Reminders** section

### Option 3: Full Disk Access for Cursor (Nuclear Option)

If you're comfortable with it, you can grant Cursor "Full Disk Access":

1. Open **System Settings > Privacy & Security > Full Disk Access**
2. Click the lock icon and authenticate
3. Click the "+" button and add Cursor.app
4. Restart Cursor

⚠️ **Warning**: This gives Cursor access to ALL files on your system, which may be more than necessary.

## Verification

After setup, verify permissions are working:

```bash
# Check calendar permission status
./bin/EventKitCLI --action permission-status --target calendar

# Should return:
# {
#   "status": "success",
#   "result": {
#     "scope": "calendar",
#     "status": "fullAccess",  # or "authorized"
#     "promptAllowed": false,
#     "instructions": "Full access already granted for Calendar."
#   }
# }
```

## Why This Happens

This is a known limitation of how macOS handles subprocess permissions:

1. **Responsible Process Attribution**: When Cursor spawns the MCP server as a subprocess, macOS TCC determines Cursor is the "responsible process"
2. **Missing Usage Descriptions**: Cursor's Info.plist doesn't contain `NSCalendarsUsageDescription` or `NSRemindersUsageDescription`
3. **Silent Failure**: Without these keys, macOS doesn't show permission dialogs and silently denies access

### Technical Details

The proper solution requires using the undocumented macOS API `responsibility_spawnattrs_setdisclaim()` with `posix_spawn()` to break the TCC attribution chain. This is what Firefox, LLDB, and Qt Creator do.

However, Node.js's `child_process.spawn()` doesn't expose this functionality, so we need one of the workarounds above.

References:
- [The Curious Case of the Responsible Process](https://www.qt.io/blog/the-curious-case-of-the-responsible-process)
- [Mozilla Bug: Disclaim native messaging helpers](https://bugzilla.mozilla.org/show_bug.cgi?id=1576733)
- [Lenticular Zone: Manually granting calendar permissions to Claude](https://lenticular.zone/macos-tcc-claude-mcp/)

## Future Improvements

We're exploring native Node.js addon solutions that use `posix_spawn` with the disclaim flag directly, which would eliminate the need for manual permission setup.
