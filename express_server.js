const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require('bcryptjs');

const cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['my secret key'],
}))

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
  console.log("1 - GET /")
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  console.log("2 - GET /urls")
  if (users[req.session.user_id] === undefined) {
    res.redirect("/login");
    return;
  }
  let linksToPass = urlsForUser(req.session.user_id);
  const templateVars = { urls: linksToPass, userObject: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log("3 - POST /urls")
  if (users[req.session.user_id] === undefined) {
    const templateVars = { urls: urlDatabase, userObject: false };
    res.redirect("/login");
    return;
  }
  let randomString = generateRandomString();
  urlDatabase[randomString] = { userID: req.session.user_id, longURL: req.body.longURL };
  res.redirect(`/urls/${randomString}`);
});

app.get("/urls/new", (req, res) => {
  console.log("4 - GET /urls/new")
  if (users[req.session.user_id] === undefined) {
    const templateVars = { urls: urlDatabase, userObject: false };
    res.redirect("/login");
    return;
  }


  const templateVars = { userObject: users[req.session.user_id] };
  console.log(templateVars)
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  console.log("5 - GET /urls/:shortURL")
  if (users[req.session.user_id] === undefined) {
    const templateVars = { urls: urlDatabase, userObject: false };
    res.redirect("/login");
    return;
  }
  const templateVars =
  {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userObject: users[req.session.user_id]
  };

  console.log(templateVars);

  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  console.log("6 - GET /register")
  const templateVariable = { userObject: users[req.session.user_id] }
  res.render("register", templateVariable);
});

app.post("/register", (req, res) => {
  console.log("7 - POST /register")
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
  console.log("8 - POST /urls/:shortURL/delete")
  console.log(urlDatabase)
  if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
    return res.status(401).send("You are unautherized to do that.");
  }

  delete urlDatabase[req.params.shortURL];

  console.log(urlDatabase)
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  console.log("9 - GET /u/:shortURL")
  const codeToSearch = req.params.shortURL;

  if (!urlDatabase[codeToSearch]) {
    return res.status(404).send("Code does not exist!");
  }

  const longURLToRedirect = urlDatabase[codeToSearch]["longURL"];
  res.redirect(longURLToRedirect);
});

app.post("/urls/:id", (req, res) => {
  console.log("10 - POST /urls/:id")

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(401).send("You are unautherized to do that.");
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  console.log("11 - POST /login")
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

  req.session.user_id = userToFind.id;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {

  console.log("12 - GET /login")
  const templateVariable = { userObject: users[req.session.user_id] }
  res.render("login", templateVariable);
});

app.post("/logout", (req, res) => {
  console.log("13 - POST /logout")
  res.clearCookie('session')
  res.clearCookie('session.sig')
  // res.clearCookie("user_id");
  res.redirect("/login");
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