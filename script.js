  const wordsDisplay = document.getElementById('words-display');
const typingInput = document.getElementById('typing-input');
const timeSpan = document.getElementById('time');
const wpmSpan = document.getElementById('wpm');
const accuracySpan = document.getElementById('accuracy');
const errorsSpan = document.getElementById('errors');
const restartBtn = document.getElementById('restart-btn');

// A simple word list (you'd ideally load a larger one)
const wordList = [
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog",
    "developer", "coding", "javascript", "html", "css", "responsive",
    "program", "function", "variable", "array", "object", "console",
    "terminal", "keyboard", "mouse", "monitor", "internet", "website",
    "application", "framework", "library", "component", "module",
    "algorithm", "data", "structure", "system", "network", "server",
    "client", "database", "query", "syntax", "error", "debug",
    "version", "control", "git", "repository", "commit", "branch",
    "merge", "pull", "request", "deploy", "hosting", "cloud"
];

let words = [];
let wordIndex = 0;
let characterIndex = 0;
let startTime;
let timerInterval;
let timeLeft = 60; // seconds
let correctCharacters = 0;
let incorrectCharacters = 0;
let totalTypedCharacters = 0;
let rawErrors = 0; // To count unique errors, not re-typed errors

function getRandomWords(count) {
    const shuffled = [...wordList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function loadWords() {
    wordsDisplay.innerHTML = ''; // Clear previous words
    words = getRandomWords(50); // Get 50 random words
    words.forEach((word, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.classList.add('word');
        if (index === 0) {
            wordSpan.classList.add('current');
        }
        word.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.textContent = char;
            wordSpan.appendChild(charSpan);
        });
        wordsDisplay.appendChild(wordSpan);
    });
    // Add cursor to the first character of the first word
    updateCursor();
}

function updateCursor() {
    const currentWordElement = wordsDisplay.children[wordIndex];
    if (!currentWordElement) return; // In case game ends

    // Remove existing cursor
    const existingCursor = document.querySelector('.cursor');
    if (existingCursor) {
        existingCursor.remove();
    }

    let targetCharElement;
    if (characterIndex < currentWordElement.children.length) {
        targetCharElement = currentWordElement.children[characterIndex];
    } else {
        // If cursor is at the end of the word, append it after the last char
        targetCharElement = document.createElement('span');
        targetCharElement.textContent = ' '; // Placeholder for cursor after last char
        currentWordElement.appendChild(targetCharElement);
    }

    const cursor = document.createElement('span');
    cursor.classList.add('cursor');
    targetCharElement.parentNode.insertBefore(cursor, targetCharElement.nextSibling);

    // Scroll display to keep current word in view
    const currentWordOffset = currentWordElement.offsetTop;
    const displayHeight = wordsDisplay.clientHeight;
    const scrollThreshold = displayHeight / 3; // Scroll when word is 1/3 way down

    if (currentWordOffset > wordsDisplay.scrollTop + displayHeight - scrollThreshold) {
        wordsDisplay.scrollTop = currentWordOffset - displayHeight + scrollThreshold;
    } else if (currentWordOffset < wordsDisplay.scrollTop + scrollThreshold && wordsDisplay.scrollTop > 0) {
        wordsDisplay.scrollTop = currentWordOffset - scrollThreshold;
    }
}

