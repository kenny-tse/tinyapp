const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user2RandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  },
  d6ujk8: {
    longURL: "https://www.wikipedia.org",
    userID: "userRandomID"
  }
};

describe('getUserByEmail', function () {
  it('should return a user object', function () {
    const user = getUserByEmail("user@example.com", testUsers);
    assert.deepEqual(typeof (user), "object");
  });

  it('should return a user object with the right id', function () {
    const user = getUserByEmail("user2@example.com", testUsers);
    const expectedOutput = "user2RandomID";
    assert.deepEqual(user.id, "user2RandomID");
  });

  it('should return a user object with the right password', function () {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "purple-monkey-dinosaur";
    assert.deepEqual(user.password, expectedOutput);
  });

  it('should return false if a user is not found', function () {
    const user = getUserByEmail("emailNotFound@gmail.com", testUsers);
    const expectedOutput = undefined;
    assert.deepEqual(user, expectedOutput);
  });
});

describe('urlsForUser', function () {
  it('should return an object', function () {
    const thisUsersURLS = urlsForUser("userRandomID", testUrlDatabase);
    assert.deepEqual(typeof (thisUsersURLS), "object");
  });

  it('should return an object with 2 websites (length === 2)', function () {
    const thisUsersURLS = urlsForUser("user2RandomID", testUrlDatabase);
    assert.deepEqual(Object.keys(thisUsersURLS).length, 2);
  });

  it('should return an object with "https://www.tsn.ca" as one of the sites', function () {
    const thisUsersURLS = urlsForUser("user2RandomID", testUrlDatabase);
    assert.deepEqual(thisUsersURLS.b6UTxQ.longURL, "https://www.tsn.ca");
  });
});
