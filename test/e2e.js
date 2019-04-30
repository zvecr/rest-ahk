/* global describe it */
import chai from 'chai';
import chaiHttp from 'chai-http';
import server from '../src/app';
// import assert from 'assert';

chai.should();
chai.use(chaiHttp);

describe('Status endpoint', () => {
  it('should report zero when idle', (done) => {
    chai.request(server).get('/status')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('compile');
        res.body.compile.should.be.a('object');
        res.body.compile.should.have.property('queue').eql(0);
        res.body.compile.should.have.property('cache').eql(0);
        done();
      });
  });
});
