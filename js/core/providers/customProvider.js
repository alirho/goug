import { fetchStreamWithRetries } from '../../services/apiService.js';
import { getErrorMessageForStatus } from '../../utils/apiErrors.js';
import { buildOpenAIRequestBody, getOpenAIErrorMessage, processOpenAIStream } from './openaiProvider.js';

/**
 * Handles streaming responses from a custom OpenAI-compatible API.
 * @param {object} settings - User settings including apiKey, modelName, and endpointUrl.
 * @param {Array<object>} history - The chat history.
 * @param {Function} onChunk - Callback function for each response chunk.
 */
export async function streamCustomResponse(settings, history, onChunk) {
    const API_URL = settings.endpointUrl;

    const requestBody = buildOpenAIRequestBody(history);
    const finalBody = {
        ...requestBody,
        model: settings.modelName,
        stream: true,
    };

    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify(finalBody),
    };

    await fetchStreamWithRetries(
        API_URL,
        fetchOptions,
        (line) => processOpenAIStream(line, onChunk),
        getOpenAIErrorMessage
    );
}
