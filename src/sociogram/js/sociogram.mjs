/*
 * Sociogram
 * Draw you and your people as bubbles in a white canvas
 *
 * Based on: https://editor.p5js.org/nigini/sketches/Ha2oC44Pa
 */
import p5 from 'p5';
window.p5 = p5;

let DIV_NAME = null;

export default (div_name) => {
  DIV_NAME = div_name;
  new p5(sociogram);
}

// TODO: Could not easily import the library from NPM because it depends on a 'p5' unexistent variable!
// Meanwhile, we copy and pasted the two functions we need from this library
// import 'p5.collide2d';

//NEAT SOLUTION: https://github.com/processing/p5.js/wiki/p5.js-overview#instantiation--namespace
const sociogram = (p5) => {
  //TODO: Bad approach... need to find a way to pass it as an argument!
  // const DIV_NAME = 'sociogram-drawing';
  const CANVAS_ELEM = document.getElementById(DIV_NAME);
  const CANVAS_INITIAL_POSITION = {
    x: CANVAS_ELEM.getBoundingClientRect().x,
    y: CANVAS_ELEM.getBoundingClientRect().y
  }
  const CANVAS_SIZE = CANVAS_ELEM.clientWidth;
  const CANVAS_COLOR = p5.color('white');
  const DEFAULT_COLOR = p5.color('darkgray');
  const SELECT_COLOR = p5.color('red');
  const BUBBLE_MAX_SIZE = 150;
  const MOUSE_SENSITIVITY = CANVAS_SIZE/100;
  let bubbles = [];
  let delButton = new DeleteButton();

  p5.setup = () => {
    let canvas = p5.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    canvas.mousePressed(mousePressed);
    canvas.parent(DIV_NAME);
  }

  p5.draw = () => {
    p5.background(CANVAS_COLOR);
    let current_selection = null;
    for(let i=0; i<bubbles.length; i++) {
      let bub = bubbles[i];
      if(bub.isMouseOver()){
        delButton.setPosition(bub.getX()+bub.getRadius()-20, bub.getY());
        current_selection = i;
      }
      bubbles[i].draw();
    }
    delButton.setTarget(current_selection);
    delButton.draw();
  }

  let mousePressed = () => {
    if(delButton.isMouseOver()) {
      delButton.click();
    } else {
      if(!isOverBubble()) {
        bubbles.push(new Bubble(p5.mouseX, p5.mouseY));
      }
    }
  }

  let isOverBubble = () => {
    for(let i=0; i<bubbles.length; i++) {
      if(bubbles[i].isMouseOver()){
        return true;
      }
    }
    return false;
  }

  let adjustXForCanvasPosition= (x) => {
    return x + CANVAS_INITIAL_POSITION.x;
  }

  let adjustYForCanvasPosition= (y) => {
    return y + CANVAS_INITIAL_POSITION.y;
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


  class DeleteButton {
    constructor () {
      this.x = 0;
      this.y = 0;
      this.icon = p5.loadImage('./img/trash3.svg');
      this.target = null;
      this.size = BUBBLE_MAX_SIZE/10;
    }

    setPosition(x, y) {
      this.x = x;
      this.y = y;
    }

    draw() {
      if(this.target != null) {
        p5.image(this.icon, this.x, this.y, this.size, this.size);
      }
    }

    setTarget(bubble_position) {
      this.target = bubble_position;
    }

    click() {
      if(this.target != null) {
        bubbles[this.target].deactivate();
        bubbles.splice(this.target, 1);
      }
      this.target = null;
    }

    isMouseOver(){
      return p5.collidePointRect(p5.mouseX, p5.mouseY, this.x, this.y, this.size, this.size);
    }
  }


  class Bubble {
    constructor(centerX, centerY) {
      this.x = centerX;
      this.y = centerY;
      this.w = BUBBLE_MAX_SIZE/2;
      this.MAX_W = BUBBLE_MAX_SIZE;
      this.MIN_W = BUBBLE_MAX_SIZE/3;
      this.INC = 5;
      this.name = p5.createInput();
      this.name.position(
          adjustXForCanvasPosition(this.x-(this.name.width/2)),
          adjustYForCanvasPosition(this.y+(this.w/2))
      );
    }

    draw(){
      if(this.isMouseOverBubble() || this.isMouseOverLable()){
        p5.stroke(SELECT_COLOR);
        p5.fill(SELECT_COLOR);

        if(this.isMouseOverBubble() && !this.isMouseOverLable() && p5.mouseIsPressed){
          let diff = p5.mouseY-this.y;
          if(Math.abs(diff)>MOUSE_SENSITIVITY) {
            if(diff<0 && this.w<this.MAX_W) {
              this.w+=this.INC;
            }
            if(diff>0 && this.w>this.MIN_W) {
              this.w-=this.INC;
            }
          }
        }
      } else {
          p5.stroke(DEFAULT_COLOR);
          p5.fill(DEFAULT_COLOR);
      }
      p5.ellipse(this.x, this.y, this.w);
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


    isMouseOverBubble(){
      return p5.collidePointCircle(p5.mouseX, p5.mouseY, this.x, this.y, this.w);
    }

    isMouseOverLable(){
      return p5.collidePointRect(p5.mouseX, p5.mouseY, this.name.x, this.name.y, this.name.width, this.name.height);
    }

    isMouseOver() {
      return this.isMouseOverBubble() || this.isMouseOverLable();
    }

    deactivate() {
      this.x = -1000;
      this.y = -1000;
      this.name.remove();
    }

  }
}
