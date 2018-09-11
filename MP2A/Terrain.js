/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        this.MULT = 0.5;
        this.scale = 1.0;

        console.log("constructor minx",this.minX);
        console.log("constructor miny",this.minY);
        console.log("constructor maxx",this.maxX);
        console.log("constructor maxy",this.maxY);
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");

        //generate heights for all of the triangles
        this.generateHeights();
        console.log("Terrain: Generated Heights");

        this.DSInitial(this.scale);
        console.log("Diamond Square ended");

        this.updateNormals();
        console.log("update normals");

        this.BP();
        console.log("BP ended");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        var vid = 3*(i*(this.div+1)+j);
        this.vBuffer[vid] = v[0];
        this.vBuffer[vid] = v[1];
        this.vBuffer[vid] = v[2];
    }
    
    //how many total vertices are there in terms of div -> (div+1)^2
    //how many total triangles are there in terms of div -> 2*(div)^2
    //what are the indices of the faces

    // (vertex id) = 3*(i*(div+1)+j)
    //index = vid, vid+1, vid+2 yields x, y, z
    //for drawELements type, UNSIGNED SHORT will not work
    //use OES element index extension so you can use UNSIGNED INTs
    //to get normal of vertex, compute normals of the surrounding 6 faces and average them, then you have vertex normal

    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        var vid = 3*(i*(this.div+1) + j);
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid+1];
        v[2] = this.vBuffer[vid+2];

    }
    //seed values for the 4 corners
    generateHeights(scale){ 
        var i = 0;
        var j = 0;
        this.vBuffer[3*(i*(this.div+1) + j) + 2] = Math.random()*this.MULT*scale;
        j = this.div;
        this.vBuffer[3*(i*(this.div+1) + j) + 2] = Math.random()*this.MULT*scale;
        i = this.div;
        this.vBuffer[3*(i*(this.div+1) + j) + 2] = Math.random()*this.MULT*scale;
        j = 0;
        this.vBuffer[3*(i*(this.div+1) + j) + 2] = Math.random()*this.MULT*scale;
    }

    //initial outer loop that controls the iterations based on how large our grid is (2^k + 1)
   DSInitial(scale){   
    var radius = this.div;
    while(radius >= 1){
        this.diamondSquare(radius,scale);
        radius /= 2;
        scale /= 2.0;
        console.log("mainloop");
    }

    }
    
    //perform diamond square
    diamondSquare(step,scale){
        var halfStep = step/2;
        for(var j=0; j < this.div+1; j += step){
            for(var i=0; i < this.div+1; i += step){
                this.diamondStep(i+halfStep,j,step,scale);
                this.diamondStep(i,j+halfStep,step,scale);
                this.diamondStep(i-halfStep,j,step,scale); //might not need these
                this.diamondStep(i,j-halfStep,step,scale);
                console.log("diamonds");
            }
        }
        for(var j= halfStep; j < (this.div+1+ halfStep); j += step){
            for(var i= halfStep; i < (this.div+1 + halfStep); i += step){
                this.squareStep(i,j,step,scale);
                console.log("squares");
            }
        }

    }
    //square step function
    squareStep(i,j,step,scale){
        var a,b,c,d;
        var halfStep = step/2;
        //get square corners based on the i and j
        a = this.sample(i-halfStep,j-halfStep);
        b = this.sample(i+halfStep,j-halfStep);
        c = this.sample(i-halfStep,j+halfStep);
        d = this.sample(i+halfStep,j+halfStep);
        //error checking
        var sum = 0.0;
        var count = 0;
        if(a == -1){
        sum+= 0;
        count+=0;
        }
        else{
        sum += a; 
        count++;}
        if(b == -1){
        sum+=0;
        count+=0;
        }
        else{
        sum += b;
        count++; 
        }
        if(c == -1){
        sum+= 0;
        count+=0;}
        else{
        sum += c;
        count++; 
        }
        if(d == -1){
        sum+=0;
        count+=0;
        }
        else{
        sum += d;
        count++;
        }

        if(count == 0){
            count = 1;
        }

        this.setSample(i,j,(sum/count) + Math.random()*this.MULT*scale) ;

    }
    //this tests for edge cases to make sure the index actually exists
    sample(i,j){
        var val = this.vBuffer[3*((i*(this.div+1)) + j)+2];
        if(isNaN(val)){
            return -1;}
        else {return val; }
    }
    //sets the value, no error checking needed
    setSample(i,j,avg){
        this.vBuffer[3*((i*(this.div+1)) + j)+2] = avg;
    }
    //diamond step function
    diamondStep(i,j,step,scale){
        var a,b,c,d; 
        var halfStep = step/2;
        //get diamond corners w/ offsets
        a = this.sample(i-halfStep,j);
        b = this.sample(i+halfStep,j);
        c = this.sample(i,j-halfStep);
        d = this.sample(i,j+halfStep);
        //error checking
        var sum = 0.0;
        var count = 0;
        if(a == -1){
        sum+= 0;
        count+=0;
        }
        else{
        sum += a; 
        count++;}
        if(b == -1){
        sum+=0;
        count+=0;
        }
        else{
        sum += b;
        count++; 
        }
        if(c == -1){
        sum+= 0;
        count+=0;}
        else{
        sum += c;
        count++; 
        }
        if(d == -1){
        sum+=0;
        count+=0;
        }
        else{
        sum += d;
        count++;
        }

        if(count == 0){
            count = 1;
        }

        this.setSample(i,j,(sum/count) + Math.random()*this.MULT*scale) ;
    }

    updateNormals(){}
    BP(){}

    /**
 * Fill the vertex and buffer arrays 
 */    
generateTriangles()
{
    var deltaX = (this.maxX-this.minX)/this.div;
    var deltaY = (this.maxY-this.minY)/this.div;
    //create verts
    for(var i=0;i<=this.div; i++){
        for(var j=0;j<=this.div;j++){
            this.vBuffer.push(this.minX+deltaX*j);
            this.vBuffer.push(this.minY+deltaY*i);
            this.vBuffer.push(0);

            this.nBuffer.push(0);
            this.nBuffer.push(0);
            this.nBuffer.push(1);
        }
    }
    //create faces
    for(var i=0;i<this.div; i++){
        for(var j=0;j<this.div;j++){
            var vid = i*(this.div+1) + j;
            this.fBuffer.push(vid);
            this.fBuffer.push(vid+1);
            this.fBuffer.push(vid+this.div+1);

            this.fBuffer.push(vid+1);
            this.fBuffer.push(vid+1+this.div+1);
            this.fBuffer.push(vid+this.div+1);

        }
    }
    //
    this.numVertices = this.vBuffer.length/3;
    this.numFaces = this.fBuffer.length/3;
}
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }


/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);
        
        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);
        
        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }
    
}
    
}
