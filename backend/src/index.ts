import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, '../../data');

app.use(cors());
app.use(express.json());

// Ensure directories exist
const ensureDirs = async () => {
  const dirs = ['tests', 'history', 'notes'];
  for (const dir of dirs) {
    const fullPath = path.join(DATA_DIR, dir);
    try {
      await fs.access(fullPath);
    } catch {
      await fs.mkdir(fullPath, { recursive: true });
    }
  }
};

ensureDirs();

// GET /api/tests: Scans data/tests/ and returns list of tests with metadata
app.get('/api/tests', async (req, res) => {
  try {
    const testsDir = path.join(DATA_DIR, 'tests');
    const files = await fs.readdir(testsDir);
    const tests = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const content = await fs.readFile(path.join(testsDir, file), 'utf-8');
          const data = JSON.parse(content);
          return {
            filename: file,
            topic: data.topic,
            hardness: data.hardness,
            date: data.date,
            questionCount: data.test.length,
            archived: !!data.archived
          };
        })
    );
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// PATCH /api/tests/:filename: Updates test metadata (topic or archived status)
app.post('/api/tests/:filename/update', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, 'tests', req.params.filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    const { topic, archived } = req.body;
    if (topic !== undefined) data.topic = topic;
    if (archived !== undefined) data.archived = archived;
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update test' });
  }
});

// DELETE /api/tests/:filename: Deletes a test file
app.post('/api/tests/:filename/delete', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, 'tests', req.params.filename);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

// POST /api/tests: Saves a new test JSON file
app.post('/api/tests', async (req, res) => {
  try {
    const testData = req.body;
    if (!testData.topic || !testData.hardness || !testData.test) {
      return res.status(400).json({ error: 'Invalid test format' });
    }

    const timestamp = Date.now();
    const filename = `${testData.topic.toLowerCase().replace(/\s+/g, '-')}-${testData.hardness}-${timestamp}.json`;
    const filePath = path.join(DATA_DIR, 'tests', filename);

    await fs.writeFile(filePath, JSON.stringify(testData, null, 2));
    res.json({ success: true, filename });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save test' });
  }
});

// GET /api/tests/:filename: Returns test content
app.get('/api/tests/:filename', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, 'tests', req.params.filename);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    res.status(404).json({ error: 'Test not found' });
  }
});

// POST /api/history/:testId: Appends attempt to history file
app.post('/api/history/:testId', async (req, res) => {
  try {
    const historyPath = path.join(DATA_DIR, 'history', `${req.params.testId}.json`);
    let history: any = { testId: req.params.testId, attempts: [] };
    
    try {
      const content = await fs.readFile(historyPath, 'utf-8');
      history = JSON.parse(content);
    } catch (error) {
      // File doesn't exist, use default
    }
    
    history.attempts.push({
      ...req.body,
      date: new Date().toISOString()
    });
    
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// GET /api/history/:testId: Reads history file
app.get('/api/history/:testId', async (req, res) => {
  try {
    const historyPath = path.join(DATA_DIR, 'history', `${req.params.testId}.json`);
    const content = await fs.readFile(historyPath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    res.json({ testId: req.params.testId, attempts: [] });
  }
});

// POST /api/notes/:testId: Saves notes to data/notes/:testId.json
app.post('/api/notes/:testId', async (req, res) => {
  try {
    const notesPath = path.join(DATA_DIR, 'notes', `${req.params.testId}.json`);
    await fs.writeFile(notesPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

// GET /api/notes/:testId: Reads notes
app.get('/api/notes/:testId', async (req, res) => {
  try {
    const notesPath = path.join(DATA_DIR, 'notes', `${req.params.testId}.json`);
    const content = await fs.readFile(notesPath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    res.json({ notes: '' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
