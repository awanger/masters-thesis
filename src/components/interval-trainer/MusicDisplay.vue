<template>
  <div class="music-render">
    <label for="measure-1">
      <input v-on:keyup="handleKeyUp" v-on:keydown="preventDefaultArrowKeyBehavior" type="text" placeholder="Type in a note name" id="measure-1">
    </label>
    <label for="measure-2">
      <input v-on:keyup="handleKeyUp" type="text" placeholder="Type in a note name" id="measure-2">
    </label>
    <label for="measure-3">
      <input v-on:keyup="handleKeyUp" type="text" placeholder="Type in a note name" id="measure-3">
    </label>
    <label for="measure-4">
      <input v-on:keyup="handleKeyUp" type="text" placeholder="Type in a note name" id="measure-4">
    </label>
    <div id="boo"></div>
  </div>
</template>


<script>
import { getters, mutations, actions } from '@/store/store.js';
import Vex from 'vexflow';
const VF = Vex.Flow;

export default {
  name: "",
  components: {},
  computed: {
    getCurrentState() {
      return getters.state;
    },
  },
  data() {
    return {
      measure1: [],
      measure2: [],
      measure3: [],
      measure4: []
    }
  },
  mounted() {   
    this.drawCanvas([this.measure1, this.measure2, this.measure3, this.measure4]); // so unrefined
  },
  methods: {
    ...mutations,
    ...actions,
    send(event, nativeEvent) {
      const eventObj = {
        type: event,
        selectedButton: nativeEvent
      }
      getters.quizService.send(eventObj);
    },
    handleKeyUp(e) {
      this.parse(e);
      this.preventDefaultArrowKeyBehavior(e);
    },
    tokenize(str) {
      return str.split(" ");
    },
    isValidExpression(token) {
      const validexp = /^([a-gA-G][#-]?|r)[1-9]?([(_)|(__)]*|[\\]*|[.])$/
      return validexp.test(token);
    },
    parseDot(token) {
      const dotRegExp = /[.]/g;
      if(dotRegExp.test(token)) {
        return true;
      } else {
        return false;
      }
    },
    parseNoteDuration(token) {
      const flagRegExp = /(\\)+/g; // if the user input contains one or more occurrences of a backslash
      const dashesRegExp = /(_)|(__)/g  ; // if the user input contains exactly one or exactly two dashes
      
      if(flagRegExp.test(token)) {
        let numFlags = token.split('\\').length-1;
        if(numFlags === 1) {
          return '8';
        } else if (numFlags === 2) {
          return '16';
        } else if (numFlags === 3) {
          return '32';
        }
      } else if(dashesRegExp.test(token)) {
        let numDashes = token.split('_').length-1;
        if(numDashes == 1) {
          return 'h'; // half note
        } else if(numDashes == 2) {
          return 'w'; // whole note
        }
      } else {
        return 'q'; // quarter note should be the default value
      }
    },
    parseOctaveNumber(token) {
      const octaveRegExp = /[0-9]/;
      let octaveNumber = 4; // default octave number 4
      if(octaveRegExp.test(token)) {
        octaveNumber = token.match(octaveRegExp);
      }
      return octaveNumber;
    },
    parseAccidentals(token) {
      const accidentalRegExp = /[#-]/;
      if(/-/.test(token)) {
        return 'b';
      } else {
        return token.match(accidentalRegExp);
      }
    },
    createNoteOrRest(token) {
      let noteOrRestName = token[0];
      let octave = this.parseOctaveNumber(token);
      let accidental = this.parseAccidentals(token);
      let duration = this.parseNoteDuration(token);
      let hasDot = this.parseDot(token); // the dot has to be parsed separately from note duration because of VexFlow's addDot() method

      let note;
      if(noteOrRestName == 'r') {
        note = new VF.StaveNote({clef: "treble", keys: ['b/4'], duration: `${duration}r` });
      } else {
        note = new VF.StaveNote({clef: "treble", keys: [`${noteOrRestName}/${octave}`], duration: `${duration}` });
      }
      // modifiers
      if(accidental) {
        note.addAccidental(0, new VF.Accidental(`${accidental}`));
      }
      if(hasDot) {
        note.addDot(0);
      }
      return note;
    },
    preventDefaultArrowKeyBehavior(event) {
      let key = event.key;
      if(key == 'ArrowUp' || key == 'ArrowDown') {
        event.preventDefault();
      }
    },
    createRanges(tokenizedResults) {
      let ranges = []
      let index = 0;
      for (let token of tokenizedResults) {
        let range = [];
        range.push(index);
        index += token.length;
        range.push(index);
        ranges.push(range);
        index++;
      }
      return ranges;
    },
    isBetween(cursorPosition, range) {
      let lowerBound = range[0];
      let upperBound = range[1];
      return cursorPosition >= lowerBound && cursorPosition <= upperBound;
    },
    cursorPositionToTokenIndex(cursorPosition, ranges) {
      for (let index=0; index < ranges.length; index++) {
        let range = ranges[index];
        if(this.isBetween(cursorPosition, range)) {
          return index; // tokenizedResults[index]
        }
      }
    },
    parse(event) {
      let inputBoxID = event.target.id;
      let userInput = event.target.value;
      let tokenizedResults = this.tokenize(userInput);
      let noteArray = [];
      
      if(this.userInput != '') {
        for(var i=0; i<tokenizedResults.length;i++) {
          let token = tokenizedResults[i];
          if(this.isValidExpression(token)) {
            let noteOrRest = this.createNoteOrRest(token);
            noteArray.push(noteOrRest);
          }
        }
      }

      if(event.key == 'ArrowUp' || event.key == 'ArrowDown') {
        let ranges = this.createRanges(tokenizedResults);
        let cursorPosition = event.target.selectionStart;
        let tokenIndex = this.cursorPositionToTokenIndex(cursorPosition, ranges);
        let selectedToken = tokenizedResults[tokenIndex];
        let octaveNumber= this.parseOctaveNumber(selectedToken);
        if(event.key == 'ArrowUp') {
          octaveNumber++;
        }
        if(event.key == 'ArrowDown') {
          octaveNumber--;
        }

        let newToken = selectedToken.replace(/[0-9]/, '') + `${octaveNumber}`; // replace the old octave number with the new one
        let newNoteOrRest = this.createNoteOrRest(newToken);
        tokenizedResults[tokenIndex] = newToken;
        let newTextInput = tokenizedResults.join(' ');
        console.log(newTextInput);

        noteArray[tokenIndex] = newNoteOrRest;
        event.target.value = newTextInput;
      }


      // refactor this later
      if(inputBoxID === 'measure-1') {
        this.measure1 = noteArray;
      } else if(inputBoxID === 'measure-2') {
        this.measure2 = noteArray;
      } else if(inputBoxID === 'measure-3') {
        this.measure3 = noteArray;
      } else if(inputBoxID === 'measure-4') {
        this.measure4 = noteArray;
      }
      this.redraw([this.measure1, this.measure2, this.measure3, this.measure4]);
    },
    deleteCanvas() {
      var oldBoo = document.getElementById("boo");
      var newBoo = document.createElement("div");
      var musicRenderer = document.querySelector('.music-render');

      newBoo.id = "boo";
      oldBoo.remove();

      musicRenderer.prepend(newBoo);
    },
    redraw(noteArrays) {
      this.deleteCanvas();
      this.drawCanvas(noteArrays);
      // console.log("the extracted note is: " + secondNote);
    },
    drawMeasure(context, noteArray, x, y, width) {
      let staveMeasure = new VF.Stave(x, y, width);
      let notesMeasure = [];

      for(var i=0; i < noteArray.length; i++) {
        let note = noteArray[i];
        notesMeasure.push(note);
      }

      if(x===0) {
        staveMeasure.addClef("treble").addTimeSignature("4/4").setContext(context).draw();
      } else {
        staveMeasure.setContext(context).draw(); // just draw empty measures
      }
      if (notesMeasure.length != 0){
        VF.Formatter.FormatAndDraw(context, staveMeasure, notesMeasure);
      }
    },
    drawCanvas(noteArrays) {
      var renderer = new VF.Renderer(document.getElementById("boo"), VF.Renderer.Backends.SVG);
      renderer.resize(1000, 100);
      let context = renderer.getContext();
      var width = 220;

      for(var i=0; i < noteArrays.length; i++) {
        var x = width*i;
        var y = 0;
        this.drawMeasure(context, noteArrays[i], x, y, width);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .music-render {
    display: grid;
    grid-template-columns: 220px 220px 200px; // 250px
    grid-template-rows: repeat(2, 1fr);
  }

  #boo {
    grid-row: 1/2;
    // grid-column: 1/3;
  }

  label {
    // position: relative;
    // grid-column: 2/3;
    grid-row: 2/3;

  }

  label:before {
    // content: "";
    // position: absolute;
    // left: 1px;
    // top: 0;
    // bottom: 0;
    // width: 20px;
    // background: url('https://upload.wikimedia.org/wikipedia/commons/6/6f/Ic_chevron_right_48px.svg') center / contain no-repeat;
  }

  input {
    border: 3px solid #D6E1E5; // I wonder if there's a way to gain access to the variable
    border-radius: 3px;
    width: 220px;
    padding: 2% 8%;
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    &:focus {
      outline: none !important;
      border: 3px solid #02BAF2;
      // box-shadow: 0 0 10px #02BAF2;
    }
  }
  
</style>