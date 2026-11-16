const express = require('express');
const { Pool } = require('pg');
const sdk = require('./instrumentation');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.use(express.json());
app.get('/health', (_req, res) => res.send('ok'));
app.use(express.static('public'));

app.get('/api/projects/:project/tasks', async (req, res, next) => {
  try {
    // A deliberately slow report query, visible as database time in the trace.
    if (req.query.report === 'slow') {
      await pool.query('SELECT pg_sleep(0.25), $1::text AS project', [req.params.project]);
    }
    const result = await pool.query(
      'SELECT id, title FROM tasks WHERE project = $1 ORDER BY id',
      [req.params.project],
    );
    res.json(result.rows);
  } catch (error) { next(error); }
});

app.post('/api/projects/:project/tasks', async (req, res, next) => {
  try {
    if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
      return res.status(400).json({ error: 'A task title is required' });
    }
    const result = await pool.query(
      'INSERT INTO tasks (project, title) VALUES ($1, $2) RETURNING id, title',
      [req.params.project, req.body.title.trim()],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Database request failed' });
});

async function start() {
  await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY, project TEXT NOT NULL, title TEXT NOT NULL
  )`);
  const server = app.listen(Number(process.env.PORT || 3000), '127.0.0.1');
  process.once('SIGTERM', () => {
    server.close(async () => {
      await pool.end();
      console.log('OpenTelemetry shutdown started', Date.now());
      await sdk.shutdown(); // Flush the last batch before Playwright exits.
      console.log('OpenTelemetry shutdown complete');
    });
  });
}
start().catch(error => { console.error(error); process.exitCode = 1; });
