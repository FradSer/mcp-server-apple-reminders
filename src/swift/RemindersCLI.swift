import Foundation
import EventKit

// MARK: - Output Structures & JSON Models
struct StandardOutput<T: Codable>: Codable { let status = "success"; let result: T }
struct ErrorOutput: Codable { let status = "error"; let message: String }
struct ReadResult: Codable { let lists: [ListJSON]; let reminders: [ReminderJSON] }
struct DeleteResult: Codable { let id: String; let deleted = true }
struct DeleteListResult: Codable { let title: String; let deleted = true }
struct ReminderJSON: Codable { let id: String, title: String, isCompleted: Bool, list: String, notes: String?, url: String?, dueDate: String? }
struct ListJSON: Codable { let id: String, title: String }

// MARK: - Date Parsing Helper (Robust Implementation)
private func parseDateComponents(from dateString: String) -> DateComponents? {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX") // Best practice for fixed formats
    formatter.timeZone = TimeZone.current // Use local timezone

    // Support multiple date formats for flexibility with LLM inputs
    let formatsToTry = [
        // ISO 8601 formats
        "yyyy-MM-dd'T'HH:mm:ssZZZZZ", // 2025-10-30T04:00:00Z
        "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ", // 2025-10-30T04:00:00.000Z
        "yyyy-MM-dd'T'HH:mm:ss", // 2025-10-30T04:00:00
        "yyyy-MM-dd'T'HH:mm", // 2025-10-30T04:00
        // Standard formats
        "yyyy-MM-dd HH:mm:ss", // 2025-10-30 04:00:00
        "yyyy-MM-dd HH:mm", // 2025-10-30 04:00
        "yyyy-MM-dd" // 2025-10-30
    ]

    var date: Date?
    for format in formatsToTry {
        formatter.dateFormat = format
        if let parsedDate = formatter.date(from: dateString) {
            date = parsedDate
            break
        }
    }

    // If all formats fail, try ISO8601DateFormatter as fallback
    if date == nil {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let isoDate = isoFormatter.date(from: dateString) {
            date = isoDate
        } else {
            // Try without fractional seconds
            isoFormatter.formatOptions = [.withInternetDateTime]
            date = isoFormatter.date(from: dateString)
        }
    }

    guard let validDate = date else { return nil }

    // Determine which components to include based on the original string
    let hasTime = dateString.contains(":") || dateString.contains("T")
    let components: Set<Calendar.Component> = hasTime
        ? [.year, .month, .day, .hour, .minute, .second]
        : [.year, .month, .day]
    
    return Calendar.current.dateComponents(components, from: validDate)
}

// MARK: - RemindersManager Class
class RemindersManager {
    private let eventStore = EKEventStore()

    func requestAccess(completion: @escaping (Bool, Error?) -> Void) {
        if #available(macOS 14.0, *) { eventStore.requestFullAccessToReminders(completion: completion) }
        else { eventStore.requestAccess(to: .reminder, completion: completion) }
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

    func deleteReminder(id: String) throws { try eventStore.remove(try findReminder(withId: id) ?? { throw NSError(domain: "", code: 404) }(), commit: true) }
    func createList(title: String) throws -> ListJSON { let list = EKCalendar(for: .reminder, eventStore: eventStore); list.title = title; try eventStore.saveCalendar(list, commit: true); return list.toJSON() }
    func updateList(currentName: String, newName: String) throws -> ListJSON { let list = try findList(named: currentName); list.title = newName; try eventStore.saveCalendar(list, commit: true); return list.toJSON() }
    func deleteList(title: String) throws { try eventStore.removeCalendar(try findList(named: title), commit: true) }
}

// MARK: - Extensions & Main
extension EKReminder { func toJSON() -> ReminderJSON { ReminderJSON(id: self.calendarItemIdentifier, title: self.title, isCompleted: self.isCompleted, list: self.calendar.title, notes: self.notes, url: self.url?.absoluteString, dueDate: self.dueDateComponents?.date.map { ISO8601DateFormatter().string(from: $0) }) } }
extension EKCalendar { func toJSON() -> ListJSON { ListJSON(id: self.calendarIdentifier, title: self.title) } }

struct ArgumentParser { private let args: [String: String]; init() { var dict = [String: String](); var i=0; let arguments=Array(CommandLine.arguments.dropFirst()); while i<arguments.count { let key=arguments[i].replacingOccurrences(of:"--",with:""); if i+1<arguments.count && !arguments[i+1].hasPrefix("--") { dict[key]=arguments[i+1]; i+=2 } else { dict[key]="true"; i+=1 } }; self.args=dict }; func get(_ key: String)->String?{return args[key]} }

func main() {
    let parser = ArgumentParser()
    let manager = RemindersManager()
    let encoder = JSONEncoder(); encoder.outputFormatting = .prettyPrinted
    let outputError = { (m: String) in if let d=try?encoder.encode(ErrorOutput(message:m)), let j=String(data:d,encoding:.utf8){print(j)}; exit(1) }

    manager.requestAccess { granted, error in
        guard granted else { outputError("Permission denied. \(error?.localizedDescription ?? "")"); return }
        do {
            switch parser.get("action") {
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
            default: throw NSError(domain: "", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid or missing --action."])
            }
        } catch { outputError(error.localizedDescription) }
        exit(0)
    }
    RunLoop.main.run()
}

main()
