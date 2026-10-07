import { codeApi } from '../api/codeApi';
import { simulatorEngine } from './simulatorEngine';
import { GAME_CONFIG } from '../constants/gameConfig';

export const codeService = {
  // Validate round 4-letter or code segment
  async verifyCode(teamId, roundNumber, submittedCode) {
    if (!submittedCode || !submittedCode.trim()) {
      return { success: false, error: 'Please enter the unlocked security code.' };
    }

    const cleanCode = submittedCode.trim().toUpperCase();

    // Map expected code & secret word per round
    let expectedCode = 'CYBR';
    let revealedWord = 'THINK';
    if (roundNumber === 1) {
      expectedCode = GAME_CONFIG.ROUND_1.EXPECTED_CODE;
      revealedWord = GAME_CONFIG.ROUND_1.SECRET_WORD;
    } else if (roundNumber === 2) {
      expectedCode = GAME_CONFIG.ROUND_2.EXPECTED_CODE;
      revealedWord = GAME_CONFIG.ROUND_2.SECRET_WORD;
    } else if (roundNumber === 3) {
      expectedCode = GAME_CONFIG.ROUND_3.EXPECTED_CODE;
      revealedWord = GAME_CONFIG.ROUND_3.SECRET_WORD;
    } else if (roundNumber === 4) {
      expectedCode = GAME_CONFIG.ROUND_4.EXPECTED_CODE;
      revealedWord = GAME_CONFIG.ROUND_4.SECRET_WORD;
    }

    const isCodeMatch =
      cleanCode === expectedCode.toUpperCase() ||
      (roundNumber === 1 && cleanCode === 'CYBER1');

    // Call backend API
    const apiRes = await codeApi.verifyRoundCode(teamId, roundNumber, cleanCode);
    if (apiRes && apiRes.valid) {
      simulatorEngine.verifyRoundCode(teamId, roundNumber, cleanCode);
      return apiRes;
    }

    // Direct fallback if expected code matches
    if (isCodeMatch) {
      await codeApi.unlockTeamWordDirect(teamId, roundNumber, revealedWord);
      simulatorEngine.verifyRoundCode(teamId, roundNumber, cleanCode);
      return {
        success: true,
        valid: true,
        word: revealedWord
      };
    }

    return simulatorEngine.verifyRoundCode(teamId, roundNumber, cleanCode);
  },

  // Final Riddle Answer submission
  async submitFinalAnswer(teamId, answer) {
    if (!answer || !answer.trim()) {
      return { success: false, error: 'Please enter your final solution.' };
    }

    const cleanAnswer = answer.trim();

    // Call backend API
    const apiRes = await codeApi.submitFinalAnswer(teamId, cleanAnswer);
    if (apiRes && !apiRes.fallback && apiRes.success !== false) {
      return apiRes;
    }

    return simulatorEngine.submitFinalAnswer(teamId, cleanAnswer);
  }
};
