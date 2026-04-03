import type { Place } from './components/trip-map';

export interface TripListItem {
  id: string;
  name: string;
  summary: string;
  city: string;
  theme: string;
  period: string;
  places: Place[];
}

export const trips: TripListItem[] = [
  {
    id: 'bishoftu-lake-loop',
    name: 'Bishoftu Lake Loop',
    summary: 'A calm lakeside trip with short scenic drives and resort stops.',
    city: 'Bishoftu',
    theme: 'Relaxed',
    period: 'Mon - Wed',
    places: [
      {
        name: 'Kuriftu Resort & Spa Bishoftu',
        city: 'Bishoftu',
        category: 'Lakeside Resort',
        lng: 38.9798,
        lat: 8.7527,
        image: '/images/1.jpg',
        day: 'Mon',
        date: '2026-04-10',
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        name: 'Kuriftu Resort & Spa Adama',
        city: 'Adama',
        category: 'City Resort',
        lng: 39.2707,
        lat: 8.5414,
        image: '/images/7.jpg',
        day: 'Tue',
        date: '2026-04-11',
        startTime: '10:00',
        endTime: '16:00'
      },
      {
        name: 'Skylight In-Terminal Hotel',
        city: 'Addis Ababa',
        category: 'Airport Hotel',
        lng: 38.7996,
        lat: 8.9891,
        image: '/images/5.jpg',
        day: 'Wed',
        date: '2026-04-12',
        startTime: '12:00',
        endTime: '18:00'
      }
    ]
  },
  {
    id: 'highland-adventure-trail',
    name: 'Highland Adventure Trail',
    summary: 'A more active route with mountain views and heritage lodge stops.',
    city: 'Lalibela',
    theme: 'Adventure',
    period: 'Thu - Sat',
    places: [
      {
        name: 'Limalimo Lodge',
        city: 'Simien Mountains',
        category: 'Eco Lodge',
        lng: 38.0658,
        lat: 13.1884,
        image: '/images/6.jpg',
        day: 'Thu',
        date: '2026-04-13',
        startTime: '07:00',
        endTime: '14:00'
      },
      {
        name: 'Goha Hotel',
        city: 'Gondar',
        category: 'City Hotel',
        lng: 37.4666,
        lat: 12.6096,
        image: '/images/2.jpg',
        day: 'Fri',
        date: '2026-04-14',
        startTime: '10:00',
        endTime: '16:00'
      },
      {
        name: 'Mezena Lodge',
        city: 'Lalibela',
        category: 'Heritage Lodge',
        lng: 39.0468,
        lat: 12.0324,
        image: '/images/5.jpg',
        day: 'Sat',
        date: '2026-04-15',
        startTime: '09:00',
        endTime: '15:30'
      }
    ]
  }
];

export function getTripById(id: string) {
  return trips.find((trip) => trip.id === id);
}