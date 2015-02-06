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
  if (!lat || !lng){
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
        '<li>Temperature: <strong>' + msg.temp_current + ' &deg; F</strong></li>' +
      '</ul>' +
      '<button onclick="getHistorialWeather();">Get Historical Data</button>';
  });
}


/**
 * Gets weather data for a specified location across a range of dates
 *
 * @param  {[type]} lat [description]
 * @param  {[type]} lng [description]
 * @return {[type]}     [description]
 */
function getHistorialWeather(lat, lng){
  var dateStart = '', dateEnd = '';
  while(!isValidDate(dateStart)){
    dateStart = Date.parse(prompt('Start date:  ', 'MM/DD/YYYY'));
  }
  if (dateStart=='')
    return;
  while(!isValidDate(dateEnd)){
    dateEnd = Date.parse(prompt('End date:  ', 'MM/DD/YYYY'));
  }
  if (dateEnd=='')
    return;
  document.getElementById('results').innerHTML =
    '<strong>Stats from ' + dateStart + ' to ' + dateEnd + ' in ' + document.getElementById('locationQuery').value + ':</strong>' +
    '<ul>' +
      '<li>Sunny Days in range: <strong>82%</strong></li>' +
      '<li>Temperature Map:  <div id="temperatureMap"></div></li>' +
      '<li>Rainfall Map:  <div id="rainFallMap"></div></li>' +
      '<li>...</li>' +
    '</ul>';
}

/**
 * Use Google geocoding to get coordinates from users query
 *
 * @param  {[type]} locationQuery [description]
 * @return {[type]}               [description]
 */
function findCoordsForLocation(locationQuery){
  if (!locationQuery){
    alertUser('<strong>Error:</strong> Bad input parameter:  ' + locationQuery);
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
    if (msg.status == 'OK'){
      document.getElementById('locationQuery').value = msg.results[0].formatted_address;
      getCurrentWeather(msg.results[0].geometry.location.lat,msg.results[0].geometry.location.lng)
    }else{
      alertUser('<strong>Error:</strong> Location not found:  <em>' + locationQuery + '</em>');
    }
  });
}


/**
 * Checks for valid date object
 *
 * Jacked from:  http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
 *
 * @param  {[type]}  d [description]
 * @return {Boolean}   [description]
 */
function isValidDate(d) {
  if ( Object.prototype.toString.call(d) !== "[object Date]" )
    return false;
  return !isNaN(d.getTime());
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