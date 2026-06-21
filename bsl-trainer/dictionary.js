// dictionary.js
export const dictionary = {
    easy: ["ORANGE", "BLUE", "CAT", "DOG", "TEA", "SAM", "BEN", "MAM", "DAD", "TAP", "HEN", "TEN", "TIN", "TIP", "PIT", "PAT", "PET"], // 'Sam' and 'Ben' will be fingerspelt automatically
    medium: ["HELP-YOU", "CHARITY", "HELP-ME", "COFFEE", "WATER", "LONDON", "INTERPRETER", "ALEX", "DAVID", "DANNY", "KATE", "BATH", "TYNE", "TEES", "WEAR"], 
    hard: ["BICYCLE", "COMPUTER", "ORGANISATION", "VOLUNTEER", "SCOTLAND", "CHLOE", "SARAH", "MATTHEW", "ANDREW", "TAKEAWAY", "CHICKEN", "POTATO", "TOMATO", "LASAGNE", "CONTAINER", "NEWCASTLE", "SUNDERLAND"]
};

/**
 * Gets a random word from the specified difficulty
 */
export function getRandomWord(difficulty = 'easy') {
    const words = dictionary[difficulty] || dictionary.easy;
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
}
