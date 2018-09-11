
/**
 * @file A simple WebGL example for viewing meshes read from OBJ files
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

var shaderProgramSkybox;

var shaderProgramRef;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global An object holding the geometry for a 3D mesh */
var myMesh;


// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.0,10.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
var lightPosition = [1.0,1.0,1.0];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0.0,0.0,0.0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1.0,1.0,1.0];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[1.0,1.0,1.0];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [300.0/255.0,120.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [1.0,1.0,1.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 50;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];

//Model parameters
var eulerY=0;

var cubeVertexBufferGL = [];

var yAngle = 0.0;
//vars from Lab9
var cubeImage0;
var cubeImage1;
var cubeImage2;
var cubeImage3;
var cubeImage4;
var cubeImage5;
var cubeImages = [cubeImage0, cubeImage1, cubeImage2, cubeImage3, cubeImage4, cubeImage5]
var cubeMap;

var texturesLoaded = 0;
var cubeVertexBuffer = [];

function setupPromise(filename, face) {
    myPromise = asyncGetFileSkybox(filename, face);
    // We define what to do when the promise is resolved with the then() call,
    // and what to do when the promise is rejected with the catch() call
    myPromise.then((status) => {
        handleTextureLoaded(cubeImages[face], face)
        console.log("Yay! got the file");
    })
    .catch(
        // Log the rejection reason
       (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}

//----------------------------------------------------------------------------------
/**
 * Creates textures for application to cube.
 */
function setupTextures() {
  cubeMap = gl.createTexture();
  setupPromise("pos-z.png", 0);
  setupPromise("neg-z.png", 1);
  setupPromise("pos-y.png", 2);
  setupPromise("neg-y.png", 3);
  setupPromise("pos-x.png", 4);
  setupPromise("neg-x.png", 5);
  console.log("textures setup");
}

function handleTextureLoaded(image, face) {
  console.log("handleTextureLoaded, image= " + image);
    texturesLoaded++;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    
  // CODE GOES HERE
  if(face == 0){
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }else if(face == 1){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }else if(face == 2){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }else if(face == 3){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }else if(face == 4){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }else if(face == 5){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }
    //clamping
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    //filtering
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    
}
//-------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetFile(url) {
  //Your code here
  console.log("Getting text file");
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET",url);
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
        console.log("Made promise");
    });
}

function asyncGetFileSkybox(url, face) {
  console.log("Getting image");
  return new Promise((resolve, reject) => {
    cubeImages[face] = new Image();
    cubeImages[face].onload = () => resolve({url, status: 'ok'});
    cubeImages[face].onerror = () => reject({url, status: 'error'});
    cubeImages[face].src = url
    console.log("Made promise");  
  });
}



function setupCubeBuffers() {
    cubeMaker();
    cubeVertexBufferGL = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferGL);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertexBuffer),gl.STATIC_DRAW);
    cubeVertexBufferGL.itemSize = 3;
    cubeVertexBufferGL.numItems = 36;
    console.log("bound cube buffer"); 
}

