resolveGeolocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(geolocationAccepted, geolocationDenied);
    } else {
        alert('Oh dear. What is this IE6?');
    }
}

geolocationAccepted = function(geo) {

    var latlng = gmaps.browserGeo2LatLng(geo);
    map.setCenter(latlng);

    //on the server setGeo2User cannot call latlng.lat() and also Google likes to change his internal variables names
    //from time to time.
    //while developing this app Google changed the variables names for latitude and longitude from 'A' and 'F' to 'j' and 'C'

    //this is a workaround to avoid refactoring each time Google changes it
    var geoToSet = {
        lat: latlng.lat(),
        lng: latlng.lng()
    }
    userMarker.setPosition(latlng)
    gmaps.scheduleChuckSummon(latlng)
    //console.log(geoToSet)
    //tell the server where the user is at
    setGeo(geoToSet)

}

geolocationDenied = function(err) {
    console.log(err)
    //if users dont want to reveal thei locations then we're going to NY
    var latlng = new google.maps.LatLng(40.741730, -73.986397);
    map.setCenter(latlng);
    userMarker.setPosition(latlng)
    gmaps.scheduleChuckSummon(latlng)
    var geoToSet = {
            lat: latlng.lat(),
            lng: latlng.lng()
        }
        //console.log(geoToSet)
    setGeo(geoToSet)

}

initGMaps = function() {
    GoogleMaps.init({
            'sensor': true,
            libraries: 'places'
        },
        initGMaps
    );

    function initGMaps() {



        var mapOptions = {
            streetViewControl: false,
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        //the map.
        map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

        //the container for tweet when the user clicks on it
        //a single infowindow is recycled the whole time
        infowindow = new google.maps.InfoWindow();

        //when the map is loaded see if the user has geolocation enabled
        google.maps.event.addListenerOnce(map, 'idle', function() {
            resolveGeolocation();
        });

        //the marker placed where the user clicks on map
        userMarker = new google.maps.Marker({
            icon: 'tweet.png',
            map: map
        })

        //make the search bar interactive
        var input = document.getElementById('search-predict');
        autocomplete = new google.maps.places.Autocomplete(input);

        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            clearOldMarkers();
            var place = autocomplete.getPlace();
            //console.log(place.geometry.location)
            var geoToSet = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            }

            //if no activity in user area notify him
            scheduleChuckSummon(place.geometry.location)

            userMarker.setPosition(place.geometry.location)
            setGeo(geoToSet)

            map.setCenter(place.geometry.location);
            map.setZoom(10);
        });

        google.maps.event.addListener(map, 'click', function(eventData) {

            //place the marker where the user clicked
            userMarker.setPosition(eventData.latLng)

            //clear the old markers from the previous location
            clearOldMarkers();

            var geoToSet = {
                lat: eventData.latLng.lat(),
                lng: eventData.latLng.lng()
            }
            setGeo(geoToSet)

            //if no tweets in this location summon Chuck Norris
            scheduleChuckSummon(eventData.latLng);

        })
    }

    function clearOldMarkers() {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null)
        }
        markers = []
    }

    function scheduleChuckSummon(latLng) {
        Meteor.clearTimeout(timeoutId)
        timeoutId = Meteor.setTimeout(function() {

            if (markers.length === 0) {
                var geoToSet = {
                    lat: latLng.lat(),
                    lng: latLng.lng()
                }
                var chuckTweet = {
                    text: "Pretty lonely here. Consider moving to a bigger city,<br>" +
                        "or maybe one where the local hour is not 5 in the morning.<br>" +
                        "Tip: New York never sleeps.",
                    name: "chucknorris",
                    geo: geoToSet,
                    profileImage: "chuck.png",
                    entities: undefined
                }
                createTweetOnMap(chuckTweet, true)
            }


        }, 13000)
    }

    function browserGeo2LatLng(geo) {
        if (!geo) return
        return new google.maps.LatLng(geo.coords.latitude, geo.coords.longitude);
    }

    function tweetGeo2LatLng(geo) {
        if (!geo) return
        return new google.maps.LatLng(geo.lat, geo.lng)
    }

    //tweets are plain text
    //links are in the entities property
    //function links the plain text to the urls
    function addLinks(tweet) {
        function insertHrefInTag(text, url) {
            var out = "<a href='" + url +
                "' target='_blank'>" + text + "</a>"
            return out
        }
        var out = tweet.text;
        out = out.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
            var tweetText = url;
            if (tweet.entities.urls !== undefined && tweet.entities.urls.length > 0) {
                var myUrl = _.find(tweet.entities.urls, function(urlObj) {
                    return urlObj.url === url;
                });
                if (myUrl !== undefined && myUrl !== null) {
                    tweetText = myUrl.display_url;
                }
            }
            //return tweetText.link(url);
            return insertHrefInTag(tweetText, url)
        });

        out = out.replace(/[#]+[A-Za-z0-9-_]+/g, function(hash) {
            txt = hash.replace("#", "");
            //return hash.link("http://twitter.com/search/%23" + txt);
            return insertHrefInTag(hash, "http://twitter.com/search/%23" + txt)
        });
        out = out.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {
            var username = u.replace("@", "")
                //return u.link("http://twitter.com/" + username);
            return insertHrefInTag(u, "http://twitter.com/" + username)
        });
        return out;
    }



    //place a tweet on the map or a notification frum Chuck Norris 
    function createTweetOnMap(tweet, chuck) {
        //var icon = tweet.profileImage;

        //Chuck icon is bigger
        var iconSize = chuck ? 50 : 36
        var icon = new google.maps.MarkerImage(
            tweet.profileImage, //url
            new google.maps.Size(iconSize, iconSize) //size
        );
        var position = tweetGeo2LatLng(tweet.geo)
        var marker = new google.maps.Marker({
                position: position,
                icon: icon,
                map: map,
                animation: google.maps.Animation.DROP,
                zIndex: google.maps.Marker.MAX_ZINDEX++ //last tweet is the one upfront
            })
            //adding some properties to the marker object to be used by the infowindow
        marker.name = tweet.name;
        marker.text = addLinks(tweet);
        google.maps.event.addListener(marker, 'click', function() {
            //infowindow = new google.maps.InfoWindow();
            infowindow.close()
            infowindow.setContent("<a href='https://twitter.com/" + this.name + "' target='_blank'>" + "@" + this.name + "</a> said:<br>" + "<em>" + this.text + "</em>")
            infowindow.open(map, this)
        })
        markers.push(marker)
    }

    return {
        browserGeo2LatLng: browserGeo2LatLng,
        tweetGeo2LatLng: tweetGeo2LatLng,
        createTweetOnMap: createTweetOnMap,
        scheduleChuckSummon: scheduleChuckSummon
    }
}

observeTweets = function() {

    Tweets.find().observeChanges({
        //whenever a new tweet comes down the wire.
        added: function(id, doc) {

            //add the tweet on the map
            gmaps.createTweetOnMap(doc);

            //keep only maximum 15 markers on map
            if (markers.length > 15) {
                markers[0].setMap(null);
                markers.shift();
            }


        }
    })
}

setGeo = function(geo) {
    console.log("User watching position: LAT:" + geo.lat + "LNG:" + geo.lng);
    Meteor.call('setGeo2User', geo, function(err, res) {
        Meteor.subscribe('tweets');
    })
}