import Foundation
import Dispatch
import EventKit

// MARK: - Output Structures & JSON Models
struct StandardOutput<T: Codable>: Codable { let status = "success"; let result: T }
struct ErrorOutput: Codable { let status = "error"; let message: String }
struct ReadResult: Codable { let lists: [ListJSON]; let reminders: [ReminderJSON] }
struct DeleteResult: Codable { let id: String; let deleted = true }
struct DeleteListResult: Codable { let title: String; let deleted = true }
struct ReminderJSON: Codable { let id: String, title: String, isCompleted: Bool, list: String, notes: String?, url: String?, dueDate: String? }
struct ListJSON: Codable { let id: String, title: String }
struct EventJSON: Codable { let id: String, title: String, calendar: String, startDate: String, endDate: String, notes: String?, location: String?, url: String?, isAllDay: Bool }
struct CalendarJSON: Codable { let id: String, title: String }
struct EventsReadResult: Codable { let calendars: [CalendarJSON]; let events: [EventJSON] }

// MARK: - Date Parsing Helper (Robust Implementation)
private func parseDateComponents(from dateString: String) -> DateComponents? {
    // First, try ISO8601DateFormatter for formats with explicit timezone (Z or +HH:MM/-HH:MM)
    // This handles UTC and timezone-aware formats correctly
    if dateString.contains("Z") || (dateString.contains("+") || dateString.contains("-")) && dateString.range(of: #"T\d{2}:\d{2}"#, options: .regularExpression) != nil {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let isoDate = isoFormatter.date(from: dateString) {
            // Convert to local timezone components
            // This ensures UTC times are correctly converted to local timezone for storage
            let components: Set<Calendar.Component> = dateString.contains(":") || dateString.contains("T") 
                ? [.year, .month, .day, .hour, .minute, .second]
                : [.year, .month, .day]
            return Calendar.current.dateComponents(components, from: isoDate)
        } else {
            // Try without fractional seconds
            isoFormatter.formatOptions = [.withInternetDateTime]
            if let isoDate = isoFormatter.date(from: dateString) {
                let components: Set<Calendar.Component> = dateString.contains(":") || dateString.contains("T")
                    ? [.year, .month, .day, .hour, .minute, .second]
                    : [.year, .month, .day]
                return Calendar.current.dateComponents(components, from: isoDate)
            }
        }
    }
    
    // For formats without explicit timezone (assumed to be local time)
    // This is the preferred format: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX") // Best practice for fixed formats
    formatter.timeZone = TimeZone.current // Use local timezone - CRITICAL for correct parsing

    // Support multiple date formats for flexibility with LLM inputs
    let formatsToTry = [
        // ISO 8601 formats without timezone (treated as local)
        "yyyy-MM-dd'T'HH:mm:ss", // 2025-10-30T18:00:00 (local time)
        "yyyy-MM-dd'T'HH:mm", // 2025-10-30T18:00 (local time)
        // Standard formats (preferred - most explicit)
        "yyyy-MM-dd HH:mm:ss", // 2025-10-30 18:00:00 (local time)
        "yyyy-MM-dd HH:mm", // 2025-10-30 18:00 (local time)
        "yyyy-MM-dd" // 2025-10-30 (date only)
    ]

    var date: Date?
    for format in formatsToTry {
        formatter.dateFormat = format
        if let parsedDate = formatter.date(from: dateString) {
            date = parsedDate
            break
        }
    }

    guard let validDate = date else { return nil }

    // Determine which components to include based on the original string
    let hasTime = dateString.contains(":") || dateString.contains("T")
    let components: Set<Calendar.Component> = hasTime
        ? [.year, .month, .day, .hour, .minute, .second]
        : [.year, .month, .day]
    
    // Extract components in local timezone - this ensures the stored time matches user intent
    return Calendar.current.dateComponents(components, from: validDate)
}

// MARK: - RemindersManager Class
class RemindersManager {
    private let eventStore = EKEventStore()

