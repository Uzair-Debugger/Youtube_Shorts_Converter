import path from 'path';
import os from 'os';
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

  // Check if file exists
  const fs = await import('fs');
  if (!fs.existsSync(outputPath)) {
    console.error(`File not found at: ${outputPath}`);
    return res.status(400).json({ error: 'Video file not found. The conversion may have failed.' })
  }

  // Check file size
  const stats = fs.statSync(outputPath);
  const fileSizeInMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`Downloading file from: ${outputPath} (Size: ${fileSizeInMB} MB)`);

  if (stats.size === 0) {
    console.error(`File is empty: ${outputPath}`);
    return res.status(400).json({ error: 'Video file is empty. The conversion likely failed.' })
  }

  try {
    // Set headers explicitly to ensure download works
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="short_${jobId}.mp4"`);
    res.setHeader('Content-Length', stats.size);

    console.log(`[DOWNLOAD] Headers set - Content-Length: ${stats.size}, filename: short_${jobId}.mp4`);

    res.download(outputPath, `short_${jobId}.mp4`, (err) => {
      if (err) {
        if (!res.headersSent) {
          console.error('❌ Download error (headers not sent):', err);
          return res.status(400).json({ error: 'Downloading Error' })
        }
        console.error('❌ Download error (headers already sent):', err)
      } else {
        console.log('✓ Video downloaded successfully to client')
      }
    })
  } catch (error) {
    if (!res.headersSent) {
      console.error('❌ Exception in downloadVideoController:', error);
      return res.status(400).json({ error: `downloadVideoController error: ${error.message}` })
    }
    console.error('❌ Unexpected error in downloadVideoController:', error)
  }
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

  const fs = await import('fs');
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

  // Check if file exists
  const fs = await import('fs');
  if (!fs.existsSync(outputPath)) {
    console.error(`File not found at: ${outputPath}`);
    return res.status(400).json({ error: 'Short file not found' })
  }

  // Check file size
  const stats = fs.statSync(outputPath);
  const fileSizeInMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`Downloading short ${index + 1} from: ${outputPath} (Size: ${fileSizeInMB} MB)`);

  if (stats.size === 0) {
    console.error(`File is empty: ${outputPath}`);
    return res.status(400).json({ error: 'Short file is empty' })
  }

  try {
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="short_${jobId}_${index + 1}.mp4"`);
    res.setHeader('Content-Length', stats.size);

    console.log(`[DOWNLOAD] Short ${index + 1} - Headers set - Content-Length: ${stats.size}`);

    res.download(outputPath, `short_${jobId}_${index + 1}.mp4`, (err) => {
      if (err) {
        if (!res.headersSent) {
          console.error('❌ Download error (headers not sent):', err);
          return res.status(400).json({ error: 'Download failed' })
        }
        console.error('❌ Download error:', err)
      } else {
        console.log(`✓ Short ${index + 1} downloaded successfully`)
      }
    })
  } catch (error) {
    if (!res.headersSent) {
      console.error('❌ Exception in downloadShortController:', error);
      return res.status(400).json({ error: `Download error: ${error.message}` })
    }
    console.error('❌ Unexpected error:', error)
  }
}