function cubeMaker(){
    var v1 = [-20,20,20];
    console.log("v1", v1);
    var v2 = [-20,20,-20];
    var v3 = [-20,-20,20];
    var v4 = [-20,-20,-20];
    var v5 = [20,20,20];
    var v6 = [20,20,-20];
    var v7 = [20,-20,20];
    var v8 = [20,-20,-20];
    
//        var v1 = [-10,10,10];
//    console.log("v1", v1);
//    var v2 = [-10,10,-10];
//    var v3 = [-10,-10,10];
//    var v4 = [-10,-10,-10];
//    var v5 = [10,10,10];
//    var v6 = [10,10,-10];
//    var v7 = [10,-10,10];
//    var v8 = [10,-10,-10];
    
    
    //face 1
    cubeVertexBuffer.push(v1[0]);
    cubeVertexBuffer.push(v1[1]);
    cubeVertexBuffer.push(v1[2]);
    
    cubeVertexBuffer.push(v2[0]);
    cubeVertexBuffer.push(v2[1]);
    cubeVertexBuffer.push(v2[2]);
    
    cubeVertexBuffer.push(v3[0]);
    cubeVertexBuffer.push(v3[1]);
    cubeVertexBuffer.push(v3[2]);
    //face 2
    cubeVertexBuffer.push(v2[0]);
    cubeVertexBuffer.push(v2[1]);
    cubeVertexBuffer.push(v2[2]);
    
    cubeVertexBuffer.push(v3[0]);
    cubeVertexBuffer.push(v3[1]);
    cubeVertexBuffer.push(v3[2]);
    
    cubeVertexBuffer.push(v4[0]);
    cubeVertexBuffer.push(v4[1]);
    cubeVertexBuffer.push(v4[2]);
    //face 3
    cubeVertexBuffer.push(v3[0]);
    cubeVertexBuffer.push(v3[1]);
    cubeVertexBuffer.push(v3[2]);
    
    cubeVertexBuffer.push(v4[0]);
    cubeVertexBuffer.push(v4[1]);
    cubeVertexBuffer.push(v4[2]);
    
    cubeVertexBuffer.push(v8[0]);
    cubeVertexBuffer.push(v8[1]);
    cubeVertexBuffer.push(v8[2]);
    //face 4
    cubeVertexBuffer.push(v3[0]);
    cubeVertexBuffer.push(v3[1]);
    cubeVertexBuffer.push(v3[2]);
    
    cubeVertexBuffer.push(v7[0]);
    cubeVertexBuffer.push(v7[1]);
    cubeVertexBuffer.push(v7[2]);
    
    cubeVertexBuffer.push(v8[0]);
    cubeVertexBuffer.push(v8[1]);
    cubeVertexBuffer.push(v8[2]);
    //face 5
    cubeVertexBuffer.push(v3[0]);
    cubeVertexBuffer.push(v3[1]);
    cubeVertexBuffer.push(v3[2]);
    
    cubeVertexBuffer.push(v7[0]);
    cubeVertexBuffer.push(v7[1]);
    cubeVertexBuffer.push(v7[2]);
    
    cubeVertexBuffer.push(v5[0]);
    cubeVertexBuffer.push(v5[1]);
    cubeVertexBuffer.push(v5[2]);
    //face 6
    cubeVertexBuffer.push(v3[0]);
    cubeVertexBuffer.push(v3[1]);
    cubeVertexBuffer.push(v3[2]);
    
    cubeVertexBuffer.push(v1[0]);
    cubeVertexBuffer.push(v1[1]);
    cubeVertexBuffer.push(v1[2]);
    
    cubeVertexBuffer.push(v5[0]);
    cubeVertexBuffer.push(v5[1]);
    cubeVertexBuffer.push(v5[2]);
    //face 7
    cubeVertexBuffer.push(v1[0]);
    cubeVertexBuffer.push(v1[1]);
    cubeVertexBuffer.push(v1[2]);
    
    cubeVertexBuffer.push(v5[0]);
    cubeVertexBuffer.push(v5[1]);
    cubeVertexBuffer.push(v5[2]);
    
    cubeVertexBuffer.push(v6[0]);
    cubeVertexBuffer.push(v6[1]);
    cubeVertexBuffer.push(v6[2]);
    //face 8
    cubeVertexBuffer.push(v1[0]);
    cubeVertexBuffer.push(v1[1]);
    cubeVertexBuffer.push(v1[2]);
    
    cubeVertexBuffer.push(v2[0]);
    cubeVertexBuffer.push(v2[1]);
    cubeVertexBuffer.push(v2[2]);
    
    cubeVertexBuffer.push(v6[0]);
    cubeVertexBuffer.push(v6[1]);
    cubeVertexBuffer.push(v6[2]);
    //face 9
    cubeVertexBuffer.push(v7[0]);
    cubeVertexBuffer.push(v7[1]);
    cubeVertexBuffer.push(v7[2]);
    
    cubeVertexBuffer.push(v5[0]);
    cubeVertexBuffer.push(v5[1]);
    cubeVertexBuffer.push(v5[2]);
    
    cubeVertexBuffer.push(v6[0]);
    cubeVertexBuffer.push(v6[1]);
    cubeVertexBuffer.push(v6[2]);
    //face 10
    cubeVertexBuffer.push(v7[0]);
    cubeVertexBuffer.push(v7[1]);
    cubeVertexBuffer.push(v7[2]);
    
    cubeVertexBuffer.push(v8[0]);
    cubeVertexBuffer.push(v8[1]);
    cubeVertexBuffer.push(v8[2]);
    
    cubeVertexBuffer.push(v6[0]);
    cubeVertexBuffer.push(v6[1]);
    cubeVertexBuffer.push(v6[2]);
    //face 11
    cubeVertexBuffer.push(v2[0]);
    cubeVertexBuffer.push(v2[1]);
    cubeVertexBuffer.push(v2[2]);
    
    cubeVertexBuffer.push(v8[0]);
    cubeVertexBuffer.push(v8[1]);
    cubeVertexBuffer.push(v8[2]);
    
    cubeVertexBuffer.push(v6[0]);
    cubeVertexBuffer.push(v6[1]);
    cubeVertexBuffer.push(v6[2]);
    //face 12
    cubeVertexBuffer.push(v2[0]);
    cubeVertexBuffer.push(v2[1]);
    cubeVertexBuffer.push(v2[2]);
    
    cubeVertexBuffer.push(v8[0]);
    cubeVertexBuffer.push(v8[1]);
    cubeVertexBuffer.push(v8[2]);
    
    cubeVertexBuffer.push(v4[0]);
    cubeVertexBuffer.push(v4[1]);
    cubeVertexBuffer.push(v4[2]);
    
    //console.log(cubeVertexBuffer);
}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShaderRef() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgramRef.nMatrixUniform, false, nMatrix);
}

