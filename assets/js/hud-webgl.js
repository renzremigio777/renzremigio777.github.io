const vertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: vert

void main () 
{
  gl_Position = vec4(0.0, -0.0, 0.0, 1.0);
  gl_PointSize = 150.0;
}`;

const fragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

out vec4 fragColor;

void main () 
{
  fragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

function resize() {

  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  // keep CSS display size the same
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';

  gl.viewport(0, 0, canvas.width, canvas.height);
}


function init() {
  resize();
  const program = gl.createProgram();

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  gl.attachShader(program, vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    console.log(gl.getShaderInfoLog(fragmentShader));
  }

  gl.useProgram(program);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.POINTS, 0, 1);

}

init()

window.addEventListener('resize', init);