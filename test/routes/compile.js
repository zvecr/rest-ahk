/* eslint-env mocha */
import chai from 'chai';
import httpMocks from 'node-mocks-http';
import { promises as fs } from 'fs';
import proc from 'child_process';
import sinon from 'sinon';
import compile from '../../src/routes/compile';

chai.should();

const SCRIPT = `^j::
Send, My First Script
return
`;
const ID = '3ab771baa15b807fc028f9766eb111b0';

describe('Compile route', () => {
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

  it('should convert a valid request', (done) => {
    const response = httpMocks.createResponse();
    const request = httpMocks.createRequest({
      method: 'POST',
      url: '/',
      body: SCRIPT,
    });

    // TODO: use for negative test case
    // response.on('end', () => {
    //   response._getData().should.equal('world');
    //   done();
    // });

    response.sendFileBuffer = (name, data) => {
      sinon.assert.calledWith(fswriteFile, `/tmp/${ID}.ahk`, SCRIPT);
      sinon.assert.calledWith(exec, `xvfb-run -a wine Ahk2Exe.exe /in /tmp/${ID}.ahk`);
      sinon.assert.calledWith(fsreadFile, `/tmp/${ID}.exe`);

      name.should.be.equal(`${ID}.exe`);
      data.should.be.instanceof(Buffer);

      done();
    };

    compile.router.handle(request, response);
  });
});