function uploadNormalMatrixToShaderSkybox() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgramSkybox.nMatrixUniform, false, nMatrix);
}

function uploadModelViewMatrixToShaderSkybox() {
  gl.uniformMatrix4fv(shaderProgramSkybox.mvMatrixUniform, false, mvMatrix);
}

function uploadProjectionMatrixToShaderSkybox() {
  gl.uniformMatrix4fv(shaderProgramSkybox.pMatrixUniform, 
                      false, pMatrix);
}

function uploadProjectionMatrixToShaderRef() {
  gl.uniformMatrix4fv(shaderProgramRef.pMatrixUniform, 
                      false, pMatrix);
}

function uploadModelViewMatrixToShaderRef() {
  gl.uniformMatrix4fv(shaderProgramRef.mvMatrixUniform, false, mvMatrix);
}


//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}



//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

function setMatrixUniformsSkybox(){
    uploadModelViewMatrixToShaderSkybox();
    uploadNormalMatrixToShaderSkybox();
    uploadProjectionMatrixToShaderSkybox();
}

function setMatrixUniformsRef(){
    uploadModelViewMatrixToShaderRef();
     uploadNormalMatrixToShaderRef();
    uploadProjectionMatrixToShaderRef();
    
}



//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
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
  
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  
  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientMaterialColor");  
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseMaterialColor");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularMaterialColor");
    

}