    // MARK: - Permission Status Checking (Best Practice)
    func checkRemindersAuthorizationStatus() -> EKAuthorizationStatus {
        return EKEventStore.authorizationStatus(for: .reminder)
    }
    
    func checkCalendarAuthorizationStatus() -> EKAuthorizationStatus {
        return EKEventStore.authorizationStatus(for: .event)
    }

    func requestAccess(completion: @escaping (Bool, Error?) -> Void) {
        if #available(macOS 14.0, *) { eventStore.requestFullAccessToReminders(completion: completion) }
        else { eventStore.requestAccess(to: .reminder, completion: completion) }
    }
    
    func requestCalendarAccess(completion: @escaping (Bool, Error?) -> Void) {
        if #available(macOS 14.0, *) {
            eventStore.requestFullAccessToEvents(completion: completion)
        } else {
            eventStore.requestAccess(to: .event, completion: completion)
        }
    }
    
    private func findReminder(withId id: String) -> EKReminder? { eventStore.calendarItem(withIdentifier: id) as? EKReminder }

    private func findList(named name: String?) throws -> EKCalendar {
        guard let listName = name, !listName.isEmpty else { return eventStore.defaultCalendarForNewReminders()! }
        guard let list = eventStore.calendars(for: .reminder).first(where: { $0.title == listName }) else {
            throw NSError(domain: "", code: 404, userInfo: [NSLocalizedDescriptionKey: "List '\(listName)' not found."])
        }
        return list
    }

    // MARK: Actions
    func getLists() -> [ListJSON] {
        return eventStore.calendars(for: .reminder).map { $0.toJSON() }
    }

    func getReminders(showCompleted: Bool, filterList: String?, search: String?, dueWithin: String?) throws -> [ReminderJSON] {
        let predicate = eventStore.predicateForReminders(in: nil)
        let semaphore = DispatchSemaphore(value: 0)
        var fetchedReminders: [EKReminder]?
        eventStore.fetchReminders(matching: predicate) { reminders in fetchedReminders = reminders; semaphore.signal() }
        semaphore.wait()
        
        guard let reminders = fetchedReminders else { return [] }
        
        var filtered = reminders
        if !showCompleted { filtered = filtered.filter { !$0.isCompleted } }
        if let listName = filterList { filtered = filtered.filter { $0.calendar.title == listName } }
        if let searchTerm = search?.lowercased() { 
            filtered = filtered.filter { 
                $0.title.lowercased().contains(searchTerm) || ($0.notes?.lowercased().contains(searchTerm) ?? false)
            }
        }
        if let dueFilter = dueWithin {
            let now = Date()
            let todayStart = Calendar.current.startOfDay(for: now)
            filtered = filtered.filter { reminder in
                guard let dueDate = reminder.dueDateComponents?.date else { return dueFilter == "no-date" }
                if dueFilter == "overdue" { return dueDate < todayStart }
                if dueFilter == "today" { return Calendar.current.isDateInToday(dueDate) }
                if dueFilter == "tomorrow" { return Calendar.current.isDateInTomorrow(dueDate) }
                if dueFilter == "this-week" { 
                    guard let weekInterval = Calendar.current.dateInterval(of: .weekOfYear, for: now) else { return false }
                    return weekInterval.contains(dueDate)
                }
                return false
            }
        }
        return filtered.map { $0.toJSON() }
    }

    func createReminder(title: String, listName: String?, notes: String?, urlString: String?, dueDateString: String?) throws -> ReminderJSON {
        let reminder = EKReminder(eventStore: eventStore)
        reminder.calendar = try findList(named: listName)
        reminder.title = title
        
        // Handle URL: store in both URL field and append to notes
        var finalNotes = notes
        if let urlStr = urlString, !urlStr.isEmpty, let url = URL(string: urlStr) {
            reminder.url = url
            // Append URL to notes only if it doesn't already exist
            let urlInNotes = notes?.contains(urlStr) ?? false
            if !urlInNotes {
                if let existingNotes = notes, !existingNotes.isEmpty {
                    finalNotes = existingNotes + "\n\nURLs:\n- " + urlStr
                } else {
                    finalNotes = "URLs:\n- " + urlStr
                }
            }
        }
        if let finalNotes = finalNotes { reminder.notes = finalNotes }
        
        if let dateStr = dueDateString { reminder.dueDateComponents = parseDateComponents(from: dateStr) }
        try eventStore.save(reminder, commit: true)
        return reminder.toJSON()
    }

    func updateReminder(id: String, newTitle: String?, listName: String?, notes: String?, urlString: String?, isCompleted: Bool?, dueDateString: String?) throws -> ReminderJSON {
        guard let reminder = findReminder(withId: id) else { throw NSError(domain: "", code: 404, userInfo: [NSLocalizedDescriptionKey: "ID '\(id)' not found."]) }
        if let newTitle = newTitle { reminder.title = newTitle }
        
        // Handle URL: store in both URL field and append to notes
        var finalNotes: String?
        
        if let urlStr = urlString, !urlStr.isEmpty, let url = URL(string: urlStr) {
            reminder.url = url  // Store single URL in URL field
            // If new notes provided and doesn't contain URL, append URL to new notes
            if let newNotes = notes {
                let urlInNewNotes = newNotes.contains(urlStr)
                if !urlInNewNotes {
                    // Append URL to new notes
                    finalNotes = newNotes.isEmpty ? "URLs:\n- " + urlStr : newNotes + "\n\nURLs:\n- " + urlStr
                } else {
                    finalNotes = newNotes
                }
            } else {
                // No new notes provided, check if URL exists in existing notes
                let urlInOriginalNotes = reminder.notes?.contains(urlStr) ?? false
                if !urlInOriginalNotes {
                    if let existingNotes = reminder.notes, !existingNotes.isEmpty {
                        finalNotes = existingNotes + "\n\nURLs:\n- " + urlStr
                    } else {
                        finalNotes = "URLs:\n- " + urlStr
                    }
                } else {
                    finalNotes = reminder.notes
                }
            }
        } else if let newNotes = notes {
            // No URL provided but new notes provided
            finalNotes = newNotes
        } else {
            // No URL and no new notes, keep existing notes
            finalNotes = reminder.notes
        }
        
        if let finalNotes = finalNotes { reminder.notes = finalNotes }
        
        if let isCompleted = isCompleted { reminder.isCompleted = isCompleted }
        if let listName = listName { reminder.calendar = try findList(named: listName) }
        if let dateStr = dueDateString { reminder.dueDateComponents = parseDateComponents(from: dateStr) }
        try eventStore.save(reminder, commit: true)
        return reminder.toJSON()
    }

    func deleteReminder(id: String) throws {
        guard let reminder = findReminder(withId: id) else {
            throw NSError(domain: "", code: 404, userInfo: [NSLocalizedDescriptionKey: "Reminder with ID '\(id)' not found."])
        }
        try eventStore.remove(reminder, commit: true)
    }
    func createList(title: String) throws -> ListJSON { let list = EKCalendar(for: .reminder, eventStore: eventStore); list.title = title; try eventStore.saveCalendar(list, commit: true); return list.toJSON() }
    func updateList(currentName: String, newName: String) throws -> ListJSON { let list = try findList(named: currentName); list.title = newName; try eventStore.saveCalendar(list, commit: true); return list.toJSON() }
    func deleteList(title: String) throws { try eventStore.removeCalendar(try findList(named: title), commit: true) }
    
    // MARK: Calendar Events Management
    private func findCalendar(named name: String?) throws -> EKCalendar {
        guard let calName = name, !calName.isEmpty else {
            guard let defaultCal = eventStore.defaultCalendarForNewEvents else {
                throw NSError(domain: "", code: 404, userInfo: [NSLocalizedDescriptionKey: "No default calendar available."])
            }
            return defaultCal
        }
        guard let calendar = eventStore.calendars(for: .event).first(where: { $0.title == calName }) else {
            throw NSError(domain: "", code: 404, userInfo: [NSLocalizedDescriptionKey: "Calendar '\(calName)' not found."])
        }
        return calendar
    }
    
    func getCalendars() -> [CalendarJSON] {
        return eventStore.calendars(for: .event).map { $0.toCalendarJSON() }
    }
    
    func getEvents(startDate: Date?, endDate: Date?, calendarName: String?, search: String?) throws -> [EventJSON] {
        let calendars = calendarName != nil ? [try findCalendar(named: calendarName)] : eventStore.calendars(for: .event)
        let predicate = eventStore.predicateForEvents(withStart: startDate ?? Date.distantPast, end: endDate ?? Date.distantFuture, calendars: calendars)
        
        let events = eventStore.events(matching: predicate)
        var filtered = events
        
        if let searchTerm = search?.lowercased() {
            filtered = filtered.filter {
                $0.title.lowercased().contains(searchTerm) || 
                ($0.notes?.lowercased().contains(searchTerm) ?? false) ||
                ($0.location?.lowercased().contains(searchTerm) ?? false)
            }
        }
        
        return filtered.map { $0.toJSON() }
    }
    
    func createEvent(title: String, calendarName: String?, startDateString: String, endDateString: String, notes: String?, location: String?, urlString: String?, isAllDay: Bool?) throws -> EventJSON {
        let event = EKEvent(eventStore: eventStore)
        event.calendar = try findCalendar(named: calendarName)
        event.title = title
        
        guard let startDate = parseDate(from: startDateString),
              let endDate = parseDate(from: endDateString) else {
            throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid date format. Use 'YYYY-MM-DD HH:mm:ss' or ISO 8601 format."])
        }
        
        event.startDate = startDate
        event.endDate = endDate
        event.isAllDay = isAllDay ?? false
        
        if let notesStr = notes { event.notes = notesStr }
        if let locationStr = location { event.location = locationStr }
        if let urlStr = urlString, !urlStr.isEmpty, let url = URL(string: urlStr) {
            event.url = url
        }
        
        do {
            try eventStore.save(event, span: .thisEvent, commit: true)
        } catch {
            // Provide detailed error information without permission hints
            // Permission is already checked before this operation
            let errorMsg = error.localizedDescription
            throw NSError(domain: "", code: 500, userInfo: [NSLocalizedDescriptionKey: "Failed to save calendar event: \(errorMsg)"])
        }
        return event.toJSON()
    }
    
    private func findEvent(withId id: String) -> EKEvent? {
        return eventStore.event(withIdentifier: id)
    }
    
    func updateEvent(id: String, title: String?, calendarName: String?, startDateString: String?, endDateString: String?, notes: String?, location: String?, urlString: String?, isAllDay: Bool?) throws -> EventJSON {
        guard let event = findEvent(withId: id) else {
            throw NSError(domain: "", code: 404, userInfo: [NSLocalizedDescriptionKey: "Event with ID '\(id)' not found."])
        }
        
        if let newTitle = title { event.title = newTitle }
        if let newCalendar = calendarName { event.calendar = try findCalendar(named: newCalendar) }
        
        if let startStr = startDateString {
            guard let startDate = parseDate(from: startStr) else {
                throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid start date format."])
            }
            event.startDate = startDate
        }
        
        if let endStr = endDateString {
            guard let endDate = parseDate(from: endStr) else {
                throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid end date format."])
            }
            event.endDate = endDate
        }
        
        if let notesStr = notes { event.notes = notesStr }
        if let locationStr = location { event.location = locationStr }
        if let urlStr = urlString {
            if urlStr.isEmpty {
                event.url = nil
            } else if let url = URL(string: urlStr) {
                event.url = url
            }
        }
        if let allDay = isAllDay { event.isAllDay = allDay }
        
        try eventStore.save(event, span: .thisEvent, commit: true)
        return event.toJSON()
    }
    
    func deleteEvent(id: String) throws {
        guard let event = findEvent(withId: id) else {
            throw NSError(domain: "", code: 404, userInfo: [NSLocalizedDescriptionKey: "Event with ID '\(id)' not found."])
        }
        try eventStore.remove(event, span: .thisEvent, commit: true)
    }
    
    func parseDate(from dateString: String) -> Date? {
        // Use same parsing logic as parseDateComponents but return Date
        if dateString.contains("Z") || (dateString.contains("+") || dateString.contains("-")) && dateString.range(of: #"T\d{2}:\d{2}"#, options: .regularExpression) != nil {
            let isoFormatter = ISO8601DateFormatter()
            isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let isoDate = isoFormatter.date(from: dateString) {
                return isoDate
            } else {
                isoFormatter.formatOptions = [.withInternetDateTime]
                return isoFormatter.date(from: dateString)
            }
        }
        
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        
        let formatsToTry = [
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd HH:mm",
            "yyyy-MM-dd"
        ]
        
        for format in formatsToTry {
            formatter.dateFormat = format
            if let date = formatter.date(from: dateString) {
                return date
            }
        }
        
        return nil
    }
}

