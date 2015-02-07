var u = {
  query: '',
  lat: '',
  lng: '',
  dstart: '1/2/13',
  dend: '1-8-2013'
};

/**
 * Initialize the weather app
 *  - Try to get users location and show current weather data
 *
 * @return {[type]} [description]
 */
function initialize(){
  getUserLocation();
  return;
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
  u.query = document.getElementById('locationQuery').value;
  if (navigator.geolocation) {
    alertUser('<span class="load"></span>Determining your location', 99999);
    var geocoder = new google.maps.Geocoder();
    navigator.geolocation.getCurrentPosition(function(pos){
      u.lat = pos.coords.latitude;
      u.lng = pos.coords.longitude;
      var latlng = new google.maps.LatLng(u.lat, u.lng);
      geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            var city = 'unknown', state = 'unknown';
            var arrAddress = results[0].address_components;
            for (ac = 0; ac < arrAddress.length; ac++) {
              city = (arrAddress[ac].types[0] == "locality")
                ? arrAddress[ac].long_name : city;
              state = (arrAddress[ac].types[0] == "administrative_area_level_1")
                ? arrAddress[ac].short_name : state;
            }
            u.query = city + ', ' + state;
            document.getElementById('locationQuery').value = u.query;
            hideAlert();
            getCurrentWeather();
          } else {
            alertUser("Location could not be found");
            document.getElementById('locationQuery').select();
            return;
          }
        } else {
          alertUser("Geocoder failed: <em>" + status + '</em>');
            document.getElementById('locationQuery').select();
          return;
        }
      });
    });
  } else {
    alertUser('Geolocation is not supported by this browser.');
    document.getElementById('locationQuery').select();
  }
  return;
}


/**
 * Gets current weather for a location
 * - Use forecast.io api
 *
 * - Needs latitude and longitude!
 * - Response is in json format
 *
 * @return {[type]}     [description]
 */
function getCurrentWeather(){
  u.query = document.getElementById('locationQuery').value;
  if( !u.lat || !u.lng)
    return;
  alertUser('<span class="load"></span>Getting weather data for <em>' +
    u.query + '</em>', 99999);
  $.ajax({
    type: 'GET',
    url: '/api',
    data:{
      request: 'current',
      locationQuery: u.query,
      latitude: u.lat,
      longitude: u.lng
    },
    dataType: "json"
  }).done(function(data){
    hideAlert();
    document.getElementById('results').innerHTML =
      '<p>Weather right now in <em>' + u.query + '</em>:</p>' +
      '<ul>' +
        '<li><strong>' + data.summary + '</strong></li>' +
        '<li class="temp">' + Math.floor(data.temperature) + ' &deg;F</li>' +
        '<li>' + (data.humidity*100) + '% Humidity</li>' +
      '</ul>' +
      '<div style="text-align:center;">' +
        '<a onclick="getHistorialWeather();">' +
          'Get Historical Data' +
        '</a>' +
      '</div>';
    document.getElementById('locationQuery').select();
  });
  return;
}


/**
 * Gets weather data for a specified location across a range of dates
 *
 * @return {[type]}     [description]
 */
function getHistorialWeather(){
  var dateStart = new Date(Date.parse(prompt('Enter the start date:  \n\n' +
    '(MM-DD-YY or any format you wish)', u.dstart)));
  if (dateStart=='' || !isValidDate(dateStart)){
    alertUser('<strong>Error:</strong> Bad start date format');
    return;
  }
  var dateEnd = new Date(Date.parse(prompt('Enter the end date:  \n\n' +
    '(MM-DD-YY or any format you wish)', u.dend)));
  if (dateEnd=='' || !isValidDate(dateEnd)){
    alertUser('<strong>Error:</strong> Bad end date format');
    return;
  }
  if(dateStart > dateEnd){ // Swap dates if the user enters them backwards
    var temp = dateStart;
    dateStart = dateEnd;
    dateEnd = temp;
  }
  u.dstart = properDate(dateStart);
  u.dend = properDate(dateEnd);
  // After basic validation, make ajax request
  alertUser('<span class="load"></span>Getting weather data for <em>' +
    document.getElementById('locationQuery').value + '</em>', 99999);
  $.ajax({
    type: 'GET',
    url: '/api',
    data:{
      request: 'historical',
      locationQuery: u.query,
      dateStart: u.dstart,
      dateEnd: u.dend,
      latitude: u.lat,
      longitude: u.lng
    },
    dataType: "json"
  }).done(function(data){
    hideAlert();
    document.getElementById('results').innerHTML =
      '<p>Weather between <em>' + u.dstart + '</em> and <em>' +
        u.dend + '</em> in <em>' + u.query + '</em>:</p>' +
      '<ul>' +
        '<li><strong>' + data.percent_sunny + '</strong> of the days during ' +
        'this period were sunny</li>' +
        '<li>Temperature Map:  <br>' +
          '<div id="temperatureMap"><img src="' + data.temp_map + '"></div>' +
        '</li>' +
        '<li>Rainfall Map:  <br>' +
          '<div id="rainFallMap"><img src="' + data.rain_map + '"></div>' +
        '</li>' +
        '<li>...</li>' +
      '</ul>' +
      '<div style="text-align:center;">' +
        '<a onclick="getHistorialWeather();">' +
          'Get Historical Data' +
        '</a>' +
      '</div>';
      document.getElementById('locationQuery').select();
  });
  return;
}


/**
 * Use Google geocoding to get coordinates from users query
 *
 * @param  {[type]} locationQuery [description]
 * @return {[type]}               [description]
 */
function findCoordsForLocation(){
  u.query = document.getElementById('locationQuery').value;
  if (!u.query){
    alertUser('<strong>Error:</strong> Bad input parameter <em>' +
      u.query + '</em>');
    return;
  }
  alertUser('<span class="load"></span>Getting coordinates for <em>' +
    u.query + '</em>', 99999);
  $.ajax({
    type: 'GET',
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    data:{
      address: u.query
    },
    dataType: "json"
  }).done(function(data){
    hideAlert();
    if (data.status == 'OK'){
      u.query = data.results[0].formatted_address;
      document.getElementById('locationQuery').value = u.query;
      getCurrentWeather()
    }else{
      alertUser('<strong>Error:</strong> Location not found <em>' +
        u.query + '</em>');
    }
  });
  return;
}


/**
 * Checks for valid date object
 *
 * Credit:
 * http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
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
 * Takes a date object and returns a string in MM/DD/YYYY format
 *
 * @param  {[type]} d [description]
 * @return {[type]}   [description]
 */
function properDate(d) {
  return d.getMonth()+1 + "/" + d.getDate() + "/" + d.getFullYear();
}


/**
 * Temporarily display a message to the user over the application
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
    hideAlert();
  }, timeout);
  return;
}


/**
 * Hides the user alert
 *
 * @return {[type]} [description]
 */
function hideAlert(){
  document.getElementById('mask').style.display = 'none';
  return;
}