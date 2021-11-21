const express = require("express");
const app = express();
const PORT = 8080;

//Body parser to read req.body
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Needed to create encrypted cookies
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['secret key', 'key2'],
}));

//Need to set views engine so ejs templates work
app.set("view engine", "ejs");

//bcrypt need to hash passwords
const bcrypt = require("bcryptjs");

//Enabling PUT and DELETE using methodOverride 
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

//Access to all helper functions
const {
  getUserByEmail,
  generateRandomString,
  passwordChecker,
  provideId,
  databaseFilter
} = require("./helpers");

//Acccess to stored data
const {
  urlDatabase,
  users
} = require("./database");


//******************* GET REQUESTS

//redirects user to /login if not signed in
//redirects user to /urls if signed in
app.get('/',(req,res)=> {
  
  //check to see if user logged in
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  res.redirect("/urls");
});

//Provides a list of all shortURLs and longURLS for particular user
//The option to delete and edit URLs is displayed
app.get("/urls", (req, res) => {

  //Filters the URLdatabase to obtain URLs for specific user
  let filterDatbase = databaseFilter(urlDatabase,req.session.user_id);

  const templateVars = { urls: filterDatbase, user: users[req.session.user_id] };
  
  res.render("urls_index", templateVars);
});

//Provides form input for new longURL
//First checks if a user is logged in with cookies
app.get("/urls/new", (req, res) => {
  
  //check to see if user logged in
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }

  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

//Provides page that shows longURL and shortURL

app.get("/urls/:shortURL", (req, res) => {
  
  //Checks to see if logged in
  if (!req.session.user_id) {
    res.send("PLEASE LOGIN");
    return;
  }
  
  //Checks if shortURL is valid
  if (!urlDatabase[req.params.shortURL]) {
    res.send("INVALID URL");
    return;
  }

  let filterDatbase = databaseFilter(urlDatabase,req.session.user_id);

  //Checks to see if url belongs to user
  if (!(req.params.shortURL in filterDatbase)) {
    res.send("URL DOES NOT BELONG TO USER");
    return;
  }

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };
  res.render("urls_show", templateVars);
});

//Redirects client to the longURL corresponding to the shortURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
    return;
  }

  //If the URL does not exist
  res.send("NO LONG URL EXISTS");
});

//Takes client to register page
app.get("/register", (req,res) => {

  //Checks if user is already logged in
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }

  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_register", templateVars);
});

//Takes client to login page
app.get("/login", (req,res) => {
  
  //Checks if user is already logged in
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  }
  
  const templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

//******************* POST REQUESTS

//Recieves longURL, generates shortURL and saves the pair to database
//Redirects client to the page which shows the longURL and shortURL
//Blocks post request if user is not logged in
app.post("/urls", (req, res) => {

  //Check to see if user logged in
  if (!req.session.user_id) {
    res.send("PLEASE LOGIN");
    return;
  }
  
  let shortURL = generateRandomString();

  //Saves info to database
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };

  res.redirect(`/urls/${shortURL}`);
});

//Deletes URL after delete button is pressed on /urls page
app.delete("/urls/:shortURL", (req, res) => {

  //Checks to see user logged in
  if (!req.session.user_id) {
    res.send("PLEASE LOGIN");
    return;
  }

  //Checks to see if URL is valid
  if (!(req.params.shortURL in urlDatabase)) {
    res.send("INVALID URL");
    return;
  }
  
  let filterDatbase = databaseFilter(urlDatabase,req.session.user_id);
  //Checks to see if url belongs to user
  if (!(req.params.shortURL in filterDatbase)) {
    res.send("URL DOES NOT BELONG TO USER");
    return;
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

//Post request for updating long URL
//Redirects user back to /urls after submission
app.put("/urls/:id", (req,res) => {

  //Checks if user is logged in
  if (!req.session.user_id) {
    res.send("PLEASE LOGIN");
    return;
  }

  //Checks if URL is valid
  if (!(req.params.id in urlDatabase)) {
    res.send("INVALID URL");
    return;
  }

  let filterDatbase = databaseFilter(urlDatabase,req.session.user_id);
  //Checks to see if url belongs to user
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

// Deletes users cookies
// Redirects user back to /urls
app.post("/logout", (req,res) => {
  
  delete req.session.user_id;
  res.redirect('/urls');
});

// Accepts username from log in form and creates a cookie
// Redirects user back to /urls
app.post("/login", (req,res) => {

  //checks to see if email exists
  if (!getUserByEmail(req.body.email, users)) {
    res.status(403).send('USER EMAIL CANNOT BE FOUND');
    return;
  } else

  //Checks to see if password is valid
  if (!passwordChecker(req.body.email,req.body.password, users)) {
    res.status(403).send('PASSWORD INVALID');
    return;
  }

  //res.cookie('user_id', provideId(req.body.email));
  req.session.user_id =  provideId(req.body.email, users);
  res.redirect('/urls');
});

//Acquires the users email and password and saves it in database
//Redirects user to /urls
app.post("/register", (req,res) =>{
  
  //email or password cannot be empty strings
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('INVALID USERNAME OR PASSWORD');
    return;
  }
  
  //email cannot already be in use
  if (getUserByEmail(req.body.email, users)) {
    res.status(400).send('EMAIL ALREADY EXISTS');
    return;
  }
  
  let hashedPassword = bcrypt.hashSync(req.body.password, 10);

  //saving user to database
  let userId = "user" + generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password:hashedPassword
  };

  req.session.user_id = userId;

  res.redirect('/urls');
});

//******************* APP LISTENING

app.listen(PORT, () =>{
  console.log(`Example app listening on port ${PORT}!`);
});




