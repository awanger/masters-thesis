import { Machine, assign } from 'xstate';
import questions from '@/store/questions';

// conditional guards
// const isCorrect = ({ age }) => age >= 18;
// const isWrong = ({ age }) => age < 18;  
const quizCompleted = (context) => context.currentQuestionIndex === context.totalNumQuestions;
const fromActionButton = (_, event) => {
  // console.log(event.selectedButton.target.classList);
  return event.selectedButton.target.classList.contains('btn-action');
}
const isCorrect = (context) => {
  return context.selectedAnswer === context.currentQuestion.correctAnswer;
}
  
// create Interval Trainer machine
const quizMachine = Machine({
  id: 'quiz',
  context: {
    currentQuestionIndex: 0,
    totalNumQuestions: questions.length,
    currentQuestion: null,
    selectedAnswer: null
  },
  initial: 'displayQuestion',
  states: {
    newQuestion: {
      entry: ['nextQuestion', 'resetSelectedAnswer'],
      on: { '': [
            { target: 'complete', cond: quizCompleted},
            { target: 'displayQuestion' }
        ] }
    },
    displayQuestion: {
      entry: ['loadQuestion', 'resetSelectedAnswer'],
      on: { CLICK: { target: 'checked',
                     actions: assign({ selectedAnswer: (context, event) => context.selectedAnswer = event.selectedButton.target.dataset.interval }), // assign selectedAnswer to the interval name
            }
      }
    },
    checked: {
      on: {
        CLICK: [
          { target: 'evaluate', 
            cond: fromActionButton // if the click event is from the action button, then evaluate the answer
          }, 
          { target: 'checked',
            actions: assign({ selectedAnswer: (context, event) => context.selectedAnswer = event.selectedButton.target.dataset.interval })
          }

        ]
      }
    },
    evaluate: {
      on: {
        '': [
          { target: 'correct', cond: isCorrect },
          { target: 'incorrect' }
        ]
      }
    },
    correct: {
      on: { CLICK: { target:'newQuestion', cond: fromActionButton } }
    },
    incorrect: {
      on: { CLICK: { target:'displayQuestion', cond: fromActionButton } }
    },
    complete: {
      entry: ['resetSelectedAnswer'],
      type: 'final'
    }
  }
},
{
  actions: {
    loadQuestion: assign({ currentQuestion: context => questions[context.currentQuestionIndex] }),
    nextQuestion: assign( { currentQuestionIndex: context => context.currentQuestionIndex + 1 }),
    resetSelectedAnswer: assign( { selectedAnswer: context => context.selectedAnswer = null })
  }
});

export default quizMachine