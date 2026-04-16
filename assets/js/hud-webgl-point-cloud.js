// =========================
// CANVAS & GL SETUP
// =========================
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) throw new Error('WebGL not supported');

const { mat4, vec3 } = glMatrix;


// =========================
// MATRICES
// =========================
const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
const mvMatrix = mat4.create();
const mvpMatrix = mat4.create();


// =========================
// RESIZE
// =========================
function resize() {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;

  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';

  gl.viewport(0, 0, canvas.width, canvas.height);

  mat4.perspective(
    projectionMatrix,
    75 * Math.PI / 180,
    canvas.width / canvas.height,
    0.0001,
    10000
  );
}


// =========================
// GEOMETRY
// =========================
function spherePointCloud(count) {
  const points = [];

  for (let i = 0; i < count; i++) {
    const r = () => Math.random() - 0.5;
    const p = vec3.normalize(vec3.create(), [r(), r(), r()]);
    points.push(...p);
  }

  return new Float32Array(points);
}

const vertexData = spherePointCloud(1e4);


// =========================
// SHADERS
// =========================
const vertexShaderSource = `
  precision mediump float;

  attribute vec3 position;
  uniform mat4 matrix;

  varying vec3 vColor;

  void main() {
    vColor = vec3(position.xy, 1.0);
    gl_PointSize = 1.0;
    gl_Position = matrix * vec4(position, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }
`;


// =========================
// HELPERS
// =========================
function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  return program;
}


// =========================
// INIT
// =========================
let program;
let positionLocation;
let matrixLocation;
let positionBuffer;

function init() {
  resize();

  // --- Buffers ---
  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

  // --- Shaders ---
  const vs = createShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  program = createProgram(vs, fs);
  gl.useProgram(program);

  // --- Attributes ---
  positionLocation = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  // --- Uniforms ---
  matrixLocation = gl.getUniformLocation(program, 'matrix');

  // --- GL State ---
  gl.enable(gl.DEPTH_TEST);

  // --- Camera setup ---
  mat4.identity(modelMatrix);
  mat4.identity(viewMatrix);
  mat4.translate(viewMatrix, viewMatrix, [0, 0, -1]);
}


// =========================
// RENDER LOOP
// =========================
function render() {
  requestAnimationFrame(render);

  // Clear
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Animate
  mat4.rotateY(modelMatrix, modelMatrix, 0.005);

  // MVP
  mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
  mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);

  gl.uniformMatrix4fv(matrixLocation, false, mvpMatrix);

  // Draw
  gl.drawArrays(gl.POINTS, 0, vertexData.length / 3);
}


// =========================
// START
// =========================
init();
render();
window.addEventListener('resize', resize);