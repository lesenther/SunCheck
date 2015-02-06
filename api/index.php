<?php

/**
 * SunCheck API for forecast.io
 *
 * For more info, see:
 *  - https://developer.forecast.io/docs/v2
 *  - https://github.com/tobias-redmann/forecast.io-php-api
 *
 **/

include('lib/forecast.io.php');

$api_key = '5f0b624e922d6c1082480617cc2a3767';  // Reset key if compromised!!!

$latitude = isset($_GET['latitude']) ? $_GET['latitude'] : false;
$longitude = isset($_GET['longitude']) ? $_GET['longitude'] : false;
$locationQuery = isset($_GET['locationQuery']) ? $_GET['locationQuery'] : false;
$request = isset($_GET['request']) ? $_GET['request'] : false;
$dateStart = isset($_GET['dateStart']) ? $_GET['dateStart'] : false;
$dateEnd = isset($_GET['dateEnd']) ? $_GET['dateEnd'] : false;
$units = 'us';  // Can be set to 'us', 'si', 'ca', 'uk' or 'auto' (see forecast.io API); default is auto
$lang = ''; // Can be set to 'en', 'de', 'pl', 'es', 'fr', 'it', 'tet' or 'x-pig-latin' (see forecast.io API); default is 'en'

if(!$request || !$latitude || !$longitude){
  die('Invalid parameters:  ('.$request.' - '.$latitude.', '.$longitude.')');
}

$forecast = new ForecastIO($api_key);


switch ($request) {
  case 'current':
    $condition = $forecast->getCurrentConditions($latitude, $longitude, $units, $lang);
    echo json_encode(
      array(
        'temp_current' => $condition->getTemperature(),
        'location_query' => $locationQuery,
        'temp_apparent' => $condition->getApparentTemperature(),
        'cloud_cover' => $condition->getCloudCover(),
        'dew_point' => $condition->getDewPoint(),
        'humidity' => $condition->getHumidity(),
        'icon' => $condition->getIcon(),
        'temp_max' => $condition->getMaxTemperature(),
        'temp_min' => $condition->getMinTemperature(),
        'precip_prob' => $condition->getPrecipitationProbability(),
        'precip_type' => $condition->getPrecipitationType(),
        'pressure' => $condition->getPressure(),
        'summary' => $condition->getSummary()
      )
    );//*/
    break;

  case 'historical':
    echo 'not yet implemented';
    break;

  //case 'locationCoordinates':
    //https://maps.googleapis.com/maps/api/geocode/json?address=Toledo&key=API_KEY


  default:
    echo 'Bad request:  '.$request;
    break;
}

?>