// MARK: - Date Formatting Helper
private func formatDueDateWithTimezone(from dateComponents: DateComponents?) -> String? {
    guard let dateComponents = dateComponents,
          let date = Calendar.current.date(from: dateComponents) else {
        return nil
    }
    
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone.current
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
    
    let timezoneOffset = formatter.timeZone.secondsFromGMT(for: date)
    let hours = abs(timezoneOffset) / 3600
    let minutes = (abs(timezoneOffset) % 3600) / 60
    let sign = timezoneOffset >= 0 ? "+" : "-"
    let tzString = String(format: "%@%02d:%02d", sign, hours, minutes)
    
    return formatter.string(from: date) + tzString
}

// MARK: - Extensions & Main
extension EKReminder { 
    func toJSON() -> ReminderJSON { 
        ReminderJSON(
            id: self.calendarItemIdentifier,
            title: self.title,
            isCompleted: self.isCompleted,
            list: self.calendar.title,
            notes: self.notes,
            url: self.url?.absoluteString,
            dueDate: formatDueDateWithTimezone(from: self.dueDateComponents)
        )
    }
}
extension EKCalendar { 
    func toJSON() -> ListJSON { ListJSON(id: self.calendarIdentifier, title: self.title) }
    func toCalendarJSON() -> CalendarJSON { CalendarJSON(id: self.calendarIdentifier, title: self.title) }
}

