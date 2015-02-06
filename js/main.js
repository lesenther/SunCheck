
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
      //alert("determined your position to be " + pos.coords.latitude + ", " + pos.coords.longitude);
      // Have lat + long, need to make user friendly, like city, state
      var latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
             var arrAddress = results[0].address_components;
              for (ac = 0; ac < arrAddress.length; ac++) {
                if (arrAddress[ac].types[0] == "locality") { city = arrAddress[ac].long_name }
                if (arrAddress[ac].types[0] == "administrative_area_level_1") { state = arrAddress[ac].short_name }
              }
            document.getElementById('locationQuery').value = city + ', ' + state;
            document.getElementById('mask').style.display = 'none';
            getCurrentWeather();
          } else {
            alertUser("No results found", 2000);
            return;
          }
        } else {
          alertUser("Geocoder failed due to: " + status, 2000);
          return;
        }
      });
    });
  } else {
    alertUser('Geolocation is not supported by this browser.', 2000);
    document.getElementById('locationQuery').focus();
  }
}


/**
 * Gets current weather for a location
 * - Use forecast.io api
 *
 * @param  {[type]} lat Latitude
 * @param  {[type]} lng Longitude
 * @return {[type]}     [description]
 */
function getCurrentWeather(lat, lng){
  // Perform ajax request and paste info after
  //alertUser('i should get the weather now');
}


function alertUser(msg, timeout){
  timeout = (timeout==undefined) ? 2000 : timeout;
  document.getElementById('notice').innerHTML = msg;
  document.getElementById('mask').style.display = 'block';
  setTimeout(function(){
    document.getElementById('mask').style.display = 'none';
  }, timeout);
}