# Database design

## Relationships
- One user can report many incidents (`incidents.reporter_id`).
- One support user can be assigned many incidents (`incidents.assignee_id`).
- One incident can have many comments and history events.
- `sla_policies` maps each priority to a target resolution time.

## Why these tables?
- `users`: account identity and authorization role.
- `incidents`: current state of each IT issue.
- `incident_assignments`: this first version stores the current assignee on `incidents.assignee_id`; use a separate assignment table if assignment history needs richer fields.
- `incident_comments`: conversation thread for the ticket.
- `incident_history`: audit events for status/priority/category changes.
- `sla_policies`: configurable resolution targets rather than hardcoding deadlines in application code.

## Important constraints
- `CHECK` constraints limit roles, statuses, and priorities.
- `UNIQUE(email)` prevents duplicate accounts.
- Foreign keys protect relationships.
- Indexes support common status, priority, user, and date filters.
- SQL placeholders (`$1`, `$2`, ...) prevent SQL injection for values.
