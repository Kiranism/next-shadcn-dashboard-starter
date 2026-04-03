////////////////////////////////////////////////////////////////////////////////
// 🛑 Nothing in here has anything to do with Nextjs, it's just a fake database
////////////////////////////////////////////////////////////////////////////////

import { faker } from '@faker-js/faker';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type Trip = {
  id: number;
  title: string;
  destination: string;
  travel_window: string;
  travelers: string;
  style: string;
  budget: string;
  focus: string;
  highlights: string[];
  summary: string;
  status: 'Planning' | 'Booked' | 'Active' | 'Completed';
  created_at: string;
  updated_at: string;
};

export const fakeTrips = {
  records: [] as Trip[],

  initialize() {
    const destinations = ['Bali', 'Kyoto', 'Cape Town', 'Reykjavik', 'Lisbon', 'Zanzibar'];
    const travelWindows = ['This weekend', 'Next week', 'Next month', 'Flexible timing'];
    const travelers = ['Solo explorer', 'Couple getaway', 'Family escape', 'Group adventure'];
    const styles = ['Relaxed', 'Balanced', 'Exploratory', 'Celebration-focused'];
    const budgets = ['Lean', 'Comfortable', 'Premium', 'No cap'];
    const focuses = ['Nature', 'Food', 'Culture', 'Adventure', 'Wellness', 'Nightlife'];
    const statuses: Trip['status'][] = ['Planning', 'Booked', 'Active', 'Completed'];

    this.records = Array.from({ length: 12 }, (_, index) => {
      const destination = faker.helpers.arrayElement(destinations);
      const style = faker.helpers.arrayElement(styles);
      const travelWindow = faker.helpers.arrayElement(travelWindows);
      const travelerGroup = faker.helpers.arrayElement(travelers);
      const budget = faker.helpers.arrayElement(budgets);
      const focus = faker.helpers.arrayElement(focuses);

      return {
        id: index + 1,
        title: `${destination} ${style} Trip`,
        destination,
        travel_window: travelWindow,
        travelers: travelerGroup,
        style,
        budget,
        focus,
        highlights: [destination, travelWindow, travelerGroup, style, budget, focus],
        summary: `A ${style.toLowerCase()} trip to ${destination.toLowerCase()} for ${travelerGroup.toLowerCase()} with a ${focus.toLowerCase()} focus.`,
        status: faker.helpers.arrayElement(statuses),
        created_at: faker.date.between({ from: '2024-01-01', to: '2025-12-31' }).toISOString(),
        updated_at: faker.date.recent().toISOString()
      };
    });
  },

  async getTrips() {
    await delay(700);

    return {
      success: true,
      time: new Date().toISOString(),
      message: 'Trips loaded successfully',
      total_trips: this.records.length,
      trips: [...this.records]
    };
  },

  async createTrip(data: Omit<Trip, 'id' | 'status' | 'created_at' | 'updated_at'>) {
    await delay(700);

    const newTrip: Trip = {
      ...data,
      id: this.records.length + 1,
      status: 'Planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.records.push(newTrip);

    return {
      success: true,
      message: 'Trip list created successfully',
      trip: newTrip
    };
  }
};

fakeTrips.initialize();