var express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session')
    , config = {
        CONSUMER_KEY : '-----------',
        CONSUMER_SECRET : '-----------'
    }
    , app = express()
    , Fitbit = require('fitbit');

app.use(cookieParser());
app.use(session({secret: 'hekdhthigib'}));
app.listen(3000, 'localhost');

// OAuth flow
app.get('/', function (req, res) {
    // Create an API client and start authentication via OAuth
    var client = new Fitbit(config.CONSUMER_KEY, config.CONSUMER_SECRET);

    client.getRequestToken(function (err, token, tokenSecret) {
        if (err) {
            // Take action
            return;
        }

        req.session.oauth = {
            requestToken: token
            , requestTokenSecret: tokenSecret
        };
        res.redirect(client.authorizeUrl(token));
    });
});

// On return from the authorization
app.get('/cb', function (req, res) {
    var verifier = req.query.oauth_verifier
        , oauthSettings = req.session.oauth
        , client = new Fitbit(config.CONSUMER_KEY, config.CONSUMER_SECRET);

    // Request an access token
    client.getAccessToken(
        oauthSettings.requestToken
        , oauthSettings.requestTokenSecret
        , verifier
        , function (err, token, secret) {
            if (err) {
                // Take action
                return;
            }

            oauthSettings.accessToken = token;
            oauthSettings.accessTokenSecret = secret;

            res.redirect('/foods');
        }
    );
});

// Display some stats
app.get('/stats', function (req, res) {
    client = new Fitbit(
        config.CONSUMER_KEY
        , config.CONSUMER_SECRET
        , { // Now set with access tokens
            accessToken: req.session.oauth.accessToken
            , accessTokenSecret: req.session.oauth.accessTokenSecret
            , unitMeasure: 'en_GB'
        }
    );

    // Fetch todays activities
    client.getActivities({date:new Date(1432005143078)},function (err, activities) {
        if (err) {
            // Take action
            return;
        }

        // `activities` is a Resource model
        res.send('Total steps today: ' + activities.steps());
    });
});
// Display some foods!
app.get('/foods', function (req, res) {
    client = new Fitbit(
        config.CONSUMER_KEY
        , config.CONSUMER_SECRET
        , { // Now set with access tokens
            accessToken: req.session.oauth.accessToken
            , accessTokenSecret: req.session.oauth.accessTokenSecret
            , unitMeasure: 'en_GB'
        }
    );

//    expect(helpers.resourceUrl('foods'))
//        .toBe('https://api.fitbit.com/1/user/-/foods/log/date/' + today + '.json');

    // Fetch todays activities
    client.getFoods({date:new Date()},function (err, foods) {
        if (err) {
            // Take action
            return;
        }

        // `activities` is a Resource model
        res.json(foods._attributes.summary);
    });
});