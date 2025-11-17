import { fetchStreamWithRetries } from '../../services/apiService.js';
import { getErrorMessageForStatus } from '../../utils/apiErrors.js';

// JSDoc Type Imports
/** @typedef {import('../../types.js').ProviderHandler} ProviderHandler */

/**
 * Builds the request body for the Gemini API.
 * @param {Array<import('../../types.js').Message>} history - The chat history.
 * @returns {object} The request body.
 */
function buildGeminiRequestBody(history) {
    const contents = history.map(msg => {
        const parts = [];

        if (msg.role === 'user') {
            // Text part should come before image parts for multi-modal models
            if (msg.content) {
                parts.push({ text: msg.content });
            }
            if (msg.image && msg.image.data && msg.image.mimeType) {
                parts.push({
                    inlineData: {
                        mimeType: msg.image.mimeType,
                        data: msg.image.data
                    }
                });
            }
        } else { // model
            parts.push({ text: msg.content });
        }
        
        return {
            role: msg.role === 'model' ? 'model' : 'user',
            parts: parts
        };
    }).filter(c => c.parts.length > 0);

    return {
        contents: contents,
        systemInstruction: {
            parts: [{ text: 'You are a helpful assistant named Goug. Your responses should be in Persian.' }]
        }
    };
}

/**
 * Processes a single line from the Gemini SSE stream.
 * @param {string} line - A line from the stream.
 * @param {Function} onChunk - Callback to handle the extracted content.
 */
function processGeminiStream(line, onChunk) {
    if (line.startsWith('data: ')) {
        try {
            const jsonStr = line.substring(6);
            if (jsonStr) {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content) onChunk(content);
            }
        } catch (e) {
            console.warn("Error parsing Gemini stream chunk:", line, e);
        }
    }
}

/**
 * Extracts a detailed error message from a Gemini API response.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<string>} A promise that resolves to the error message.
 */
async function getGeminiErrorMessage(response) {
    try {
        const errorData = await response.json();
        return errorData?.error?.message || getErrorMessageForStatus(response.status);
    } catch {
        return getErrorMessageForStatus(response.status);
    }
}

/**
 * پاسخ‌های استریم را از Google Gemini API مدیریت می‌کند.
 * @type {ProviderHandler}
 */
export async function streamGeminiResponse(settings, history, onChunk, signal) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${settings.modelName}:streamGenerateContent?key=${settings.apiKey}&alt=sse`;
    
    const requestBody = buildGeminiRequestBody(history);

    const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal,
    };

    await fetchStreamWithRetries(
        API_URL,
        fetchOptions,
        (line) => processGeminiStream(line, onChunk),
        getGeminiErrorMessage
    );
}