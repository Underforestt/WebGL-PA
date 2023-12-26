'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let pointModel;
let pointUV = {
    u: 4500.0,
    v: 60.0
}
let angle = 0;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iVertexBuffer2 = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.BufferData2 = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer2);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer2);
        gl.vertexAttribPointer(shProgram.iAttribVertex2, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex2);

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

        // // draw v lines
        // let offset = u_count * v_count;
        // for (let v = 0; v <= v_count; v++) {
        //     let start = (v * u_count) + offset;
        //     let end = u_count;
        gl.drawArrays(gl.TRIANGLES, 0, this.count);
        // }


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
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-5, 5, -5, 5, -5, 5);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -3);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);

    surface.Draw();
    let lim_u = 14.5 * Math.PI * 100;
    let lim_v = 1.5 * Math.PI * 100;
    gl.uniform2fv(shProgram.iPointUV, [map(pointUV.u, 0, lim_u, 0, 10), map(pointUV.v, 0, lim_v, 0, 1)])
    let x = (pointUV.u / 100) * Math.cos(Math.cos(pointUV.u / 100)) * Math.cos(pointUV.v / 100);
    let y = (pointUV.u / 100) * Math.cos(Math.cos(pointUV.u / 100)) * Math.sin(pointUV.v / 100);
    let z = (pointUV.u / 100) * Math.sin(Math.cos(pointUV.u / 100));
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(
        modelViewProjection,
        m4.translation(x / 20, y / 20, z / 20)));
    gl.uniform1i(shProgram.iPoint, true)
    gl.uniform1f(shProgram.iAngle, angle)
    pointModel.Draw()
    gl.uniform1i(shProgram.iPoint, false)
}

function CreateSurfaceData() {
    let vertexList = [];
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
    let lim_u = 14.5 * Math.PI * 100;
    let lim_v = 1.5 * Math.PI * 100;
    let vertexList = [];
    for (let v = 0; v <= 1.5 * Math.PI * 100; v += 20) {
        for (let u = 0; u <= 14.5 * Math.PI * 100; u += 20) {
            vertexList.push(map(u, 0, lim_u, 0, 10), map(v, 0, lim_v, 0, 1));
            vertexList.push(map(u + 20, 0, lim_u, 0, 10), map(v, 0, lim_v, 0, 1));
            vertexList.push(map(u, 0, lim_u, 0, 10), map(v + 20, 0, lim_v, 0, 1));
            vertexList.push(map(u, 0, lim_u, 0, 10), map(v + 20, 0, lim_v, 0, 1));
            vertexList.push(map(u + 20, 0, lim_u, 0, 10), map(v, 0, lim_v, 0, 1));
            vertexList.push(map(u + 20, 0, lim_u, 0, 10), map(v + 20, 0, lim_v, 0, 1));
        }
    }
    return vertexList;
}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
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

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://static.turbosquid.com/Preview/2014/08/01__12_04_02/StoneWall1.jpg74B4E88B-474F-48E4-9873E560133A603E.jpgLarger.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribVertex2 = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iTMU = gl.getUniformLocation(prog, 'tmu');
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iPoint = gl.getUniformLocation(prog, "point");
    shProgram.iPointPosition = gl.getUniformLocation(prog, "pointPosition");
    shProgram.iPointUV = gl.getUniformLocation(prog, "pointUV");
    shProgram.iAngle = gl.getUniformLocation(prog, "angle");

    LoadTexture()

    surface = new Model('Surface');
    pointModel = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.BufferData2(CreateSurfaceData2());
    pointModel.BufferData(CreateSphereList(0.1, 0.1))
    pointModel.BufferData2(CreateSphereList(0.1, 0.1))


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
}
window.onkeydown = (e) => {
    let lim_u = 14.5 * Math.PI * 100;
    let lim_v = 1.5 * Math.PI * 100;
    if (e.keyCode == 87) {
        pointUV.u = Math.min(pointUV.u + 20, lim_u);
    }
    else if (e.keyCode == 65) {
        pointUV.v = Math.max(pointUV.v - 20, 0);
    }
    else if (e.keyCode == 83) {
        pointUV.u = Math.max(pointUV.u - 20, 0);
    }
    else if (e.keyCode == 68) {
        pointUV.v = Math.min(pointUV.v + 20, lim_v);
    }
    //left arrow
    else if (e.keyCode == 37) {
        angle -= parseFloat(document.getElementById('s').value)
    }
    //right arrow
    else if (e.keyCode == 39) {
        angle += parseFloat(document.getElementById('s').value)
    }
    draw()
}