const { assert } = require('chai');

const { getUserEmail } = require('../helpers.js');

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

describe('getUserEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    // Write your assert statement here

    assert.isOk(expectedUserID, 'everything is ok');


  });
});