const getUserByEmail = function (email, database) {

  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

const urlsForUser = function (id, database) {

  let objectToReturn = {};

  for (const siteId in database) {
    if (database[siteId].userID === id) {
      objectToReturn[siteId] = database[siteId];
    }
  }
  return objectToReturn;
};

const generateRandomString = function () {

  let randomString = "";

  for (let i = 0; i < 6; i++) {
    if (Math.floor((Math.random() * 10) + 1) % 2 === 0) {
      randomString = randomString + String.fromCharCode(Math.floor(Math.random() * (122 - 97) + 97));
    } else {
      randomString = randomString + String.fromCharCode(Math.floor(Math.random() * (57 - 48) + 48));
    }
  }
  return randomString;
};

module.exports = { getUserByEmail, urlsForUser, generateRandomString };