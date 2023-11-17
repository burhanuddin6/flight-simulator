const URL = `${window.location.protocol}//${window.location.host}`
const fShaderSrcFile = `${URL}/fshader.glsl`
const vShaderSrcFile = `${URL}/vshader.glsl`

const  vertexShaderSource = await (await fetch(vShaderSrcFile)).text()
const  fragmentShaderSource = await (await fetch(fShaderSrcFile)).text()


function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
    gl.deleteShader(shader);
    return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return undefined;
}

let camera;
let prevCamPos = vec3(0, 0, 0);
let renderCount = 0;
let light1, light2;
let terrains = [];
let landScape;
let program;
let QUIT = false;
let angle = 0.0;
let trackingMouse = false;

let lastX = screen.width / 2, lastY = screen.height / 2
let firstMouse = true

// all the rotations can be only from -90 to 90
let yaw = 0.0;
let pitch = 0.0;
let roll = 0.0;

function getFront(pitch, yaw, roll) {
    return vec3(
        Math.cos(radians(yaw)) * Math.cos(radians(pitch)),
        Math.sin(radians(pitch)),
        Math.sin(radians(yaw)) * Math.cos(radians(pitch))
    );
}

function getUp(pitch, yaw, roll) {
    return vec3(
        Math.sin(radians(pitch)) * Math.cos(radians(yaw)) + Math.cos(radians(pitch)) * Math.sin(radians(roll)) * Math.sin(radians(yaw)),
        1,
        Math.cos(radians(pitch)) * Math.sin(radians(roll)) + Math.sin(radians(pitch)) * Math.sin(radians(yaw)) * Math.cos(radians(roll))
    );
}

function init() {
    canvas = document.getElementById("gl-canvas");

    const vshader_tag = document.getElementById("vertex-shader")
    const fshader_tag = document.getElementById("fragment-shader")

    console.log("vertex shader source: ", vshader_tag)
    console.log("fragment shader source: ", fshader_tag)
    gl = canvas.getContext("webgl2");
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    console.log("vertex shader source: ", vertexShaderSource);
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    camera = new Camera(program, vec3(0, 800, -20), vec3(0, 0, 0), vec3(0, 1, 0));
    prevCamPos = camera.position.slice(0);

    light1 = new Light(program, vec4(1, 4.5, 1, 1));
    light1.intensity.ambient = vec3(0.2, 0.2, 0.2);
    light1.intensity.diffuse = vec3(0.2, 0.2, 0.2);
    light1.intensity.specular = vec3(1.0, 1.0, 1.0);

    light2 = new Light(program, vec4(0, 0, 0, 1));
    light2.intensity.ambient = vec3(0.3, 0.6, 0.9);
    light2.intensity.diffuse = vec3(0.9, 0.6, 0.3);
    light2.intensity.specular = vec3(0.5, 0.75, 1.0);

    landScape = new LandScape(program);
    landScape.getPatch(-6000, 6000, -5000, 5000);

    camera.front = normalize(getFront(pitch, yaw, roll));
    camera.up = normalize(getUp(pitch, yaw, roll));

    window.onkeydown = function (event) {
        let key = String.fromCharCode(event.keyCode);
        switch (key) {
            case '5': // forward
                camera.position = add(camera.position, scale(camera.SPEED, camera.front));
                break;
            case '1': // left
                camera.position = subtract(camera.position, scale(camera.SPEED, normalize(cross(camera.front, camera.up))));
                break;
            case '6': // backward
                camera.position = subtract(camera.position, scale(camera.SPEED, camera.front));
                break;
            case '2': // right
                camera.position = add(camera.position, scale(camera.SPEED, normalize(cross(camera.front, camera.up))));
                break;
            case '3': // up
                camera.position = add(camera.position, scale(camera.SPEED, camera.up));
                break;
            case '4': // down
                camera.position = subtract(camera.position, scale(camera.SPEED, camera.up));
                break;
            // quit the program
            case '': // quit
                QUIT = true;
                break;
            case 'W': // pitch up
                pitch = Math.min(pitch + 1, 90);
                break;
            case 'S': // pitch down
                pitch = Math.max(pitch - 1, -90);
                break;
            case 'A': // yaw left
                yaw = Math.max(yaw - 1, -90);
                break;
            case 'D': // yaw right  
                yaw = Math.min(yaw + 1, 90);
                break;
            case 'Q': // roll left
                roll  = Math.min(roll - 1, 90);
                break;
            case 'E': // roll right
                roll = Math.max(roll + 1, -90);
                break;
            default:
                break;

        }
        camera.front = normalize(getFront(pitch, yaw, roll));
        camera.up = normalize(getUp(pitch, yaw, roll));
    }

    canvas.addEventListener("mousedown", function (event) {
        startMotion();
    });

    canvas.addEventListener("mouseup", function (event) {
        stopMotion();
    });

    render();
}

function render() {
    if (QUIT) {
        return;
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    light1.render();
    light2.render();
    if (prevCamPos[0] != camera.position[0] || prevCamPos[2] != camera.position[2]) {
        // TODO: calculate xmin, xmax, zmin, zmax based on yaw. The terrain is always in front of the camera
        renderCount++;
        prevCamPos = camera.position.slice(0);
    }
    if (renderCount > 100) {
        landScape.getPatch(camera.position[0], camera.position[0] + 6000, camera.position[2] - 3000, camera.position[2] + 3000);
        renderCount = 0;
        console.log("render")
    }
    landScape.render();
    camera.render(trackingMouse);
    requestAnimFrame(render);
}

init();