extension EKEvent {
    func toJSON() -> EventJSON {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        
        let startTimezoneOffset = formatter.timeZone.secondsFromGMT(for: self.startDate)
        let startHours = abs(startTimezoneOffset) / 3600
        let startMinutes = (abs(startTimezoneOffset) % 3600) / 60
        let startSign = startTimezoneOffset >= 0 ? "+" : "-"
        let startTzString = String(format: "%@%02d:%02d", startSign, startHours, startMinutes)
        
        let endTimezoneOffset = formatter.timeZone.secondsFromGMT(for: self.endDate)
        let endHours = abs(endTimezoneOffset) / 3600
        let endMinutes = (abs(endTimezoneOffset) % 3600) / 60
        let endSign = endTimezoneOffset >= 0 ? "+" : "-"
        let endTzString = String(format: "%@%02d:%02d", endSign, endHours, endMinutes)
        
        return EventJSON(
            id: self.eventIdentifier,
            title: self.title,
            calendar: self.calendar.title,
            startDate: formatter.string(from: self.startDate) + startTzString,
            endDate: formatter.string(from: self.endDate) + endTzString,
            notes: self.notes,
            location: self.location,
            url: self.url?.absoluteString,
            isAllDay: self.isAllDay
        )
    }
}

struct ArgumentParser { private let args: [String: String]; init() { var dict = [String: String](); var i=0; let arguments=Array(CommandLine.arguments.dropFirst()); while i<arguments.count { let key=arguments[i].replacingOccurrences(of:"--",with:""); if i+1<arguments.count && !arguments[i+1].hasPrefix("--") { dict[key]=arguments[i+1]; i+=2 } else { dict[key]="true"; i+=1 } }; self.args=dict }; func get(_ key: String)->String?{return args[key]} }

