const passport = require('passport');
const bcrypt = require('bcrypt');

// Middleware for checking authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

module.exports = function (app, myDataBase) {
  app.route('/').get((req, res) => {
    res.render('index.pug', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
    });
  });

  // Login Route
  app.route("/login").post(passport.authenticate("local", { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  })

  // Profile Route
  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render('profile.pug', { username: req.user.username });
  });

  // Register Route
  app.route('/register').post((req, res, next) => {
    myDataBase.findOne({ username: req.body.username }, (err, user) => {
      if (err) {
        next(err);
      } else if (user) {
        res.redirect('/');
      } else {
        const hash = bcrypt.hashSync(req.body.password, 12);
        myDataBase.insertOne({
          username: req.body.username,
          password: hash
        },
          (err, doc) => {
            if (err) {
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );

  // Logout Route
  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  // Github authentication route
  app.route("/auth/github").get(passport.authenticate('github'));

  app.route("/auth/github/callback").get(passport.authenticate('github', { failureRedirect: "/" }), (req, res) => {
    req.session.user_id = req.user.id;
    res.redirect('/chat');
  });

  // Chat Route
  app.route("/chat").get(ensureAuthenticated, (req, res) => {
    res.render("chat.pug", { user: req.user })
  });

  // For Others route
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });
}