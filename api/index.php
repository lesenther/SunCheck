<?php

ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(-1);

/**
 * SunCheck API for forecast.io
 *
 * For more info, see:
 *  - https://developer.forecast.io/docs/v2
 *
 **/

$apiKey = '5f0b624e922d6c1082480617cc2a3767';  // Reset key if compromised!!!

$request = isset($_GET['request']) ? $_GET['request'] : false;
$latitude = isset($_GET['latitude']) ? $_GET['latitude'] : false;
$longitude = isset($_GET['longitude']) ? $_GET['longitude'] : false;
$locationQuery = isset($_GET['locationQuery']) ? $_GET['locationQuery'] : false;
$dateStart = isset($_GET['dateStart']) ? urldecode($_GET['dateStart']) : false;
$dateEnd = isset($_GET['dateEnd']) ? urldecode($_GET['dateEnd']) : false;

if(!$request || !$latitude || !$longitude){
  die('Invalid parameters:  ('.$request.' - '.$latitude.', '.$longitude.')');
}

switch ($request) {
  case 'current':
    $weather = json_decode(file_get_contents('https://api.forecast.io/forecast/'.$apiKey.'/'.$latitude.','.$longitude.'?units=us&lang=en'));
    $currentWeather = $weather->currently;
    $currentWeather->location_query = $locationQuery;
    echo json_encode($currentWeather);
    break;

  case 'historical':
    $dateRange = new DatePeriod(
      new DateTime($dateStart),
      new DateInterval('P1D'),
      new DateTime($dateEnd)
    );

    $dayCount=0;
    $temps=array();
    $rain=array();
    $daysSunny=0;
    foreach($dateRange as $date){
      if($dayCount>=30){
        $error = '30 day limit';
        break;
      }
      $weather = json_decode(file_get_contents('https://api.forecast.io/forecast/'.$apiKey.'/'.$latitude.','.$longitude.','.$date->getTimestamp().'?units=us&lang=en&exclude=minutely,hourly,currently'));
      $dailyWeather = $weather->daily->data[0];
      $daysSunny = ($dailyWeather->icon=='clear-day') ? $daysSunny + 1 : $daysSunny;
      $averageTemperature = $dailyWeather->temperatureMin + ($dailyWeather->temperatureMax - $dailyWeather->temperatureMin)/2;

      $temps[$dayCount] = round($averageTemperature);
      $x_axis[$dayCount] = $date->format('m/d');
      $rain[$dayCount] = ($dailyWeather->icon=='rain') ? 100 : 0;

      $dayCount++;
    }
    $percentSunny = number_format($daysSunny/$dayCount*100).'%';

    echo json_encode(
      array(
        'location_query' => $locationQuery,
        'total_days' => $dayCount,
        'average_temperature' => $averageTemperature,
        'percent_sunny' => $percentSunny,
        'temp_map' => 'http://chart.googleapis.com/chart'.
          '?cht=lc'. // Line chart
          '&chs=400x100'. // Size
          '&chd=t:'.implode(',', $temps). // data
          '&chxt=y'. // Show y-axis
          '&chxr=0,'.(min($temps)-2).','.(max($temps)+2). // set y range
          '&chds='.(min($temps)-2).','.(max($temps)+2).
          '&chf=bg,s,FFFFFF00'. // transparent back
          '&chco=6688FF'. // line colors
          '&chma=30,0,0,0'. // margins
          '',
        'rain_map' => 'http://chart.googleapis.com/chart'.
          '?cht=bvg:nda'. // bar chart
          '&chs=400x10'. // size
          '&chd=t:'.implode(',', $rain). // data
          '&chf=bg,s,FFFFFF00'. // transparent back
          '&chco=3366CC'. // bar color
          '&chma=30,0,0,0'. // margins
          '&chbh=a'. // bar width
          '',
        'error' => isset($error) ? $error : '',
        'other' => 'bleh'
      )
    );
    break;

  default:
    echo 'Bad request:  '.$request;
    break;
}

?>