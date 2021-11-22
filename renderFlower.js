var canvas;
var gl;

// shader with lighting
var u_lightPosition;
var u_ambientProduct;
var u_diffuseProduct;
var u_specularProduct;
var u_shininess;

// attributes
var modelView;
var projMatrix;


// viewer properties
var viewer = {
    eye: vec3(0.0, 0.0, 5.0),
    at:  vec3(0.0, 0.0, 0.0),
    up:  vec3(0.0, 1.0, 0.0),
};

var perspProj = {
    fov: 60,
    aspect: 1,
    near: 0.001,
    far:  10
}

// modelview and projection matrices
var mvMatrix;
var u_mvMatrix;


var u_projMatrix;

// Magic Variables that do stuff
// Time is the big thing here. It makes sure that
// the loop keeps on keeping on
var shininess = 30;
var time = 0.625; // Time affects how fast the shape changes between forms
var deltaT = 0.01; // Affects movement
var sz = 0.5;
var pos = [0, 0];
var speed_r = 88;
var speedX = -0.006;
var speedY = 0.006;
var max_x = 2.1
var max_y = 1.7

// Light properties
class Light {
    constructor(position, ambient, diffuse, specular) {
        this.position = position;
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
    }
}

var light = new Light(
    vec4(0.0, 0.0, 0.0, 1.0), // position
    vec4(0.2, 0.2, 0.2, 1.0), // ambient
    vec4(0.9, 0.9, 0.9, 1.0), // diffuse
    vec4(0.5, 0.5, 0.5, 1.0) // specular
);

// Materials
/*class Material {
    constructor(ambient, diffuse, specular) {
        this.ambient = ambient;
        //this.diffuse = diffuse;
        this.specular = specular;
    }
}*/
class Material {
    constructor(ambient, specular) {
        this.ambient = ambient;
        this.specular = specular;
    }
}
var materials = {
    cyan: new Material(
        vec4(0.0, 1.0, 1.0, 1.0),
        //vec4(0.0, 1.0, 1.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0)
    ),
    magenta: new Material(
        vec4(1.0, 0.0, 1.0, 1.0),
        //vec4(1.0, 0.0, 1.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0)
    ),
    yellow: new Material(
        vec4(1.0, 1.0, 0.0, 1.0),
        //vec4(1.0, 1.0, 0.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0)
    ),
    red: new Material(
        vec4(1.0, 0.0, 0.0, 1.0),
        //vec4(1.0, 0.0, 0.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0)
    ),
    green: new Material(
        vec4(0.0, 1.0, 0.0, 1.0),
        //vec4(0.0, 1.0, 0.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0)
    ),
    blue: new Material(
        vec4(0.0, 0.0, 1.0, 1.0),
        //vec4(0.0, 0.0, 1.0, 1.0),
        vec4(1.0, 1.0, 1.0, 1.0)
    )
};

var faces =
    {
    front: { orientation: [0, 0], material: 'cyan'},
    left: { orientation: [0, 90], material: 'magenta'},
    back: { orientation: [0, 180],  material: 'yellow'},
    right: { orientation: [0, 270], material: 'blue'},
    top: { orientation: [90, 0], material: 'red'},
    bottom: { orientation: [270, 0], material: 'green'}
}

// The variable that holds the object
var shape;
var aspect_ratio;

var program;
var vBuffer;
var vPosition;
var nBuffer;
var vNormal;
var iBuffer;

// Graphics Initialization
window.onload = function init()
{
    // Set up canvas
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL( canvas );
    const ext = gl.getExtension('OES_element_index_uint');
    if (!gl) { alert("WebGL isn't available"); }


    aspect_ratio = canvas.width / canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    // Create the geometry and load into GPU structures
    // The instance of the function we use.
    generateGeometry(square, time);
    generate_indices(square);
    shape = square;

    program = initShaders(gl, "vertex-shader1", "fragment-shader");
    gl.useProgram(program);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

    // Array element buffer
    iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    // Vertex buffer
    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Normal buffer
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vNormal);

    // uniform locations
    u_mvMatrix = gl.getUniformLocation(program, "u_mvMatrix");
    u_projMatrix = gl.getUniformLocation(program, "u_projMatrix");
    u_lightPosition = gl.getUniformLocation(program, "u_lightPosition");
    u_ambientProduct = gl.getUniformLocation(program, "u_ambientProduct");
    u_diffuseProduct = gl.getUniformLocation(program, "u_diffuseProduct");
    u_specularProduct = gl.getUniformLocation(program, "u_specularProduct");
    u_shininess = gl.getUniformLocation(program, "u_shininess");

    document.getElementById("gl-canvas").onmousedown = function ()
    {
        if (subdiv === 13)
        {
            subdiv = 50;
        }
        else
        {
            subdiv = 13;
        }
        // Done to instantiate the object seen on screen
        // Using the Surface from the shapeMagic function
        shape = new Surface(-1, 1, -1, 1, subdiv, subdiv);
        generate_indices(shape);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
    }

    render();
}
let i=0, j=0.0, k=0.75;
let flag = true;

