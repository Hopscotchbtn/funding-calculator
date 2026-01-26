// Funding entitlements (stretched over 51 weeks)
export const FUNDING = {
  fifteen: 11, // 11.18 rounded to 11
  thirty: 22,  // 22.35 rounded to 22
};

// Calculate age in years and months from date of birth
export function calculateAge(dob, referenceDate = new Date()) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  const today = referenceDate;

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (today.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  const totalMonths = years * 12 + months;

  return { years, months, totalMonths };
}

// Calculate when a child turns 9 months old
export function getDateAtNineMonths(dob) {
  const birthDate = new Date(dob);
  const nineMonthsDate = new Date(birthDate);
  nineMonthsDate.setMonth(nineMonthsDate.getMonth() + 9);
  return nineMonthsDate;
}

// Determine funding start date based on birth date or milestone date
export function getFundingStartDate(dateForEligibility) {
  const date = new Date(dateForEligibility);
  const month = date.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const year = date.getFullYear();

  // Born 1 Sept - 31 Dec → Funding starts following January
  if (month >= 8 && month <= 11) { // Sept (8) to Dec (11)
    return new Date(year + 1, 0, 1); // January of next year
  }
  // Born 1 Jan - 31 Mar → Funding starts following April
  if (month >= 0 && month <= 2) { // Jan (0) to Mar (2)
    return new Date(year, 3, 1); // April of same year
  }
  // Born 1 Apr - 31 Aug → Funding starts following September
  if (month >= 3 && month <= 7) { // Apr (3) to Aug (7)
    return new Date(year, 8, 1); // September of same year
  }

  return null;
}

// Calculate 9-month funding start (for working parents)
export function getNineMonthFundingStart(dob) {
  const nineMonthsDate = getDateAtNineMonths(dob);
  return getFundingStartDate(nineMonthsDate);
}

// Calculate 2-year funding start
export function getTwoYearFundingStart(dob) {
  const birthDate = new Date(dob);
  const twoYearsDate = new Date(birthDate);
  twoYearsDate.setFullYear(twoYearsDate.getFullYear() + 2);
  return getFundingStartDate(twoYearsDate);
}

// Calculate 3-year funding start
export function getThreeYearFundingStart(dob) {
  const birthDate = new Date(dob);
  const threeYearsDate = new Date(birthDate);
  threeYearsDate.setFullYear(threeYearsDate.getFullYear() + 3);
  return getFundingStartDate(threeYearsDate);
}

// Determine current funding eligibility
export function determineFundingEligibility(dob, isWorkingParent, referenceDate = new Date()) {
  if (!dob) return { eligible: false, hours: 0, futureEligibility: null };

  const age = calculateAge(dob, referenceDate);
  if (!age) return { eligible: false, hours: 0, futureEligibility: null };

  const today = referenceDate;

  // Child over 5 - not eligible for this calculator
  if (age.years >= 5) {
    return { eligible: false, hours: 0, overFive: true };
  }

  // Working parents pathway
  if (isWorkingParent === 'working') {
    const nineMonthStart = getNineMonthFundingStart(dob);
    const twoYearStart = getTwoYearFundingStart(dob);
    const threeYearStart = getThreeYearFundingStart(dob);

    // 3-4 years: 30 hours
    if (threeYearStart && today >= threeYearStart && age.years < 5) {
      return { eligible: true, hours: FUNDING.thirty, stretchedHours: 22, type: '30-hour' };
    }

    // 2-3 years: 30 hours (from Sept 2025)
    const sept2025 = new Date(2025, 8, 1);
    if (twoYearStart && today >= twoYearStart && today >= sept2025 && age.years >= 2 && age.years < 3) {
      return { eligible: true, hours: FUNDING.thirty, stretchedHours: 22, type: '30-hour' };
    }
    if (twoYearStart && today >= twoYearStart && age.years >= 2 && age.years < 3) {
      // Before Sept 2025, 2-year-olds get 15 hours
      return { eligible: true, hours: FUNDING.fifteen, stretchedHours: 11, type: '15-hour' };
    }

    // 9 months to 2 years: 15 hours
    if (nineMonthStart && today >= nineMonthStart && age.totalMonths >= 9 && age.years < 2) {
      return { eligible: true, hours: FUNDING.fifteen, stretchedHours: 11, type: '15-hour' };
    }

    // Check future eligibility
    if (nineMonthStart && today < nineMonthStart) {
      return {
        eligible: false,
        hours: 0,
        futureEligibility: {
          date: nineMonthStart,
          hours: FUNDING.fifteen,
          type: '15-hour (from 9 months)'
        }
      };
    }

    if (twoYearStart && today < twoYearStart && age.totalMonths >= 9) {
      return {
        eligible: false,
        hours: 0,
        futureEligibility: {
          date: twoYearStart,
          hours: FUNDING.thirty,
          type: '30-hour (from age 2)'
        }
      };
    }

    return { eligible: false, hours: 0, futureEligibility: null };
  }

  // Non-working parents pathway - only universal 15 hours at 3-4
  if (isWorkingParent === 'not-working') {
    const threeYearStart = getThreeYearFundingStart(dob);

    if (threeYearStart && today >= threeYearStart && age.years >= 3 && age.years < 5) {
      return { eligible: true, hours: FUNDING.fifteen, stretchedHours: 11, type: '15-hour universal' };
    }

    // Check future eligibility
    if (age.years < 3) {
      return {
        eligible: false,
        hours: 0,
        futureEligibility: {
          date: threeYearStart,
          hours: FUNDING.fifteen,
          type: '15-hour universal (from age 3)'
        }
      };
    }

    return { eligible: false, hours: 0, futureEligibility: null };
  }

  // Not sure about eligibility
  return { eligible: false, hours: 0, uncertain: true };
}

