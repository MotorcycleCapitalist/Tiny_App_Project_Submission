var cookieSesion = require('cookie-session')

const express = require("express");
const bcrypt = require("bcryptjs")

const app = express();
const PORT = 3001; // default port 8080

const { getUserEmail } = require("./helpers.js")

app.use(cookieSesion({
  name: 'session',
  keys: ['tinnyapp'],
}))
app.use(express.urlencoded({ extended: true }));

/** Our database of users */
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "123",
  },
  user3RandomID: {
    id: "user3RandomID",
    email: "h@gmail.com",
    password: "$2a$10$VtKRObWLSM.DY6BXgGsieebg9WyIWg9n8GGOfhsfh1wH6eCE0GvDS",
  },
  user4RandomID: {
    id: "user4RandomID",
    email: "ha@gmail.com",
    password: "$2a$10$VtKRObWLSM.DY6BXgGsieebg9WyIWg9n8GGOfhsfh1wH6eCE0GvDS",
  },
};



app.set("view engine", "ejs")

/** Our databse of URLs */
const urlDatabase = {
  "b2xVn2": {
    longURL: "https://www.lighthouselabs.ca",
    userID: "aDlK20", 
    created_at: "20/02/2022",
    visitors: ["abc1", "abc2", "abc3"], /** IDs of visitors */
    df_visitors: 4, 
    total_visitors: 5
  },
  "9sm5xK": {
    longURL: "https://www.google.com",
    userID: "lifueD34", 
    created_at: "20/02/2022",
    visitors: ["abc1", "abc2", "abc3"], 
    df_visitors: 4, 
    total_visitors: 5
  },
};
/** POSTs */
/** Create a new url */
app.post("/urls", (req, res) => {
  const ts = Date.now()
  const date = new Date(ts) /** Field to save the current date */
  const userLogged = req.session.user_id
  if (userLogged) {
    const randomId = generateRandomString()
    const longURL = req.body.longURL
    /** Create the obj for the new url */
    const newURL = {
      [randomId]: {
        longURL: longURL,
        userID: userLogged, 
        visitors: [],
        total_visitors:0,
        created_at: date,
        df_visitors: 0,
      }
    }
    Object.assign(urlDatabase, newURL) /** add the new obj to our database */

    res.redirect(`/urls/${randomId}`); /** Redirect to the url that as already created */
  } else {

    res.status(403).send("<h1>You should be logged to do this action.</h1>");
  }
});

/** Delete a url */
app.post("/urls/:id/delete", (req, res) => {
  const userLogged = req.session.user_id
  if (userLogged) {
    const myURLS = Object.keys(urlDatabase)
      .filter((key) => key == req.params.id)

    if (myURLS.length > 0) {
      if (urlDatabase[req.params.id].userID == userLogged) {
        delete urlDatabase[req.params.id] 
      res.redirect("/urls"); 
      }else{
        res.status(403).send("<h1>You are no the owner of this link.</h1>")
      }
    } else {
      res.status(403).send("<h1>The link doesn't exist.</h1>");
    }
  } else {
    res.status(403).send("<h1>You should be logged to do this action.</h1>");
  }
});

/**Edit a url */
app.post("/urls/:id", (req, res) => {
  const userLogged = req.session.user_id

  if (userLogged) {

    const myURLS = Object.keys(urlDatabase)
      .filter((key) => key == req.params.id)
    if (myURLS.length > 0) {
      urlDatabase[req.params.id].longURL = req.body.longURL
      const templateVars = {
        user: users[req.session.user_id],
        urls: urlsForUser(userLogged)
      };

      res.render("urls_index", templateVars); 

    } else {
      res.status(403).send("<h1>You dont have access to do this.</h1>");

    }
  } else {
    res.status.send("<h1>You should be logged to do this action.</h1>");
  }
});

/** Log in into the site */
app.post("/login", (req, res) => {

  const { email, password } = req.body
  const userLogin = getUserEmail(email, users)

  if (userLogin) {
    if (bcrypt.compareSync(password, users[userLogin].password)) {/** Compare the encrypt password */
      req.session.user_id = userLogin
      
      res.redirect("/urls")
    } else {

      res.status(403).send("<h1>Error 403 Invalid credentials</h1>")
    }

  } else {
    /** At this point we send the same messages because as a Security practice we must not say to the hackers which parameters is incorrect, 
     * but we know that the message above is for the password and this one is for email. 
     */
    res.status(403).send("<h1>Error 403 Invalid credentials</h1>")

  }

});

/** Logout for the site */
app.post("/logout", (req, res) => {
  req.session = null; /** Delete the user session id */
  res.redirect("/login")
});

