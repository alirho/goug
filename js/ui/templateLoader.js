import { TemplateLoadError } from '../utils/customErrors.js';

/**
 * Loads an HTML template from a given path.
 * @param {string} path The path to the HTML template file.
 * @returns {Promise<string>} A promise that resolves with the HTML content as a string.
 * @throws {Error} If the template cannot be fetched.
 */
export async function loadTemplate(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Failed to load template from ${path}:`, error);
        throw new TemplateLoadError(path);
    }
}

/**
 * Loads a main template and recursively injects HTML partials.
 * @param {string} path The path to the main HTML template file.
 * @returns {Promise<string>} A promise that resolves with the fully assembled HTML string.
 */
export async function loadTemplateWithPartials(path) {
    const mainTemplateContent = await loadTemplate(path);

    // Regex to find all partials like {{> partialName }}
    const partialRegex = /{{\s*>\s*([a-zA-Z0-9_]+)\s*}}/g;
    const partialsToLoad = new Set();
    
    // Use String.prototype.matchAll to find all matches, including duplicates, in one go.
    // The Set will handle uniqueness automatically.
    for (const match of mainTemplateContent.matchAll(partialRegex)) {
        partialsToLoad.add(match[1]);
    }

    if (partialsToLoad.size === 0) {
        return mainTemplateContent; // No partials found, return as is.
    }

    const partialPromises = Array.from(partialsToLoad).map(name =>
        loadTemplate(`templates/partials/${name}.html`).then(content => ({ name, content }))
    );

    const loadedPartials = await Promise.all(partialPromises);

    const partialsMap = loadedPartials.reduce((acc, { name, content }) => {
        acc[name] = content;
        return acc;
    }, {});

    // Replace all occurrences of each partial placeholder.
    return mainTemplateContent.replace(partialRegex, (match, partialName) => {
        return partialsMap[partialName] || ''; // Return empty string if partial not found
    });
}