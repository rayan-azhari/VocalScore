import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';

async function startServer() {
  const app = express();
  const PORT = 5000;

  app.use(express.json());

  // API Routes
  app.post('/api/transcribe', async (req, res) => {
    const { url, inputFile } = req.body;

    if (!url && !inputFile) {
      return res.status(400).json({ error: 'URL or inputFile is required' });
    }

    console.log(`[Backend] Received transcription request. URL: ${url || 'N/A'}, File: ${inputFile || 'N/A'}`);

    const pythonExecutable = process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : '.venv/bin/python';
    const args = ['python_backend.py', '--skip-existing'];
    if (url) args.push('--url', url);
    if (inputFile) args.push('--input-file', inputFile);

    const pythonProcess = spawn(pythonExecutable, args);

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

      console.log(`[Backend] Python process closed. Stdout length: ${stdoutData.length}`);

      // Detailed debug of stdout
      console.log(`[Backend] Full Stdout: \n${stdoutData}`);

      // Extract JSON from stdout with permissive newline handling
      const match = stdoutData.match(/===RESULT_JSON_BEGIN===\s*([\s\S]*?)\s*===RESULT_JSON_END===/);
      if (match && match[1]) {
        try {
          const jsonStr = match[1].trim();
          console.log(`[Backend] Extracted JSON string: ${jsonStr.substring(0, 100)}...`);
          const result = JSON.parse(jsonStr);
          return res.json(result);
        } catch (e) {
          console.error(`[Backend] Failed to parse JSON: ${e}`);
          return res.status(500).json({ error: 'Failed to parse Python output' });
        }
      } else {
        console.error(`[Backend] No JSON result found in Python output. Regex match failed.`);
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
