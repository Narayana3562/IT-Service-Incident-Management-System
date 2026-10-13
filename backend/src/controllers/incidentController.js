import { pool, query } from '../config/db.js';
import { AppError } from '../utils/errors.js';

const priorities = ['low', 'medium', 'high', 'critical'];
const statuses = ['open', 'in_progress', 'resolved', 'closed'];
const categories = ['Hardware', 'Software', 'Network', 'Access', 'Email', 'Other'];

function canSee(user, incident) {
  return user.role === 'admin' || user.role === 'support' ||
    Number(incident.reporter_id) === Number(user.id);
}

async function recordHistory(client, incidentId, actorId, action, oldValue = null, newValue = null) {
  await client.query(
    `INSERT INTO incident_history (incident_id, actor_id, action, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5)`,
    [incidentId, actorId, action, oldValue, newValue]
  );
}

export async function listIncidents(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const filters = [];
  const values = [];

  if (req.user.role === 'employee') {
    values.push(req.user.id);
    filters.push(`i.reporter_id = $${values.length}`);
  }
  if (req.query.status && statuses.includes(req.query.status)) {
    values.push(req.query.status);
    filters.push(`i.status = $${values.length}`);
  }
  if (req.query.priority && priorities.includes(req.query.priority)) {
    values.push(req.query.priority);
    filters.push(`i.priority = $${values.length}`);
  }
  if (req.query.search) {
    values.push(`%${String(req.query.search).slice(0, 100)}%`);
    filters.push(`(i.ticket_key ILIKE $${values.length} OR i.title ILIKE $${values.length})`);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM incidents i ${where}`, values);
  const listValues = [...values, limit, offset];
  const result = await query(
    `SELECT i.*, r.name AS reporter_name, a.name AS assignee_name
     FROM incidents i
     JOIN users r ON r.id = i.reporter_id
     LEFT JOIN users a ON a.id = i.assignee_id
     ${where}
     ORDER BY i.created_at DESC
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues
  );
  res.json({ incidents: result.rows, pagination: { page, limit, total: countResult.rows[0].total } });
}

export async function createIncident(req, res) {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const category = String(req.body.category || 'Other');
  const priority = String(req.body.priority || 'medium');

  if (title.length < 5 || title.length > 160) throw new AppError(400, 'Title must be 5-160 characters');
  if (description.length < 10 || description.length > 5000) throw new AppError(400, 'Description must be 10-5000 characters');
  if (!categories.includes(category)) throw new AppError(400, 'Invalid category');
  if (!priorities.includes(priority)) throw new AppError(400, 'Invalid priority');

  const result = await query(
    `INSERT INTO incidents (title, description, category, priority, reporter_id, sla_due_at)
     VALUES ($1, $2, $3, $4, $5,
       NOW() + ((SELECT resolution_hours FROM sla_policies WHERE priority = $4) * INTERVAL '1 hour'))
     RETURNING *`,
    [title, description, category, priority, req.user.id]
  );
  const incident = result.rows[0];
  await query(
    `INSERT INTO incident_history (incident_id, actor_id, action, new_value)
     VALUES ($1, $2, 'created', $3)`,
    [incident.id, req.user.id, incident.status]
  );
  res.status(201).json({ incident });
}

export async function getIncident(req, res) {
  const result = await query(
    `SELECT i.*, r.name AS reporter_name, a.name AS assignee_name
     FROM incidents i JOIN users r ON r.id = i.reporter_id
     LEFT JOIN users a ON a.id = i.assignee_id WHERE i.id = $1`,
    [req.params.id]
  );
  const incident = result.rows[0];
  if (!incident) throw new AppError(404, 'Incident not found');
  if (!canSee(req.user, incident)) throw new AppError(403, 'You cannot view this incident');

  const [comments, history] = await Promise.all([
    query(`SELECT c.id, c.body, c.created_at, u.name AS author_name
           FROM incident_comments c JOIN users u ON u.id = c.author_id
           WHERE c.incident_id = $1 ORDER BY c.created_at`, [incident.id]),
    query(`SELECT h.action, h.old_value, h.new_value, h.created_at, u.name AS actor_name
           FROM incident_history h LEFT JOIN users u ON u.id = h.actor_id
           WHERE h.incident_id = $1 ORDER BY h.created_at`, [incident.id])
  ]);
  res.json({ incident, comments: comments.rows, history: history.rows });
}

