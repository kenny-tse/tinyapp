const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require('cookie-parser')
app.use(cookieParser());
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "111": {
    id: "111",
    email: "1234@number.com",
    password: "123"
  },
  "222": {
    id: "222",
    email: "aaa@bbb.com",
    password: "abc"
  }
}

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined) {
    const templateVars = { urls: urlDatabase, userObject: false };
    res.render("urls_index", templateVars);
    return
  }
  const templateVars = { urls: urlDatabase, userObject: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`http://localhost:${PORT}/urls/${randomString}`);
});

app.get("/urls/new", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined) {
    const templateVars = { urls: urlDatabase, userObject: false };
    res.render("urls_new", templateVars);
    return
  }
  const templateVars = { userObject: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userObject: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {

  const emailToAdd = req.body.email;
  const passwordToAdd = req.body.password;

  if (!emailToAdd || !passwordToAdd) {
    return res.status(400).send("email or password cannot be blank");
  }

  const userToFind = findUser(emailToAdd);

  if (userToFind) {
    return res.status(400).send('Email is already in use!')
  }

  const randomId = generateRandomString();
  users[randomId] = {
    id: randomId,
    email: emailToAdd,
    password: passwordToAdd
  }

  res.cookie("user_id", randomId);
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(req.params)
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const codeToSearch = req.params.shortURL;
  const longURL = urlDatabase[codeToSearch];
  res.redirect(longURL);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const emailToLog = req.body.email;
  const passwordToLog = req.body.password;

  if (!emailToLog || !passwordToLog) {
    return res.status(400).send("email or password cannot be blank");
  }

  const userToFind = findUser(emailToLog);

  console.log(userToFind);

  if (!userToFind) {
    return res.status(400).send('User not found!')
  }

  if (userToFind.password !== passwordToLog) {
    return res.status(400).send('Password does not match!')
  }

  res.cookie("user_id", userToFind.id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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
}

const findUser = function (email) {

  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user
    }
  }
  return false;
}