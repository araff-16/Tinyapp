const express = require("express");
const app = express();
const PORT = 8080;


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function() {
  const options = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9'];
  let string = '';
  for (let i = 0; i < 6; i++) {
    string += options[ Math.floor(Math.random() * (62))];
  }
  return string;
};


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

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
  const templateVars = { urls: urlDatabase};
  res.render("urls_index", templateVars);
});

//Provides form input for longURL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

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

// Provides page that shows longURL and shortURL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

// redirects client to the longURL corresponding to the shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () =>{
  console.log(`Example app listening on port ${PORT}!`);
});

//WHAT HAPPEN WHEN  A USER REQUEST A NON EXISTENT SHORT URL