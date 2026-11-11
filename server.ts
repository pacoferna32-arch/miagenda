// server.ts
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { getUserTasks, createTask, updateTask, deleteTask } from './src/db/tasks.ts';

const app = express();
const port = 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: 'Cloud SQL (PostgreSQL)',
    timestamp: new Date().toISOString(),
  });
});

// User sync endpoint
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || 'user@local.app',
      req.user!.name
    );
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Tasks endpoints
app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tasks = await getUserTasks(req.user!.uid);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const task = await createTask(req.user!.uid, req.body);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateTask(req.user!.uid, id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await deleteTask(req.user!.uid, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

start();