/**Create a new user */
app.post("/register", (req, res) => {

  const { password, email } = req.body
  const randomId = generateRandomString() /** Generate a ramdon Id for the new user */
  const newUser = {
    [randomId]: {
      id: randomId,
      email: email,
      password: bcrypt.hashSync(password, 10), /** Encrypt the password */
    }
  }
  /** Check that all the form is completed correctly and that is not empty */
  if (email == "" || email == null || password == "" || password == null) {
    res.status(400).send("<h1>Error 400 All fields are required </h1>")

  }
  if (getUserEmail(email, users)) {/** Check if the user exist, in case return null wont enter in this block */
    res.status(400).send("<h1>Error 400 User already exist</h1>")
  }

  Object.assign(users, newUser) /** Assing the new usser obj to our obj of users */

  req.session.user_id = randomId /** Set the session coookie whit the new Random id */

  res.redirect("/urls")

});


/** GETS */

/** Show all the URLs of the user logged */
app.get("/urls", (req, res) => {

  const userLogged = req.session.user_id /** Get user Cookie */

  if (userLogged) {
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(userLogged) /** Get only the urls that the current user is owner */
    };
    res.render("urls_index", templateVars);
  } else {

    res.status(403).send("<h1>You should be logged to do this action.</h1>");
  }

});

/** Get the create view */
app.get("/register", (req, res) => {

  const userLogged = req.session.user_id
  if (userLogged) {
    res.redirect("/urls")
  } else {
    const templateVars = {
      user: null,
      urls: urlsForUser(userLogged)
    };
    res.render("form.ejs", templateVars);
  }

});

/** Get the login view */
app.get("/login", (req, res) => {
  const userLogged = req.session.user_id
  if (userLogged) {
 
    res.redirect("/urls")
  } else {
    const templateVars = {
      user: null,
      urls: null
    };
    res.render("login.ejs", templateVars);
  }

})

/** Redirect the short url to the original URL site */
app.get("/u/:id", (req, res) => {
  const userLogged = req.session.user_id
  const idURL = req.params.id
  const longURL = urlDatabase[idURL]?.longURL
  if (longURL) {
    checkVisitors(userLogged, idURL) /** Check if the user hadn't visited the shorturl before */
    urlDatabase[idURL].total_visitors +=  1 

    res.redirect(longURL);

  } else {
    res.status(400).send("<h1>This URLs doesn't exists.</h1>")
  }
});

/** Get the view to create a new short url */
app.get("/urls/new", (req, res) => {

  const userLogged = req.session.user_id
  if (userLogged) {
    const templateVars = {
      user: users[req.session.user_id],
      id: req.params.id, longURL: urlDatabase[req.params.id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }


});

/** Get the view for edit the url */
app.get("/urls/:id", (req, res) => {
  const userLogged = req.session.user_id
  const idURL = req.params.id
  
  if (userLogged) {
    /** Find short url inside of Database of urls */
    const myURLS = Object.keys(urlDatabase)
      .filter((key) => key == req.params.id)


    if (myURLS.length > 0) { /** if its 0 mean that doesnt exits */
      if (urlDatabase[idURL].userID == userLogged) { /** check if the user logged is the owner */
       
      const templateVars = {
        user: users[req.session.user_id],
        id: idURL, url: urlDatabase[idURL]
      };


      res.render("urls_show", templateVars);
      }else{
        res.status(403).send("<h1>You are no the owner of this link.</h1>")
      }
    } else {
      res.status(403).send("<h1>This short link doesn't exist.</h1>");

    }
  } else {
    res.status(403).send("<h1>You should be logged to do this action.</h1>");
  }
});

/**Default route */
app.get("/", (req, res) => {
  /**  Default URL for the site*/
  req.session.user_id ? res.redirect("/urls") : res.redirect("/login");
  
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


/** Generate a random string, the string generated has 10 character*/
const generateRandomString = function () {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  var length = 10 /** The string's lenght */
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}


/** Get the URLs that the user logged is owner */
const urlsForUser = (id) => {
  const names = Object.keys(urlDatabase)
    .filter((key) => urlDatabase[key].userID == id)
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: urlDatabase[key]
      });
    }, {});

  return names
}
/**  Verify if it is the first time a user asked for a shortlink */
const checkVisitors = (idUser = {}, idUrl = {}) => {

    const arrayVisitors = urlDatabase[idUrl].visitors
    const existVisitor  = arrayVisitors.find(visi => visi == idUser)
  if(existVisitor){
    return true
  }else{
    urlDatabase[idUrl].visitors.push(idUser)/** Add the new user id */
    urlDatabase[idUrl].df_visitors += 1   /** Increment by 1 the different visitors that the shortlink has */
  }
     
    
}