export async function updateIncident(req, res) {
  const id = req.params.id;
  const currentResult = await query('SELECT * FROM incidents WHERE id = $1', [id]);
  const current = currentResult.rows[0];
  if (!current) throw new AppError(404, 'Incident not found');

  const elevated = ['admin', 'support'].includes(req.user.role);
  if (!elevated && Number(current.reporter_id) !== Number(req.user.id)) {
    throw new AppError(403, 'You cannot update this incident');
  }
  if (!elevated && Object.keys(req.body).some(k => !['title', 'description'].includes(k))) {
    throw new AppError(403, 'Employees may only edit title and description');
  }

  const title = req.body.title === undefined ? current.title : String(req.body.title).trim();
  const description = req.body.description === undefined ? current.description : String(req.body.description).trim();
  const status = req.body.status === undefined ? current.status : String(req.body.status);
  const priority = req.body.priority === undefined ? current.priority : String(req.body.priority);
  const category = req.body.category === undefined ? current.category : String(req.body.category);

  if (title.length < 5 || title.length > 160) throw new AppError(400, 'Title must be 5-160 characters');
  if (description.length < 10 || description.length > 5000) throw new AppError(400, 'Description must be 10-5000 characters');
  if (!statuses.includes(status) || !priorities.includes(priority) || !categories.includes(category)) {
    throw new AppError(400, 'Invalid status, priority, or category');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      `UPDATE incidents SET title=$1, description=$2, status=$3, priority=$4, category=$5,
       resolved_at=CASE WHEN $3 IN ('resolved','closed') THEN COALESCE(resolved_at, NOW()) ELSE NULL END,
       sla_due_at=CASE WHEN $4 <> $6 THEN NOW() + ((SELECT resolution_hours FROM sla_policies WHERE priority=$4) * INTERVAL '1 hour') ELSE sla_due_at END,
       updated_at=NOW() WHERE id=$7 RETURNING *`,
      [title, description, status, priority, category, current.priority, id]
    );
    for (const [field, oldValue, newValue] of [
      ['status', current.status, status],
      ['priority', current.priority, priority],
      ['category', current.category, category]
    ]) {
      if (oldValue !== newValue) await recordHistory(client, id, req.user.id, `${field}_changed`, oldValue, newValue);
    }
    await client.query('COMMIT');
    res.json({ incident: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function assignIncident(req, res) {
  const incidentId = req.params.id;
  const assigneeId = Number(req.body.assigneeId);
  if (!Number.isInteger(assigneeId) || assigneeId < 1) throw new AppError(400, 'A valid assigneeId is required');

  const assignee = await query('SELECT id, role FROM users WHERE id=$1 AND is_active=TRUE', [assigneeId]);
  if (!assignee.rows[0] || !['support', 'admin'].includes(assignee.rows[0].role)) {
    throw new AppError(400, 'Assignee must be an active support user or admin');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('UPDATE incidents SET assignee_id=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [assigneeId, incidentId]);
    if (!result.rows[0]) throw new AppError(404, 'Incident not found');
    await recordHistory(client, incidentId, req.user.id, 'assigned', null, String(assigneeId));
    await client.query('COMMIT');
    res.json({ incident: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function addComment(req, res) {
  const body = String(req.body.body || '').trim();
  if (body.length < 1 || body.length > 3000) throw new AppError(400, 'Comment must be 1-3000 characters');
  const incidentResult = await query('SELECT * FROM incidents WHERE id=$1', [req.params.id]);
  const incident = incidentResult.rows[0];
  if (!incident) throw new AppError(404, 'Incident not found');
  if (!canSee(req.user, incident)) throw new AppError(403, 'You cannot comment on this incident');

  const result = await query(
    'INSERT INTO incident_comments (incident_id, author_id, body) VALUES ($1,$2,$3) RETURNING *',
    [incident.id, req.user.id, body]
  );
  res.status(201).json({ comment: result.rows[0] });
}

export async function dashboardStats(req, res) {
  const reporterFilter = req.user.role === 'employee' ? 'WHERE reporter_id = $1' : '';
  const params = req.user.role === 'employee' ? [req.user.id] : [];
  const result = await query(
    `SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status IN ('open','in_progress'))::int AS open,
      COUNT(*) FILTER (WHERE status='resolved')::int AS resolved,
      COUNT(*) FILTER (WHERE priority IN ('high','critical') AND status NOT IN ('resolved','closed'))::int AS high_priority,
      COUNT(*) FILTER (WHERE sla_due_at < NOW() AND status NOT IN ('resolved','closed'))::int AS overdue
     FROM incidents ${reporterFilter}`,
    params
  );
  res.json({ stats: result.rows[0] });
}
