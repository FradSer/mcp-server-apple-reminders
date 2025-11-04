-- AppleScript to request Calendar and Reminders permissions
-- This script will trigger macOS permission dialogs automatically
-- Usage: osascript scripts/request-permissions.applescript

-- Request Calendar permissions by attempting to access calendars
try
	tell application "Calendar"
		activate
		-- Attempt to access calendars - this will trigger permission dialog
		set calendarList to name of every calendar
		display notification "日历权限已授予" with title "权限申请成功"
	end tell
on error errorMessage
	-- Permission dialog will appear automatically
	-- Error is expected if permission is not granted
	if errorMessage does not contain "canceled" then
		display dialog "日历权限申请失败：" & errorMessage buttons {"确定"} default button "确定"
	end if
end try

-- Request Reminders permissions by attempting to access reminders
try
	tell application "Reminders"
		activate
		-- Attempt to access reminder lists - this will trigger permission dialog
		set reminderLists to name of every list
		display notification "提醒事项权限已授予" with title "权限申请成功"
	end tell
on error errorMessage
	-- Permission dialog will appear automatically
	-- Error is expected if permission is not granted
	if errorMessage does not contain "canceled" then
		display dialog "提醒事项权限申请失败：" & errorMessage buttons {"确定"} default button "确定"
	end if
end try

display dialog "权限申请完成！" & return & return & "请检查系统设置 > 隐私与安全性 > 日历/提醒事项" & return & "确保 Terminal 或您的终端应用已获得权限。" buttons {"确定"} default button "确定"




