export type ConciergeEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  price_etb: number;
  reward: number;
};

export const EVENT_CATALOG = {
  Kuriftu_Entoto_Adventure_Park: [
    {
      id: 'ent_001',
      title: 'Canopy Zipline Experience',
      description: 'High-altitude ziplining across the dense eucalyptus forest.',
      category: 'activity',
      price_etb: 1200,
      reward: 150
    },
    {
      id: 'ent_008',
      title: 'Jungle Paintball Battle',
      description: 'Team-based tactical combat in a natural forest arena.',
      category: 'activity',
      price_etb: 850,
      reward: 110
    },
    {
      id: 'ent_009',
      title: 'Rock Climbing Wall',
      description: "Guided climbing session on the park's custom-built outdoor wall.",
      category: 'activity',
      price_etb: 700,
      reward: 100
    },
    {
      id: 'ent_010',
      title: 'Hammock Forest Nap',
      description: "Rent a premium hammock in a secluded 'quiet zone' of the forest.",
      category: 'relaxation',
      price_etb: 350,
      reward: 30
    },
    {
      id: 'ent_011',
      title: 'Summit Photography Tour',
      description: 'Guided hike to the best panoramic viewpoints for sunrise or sunset.',
      category: 'activity',
      price_etb: 500,
      reward: 60
    },
    {
      id: 'ent_012',
      title: 'Night Forest Glamping',
      description: 'Luxury overnight stay in a semi-permanent forest tent.',
      category: 'accommodation',
      price_etb: 8500,
      reward: 500
    },
    {
      id: 'ent_013',
      title: 'Horseback Forest Trail',
      description: 'A scenic guided horseback ride through the misty Entoto mountains.',
      category: 'activity',
      price_etb: 900,
      reward: 110
    },
    {
      id: 'ent_014',
      title: 'Archery Target Practice',
      description: 'Learn focus and precision with traditional and modern bows.',
      category: 'activity',
      price_etb: 450,
      reward: 50
    },
    {
      id: 'ent_015',
      title: 'Eucalyptus Spa Retreat',
      description: 'Deep tissue massage utilizing essential oils from the surrounding forest.',
      category: 'relaxation',
      price_etb: 2500,
      reward: 150
    },
    {
      id: 'ent_016',
      title: 'Guided Mountain Biking',
      description: 'Thrilling downhill and cross-country cycling on rugged terrain.',
      category: 'activity',
      price_etb: 800,
      reward: 100
    }
  ],
  Kuriftu_Bishoftu: [
    {
      id: 'bish_002',
      title: 'Water Park All-Access Pass',
      description: 'Full day entry to the slides, wave pool, and kid zones.',
      category: 'activity',
      price_etb: 1800,
      reward: 200
    },
    {
      id: 'bish_007',
      title: 'VIP Water Park Cabana',
      description: 'Private shaded lounge with personalized waiter service.',
      category: 'relaxation',
      price_etb: 4500,
      reward: 150
    },
    {
      id: 'bish_008',
      title: 'Lake Koriftu Jet Skiing',
      description: '15-minute high-speed lake circuit with an instructor.',
      category: 'activity',
      price_etb: 3200,
      reward: 180
    },
    {
      id: 'bish_009',
      title: 'Floating Sushi Platter',
      description: 'Luxury sushi boat served in the main resort pool.',
      category: 'food',
      price_etb: 2800,
      reward: 90
    },
    {
      id: 'bish_010',
      title: 'Moonlight Kayaking',
      description: 'Guided night-time paddle with LED-lit kayaks.',
      category: 'activity',
      price_etb: 1500,
      reward: 120
    },
    {
      id: 'bish_011',
      title: 'Lakeside Movie Night',
      description: 'Private screen setup by the lake with popcorn and drinks.',
      category: 'relaxation',
      price_etb: 2200,
      reward: 70
    },
    {
      id: 'bish_012',
      title: 'Quad Bike Safari',
      description: 'Off-road four-wheeler adventure around the crater lake parameters.',
      category: 'activity',
      price_etb: 1500,
      reward: 140
    },
    {
      id: 'bish_013',
      title: 'Traditional Swedish Massage',
      description: 'Full body relaxation massage at the acclaimed Kuriftu Spa.',
      category: 'relaxation',
      price_etb: 2000,
      reward: 130
    },
    {
      id: 'bish_014',
      title: 'Pedal Boat Rental',
      description: 'Leisurely family-friendly pedal boating on Lake Kuriftu.',
      category: 'activity',
      price_etb: 600,
      reward: 60
    },
    {
      id: 'bish_015',
      title: 'Sunset Dinner Cruise',
      description: 'Romantic floating dinner experience on a private pontoon.',
      category: 'food',
      price_etb: 3500,
      reward: 200
    }
  ],
  Kuriftu_Bahir_Dar: [
    {
      id: 'bah_001',
      title: 'Monastery Island Expedition',
      description: 'Half-day private boat tour to Ura Kidane Mehret and Azwa Mariam.',
      category: 'activity',
      price_etb: 4500,
      reward: 300
    },
    {
      id: 'bah_006',
      title: 'Blue Nile Birdwatching',
      description: 'Morning boat trip focused on endemic bird species and hippos.',
      category: 'activity',
      price_etb: 2200,
      reward: 140
    },
    {
      id: 'bah_007',
      title: 'Source of the Blue Nile Hike',
      description: "Guided trekking from the resort to the river's departure point.",
      category: 'activity',
      price_etb: 1200,
      reward: 110
    },
    {
      id: 'bah_008',
      title: 'Lakeside Manicure & Pedicure',
      description: 'Full nail service performed on the outdoor deck overlooking the lake.',
      category: 'relaxation',
      price_etb: 1400,
      reward: 80
    },
    {
      id: 'bah_009',
      title: 'Traditional Fish Grilling Class',
      description: 'Learn to prepare Lake Tana Tilapia with local spices.',
      category: 'food',
      price_etb: 1800,
      reward: 120
    },
    {
      id: 'bah_010',
      title: 'Papyrus Boat (Tankwa) Ride',
      description: 'Experience navigating the lake on a traditional reed boat.',
      category: 'activity',
      price_etb: 800,
      reward: 90
    },
    {
      id: 'bah_011',
      title: 'Lakeside Coffee Ceremony',
      description: 'Authentic Ethiopian coffee roasting and tasting with a lake view.',
      category: 'food',
      price_etb: 400,
      reward: 50
    },
    {
      id: 'bah_012',
      title: 'Local Market Cultural Tour',
      description: "Guided tour of Bahir Dar's vibrant spice and textile markets.",
      category: 'activity',
      price_etb: 700,
      reward: 80
    },
    {
      id: 'bah_013',
      title: 'Evening Traditional Music Live',
      description: 'Enjoy Azmari cultural music and dancing around a fire pit.',
      category: 'relaxation',
      price_etb: 500,
      reward: 60
    }
  ],
  Kuriftu_Awash_Falls: [
    {
      id: 'awa_001',
      title: 'National Park Game Drive',
      description: '4x4 safari through the park to see Oryx, Gazelles, and Kudu.',
      category: 'activity',
      price_etb: 5500,
      reward: 350
    },
    {
      id: 'awa_006',
      title: 'Crocodile River Walk',
      description: 'Guided safe-distance walk along the banks of the Awash River.',
      category: 'activity',
      price_etb: 900,
      reward: 100
    },
    {
      id: 'awa_007',
      title: 'Volcanic Hot Springs Trip',
      description: 'Transport and guided entry to the Filwoha thermal pools.',
      category: 'activity',
      price_etb: 2800,
      reward: 180
    },
    {
      id: 'awa_008',
      title: 'Canyon Edge Sundowners',
      description: "Premium drinks and appetizers served at the cliff's edge.",
      category: 'food',
      price_etb: 1800,
      reward: 70
    },
    {
      id: 'awa_009',
      title: 'Bush Breakfast',
      description: 'Sunrise breakfast served in the wild within the National Park.',
      category: 'food',
      price_etb: 3200,
      reward: 150
    },
    {
      id: 'awa_010',
      title: 'Kereyu Pastoralist Village Visit',
      description: 'Cultural exchange visiting the indigenous camel-herding community.',
      category: 'activity',
      price_etb: 1200,
      reward: 150
    },
    {
      id: 'awa_011',
      title: 'Awash Gorge Hiking',
      description: 'Challenging guided hike down into the dramatic river gorge.',
      category: 'activity',
      price_etb: 1000,
      reward: 130
    },
    {
      id: 'awa_012',
      title: 'Star Gazing with Telescope',
      description: 'Nighttime astronomy session in the zero-light-pollution savanna.',
      category: 'relaxation',
      price_etb: 600,
      reward: 70
    },
    {
      id: 'awa_013',
      title: 'Traditional Goat BBQ',
      description: 'A whole roasted goat feast prepared in the traditional pastoralist way.',
      category: 'food',
      price_etb: 2500,
      reward: 180
    }
  ],
  Kuriftu_African_Village: [
    {
      id: 'vil_001',
      title: 'Traditional Pottery Class',
      description: 'Learn ancient clay molding techniques with local master potters.',
      category: 'activity',
      price_etb: 800,
      reward: 120
    },
    {
      id: 'vil_002',
      title: 'Eskista Dance Workshop',
      description: 'Evening session learning the traditional shoulder dance of Ethiopia.',
      category: 'activity',
      price_etb: 600,
      reward: 90
    },
    {
      id: 'vil_003',
      title: 'Royal Enkutatash Dinner',
      description: 'A multi-course feast served in the traditional village hut style.',
      category: 'food',
      price_etb: 2400,
      reward: 100
    },
    {
      id: 'vil_004',
      title: 'Honey Wine (Tej) Tasting',
      description: 'Sample various grades of local Tej with appetizers.',
      category: 'food',
      price_etb: 1100,
      reward: 50
    },
    {
      id: 'vil_005',
      title: "Artisan Textile Weaving",
      description: "Watch and try your hand at weaving traditional Ethiopian 'Gabi' cloth.",
      category: 'activity',
      price_etb: 500,
      reward: 85
    },
    {
      id: 'vil_006',
      title: 'Traditional Hair Braiding',
      description: 'Get your hair styled in authentic Ethiopian cultural braids.',
      category: 'activity',
      price_etb: 700,
      reward: 80
    },
    {
      id: 'vil_007',
      title: 'Spear Throwing Practice',
      description: 'Learn historical hunting techniques in a safe, controlled environment.',
      category: 'activity',
      price_etb: 400,
      reward: 50
    },
    {
      id: 'vil_008',
      title: 'Coffee Roasting Masterclass',
      description: 'Deep dive into the history, sorting, roasting, and brewing of Ethiopian coffee.',
      category: 'activity',
      price_etb: 600,
      reward: 70
    },
    {
      id: 'vil_009',
      title: 'Butecha and Injera Making',
      description: 'Hands-on culinary class focusing on staple vegan dishes and flatbread.',
      category: 'food',
      price_etb: 850,
      reward: 90
    }
  ],
  Kuriftu_Gidabo: [
    {
      id: 'gid_001',
      title: 'Agro-Tourism Farm Tour',
      description: 'Explore the sustainable farming and livestock sections of Gidabo.',
      category: 'activity',
      price_etb: 600,
      reward: 80
    },
    {
      id: 'gid_002',
      title: 'Gidabo Canal Fishing',
      description: 'Catch-and-release fishing session with provided gear.',
      category: 'activity',
      price_etb: 1200,
      reward: 130
    },
    {
      id: 'gid_003',
      title: 'Organic Farm-to-Table Lunch',
      description: 'Lunch prepared using ingredients harvested 100% on-site.',
      category: 'food',
      price_etb: 1600,
      reward: 90
    },
    {
      id: 'gid_004',
      title: 'Fruit Harvesting Experience',
      description: 'Guided seasonal fruit picking (Mangoes, Papayas, Avocado).',
      category: 'activity',
      price_etb: 450,
      reward: 60
    },
    {
      id: 'gid_005',
      title: 'Honey Harvesting & Beekeeping Tour',
      description: 'Suit up and learn about organic apiculture and harvest fresh honey.',
      category: 'activity',
      price_etb: 750,
      reward: 100
    },
    {
      id: 'gid_006',
      title: 'Horseback Riding in the Plains',
      description: 'Ride through the scenic agricultural landscapes of the Gidabo region.',
      category: 'activity',
      price_etb: 1100,
      reward: 120
    },
    {
      id: 'gid_007',
      title: 'Campfire Storytelling Night',
      description: 'Evening gathering around the fire with local folklore and hot drinks.',
      category: 'relaxation',
      price_etb: 300,
      reward: 40
    },
    {
      id: 'gid_008',
      title: 'Treehouse Private Dining',
      description: 'Exclusive dining experience elevated in the canopy overlooking the farm.',
      category: 'food',
      price_etb: 2200,
      reward: 160
    }
  ]
} as const satisfies Record<string, ConciergeEvent[]>;

export const BASECAMP_TO_EVENT_POOL = {
  'Kuriftu Bishoftu': 'Kuriftu_Bishoftu',
  'Kuriftu Awash': 'Kuriftu_Awash_Falls',
  'Kuriftu Lake Tana': 'Kuriftu_Bahir_Dar',
  'Kuriftu Entoto': 'Kuriftu_Entoto_Adventure_Park'
} as const;

export type EventPoolKey = keyof typeof EVENT_CATALOG;
