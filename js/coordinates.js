// https://enjeck.com/blog/distance-two-locations/

// Convert from degrees to radians
function degreesToRadians(degrees) {
  var radians = (degrees * Math.PI) / 180;
  return radians;
}

// Function takes two objects, that contain coordinates to a starting and destination location.
function calcDistance(startCoords, destCoords) {
  let startingLat = degreesToRadians(startCoords.latitude);
  let startingLong = degreesToRadians(startCoords.longitude);
  let destinationLat = degreesToRadians(destCoords.latitude);
  let destinationLong = degreesToRadians(destCoords.longitude);

  // Radius of the earth in kilometers
  let radius = 6571;

  // Haversine equation
  let distanceInKilometers =
    Math.acos(
      Math.sin(startingLat) * Math.sin(destinationLat) +
        Math.cos(startingLat) *
          Math.cos(destinationLat) *
          Math.cos(startingLong - destinationLong)
    ) * radius;

  return distanceInKilometers;
}

// Usage
/*
  let sCoords = {
    latitude: 58.39343;
    longitude: -259.2627;
    }
    
    let dCoords = {
    latitude: 43.8394;
    longitude: -129.3984;
    }
    let dist = calcDistance(sCoords, dCoords);
*/
