## ADDED Requirements

### Requirement: User can create an activity
The system SHALL allow the authenticated user to create a personal activity by filling a form with name, date, time range, priority, and optional description. On submission the form calls `POST /activities` and resets on success.

#### Scenario: Successful creation
- **WHEN** user fills all required fields (name, date, time_start, time_end, priority) and submits
- **THEN** the activity is created via `POST /activities` and the calendar for that date refreshes

#### Scenario: time_end not after time_start
- **WHEN** user sets `time_end` equal to or before `time_start`
- **THEN** a validation error is shown inline and the form is NOT submitted

#### Scenario: Required field missing
- **WHEN** user submits the form with any required field empty
- **THEN** a validation error is shown for that field and the form is NOT submitted

---

### Requirement: User can view activities for a selected day
The system SHALL display a monthly calendar where clicking a day fetches and shows that day's activities via `GET /activities?date=YYYY-MM-DD`. The selected date SHALL be stored in the URL via `nuqs`.

#### Scenario: Day with activities selected
- **WHEN** user clicks a day that has activities
- **THEN** the activity list updates to show all activities for that day, each displaying name and description (no status badge, no deadline text)

#### Scenario: Day with no activities selected
- **WHEN** user clicks a day that has no activities
- **THEN** the activity list shows an empty state message

#### Scenario: Page loaded with date param in URL
- **WHEN** the `/dashboard/individual` page loads with a `date` query param
- **THEN** the calendar highlights that day and fetches its activities client-side

---

### Requirement: User can edit their own activity
The system SHALL allow the owner of an activity to update any of its fields via an inline edit action that opens a pre-filled sheet form. On save, `PATCH /activities/:id` is called and the list refreshes.

#### Scenario: Successful edit
- **WHEN** user opens the edit sheet, modifies fields, and saves
- **THEN** `PATCH /activities/:id` is called with only the changed fields and the list for the selected day refreshes

#### Scenario: Edit with invalid fields
- **WHEN** user saves the edit form with validation errors
- **THEN** the errors are shown inline and the API is NOT called

---

### Requirement: User can delete their own activity
The system SHALL allow the owner of an activity to permanently delete it. A confirmation step SHALL be shown before deletion.

#### Scenario: Confirmed delete
- **WHEN** user selects "Excluir" and confirms
- **THEN** `DELETE /activities/:id` is called and the activity is removed from the list

#### Scenario: Cancelled delete
- **WHEN** user selects "Excluir" but cancels the confirmation
- **THEN** the activity is NOT deleted and the list is unchanged
