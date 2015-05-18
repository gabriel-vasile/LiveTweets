Meteor.methods({
    //called from the client whenever the client clicks on map
    setGeo2User: function(geo) {
        if (geo.lat) {
            Meteor.users.update({
                _id: Meteor.userId()
            }, {
                $set: {
                    "geo.lat": geo.lat,
                    "geo.lng": geo.lng

                }
            });
        }
    },
    //called from the server when a tweet has either the geo attribute or the place attribute
    //is also filters the tweets in a way that only the tweets that are in one of the users area are inserted 
    insertTweet: function(tweet) {

        var users = Meteor.users.find().fetch()

        //no point in inserting tweets if no user is there to see them.
        if (users.length == 0) return

        var geoToInsert;

        //check for each user if the current tweet is in his area
        for (var i = 0; i < users.length; i++)
            if (geoToInsert = tweetInUserArea(tweet.geo, users[i].geo)) {
                Tweets.insert({
                    text: tweet.text,
                    geo: geoToInsert,
                    name: tweet.name,
                    profileImage: tweet.profileImage,
                    entities: tweet.entities
                })

                //whenever a new tweet is inserted delete the oldest one
                //keep 15 tweets as cache
                if (Tweets.find().count() > 15) {
                    var lastTweet = Tweets.findOne({}, {
                        sort: ["_id", "desc"]
                    });

                    //delete the oldest tweet asyncronously so it doesn't block 
                    Tweets.remove(lastTweet._id, function(err, res) {
                        if (err) {
                            console.log(err)
                            return
                        }
                        //console.log(res)
                    })
                }

                //no need to insert a tweet if it was emitted in a area that is common to 2 users
                //they will both get it even if it inserted only once
                break;
            }


    }

})