// dictionary.js
export const dictionary = {
    easy: ["CAT", "DOG", "TEA", "SAM", "BEN"], // 'Sam' and 'Ben' will be fingerspelt automatically
    medium: ["COFFEE", "WATER", "LONDON", "ALEX", "DAVID"], 
    hard: ["BICYCLE", "COMPUTER", "SCOTLAND", "CHLOE", "SARAH"]
};

/**
 * Gets a random word from the specified difficulty
 */
export function getRandomWord(difficulty = 'easy') {
    const words = dictionary[difficulty] || dictionary.easy;
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}