// CYBER ESCAPE - GLOBAL GAME CONFIGURATION
// Configured for CESA - Department of Computer Engineering

export const GAME_CONFIG = {
  TITLE: 'CYBER ESCAPE',
  ORGANIZER: 'CESA — Department of Computer Engineering',
  MAX_TEAMS: 30,
  FINAL_ROUND_MAX_TEAMS: 10,
  WINNERS_COUNT: 2, // Winner & Runner-up

  // Round 1: The First Breach
  ROUND_1: {
    NUMBER: 1,
    TITLE: 'THE FIRST BREACH',
    SUBTITLE: 'Security Protocol Decryption',
    DESCRIPTION: 'Decode the system. Solve the questions. Unlock the code. Retrieve your hidden word.',
    RULES: [
      '8 Technical Multiple Choice Questions.',
      'Stage A: 15 seconds to read the question statement before options unlock.',
      'Stage B: 30 seconds to select your answer (2 chances only).',
      'Every 2 correct questions unlock a segment of the 4-letter code.',
      'Enter the complete code to reveal Round 1 secret word.'
    ],
    TOTAL_QUESTIONS: 8,
    QUESTION_VIEW_SECONDS: 15,
    OPTION_VIEW_SECONDS: 30,
    TOTAL_TIME_PER_QUESTION: 45,
    MAX_CHANCES: 2,
    TOTAL_DURATION_SECONDS: 360,
    EXPECTED_CODE: 'CYBR',
    SCRAMBLED_LETTERS: ['R', 'C', 'Y', 'B'],
    SECRET_WORD: 'THINK'
  },

  // Round 2: Gridlock Protocol
  ROUND_2: {
    NUMBER: 2,
    TITLE: 'GRIDLOCK PROTOCOL',
    SUBTITLE: 'Technical Cryptographic Crosswords',
    DESCRIPTION: 'Solve two technical crosswords to synthesize the system bypass credentials.',
    RULES: [
      '2 Technical Crosswords: Crossword 1 (Easy) and Crossword 2 (Hard).',
      '5 minutes allotted per crossword.',
      'Crossword 1 completion unlocks the first 2 scrambled letters (H, E).',
      'Crossword 2 completion unlocks the next 2 scrambled letters (T, C).',
      'Unscramble the 4 letters and submit the verified key (TECH) to register your round submission.'
    ],
    TOTAL_CROSSWORDS: 2,
    DURATION_PER_CROSSWORD_SECONDS: 300, // 5 minutes
    EXPECTED_CODE: 'TECH',
    SCRAMBLED_LETTERS: ['H', 'E', 'T', 'C'],
    SECRET_WORD: 'BEFORE'
  },

  // Round 3: Binary Convergence
  ROUND_3: {
    NUMBER: 3,
    TITLE: 'BINARY CONVERGENCE',
    SUBTITLE: 'ASCII Decryption Matrix',
    DESCRIPTION: 'Direct binary-to-ASCII stream analysis using the permanent system reference matrix.',
    RULES: [
      '4 Binary-to-ASCII technical decoding challenges (2-3 technical words per stream).',
      '60 seconds per question.',
      'Maximum 2 attempts allowed per question.',
      '1 Hint available per question (Recorded and displayed to Admin).',
      'Each solved challenge unlocks one letter in a scrambled sequence (E, T, Y, B).',
      'Unscramble and submit the verified 4-letter key (BYTE) to register your round submission.'
    ],
    TOTAL_QUESTIONS: 4,
    DURATION_SECONDS: 60,
    MAX_ATTEMPTS: 2,
    MAX_HINTS: 1,
    EXPECTED_CODE: 'BYTE',
    SCRAMBLED_LETTERS: ['E', 'T', 'Y', 'B'],
    SECRET_WORD: 'YOU'
  },

  // Round 4: System Override
  ROUND_4: {
    NUMBER: 4,
    TITLE: 'SYSTEM OVERRIDE',
    SUBTITLE: 'Tri-Language Logic Reconstruction',
    DESCRIPTION: 'Fill the critical blanks in C++, Python, or Java to execute the kernel bypass.',
    RULES: [
      '4 Multi-Language Logic Problems (20-30 lines of code, 3 to 4 blanks per problem).',
      'Choose your preferred language (C++, Python, Java) for each problem.',
      '90 seconds per question.',
      'Hints available (Logged to Admin leaderboard).',
      'Correct execution unlocks scrambled code characters (D, O, C, E).',
      'Unscramble the letters and enter the verified key (CODE) to launch the final riddle.'
    ],
    TOTAL_QUESTIONS: 4,
    DURATION_SECONDS: 90,
    MAX_ATTEMPTS: 3,
    EXPECTED_CODE: 'CODE',
    SCRAMBLED_LETTERS: ['D', 'O', 'C', 'E'],
    SECRET_WORD: 'ESCAPE'
  },

  // Final Riddle Challenge
  FINAL_CHALLENGE: {
    TITLE: 'THE FINAL ESCAPE',
    SUBTITLE: 'Decrypted Sentence Assembly & Master Riddle',
    DESCRIPTION: 'Arrange the secret words collected from Rounds 1 through 4 to unlock the master riddle.',
    TARGET_SENTENCE: ['THINK', 'BEFORE', 'YOU', 'ESCAPE'],
    RIDDLE_TEXT: 'I am written by humans, executed by machines, sometimes broken, always translated. What am I?',
    EXPECTED_ANSWER: 'CODE',
    MAX_ATTEMPTS: 2
  }
};

export const GAME_STATES = {
  LANDING: 'LANDING',
  
  R1_WAITING: 'R1_WAITING',
  R1_ACTIVE: 'R1_ACTIVE',
  R1_RESULT: 'R1_RESULT',

  R2_WAITING: 'R2_WAITING',
  R2_ACTIVE: 'R2_ACTIVE',
  R2_RESULT: 'R2_RESULT',

  R3_WAITING: 'R3_WAITING',
  R3_ACTIVE: 'R3_ACTIVE',
  R3_RESULT: 'R3_RESULT',

  R4_WAITING: 'R4_WAITING',
  R4_ACTIVE: 'R4_ACTIVE',
  R4_RESULT: 'R4_RESULT',

  FINAL_RIDDLE: 'FINAL_RIDDLE',
  FINAL_WAITING: 'FINAL_WAITING',
  FINAL_RESULT: 'FINAL_RESULT'
};

export const ALLOWED_STATE_TRANSITIONS = {
  LANDING: ['R1_WAITING'],
  R1_WAITING: ['R1_ACTIVE', 'LANDING'],
  R1_ACTIVE: ['R1_RESULT'],
  R1_RESULT: ['R2_WAITING'],

  R2_WAITING: ['R2_ACTIVE'],
  R2_ACTIVE: ['R2_RESULT'],
  R2_RESULT: ['R3_WAITING'],

  R3_WAITING: ['R3_ACTIVE'],
  R3_ACTIVE: ['R3_RESULT'],
  R3_RESULT: ['R4_WAITING'],

  R4_WAITING: ['R4_ACTIVE'],
  R4_ACTIVE: ['R4_RESULT', 'FINAL_RIDDLE'],
  R4_RESULT: ['FINAL_RIDDLE'],

  FINAL_RIDDLE: ['FINAL_WAITING'],
  FINAL_WAITING: ['FINAL_RESULT'],
  FINAL_RESULT: ['LANDING']
};
