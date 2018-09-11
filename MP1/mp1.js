/**
 * @file A simple WebGL example drawing an L shape
 * @author Ben Damisch <bdamisc2@illinois.edu>  
 */

/** @global The WebGL context */
var gl;
/** @global The HTML5 canvas we draw on */
var canvas;
/** @global A simple GLSL shader program */
var shaderProgram;
/** @global The WebGL buffer holding the blue I */
var BLueVertexPositionBuffer;
/** @global The WebGL buffer holding the blue colors */
var blueVertexColorBuffer;
/** @global The WebGL buffer holding the blue I */
var OrangeVertexPositionBuffer;
/** @global The WebGL buffer holding the blue colors */
var OrangeVertexColorBuffer;
/** @global trying to fix the undefined issue*/
var pMatrixUniform;
/**@global */
var lastTime = 0;
/**@global */
/**will be used  to perform the affine rotation*/
var ANGLE = 2;
/** global variable to contain the number of vertices */
var numverts = 66;
/* starts off at 0, will be incremented in the animate function*/
var defAngle = 0;

//converts deg -> rad
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */

function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
//set up variables to pass to the shaders
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "a_Position");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "u_MVMatrix");

}

/**
 * Populate buffers with data
 */
function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
          //1
          -0.9, 0.96, 0.0,
          -0.9, 0.64, 0.0,
           0.9 ,0.64, 0.0,
           //2
          -0.9, 0.96, 0.0,
           0.9, 0.96, 0.0,
           0.9 ,0.64, 0.0,
           //3
           0.32, 0.64, 0.0,
           0.32, -0.33, 0.0,
           0.71, -0.33, 0.0,
           //4
           0.32, 0.64, 0.0,
           0.71, 0.64, 0.0,
           0.71, -0.33, 0.0,
           //5
           -0.32, 0.64, 0.0,
           -0.32, -0.33, 0.0,
           -0.71, -0.33, 0.0,
           //6
           -0.32, 0.64, 0.0,
           -0.71, 0.64, 0.0,
           -0.71, -0.33, 0.0,
           //7
           0.17, 0.4, 0.0,
           0.17, -0.05, 0.0,
           0.32, -0.05, 0.0,
           //8
           0.17, 0.4, 0.0,
           0.32, 0.4, 0.0,
           0.32, -0.05, 0.0,
           //9
           -0.17, 0.4, 0.0,
           -0.17, -0.05, 0.0,
           -0.32, -0.05, 0.0,
           //10
           -0.17, 0.4, 0.0,
           -0.32, 0.4, 0.0,
           -0.32, -0.05, 0.0,
           //orange ones now
           //11
           0.06, -0.37, 0.0,
           0.06, -0.9, 0.0,
           0.18, -0.37, 0.0,
           //12
           0.06, -0.9, 0.0,
           0.18, -0.82, 0.0,
           0.18, -0.37, 0.0,
           //13
           -0.06, -0.37, 0.0,
           -0.06, -0.9, 0.0,
           -0.18, -0.37, 0.0,
           //14
           -0.06, -0.9, 0.0,
           -0.18, -0.82, 0.0,
           -0.18, -0.37, 0.0,
           //15
           0.32, -0.37, 0.0,
           0.44, -0.65, 0.0,
           0.32, -0.73, 0.0,
           //16
           0.32, -0.37, 0.0,
           0.44, -0.65, 0.0,
           0.44, -0.37, 0.0,
           //17
           -0.32, -0.37, 0.0,
           -0.44, -0.65, 0.0,
           -0.32, -0.73, 0.0,
           //18
           -0.32, -0.37, 0.0,
           -0.44, -0.65, 0.0,
           -0.44, -0.37, 0.0,
           //19
           0.58, -0.37, 0.0,
           0.58, -0.57, 0.0,
           0.71, -0.37, 0.0,
           //20
           0.58, -0.57, 0.0,
           0.71, -0.49, 0.0,
           0.71, -0.37, 0.0,
           //21
           -0.58, -0.37, 0.0,
           -0.58, -0.57, 0.0,
           -0.71, -0.37, 0.0,
           //22
           -0.58, -0.57, 0.0,
           -0.71, -0.49, 0.0,
           -0.71, -0.37, 0.0

  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 66;

  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = [
        //1
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //2
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //3
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //4
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //5
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,  
        //6
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //7
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //8
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //9
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //10
        0.07, 0.16, 0.29, 1.0, //blue
        0.07, 0.16, 0.29, 1.0,
        0.07, 0.16, 0.29, 1.0,
        //11
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //12
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //13
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //14
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //15
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //16
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //17
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //18
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //19
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //20
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //21
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0,
        //22
        0.91, 0.29, 0.15, 1.0, //orange
        0.91, 0.29, 0.15, 1.0,
        0.91, 0.29, 0.15, 1.0


    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 66;  
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
var mvMatrix = mat4.create();

function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "u_MVMatrix"); 

  mat4.rotate(mvMatrix, mvMatrix, degToRad(ANGLE),[0,1,0]); //rotate the pMatrix about the y axis every frame

  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix); //send to the shaders
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);

}


