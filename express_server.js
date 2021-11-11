const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['secret key', 'key2'],
}));

app.set("view engine", "ejs");

const bcrypt =require("bcryptjs");
const { getUserByEmail } = require("./helpers");

//******************* DATABASE

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID"
  },
  su52A9: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("qwert", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("funk", 10)
  }
};

//******************* HELPER FUNCTIONS


// Generates a random string of 6 alphanumeric characters
const generateRandomString = function() {
  const options = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9'];
  let string = '';
  for (let i = 0; i < 6; i++) {
    string += options[ Math.floor(Math.random() * (62))];
  }
  return string;
};


//Checks if an password matchs for a specific email
//Returns true if exists and false otherwise
const passowrdChecker = function(email, passwordToCheck) {

  for (let user in users) {
    if (email === users[user].email) {
      if (bcrypt.compareSync(passwordToCheck, users[user].password)) {
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
};

//Returns id for specified email
const provideId = function(email) {

  for (let user in users) {
    if (email === users[user].email) {
      return users[user].id;
    }
  }
  return false;
};

//Returns back a new object with only the URLS pertaining to the login
const databasefilter = function(data, checkId) {
  let filteredData = {};
  for (let link in data) {
    if (data[link].userID === checkId) {
      filteredData[link] = data[link];
    }
  }
  return filteredData;
};


//******************* GET REQUESTS

//Sends Hello to client
app.get('/',(req,res)=> {
  res.send('Hello!');
});

//Provides JSON string of Database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Provides Hello World
app.get("/hello", (req, res) =>{
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Provides a list of all shortURLs with corresponding longURLS
//fitrst filter the urlDatabase for specified user
app.get("/urls", (req, res) => {

  req.session.user_id
  
  let filterDatbase = databasefilter(urlDatabase,req.session.user_id);
  const templateVars = { urls: filterDatbase, user: users[req.session.user_id] };
  
  res.render("urls_index", templateVars);
});

//Provides form input for new longURL
//First checks if a user is logged in with cookies
app.get("/urls/new", (req, res) => {
  
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }

  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

// Provides page that shows longURL and shortURL
app.get("/urls/:shortURL", (req, res) => {
  
  //Checks to see if logged in
  if (!req.session.user_id) {
    res.send("PLEASE LOGIN");
    return;
  }
  
  //Check to verify if shortURL is valid
  if (!urlDatabase[req.params.shortURL]) {
    res.send("INVALID URL");
    return;
  }

  let filterDatbase = databasefilter(urlDatabase,req.session.user_id);

  //checks to see if url belongs to user
  if (!(req.params.shortURL in filterDatbase)) {
    res.send("URL DOES NOT BELONG TO USER");
    return;
  }

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

// redirects client to the longURL corresponding to the shortURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
    return;
  }
  res.send("NO LONG URL EXISTS");
  
});

//Takes client to register page
app.get("/register", (req,res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

//Takes client to login page
app.get("/login", (req,res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

//******************* POST REQUESTS

//Recieves longURL, generates shortURL and saves the pair to database
//Redirects client to the page which shows the longURL and shortURL
//Note we had to install body-parser to read from the request body
//Blocks post request if user is not logged in
app.post("/urls", (req, res) => {

  if (!req.session.user_id) {
    res.send("PLEASE LOGIN");
    return;
  }
  
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };

  
  res.redirect(`/urls/${shortURL}`);
});

//Deletes URL after delete button is pressed on /urls page
app.post("/urls/:shortURL/delete", (req, res) => {

  
  if (!req.session.user_id) {
    res.send("PLEASE LOGIN");
    return;
  }

  if (!(req.params.shortURL in urlDatabase)) {
    res.send("INVALID URL");
    return;
  }
  
  let filterDatbase = databasefilter(urlDatabase,req.session.user_id);
  //checks to see if url belongs to user
  if (!(req.params.shortURL in filterDatbase)) {
    res.send("URL DOES NOT BELONG TO USER");
    return;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//Post request for updating long URL
//redirects user back to /urls after submission
app.post("/urls/:id", (req,res) => {

  if (!req.session.user_id) {
    res.send("PLEASE LOGIN");
    return;
  }

  if (!(req.params.id in urlDatabase)) {
    res.send("INVALID URL");
    return;
  }

  let filterDatbase = databasefilter(urlDatabase,req.session.user_id);
  //checks to see if url belongs to user
  if (!(req.params.id in filterDatbase)) {
    res.send("URL DOES NOT BELONG TO USER");
    return;
  }

  urlDatabase[req.params.id] = {
    longURL:req.body.longURL,
    userID: req.session.user_id
  };

  
  res.redirect('/urls');
});

// Deletes username cookie
// Redirects user back to /urls
app.post("/logout", (req,res) => {
  //res.clearCookie('user_id');
  delete req.session.user_id
  res.redirect('/urls');
});

// Accepts username from log in form and creates a cookie
// Redirects user back to /urls
app.post("/login", (req,res) => {

  if (!getUserByEmail(req.body.email, users)) {
    res.status(403).send('USER EMAIL CANNOT BE FOUND');
    return;
  } else

  if (!passowrdChecker(req.body.email,req.body.password)) {
    res.status(403).send('PASSWORD INVALID');
    return;
  }

  //res.cookie('user_id', provideId(req.body.email));
  req.session.user_id =  provideId(req.body.email)
  res.redirect('/urls');

  
});

//Acquires the users email and password and stores in the global users object
//Redirects user to
app.post("/register", (req,res) =>{
  
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('INVALID USERNAME OR PASSWORD');
    return;
  }
  
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send('EMAIL ALREADY EXISTS');
    return;
  }
  
  hashedPassword = bcrypt.hashSync(req.body.password, 10)


  let userId = "user" + generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password:hashedPassword
  };

  //res.cookie('user_id', userId);
  req.session.user_id = userId

  
  //than yo access i use req.session.user_id
  // to clear cookie req.session.user_id =null
  //delete req.session.user_id
  res.redirect('/urls');
});



//******************* APP LISTENING

app.listen(PORT, () =>{
  console.log(`Example app listening on port ${PORT}!`);
});




