var u = {
  query: '',
  lat: '',
  lng: '',
  dstart: '1/1/11',
  dend: '1/11/11'
};


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
    alertUser('<span class="load"></span>' +
      'Getting your current location..', -1);
    var geocoder = new google.maps.Geocoder();
    navigator.geolocation.getCurrentPosition(function(pos){
      u.lat = pos.coords.latitude;
      u.lng = pos.coords.longitude;
      var latlng = new google.maps.LatLng(u.lat, u.lng);
      // User geocoder to get friendly location name
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
            alertUser("<strong>Error:</strong> Location could not be found");
            return;
          }
        } else {
          alertUser("<strong>Error:</strong> Geocoder failed, <em>" + status + '</em>');
          return;
        }
      });
    },function(error){
      switch(error.code) {
        case error.PERMISSION_DENIED:
          alertUser('<strong>Error:</strong> User denied the request for Geolocation.');
          break;
        case error.POSITION_UNAVAILABLE:
          alertUser('<strong>Error:</strong> Location information is unavailable.');
          break;
        case error.TIMEOUT:
          alertUser('<strong>Error:</strong> The request to get user location timed out.');
          break;
        case error.UNKNOWN_ERROR:
          alertUser('<strong>Error:</strong> An unknown error occurred.');
          break;
      }
    });
  } else {
    alertUser('Geolocation is not supported by this browser.');
  }
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
function getCurrentWeather() {
  if (!u.lat || !u.lng) {
    alertUser('Location not set!');
    return;
  }
  alertUser('<span class="load"></span>Getting weather for <em>' +
    u.query + '</em>', -1);
  $.ajax({
    type: 'GET',
    url: '/api',
    data:{
      request: 'current',
      latitude: u.lat,
      longitude: u.lng
    },
    dataType: "json"
  }).done(function(data){
    hideAlert();
    if (typeof data.error != undefined) {
      alertUser('<strong>Error:</strong> ' + data.error);
    }
    document.getElementById('results').style.background =
      'url(\'http://maps.googleapis.com/maps/api/staticmap?center=' +
        u.lat + ', ' + u.lng + '&zoom=11&size=800x200&sensor=false' +
        '&maptype=terrain&style=element:labels|visibility:off\')';
    document.getElementById('results').style.height = '200';

    showResults(
      '<p>Weather right now in <em>' + u.query + '</em>:</p>' +
      '<ul>' +
        '<li><strong>' + data.summary + '</strong></li>' +
        '<li class="temp">' + Math.floor(data.temperature) + ' &deg;F</li>' +
        '<li>' + Math.round(data.humidity * 100) + '% Humidity</li>' +
      '</ul>' +
      '<div style="text-align:center;">' +
        '<a onclick="getUserDates();return false;">' +
          'Get Historical Data' +
        '</a>' +
      '</div>');
  });
}

function getUserDates(){
  alertUser('<label>Start date:</label>' +
    '<input type="text" id="dateStart" value=""> <br />' +
    '<label>Start End:</label>' +
    '<input type="text" id="dateEnd" value=""><br />' +
    '<button onclick="getHistorialWeather();">Get Weather</button>' +
    '', -1);
  $(function() {
    $( "#dateStart" ).datepicker();
    $( "#dateEnd").datepicker();
  });

  //getHistorialWeather();
}

/**
 * Gets weather data for a specified location across a range of dates
 *
 * @return {[type]}     [description]
 */
