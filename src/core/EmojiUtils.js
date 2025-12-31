/**
 * Utility functions for converting emojis to images using Twemoji
 */

/**
 * Parses emojis in a DOM element and converts them to images
 * @param {HTMLElement|string} element - DOM element or selector string
 * @returns {HTMLElement|null} - The parsed element, or null if not found
 */
export function parseEmojis(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    if (!element || typeof twemoji === 'undefined') {
        return element;
    }
    
    twemoji.parse(element, {
        folder: 'svg',
        ext: '.svg',
        className: 'emoji',
        size: 'svg'
    });
    
    return element;
}

/**
 * Parses emojis in a text string and returns HTML with image tags
 * Note: This is for when you need to convert text before setting innerHTML
 * @param {string} text - Text containing emojis
 * @returns {string} - HTML string with emojis converted to images
 */
export function parseEmojisInText(text) {
    if (typeof twemoji === 'undefined') {
        return text;
    }
    
    return twemoji.parse(text, {
        folder: 'svg',
        ext: '.svg',
        className: 'emoji',
        size: 'svg'
    });
}

/**
 * Parses all emojis in the document (useful for initial page load)
 */
export function parseAllEmojis() {
    if (typeof twemoji === 'undefined') {
        return;
    }
    
    twemoji.parse(document.body, {
        folder: 'svg',
        ext: '.svg',
        className: 'emoji',
        size: 'svg'
    });
}

