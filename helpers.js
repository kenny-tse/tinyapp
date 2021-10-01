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

module.exports = { getUserByEmail, urlsForUser };