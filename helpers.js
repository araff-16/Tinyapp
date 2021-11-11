//Checks if an email exists in the users object
//Returns true if exists and false otherwise
const getUserByEmail = function(emailToCheck,database) {

  for (let user in database) {
    if (emailToCheck === database[user].email) {
      return database[user];
    }
  }
  return null;
};

module.exports = {getUserByEmail}