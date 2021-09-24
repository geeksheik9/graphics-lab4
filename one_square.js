
// some globals
var gl;

var delay = 100;
var direction = true;
var stripBuffer
var colorStrip
var program;
var stripVertices = [];
var colorsStrip = [];
var numSquares = 0;
var offset1, offset2, offset3 = 0;
var colorOff1, colorOff2, colorOff3 = 0;
var colorOffset=0;
var colorBuffer;

var enabledDrawing = false;
var isMouseDown = false;
var worldCords = 100
var startColors = 1;

var width = 0.0;
var height = 0.0;


var max_prims = 6000, num_triangles = 0;

window.onload = function init() {

	var show = "Yes"
	if(!enabledDrawing){
		show = "No"
	}
	document.getElementById('points').innerHTML = show

	// get the canvas handle from the document's DOM
    var canvas = document.getElementById( "gl-canvas" );
	height = canvas.height
	width = canvas.width
	// initialize webgl
    gl = WebGLUtils.setupWebGL(canvas);

	// check for errors
    if ( !gl ) { 
		alert("WebGL isn't available"); 
	}

    // set up a viewing surface to display your image
    gl.viewport(0, 0, canvas.width, canvas.height);

	// clear the display with a background color 
	// specified as R,G,B triplet in 0-1.0 range
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //  Load shaders -- all work done in init_shaders.js
    program = initShaders(gl, "vertex-shader", "fragment-shader");

	// make this the current shader program
    gl.useProgram(program);

	// Get a handle to theta  - this is a uniform variable defined 
	// by the user in the vertex shader, the second parameter should match
	// exactly the name of the shader variable
    thetaLoc = gl.getUniformLocation(program, "theta");

	colorLoc = gl.getUniformLocation(program, "vertColor");

	stripBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, stripBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, (32*3000), gl.STATIC_DRAW)

	colorStrip = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorStrip)
	gl.bufferData(gl.ARRAY_BUFFER, (64*3000), gl.STATIC_DRAW)

	createTriangleStrip();

    render();
};

function calculateVertices(input, flag){
	if(flag === false){
		return input / 100
	} else {
		return input / -100
	}
}

function createTriangleStrip() {
	colorsStrip = [];
	
	stripVertices.push([calculateVertices(worldCords, true),0])
	stripVertices.push([0,calculateVertices(worldCords, false)])
	stripVertices.push([0,calculateVertices(worldCords, true)])
	stripVertices.push([calculateVertices(worldCords, false),0])

	gl.bindBuffer(gl.ARRAY_BUFFER, stripBuffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, offset2, flatten(stripVertices));
	offset2 += 32
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	colorsStrip.push([1,0,0,1]);
	colorsStrip.push([0,1,0,1]);
	colorsStrip.push([0,0,1,1]);
	colorsStrip.push([1,0,1,1]);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, colorStrip)
	gl.bufferSubData(gl.ARRAY_BUFFER, colorOff2, flatten(colorsStrip))
	colorOff2 += 64;
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0 , 0);
	gl.enableVertexAttribArray(vColor)
}

counter = 0;
function render() {
	// this is render loop

	// clear the display with the background color
    gl.clear( gl.COLOR_BUFFER_BIT );

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	for(let i = 1; i < stripVertices.length; i++){
		gl.drawArrays(gl.POINTS, 5, i*5+4)
	}
	
    setTimeout(
        function (){requestAnimFrame(render);}, delay
    );
}

function enableDrawing() {
	enabledDrawing = !enabledDrawing
	var show = "Yes"
	if(!enabledDrawing){
		show = "No"
	}
	document.getElementById('points').innerHTML = show
}

function mouseDown(event){
	isMouseDown = true
	if(enabledDrawing){
		drawPoints(event)
	}
}

function mouseUp(){
	isMouseDown = false
}

function drawPoints(event){
	x=2*event.clientX/width-1
	y=2*(height-event.clientY)/height-1
	stripVertices.push([x,y])
	gl.bindBuffer(gl.ARRAY_BUFFER, stripBuffer)
	gl.bufferSubData(gl.ARRAY_BUFFER, offset2, flatten(stripVertices))
	offset2 += 32
	colorsStrip.push([0,0,0,1])
	gl.bindBuffer(gl.ARRAY_BUFFER, colorStrip)
	gl.bufferSubData(gl.ARRAY_BUFFER, colorOff2, flatten(colorsStrip))
	colorOff2 +=64
}

function updateResults(event){
	x = event.clientX
	y = event.clientY
	vertex = mapToWorld(x, y)
	x2 = calculateVertices(vertex[0], false)
	y2 = calculateVertices(vertex[1], false)
	message = "Device Coordinates: [ " + x + ", " + y +" ]\nNDC Coordinates: [ " +  x2 + ", " + y2 + " ]\nWorld Coordinates: [ " + vertex[0] + ", " + vertex[1] + "]"
	document.getElementById('text-area').value = message
	if(isMouseDown && enabledDrawing){
		drawPoints(event)
	}
}

function mapToWorld(x, y){
	vertex = [x,y]
	var x2, y2

	if(vertex[0]=== 256) {
		x2 = 0
	}
	if(vertex[1] === 256) {
		y2 = 0
	}

	if(vertex[0] > 256 && vertex[1] < 256) {
		// Q1
		x2 = vertex[0] / 5.12
		y2 = 100 - (vertex[1] / 5.12)
	}

	if(vertex[0] < 256 && vertex[1] < 256) {
		// Q2
		x2 = -100 + (vertex[0] / 5.12)
		y2 = 100 - (vertex[1] / 5.12)
	}

	if(vertex[0] < 256 && vertex[1] > 256) {
		x2 = -100 + (vertex[0] / 5.12)
		y2 = (vertex[1] / -5.12)
	}

	if(vertex[0] > 256 && vertex[1] > 256) {
		// Q4
		x2 = vertex[0] / 5.12
		y2 = (vertex[1] / -5.12)
	}
	
	vertex2 = [x2, y2]
	return vertex2
}