function setupShadersSkybox(){
  vertexShaderSkybox = loadShaderFromDOM("shader-vs-skybox");
  fragmentShaderSkybox = loadShaderFromDOM("shader-fs-skybox");
  
  shaderProgramSkybox = gl.createProgram();
  gl.attachShader(shaderProgramSkybox, vertexShaderSkybox);
  gl.attachShader(shaderProgramSkybox, fragmentShaderSkybox);
  gl.linkProgram(shaderProgramSkybox);

  if (!gl.getProgramParameter(shaderProgramSkybox, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgramSkybox);

  shaderProgramSkybox.vertexPositionAttribute = gl.getAttribLocation(shaderProgramSkybox, "aVertexPositionSkybox");
  gl.enableVertexAttribArray(shaderProgramSkybox.vertexPositionAttribute);

  shaderProgramSkybox.mvMatrixUniform = gl.getUniformLocation(shaderProgramSkybox, "uMVMatrix");
  shaderProgramSkybox.pMatrixUniform = gl.getUniformLocation(shaderProgramSkybox, "uPMatrix");
  shaderProgramSkybox.nMatrixUniform = gl.getUniformLocation(shaderProgramSkybox, "uNMatrix");
    
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
  gl.uniform1i(gl.getUniformLocation(shaderProgramSkybox, "uCubeSampler"), 0);
}

function setupShadersRef(){
  vertexShaderRef = loadShaderFromDOM("shader-vs-ref");
  fragmentShaderRef = loadShaderFromDOM("shader-fs-ref");
  
  shaderProgramRef = gl.createProgram();
  gl.attachShader(shaderProgramRef, vertexShaderRef);
  gl.attachShader(shaderProgramRef, fragmentShaderRef);
  gl.linkProgram(shaderProgramRef);

  if (!gl.getProgramParameter(shaderProgramRef, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgramRef);
  
  shaderProgramRef.vertexPositionAttribute = gl.getAttribLocation(shaderProgramRef, "vPosition");
  gl.enableVertexAttribArray(shaderProgramRef.vertexPositionAttribute);
  
  shaderProgramRef.vertexNormalAttribute = gl.getAttribLocation(shaderProgramRef, "vNormal");
  gl.enableVertexAttribArray(shaderProgramRef.vertexNormalAttribute);
    
  shaderProgramRef.mvMatrixUniform = gl.getUniformLocation(shaderProgramRef, "uMVMatrix");
  shaderProgramRef.pMatrixUniform = gl.getUniformLocation(shaderProgramRef, "uPMatrix");
  shaderProgramRef.nMatrixUniform = gl.getUniformLocation(shaderProgramRef, "uNMatrix");
    
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
  gl.uniform1i(gl.getUniformLocation(shaderProgramRef, "texMap"), 0);
}
//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,d,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupMesh(filename) {
   //Your code here
    myMesh = new TriMesh();
    myPromise = asyncGetFile(filename);
    myPromise.then((retrievedText) => {
        myMesh.loadFromOBJ(retrievedText);
        console.log("Yay! got the file");
    })
    .catch(
        (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 500.0);

    // We want to look down -z, so create a lookat point in that direction    
//    vec3.add(viewPt, eyePt, viewDir);
//
//    // Then generate the lookat matrix and initialize the view matrix to that view
//    mat4.lookAt(vMatrix,eyePt,viewPt,up);
    
    vec3.rotateY(eyePt,eyePt,vec3.create(0,0,0),degToRad(eulerY));
    eulerY = 0;
    console.log('eyept',eyePt);
    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,vec3.create(0.0,0.0,0.0),up);

    //Draw Mesh
    //ADD an if statement to prevent early drawing of myMesh
    mvPushMatrix();
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY));
    //console.log('mvMatrix a',mvMatrix);
    mat4.multiply(mvMatrix,vMatrix,mvMatrix);
    setMatrixUniforms();

    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
        if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
        {
            setMaterialUniforms(shininess,kAmbient,
                                kTerrainDiffuse,kSpecular); 
            myMesh.drawTriangles();
        }

        if(document.getElementById("wirepoly").checked)
        {   
            setMaterialUniforms(shininess,kAmbient,
                                kEdgeBlack,kSpecular);
            myMesh.drawEdges();
        }   

        if(document.getElementById("wireframe").checked)
        {
            setMaterialUniforms(shininess,kAmbient,
                                kEdgeWhite,kSpecular);
            myMesh.drawEdges();
        }
    mvPopMatrix();
}


