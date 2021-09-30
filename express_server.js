const express = require("express");
const app = express();
const PORT = 3000; // default port 8080

const cookieParser = require('cookie-parser');
app.use(cookieParser());
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require('bcryptjs');

app.set('view engine', 'ejs');

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "222"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "111"
  }
};

const users = {
  "111": {
    id: "111",
    email: "1234@number.com",
    password: bcrypt.hashSync("123", 10)
  },
  "222": {
    id: "222",
    email: "aaa@bbb.com",
    password: bcrypt.hashSync("abc", 10)
  }
};

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined) {
    res.redirect("/login");
    return;
  }
  let linksToPass = urlsForUser(req.cookies["user_id"]);
  const templateVars = { urls: linksToPass, userObject: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined) {
    const templateVars = { urls: urlDatabase, userObject: false };
    res.redirect("/login");
    return;
  }
  let randomString = generateRandomString();
  urlDatabase[randomString] = { userID: req.cookies["user_id"], longURL: req.body.longURL };
  res.redirect(`http://localhost:${PORT}/urls/${randomString}`);
});

app.get("/urls/new", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined) {
    const templateVars = { urls: urlDatabase, userObject: false };
    res.redirect("/login");
    return;
  }
  const templateVars = { userObject: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (users[req.cookies["user_id"]] === undefined) {
    const templateVars = { urls: urlDatabase, userObject: false };
    res.redirect("/login");
    return;
  }
  const templateVars =
  {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userObject: users[req.cookies["user_id"]]
  };

  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVariable = { userObject: users[req.cookies["user_id"]] }
  res.render("register", templateVariable);
});

app.post("/register", (req, res) => {

  const emailToAdd = req.body.email;
  const passwordToAdd = req.body.password;

  if (!emailToAdd || !passwordToAdd) {
    return res.status(400).send("email or password cannot be blank");
  }

  const userToFind = findUser(emailToAdd);

  if (userToFind) {
    return res.status(400).send('Email is already in use!');
  }

  const hashedPassword = bcrypt.hashSync(passwordToAdd, 10);

  const randomId = generateRandomString();
  users[randomId] = {
    id: randomId,
    email: emailToAdd,
    password: hashedPassword
  };

  res.redirect("/login");
});

app.post("/urls/:shortURL/delete", (req, res) => {

  if (urlDatabase[req.params.shortURL].userID !== req.cookies["user_id"]) {
    return res.status(401).send("You are unautherized to do that.");
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const codeToSearch = req.params.shortURL;

  if (!urlDatabase[codeToSearch]) {
    return res.status(404).send("Code does not exist!");
  }

  const longURLToRedirect = urlDatabase[codeToSearch]["longURL"];
  res.redirect(longURLToRedirect);
});

app.post("/urls/:id", (req, res) => {

  if (urlDatabase[req.params.id].userID !== req.cookies["user_id"]) {
    return res.status(401).send("You are unautherized to do that.");
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const emailToLog = req.body.email;
  const passwordToLog = req.body.password;

  if (!emailToLog || !passwordToLog) {
    return res.status(400).send("email or password cannot be blank");
  }

  const userToFind = findUser(emailToLog);

  if (!userToFind) {
    return res.status(403).send('User not found!');
  }


  if (!bcrypt.compareSync(passwordToLog, userToFind.password)) {
    return res.status(403).send('Password does not match!');
  }

  res.cookie("user_id", userToFind.id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVariable = { userObject: users[req.cookies["user_id"]] }
  res.render("login", templateVariable);
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
};

const findUser = function (email) {

  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return false;
};

const urlsForUser = function (id) {

  let objectToReturn = {};

  for (const siteId in urlDatabase) {
    if (urlDatabase[siteId].userID === id) {
      objectToReturn[siteId] = urlDatabase[siteId];
    }
  }
  return objectToReturn;
};