var render = function()
{
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Time and position calculations
    // time affects how fast the shape changes
    time += deltaT
    pos[0] += speedX
    pos[1] += speedY

    if (Math.abs(pos[0]) > max_x) {
        speedX = -speedX;
    }
    if (Math.abs(pos[1]) > max_y) {
        speedY = -speedY;
    }

    generateGeometry(shape, time);
    // Use of normal buffers from before

    // Vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vNormal);

    // Projection Matrix
    projectionMatrix = perspective(perspProj.fov, perspProj.aspect, perspProj.near, perspProj.far);
    gl.uniformMatrix4fv(u_projMatrix, false, flatten(projectionMatrix));

    // mvMatrix building
    var mvFoundation = lookAt(viewer.eye, viewer.at, viewer.up);
    // the foundation is simply the camera. In webGl, the camera is the only
    // thing moving. Therefore to get the proper movement, I needed
    // to simulate the object moving in this patter.
    // Luckily, with the craze of the old dvd logo, it was easy to find
    // a set of vectors to properly simulate an object bouncing around
    // a square
    mvFoundation = mult(mvFoundation, scalem(sz/aspect_ratio, sz, sz));
    mvFoundation = mult(mvFoundation, rotateY(speed_r*time));
    mvFoundation = mult(mvFoundation, rotateZ(speed_r*time));
    for (face in faces)
    {
        // Orientate Faces based on the orientation collection used
        // in earlier lines
        // It's important that we do this on every frame so that we
        // can achieve the smooth transitions that we get each time

        // Like previous versions, these mult methods return the
        // cross prodcut of the two matrices/vectors provided
        //This lead to smooth use of math
        mvMatrix = mult(mvFoundation, rotateX(faces[face].orientation[0]));
        mvMatrix = mult(mvMatrix, rotateY(faces[face].orientation[1]));
        mvMatrix = mult(translate(pos[0], pos[1], 0), mvMatrix);

        gl.uniformMatrix4fv(u_mvMatrix, false, flatten(mvMatrix));

        // The same light structure we've used before, although this time, it goes
        // through each face in the cube to change the material specifically
        // to the oves set out before
        ambientProduct = mult(light.ambient, materials[faces[face].material].ambient);
        //diffuseProduct = mult(light.diffuse, (materials[faces[face].material].diffuse));
        diffuseProduct = mult(light.diffuse, vec4(k,j, i, 1.0));

        // color changes are based on frame rate
        // That is why our values are so incredibly small
        if(flag){
            i = i + 0.0001;
            j = j + 0.00001;
            k = k +0.000001;
        }
        else{
            i = i - 0.0001;
            j = j - 0.00001;
            k = k - 0.000001;
        }


        specularProduct = mult(light.specular, materials[faces[face].material].specular);

        // uniform vectors from other projects
        gl.uniform4fv(u_lightPosition, flatten(light.position));
        gl.uniform4fv(u_ambientProduct, flatten(ambientProduct));
        gl.uniform4fv(u_diffuseProduct, flatten(diffuseProduct));
        gl.uniform4fv(u_specularProduct, flatten(specularProduct));
        gl.uniform1f(u_shininess, shininess);

        gl.drawElements(gl.TRIANGLES, shape.numIndices, gl.UNSIGNED_INT, 0);
    }
    if (i>=0.99 || i<0){
        flag = !flag;
    }
    if(j>=1.0){
        j=0;

    }
    if(k>=1.0){
        k=0;
    }
    requestAnimFrame(render);
}
