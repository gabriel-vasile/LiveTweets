Meteor.startup(function() {
    var Twit = createTwit();
    var stream = createTwitStream(Twit)
    publishTweets();

})



