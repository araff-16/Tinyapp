const express = require("express");
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

//******************* DATABASE

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
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
}

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

//Checks if an email exists in the users object
//Returns true if exists and false otherwise
const emailChecker = function (emailToCheck) {

  for (let user in users){
    if (emailToCheck === users[user].email){
      return users[user].id
    }
  }

  return null
}

//Checks if an password matchs for a specific email
//Returns true if exists and false otherwise
const passowrdChecker = function (email, passwordToCheck) {

  for (let user in users){
    if (email === users[user].email){
      if (passwordToCheck === users[user].password){
        return true
      } else {
        return false
      }
    }
  }
  return false
}

//Returns id for specied email
const provideId = function (email) {

  for (let user in users){
    if (email === users[user].email){
      return users[user].id
    }
  }
  return false
}

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
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  
  res.render("urls_index", templateVars);
});

//Provides form input for new longURL
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

// Provides page that shows longURL and shortURL
app.get("/urls/:shortURL", (req, res) => {
  //Check to verify if shortURL is valid
  if (!urlDatabase[req.params.shortURL]) {
    res.send("INVALID URL");
    return;
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

// redirects client to the longURL corresponding to the shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//Takes client to register page 
app.get("/register", (req,res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render("urls_register", templateVars)
})

//Takes client to login page
app.get("/login", (req,res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render("urls_login", templateVars)
})

//******************* POST REQUESTS

//Recieves longURL, generates shortURL and saves the pair to database
//Redirects client to the page which shows the longURL and shortURL
//Note we had to install body-parser to read from the request body
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//Deletes URL after delete button is pressed on /urls page
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//Post request for updating long URL
//redirects user back to /urls after submission
app.post("/urls/:id", (req,res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

// Deletes username cookie
// Redirects user back to /urls
app.post("/logout", (req,res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Accepts username from log in form and creates a cookie
// Redirects user back to /urls
app.post("/login", (req,res) => {

  if (!emailChecker(req.body.email)){
    res.status(403).send('USER EMAIL CANNOT BE FOUND')
    return
  } else 

  if(!passowrdChecker(req.body.email,req.body.password)){
    res.status(403).send('PASSWORD INVALID')
    return
  }

  res.cookie('user_id', provideId(req.body.email))
  res.redirect('/urls');

  
});

//Acquires the users email and password and stores in the global users object 
//Redirects user to 
app.post("/register", (req,res) =>{
  
  if (req.body.email === '' || req.body.password === ''){
    res.status(400).send('INVALID USERNAME OR PASSWORD')
    return
  }
  
  if (emailChecker(req.body.email)){
    res.status(400).send('EMAIL ALREADY EXISTS')
    return
  }
  
  let userId = "user" + generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password:req.body.password
  }

  res.cookie('user_id', userId)
  res.redirect('/urls');
})


app.post("/login", (req,res) => {



})
//******************* APP LISTENING

app.listen(PORT, () =>{
  console.log(`Example app listening on port ${PORT}!`);
});