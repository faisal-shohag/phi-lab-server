"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateScore = void 0;
/**
 * Calculate final score based on match percentage, character count, and max score
 * @param {number} maxScore - Maximum score possible (100, 300, 500, etc.)
 * @param {number} matchPercentage - Match percentage (0-100)
 * @param {number} characterCount - Number of characters
 * @returns {number} - Final calculated score
 */
const calculateScore = (maxScore, matchPercentage, characterCount) => {
    if (matchPercentage <= 0 || characterCount <= 0)
        return 0;
    // Validate inputs
    if (matchPercentage < 0 || matchPercentage > 100) {
        throw new Error("Match percentage must be between 0 and 100");
    }
    if (characterCount < 0) {
        throw new Error("Character count must be non-negative");
    }
    // Normalize match percentage to 0-1 range
    const matchWeight = matchPercentage / 100;
    // Character penalty: fewer characters = higher score
    // Inverse relationship - we use 1/(1 + characterCount/100) to normalize
    const characterWeight = 1 / (1 + characterCount / 100);
    // Combine weights (you can adjust the ratio)
    // 70% weight for match, 30% weight for character efficiency
    const combinedWeight = matchWeight * 0.7 + characterWeight * 0.3;
    // Calculate final score
    const finalScore = maxScore * combinedWeight;
    return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
};
exports.calculateScore = calculateScore;
