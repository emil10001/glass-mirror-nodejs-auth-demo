/**
 * Module dependencies.
 */

var express = require('express')
    , http = require('http')
    , googleapis = require('googleapis')
    , OAuth2Client = googleapis.OAuth2Client;

// Use environment variables to configure oauth client.
// That way, you never need to ship these values, or worry
// about accidentally committing them
var oauth2Client = new OAuth2Client(process.env.MIRROR_DEMO_CLIENT_ID,
    process.env.MIRROR_DEMO_CLIENT_SECRET, process.env.MIRROR_DEMO_REDIRECT_URL);

var app = express();

// all environments
app.set('port', 8081);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

var success = function (data) {
    console.log('success', data);
};
var failure = function (data) {
    console.log('failure', data);
};
var gotToken = function () {
    googleapis
        .discover('mirror', 'v1')
        .execute(function (err, client) {
            if (!!err) {
                failure();
                return;
            }
            console.log('mirror client', client);
            listTimeline(client, failure, success);
            insertHello(client, failure, success);
            insertContact(client, failure, success);
            insertLocation(client, failure, success);
            getLocation(client, failure, success);
        });
};

// send a simple 'hello world' timeline insert card with a reply and delete options
var insertHello = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.insert(
        {
            "text": "Hello world",
            "callbackUrl": "https://mirrornotifications.appspot.com/forward?url=http://localhost:8081/reply",
            "menuItems": [
                {"action": "REPLY"},
                {"action": "DELETE"}
            ]
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};

// send a simple "Let's meet at the Hacker Dojo!" message timeline insert card with a nested property of "location" showing the associated GPS location associated with the "location". Navigate, Reply, and Delete options.
var insertLocation = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.insert(
        {
            "text": "Let's meet at the Hacker Dojo!",
            "callbackUrl": "https://mirrornotifications.appspot.com/forward?url=http://localhost:8081/reply",
            "location": {
                "kind": "mirror#location",
                "latitude": 37.4028344,
                "longitude": -122.0496017,
                "displayName": "Hacker Dojo",
                "address": "599 Fairchild Dr, Mountain View, CA"
            },
            "menuItems": [
                {"action":"NAVIGATE"},
                {"action": "REPLY"},
                {"action": "DELETE"}
            ]
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};

//inserts a contact and icon for that contact
var insertContact = function (client, errorCallback, successCallback) {
    client
        .mirror.contacts.insert(
        {
            "id": "emil10001",
            "displayName": "emil10001",
             "imageUrls": [
            "https://secure.gravatar.com/avatar/bc6e3312f288a4d00ba25500a2c8f6d9.png"
            ],
            "priority": 7,
            "acceptCommands": [
                {"type": "REPLY"},
                {"type": "POST_AN_UPDATE"},
                {"type": "TAKE_A_NOTE"}
            ]
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};
var listTimeline = function (client, errorCallback, successCallback) {
    client
        .mirror.timeline.list()
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};

// make GET request for latest GPS coordinates
var getLocation = function (client, errorCallback, successCallback) {
    client
        .mirror.locations.get(
        {
            "id": "latest"
        }
    )
        .withAuthClient(oauth2Client)
        .execute(function (err, data) {
            if (!!err)
                errorCallback(err);
            else
                successCallback(data);
        });
};

var grabToken = function (code, errorCallback, successCallback) {
    oauth2Client.getToken(code, function (err, tokens) {
        if (!!err) {
            errorCallback(err);
        } else {
            console.log('tokens', tokens);
            oauth2Client.credentials = tokens;
            successCallback();
        }
    });
};

app.get('/', function (req, res) {
    if (!oauth2Client.credentials) {
        // generates a url that allows offline access and asks permissions
        // for Mirror API scope.
        
        var scopes = [
          'https://www.googleapis.com/auth/glass.timeline',
          'https://www.googleapis.com/auth/glass.location'
        ];
        
        var url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes.join(" ")
        });
        res.redirect(url);
    } else {
        gotToken();
    }
    res.write('Glass Mirror API with Node');
    res.end();

});
app.get('/oauth2callback', function (req, res) {
    // if we're able to grab the token, redirect the user back to the main page
    grabToken(req.query.code, failure, function () {
        res.redirect('/');
    });
});
app.post('/reply', function(req, res){
    console.log('replied',req);
    res.end();
});
app.post('/location', function(req, res){
    console.log('location',req);
    res.end();
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
