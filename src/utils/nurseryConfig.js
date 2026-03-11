// Nursery-specific configurations
export const NURSERIES = {
  'brighton': {
    id: 'brighton',
    name: 'Brighton & Hove',
    sites: ['Preston Park', 'Seven Dials', 'West Hove'],
    phone: '01273 385577',
    email: 'office@hopscotchmail.com',
    sessions: {
      fullDay: { name: 'Full day', time: '8am - 5:30pm', hours: 9.5, fee: 72.00 },
      morning: { name: 'Morning', time: '8am - 12:30pm', hours: 4.5, fee: 38.00, existingOnly: true },
      afternoon: { name: 'Afternoon', time: '1:30pm - 5:30pm', hours: 4, fee: 35.00, existingOnly: true },
    },
    extras: {
      earlyStart: { name: 'Early start', time: '7:30am - 8am', fee: 9.40 },
      lateFinish: { name: 'Late finish', time: '5:30pm - 6pm', fee: 9.40 },
      lunchHour: { name: 'Lunch hour', time: '12:30pm - 1:30pm', hours: 1, fee: 9.40, requiresPartial: true },
    },
    meals: {
      hotLunch: { name: 'Hot lunch', fee: 4.16 },
      hotTea: { name: 'Hot tea', fee: 4.16 },
    },
    funding: {
      enrichmentPerHour: 1.50,
      enrichmentFlat22: 33.00,
      unfundedHourlyRate: 7.58,
      maxFundedHoursPerDay: null, // No cap
    },
  },

  'peacehaven': {
    id: 'peacehaven',
    name: 'Peacehaven',
    sites: [],
    phone: '01273 584250',
    email: 'peacehaven@hopscotchmail.com',
    sessions: {
      fullDay: { name: 'Full day', time: '8am - 5:30pm', hours: 9.5, fee: 68.00 },
      morning: { name: 'Morning', time: '8am - 12:30pm', hours: 4.5, fee: 35.00, existingOnly: true },
      afternoon: { name: 'Afternoon', time: '1:30pm - 5:30pm', hours: 4, fee: 34.00, existingOnly: true },
    },
    extras: {
      earlyStart: { name: 'Early start', time: '7:30am - 8am', fee: 9.40 },
      lunchHour: { name: 'Lunch hour', time: '12:30pm - 1:30pm', hours: 1, fee: 9.40, requiresPartial: true },
    },
    meals: {
      hotLunch: { name: 'Hot lunch', fee: 4.16 },
    },
    funding: {
      enrichmentPerHour: 1.50,
      enrichmentFlat22: 33.00,
      unfundedHourlyRate: 7.16,
      maxFundedHoursPerDay: null,
    },
  },

  'worthing': {
    id: 'worthing',
    name: 'Worthing Central',
    sites: [],
    phone: '01903 234859',
    email: 'worthing@hopscotchmail.com',
    sessions: {
      fullDay: { name: 'Full day', time: '8am - 6pm', hours: 10, fee: 70.00 },
      morning: { name: 'Morning', time: '8am - 1:30pm', hours: 5.5, fee: 38.00, existingOnly: true },
      afternoon: { name: 'Afternoon', time: '1:30pm - 6pm', hours: 4.5, fee: 35.00, existingOnly: true },
    },
    extras: {
      earlyStart: { name: 'Early start', time: '7:30am - 8am', fee: 9.40 },
    },
    meals: {
      hotLunch: { name: 'Hot lunch', fee: 4.16 },
      coldTea: { name: 'Cold tea', fee: 2.75 },
    },
    funding: {
      enrichmentPerHour: 1.25,
      enrichmentFlat22: 27.50,
      unfundedHourlyRate: 7.00,
      maxFundedHoursPerDay: 10,
    },
  },

  'seaford': {
    id: 'seaford',
    name: 'Seaford',
    sites: [],
    phone: '01323 492123',
    email: 'seaford@hopscotchmail.com',
    sessions: {
      fullDay: { name: 'Full day', time: '8am - 5:30pm', hours: 9.5, fee: 64.00 },
      morning: { name: 'Morning', time: '8am - 12:30pm', hours: 4.5, fee: 34.00, existingOnly: true },
      afternoon: { name: 'Afternoon', time: '1:30pm - 5:30pm', hours: 4, fee: 32.00, existingOnly: true },
      schoolDay: { name: 'School day', time: '8am - 3pm', hours: 7, fee: 54.00, existingOnly: true },
    },
    extras: {
      earlyStart: { name: 'Early start', time: '7:30am - 8am', fee: 9.40 },
      lateFinish: { name: 'Late finish', time: '5:30pm - 6pm', fee: 9.40 },
      lunchHour: { name: 'Lunch hour', time: '12:30pm - 1:30pm', hours: 1, fee: 9.40, requiresPartial: true },
    },
    meals: {
      hotLunch: { name: 'Hot lunch', fee: 4.16 },
      coldTea: { name: 'Cold tea', fee: 2.75 },
    },
    funding: {
      enrichmentPerHour: 1.50,
      enrichmentFlat22: 33.00,
      unfundedHourlyRate: 6.74,
      maxFundedHoursPerDay: null,
    },
  },

  'hove-station': {
    id: 'hove-station',
    name: 'Hove Station',
    sites: [],
    phone: '01273 711480',
    email: 'hovestation@hopscotchmail.com',
    sessions: {
      fullDay: { name: 'Full day', time: '7:30am - 6:30pm', hours: 11, fee: 78.00 },
    },
    extras: {},
    meals: {
      hotLunch: { name: 'Hot lunch', fee: 4.16 },
      hotTea: { name: 'Hot tea', fee: 4.16 },
    },
    funding: {
      enrichmentPerHour: 1.50,
      enrichmentFlat22: 33.00,
      unfundedHourlyRate: 7.09,
      maxFundedHoursPerDay: 10,
    },
    fullDaysOnly: true, // No session options even for existing bookings
  },
};

// Get nursery by ID
export function getNursery(id) {
  return NURSERIES[id] || NURSERIES['brighton'];
}

// Get all nurseries as array for dropdown
export function getAllNurseries() {
  return Object.values(NURSERIES);
}

// Check if nursery has partial sessions
export function hasPartialSessions(nursery) {
  if (nursery.fullDaysOnly) return false;
  return Object.values(nursery.sessions).some(s => s.existingOnly);
}

// Check if nursery has a specific extra
export function hasExtra(nursery, extraKey) {
  return !!nursery.extras[extraKey];
}

// Check if nursery has a specific meal option
export function hasMeal(nursery, mealKey) {
  return !!nursery.meals[mealKey];
}

// Get session options for dropdown
export function getSessionOptions(nursery, isNewBooking) {
  const options = [{ value: 'none', label: 'Not attending' }];

  Object.entries(nursery.sessions).forEach(([key, session]) => {
    if (!isNewBooking || !session.existingOnly) {
      options.push({
        value: key,
        label: `${session.name} (${session.time})`,
      });
    }
  });

  return options;
}
