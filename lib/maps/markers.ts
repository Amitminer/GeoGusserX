import type { Location } from './types';

export class MarkerService {
  /**
   * Create an actual location marker (green)
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
   * Create a guessed location marker (red)
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
   * Create a connection line between two locations
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