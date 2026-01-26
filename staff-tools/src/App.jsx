import { useState } from 'react';
import { getAllNurseries, queryTypes, fundingTypes } from './data/config';
import { generateResponse } from './services/claudeApi';

const nurseries = getAllNurseries();

function App() {
  const [selectedNurseryId, setSelectedNurseryId] = useState('');
  const [selectedQueryType, setSelectedQueryType] = useState('');
  const [parentMessage, setParentMessage] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [context, setContext] = useState({
    childAge: '',
    currentDays: '',
    fundingType: '',
    notes: ''
  });
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = async () => {
    if (!selectedNurseryId) {
      setError('Please select a nursery');
      return;
    }
    if (!parentMessage.trim()) {
      setError('Please enter the parent\'s question');
      return;
    }

    setError('');
    setIsLoading(true);
    setGeneratedResponse('');

    try {
      const nursery = nurseries.find(n => n.id === selectedNurseryId);
      const queryTypeLabel = queryTypes.find(q => q.id === selectedQueryType)?.label;
      const fundingTypeLabel = fundingTypes.find(f => f.id === context.fundingType)?.label;

      const response = await generateResponse({
        nursery,
        queryType: queryTypeLabel,
        parentMessage,
        context: {
          ...context,
          fundingType: fundingTypeLabel
        }
      });

      setGeneratedResponse(response);
    } catch (err) {
      setError(err.message || 'Failed to generate response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedResponse);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleClear = () => {
    setGeneratedResponse('');
    setParentMessage('');
    setSelectedQueryType('');
    setContext({
      childAge: '',
      currentDays: '',
      fundingType: '',
      notes: ''
    });
    setShowContext(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-[#FFD700]">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <img
              src="/hopscotch-logo.png"
              alt="Hopscotch"
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Staff Tools</h1>
              <p className="text-xs sm:text-sm text-gray-500">Funding Response Generator</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {/* Staff-only notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm text-blue-800">
          <strong>Internal tool</strong> - generates draft responses for staff to review, edit, and send via Famly/email. No data is stored.
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-5">
          {/* Nursery Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nursery <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedNurseryId}
              onChange={(e) => setSelectedNurseryId(e.target.value)}
              className="select-field"
            >
              <option value="">Select nursery...</option>
              {nurseries.map(nursery => (
                <option key={nursery.id} value={nursery.id}>
                  {nursery.name} - £{nursery.sessions.fullDay.fee}/day ({nursery.sessions.fullDay.hours}hrs)
                </option>
              ))}
            </select>
          </div>

          {/* Query Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Type <span className="text-gray-400">(optional)</span>
            </label>
            <select
              value={selectedQueryType}
              onChange={(e) => setSelectedQueryType(e.target.value)}
              className="select-field"
            >
              <option value="">Select type to help tailor response...</option>
              {queryTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Parent Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent's Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={parentMessage}
              onChange={(e) => setParentMessage(e.target.value)}
              placeholder="Paste or type the parent's message here..."
              rows={5}
              className="input-field"
            />
          </div>

          {/* Context Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showContext ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Add context (optional)
            </button>

            {showContext && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Child's Age
                    </label>
                    <input
                      type="text"
                      value={context.childAge}
                      onChange={(e) => setContext({ ...context, childAge: e.target.value })}
                      placeholder="e.g., 2 years 3 months"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Current Days/Sessions
                    </label>
                    <input
                      type="text"
                      value={context.currentDays}
                      onChange={(e) => setContext({ ...context, currentDays: e.target.value })}
                      placeholder="e.g., Mon, Wed, Fri (full days)"
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Funding Status
                  </label>
                  <select
                    value={context.fundingType}
                    onChange={(e) => setContext({ ...context, fundingType: e.target.value })}
                    className="select-field"
                  >
                    <option value="">Select if known...</option>
                    {fundingTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={context.notes}
                    onChange={(e) => setContext({ ...context, notes: e.target.value })}
                    placeholder="Any other relevant information..."
                    rows={2}
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !selectedNurseryId || !parentMessage.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Response
              </>
            )}
          </button>
        </div>

        {/* Response Section */}
        {generatedResponse && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-[#4CAF50] px-4 py-3 flex items-center justify-between">
              <h2 className="font-medium text-white">Generated Response</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded transition-colors flex items-center gap-1"
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={generatedResponse}
                onChange={(e) => setGeneratedResponse(e.target.value)}
                rows={12}
                className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent font-sans text-gray-700 leading-relaxed resize-y"
              />
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
                <button
                  onClick={handleClear}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3 inline-block">
            This is a draft response - always review and personalise before sending
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