function getHistorialWeather(){

  var dateStart = new Date(Date.parse(document.getElementById('dateStart').value));
    //prompt('Enter the start date:  \n\n' +
    //'(MM/DD/YYYY or any date string format)', u.dstart)));
  if (dateStart=='' || !isValidDate(dateStart)) {
    alertUser('<strong>Error:</strong> Bad date format, <em>' + dateStart +
      '</em>', 1000);
    return;
  }

  var dateEnd = new Date(Date.parse(document.getElementById('dateEnd').value));
  //var dateEnd = new Date(Date.parse(prompt('Enter the end date:  \n\n' +
    //'Must be within 30 days of ' + properDate(dateStart), u.dend)));
  if (dateEnd=='' || !isValidDate(dateEnd)) {
    alertUser('<strong>Error:</strong> Bad date format, <em>' + dateEnd +
      '</em>', 1000);
    return;
  }

  // Swap dates if the user enters them backwards
  if (dateStart > dateEnd) {
    temp = dateStart;
    dateStart = dateEnd;
    dateEnd = temp;
    delete temp;
  }

  // Check 30 day limit
  if (dateEnd - dateStart > 1000 * 60 * 60 * 24 * 30) {
    alertUser('<strong>Error:</strong> Date range is currently limited to ' +
      '30 days due to third-party API restrictions.  Please try again.', 4000);
    return;
  }

  // Dates should be good, store them in the u object
  u.dstart = properDate(dateStart);
  u.dend = properDate(dateEnd);

  // After validation, make ajax request
  alertUser('<span class="load"></span>Getting historical weather data for ' +
    '<em>' + u.query + '</em>', -1);
  $.ajax({
    type: 'GET',
    url: '/api',
    data:{
      request: 'historical',
      latitude: u.lat,
      longitude: u.lng,
      dateStart: u.dstart,
      dateEnd: u.dend
    },
    dataType: "json"
  }).done(function(data){
    hideAlert();
    if (data.error) {
      alertUser('<strong>Error:</strong> ' + data.error);
    }

    // Set map as background
    document.getElementById('results').style.background =
      'url(\'http://maps.googleapis.com/maps/api/staticmap?center=' +
        u.lat + ', ' + u.lng + '&zoom=11&size=800x800&sensor=false' +
        '&maptype=terrain&style=element:labels|visibility:off\')';
    document.getElementById('results').style.height = 'auto';

    showResults(
      '<p>Weather between <em>' + u.dstart + '</em> and <em>' +
        u.dend + '</em> in <em>' + u.query + '</em>:</p>' +
      '<ul>' +
        '<li>Sunny days:  <strong>' + data.percent_sunny + '</strong>' +
          '<img src="' + data.sun_map + '"></li>' +
        '<li>Rainy days:  <strong>' + data.percent_rainy + '</strong>' +
          '<img src="' + data.rain_map + '">' +
        '</li>' +
        '<li>Temperature:' +
          '<img src="' + data.temp_map + '"><span>(average, &deg;F)</span>' +
        '</li>' +
        '<li></li>' +
      '</ul>' +
      '<div>' +
        '<a onclick="getUserDates();return false;">' +
          'Get Historical Data' +
        '</a>' +
      '</div>');
  });
}


/**
 * Use Google geocoding to get coordinates from users query
 *
 * @param  {[type]} locationQuery [description]
 * @return {[type]}               [description]
 */
function findCoordsForLocation(){
  if (document.getElementById('locationQuery').value=='')
    return;
  u.query = document.getElementById('locationQuery').value;
  alertUser('<span class="load"></span>Getting coordinates for <em>' +
    u.query + '</em>', -1);
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
      // Store the formatted address that google found instead
      u.query = data.results[0].formatted_address;
      document.getElementById('locationQuery').value = u.query;
      u.lat = data.results[0].geometry.location.lat;
      u.lng = data.results[0].geometry.location.lng;
      getCurrentWeather();
    }else{
      alertUser('<strong>Error:</strong> Location not found, <em>' +
        u.query + '</em>');
    }
  });
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
  if (timeout < 0)
    return;
  setTimeout(function(){
    hideAlert();
    document.getElementById('locationQuery').select();
  }, timeout);
}


/**
 * Hides the user alert
 *
 * @return {[type]} [description]
 */
function hideAlert(){
  document.getElementById('mask').style.display = 'none';
}


/**
 * Show ajax results to user
 *
 * @param  {[type]} html [description]
 * @return {[type]}      [description]
 */
function showResults(html){
  document.getElementById('results').innerHTML = html;
  document.getElementById('results').style.display = 'block';
  document.getElementById('locationQuery').select();
}