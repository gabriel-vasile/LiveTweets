
//users must have a location attribute which is updated whenever the client click on map
Meteor.users.allow({
    update: function(userId, user, fields, modifier) {
        // can only change your own documents
        if (user._id === userId) {
            Meteor.users.update({
                _id: userId
            }, modifier);
            return true;
        } else return false;
    }
});

Meteor.users.find({
    "status.online": true
}).observe({
    added: function(id) {
        // id just came online
        console.log(id + ' is now online')
        /*
        Meteor.users.update(id._id, {
            $set: {
                "geo.lat": 40.741730,
                "geo.lng": -73.986397
            }
        })*/
        //var curUser = Meteor.users.findOne(id._id);
        //console.log('Last user geo: '+ curUser.geo.lat+ " "+curUser.geo.lng)
    },
    removed: function(id) {

        console.log(id + ' is now offline')

        //delete the oldest tweet asyncronously so it doesn't block 
        Meteor.users.remove(id._id, function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            console.log(res)
        })
        /*
        Meteor.users.update(id._id, {
            $set: {
                "geo.A": 0,
                "geo.F": 0
            }
        })*/

    }
});