function startTimer() {
    startTime = new Date().getTime();
    timerInterval = setInterval(() => {
        timeLeft--;
        timeSpan.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function endGame() {
    typingInput.disabled = true;
    typingInput.value = '';
    alert('Time\'s up! Your WPM: ' + wpmSpan.textContent + ', Accuracy: ' + accuracySpan.textContent + '%');
}

function calculateStats() {
    const totalWordsTyped = wordIndex;
    const minutes = (60 - timeLeft) / 60;
    const wpm = Math.round((correctCharacters / 5) / minutes); // Standard WPM calculation (5 chars per word)
    wpmSpan.textContent = isFinite(wpm) ? wpm : 0; // Handle division by zero at start

    const accuracy = totalTypedCharacters === 0 ? 100 : Math.round(((correctCharacters / totalTypedCharacters) * 100));
    accuracySpan.textContent = isFinite(accuracy) ? accuracy : 100;

    errorsSpan.textContent = rawErrors;
}

typingInput.addEventListener('keydown', e => {
    if (!startTime && timeLeft > 0) {
        startTimer();
        typingInput.focus(); // Ensure input is focused
    }

    const currentWordElement = wordsDisplay.children[wordIndex];
    if (!currentWordElement) return; // Game might be over

    const typedChar = e.key;
    const expectedChar = currentWordElement.children[characterIndex] ? currentWordElement.children[characterIndex].textContent : ' ';

    if (typedChar === ' ') {
        e.preventDefault(); // Prevent space from being typed in input
        if (characterIndex === currentWordElement.children.length) {
            // User typed space at the end of the word, move to next word
            moveToNextWord();
        }
        return;
    }

    if (typedChar === 'Backspace') {
        if (characterIndex > 0) {
            characterIndex--;
            const charSpan = currentWordElement.children[characterIndex];
            charSpan.classList.remove('correct', 'incorrect');
            totalTypedCharacters--;
            // If the character was incorrect, we might need to decrement rawErrors as well if it's the specific error being corrected.
            // This logic can get complex for true "error" tracking vs. simple "incorrect char" tracking.
            // For simplicity here, we'll just focus on visual correction.
        } else if (wordIndex > 0) {
            // Move back to previous word if at the beginning of the current word
            wordIndex--;
            const prevWordElement = wordsDisplay.children[wordIndex];
            // Remove 'current' from the old current word
            currentWordElement.classList.remove('current');
            // Add 'current' to the new current word
            prevWordElement.classList.add('current');
            // Set character index to the end of the previous word
            characterIndex = prevWordElement.children.length;
            typingInput.value = words[wordIndex]; // Populate input with previous word for editing
            totalTypedCharacters = Math.max(0, totalTypedCharacters - 1); // Adjust total typed characters
        }
        updateCursor();
        calculateStats();
        return;
    }

    if (e.key.length === 1 && e.key.match(/^[a-zA-Z',.\-]$/)) { // Only accept letters and common punctuation
        totalTypedCharacters++;
        const charSpan = currentWordElement.children[characterIndex];

        if (charSpan && typedChar === expectedChar) {
            charSpan.classList.add('correct');
            charSpan.classList.remove('incorrect');
            correctCharacters++;
        } else if (charSpan) {
            charSpan.classList.add('incorrect');
            charSpan.classList.remove('correct');
            incorrectCharacters++;
            rawErrors++; // Count as a new error
        } else {
            // Typed beyond the word length, mark as incorrect
            // This is a simple way to handle extra characters.
            // You might want to visually indicate this differently.
            const extraCharSpan = document.createElement('span');
            extraCharSpan.textContent = typedChar;
            extraCharSpan.classList.add('incorrect');
            currentWordElement.appendChild(extraCharSpan);
            incorrectCharacters++;
            rawErrors++;
        }
        characterIndex++;
    }

    updateCursor();
    calculateStats();
});


// Handle typing input and word completion
typingInput.addEventListener('input', () => {
    const typedText = typingInput.value;
    const currentWord = words[wordIndex];
    const currentWordElement = wordsDisplay.children[wordIndex];

    if (!currentWordElement) return; // Game might be over

    // Visual feedback for characters
    for (let i = 0; i < currentWordElement.children.length; i++) {
        const charSpan = currentWordElement.children[i];
        if (i < typedText.length) {
            if (typedText[i] === currentWord[i]) {
                charSpan.classList.add('correct');
                charSpan.classList.remove('incorrect');
            } else {
                charSpan.classList.add('incorrect');
                charSpan.classList.remove('correct');
            }
        } else {
            charSpan.classList.remove('correct', 'incorrect');
        }
    }

    // Handle extra characters typed beyond the word
    while (currentWordElement.children.length > currentWord.length && currentWordElement.lastChild.classList.contains('incorrect')) {
        currentWordElement.lastChild.remove();
    }
    for (let i = currentWord.length; i < typedText.length; i++) {
        const extraCharSpan = document.createElement('span');
        extraCharSpan.textContent = typedText[i];
        extraCharSpan.classList.add('incorrect');
        currentWordElement.appendChild(extraCharSpan);
    }

    characterIndex = typedText.length;
    updateCursor();
    calculateStats();

    // Check if the current word is complete and correct
    if (typedText.length === currentWord.length && typedText === currentWord) {
        moveToNextWord();
    }
});


function moveToNextWord() {
    const currentWordElement = wordsDisplay.children[wordIndex];
    if (currentWordElement) {
        currentWordElement.classList.remove('current');
        // Check if all characters were correctly typed for this word before moving on
        // This is important for accuracy calculation.
        let wordCorrect = true;
        for (let i = 0; i < currentWordElement.children.length; i++) {
            if (!currentWordElement.children[i].classList.contains('correct')) {
                wordCorrect = false;
                break;
            }
        }
        // If the word was entirely correct, the 'correctCharacters' for this word are already counted
        // This makes WPM more accurate.

        // If user typed extra characters which were incorrect, account for them in errors
        // You'll need more sophisticated error tracking if you want to differentiate between
        // "incorrect character typed" and "extra character typed".
    }

    wordIndex++;
    characterIndex = 0;
    typingInput.value = ''; // Clear input for the next word

    if (wordIndex < words.length) {
        const nextWordElement = wordsDisplay.children[wordIndex];
        if (nextWordElement) {
            nextWordElement.classList.add('current');
            updateCursor(); // Update cursor for the new current word
        }
    } else {
        // All words typed
        endGame();
    }
}

restartBtn.addEventListener('click', initializeGame);

function initializeGame() {
    clearInterval(timerInterval);
    timeLeft = 60;
    wordIndex = 0;
    characterIndex = 0;
    correctCharacters = 0;
    incorrectCharacters = 0;
    totalTypedCharacters = 0;
    rawErrors = 0;
    startTime = null;

    timeSpan.textContent = timeLeft;
    wpmSpan.textContent = 0;
    accuracySpan.textContent = 100;
    errorsSpan.textContent = 0;
    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.focus();

    loadWords();
}

// Initialize the game when the page loads
initializeGame();