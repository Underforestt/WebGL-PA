'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let line;
let lineDirection;
let lightModel;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iVertexNormalBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.BufferData2 = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.DrawLine = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertexNormal);

        let lim_u = 14.5 * Math.PI * 100;
        let lim_v = 1.5 * Math.PI * 100;
        let delta_u = 20;
        let delta_v = 20;
        let u_count = Math.round(lim_u / delta_u);
        let v_count = Math.round(lim_v / delta_v);

        // draw u lines
        // for (let u = 0; u <= u_count; u++) {
        //     gl.drawArrays(gl.LINE_STRIP, u * v_count, v_count);
        // }

        // draw v lines
        let offset = u_count * v_count;
        for (let v = 0; v <= v_count; v++) {
            let start = (v * u_count) + offset;
            let end = u_count;
            gl.drawArrays(gl.TRIANGLES, 0, this.count);
        }


    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-7, 7, -7, 7, -7, 7);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0, 0, 1], Math.PI);
    let translateToPointZero = m4.translation(0, 0, 0);
    let rotate = m4.xRotation(Math.PI)

    let matAccum0 = m4.multiply(rotate, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
    // let matAccum1 = m4.multiply(translateToPointZero, modelView);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);
    let modelNormal = m4.identity();
    m4.inverse(modelView, modelNormal);
    m4.transpose(modelNormal, modelNormal);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelNormalMatrix, false, modelNormal);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    let x = document.getElementById('x').value
    let y = document.getElementById('y').value
    let z = document.getElementById('z').value
    gl.uniform3fv(shProgram.iLightDir, m4.normalize([x, y, z]));
    // let xpos = document.getElementById('xpos').value
    // let ypos = document.getElementById('ypos').value
    // let zpos = document.getElementById('zpos').value

    let l = document.getElementById('l').value
    let s = document.getElementById('s').value
    gl.uniform1f(shProgram.iLimit, l);
    gl.uniform1f(shProgram.iSmoothing, s);

    surface.Draw();

    gl.uniform1i(shProgram.iLine, true);
    line.BufferData([0, 0, -5, 2 * Math.sin(Date.now() * 0.001), 0, -5])
    gl.uniform3fv(shProgram.iLightPos, [2 * Math.sin(Date.now() * 0.001), 0, -5]);
    gl.lineWidth(5);
    lineDirection.BufferData([2 * Math.sin(Date.now() * 0.001), 0, -5, 2 * Math.sin(Date.now() * 0.001)+parseFloat(x), 0-parseFloat(y), -5+parseFloat(z)])
    lineDirection.DrawLine()
    // line.DrawLine()

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(
        modelViewProjection,
        m4.translation(2 * Math.sin(Date.now() * 0.001), 0, -5)));
    lightModel.Draw();
    gl.uniform1i(shProgram.iLine, false);
}
function draw2() {
    draw()
    window.requestAnimationFrame(draw2)
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribVertexNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelNormalMatrix = gl.getUniformLocation(prog, "ModelNormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLimit = gl.getUniformLocation(prog, "limit");
    shProgram.iSmoothing = gl.getUniformLocation(prog, "smoothing");
    shProgram.iLightDir = gl.getUniformLocation(prog, "lightDir");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");
    shProgram.iLine = gl.getUniformLocation(prog, "line");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.BufferData2(CreateSurfaceData());
    line = new Model('Line')
    lineDirection = new Model('LineDirection')
    lineDirection.BufferData(2, 0, -5, 0, 0, 1)
    line.BufferData([0, 0, -5, 2, 0, -5])
    lightModel = new Model('LightModel')
    lightModel.BufferData(CreateSphereList(0.1, 0.1))
    lightModel.BufferData2(CreateSphereList(0.1, 0.1))

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
    draw2();
}






























function CreateSurfaceData() {
    let vertexList = [];

    // for(let u=0; u<=14.5*Math.PI*100; u+=20){
    //     for(let v=0; v<=1.5*Math.PI*100; v+=20){  
    //         let x = (u/100)*Math.cos(Math.cos(u/100))*Math.cos(v/100);
    //         let y = (u/100)*Math.cos(Math.cos(u/100))*Math.sin(v/100);
    //         let z = (u/100)*Math.sin(Math.cos(u/100));
    //         vertexList.push(x/20, y/20, z/20);
    //     }
    // }

    for (let v = 0; v <= 1.5 * Math.PI * 100; v += 20) {
        for (let u = 0; u <= 14.5 * Math.PI * 100; u += 20) {
            let x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos(v / 100);
            let y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin(v / 100);
            let z = (u / 100) * Math.sin(Math.cos(u / 100));
            vertexList.push(x / 20, y / 20, z / 20);
            x = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.cos(v / 100);
            y = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.sin(v / 100);
            z = ((u + 20) / 100) * Math.sin(Math.cos((u + 20) / 100));
            vertexList.push(x / 20, y / 20, z / 20);
            x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos((v + 20) / 100);
            y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin((v + 20) / 100);
            z = (u / 100) * Math.sin(Math.cos(u / 100));
            vertexList.push(x / 20, y / 20, z / 20);
            x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos((v + 20) / 100);
            y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin((v + 20) / 100);
            z = (u / 100) * Math.sin(Math.cos(u / 100));
            vertexList.push(x / 20, y / 20, z / 20);
            x = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.cos(v / 100);
            y = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.sin(v / 100);
            z = ((u + 20) / 100) * Math.sin(Math.cos((u + 20) / 100));
            vertexList.push(x / 20, y / 20, z / 20);
            x = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.cos((v + 20) / 100);
            y = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.sin((v + 20) / 100);
            z = ((u + 20) / 100) * Math.sin(Math.cos((u + 20) / 100));
            vertexList.push(x / 20, y / 20, z / 20);
        }
    }



    return vertexList;
}

function CreateSurfaceData2() {
    let vertexList = [];
    for (let v = 0; v <= 1.5 * Math.PI * 100; v += 20) {
        for (let u = 0; u <= 14.5 * Math.PI * 100; u += 20) {
            let x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos(v / 100);
            let y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin(v / 100);
            let z = (u / 100) * Math.sin(Math.cos(u / 100));
            vertexList.push(...getFacetAvarageNormal(x / 20, y / 20, z / 20));
            x = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.cos(v / 100);
            y = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.sin(v / 100);
            z = ((u + 20) / 100) * Math.sin(Math.cos((u + 20) / 100));
            vertexList.push(...getFacetAvarageNormal(x / 20, y / 20, z / 20));
            x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos((v + 20) / 100);
            y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin((v + 20) / 100);
            z = (u / 100) * Math.sin(Math.cos(u / 100));
            vertexList.push(...getFacetAvarageNormal(x / 20, y / 20, z / 20));
            x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos((v + 20) / 100);
            y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin((v + 20) / 100);
            z = (u / 100) * Math.sin(Math.cos(u / 100));
            vertexList.push(...getFacetAvarageNormal(x / 20, y / 20, z / 20));
            x = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.cos(v / 100);
            y = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.sin(v / 100);
            z = ((u + 20) / 100) * Math.sin(Math.cos((u + 20) / 100));
            vertexList.push(...getFacetAvarageNormal(x / 20, y / 20, z / 20));
            x = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.cos((v + 20) / 100);
            y = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.sin((v + 20) / 100);
            z = ((u + 20) / 100) * Math.sin(Math.cos((u + 20) / 100));
            vertexList.push(...getFacetAvarageNormal(x / 20.0, y / 20.0, z / 20.0));
        }
    }
    console.log(vertexList)
    return vertexList;

}

function getFacetAvarageNormal(u, v) {
    let x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos(v / 100);
    let y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin(v / 100);
    let z = (u / 100) * Math.sin(Math.cos(u / 100));
    let v0 = [x, y, z]
    x = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.cos(v / 100);
    y = ((u + 20) / 100) * Math.cos(Math.cos((u + 20) / 100)) * Math.sin(v / 100);
    z = ((u + 20) / 100) * Math.sin(Math.cos((u + 20) / 100));
    let v1 = [x, y, z]
    x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos((v + 20) / 100);
    y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin((v + 20) / 100);
    z = (u / 100) * Math.sin(Math.cos(u / 100));
    let v2 = [x, y, z]
    x = ((u - 20) / 100) * Math.cos(Math.cos((u - 20) / 100)) * Math.cos((v + 20) / 100);
    y = ((u - 20) / 100) * Math.cos(Math.cos((u - 20) / 100)) * Math.sin((v + 20) / 100);
    z = ((u - 20) / 100) * Math.sin(Math.cos((u - 20) / 100));
    let v3 = [x, y, z]
    x = ((u - 20) / 100) * Math.cos(Math.cos((u - 20) / 100)) * Math.cos(v / 100);
    y = ((u - 20) / 100) * Math.cos(Math.cos((u - 20) / 100)) * Math.sin(v / 100);
    z = ((u - 20) / 100) * Math.sin(Math.cos((u - 20) / 100));
    let v4 = [x, y, z]
    x = ((u - 20) / 100) * Math.cos(Math.cos((u - 20) / 100)) * Math.cos((v - 20) / 100);
    y = ((u - 20) / 100) * Math.cos(Math.cos((u - 20) / 100)) * Math.sin((v - 20) / 100);
    z = ((u - 20) / 100) * Math.sin(Math.cos((u - 20) / 100));
    let v5 = [x, y, z]
    x = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.cos((v - 20) / 100);
    y = (u / 100) * Math.cos(Math.cos(u / 100)) * Math.sin((v - 20) / 100);
    z = (u / 100) * Math.sin(Math.cos(u / 100));
    let v6 = [x, y, z]

    // defining each coincident facet by vector

    m4.normalize(v0, v0)
    m4.normalize(v1, v1)
    m4.normalize(v2, v2)
    m4.normalize(v3, v3)
    m4.normalize(v4, v4)
    m4.normalize(v5, v5)
    m4.normalize(v6, v6)
    let v01 = m4.normalize(m4.subtractVectors(v1, v0))
    let v02 = m4.normalize(m4.subtractVectors(v2, v0))
    let v03 = m4.normalize(m4.subtractVectors(v3, v0))
    let v04 = m4.normalize(m4.subtractVectors(v4, v0))
    let v05 = m4.normalize(m4.subtractVectors(v5, v0))
    let v06 = m4.normalize(m4.subtractVectors(v6, v0))

    // finding normal by taking cross product

    let n1 = m4.normalize(m4.cross(v01, v02))
    let n2 = m4.normalize(m4.cross(v02, v03))
    let n3 = m4.normalize(m4.cross(v03, v04))
    let n4 = m4.normalize(m4.cross(v04, v05))
    let n5 = m4.normalize(m4.cross(v05, v06))
    let n6 = m4.normalize(m4.cross(v06, v01))

    //averaging the normal

    let n = [(n1[0] + n2[0] + n3[0] + n4[0] + n5[0] + n6[0]) / 6.0,
    (n1[1] + n2[1] + n3[1] + n4[1] + n5[1] + n6[1]) / 6.0,
    (n1[2] + n2[2] + n3[2] + n4[2] + n5[2] + n6[2]) / 6.0]
    n = m4.normalize(n);
    return n;
}

function CreateSphereList(step, r = 0.2) {
    let vertexList = [];

    let u = 0,
        v = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let v1 = getSphereVertex(u, v, r);
            let v2 = getSphereVertex(u + step, v, r);
            let v3 = getSphereVertex(u, v + step, r);
            let v4 = getSphereVertex(u + step, v + step, r);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            v += step;
        }
        v = 0;
        u += step;
    }
    return vertexList;
}
function getSphereVertex(long, lat, r) {
    return {
        x: r * Math.cos(long) * Math.sin(lat),
        y: r * Math.sin(long) * Math.sin(lat),
        z: r * Math.cos(lat)
    }
}