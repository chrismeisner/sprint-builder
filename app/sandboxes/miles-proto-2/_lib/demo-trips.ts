export interface DemoTrip {
  id: string;
  from: string;
  to: string;
  date: string;
  timeRange: string;
  distance: string;
  duration: string;
  score: number;
  events: number;
  driver: string;
  driverInitials: string;
  vehicle?: string;
}

export const TRIP_DRIVERS = ["All", "Chris", "Emma"] as const;

/** Shared route for live-trip map (trips list, Miles agent kid-trip card, etc.). */
export const LIVE_TRIP_ROUTE: [number, number][] = [
  [33.0152, -96.7108],
  [33.0168, -96.7088],
  [33.0183, -96.7065],
  [33.0185, -96.7038],
  [33.0185, -96.701],
  [33.0198, -96.696],
  [33.0218, -96.6945],
  [33.024, -96.6932],
];
export const LIVE_TRIP_CAR = LIVE_TRIP_ROUTE[5];

export const DEMO_TRIPS: DemoTrip[] = [
  {
    id: "t1",
    from: "6128 Preston Rd",
    to: "W Park Blvd & Coit Rd",
    date: "Today",
    timeRange: "3:42 – 3:54 PM",
    distance: "4.2 mi",
    duration: "12 min",
    score: 88,
    events: 1,
    driver: "Chris",
    driverInitials: "CM",
    vehicle: "Civic",
  },
  {
    id: "t2",
    from: "3501 McDermott Rd",
    to: "Home",
    date: "Today",
    timeRange: "4:30 – 4:41 PM",
    distance: "4.1 mi",
    duration: "11 min",
    score: 92,
    events: 0,
    driver: "Chris",
    driverInitials: "CM",
    vehicle: "Civic",
  },
  {
    id: "t3",
    from: "1210 Legacy Dr",
    to: "N Central Expy & E Park Blvd",
    date: "Yesterday",
    timeRange: "8:05 – 8:32 AM",
    distance: "11.3 mi",
    duration: "27 min",
    score: 79,
    events: 2,
    driver: "Emma",
    driverInitials: "ER",
    vehicle: "RAV4",
  },
  {
    id: "t4",
    from: "Ohio Dr & W 15th St",
    to: "2041 Alma Dr",
    date: "Yesterday",
    timeRange: "5:45 – 6:02 PM",
    distance: "3.8 mi",
    duration: "17 min",
    score: 85,
    events: 0,
    driver: "Emma",
    driverInitials: "ER",
    vehicle: "RAV4",
  },
  {
    id: "t5",
    from: "908 W Spring Creek Pkwy",
    to: "7320 Independence Pkwy",
    date: "Yesterday",
    timeRange: "6:15 – 6:38 PM",
    distance: "8.9 mi",
    duration: "23 min",
    score: 81,
    events: 1,
    driver: "Emma",
    driverInitials: "ER",
    vehicle: "RAV4",
  },
  {
    id: "t6",
    from: "Home",
    to: "2400 Custer Pkwy",
    date: "Mon, Mar 3",
    timeRange: "7:30 – 7:48 AM",
    distance: "5.6 mi",
    duration: "18 min",
    score: 90,
    events: 0,
    driver: "Chris",
    driverInitials: "CM",
    vehicle: "Civic",
  },
  {
    id: "t7",
    from: "Ridgeview Dr & Alma Rd",
    to: "8401 Angels Dr",
    date: "Mon, Mar 3",
    timeRange: "3:15 – 3:35 PM",
    distance: "5.7 mi",
    duration: "20 min",
    score: 87,
    events: 1,
    driver: "Chris",
    driverInitials: "CM",
    vehicle: "Civic",
  },
];
