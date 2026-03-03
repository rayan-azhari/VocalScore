import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';

async function startServer() {
  const app = express();
  const PORT = 5000;

  app.use(express.json());

  // API Routes
  app.post('/api/transcribe', async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[Backend] Received real transcription request for: ${url}`);

    const pythonExecutable = process.platform === 'win32' ? '.venv\\\\Scripts\\\\python.exe' : '.venv/bin/python';
    const pythonProcess = spawn(pythonExecutable, ['python_backend.py', '--url', url]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      const str = data.toString();
      stdoutData += str;
      process.stdout.write(`[Python]: ${str}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      const str = data.toString();
      stderrData += str;
      process.stderr.write(`[Python Error]: ${str}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`[Backend] Python process exited with code ${code}`);

      if (code !== 0) {
        return res.status(500).json({ error: 'AI Processing failed', details: stderrData });
      }

      // Extract JSON from stdout
      const match = stdoutData.match(/===RESULT_JSON_BEGIN===\n([\s\S]*?)\n===RESULT_JSON_END===/);
      if (match && match[1]) {
        try {
          const result = JSON.parse(match[1]);
          return res.json(result);
        } catch (e) {
          return res.status(500).json({ error: 'Failed to parse Python output' });
        }
      } else {
        return res.status(500).json({ error: 'No JSON result found in Python output' });
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
