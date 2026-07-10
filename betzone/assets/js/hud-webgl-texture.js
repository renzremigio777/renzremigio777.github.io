const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');
const { mat4, vec3 } = glMatrix;

if (!gl) {
  throw new Error('WebGL not supportedf');
}

function resize() {
  console.log('resize')
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;

  // keep CSS display size the same
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';

  gl.viewport(0, 0, canvas.width, canvas.height);
}


const vertexData = [

  // Front
  0.5, 0.5, 0.5, // top right 
  0.5, -.5, 0.5, // bottom right
  -.5, 0.5, 0.5, // top left
  -.5, 0.5, 0.5, // top left
  0.5, -.5, 0.5, // bottom right
  -.5, -.5, 0.5, // bottom left

  // Left
  -.5, 0.5, 0.5,
  -.5, -.5, 0.5,
  -.5, 0.5, -.5,
  -.5, 0.5, -.5,
  -.5, -.5, 0.5,
  -.5, -.5, -.5,

  // Back
  -.5, 0.5, -.5,
  -.5, -.5, -.5,
  0.5, 0.5, -.5,
  0.5, 0.5, -.5,
  -.5, -.5, -.5,
  0.5, -.5, -.5,

  // Right
  0.5, 0.5, -.5,
  0.5, -.5, -.5,
  0.5, 0.5, 0.5,
  0.5, 0.5, 0.5,
  0.5, -.5, 0.5,
  0.5, -.5, -.5,

  // Top
  0.5, 0.5, 0.5,
  0.5, 0.5, -.5,
  -.5, 0.5, 0.5,
  -.5, 0.5, 0.5,
  0.5, 0.5, -.5,
  -.5, 0.5, -.5,

  // Underside
  0.5, -.5, 0.5,
  0.5, -.5, -.5,
  -.5, -.5, 0.5,
  -.5, -.5, 0.5,
  0.5, -.5, -.5,
  -.5, -.5, -.5,
];

// Construct an array by repeating `pattern` n times
function repeat(n, pattern) {
  return [...Array(n)].reduce(sum => sum.concat(pattern), []);
}

const uvData = repeat(6,[
  // start 0,0 moce cW
  0, 0,
  0, 1,
  1, 0,

  1, 0,
  0, 1,
  1, 1,
]);

function init() {
  console.log('init')
  resize();

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvData), gl.STATIC_DRAW);


  // RESOURCE LOADING
  // ================
  
  const brick = loadTexture(`/assets/images/textures/default_brick.png`);

  function loadTexture(url) {
    const texture = gl.createTexture();
    const image = new Image();

    image.onload = e => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D)

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, brick);

    };

    image.src = url;
    return texture;
  }



  // SHADER PROGRAM
  // ==============

  let uniformLocations;
  (function shaderProgram() {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
    precision mediump float;

    attribute vec3 position;
    attribute vec2 uv;

    varying vec2 vUV;

    uniform mat4 matrix;

    void main() {
      vUV = uv;
      gl_Position = matrix * vec4(position, 1);
    }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
    precision mediump float;

    varying vec2 vUV;
    uniform sampler2D textureID;

    void main() {
      gl_FragColor = texture2D(textureID, vUV);
    }
    `);
    gl.compileShader(fragmentShader);
    console.log(gl.getShaderInfoLog(fragmentShader));

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    const positionLocation = gl.getAttribLocation(program, `position`);
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    const uvLocation = gl.getAttribLocation(program, `uv`);
    gl.enableVertexAttribArray(uvLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);

    uniformLocations = {
      matrix: gl.getUniformLocation(program, `matrix`),
      textureID: gl.getUniformLocation(program, 'textureID'),
    };

    gl.uniform1i(uniformLocations.textureID, 0);
  })();

  // MATRICES
  // ========
  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix,
    75 * Math.PI / 180, // vertical field-of-view (angle, radians)
    canvas.width / canvas.height, // aspect W/H
    1e-4, // near cull distance
    1e4, // far cull distance
  );
  
  const mvMatrix = mat4.create();
  const mvpMatrix = mat4.create();

  mat4.translate(viewMatrix, viewMatrix, [0, 0.1, 5]);
  mat4.invert(viewMatrix, viewMatrix);
  
  // ANIMATION LOOP
    mat4.rotateX(modelMatrix, modelMatrix,  0.5);
  function animate() {
    requestAnimationFrame(animate);

    mat4.rotateY(modelMatrix, modelMatrix,  0.015);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix )
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix )
    gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length / 3);
  }

  animate();
}


init();
window.addEventListener('resize', resize);


