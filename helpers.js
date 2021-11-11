const bcrypt = require("bcryptjs");


//Checks if an email exists in the users object
//Returns user object if exists and null otherwise
const getUserByEmail = function(emailToCheck,database) {

  for (let user in database) {
    if (emailToCheck === database[user].email) {
      return database[user];
    }
  }
  return null;
};

// Generates a random string of 6 alphanumeric characters
const generateRandomString = function() {
  const options = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9'];
  let string = '';
  for (let i = 0; i < 6; i++) {
    string += options[ Math.floor(Math.random() * (62))];
  }
  return string;
};

//Checks if an password matches for a specific email
//Returns true if exists and false otherwise
const passwordChecker = function(email, passwordToCheck, data) {

  for (let user in data) {
    if (email === data[user].email) {
      if (bcrypt.compareSync(passwordToCheck, data[user].password)) {
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
};

//Returns id for specified email
const provideId = function(email, database) {

  for (let user in database) {
    if (email === database[user].email) {
      return database[user].id;
    }
  }
  return false;
};

//Returns back a new object with only the URLS pertaining to the login id
const databaseFilter = function(data, checkId) {
  let filteredData = {};
  for (let link in data) {
    if (data[link].userID === checkId) {
      filteredData[link] = data[link];
    }
  }
  return filteredData;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  passwordChecker,
  provideId,
  databaseFilter};