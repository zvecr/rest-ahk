import { PassThrough } from 'stream';

function sendFileBuffer(req, res, next) {
  res.sendFileBuffer = (filename, data) => {
    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-type', 'application/x-msdownload');

    const bufferStream = new PassThrough();
    bufferStream.end(data);
    bufferStream.pipe(res);
  };
  next();
}

export default sendFileBuffer;
