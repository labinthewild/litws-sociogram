/*
 * Sociogram
 * Draw you and your people as bubbles in a white canvas
 *
 * Based on: https://editor.p5js.org/nigini/sketches/Ha2oC44Pa
 */
import p5 from 'p5';
window.p5 = p5;

let DIV_NAME = null;
let bubbles = [];
let to_remove=[];

//TODO: [BUG] if you delete a temp bubble the dropdown keeps been active. 

let sociogram = (div_name) => {
  DIV_NAME = div_name;
  new p5(sociogram_canvas);
}

let sociogram_clean_up = () => {
  for(let elem of to_remove) {
    elem.remove();
  }
}

let sociogram_data = () => {
  let result = {
    canvas_size: {
      width: document.getElementById(DIV_NAME).clientWidth,
      height: document.getElementById(DIV_NAME).clientHeight,
    },
    people: []
  }
  for (let bubble of bubbles) {
    result.people.push(bubble.export())
  }
  return result;
}

// TODO: Could not easily import the library from NPM because it depends on a 'p5' unexistent variable!
// Meanwhile, we copy and pasted the two functions we need from this library
// import 'p5.collide2d';

//NEAT SOLUTION: https://github.com/processing/p5.js/wiki/p5.js-overview#instantiation--namespace
const sociogram_canvas = (p5) => {
  const CANVAS_ELEM = document.getElementById(DIV_NAME);
  const CANVAS_INITIAL_POSITION = {
    x: CANVAS_ELEM.getBoundingClientRect().x,
    y: CANVAS_ELEM.getBoundingClientRect().y
  }
  const CANVAS_SIZE = CANVAS_ELEM.clientWidth;
  const CANVAS_COLOR = p5.color('white');
  const DEFAULT_COLOR = p5.color('black');
  const SELECT_COLOR = p5.color('red');
  const BUBBLE_MAX_SIZE = CANVAS_SIZE/4;
  const BUBBLE_MIN_SIZE = CANVAS_SIZE/20;
  let delButton = null;
  let bubbleType = null;
  let tempBubble = null;

  p5.setup = () => {
    let canvas = p5.createCanvas(CANVAS_SIZE, window.innerHeight);
    canvas.elt.width = CANVAS_SIZE;
    canvas.elt.height = window.innerHeight;
    canvas.elt.style = "";
    canvas.mousePressed(mousePressed);
    canvas.mouseMoved(mouseMoved);
    canvas.mouseReleased(mouseReleased);
    canvas.touchStarted(mousePressed);
    canvas.touchMoved(mouseMoved);
    canvas.touchEnded(mouseReleased);
    canvas.parent(DIV_NAME);
    delButton = new DeleteButton();
    bubbleType = new BubbleType(10, 10, onLabelSelection, CANVAS_ELEM);
  }

  p5.draw = () => {
    p5.background(CANVAS_COLOR);
    if(tempBubble){
      tempBubble.draw();
    }
    for(let i=0; i<bubbles.length; i++) {
      let bub = bubbles[i];
      bub.draw();
      if(bub.selected){
        delButton.draw(i);
      }
    }
  }

  let onLabelSelection = () => {
    if(tempBubble) {
      tempBubble.finalize(bubbleType.getSelected());
      bubbles.push(tempBubble);
      tempBubble = null;
      bubbleType.reset();
    }    
  }

  let mouseReleased = () => {
    if(tempBubble) {
      tempBubble.setDrawingAsFinished();
      bubbleType.enable();
    } else {
      bubbleType.reset();
    }
  }

  let getPointerXY = (pointerEvent) => {
    let pointerPosition = {x: 0, y: 0};
    if(pointerEvent.touches) {
      pointerEvent.preventDefault();
      let touch = pointerEvent.touches[0];
      pointerPosition.x = touch.pageX - touch.target.offsetLeft;
      pointerPosition.y = touch.pageY - touch.target.offsetTop;
    } else if( pointerEvent.offsetX ) {
      pointerPosition.x = pointerEvent.offsetX;
      pointerPosition.y = pointerEvent.offsetY;
    } else {
      pointerPosition.x = p5.mouseX;
      pointerPosition.y = p5.mouseY;
    }
    return pointerPosition;
  }

  let mousePressed = (event) => {
    let pointer = getPointerXY(event);
    if(delButton.isPointerOver(pointer.x, pointer.y)) {
      delButton.click();
    } else {
      let selectedBubbleBeforeClick = getSelectedBubble();
      if(!tempBubble) {
        let isBubbleSelected = updateBubbleSelection(pointer.x, pointer.y);
        if( selectedBubbleBeforeClick == null && !isBubbleSelected) {
          tempBubble = new Bubble(pointer.x, pointer.y);
        }
      } else {
        tempBubble = null;
      }
    }
  }

  let mouseMoved = () => {
    if (tempBubble && !tempBubble.isDrawingFinished()) {
      let dist = Math.sqrt(
          Math.pow(tempBubble.getX()-p5.mouseX, 2)+
          Math.pow(tempBubble.getY()-p5.mouseY, 2)
      )
      tempBubble.setRadius(dist);
    }
  }

  let getSelectedBubble = () => {
    for(let i=0; i<bubbles.length; i++) {
      if (bubbles[i].selected) return bubbles[i];
    }
    return null;
  }

  let updateBubbleSelection = (pointerX, pointerY) => {
    let selected = false;
    for(let i=0; i<bubbles.length; i++) {
      if(bubbles[i].isPointerOver(pointerX, pointerY)){
        bubbles[i].select();
        selected = true;
      } else {
        bubbles[i].unselect();
      }
    }
    if(selected) delButton.clear();
    return selected;
  }

  // SOURCE: https://github.com/bmoren/p5.collide2D
  p5.collidePointCircle = function (x, y, cx, cy, d) {
    if (this.dist(x, y, cx, cy) <= d / 2) {
      return true;
    }
    return false;
  };

  // SOURCE: https://github.com/bmoren/p5.collide2D
  p5.collidePointRect = function (pointX, pointY, x, y, xW, yW) {
    if (pointX >= x &&         // right of the left edge AND
        pointX <= x + xW &&    // left of the right edge AND
        pointY >= y &&         // below the top AND
        pointY <= y + yW) {    // above the bottom
      return true;
    }
    return false;
  };


  class BubbleType {
    constructor (x, y, onChangeCallbackFn, canvasElement=null) {
      this.x = x + CANVAS_INITIAL_POSITION.x;
      this.y = y + CANVAS_INITIAL_POSITION.y;
      this.DRAW_MSG_OPTION = 'CLICK+DRAG TO DRAW!';
      this.CHOOSE_OPTION = 'CHOOSE PERSON TYPE';
      this.SELF_OPTION = 'self';

      this.dropdown = p5.createSelect();
      this.dropdown.option(this.DRAW_MSG_OPTION);
      this.dropdown.option(this.CHOOSE_OPTION);
      this.dropdown.option(this.SELF_OPTION);
      this.dropdown.option('acquaintance');
      this.dropdown.option('family');
      this.dropdown.option('friend');
      this.dropdown.changed(onChangeCallbackFn);
      this.reset();
      //patchy solution to avoid loading the whole P5.JS DOM library.
      let select_elem = this.dropdown.elt;
      to_remove.push(select_elem);
      //ignore [x,y] and move element right before canvas
      if (canvasElement) {
        select_elem.style['position']='';
        select_elem.style['max-width']='300px';
        canvasElement.before(select_elem);
      } else {
        this.dropdown.position(this.x, this.y);
      }
    }

    enable(){
      this.dropdown.enable();
      if (this.isSelfPresent(bubbles)) {
        this.dropdown.disable(this.SELF_OPTION);
      }
      this.dropdown.disable(this.CHOOSE_OPTION);
      this.dropdown.disable(this.DRAW_MSG_OPTION);
      this.dropdown.selected(this.CHOOSE_OPTION);
      this.dropdown.elt.focus({focusVisible: true});
    }

    isSelfPresent(bubbles) {
      for (let i=0; i<bubbles.length; i++) {
        if(bubbles[i].name === this.SELF_OPTION)
          return true;
      }
      return false;
    }

    getSelected() {
      return this.dropdown.value();
    }

    reset() {
      this.dropdown.disable();
      this.dropdown.selected(this.DRAW_MSG_OPTION);
    }

  }

  class DeleteButton {
    constructor () {
      this.x = -100;
      this.y = -100;
      this.icon = p5.loadImage('./img/trash3.svg');
      this.target = null;
      this.size = BUBBLE_MIN_SIZE/2;
    }

    draw(bubble_pos) {
      if(bubble_pos < bubbles.length || bubble_pos >= 0) {
        let bub = bubbles[bubble_pos];
        this.target = bubble_pos;
        this.x = bub.getX()-this.size/2;
        this.y = bub.getY()+bub.getRadius()-20;
        p5.push();
        p5.imageMode(p5.CORNER);
        p5.image(this.icon, this.x, this.y, this.size, this.size);
        p5.pop();
      }
    }

    clear() {
      this.target = null;
      this.x = -100;
      this.y = -100;
    }

    click() {
      if(this.target != null) {
        bubbles[this.target].deactivate();
        bubbles.splice(this.target, 1);
      }
      this.target = null;
    }

    isPointerOver(pointerX, pointerY){
      return p5.collidePointRect(pointerX, pointerY, this.x, this.y, this.size, this.size);
    }
  }

  class Bubble {
    constructor(centerX, centerY) {
      this.x = centerX;
      this.y = centerY;
      this.w = BUBBLE_MIN_SIZE;
      this.temporary = true;
      this.selected = false;
      this.name = null;
      this.finishedDrawing = false;
    }

    draw(){
      p5.push();
      p5.fill('none');
      if(this.temporary || this.selected){
        p5.stroke(SELECT_COLOR);
        p5.strokeWeight(1);
      } else {
        p5.stroke(DEFAULT_COLOR);
        p5.strokeWeight(2);
      }
      p5.ellipse(this.x, this.y, this.w);
      p5.pop();
      if(this.name) {
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(14);
        p5.textStyle(p5.NORMAL);
        p5.text(this.name, this.x, this.y);
      }
    }

    finalize(bubbleLabel) {
      this.temporary = false;
      this.name = bubbleLabel;
    }

    getX() {
      return this.x;
    }

    getY() {
      return this.y;
    }

    getRadius() {
      return this.w/2;
    }

    setRadius(tentativeLength) {
      let length = tentativeLength*2;
      if(length>=BUBBLE_MIN_SIZE && length<=BUBBLE_MAX_SIZE) {
        this.w = length;
      }
    }

    isDrawingFinished() {
      return this.finishedDrawing;
    }

    setDrawingAsFinished() {
      this.finishedDrawing = true;
    }

    isPointerOver(pointerX, pointerY) {
      return p5.collidePointCircle(pointerX, pointerY, this.x, this.y, this.w);
    }

    select() {
      this.selected = true;
    }

    unselect() {
      this.selected = false;
    }

    deactivate() {
      this.x = -1000;
      this.y = -1000;
      this.name = null;
    }

    export() {
      return {
        x: this.x,
        y: this.y,
        radius: this.w/2,
        label: this.name
      }
    }
  }
}

export {sociogram, sociogram_data, sociogram_clean_up};
