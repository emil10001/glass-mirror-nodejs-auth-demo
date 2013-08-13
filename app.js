/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, http = require('http')
, path = require('path')
, googleapis = require('googleapis')
, OAuth2Client = googleapis.OAuth2Client
, config = require('./config.json');

var oauth2Client = new OAuth2Client(config.CLIENT_ID, config.CLIENT_SECRET, config.REDIRECT_URL);

var app = express();

// all environments
app.set('port', process.env.PORT || 58305);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

var success = function(data) { console.log('success',data); };
var failure = function(data) { console.log('failure',data); };
var gotToken = function () {
    googleapis
    .discover('mirror', 'v1')
    .execute(function(err, client) {
        if (!!err){
            failure();
            return;
        }
        console.log('mirror client',client);
        listTimeline(client, failure, success);
        insertHello(client, failure, success);
        insertContact(client, failure, success);
    });
};

// send a simple 'hello world' timeline card with a delete option
var insertHello = function(client, errorCallback, successCallback){
    client
    .mirror.timeline.insert(
        {
            "text": "Hello world",
            "menuItems": [{"action": "DELETE"}]
        }
    )
    .withAuthClient(oauth2Client)
    .execute(function(err, data){
        if (!!err)
            errorCallback(err);
        else
            successCallback(data);
    });
};
var insertContact = function(client, errorCallback, successCallback){
    client
    .mirror.contacts.insert(
        {
            "id": "harold",
            "displayName": "Harold Penguin",
            "iconUrl": "https://developers.google.com/glass/images/harold.jpg",
            "priority": 7,
            "acceptCommands": [
                {"type": "POST_AN_UPDATE"},
                {"type": "TAKE_A_NOTE"}
            ]
        }
    )
    .withAuthClient(oauth2Client)
    .execute(function(err, data){
        if (!!err)
            errorCallback(err);
        else
            successCallback(data);
    });
};
var listTimeline = function(client, errorCallback, successCallback){
    client
    .mirror.timeline.list()
    .withAuthClient(oauth2Client)
    .execute(function(err, data){
        if (!!err)
            errorCallback(err);
        else
            successCallback(data);
    });
};
var grabToken = function (code, errorCallback, successCallback){
    oauth2Client.getToken(code, function(err, tokens){
        if (!!err){
            errorCallback(err);
        } else {
            console.log('tokens',tokens);
            oauth2Client.credentials = tokens;
            successCallback();
        }
    });
};

app.get('/', function(req,res){
    if (!oauth2Client.credentials){
        // generates a url that allows offline access and asks permissions
        // for Mirror API scope.
        var url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/glass.timeline'
        });
        res.redirect(url);
    } else {
        gotToken();
    }
    res.render('index', { title: 'Glass Mirror API with Node' });
    res.end();

});
app.get('/oauth2callback', function(req, res){
    // if we're able to grab the token, redirect the user back to the main page
    grabToken(req.query.code, failure, function(){ res.redirect('/'); });
});


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
