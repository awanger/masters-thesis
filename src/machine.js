import { Machine, assign } from 'xstate';
import questions from '@/store/questions';
// console.log(questions);


const quizMachine = Machine({
  id: 'quiz',
  context: {
    currentQuestionIndex: 0,
    totalNumQuestions: questions.length,
    currentQuestion: null,
    userInput: ''
  },
  initial: 'displayQuestion',
  states: {
    newQuestion: {
      entry: ['resetSelectedAnswer'],
      on: { '': [
            { target: 'complete', cond: 'quizCompleted'},
            { target: 'displayQuestion' }
        ] }
    },
    displayQuestion: {
      entry: ['loadQuestion', 'resetSelectedAnswer'],
      on: { KEYDOWN: [
              {
                target: 'modal',
                cond: 'fromSettingsButton'
              },
              { 
                target: 'checked', actions: assign({ userInput: (context, event) => context.userInput = event.selectedButton.key }),
              },
            ]
      }
    },
    checked: { 
      on: {
        CLICK: [
          { 
            target: 'evaluate', 
            cond: 'fromActionButton' // if the click event is from the action button, then evaluate the answer
          },
          {
            target: 'modal',
            cond: 'fromSettingsButton'
          },
          { 
            target: 'checked',
            actions: assign({ selectedAnswer: (context, event) => context.selectedAnswer = event.selectedButton.target.dataset.interval })
          }
        ]
      }
    },
    modal: {
      on: {
        CLICK: [
          {
            target: 'checked',
            cond: 'fromCloseButton'
          },
          {
            target: 'displayQuestion',
            cond: 'fromCloseButton'
          }
        ]
      }
    },
    evaluate: {
      on: {
        '': [
          { target: 'correct', cond: 'isCorrect' },
          { target: 'incorrect' }
        ]
      }
    },
    correct: {
      entry: ['incrementQuestionIndex'],
      on: { CLICK: { target:'newQuestion', cond: 'fromActionButton' } }
    },
    incorrect: {
      on: { CLICK: { target:'displayQuestion', cond: 'fromActionButton' } }
    },
    complete: {
      entry: ['resetSelectedAnswer'],
      exit: 'resetQuestionIndex',
      on: { CLICK: { target:'displayQuestion', cond: 'fromRestartButton' } }
    }
  }
},
{
  actions: {
    loadQuestion: assign({ currentQuestion: context => questions[context.currentQuestionIndex] }),
    incrementQuestionIndex: assign( { currentQuestionIndex: context => context.currentQuestionIndex + 1 }),
    resetSelectedAnswer: assign( { selectedAnswer: context => context.selectedAnswer = null }),
    resetQuestionIndex: assign( { currentQuestionIndex: context => context.currentQuestionIndex = 0 })
  },
  guards: {
    isCorrect: (context) => {
      return context.selectedAnswer === context.currentQuestion.correctAnswer;
    },
    fromActionButton: (_, event) => {
      // console.log(event.selectedButton.target.classList);
      return event.selectedButton.target.classList.contains('btn-container') || 
             event.selectedButton.target.classList.contains('btn-action');
    },
    fromSettingsButton: (_, event) => {
      // console.log('this message should be coming from settings button');
      // console.log(event.selectedButton.target.id);
      return event.selectedButton.target.id==='settings';
    },
    fromCloseButton: (_, event) => {
      console.log(event.selectedButton.target.id);
      return event.selectedButton.target.id==='close';
    },
    quizCompleted: (context) => { return context.currentQuestionIndex === context.totalNumQuestions; },
    fromRestartButton: (_, event) => {
      console.log(event.selectedButton.target.id);
      return event.selectedButton.target.id==='restart';
    },
    previousStateIsDisplayQuestion: (ctx, e, { state }) =>  { 
      return state.history.matches('displayQuestion');
    },
    previousStateIsChecked: (ctx, e, { state }) =>  { 
      return state.history.matches('checked');
    }
  }
});

export default quizMachine