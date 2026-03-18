import { useState, useMemo, useEffect } from 'react';

const ALLOWED_PARENTS = [
  'https://www.hopscotch.uk.com/',
];
import {
  calculateAge,
  determineFundingEligibility,
  calculateTotalHours,
  calculateUnfundedCost,
  calculateFundedCost,
  formatCurrency,
  formatDate,
  countSelectedDays,
  getFundingMilestones,
} from '../utils/calculations';
import { getAllNurseries, getNursery, hasPartialSessions } from '../utils/nurseryConfig';
import HopscotchLogo from './HopscotchLogo';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
};

const INITIAL_DAY_STATE = {
  session: 'none',
  earlyStart: false,
  lateFinish: false,
  lunchHour: false,
};

const ITEMS_TO_PROVIDE = [
  'Nappies/pull-ups (if needed)',
  'Wipes',
  'Nappy cream',
  'Change of clothes',
  'Sun cream (warm months)',
  'Sun hat (warm months)',
  'Morning snack',
  'Afternoon snack',
  'Comfort item (if needed)',
];

// Info tooltip component
function InfoTooltip({ text }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-5 h-5 rounded-full bg-hopscotch-fresh-air text-hopscotch-forest inline-flex items-center justify-center text-xs font-bold hover:bg-hopscotch-fresh-air/80 transition-colors"
        aria-label="More information"
      >
        ?
      </button>
      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-hopscotch-forest text-white text-sm rounded-lg shadow-lg font-body">
          <div className="relative">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-hopscotch-forest"></div>
          </div>
        </div>
      )}
    </span>
  );
}

