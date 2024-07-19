import * as d3 from "d3";
window.d3 = d3;

const PAGE_CONTENT_WIDTH = document.getElementById('content').offsetWidth;
const MAX_GRAPH_WIDTH = 900;
const MAX_GRAPH_HEIGHT = 400;
// Declare the chart dimensions and margins.
const DEFAULT_WIDTH = Math.min(PAGE_CONTENT_WIDTH, MAX_GRAPH_WIDTH);
const DEFAULT_HEIGHT = MAX_GRAPH_HEIGHT;
let canvas = null;
let svg = null;

let _drawBubble = function (ctx, x, y, radius, fill, stroke){
    ctx.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', fill)
        .attr('stroke', stroke)
}

let drawBubbles = function(bubbles, others_label = 'OTHERS') {
    let increment = svg.attr("width")/(bubbles.length+1);
    let x = 0;
    let y = svg.attr("height")/2;
    let fill_color = "none";
    let stroke_color = "black";

    let drawing = svg.append("g");
    drawing.append("text")
            .attr('x', (bubbles.length-1)*increment)
            .attr('y', y/3)
            .attr('text-anchor', 'middle')
            .attr('font-size', '1.5em')
            .text(others_label);
    let count = 0;
    while(count<bubbles.length) {
        x += increment
        if(count===0) {
            _drawBubble(drawing, x, y, bubbles[count].radius, 'grey', stroke_color);
        } else {
            _drawBubble(drawing, x, y, bubbles[count].radius, fill_color, stroke_color);
        }
        drawing.append("text")
            .attr('x', x)
            .attr('y', y)
            .attr('text-anchor', 'middle')
            .attr('font-size', '1.5em')
            .text(bubbles[count].label);
        count+=1;
    }
}
let setup = function(divID, width=null, height=null) {
    // Create the SVG container.
    svg = d3.select(`#${divID}`)
        .append("svg")
        .attr("width", width ? width : DEFAULT_WIDTH)
        .attr("height", height ? height : DEFAULT_HEIGHT);

    let border = svg.append("g");
    border.append("rect")
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('stroke', 'black')
}

export {setup, drawBubbles}