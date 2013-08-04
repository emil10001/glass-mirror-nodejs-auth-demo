Glass Mirror API using node.js Demo
======================================

A brief demo showing how to authenticate and make a couple simple requests with the Google Glass Mirror API using node.js

All this does right now is allows a user to authenticate, pushes the message 'hello world' to Glass, and requests the user's timeline for the registered app. 

# Instructions

* follow the instructions in the [Mirror API](https://developers.google.com/glass/overview) documentation for registering a new app
* pull down this repository and run `npm install`
* copy `sample_config.json` to `config.json`, and replace the values with those from the Google Developer's console
* run `node app.js`
* visit the app in your browser, and authenticate with Google

# Notes

Currently, this is incredibly simple, and as such is completely lacking in style, structure, and functionality. This is intended to demonstrate two things, first how to authenticate with Google for the Mirror API with OAuth2, using node.js. Second, it begins to show how you can use node.js to make requests with the Mirror API. Think of it as the quick-start for node.js. 
