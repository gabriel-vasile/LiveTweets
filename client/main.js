//Meteor.subscribe('tweets');
map = undefined,
infowindow = undefined,
markers = [];
timeoutId = undefined;
userMarker = undefined;


Meteor.startup(function() {
    
    gmaps = initGMaps();
    observeTweets();
    $(window).keydown(function(event){
    if(event.keyCode == 13) {
      event.preventDefault();
      return false;
    }
  });

})





