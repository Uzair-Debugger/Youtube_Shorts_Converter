import path from 'path';
import os from 'os';
import fs from 'fs';
import { jobs } from '../store/job.js';
import { error } from 'console';

export const downloadVideoController = async (req, res) => {
  const { jobId } = req.params
  const job = jobs.get(jobId)

  if (!job) {
    return res.status(400).json({ error: 'Job not found' })
  }
  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Video is not ready yet' })
  }

  const outputPath = path.join(process.env.TEMP_DIR || os.tmpdir(), jobId, 'input1.mp4')

  if (!fs.existsSync(outputPath)) {
    console.error(`File not found at: ${outputPath}`);
    return res.status(400).json({ error: 'Video file not found. The conversion may have failed.' })
  }

  const stats = fs.statSync(outputPath);
  const fileSizeInMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`Downloading file from: ${outputPath} (Size: ${fileSizeInMB} MB)`);

  if (stats.size === 0) {
    console.error(`File is empty: ${outputPath}`);
    return res.status(400).json({ error: 'Video file is empty. The conversion likely failed.' })
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="short_${jobId}.mp4"`);
  res.setHeader('Content-Length', stats.size);

  console.log(`[DOWNLOAD] Headers set - Content-Length: ${stats.size}, filename: short_${jobId}.mp4`);

  const stream = fs.createReadStream(outputPath);
  stream.pipe(res);
  stream.on('end', () => console.log('✓ Video downloaded successfully to client'));
  stream.on('error', (err) => {
    console.error('❌ Stream error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
  });
  req.on('close', () => stream.destroy());
}

// Get list of all shorts with their details
export const getShortsListController = async (req, res) => {
  const { jobId } = req.params
  const job = jobs.get(jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Job is not completed yet' })
  }

  const shorts = (job.shorts || []).map((short, index) => {
    const shortPath = path.join(process.env.TEMP_DIR || os.tmpdir(), jobId, short.filename)
    const fileExists = fs.existsSync(shortPath)
    const fileSize = fileExists ? fs.statSync(shortPath).size : 0

    return {
      ...short,
      fileExists,
      fileSize,
      fileSizeInMB: (fileSize / 1024 / 1024).toFixed(2)
    }
  })

  res.json({
    jobId,
    status: job.status,
    totalShorts: shorts.length,
    shorts: shorts
  })
}

// Download individual short by index
export const downloadShortController = async (req, res) => {
  const { jobId, shortIndex } = req.params
  const job = jobs.get(jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Job is not completed yet' })
  }

  const index = parseInt(shortIndex)
  if (isNaN(index) || index < 0 || index >= (job.shorts || []).length) {
    return res.status(400).json({ error: 'Invalid short index' })
  }

  const short = job.shorts[index]
  const outputPath = path.join(process.env.TEMP_DIR || os.tmpdir(), jobId, short.filename)

  if (!fs.existsSync(outputPath)) {
    console.error(`File not found at: ${outputPath}`);
    return res.status(400).json({ error: 'Short file not found' })
  }

  const stats = fs.statSync(outputPath);
  const fileSizeInMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`Downloading short ${index + 1} from: ${outputPath} (Size: ${fileSizeInMB} MB)`);

  if (stats.size === 0) {
    console.error(`File is empty: ${outputPath}`);
    return res.status(400).json({ error: 'Short file is empty' })
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="short_${jobId}_${index + 1}.mp4"`);
  res.setHeader('Content-Length', stats.size);

  console.log(`[DOWNLOAD] Short ${index + 1} - Headers set - Content-Length: ${stats.size}`);

  const stream = fs.createReadStream(outputPath);
  stream.pipe(res);
  stream.on('end', () => console.log(`✓ Short ${index + 1} downloaded successfully`));
  stream.on('error', (err) => {
    console.error('❌ Stream error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
  });
  req.on('close', () => stream.destroy());
}

// Download multiple shorts as ZIP archive
export const downloadBatchController = async (req, res) => {
  const { jobId } = req.params
  const job = jobs.get(jobId)
  const { shortIndices } = req.body

  if (!job) {
    return res.status(404).json({ error: 'Job not found' })
  }

  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Job is not completed yet' })
  }

  if (!Array.isArray(shortIndices) || shortIndices.length === 0) {
    return res.status(400).json({ error: 'No shorts selected for download' })
  }

  const archiver = await import('archiver');
  const archive = archiver.default('zip', { zlib: { level: 5 } });

  try {
    const outputPath = path.join(process.env.TEMP_DIR || os.tmpdir(), jobId);
    const validShorts = shortIndices.filter(idx => idx >= 0 && idx < (job.shorts || []).length);

    if (validShorts.length === 0) {
      return res.status(400).json({ error: 'No valid shorts selected' })
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="shorts_${jobId}.zip"`);

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create archive' })
      }
    });

    archive.pipe(res);

    for (const shortIndex of validShorts) {
      const short = job.shorts[shortIndex];
      const filePath = path.join(outputPath, short.filename);
      
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `${short.filename}` });
      }
    }

    await archive.finalize();
    console.log(`Batch download created with ${validShorts.length} shorts`);
  } catch (err) {
    console.error('Batch download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: `Batch download error: ${err.message}` })
    }
  }
}