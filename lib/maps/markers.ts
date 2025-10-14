import type { Location } from './types';

/**
 * A service class for creating and managing markers and polylines on the Google Map.
 */
export class MarkerService {
  /**
   * Creates a marker for the actual location, styled in green.
   * @param map The Google Map instance.
   * @param location The location to place the marker at.
   * @returns A `google.maps.marker.AdvancedMarkerElement` instance.
   */
  createActualLocationMarker(map: google.maps.Map, location: Location): google.maps.marker.AdvancedMarkerElement {
    const markerElement = document.createElement('div');
    markerElement.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#22c55e"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    `;

    return new google.maps.marker.AdvancedMarkerElement({
      position: new google.maps.LatLng(location.lat, location.lng),
      map,
      title: 'Actual Location',
      content: markerElement
    });
  }

  /**
   * Creates a marker for the user's guessed location, styled in red.
   * @param map The Google Map instance.
   * @param location The location to place the marker at.
   * @returns A `google.maps.marker.AdvancedMarkerElement` instance.
   */
  createGuessedLocationMarker(map: google.maps.Map, location: Location): google.maps.marker.AdvancedMarkerElement {
    const markerElement = document.createElement('div');
    markerElement.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    `;

    return new google.maps.marker.AdvancedMarkerElement({
      position: new google.maps.LatLng(location.lat, location.lng),
      map,
      title: 'Your Guess',
      content: markerElement
    });
  }

  /**
   * Creates a polyline to connect two locations on the map.
   * @param map The Google Map instance.
   * @param location1 The first location.
   * @param location2 The second location.
   * @returns A `google.maps.Polyline` instance.
   */
  createConnectionLine(
    map: google.maps.Map, 
    location1: Location, 
    location2: Location
  ): google.maps.Polyline {
    return new google.maps.Polyline({
      path: [
        new google.maps.LatLng(location1.lat, location1.lng),
        new google.maps.LatLng(location2.lat, location2.lng)
      ],
      geodesic: true,
      strokeColor: '#6366f1',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map
    });
  }
}