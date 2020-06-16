class Note {
  constructor(pitch, startTime, endTime) {
    this.pitch = pitch;
    this.startTime = startTime;
    this.endTime = endTime;
  }
  getPitch() {
    return this.pitch;
  }
}

class Interval {
  constructor(firstNote, secondNote) {
    this.firstNote = firstNote;
    this.secondNote = secondNote;
  }

  getFirstNote() {
    return this.firstNote;
  }

  getSecondNote() {
    return this.secondNote;
  }
}

class Question {
  constructor(notes, correctAnswer) {
    this.notes = notes; // I presume an array of notes
    this.correctAnswer = correctAnswer;
    this.totalTime = 4;
  }

  // helper function
  static getRandomInteger(_min, _max) {
    var min = Math.floor(_min);
    var max = Math.floor(_max);
    return Math.floor(Math.random()*(max - min) + min)
  }

  static generateRandomInterval(min_pitch, max_pitch) {
    const OCTAVE_RANGE = 12;
    const referencePitch = this.getRandomInteger(min_pitch, max_pitch)

    var firstNote = new Note(referencePitch, 0.0, 2.0);
    var secondNote = new Note(this.getRandomInteger(referencePitch-OCTAVE_RANGE, referencePitch+OCTAVE_RANGE),
                              2.0, 4.0); // might get a unison and don't forget about tritone

    var interval = new Interval(firstNote, secondNote);
    return interval
  }

  static calcCorrectAnswer(interval) {
    var pitch_dict = {
      0:"Unison",
      1:"m2",
      2:"M2",
      3:"m3",
      4:"M3",
      5:"P4",
      6:"Tritone",
      7:"P5",
      8:"m6",
      9:"M6",
      10:"m7",
      11:"M7",
      12:"P8" 
    }
    
    var firstPitch = interval.getFirstNote().getPitch();
    var secondPitch = interval.getSecondNote().getPitch();
    var difference = Math.abs(firstPitch-secondPitch);
    return pitch_dict[difference];
  }
}

let questions = []
const LOWEST_PITCH = 40;
const HIGHEST_PITCH = 76;
for(var i=0; i<10; i++) {
  let randomInterval = Question.generateRandomInterval(LOWEST_PITCH, HIGHEST_PITCH);
  let correctAnswer = Question.calcCorrectAnswer(randomInterval);
  const question = new Question([randomInterval.getFirstNote(), randomInterval.getSecondNote()], correctAnswer, 4); // keep it like this for now
  questions.push(question);
}

// console.log(questions);
export default questions;