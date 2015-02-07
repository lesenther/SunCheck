<?php

/**
 * Date check validation
 *
 * Taken from:
 * http://stackoverflow.com/questions/14504913/verify-valid-date-using-phps-datetime-class
 *
 **/
function verifyDate($date, $strict = true){
  $dateTime = DateTime::createFromFormat('m/d/Y', $date);
  if ($strict) {
    $errors = DateTime::getLastErrors();
    if (!empty($errors['warning_count'])) {
      return false;
    }
  }
  return $dateTime !== false;
}