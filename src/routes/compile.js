import express from 'express';
import expressQueue from 'express-queue';
import mcache from 'memory-cache';

import { promisify } from 'util';
import { promises as fs } from 'fs';

import md5 from 'md5';
import del from 'del';

// TODO: convert to import
const exec = promisify(require('child_process').exec);

const CACHE_TIMEOUT = process.env.CACHE_TIMEOUT || 60000;
const BUILD_TIMEOUT = process.env.BUILD_TIMEOUT || 10000;

// expressjs constants
const router = express.Router();
const queueMw = expressQueue({ activeLimit: 1, queuedLimit: 20 });

router.post('/', queueMw, async (req, res) => {
  const id = md5(req.body);

  let data = mcache.get(id);
  if (!data) {
    console.log(`processing uncached:${id}`);

    try {
      await fs.writeFile(`/tmp/${id}.ahk`, req.body);

      await exec(`xvfb-run -a wine Ahk2Exe.exe /in /tmp/${id}.ahk`, { timeout: BUILD_TIMEOUT });

      data = await fs.readFile(`/tmp/${id}.exe`);
      mcache.put(id, data, CACHE_TIMEOUT);
    } catch (err) {
      res.status(400).send({ error: { code: err.code || -1, message: err.message || 'unknown' } });
      return;
    } finally {
      await del(`/tmp/${id}.*`, { force: true });
    }
  }

  // cannot use res.download(`/tmp/${id}.exe`); due to cached buffer
  res.sendFileBuffer(`${id}.exe`, data);
  // res.download("/home/zvecr/Desktop/test.exe");
});

export default {
  stats() {
    return {
      queue: queueMw.queue.getLength(),
      cache: mcache.size(),
    };
  },
  router,
};