func main() {
    let parser = ArgumentParser()
    let manager = RemindersManager()
    let encoder = JSONEncoder(); encoder.outputFormatting = .prettyPrinted
    let outputError = { (m: String) in if let d=try?encoder.encode(ErrorOutput(message:m)), let j=String(data:d,encoding:.utf8){print(j)}; exit(1) }
    
    let action = parser.get("action") ?? ""

    let isCalendarAction = action == "read-events" || action == "read-calendars" || action == "create-event" || action == "update-event" || action == "delete-event"
    
    // Check permission status first (Best Practice)
    let checkAndRequestPermission: () -> Void = {
        if isCalendarAction {
            let status = manager.checkCalendarAuthorizationStatus()
            switch status {
            case .authorized, .fullAccess:
                // Already authorized, proceed directly
                handleAction()
            case .notDetermined:
                // Need to request permission
                manager.requestCalendarAccess { granted, error in
                    guard granted else {
                        let errorMsg = error?.localizedDescription ?? "Unknown error"
                        outputError("Calendar permission denied. \(errorMsg)\n\nPlease grant calendar permissions in:\nSystem Settings > Privacy & Security > Calendars")
                        return
                    }
                    handleAction()
                }
            case .denied, .restricted:
                // Permission was denied or restricted
                outputError("Calendar permission denied or restricted.\n\nPlease grant calendar permissions in:\nSystem Settings > Privacy & Security > Calendars")
            case .writeOnly:
                // Write-only access is not sufficient for reading calendars
                outputError("Calendar permission is write-only, but read access is required.\n\nPlease grant full calendar permissions in:\nSystem Settings > Privacy & Security > Calendars")
            @unknown default:
                outputError("Unknown calendar permission status.")
            }
        } else {
            let status = manager.checkRemindersAuthorizationStatus()
            switch status {
            case .authorized, .fullAccess:
                // Already authorized, proceed directly
                handleAction()
            case .notDetermined:
                // Need to request permission
                manager.requestAccess { granted, error in
                    guard granted else {
                        let errorMsg = error?.localizedDescription ?? "Unknown error"
                        outputError("Reminder permission denied. \(errorMsg)\n\nPlease grant reminder permissions in:\nSystem Settings > Privacy & Security > Reminders")
                        return
                    }
                    handleAction()
                }
            case .denied, .restricted:
                // Permission was denied or restricted
                outputError("Reminder permission denied or restricted.\n\nPlease grant reminder permissions in:\nSystem Settings > Privacy & Security > Reminders")
            case .writeOnly:
                // Write-only access is not sufficient for reading reminders
                outputError("Reminder permission is write-only, but read access is required.\n\nPlease grant full reminder permissions in:\nSystem Settings > Privacy & Security > Reminders")
            @unknown default:
                outputError("Unknown reminder permission status.")
            }
        }
    }
    
    func handleAction() {
        do {
            switch action {
            case "read":
                let reminders = try manager.getReminders(showCompleted: parser.get("showCompleted") == "true", filterList: parser.get("filterList"), search: parser.get("search"), dueWithin: parser.get("dueWithin"))
                print(String(data: try encoder.encode(StandardOutput(result: ReadResult(lists: manager.getLists(), reminders: reminders))), encoding: .utf8)!)
            case "read-lists":
                print(String(data: try encoder.encode(StandardOutput(result: manager.getLists())), encoding: .utf8)!)
            case "create":
                guard let title = parser.get("title") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--title required."]) }
                let reminder = try manager.createReminder(title: title, listName: parser.get("targetList"), notes: parser.get("note"), urlString: parser.get("url"), dueDateString: parser.get("dueDate"))
                print(String(data: try encoder.encode(StandardOutput(result: reminder)), encoding: .utf8)!)
            case "update":
                guard let id = parser.get("id") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--id required."]) }
                let reminder = try manager.updateReminder(id: id, newTitle: parser.get("title"), listName: parser.get("targetList"), notes: parser.get("note"), urlString: parser.get("url"), isCompleted: parser.get("isCompleted").map { $0 == "true" }, dueDateString: parser.get("dueDate"))
                print(String(data: try encoder.encode(StandardOutput(result: reminder)), encoding: .utf8)!)
            case "delete":
                guard let id = parser.get("id") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--id required."]) }
                try manager.deleteReminder(id: id); print(String(data: try encoder.encode(StandardOutput(result: DeleteResult(id: id))), encoding: .utf8)!)
            case "create-list":
                guard let title = parser.get("name") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--name required."]) }
                print(String(data: try encoder.encode(StandardOutput(result: try manager.createList(title: title))), encoding: .utf8)!)
            case "update-list":
                guard let name = parser.get("name"), let newName = parser.get("newName") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--name and --newName required."]) }
                print(String(data: try encoder.encode(StandardOutput(result: try manager.updateList(currentName: name, newName: newName))), encoding: .utf8)!)
            case "delete-list":
                guard let title = parser.get("name") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--name required."]) }
                try manager.deleteList(title: title); print(String(data: try encoder.encode(StandardOutput(result: DeleteListResult(title: title))), encoding: .utf8)!)
            case "read-events":
                let startDateStr = parser.get("startDate")
                let endDateStr = parser.get("endDate")
                let startDate = startDateStr != nil ? manager.parseDate(from: startDateStr!) : nil
                let endDate = endDateStr != nil ? manager.parseDate(from: endDateStr!) : nil
                let events = try manager.getEvents(startDate: startDate, endDate: endDate, calendarName: parser.get("filterCalendar"), search: parser.get("search"))
                print(String(data: try encoder.encode(StandardOutput(result: EventsReadResult(calendars: manager.getCalendars(), events: events))), encoding: .utf8)!)
            case "read-calendars":
                print(String(data: try encoder.encode(StandardOutput(result: manager.getCalendars())), encoding: .utf8)!)
            case "create-event":
                guard let title = parser.get("title") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--title required."]) }
                guard let startDate = parser.get("startDate") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--startDate required."]) }
                guard let endDate = parser.get("endDate") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--endDate required."]) }
                let event = try manager.createEvent(title: title, calendarName: parser.get("targetCalendar"), startDateString: startDate, endDateString: endDate, notes: parser.get("note"), location: parser.get("location"), urlString: parser.get("url"), isAllDay: parser.get("isAllDay").map { $0 == "true" })
                print(String(data: try encoder.encode(StandardOutput(result: event)), encoding: .utf8)!)
            case "update-event":
                guard let id = parser.get("id") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--id required."]) }
                let event = try manager.updateEvent(id: id, title: parser.get("title"), calendarName: parser.get("targetCalendar"), startDateString: parser.get("startDate"), endDateString: parser.get("endDate"), notes: parser.get("note"), location: parser.get("location"), urlString: parser.get("url"), isAllDay: parser.get("isAllDay").map { $0 == "true" })
                print(String(data: try encoder.encode(StandardOutput(result: event)), encoding: .utf8)!)
            case "delete-event":
                guard let id = parser.get("id") else { throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "--id required."]) }
                try manager.deleteEvent(id: id); print(String(data: try encoder.encode(StandardOutput(result: DeleteResult(id: id))), encoding: .utf8)!)
            default: throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid or missing --action."])
            }
        } catch { outputError(error.localizedDescription) }
        exit(0)
    }
    
    checkAndRequestPermission()
    RunLoop.main.run()
}

main()
