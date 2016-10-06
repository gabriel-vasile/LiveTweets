# Live Tweets
Real-time tweets in your area

* [Currently deployed here](http://livetweets.meteor.com/)
\*Not working anymore. Meteor shut down the free host! 

To run:

1) clone the repository

2) edit file server/helpers/tweeterCredentials.js with your own credentials

3) run with meteor

It seems like Twitter lowered the ammount of posts coming through the streaming API, 
so I made the area from which twits are captured bigger to increase the chances of seeing some activity on the map.
Anyway, the number of twits that the app receives is way smaller than the total, so unless you emit a post from 
a region with weak activity, there is a big chance you won't see it appear on map.
