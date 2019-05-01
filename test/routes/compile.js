/* eslint-env mocha */
import chai from 'chai';
import httpMocks from 'node-mocks-http';
import { promises as fs } from 'fs';
import proc from 'child_process';
import sinon from 'sinon';
import ee from 'events';
import compile from '../../src/routes/compile';

chai.should();

const SCRIPT = `^j::
Send, My First Script
return
`;
const ID = '3ab771baa15b807fc028f9766eb111b0';

describe('Compile endpoint', () => {
  let exec;
  let fswriteFile;
  let fsreadFile;

  beforeEach(() => {
    fswriteFile = sinon.stub(fs, 'writeFile');
    fsreadFile = sinon.stub(fs, 'readFile').returns(Buffer.from('<EXE DATA>'));
    exec = sinon.stub(proc, 'exec').yields(undefined, undefined);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should reject a empty request', (done) => {
    const res = httpMocks.createResponse({
      eventEmitter: ee.EventEmitter,
    });
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/',
      body: '',
    });
    // TODO: undo bodge with body producing {}
    req.body = '';

    res.once('end', () => {
      res.statusCode.should.equal(400);

      done();
    });

    compile.router.handle(req, res);
  });

  it('should convert a valid request', (done) => {
    const res = httpMocks.createResponse({
      eventEmitter: ee.EventEmitter,
    });
    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/',
      body: SCRIPT,
    });

    res.sendFileBuffer = (name, data) => {
      name.should.be.equal(`${ID}.exe`);
      data.should.be.instanceof(Buffer);

      // boilerplate to behave as real express middleware
      res.status(200).send();
    };

    res.once('end', () => {
      sinon.assert.calledWith(fswriteFile, `/tmp/${ID}.ahk`, SCRIPT);
      sinon.assert.calledWith(exec, `xvfb-run -a wine Ahk2Exe.exe /in /tmp/${ID}.ahk`);
      sinon.assert.calledWith(fsreadFile, `/tmp/${ID}.exe`);

      done();
    });

    compile.router.handle(req, res);
  });
});
