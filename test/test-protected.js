'use strict';
global.DATABASE_URL = 'mongodb://sgarcia30:12345@ds141524.mlab.com:41524/mp-test-db';
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User} = require('../models/userModel.js');
const {JWT_SECRET} = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Protected endpoint', function() {
  const email = 'exampleEmail';
  const password = 'examplePass';
  const firstName = 'Example';
  const lastName = 'User';

  before(function() {
    return runServer('mongodb://sgarcia30:12345@ds141524.mlab.com:41524/mp-test-db');
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
    return User.hashPassword(password).then(password =>
      User.create({
        email,
        password,
        firstName,
        lastName
      })
    );
  });

  afterEach(function() {
    return User.remove({});
  });

  describe('/api/protected', function() {
    it('Should reject requests with no credentials', function() {
      return chai
        .request(app)
        .get('/api/protected')
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });

    it('Should reject requests with an invalid token', function() {
      const token = jwt.sign(
        {
          email,
          firstName,
          lastName
        },
        'wrongSecret',
        {
          algorithm: 'HS256',
          expiresIn: '7d'
        }
      );

      return chai
        .request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`)
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('Should reject requests with an expired token', function() {
      const token = jwt.sign(
        {
          user: {
            email,
            firstName,
            lastName
          },
          exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: email
        }
      );

      return chai
        .request(app)
        .get('/api/protected')
        .set('authorization', `Bearer ${token}`)
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
    it('Should send protected data', function() {
      const token = jwt.sign(
        {
          user: {
            email,
            firstName,
            lastName
          }
        },
        JWT_SECRET,
        {
          algorithm: 'HS256',
          subject: email,
          expiresIn: '7d'
        }
      );

      return chai
        .request(app)
        .get('/api/protected')
        .set('authorization', `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.data).to.equal('rosebud');
        });
    });
  });
});