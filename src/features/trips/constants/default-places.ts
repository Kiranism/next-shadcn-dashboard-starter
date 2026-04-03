export type TripPlace = {
  name: string;
  city: string;
  category: string;
  lng: number;
  lat: number;
  image: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
};

export const DEFAULT_TRIP_PLACES: TripPlace[] = [
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
    name: 'Kuriftu Resort & Spa Bahir Dar',
    city: 'Bahir Dar',
    category: 'Lakefront Resort',
    lng: 37.3957,
    lat: 11.6006,
    image: '/images/2.jpg',
    day: 'Tue',
    date: '2026-04-11',
    startTime: '10:00',
    endTime: '16:30'
  },
  {
    name: 'Haile Resort Arbaminch',
    city: 'Arba Minch',
    category: 'Garden Resort',
    lng: 37.5485,
    lat: 6.0376,
    image: '/images/4.jpg',
    day: 'Wed',
    date: '2026-04-12',
    startTime: '08:30',
    endTime: '15:30'
  },
  {
    name: 'Skylight In-Terminal Hotel',
    city: 'Addis Ababa',
    category: 'Airport Hotel',
    lng: 38.7996,
    lat: 8.9891,
    image: '/images/5.jpg',
    day: 'Thu',
    date: '2026-04-13',
    startTime: '12:00',
    endTime: '18:00'
  },
  {
    name: 'Limalimo Lodge',
    city: 'Simien Mountains',
    category: 'Eco Lodge',
    lng: 38.0658,
    lat: 13.1884,
    image: '/images/6.jpg',
    day: 'Fri',
    date: '2026-04-14',
    startTime: '07:00',
    endTime: '14:00'
  },
  {
    name: 'Kuriftu Resort & Spa Adama',
    city: 'Adama',
    category: 'City Resort',
    lng: 39.2707,
    lat: 8.5414,
    image: '/images/7.jpg',
    day: 'Sat',
    date: '2026-04-15',
    startTime: '09:30',
    endTime: '17:00'
  },
  {
    name: 'Jinka Resort',
    city: 'Jinka',
    category: 'Nature Resort',
    lng: 36.5607,
    lat: 5.7901,
    image: '/images/3.jpg',
    day: 'Sun',
    date: '2026-04-16',
    startTime: '08:00',
    endTime: '15:00'
  },
  {
    name: 'Goha Hotel',
    city: 'Gondar',
    category: 'City Hotel',
    lng: 37.4666,
    lat: 12.6096,
    image: '/images/2.jpg',
    day: 'Mon',
    date: '2026-04-17',
    startTime: '10:00',
    endTime: '16:00'
  },
  {
    name: 'Paradise Lodge',
    city: 'Arba Minch',
    category: 'Lake View Lodge',
    lng: 37.5711,
    lat: 6.0358,
    image: '/images/4.jpg',
    day: 'Tue',
    date: '2026-04-18',
    startTime: '08:30',
    endTime: '14:30'
  },
  {
    name: 'Mezena Lodge',
    city: 'Lalibela',
    category: 'Heritage Lodge',
    lng: 39.0468,
    lat: 12.0324,
    image: '/images/5.jpg',
    day: 'Wed',
    date: '2026-04-19',
    startTime: '09:00',
    endTime: '15:30'
  }
];
