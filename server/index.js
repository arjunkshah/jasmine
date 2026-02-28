/**
 * E2B Sandbox API — deploys generated Next.js projects to E2B sandbox
 * Run: npm run server (from project root)
 * Requires: E2B_API_KEY in .env
 *
 * Get E2B key: https://e2b.dev/dashboard
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const E2B_API_KEY = process.env.E2B_API_KEY;

app.post('/api/deploy', async (req, res) => {
  if (!E2B_API_KEY) {
    return res.status(500).json({
      error: 'E2B_API_KEY not set. Add E2B_API_KEY=your_key to .env. Get key at https://e2b.dev/dashboard',
    });
  }

  const { files } = req.body;
  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Missing files object' });
  }

  try {
    const { Sandbox } = await import('e2b');

    const sandbox = await Sandbox.create('base', {
      apiKey: E2B_API_KEY,
    });

    // Write each file
    for (const [filePath, content] of Object.entries(files)) {
      await sandbox.files.write(filePath, typeof content === 'string' ? content : String(content));
    }

    if (!files['package.json']) {
      const pkg = {
        name: 'jasmine-app',
        version: '0.1.0',
        private: true,
        scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
        dependencies: { next: '^14.2.0', react: '^18.2.0', 'react-dom': '^18.2.0' },
      };
      await sandbox.files.write('package.json', JSON.stringify(pkg, null, 2));
    }

    await sandbox.commands.run('npm install');
    await sandbox.process.start({
      cmd: 'npx next dev --port 3000 --hostname 0.0.0.0',
    });

    const previewUrl = `https://${sandbox.getHost(3000)}`;

    res.json({
      success: true,
      sandboxId: sandbox.sandboxId,
      url: previewUrl,
      message: 'Deploying... Preview may take 1–2 minutes.',
    });
  } catch (err) {
    console.error('E2B deploy error:', err);
    res.status(500).json({ error: err.message || 'Deploy failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`E2B API: http://localhost:${PORT}`);
});