// Decorative wave SVG
function WaveDecoration({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path
        d="M0,60 C150,120 350,0 500,60 C650,120 850,0 1000,60 C1100,100 1150,80 1200,60 L1200,120 L0,120 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function FundingCalculator() {
  // Detect if running inside an iframe
  const isEmbedded = window !== window.parent;

  // iframe resize messaging
  useEffect(() => {
    const parentOrigin = ALLOWED_PARENTS.find(origin =>
      document.referrer.startsWith(origin)
    );

    if (!parentOrigin) return;

    const observer = new ResizeObserver(() => {
      window.parent.postMessage(
        { type: 'resize', height: document.documentElement.scrollHeight },
        parentOrigin
      );
    });

    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  // Nursery selection
  const [selectedNurseryId, setSelectedNurseryId] = useState('brighton');
  const nursery = useMemo(() => getNursery(selectedNurseryId), [selectedNurseryId]);
  const allNurseries = getAllNurseries();

  // Form state
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bookingType, setBookingType] = useState('new');
  const [days, setDays] = useState(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: { ...INITIAL_DAY_STATE } }), {})
  );
  const [fundingEligibility, setFundingEligibility] = useState('working');
  const [includeEnrichment, setIncludeEnrichment] = useState(true);
  const [meals, setMeals] = useState({});

  // Reset days when nursery changes
  const handleNurseryChange = (nurseryId) => {
    setSelectedNurseryId(nurseryId);
    setDays(DAYS.reduce((acc, day) => ({ ...acc, [day]: { ...INITIAL_DAY_STATE } }), {}));
    setMeals({});
  };

  // Derived state
  const age = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);
  const funding = useMemo(
    () => determineFundingEligibility(dateOfBirth, fundingEligibility),
    [dateOfBirth, fundingEligibility]
  );
  const totalHours = useMemo(() => calculateTotalHours(days, nursery), [days, nursery]);
  const selectedDaysCount = useMemo(() => countSelectedDays(days), [days]);
  const fundingMilestones = useMemo(
    () => getFundingMilestones(dateOfBirth, fundingEligibility),
    [dateOfBirth, fundingEligibility]
  );

  // Calculate costs
  const costs = useMemo(() => {
    if (selectedDaysCount === 0) return null;

    if (funding.eligible) {
      return calculateFundedCost(days, nursery, funding.hours, includeEnrichment, meals);
    }
    return calculateUnfundedCost(days, nursery, meals);
  }, [days, nursery, funding, includeEnrichment, meals, selectedDaysCount]);

  // Calculate projected funded costs for future-eligible children
  const futureCosts = useMemo(() => {
    if (selectedDaysCount === 0) return null;
    if (funding.eligible) return null; // already showing current funded cost
    if (!funding.futureEligibility) return null;
    return calculateFundedCost(days, nursery, funding.futureEligibility.hours, includeEnrichment, meals);
  }, [days, nursery, funding, includeEnrichment, meals, selectedDaysCount]);

  // Handle day selection for new bookings
  const handleNewBookingDayToggle = (day) => {
    setDays(prev => ({
      ...prev,
      [day]: {
        ...INITIAL_DAY_STATE,
        session: prev[day].session === 'none' ? 'fullDay' : 'none',
      }
    }));
  };

  // Handle session change for existing bookings
  const handleSessionChange = (day, session) => {
    setDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        session,
        lunchHour: (session === 'morning' || session === 'afternoon') ? prev[day].lunchHour : false,
      }
    }));
  };

  // Handle extras toggle
  const handleExtraToggle = (day, extra) => {
    setDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [extra]: !prev[day][extra],
      }
    }));
  };

  // Handle meal toggle
  const handleMealToggle = (mealKey) => {
    setMeals(prev => ({
      ...prev,
      [mealKey]: !prev[mealKey],
    }));
  };

  // Validation
  const isValidDOB = dateOfBirth && new Date(dateOfBirth) <= new Date();
  const isChildOverFive = age && age.years >= 5;
  const isChildNotBorn = dateOfBirth && new Date(dateOfBirth) > new Date();
  const showTwoYearNote = fundingEligibility === 'not-working' && age && age.years >= 2 && age.years < 3;

  // Generate email summary
  const generateEmailSummary = () => {
    if (!costs) return { subject: '', body: '' };

    const selectedDayNames = DAYS
      .filter(day => days[day].session !== 'none')
      .map(day => day.charAt(0).toUpperCase() + day.slice(1))
      .join(', ');

    let body = `Hopscotch ${nursery.name} - Nursery Fees Estimate\n`;
    body += `${'='.repeat(50)}\n\n`;

    body += `BOOKING DETAILS\n`;
    body += `-`.repeat(30) + `\n`;
    if (age) {
      body += `Child's age: ${age.years} years, ${age.months} months\n`;
    }
    body += `Days: ${selectedDayNames}\n`;
    body += `Total hours: ${totalHours} hours per week\n`;
    body += `Booking type: ${bookingType === 'new' ? 'New booking' : 'Existing booking'}\n\n`;

    // Session details
    body += `SESSIONS\n`;
    body += `-`.repeat(30) + `\n`;
    DAYS.forEach(day => {
      const dayState = days[day];
      if (dayState.session !== 'none') {
        const sessionConfig = nursery.sessions[dayState.session];
        let dayLine = `${day.charAt(0).toUpperCase() + day.slice(1)}: ${sessionConfig.name} (${sessionConfig.time})`;
        const extras = [];
        if (dayState.earlyStart && nursery.extras.earlyStart) extras.push('Early start');
        if (dayState.lateFinish && nursery.extras.lateFinish) extras.push('Late finish');
        if (dayState.lunchHour && nursery.extras.lunchHour) extras.push('Lunch hour');
        if (extras.length > 0) dayLine += ` + ${extras.join(', ')}`;
        body += dayLine + `\n`;
      }
    });
    body += `\n`;

    // Funding status
    body += `FUNDING\n`;
    body += `-`.repeat(30) + `\n`;
    if (funding.eligible) {
      body += `Status: Eligible for ${funding.type}\n`;
      body += `Funded hours: ${costs.breakdown.fundedHours} hours\n`;
      if (costs.breakdown.unfundedHours > 0) {
        body += `Additional hours: ${costs.breakdown.unfundedHours.toFixed(1)} hours\n`;
      }
    } else {
      body += `Status: No funding applied\n`;
      if (funding.futureEligibility) {
        body += `Future eligibility: ${formatDate(funding.futureEligibility.date)}\n`;
      }
    }
    body += `\n`;

    // Cost breakdown
    body += `COST BREAKDOWN\n`;
    body += `-`.repeat(30) + `\n`;
    if (funding.eligible) {
      body += `Funded hours: £0.00\n`;
      if (includeEnrichment && costs.breakdown.fundedHours > 0) {
        body += `Enrichment fee: ${formatCurrency(costs.breakdown.enrichmentFee)}\n`;
      }
      if (costs.breakdown.unfundedHours > 0) {
        body += `Additional hours: ${formatCurrency(costs.breakdown.unfundedCost)}\n`;
      }
    } else {
      body += `Session fees: ${formatCurrency(costs.breakdown.sessions)}\n`;
    }

    if (costs.counts.earlyStartDays > 0 && nursery.extras.earlyStart) {
      body += `Early start (${costs.counts.earlyStartDays}x): ${formatCurrency(costs.breakdown.earlyStart)}\n`;
    }
    if (costs.counts.lateFinishDays > 0 && nursery.extras.lateFinish) {
      body += `Late finish (${costs.counts.lateFinishDays}x): ${formatCurrency(costs.breakdown.lateFinish)}\n`;
    }
    if (costs.counts.lunchHourDays > 0 && nursery.extras.lunchHour) {
      body += `Lunch hour (${costs.counts.lunchHourDays}x): ${formatCurrency(costs.breakdown.lunchHour)}\n`;
    }

    Object.entries(costs.breakdown.meals).forEach(([mealKey, mealTotal]) => {
      const mealConfig = nursery.meals[mealKey];
      if (mealConfig && mealTotal > 0) {
        body += `${mealConfig.name} (${costs.counts.sessionDays}x): ${formatCurrency(mealTotal)}\n`;
      }
    });

    body += `\n`;
    body += `${'='.repeat(30)}\n`;
    body += `TOTAL: ${formatCurrency(costs.total)} per week\n`;
    body += `Monthly estimate: ${formatCurrency(costs.total * 4.33)}\n`;
    body += `${'='.repeat(30)}\n`;

    if (funding.eligible && costs.savings > 0) {
      body += `\nSavings with funding: ${formatCurrency(costs.savings)} per week\n`;
    }

    body += `\n\nNOTES\n`;
    body += `-`.repeat(30) + `\n`;
    body += `• This is an estimate - final fees confirmed at booking\n`;
    body += `• Prices valid from April 2026\n`;
    if (funding.eligible) {
      body += `• Apply for your funding code at beststartinlife.gov.uk\n`;
    }
    body += `\n\nContact: ${nursery.email} | ${nursery.phone}\n`;
    body += `Visit: hopscotch.uk.com\n`;

    const subject = `Hopscotch ${nursery.name} - Fees Estimate (${formatCurrency(costs.total)}/week)`;

    return { subject, body };
  };

  // Copy to clipboard state
  const [copied, setCopied] = useState(false);

  // Handle copy button click
  const handleCopyClick = async () => {
    const { body } = generateEmailSummary();
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = body;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Check if nursery supports partial sessions
  const supportsPartialSessions = hasPartialSessions(nursery);
  const showBookingTypeChoice = supportsPartialSessions;

  // Get session options for dropdown
  const getSessionOptions = () => {
    const options = [{ value: 'none', label: 'Not attending' }];
    Object.entries(nursery.sessions).forEach(([key, session]) => {
      if (bookingType === 'new' && session.existingOnly) return;
      options.push({
        value: key,
        label: `${session.name} (${session.time})`,
      });
    });
    return options;
  };

  // Check if day has extras available
  const hasAnyExtras = Object.keys(nursery.extras).length > 0;

  return (
    <div className="min-h-screen bg-hopscotch-pebble font-body">
      {/* Header — hidden when embedded in iframe */}
      {!isEmbedded && (
        <header className="bg-hopscotch-fresh-air-light relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
            <div className="flex flex-col items-center">
              <HopscotchLogo size="lg" />
              <p className="text-xs tracking-widest text-hopscotch-forest/60 mt-2 uppercase font-medium">Children's Nurseries</p>
              <h1 className="font-display text-3xl md:text-4xl text-hopscotch-forest mt-4">
                Nursery Fees & Funding
              </h1>
              <p className="text-hopscotch-forest/70 mt-2">
                Calculate your weekly childcare costs
              </p>
            </div>
          </div>
          <WaveDecoration className="absolute bottom-0 left-0 w-full h-8 text-hopscotch-pebble" />
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Intro explainer for new parents */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <details className="group">
            <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-hopscotch-pebble/50 transition-colors">
              <span className="font-semibold text-hopscotch-forest flex items-center gap-2">
                <svg className="w-5 h-5 text-hopscotch-fresh-air" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                New to childcare funding? Click here to learn how it works
              </span>
              <svg className="w-5 h-5 text-hopscotch-forest/50 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4 pt-0 border-t border-gray-100 bg-hopscotch-pebble/30">
              <div className="space-y-3 text-sm text-hopscotch-forest/80">
                <p>
                  <strong className="text-hopscotch-forest">The government helps pay for childcare!</strong> Depending on your circumstances, you could get up to 15 or 30 hours of free childcare per week.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-hopscotch-apple mb-1">Working families</p>
                    <ul className="text-xs space-y-1">
                      <li>• From the term after your child turns 9 months: <strong>up to 30 hours</strong></li>
                      <li>• Both parents must work</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-hopscotch-fresh-air mb-1">All families</p>
                    <ul className="text-xs space-y-1">
                      <li>• From the term after your child turns 3: <strong>up to 15 hours</strong></li>
                      <li>• Available to everyone regardless of work status</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs">
                  At Hopscotch we provide the funded hours <strong>stretched</strong> — <strong>what does "stretched" mean?</strong> The 15/30 hours are for term-time (38 weeks only). We spread them across the whole year (51 weeks) so you get a consistent number each week — that's up to 11 or 22 hours.
                </p>
                <a
                  href="https://www.beststartinlife.gov.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-hopscotch-fresh-air font-semibold hover:underline text-xs"
                >
                  Check your eligibility at beststartinlife.gov.uk
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </details>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 p-4 bg-hopscotch-sunshine/20 border border-hopscotch-sunshine/30 rounded-xl text-center">
          <p className="text-sm text-hopscotch-forest/80">
            <strong>Please note:</strong> This is an estimate calculator only. Actual fees will be confirmed when you make a booking with the nursery.
          </p>
        </div>

        {/* Mobile cost preview - shows when there's a calculation */}
        {costs && selectedDaysCount > 0 && (
          <div className="lg:hidden mb-6 p-4 bg-hopscotch-apple/10 border border-hopscotch-apple/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-hopscotch-forest/70">Estimated weekly cost</p>
                <p className="text-2xl font-bold text-hopscotch-apple">{formatCurrency(costs.total)}</p>
              </div>
              <a href="#results" className="text-sm text-hopscotch-fresh-air font-semibold hover:underline">
                See full breakdown →
              </a>
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Form Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Nursery Selection */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-hopscotch-sunshine/30">
              <h2 className="font-display text-xl text-hopscotch-forest mb-4">
                Select Your Nursery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allNurseries.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNurseryChange(n.id)}
                    className={`
                      p-4 rounded-xl text-left transition-all border-2
                      ${selectedNurseryId === n.id
                        ? 'bg-hopscotch-apple/10 border-hopscotch-apple shadow-sm'
                        : 'bg-hopscotch-pebble/50 border-transparent hover:border-hopscotch-sunshine/50 hover:bg-white'
                      }
                    `}
                  >
                    <span className={`font-semibold ${selectedNurseryId === n.id ? 'text-hopscotch-apple' : 'text-hopscotch-forest'}`}>
                      {n.name}
                    </span>
                    {n.sites.length > 0 && (
                      <p className="text-xs text-hopscotch-forest/60 mt-1">
                        {n.sites.join(', ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Date of Birth */}
            <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 bg-hopscotch-sunshine rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm">1</span>
                <h2 className="font-display text-xl text-hopscotch-forest">Child's Date of Birth</h2>
              </div>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-hopscotch-sunshine/50 focus:border-hopscotch-sunshine text-lg transition-colors"
                max={new Date().toISOString().split('T')[0]}
              />
              {isValidDOB && age && !isChildOverFive && (
                <p className="mt-3 text-hopscotch-forest/70 bg-hopscotch-pebble rounded-lg px-4 py-2">
                  Age at start: <span className="font-semibold text-hopscotch-forest">{age.years} years, {age.months} months</span>
                </p>
              )}

              {/* Funding Timeline */}
              {isValidDOB && !isChildOverFive && fundingMilestones.length > 0 && (
                <div className="mt-4 p-4 bg-hopscotch-fresh-air/10 border border-hopscotch-fresh-air/30 rounded-xl">
                  <h3 className="font-semibold text-hopscotch-forest mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-hopscotch-fresh-air" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Your Funding Timeline
                  </h3>
                  <div className="space-y-3">
                    {fundingMilestones.map((milestone, index) => (
                      <div key={index} className={`p-3 rounded-lg ${milestone.isCurrent ? 'bg-hopscotch-apple/10 border border-hopscotch-apple/30' : milestone.isPast ? 'bg-gray-100' : 'bg-white border border-hopscotch-fresh-air/30'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`font-semibold ${milestone.isCurrent ? 'text-hopscotch-apple' : 'text-hopscotch-forest'}`}>
                              {milestone.label}
                              {milestone.isCurrent && (
                                <span className="ml-2 text-xs bg-hopscotch-apple text-white px-2 py-0.5 rounded-full">Active now</span>
                              )}
                            </p>
                            <p className="text-sm text-hopscotch-forest/70">
                              {milestone.isPast ? 'Started' : 'Starts'}: <span className="font-medium">{formatDate(milestone.date)}</span>
                            </p>
                          </div>
                        </div>
                        {!milestone.isPast && milestone.applicationDeadline && (
                          <div className="mt-2 p-2 bg-hopscotch-sunshine/20 rounded-lg">
                            <p className="text-sm text-hopscotch-forest">
                              <strong>Apply by {formatDate(milestone.applicationDeadline)}</strong> for {milestone.term} start
                            </p>
                            <a
                              href="https://www.beststartinlife.gov.uk"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-hopscotch-fresh-air hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              Apply at beststartinlife.gov.uk
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                        {milestone.isCurrent && (
                          <p className="mt-2 text-xs text-hopscotch-forest/60">
                            Remember to reconfirm your code every 3 months at beststartinlife.gov.uk
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Error States */}
            {isChildNotBorn && (
              <div className="bg-hopscotch-marmalade/10 border-2 border-hopscotch-marmalade/30 rounded-2xl p-4 text-hopscotch-marmalade">
                Please enter your child's date of birth
              </div>
            )}

            {isChildOverFive && (
              <div className="bg-hopscotch-marmalade/10 border-2 border-hopscotch-marmalade/30 rounded-2xl p-4 text-hopscotch-marmalade">
                This calculator is for children under 5. Please contact us for school-age childcare options.
              </div>
            )}

            {!isChildOverFive && isValidDOB && (
              <>
                {/* Booking Type */}
                {showBookingTypeChoice && (
                  <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-8 h-8 bg-hopscotch-apple rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm">2</span>
                      <h2 className="font-display text-xl text-hopscotch-forest">
                        Booking Type
                        <InfoTooltip text="New bookings are full days only. If you already have a place with us, you may have different session options like mornings or afternoons." />
                      </h2>
                    </div>
                    <div className="space-y-3">
                      <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${bookingType === 'new' ? 'border-hopscotch-apple bg-hopscotch-apple/5' : 'border-gray-100 hover:border-hopscotch-sunshine/50'}`}>
                        <input
                          type="radio"
                          name="bookingType"
                          value="new"
                          checked={bookingType === 'new'}
                          onChange={(e) => {
                            setBookingType(e.target.value);
                            setDays(DAYS.reduce((acc, day) => ({ ...acc, [day]: { ...INITIAL_DAY_STATE } }), {}));
                          }}
                          className="mt-1 w-5 h-5 text-hopscotch-apple focus:ring-hopscotch-apple"
                        />
                        <div>
                          <span className="font-semibold text-hopscotch-forest">I'm looking for a new place</span>
                          <p className="text-sm text-hopscotch-forest/60">Full days only ({nursery.sessions.fullDay.time})</p>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${bookingType === 'existing' ? 'border-hopscotch-apple bg-hopscotch-apple/5' : 'border-gray-100 hover:border-hopscotch-sunshine/50'}`}>
                        <input
                          type="radio"
                          name="bookingType"
                          value="existing"
                          checked={bookingType === 'existing'}
                          onChange={(e) => {
                            setBookingType(e.target.value);
                            setDays(DAYS.reduce((acc, day) => ({ ...acc, [day]: { ...INITIAL_DAY_STATE } }), {}));
                          }}
                          className="mt-1 w-5 h-5 text-hopscotch-apple focus:ring-hopscotch-apple"
                        />
                        <div>
                          <span className="font-semibold text-hopscotch-forest">My child already attends Hopscotch</span>
                          <p className="text-sm text-hopscotch-forest/60">More session options available (mornings, afternoons, etc.)</p>
                        </div>
                      </label>
                    </div>
                  </section>
                )}

                {/* Days & Sessions */}
                <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 bg-hopscotch-marmalade rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm">
                      {showBookingTypeChoice ? '3' : '2'}
                    </span>
                    <h2 className="font-display text-xl text-hopscotch-forest">Days & Sessions</h2>
                  </div>

                  {bookingType === 'new' || !supportsPartialSessions ? (
                    <div className="grid grid-cols-5 gap-2 md:gap-3">
                      {DAYS.map(day => (
                        <button
                          key={day}
                          onClick={() => handleNewBookingDayToggle(day)}
                          className={`
                            py-4 px-2 rounded-xl font-medium text-center transition-all border-2
                            ${days[day].session === 'fullDay'
                              ? 'bg-hopscotch-apple text-white border-hopscotch-apple shadow-md'
                              : 'bg-hopscotch-pebble text-hopscotch-forest/70 border-hopscotch-pebble hover:border-hopscotch-sunshine'
                            }
                          `}
                        >
                          <span className="block text-lg font-semibold">{DAY_LABELS[day]}</span>
                          {days[day].session === 'fullDay' && (
                            <span className="block text-xs mt-1 opacity-90">Full day</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {DAYS.map(day => (
                        <div key={day} className="flex items-center gap-4 p-3 bg-hopscotch-pebble/50 rounded-xl">
                          <span className="w-12 font-semibold text-hopscotch-forest">{DAY_LABELS[day]}</span>
                          <select
                            value={days[day].session}
                            onChange={(e) => handleSessionChange(day, e.target.value)}
                            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-hopscotch-apple/50 focus:border-hopscotch-apple bg-white"
                          >
                            {getSessionOptions().map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Additional Options */}
                {hasAnyExtras && bookingType === 'existing' && selectedDaysCount > 0 && (
                  <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-8 h-8 bg-hopscotch-smiles rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm">
                        {showBookingTypeChoice ? '4' : '3'}
                      </span>
                      <h2 className="font-display text-xl text-hopscotch-forest">Additional Options</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-sm text-hopscotch-forest/60 border-b border-gray-100">
                            <th className="text-left py-3 font-medium">Day</th>
                            {nursery.extras.earlyStart && (
                              <th className="text-center py-3 font-medium">
                                <div>Early start</div>
                                <div className="text-xs font-normal">({nursery.extras.earlyStart.time})</div>
                              </th>
                            )}
                            {nursery.extras.lateFinish && (
                              <th className="text-center py-3 font-medium">
                                <div>Late finish</div>
                                <div className="text-xs font-normal">({nursery.extras.lateFinish.time})</div>
                              </th>
                            )}
                            {nursery.extras.lunchHour && (
                              <th className="text-center py-3 font-medium">
                                <div>Lunch hour</div>
                                <div className="text-xs font-normal">({nursery.extras.lunchHour.time})</div>
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {DAYS.map(day => {
                            const dayState = days[day];
                            if (dayState.session === 'none') return null;

                            const canHaveLunchHour = dayState.session === 'morning' || dayState.session === 'afternoon';

                            return (
                              <tr key={day} className="border-b border-gray-50">
                                <td className="py-3 font-semibold text-hopscotch-forest">{DAY_LABELS[day]}</td>
                                {nursery.extras.earlyStart && (
                                  <td className="text-center py-3">
                                    <input
                                      type="checkbox"
                                      checked={dayState.earlyStart}
                                      onChange={() => handleExtraToggle(day, 'earlyStart')}
                                      className="w-6 h-6 text-hopscotch-apple focus:ring-hopscotch-apple rounded-lg border-2 border-gray-300"
                                    />
                                  </td>
                                )}
                                {nursery.extras.lateFinish && (
                                  <td className="text-center py-3">
                                    <input
                                      type="checkbox"
                                      checked={dayState.lateFinish}
                                      onChange={() => handleExtraToggle(day, 'lateFinish')}
                                      className="w-6 h-6 text-hopscotch-apple focus:ring-hopscotch-apple rounded-lg border-2 border-gray-300"
                                    />
                                  </td>
                                )}
                                {nursery.extras.lunchHour && (
                                  <td className="text-center py-3">
                                    {canHaveLunchHour ? (
                                      <input
                                        type="checkbox"
                                        checked={dayState.lunchHour}
                                        onChange={() => handleExtraToggle(day, 'lunchHour')}
                                        className="w-6 h-6 text-hopscotch-apple focus:ring-hopscotch-apple rounded-lg border-2 border-gray-300"
                                      />
                                    ) : (
                                      <span className="text-gray-300">-</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* Funding Eligibility */}
                <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 bg-hopscotch-fresh-air rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm">
                      {showBookingTypeChoice ? (hasAnyExtras && selectedDaysCount > 0 && bookingType === 'existing' ? '5' : '4') : (hasAnyExtras && selectedDaysCount > 0 && bookingType === 'existing' ? '4' : '3')}
                    </span>
                    <h2 className="font-display text-xl text-hopscotch-forest">
                      Your Work Status
                      <InfoTooltip text="Working families can get more funded hours from the term after their child turns 9 months. You'll need to apply for a code at beststartinlife.gov.uk" />
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <label
                      className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${fundingEligibility === 'working' ? 'border-hopscotch-fresh-air bg-hopscotch-fresh-air/5' : 'border-gray-100 hover:border-hopscotch-sunshine/50'}`}
                    >
                      <input
                        type="radio"
                        name="fundingEligibility"
                        value="working"
                        checked={fundingEligibility === 'working'}
                        onChange={(e) => setFundingEligibility(e.target.value)}
                        className="mt-1 w-5 h-5 text-hopscotch-fresh-air focus:ring-hopscotch-fresh-air"
                      />
                      <div>
                        <span className="font-semibold text-hopscotch-forest">Both parents are working</span>
                        <p className="text-sm text-hopscotch-forest/60">Both parents must work (income under £100k/year each). Includes self-employed.</p>
                      </div>
                    </label>
                    <label
                      className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${fundingEligibility === 'not-working' ? 'border-hopscotch-fresh-air bg-hopscotch-fresh-air/5' : 'border-gray-100 hover:border-hopscotch-sunshine/50'}`}
                    >
                      <input
                        type="radio"
                        name="fundingEligibility"
                        value="not-working"
                        checked={fundingEligibility === 'not-working'}
                        onChange={(e) => setFundingEligibility(e.target.value)}
                        className="mt-1 w-5 h-5 text-hopscotch-fresh-air focus:ring-hopscotch-fresh-air"
                      />
                      <div>
                        <span className="font-semibold text-hopscotch-forest">One or both parents not working</span>
                        <p className="text-sm text-hopscotch-forest/60">You can still get 15 free hours from the term after your child turns 3</p>
                      </div>
                    </label>
                    <label
                      className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${fundingEligibility === 'not-sure' ? 'border-hopscotch-fresh-air bg-hopscotch-fresh-air/5' : 'border-gray-100 hover:border-hopscotch-sunshine/50'}`}
                    >
                      <input
                        type="radio"
                        name="fundingEligibility"
                        value="not-sure"
                        checked={fundingEligibility === 'not-sure'}
                        onChange={(e) => setFundingEligibility(e.target.value)}
                        className="mt-1 w-5 h-5 text-hopscotch-fresh-air focus:ring-hopscotch-fresh-air"
                      />
                      <div>
                        <span className="font-semibold text-hopscotch-forest">I'm not sure</span>
                        <p className="text-sm text-hopscotch-forest/60">No problem - we can help you check</p>
                      </div>
                    </label>
                  </div>

                  {fundingEligibility === 'not-sure' && (
                    <div className="mt-4 p-4 bg-hopscotch-fresh-air/10 rounded-xl">
                      <p className="text-hopscotch-forest/80 mb-2">Check your eligibility on the government website:</p>
                      <a
                        href="https://www.beststartinlife.gov.uk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-hopscotch-fresh-air hover:text-hopscotch-fresh-air/80 font-semibold"
                      >
                        beststartinlife.gov.uk
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {showTwoYearNote && (
                    <div className="mt-4 p-4 bg-hopscotch-marmalade/10 rounded-xl">
                      <p className="text-hopscotch-marmalade">
                        <strong>Note:</strong> You may qualify for 2-year-old disadvantaged funding. Please speak to your nursery manager.
                      </p>
                    </div>
                  )}
                </section>

                {/* Enrichment Fee - shown when funding is eligible now or coming soon */}
                {(funding.eligible || funding.futureEligibility) && (
                  <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-8 h-8 bg-hopscotch-sunshine rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm">
                        {showBookingTypeChoice ? (hasAnyExtras && selectedDaysCount > 0 && bookingType === 'existing' ? '6' : '5') : (hasAnyExtras && selectedDaysCount > 0 && bookingType === 'existing' ? '5' : '4')}
                      </span>
                      <h2 className="font-display text-xl text-hopscotch-forest">
                        Consumables & Enrichment
                        <InfoTooltip text="Government funding doesn't cover consumables or enrichment activities. Our package covers nappies, wipes, snacks and all the arts, crafts and activities your child enjoys each day. Most parents choose it for convenience, but you can bring your own if you prefer." />
                      </h2>
                    </div>
                    <p className="text-sm text-hopscotch-forest/70 mb-4">
                      Would you like us to provide nappies, wipes, snacks and enrichment activities (arts, crafts, outings and more)?
                    </p>
                    <div className="space-y-3">
                      <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${includeEnrichment ? 'border-hopscotch-apple bg-hopscotch-apple/5' : 'border-gray-100 hover:border-hopscotch-sunshine/50'}`}>
                        <input
                          type="radio"
                          name="enrichment"
                          value="yes"
                          checked={includeEnrichment}
                          onChange={() => setIncludeEnrichment(true)}
                          className="mt-1 w-5 h-5 text-hopscotch-apple focus:ring-hopscotch-apple"
                        />
                        <div>
                          <span className="font-semibold text-hopscotch-forest">Yes please (recommended)</span>
                          <p className="text-sm text-hopscotch-forest/60">We provide nappies, wipes, nappy cream, sun cream, snacks, and all enrichment activities (arts, crafts, outings and more). Nothing to remember each day!</p>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${!includeEnrichment ? 'border-hopscotch-marmalade bg-hopscotch-marmalade/5' : 'border-gray-100 hover:border-hopscotch-sunshine/50'}`}>
                        <input
                          type="radio"
                          name="enrichment"
                          value="no"
                          checked={!includeEnrichment}
                          onChange={() => setIncludeEnrichment(false)}
                          className="mt-1 w-5 h-5 text-hopscotch-marmalade focus:ring-hopscotch-marmalade"
                        />
                        <div>
                          <span className="font-semibold text-hopscotch-forest">No thanks, I'll bring my own</span>
                          <p className="text-sm text-hopscotch-forest/60">You'll need to bring items each day (see list below)</p>
                        </div>
                      </label>
                    </div>

                    {!includeEnrichment && (
                      <div className="mt-4 p-4 bg-hopscotch-pebble rounded-xl">
                        <p className="text-hopscotch-forest font-medium mb-2">Items you'll need to provide daily:</p>
                        <ul className="text-sm text-hopscotch-forest/70 grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {ITEMS_TO_PROVIDE.map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-hopscotch-marmalade rounded-full"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs text-hopscotch-forest/60 italic">
                          This is an illustrative list only. Please ask your nursery for the full list of items required.
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* Meals */}
                {Object.keys(nursery.meals).length > 0 && (
                  <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-8 h-8 bg-hopscotch-smiles rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm">
                        {(() => {
                          let step = 4; // Base: DOB, Days/Sessions, Work Status
                          if (showBookingTypeChoice) step++; // Booking Type
                          if (hasAnyExtras && selectedDaysCount > 0 && bookingType === 'existing') step++; // Additional Options
                          if (funding.eligible || funding.futureEligibility) step++; // Consumables Package
                          return step;
                        })()}
                      </span>
                      <h2 className="font-display text-xl text-hopscotch-forest">Meals</h2>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(nursery.meals).map(([mealKey, mealConfig]) => (
                        <label
                          key={mealKey}
                          className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${meals[mealKey] ? 'border-hopscotch-apple bg-hopscotch-apple/5' : 'border-gray-100 hover:border-hopscotch-sunshine/50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={meals[mealKey] || false}
                            onChange={() => handleMealToggle(mealKey)}
                            className="w-6 h-6 text-hopscotch-apple focus:ring-hopscotch-apple rounded-lg border-2"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-hopscotch-forest">{mealConfig.name}</span>
                            <span className="text-hopscotch-forest/60 ml-2">{formatCurrency(mealConfig.fee)}/day</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Results Panel */}
          <div id="results" className="lg:col-span-2 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-hopscotch-sunshine/30 relative overflow-hidden">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-hopscotch-sunshine/10 rounded-bl-full"></div>

                <h3 className="font-display text-2xl text-hopscotch-forest mb-1 relative">Weekly Cost</h3>
                <p className="text-sm text-hopscotch-forest/60 mb-4 relative">{nursery.name}</p>

                {!isValidDOB ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-hopscotch-sunshine/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-hopscotch-sunshine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-hopscotch-forest/70 font-medium">Let's get started!</p>
                    <p className="text-hopscotch-forest/50 text-sm mt-1">Enter your child's date of birth above</p>
                  </div>
                ) : isChildOverFive ? (
                  <div className="py-8 text-center">
                    <p className="text-hopscotch-marmalade font-medium">This calculator is for children under 5</p>
                    <p className="text-hopscotch-forest/50 text-sm mt-2">Please contact us for school-age childcare options</p>
                  </div>
                ) : selectedDaysCount === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-hopscotch-apple/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-hopscotch-apple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-hopscotch-forest/70 font-medium">Now choose your days</p>
                    <p className="text-hopscotch-forest/50 text-sm mt-1">Click on the days you need childcare</p>
                  </div>
                ) : costs ? (
                  <div className="space-y-4">
                    {/* Booking Summary */}
                    <div className="pb-4 border-b border-gray-100">
                      <h4 className="font-semibold text-hopscotch-forest/80 mb-2 text-sm uppercase tracking-wide">Your booking</h4>
                      <div className="text-sm text-hopscotch-forest/70 space-y-1">
                        <p>{selectedDaysCount} day{selectedDaysCount !== 1 ? 's' : ''} per week</p>
                        <p>Total hours: <span className="font-semibold text-hopscotch-forest">{totalHours} hrs</span></p>
                        {age && (
                          <p>Child's age: {age.years}y {age.months}m</p>
                        )}
                      </div>
                    </div>

                    {/* Funding Section */}
                    {funding.eligible ? (
                      <div className="pb-4 border-b border-gray-100">
                        <h4 className="font-semibold text-hopscotch-apple mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Funding applied
                        </h4>
                        <p className="text-xs text-hopscotch-forest/60 mb-2">{funding.type}</p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between text-hopscotch-forest/70">
                            <span>Funded: {costs.breakdown.fundedHours} hrs</span>
                            <span className="text-hopscotch-apple font-semibold">£0.00</span>
                          </div>
                          {includeEnrichment && costs.breakdown.fundedHours > 0 && (
                            <div className="flex justify-between text-hopscotch-forest/70">
                              <span>Consumables & enrichment</span>
                              <span>{formatCurrency(costs.breakdown.enrichmentFee)}</span>
                            </div>
                          )}
                          {costs.breakdown.unfundedHours > 0 && (
                            <div className="flex justify-between text-hopscotch-forest/70">
                              <span>Additional: {costs.breakdown.unfundedHours.toFixed(1)} hrs</span>
                              <span>{formatCurrency(costs.breakdown.unfundedCost)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pb-4 border-b border-gray-100">
                        <h4 className="font-semibold text-hopscotch-forest/80 mb-2 text-sm uppercase tracking-wide">Session fees</h4>
                        <div className="flex justify-between text-sm text-hopscotch-forest/70">
                          <span>Sessions</span>
                          <span className="font-semibold text-hopscotch-forest">{formatCurrency(costs.breakdown.sessions)}</span>
                        </div>
                      </div>
                    )}

                    {/* Projected funded cost for future-eligible children */}
                    {futureCosts && funding.futureEligibility && (
                      <div className="pb-4 border-b border-gray-100">
                        <h4 className="font-semibold text-hopscotch-fresh-air mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          From {formatDate(funding.futureEligibility.date)}
                        </h4>
                        <p className="text-xs text-hopscotch-forest/50 mb-2">Projected cost once funding starts ({funding.futureEligibility.type})</p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between text-hopscotch-forest/70">
                            <span>Funded: {futureCosts.breakdown.fundedHours} hrs</span>
                            <span className="text-hopscotch-apple font-semibold">£0.00</span>
                          </div>
                          {includeEnrichment && futureCosts.breakdown.fundedHours > 0 && (
                            <div className="flex justify-between text-hopscotch-forest/70">
                              <span>Consumables & enrichment</span>
                              <span>{formatCurrency(futureCosts.breakdown.enrichmentFee)}</span>
                            </div>
                          )}
                          {futureCosts.breakdown.unfundedHours > 0 && (
                            <div className="flex justify-between text-hopscotch-forest/70">
                              <span>Additional: {futureCosts.breakdown.unfundedHours.toFixed(1)} hrs</span>
                              <span>{formatCurrency(futureCosts.breakdown.unfundedCost)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold text-hopscotch-forest pt-1 border-t border-dashed border-gray-100">
                            <span>Total from {formatDate(funding.futureEligibility.date)}</span>
                            <span className="text-hopscotch-fresh-air">{formatCurrency(futureCosts.total)}/wk</span>
                          </div>
                          {futureCosts.savings > 0 && (
                            <p className="text-xs text-hopscotch-apple font-medium">Saves {formatCurrency(futureCosts.savings)}/week vs unfunded</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Extras */}
                    {(costs.counts.earlyStartDays > 0 || costs.counts.lateFinishDays > 0 ||
                      costs.counts.lunchHourDays > 0 || Object.keys(costs.breakdown.meals).length > 0) && (
                      <div className="pb-4 border-b border-gray-100">
                        <h4 className="font-semibold text-hopscotch-forest/80 mb-2 text-sm uppercase tracking-wide">Extras</h4>
                        <div className="text-sm space-y-1">
                          {costs.counts.earlyStartDays > 0 && nursery.extras.earlyStart && (
                            <div className="flex justify-between text-hopscotch-forest/70">
                              <span>Early start ({costs.counts.earlyStartDays}x)</span>
                              <span>{formatCurrency(costs.breakdown.earlyStart)}</span>
                            </div>
                          )}
                          {costs.counts.lateFinishDays > 0 && nursery.extras.lateFinish && (
                            <div className="flex justify-between text-hopscotch-forest/70">
                              <span>Late finish ({costs.counts.lateFinishDays}x)</span>
                              <span>{formatCurrency(costs.breakdown.lateFinish)}</span>
                            </div>
                          )}
                          {costs.counts.lunchHourDays > 0 && nursery.extras.lunchHour && (
                            <div className="flex justify-between text-hopscotch-forest/70">
                              <span>Lunch hour ({costs.counts.lunchHourDays}x)</span>
                              <span>{formatCurrency(costs.breakdown.lunchHour)}</span>
                            </div>
                          )}
                          {Object.entries(costs.breakdown.meals).map(([mealKey, mealTotal]) => {
                            const mealConfig = nursery.meals[mealKey];
                            if (!mealConfig || mealTotal === 0) return null;
                            return (
                              <div key={mealKey} className="flex justify-between text-hopscotch-forest/70">
                                <span>{mealConfig.name} ({costs.counts.sessionDays}x)</span>
                                <span>{formatCurrency(mealTotal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Total */}
                    <div className="pt-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-semibold text-hopscotch-forest">TOTAL</span>
                        <span className="text-3xl font-bold text-hopscotch-apple">{formatCurrency(costs.total)}</span>
                      </div>
                      <p className="text-right text-sm text-hopscotch-forest/50">per week</p>
                      <div className="flex justify-between items-center text-sm text-hopscotch-forest/60 mt-3 pt-3 border-t border-dashed border-gray-200">
                        <span>Monthly estimate</span>
                        <span className="font-semibold">{formatCurrency(costs.total * 4.33)}</span>
                      </div>
                    </div>

                    {/* Savings message */}
                    {funding.eligible && costs.savings > 0 && (
                      <div className="mt-4 p-4 bg-hopscotch-apple/10 rounded-xl border border-hopscotch-apple/20">
                        <p className="text-hopscotch-apple font-semibold text-sm flex items-center gap-2">
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                          </svg>
                          Save {formatCurrency(costs.savings)}/week with funding
                        </p>
                      </div>
                    )}

                    {/* Funding reminder */}
                    {funding.eligible && (
                      <div className="mt-3 p-4 bg-hopscotch-fresh-air/10 rounded-xl">
                        <p className="text-hopscotch-forest/80 text-sm">
                          Apply for your code at{' '}
                          <a href="https://www.beststartinlife.gov.uk" target="_blank" rel="noopener noreferrer" className="text-hopscotch-fresh-air font-semibold hover:underline">
                            beststartinlife.gov.uk
                          </a>
                        </p>
                      </div>
                    )}

                    {/* Copy Summary Button */}
                    <button
                      onClick={handleCopyClick}
                      className={`mt-6 w-full py-3 px-4 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm ${
                        copied
                          ? 'bg-hopscotch-apple text-white'
                          : 'bg-hopscotch-marmalade hover:bg-hopscotch-marmalade/90 text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy Summary
                        </>
                      )}
                    </button>

                    {/* What happens next */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="font-semibold text-hopscotch-forest mb-3 text-sm">What happens next?</h4>
                      <ol className="text-sm text-hopscotch-forest/70 space-y-2">
                        <li className="flex gap-2">
                          <span className="w-5 h-5 bg-hopscotch-sunshine/30 rounded-full flex items-center justify-center text-xs font-bold text-hopscotch-sunshine flex-shrink-0">1</span>
                          <a href="https://www.hopscotch.uk.com/visit" target="_blank" rel="noopener noreferrer" className="text-hopscotch-fresh-air font-semibold hover:underline">Book a nursery visit</a>
                          <span className="text-hopscotch-forest/70">to see our setting</span>
                        </li>
                        {funding.eligible && (
                          <li className="flex gap-2">
                            <span className="w-5 h-5 bg-hopscotch-sunshine/30 rounded-full flex items-center justify-center text-xs font-bold text-hopscotch-sunshine flex-shrink-0">2</span>
                            <span>Apply for your funding code at <a href="https://www.beststartinlife.gov.uk" target="_blank" rel="noopener noreferrer" className="text-hopscotch-fresh-air hover:underline">beststartinlife.gov.uk</a></span>
                          </li>
                        )}
                        <li className="flex gap-2">
                          <span className="w-5 h-5 bg-hopscotch-sunshine/30 rounded-full flex items-center justify-center text-xs font-bold text-hopscotch-sunshine flex-shrink-0">{funding.eligible ? '3' : '2'}</span>
                          <span>Confirm your booking with us</span>
                        </li>
                      </ol>
                      <a
                        href={`mailto:${nursery.email}?subject=Nursery enquiry - ${nursery.name}`}
                        className="mt-4 w-full py-3 px-4 bg-hopscotch-forest hover:bg-hopscotch-forest/90 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Get in touch
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Footer info */}
              <div className="mt-6 text-sm text-hopscotch-forest/50 space-y-1 text-center">
                <p>Prices valid from April 2026</p>
                <p>This is an estimate - final fees confirmed at booking</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer — hidden when embedded in iframe */}
      {!isEmbedded && (
        <footer className="bg-hopscotch-forest text-white mt-16 relative">
          <WaveDecoration className="absolute -top-8 left-0 w-full h-8 text-hopscotch-forest rotate-180" />
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <HopscotchLogo size="sm" />
                <div>
                  <p className="font-semibold">{nursery.name}</p>
                  <p className="text-white/60 text-sm">{nursery.phone}</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a href={`mailto:${nursery.email}`} className="text-hopscotch-sunshine hover:text-white transition-colors">
                  {nursery.email}
                </a>
                <a href="https://www.hopscotch.uk.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                  hopscotch.uk.com
                </a>
                <a href="https://www.beststartinlife.gov.uk" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                  Check funding eligibility
                </a>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-center text-white/40 text-xs">
              © {new Date().getFullYear()} Hopscotch Children's Nurseries. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