function drawCube(){
    mvPushMatrix();

    //shitposted from setupbuffers
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferGL);
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(reflectVBuffer), gl.STATIC_DRAW);
    gl.vertexAttribPointer(shaderProgramSkybox.vertexPositionAttribute, cubeVertexBufferGL.itemSize, gl.FLOAT, false,0,0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.uniform1i(gl.getUniformLocation(shaderProgramSkybox, "uCubeSampler"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, cubeVertexBufferGL.numItems);
    
    setMatrixUniformsSkybox();
    mvPopMatrix();
    
}


function drawRef(){
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 500.0);
    // We want to look down -z, so create a lookat point in that direction    
    //vec3.add(viewPt, eyePt, viewDir);
    
    //vec3.rotateY(eyePt,eyePt,vec3.create(0,0,0),0.01);
    vec3.rotateY(eyePt,eyePt,vec3.create(0,0,0),degToRad(eulerY));
    eulerY = 0;
    console.log('eyept',eyePt);
    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,vec3.create(0.0,0.0,0.0),up);

    mvPushMatrix();
    
    //mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY));
    mat4.multiply(mvMatrix,vMatrix,mvMatrix);
    setMatrixUniformsRef();
    
    gl.bindBuffer(gl.ARRAY_BUFFER,myMesh.VertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgramRef.vertexPositionAttribute, myMesh.VertexPositionBuffer.itemSize, gl.FLOAT, false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER,myMesh.VertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgramRef.vertexNormalAttribute, myMesh.VertexNormalBuffer.itemSize, gl.FLOAT, false,0,0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.uniform1i(gl.getUniformLocation(shaderProgramRef, "texMap"), 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, myMesh.IndexTriBuffer);
    gl.drawElements(gl.TRIANGLES, myMesh.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    
    mvPopMatrix();
    
}


//----------------------------------------------------------------------------------
//Code to handle user interaction
var currentlyPressedKeys = {};

function handleKeyDown(event) {
        //console.log("Key down ", event.key, " code ", event.code);
        currentlyPressedKeys[event.key] = true;
          if (currentlyPressedKeys["a"]) {
            // key A
            eulerY-= 1;
//            console.log('eyePt',eyePt);
//            console.log('viewDir',viewDir);
//            console.log('viewPt',viewPt);
        } else if (currentlyPressedKeys["d"]) {
            // key D
            eulerY+= 1;
//            console.log('eyePt',eyePt);
//            console.log('viewDir',viewDir);
//            console.log('viewPt',viewPt);
        } 
    
        if (currentlyPressedKeys["ArrowUp"]){
            // Up cursor key
            event.preventDefault();
            eyePt[2]+= 0.01;
        } else if (currentlyPressedKeys["ArrowDown"]){
            event.preventDefault();
            // Down cursor key
            eyePt[2]-= 0.01;
        }
    
        if(currentlyPressedKeys["ArrowLeft"]){
            event.preventDefault();
            yAngle -= 1;
        }
        else if(currentlyPressedKeys["ArrowRight"]){
            event.preventDefault();
            yAngle += 1;
        }
        
        console.log("eyept val",eyePt[2]);
        console.log("yAngle val",yAngle);
    
}

function handleKeyUp(event) {
        console.log("Key up ", event.key, " code ", event.code);
        currentlyPressedKeys[event.key] = false;
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);

  setupMesh("teapot_0.obj");
     
  setupShaders();
  setupShadersSkybox();
  setupShadersRef();
     
  setupCubeBuffers();
  setupTextures();     

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
     
     
  tick();
}

var reflectVBuffer = [];

//----------------------------------------------------------------------------------
/**
  * Update any model transformations
  */
function animate() {
   //console.log(eulerX, " ", eulerY, " ", eulerZ); 
   document.getElementById("eY").value=eulerY;
   document.getElementById("eZ").value=eyePt[2]; 
   document.getElementById("SkyY").value=yAngle;
}


//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    animate();
    
    if((myMesh.isLoaded) && (texturesLoaded == 6)){
        if(document.getElementById("mirror").checked)
        {
            gl.useProgram(shaderProgramRef);
            drawRef();
        }
        else if(document.getElementById("shade").checked)
        {
            gl.useProgram(shaderProgram);
            draw();
        }
        gl.useProgram(shaderProgramSkybox);
        drawCube();                 
    }
    //console.log('eyept',eyePt);
    //console.log('viewpt',viewPt);
}

