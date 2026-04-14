const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
  throw new Error('WebGL not supportedf');
}



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

  const vertexData = [

    // Front

    0.5, 0.5, 0.5, 
    0.5, -.5, 0.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, -.5, 0.5,
    -.5, -.5, 0.5,

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
    0.5, 0.8, -.5,
    -.5, 0.5, 0.5,
    -.5, 0.5, 0.5,
    0.5, 0.8, -.5,
    -.5, 0.8, -.5,

    // Bottom
     0.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, 0.5,
    -.5, -.5, 0.5,
    0.5, -.5, -.5,
    -.5, -.5, -.5,
  ];
  
  // const colorData = [
  //   // Triangle Color
  //   1, 0, 0,  // Triangle V1.color
  //   0, 1, 0,  // Triangle V2.color
  //   0, 0, 1,  // Triangle V3.color
  // ]
  
  function randomColor() {
    return [Math.random(), Math.random() * 2, Math.random()]
  }

  let colorData = [];
  for (let face = 0; face < 6; face++) {
    let faceColor = randomColor(); //[0.02, 0.05, 0.68]//
    for (let vertex = 0; vertex < 6; vertex++) {
      colorData.push(...faceColor)
    }
  }

  console.log(colorData)
  

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW);

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, `
    precision mediump float;

    attribute vec3 position;
    attribute vec3 color;
    varying vec3 vColor;

    uniform mat4 matrix;

    void main() {
      vColor = color;
      gl_Position = matrix * vec4(position, 1);
    }
  `);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, `
    precision mediump float;

    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1);
    }
  `);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const positionLocation = gl.getAttribLocation(program, `position`);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  const colorLocation = gl.getAttribLocation(program, `color`);
  gl.enableVertexAttribArray(colorLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
  
  gl.useProgram(program);
  gl.enable(gl.DEPTH_TEST);

  const uniformLocation = {
    matrix: gl.getUniformLocation(program, 'matrix')
  };


  const { mat4 } = glMatrix;
  const modelMatrix = mat4.create();
  const viewMatrix = mat4.create();
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix,
    75 * Math.PI/180, // vertical field-of-view (angle, radians)
    canvas.width / canvas.height, // aspect W/H
    1e-4, // near cull distance
    1e4 , // far cull distance
  );
  const mvMatrix = mat4.create();
  const mvpMatrix = mat4.create();
  const finalMatrix = mat4.create();

  mat4.translate(modelMatrix, modelMatrix , [-3 , -.5, -2]);

  mat4.translate(viewMatrix, viewMatrix , [-3, .25, 3]);
  mat4.invert(viewMatrix, viewMatrix);
  
  // mat4.scale(matrix, matrix, [0.25, 0.25, 0.25]);

  mat4.rotateX(modelMatrix, modelMatrix, Math.PI / 2 / 5);
  // mat4.rotateY(modelMatrix, modelMatrix, Math.PI/2 / 5);
  function animate() {
    requestAnimationFrame(animate);
    // mat4.rotateZ(matrix, matrix, Math.PI / 2 / 10);
    // mat4.rotateX(modelMatrix, modelMatrix, Math.PI/2 / 100);
    mat4.rotateY(modelMatrix, modelMatrix, Math.PI/2 / 200);

    mat4.multiply(mvMatrix, viewMatrix, modelMatrix )
    mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix )
    gl.uniformMatrix4fv(uniformLocation.matrix, false, mvpMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertexData.length/3);
  }
  animate();
}



init();
window.addEventListener('resize', init);



