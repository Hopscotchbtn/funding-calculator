import { buildSystemPrompt } from '../data/config';

export async function generateResponse({
  nursery,
  queryType,
  parentMessage,
  context
}) {
  if (!parentMessage?.trim()) {
    throw new Error('Parent message is required');
  }

  const systemPrompt = buildSystemPrompt(nursery);

  // Build user message with context
  let userMessage = `Please draft a response to this parent query:\n\n"${parentMessage}"`;

  if (queryType) {
    userMessage += `\n\nQuery type: ${queryType}`;
  }

  if (context) {
    const contextParts = [];
    if (context.childAge) contextParts.push(`Child's age: ${context.childAge}`);
    if (context.currentDays) contextParts.push(`Current booking: ${context.currentDays}`);
    if (context.fundingType) contextParts.push(`Funding status: ${context.fundingType}`);
    if (context.notes) contextParts.push(`Additional notes: ${context.notes}`);

    if (contextParts.length > 0) {
      userMessage += `\n\nContext provided by staff:\n${contextParts.join('\n')}`;
    }
  }

  // Call our serverless function (API key is stored server-side)
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system: systemPrompt,
      userMessage: userMessage
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Server error: ${response.status}`);
  }

  const data = await response.json();

  if (data.response) {
    return data.response;
  }

  throw new Error('Unexpected response format');
}
