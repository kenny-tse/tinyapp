const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require('bcryptjs');

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['my secret key']
}));

const { getUserByEmail, urlsForUser } = require("./helpers");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "222"
  },
  i3BoGr: {
    longURL: "https://www.google.com/",
    userID: "111"
  },
  d6ujk8: {
    longURL: "https://www.wikipedia.org/",
    userID: "111"
  },
  g7red3: {
    longURL: "https://developer.mozilla.org/en-US/",
    userID: "111"
  },
  o4j6t: {
    longURL: "https://www.lighthouselabs.ca/",
    userID: "111"
  },
  higt90: {
    longURL: "https://ca.yahoo.com/",
    userID: "111"
  },
  hfer33: {
    longURL: "https://www.youtube.com/",
    userID: "111"
  }
};

const users = {
  "111": {
    id: "111",
    email: "John_bob@gmail.com",
    password: bcrypt.hashSync("123", 10)
  },
  "222": {
    id: "222",
    email: "aaa@bbb.com",
    password: bcrypt.hashSync("abc", 10)
  }
};

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("You are unautherized to be on this page!");
  }
  let linksToPass = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { urls: linksToPass, userObject: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }

  let randomString = generateRandomString();
  urlDatabase[randomString] = { userID: req.session.user_id, longURL: req.body.longURL };
  res.redirect(`/urls/${randomString}`);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("You are unautherized to do that. Please login!");
    return;
  }
  const templateVars = { userObject: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send("You are unautherized to do that.");
  }

  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("This short URL was not found!");
  }

  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    return res.status(401).send("You are unautherized to do that.");
  }

  const templateVars =
  {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userObject: users[req.session.user_id]
  };

  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const templateVariable = { userObject: users[req.session.user_id] };
  res.render("register", templateVariable);
});

app.post("/register", (req, res) => {
  const emailToAdd = req.body.email;
  const passwordToAdd = req.body.password;

  if (!emailToAdd || !passwordToAdd) {
    return res.status(400).send("email or password cannot be blank");
  }

  const userToFind = getUserByEmail(emailToAdd, users);

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
  if (!req.session.user_id) {
    return res.status(401).send("You are unautherized to do that. Please login.");
  }

  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.status(401).send("You are unautherized to do that. You do not own this shortURL. Please login to the relevant account.");
  }

  delete urlDatabase[req.params.shortURL];

  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const codeToSearch = req.params.shortURL;

  if (!urlDatabase[codeToSearch]) {
    return res.status(404).send("This shortURL does not exist!");
  }

  const longURLToRedirect = urlDatabase[codeToSearch]["longURL"];
  res.redirect(longURLToRedirect);
});

app.post("/urls/:id", (req, res) => {

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(401).send("You are unautherized to do that.");
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const emailToLog = req.body.email;
  const passwordToLog = req.body.password;

  if (!emailToLog || !passwordToLog) {
    return res.status(400).send("Email or password cannot be blank");
  }

  const userToFind = getUserByEmail(emailToLog, users);

  if (!userToFind) {
    return res.status(403).send('User not found!');
  }


  if (!bcrypt.compareSync(passwordToLog, userToFind.password)) {
    return res.status(403).send('Password does not match!');
  }

  req.session.user_id = userToFind.id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVariable = { userObject: users[req.session.user_id] };
  res.render("login", templateVariable);
});

app.post("/logout", (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
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