/**
 * Startup function called from html code to start program.
 */
 function startup() {
   
     //create the translation matrix
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

function tick() {
  requestAnimFrame(tick);
  draw();
  animate();
}

function animate() {
    defAngle= (defAngle+1.0) % 360; //increment defangle continuously

  //re-create the triangles buffer that will overwrite
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  var triangleVertices = [
          //1
          -0.9, 0.96, 0.0,
          -0.9, 0.64, 0.0,
           0.9 ,0.64, 0.0,
           //2
          -0.9, 0.96, 0.0,
           0.9, 0.96, 0.0,
           0.9 ,0.64, 0.0,
           //3
           0.32, 0.64, 0.0,
           0.32, -0.33, 0.0,
           0.71, -0.33, 0.0,
           //4
           0.32, 0.64, 0.0,
           0.71, 0.64, 0.0,
           0.71, -0.33, 0.0,
           //5
           -0.32, 0.64, 0.0,
           -0.32, -0.33, 0.0,
           -0.71, -0.33, 0.0,
           //6
           -0.32, 0.64, 0.0,
           -0.71, 0.64, 0.0,
           -0.71, -0.33, 0.0,
           //7
           0.17, 0.4, 0.0,
           0.17, -0.05, 0.0,
           0.32, -0.05, 0.0,
           //8
           0.17, 0.4, 0.0,
           0.32, 0.4, 0.0,
           0.32, -0.05, 0.0,
           //9
           -0.17, 0.4, 0.0,
           -0.17, -0.05, 0.0,
           -0.32, -0.05, 0.0,
           //10
           -0.17, 0.4, 0.0,
           -0.32, 0.4, 0.0,
           -0.32, -0.05, 0.0,
           //orange ones now
           //11
           0.06, -0.37, 0.0,
           0.06, -0.9, 0.0,
           0.18, -0.37, 0.0,
           //12
           0.06, -0.9, 0.0,
           0.18, -0.82, 0.0,
           0.18, -0.37, 0.0,
           //13
           -0.06, -0.37, 0.0,
           -0.06, -0.9, 0.0,
           -0.18, -0.37, 0.0,
           //14
           -0.06, -0.9, 0.0,
           -0.18, -0.82, 0.0,
           -0.18, -0.37, 0.0,
           //15
           0.32, -0.37, 0.0,
           0.44, -0.65, 0.0,
           0.32, -0.73, 0.0,
           //16
           0.32, -0.37, 0.0,
           0.44, -0.65, 0.0,
           0.44, -0.37, 0.0,
           //17
           -0.32, -0.37, 0.0,
           -0.44, -0.65, 0.0,
           -0.32, -0.73, 0.0,
           //18
           -0.32, -0.37, 0.0,
           -0.44, -0.65, 0.0,
           -0.44, -0.37, 0.0,
           //19
           0.58, -0.37, 0.0,
           0.58, -0.57, 0.0,
           0.71, -0.37, 0.0,
           //20
           0.58, -0.57, 0.0,
           0.71, -0.49, 0.0,
           0.71, -0.37, 0.0,
           //21
           -0.58, -0.37, 0.0,
           -0.58, -0.57, 0.0,
           -0.71, -0.37, 0.0,
           //22
           -0.58, -0.57, 0.0,
           -0.71, -0.49, 0.0,
           -0.71, -0.37, 0.0

  ];

  //for loop going through vertices in the buffer
  for (i=0;i < 30;i++){
      triangleVertices[i*3] -= Math.tan(degToRad(defAngle))/7;
      triangleVertices[i*3 + 1] += Math.cos(degToRad(defAngle))/2;
  }
  //for loop that iterates through the orange triangles and moves them in the opposite direction of blue
  for (i=30;i < 66;i++){
    triangleVertices[i*3] += Math.tan(degToRad(defAngle))/7;
    triangleVertices[i*3 + 1] += Math.cos(degToRad(defAngle))/2;
}

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW); //draws the modified buffer of triangles
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = numverts;
}