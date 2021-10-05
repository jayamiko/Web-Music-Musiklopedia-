const http = require('http');
const express = require('express');
const hbs = require('hbs');
const app = express();
const routes = require('./route/routes');
const path = require('path');
const session = require('express-session');
const connection = require('./connection/db');
const { MemoryStore } = require('express-session');
const fileUpload = require('express-fileupload');

hbs.registerHelper('dateFormat', require('handlebars-dateformat'));

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

app.use(
    session({
        secret: "Session",
        store: new MemoryStore(),
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 1000 * 60 * 60 * 3 }
    })
);
app.use(function (request, response, next) {
    response.locals.message = request.session.message;
    delete request.session.message;
    next();
});

app.use(routes);

const port = 3000;
const server = http.createServer(app);
server.listen(port);
console.debug(`Server listening on port ${port}`);