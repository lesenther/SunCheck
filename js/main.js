/**
 * Initialize the weather app
 *  - Try to get users location and show current weather data
 *
 * @return {[type]} [description]
 */
function initialize(){
  getUserLocation();
}


/**
 * Attempt to determine users location using h5 geolocation
 *  - If successful, put result in input box automatically, and show current
 *    weather conditions
 *  - Otherwise, automatically set cursor focus to search box
 *     - Consider using IP geolocation service as backup
 *
 * Uses Googles Geocoding API to translate GPS coords into city, state
 * See:  https://developers.google.com/maps/documentation/geocoding/
 *
 * @return {[type]} [description]
 */
function getUserLocation(){
  if (navigator.geolocation) {
    alertUser('<span class="load"></span>Trying to determine your location..', 99999);
    var geocoder = new google.maps.Geocoder();
    navigator.geolocation.getCurrentPosition(function(pos){
      var latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            var city = 'unknown';
            var state = 'unknown';
             var arrAddress = results[0].address_components;
              for (ac = 0; ac < arrAddress.length; ac++) {
                if (arrAddress[ac].types[0] == "locality") { city = arrAddress[ac].long_name }
                if (arrAddress[ac].types[0] == "administrative_area_level_1") { state = arrAddress[ac].short_name }
              }
            document.getElementById('locationQuery').value = city + ', ' + state;
            document.getElementById('mask').style.display = 'none';
            getCurrentWeather(pos.coords.latitude,pos.coords.longitude);
          } else {
            alertUser("No results found");
            return;
          }
        } else {
          alertUser("Geocoder failed due to: " + status);
          return;
        }
      });
    });
  } else {
    alertUser('Geolocation is not supported by this browser.');
    document.getElementById('locationQuery').focus();
  }
}


/**
 * Gets current weather for a location
 * - Use forecast.io api
 *
 * - Needs latitude and longitude!
 *
 * @param  {[type]} lat Latitude
 * @param  {[type]} lng Longitude
 * @return {[type]}     [description]
 */
function getCurrentWeather(lat, lng){
  if(!lat || !lng){
    alertUser('Bad input parameters');
    return;
  }
  alertUser('<span class="load"></span>Getting weather data', 99999);
  $.ajax({
    type: 'GET',
    url: '/api',
    data:{
      request: 'current',
      locationQuery: document.getElementById('locationQuery').value,
      latitude: lat,
      longitude: lng
    },
    dataType: "json"
  }).done(function(msg){
    document.getElementById('mask').style.display = 'none';
    document.getElementById('results').innerHTML =
      '<strong>Weather right now in ' + msg.location_query + ':</strong>' +
      '<ul>' +
        '<li>Conditions:  <strong>' + msg.summary + '</strong></li>' +
        '<li>Apparent Temperature: <strong>' + msg.temp_apparent + '</strong></li>' +
        //'<li>Todays High: <strong>' + msg.temp_max + ' &deg;F</strong></li>' +
        //'<li>Todays Low: <strong>' + msg.temp_min + ' &deg;F</strong></li>' +
      '</ul>';
  });
}


/**
 * Use Google geocoding to get coordinates from users query
 *
 * @param  {[type]} locationQuery [description]
 * @return {[type]}               [description]
 */
function findCoordsForLocation(locationQuery){
  if(!locationQuery){
    alertUser('Bad input parameter:  ' + locationQuery);
    return;
  }
  alertUser('<span class="load"></span>Getting location coordinates', 99999);
  $.ajax({
    type: 'GET',
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    data:{
      address: locationQuery
    },
    dataType: "json"
  }).done(function(msg){
    document.getElementById('mask').style.display = 'none';
    if(msg.status == 'OK'){
      document.getElementById('locationQuery').value = msg.results[0].formatted_address;
      getCurrentWeather(msg.results[0].geometry.location.lat,msg.results[0].geometry.location.lng)
    }else{
      alertUser('Location could not be determined from query:  <em>' + locationQuery + '</em>');
    }
  });

}


/**
 * Informs user whats happening
 *
 * @param  {[type]} msg     [description]
 * @param  {[type]} timeout [description]
 * @return {[type]}         [description]
 */
function alertUser(msg, timeout){
  timeout = (timeout==undefined) ? 2000 : timeout;
  document.getElementById('notice').innerHTML = msg;
  document.getElementById('mask').style.display = 'block';
  setTimeout(function(){
    document.getElementById('mask').style.display = 'none';
  }, timeout);
}