import { questionApi } from '../api/questionApi';
import { simulatorEngine } from './simulatorEngine';
import {
  DEMO_ROUND_1_QUESTIONS,
  DEMO_ROUND_2_CROSSWORDS,
  DEMO_ROUND_3_QUESTIONS,
  DEMO_ROUND_4_QUESTIONS
} from '../constants/demoData';

export const questionService = {
  // Retrieve sanitized questions without sensitive answers
  async getQuestionsForRound(roundNumber) {
    const apiQuestions = await questionApi.getQuestionsForRound(roundNumber);
    if (apiQuestions && apiQuestions.length > 0) {
      return apiQuestions;
    }

    // Fallback to sanitized demo data
    let questions = [];
    if (roundNumber === 1) questions = DEMO_ROUND_1_QUESTIONS;
    else if (roundNumber === 2) questions = DEMO_ROUND_2_CROSSWORDS;
    else if (roundNumber === 3) questions = DEMO_ROUND_3_QUESTIONS;
    else if (roundNumber === 4) questions = DEMO_ROUND_4_QUESTIONS;

    // Sanitize demo data so answers are not exposed in returned objects
    return questions.map((q) => {
      // For crosswords, keep words structure but hide answer
      if (q.question_type === 'crossword') {
        return {
          round_number: q.round_number,
          question_number: q.question_number,
          question_type: q.question_type,
          difficulty: q.difficulty,
          time_limit_seconds: q.time_limit_seconds,
          question_data: {
            title: q.question_data.title,
            gridSize: q.question_data.gridSize,
            words: q.question_data.words.map((w) => ({
              id: w.id,
              number: w.number,
              direction: w.direction,
              clue: w.clue,
              row: w.row,
              col: w.col,
              length: w.answer.length
            }))
          }
        };
      }

      return {
        round_number: q.round_number,
        question_number: q.question_number,
        question_type: q.question_type,
        difficulty: q.difficulty,
        time_limit_seconds: q.time_limit_seconds,
        question_data: q.question_data
      };
    });
  },

  // Secure answer submission (Never reveals correct answer on failure)
  async submitAnswer(teamId, roundNumber, questionNumber, submittedAnswer, timeTaken = 0) {
    const apiRes = await questionApi.submitAnswer(
      teamId,
      roundNumber,
      questionNumber,
      submittedAnswer,
      timeTaken
    );

    if (apiRes && !apiRes.fallback && apiRes.success !== false) {
      return apiRes;
    }

    return simulatorEngine.submitQuestionAnswer(
      teamId,
      roundNumber,
      questionNumber,
      submittedAnswer,
      timeTaken
    );
  },

  // Request a hint with automatic logging
  async requestHint(teamId, roundNumber, questionNumber) {
    const apiRes = await questionApi.requestHint(teamId, roundNumber, questionNumber);
    if (apiRes && !apiRes.fallback && apiRes.success !== false) {
      return apiRes;
    }

    return simulatorEngine.requestHint(teamId, roundNumber, questionNumber);
  },

  // Complete a crossword in Round 2
  async submitCrossword(teamId, crosswordIndex, timeTaken = 0) {
    const apiRes = await questionApi.submitCrossword(teamId, crosswordIndex, timeTaken);
    if (apiRes && !apiRes.fallback && apiRes.success !== false) {
      return apiRes;
    }

    return simulatorEngine.submitCrosswordCompletion(teamId, crosswordIndex, timeTaken);
  }
};
