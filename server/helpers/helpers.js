/*areaGeo can be:
            -an array of points defining an area on the map
                -in this case the function returns a randomized point inside areaGeo
            -an object containing latitude and longitude of a single point
                -in this case the function returns areaGeo if it is near userGeo*/
tweetInUserArea = function(areaGeo, userGeo) {

    //userGeo is undefined when the user just connected but Meteor didnt gave time to set his geo
    if (userGeo === undefined) return false;

    //if areaGeo is an array => it defines an bounding box
    if (Array.isArray(areaGeo)) {
        if ((userGeo.lat > areaGeo[0][1]) && (userGeo.lat < areaGeo[1][1]) &&
            (userGeo.lng > areaGeo[0][0]) && (userGeo.lng < areaGeo[2][0])) {

            var cityWidth = Math.abs(areaGeo[0][0] - areaGeo[3][0]),
                cityHeight = Math.abs(areaGeo[0][1] - areaGeo[1][1]),
                randomWidth = Math.random() * cityWidth,
                randomHeight = Math.random() * cityHeight
            return {
                lat: areaGeo[0][1] + randomHeight,
                lng: areaGeo[0][0] + randomWidth
            };

        }

        //if areaGeo is an object(a single position on map) and the userGeo is near 
        //return this position

    } else if (typeof areaGeo === 'object') {

        if ((Math.abs(areaGeo.lat - userGeo.lat) < .45) &&
            (Math.abs(areaGeo.lng - userGeo.lng) < .45))
            return areaGeo;
    }

    return false;
}

createTwit = function() {
    return new TwitMaker(tweeterCredentials);
}


//the Twitter api is really restrictive with streams, which means it cannot accept multiple streaming request from the same app
//this means it cannot request stream for each city
//instead the app has to request streams from the whole world and filter them by city
createTwitStream = function(streamCreator) {

    //rought aproximation latitude and longitude of the world.
    var loc = ['-180', '-58', '180', '79'];
    var stream = streamCreator.stream('statuses/filter', {
        locations: loc
    });

    //stream.on event emitter is async so the callback of it needds to be wrapped in bindEnvironement
    stream.on('tweet', Meteor.bindEnvironment(filterTweet, function(err) {
        console.log(err);
    }))

    return stream;
}

//for each send him only the tweets that are near his selection
publishTweets = function() {
    Meteor.publish('tweets', function() {
        var userLat, userLng;
        if (!this.userId) return;
        var user = Meteor.users.findOne(this.userId);
        if (!user.geo) return;
        userLat = user.geo.lat;
        userLng = user.geo.lng;

        return Tweets.find({
            "geo.lat": {
                $lt: userLat + .45,
                $gt: userLat - .45
            },
            "geo.lng": {
                $lt: userLng + .45,
                $gt: userLng - .45
            }
        });
    });

}


//filter tweets to further process only if they can be located.
//tweets can be localized by:
//  -geo attribute - single point on map
//  -place attribute - a city, country, street, whatever
filterTweet = function(tweet) {


    if (tweet.geo || tweet.place.place_type === 'city') {
        var tweetGeo;
        if (tweet.geo) {
            //mongodb cant handle array indexes in its filters so I insert locations as objects instead of arrays
            tweetGeo = {
                lat: tweet.geo.coordinates[0],
                lng: tweet.geo.coordinates[1]
            };
        } else if (tweet.place.place_type === 'city') {
            tweetGeo = tweet.place.bounding_box.coordinates[0];
        } else return;

        //don't need all the data that comes bundled in the tweet
        //only need text, geo, user name, user profile picture and links in the tweet
        var simplifiedTweet = {
            text: tweet.text,
            geo: tweetGeo,
            name: tweet.user.screen_name,
            profileImage: tweet.user.profile_image_url,
            entities: tweet.entities
        };
        Meteor.call('insertTweet', simplifiedTweet, function(err, res) {
            if (err) {
                console.log(err);
                return;
            }
        })
    }

}