// Calculate total session hours for a nursery
export function calculateTotalHours(days, nursery) {
  let total = 0;

  Object.values(days).forEach(day => {
    if (day.session && day.session !== 'none') {
      const sessionConfig = nursery.sessions[day.session];
      if (sessionConfig) {
        total += sessionConfig.hours;
      }
    }

    if (day.lunchHour && nursery.extras.lunchHour) {
      total += nursery.extras.lunchHour.hours || 1;
    }
  });

  return total;
}

// Calculate unfunded cost (no funding applied)
export function calculateUnfundedCost(days, nursery, meals) {
  let total = 0;
  let breakdown = {
    sessions: 0,
    earlyStart: 0,
    lateFinish: 0,
    lunchHour: 0,
    meals: {},
  };

  let counts = {
    sessionDays: 0,
    earlyStartDays: 0,
    lateFinishDays: 0,
    lunchHourDays: 0,
  };

  Object.values(days).forEach(day => {
    if (day.session && day.session !== 'none') {
      const sessionConfig = nursery.sessions[day.session];
      if (sessionConfig) {
        breakdown.sessions += sessionConfig.fee;
        counts.sessionDays++;
      }
    }

    if (day.earlyStart && day.session !== 'none' && nursery.extras.earlyStart) {
      breakdown.earlyStart += nursery.extras.earlyStart.fee;
      counts.earlyStartDays++;
    }
    if (day.lateFinish && day.session !== 'none' && nursery.extras.lateFinish) {
      breakdown.lateFinish += nursery.extras.lateFinish.fee;
      counts.lateFinishDays++;
    }
    if (day.lunchHour && nursery.extras.lunchHour) {
      const isPartialSession = day.session === 'morning' || day.session === 'afternoon';
      if (isPartialSession) {
        breakdown.lunchHour += nursery.extras.lunchHour.fee;
        counts.lunchHourDays++;
      }
    }
  });

  // Calculate meals
  Object.entries(meals).forEach(([mealKey, isSelected]) => {
    if (isSelected && nursery.meals[mealKey]) {
      const mealTotal = counts.sessionDays * nursery.meals[mealKey].fee;
      breakdown.meals[mealKey] = mealTotal;
    }
  });

  const mealsTotal = Object.values(breakdown.meals).reduce((sum, val) => sum + val, 0);

  total = breakdown.sessions + breakdown.earlyStart + breakdown.lateFinish +
          breakdown.lunchHour + mealsTotal;

  return {
    total,
    breakdown,
    counts,
  };
}

// Calculate funded cost
export function calculateFundedCost(days, nursery, fundedHours, includeEnrichment, meals) {
  const totalHours = calculateTotalHours(days, nursery);

  // Calculate how funding applies
  const actualFundedHours = Math.min(fundedHours, totalHours);
  const unfundedHours = Math.max(0, totalHours - fundedHours);

  // Calculate enrichment fee
  let enrichmentFee = 0;
  if (includeEnrichment) {
    if (actualFundedHours >= 22) {
      enrichmentFee = nursery.funding.enrichmentFlat22;
    } else {
      enrichmentFee = actualFundedHours * nursery.funding.enrichmentPerHour;
    }
  }

  let breakdown = {
    fundedHours: actualFundedHours,
    fundedCost: 0, // Funded hours are free
    enrichmentFee: enrichmentFee,
    unfundedHours: unfundedHours,
    unfundedCost: unfundedHours * nursery.funding.unfundedHourlyRate,
    earlyStart: 0,
    lateFinish: 0,
    lunchHour: 0,
    meals: {},
  };

  let counts = {
    sessionDays: 0,
    earlyStartDays: 0,
    lateFinishDays: 0,
    lunchHourDays: 0,
  };

  Object.values(days).forEach(day => {
    if (day.session && day.session !== 'none') {
      counts.sessionDays++;
    }

    if (day.earlyStart && day.session !== 'none' && nursery.extras.earlyStart) {
      breakdown.earlyStart += nursery.extras.earlyStart.fee;
      counts.earlyStartDays++;
    }
    if (day.lateFinish && day.session !== 'none' && nursery.extras.lateFinish) {
      breakdown.lateFinish += nursery.extras.lateFinish.fee;
      counts.lateFinishDays++;
    }
    if (day.lunchHour && nursery.extras.lunchHour) {
      const isPartialSession = day.session === 'morning' || day.session === 'afternoon';
      if (isPartialSession) {
        breakdown.lunchHour += nursery.extras.lunchHour.fee;
        counts.lunchHourDays++;
      }
    }
  });

  // Calculate meals
  Object.entries(meals).forEach(([mealKey, isSelected]) => {
    if (isSelected && nursery.meals[mealKey]) {
      const mealTotal = counts.sessionDays * nursery.meals[mealKey].fee;
      breakdown.meals[mealKey] = mealTotal;
    }
  });

  const mealsTotal = Object.values(breakdown.meals).reduce((sum, val) => sum + val, 0);

  const total = breakdown.enrichmentFee + breakdown.unfundedCost +
                breakdown.earlyStart + breakdown.lateFinish +
                breakdown.lunchHour + mealsTotal;

  // Calculate what unfunded would cost for savings comparison
  const unfundedCost = calculateUnfundedCost(days, nursery, meals);

  return {
    total,
    breakdown,
    counts,
    savings: unfundedCost.total - total
  };
}

// Format currency
export function formatCurrency(amount) {
  return `£${amount.toFixed(2)}`;
}

// Format date for display
export function formatDate(date) {
  if (!date) return '';
  const options = { month: 'long', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

// Count selected days
export function countSelectedDays(days) {
  return Object.values(days).filter(day => day.session && day.session !== 'none').length;
}
