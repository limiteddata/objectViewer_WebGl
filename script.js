
const state = {
  gl:null,
  canvas:null,
  program: null,
  uMVPMatrix:null,
  vm:null,
  pm:null,
  mvp:null,
  texture:null,
  camSensitivity: 0.01,
  allow_rotateCamera: false,
  allow_moveCamera: false,
  objectSelected_click: false,
  _renderWireframe: false,
  selectedObject: null,
  uSelectColor: null,
  uNormalMatrix: null,
  uScale: null,
  keys: {},
  mouseKeys: {},
  objects: []
};

// Vertex shader

const vsSource = `
attribute vec4 aPosition;
attribute vec2 aTextureCoord;
attribute vec3 aVertexNormal;

uniform mat4 uMVPMatrix;
uniform mat4 uNormalMatrix;

uniform vec3 u_scale;


varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;


void main(void) {

  vec4 scaledPosition;

  scaledPosition.x = aPosition.x * u_scale.x;
  scaledPosition.y = aPosition.y * u_scale.y;
  scaledPosition.z = aPosition.z * u_scale.z; 
  scaledPosition.w = 1.0;


  gl_Position =  uMVPMatrix * scaledPosition;
  vTextureCoord = aTextureCoord;

  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

  highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);
}
`;

// Fragment shader 

const fsSource = `

uniform sampler2D uTexture;

varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

uniform highp vec4 uSelectColor;

void main(void) {
  highp vec4 texelColor = texture2D(uTexture, vTextureCoord);
  if(uSelectColor[0] == 1.0) gl_FragColor = vec4(uSelectColor[1],uSelectColor[2],uSelectColor[3],255);
  else gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a); 
}
`;

function baseObject() {
  this.id = Math.random().toString(36).substr(2, 9);
  this.size = [1,1,1];
  this.mm =  mat4.create();

  this.texture = loadTexture('https://designshack.net/wp-content/uploads/background-textures.png');

  this.uSelectColor = [0.0, ((state.objects.length / 100)+0.01).toFixed(2) ,0.0,0.0];

  this.normalMatrix = mat4.create();
    
  mat4.invert(this.normalMatrix, state.uMVPMatrix);
  mat4.transpose(this.normalMatrix, this.normalMatrix);
}

function Cube() {
  baseObject.call(this);
  this.attributes = {
    aPosition: {
      size:3,
      offset:0,
      bufferData: new Float32Array([
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
      ])
    },   
    aVertexNormal: {
      size:3,
      offset:0,
      bufferData: new Float32Array([
        // Front
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
    
        // Back
         0.0,  0.0, 1.0,
         0.0,  0.0, 1.0,
         0.0,  0.0, 1.0,
         0.0,  0.0, 1.0,
    
        // Top
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
    
        // Bottom
         0.0, 0.0,  0.0,
         0.0, 0.0,  0.0,
         0.0, 0.0,  0.0,
         0.0, 0.0,  0.0,
    
        // Right
         0.0,  0.0,  0.0,
         0.0,  0.0,  0.0,
         0.0,  0.0,  0.0,
         0.0,  0.0,  0.0,
    
        // Left
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0
      ])
    },   
    aTextureCoord: {
      size:2,
      offset:0,
      bufferData: new Float32Array([
        // Front
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Back
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Top
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Bottom
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Right
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Left
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
      ])
    }
  };
  this.indices = new Uint8Array([
    0,  1,  2,      0,  2,  3,    
    4,  5,  6,      4,  6,  7,    
    8,  9,  10,     8,  10, 11,   
    12, 13, 14,     12, 14, 15,   
    16, 17, 18,     16, 18, 19,   
    20, 21, 22,     20, 22, 23,   
  ]);
};
function Pyramid() {
  baseObject.call(this);

  this.attributes = {
    aPosition: {
      size:3,
      offset:0,
      bufferData: new Float32Array([

        -1.0, -1.0, -1.0, // 0 
        1.0, -1.0, -1.0, // 1 
        1.0, -1.0,  1.0,  // 2 
        -1.0, -1.0,  1.0, // 3
        0.0, 1.0,  0.0, //4

      ])
    },
    aVertexNormal: {
      size:3,
      offset:0,
      bufferData: new Float32Array([
        // Bottom
         0.0,  0.0,  0.0,
         0.0,  0.0,  0.0,
         0.0,  0.0,  0.0,
         0.0,  0.0,  0.0,
    
        // Front
         0.0,  1.0, 1.0,
         0.0,  1.0, 1.0,
         0.0,  1.0, 1.0,

        // Back
         0.0,  1.0,  1.0,
         0.0,  1.0,  1.0,
         0.0,  1.0,  1.0,

    
        // Left
         0.0, 1.0,  1.0,
         0.0, 1.0,  1.0,
         0.0, 1.0,  1.0,

    
        // Right
         0.0,  1.0,  1.0,
         0.0,  1.0,  1.0,
         0.0,  1.0,  1.0,


      ])
    },   
    aTextureCoord: {
      size:2,
      offset:0,
      bufferData: new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
      ])
    }
  };
  this.indices = new Uint8Array([
    0,  1,  2,      0,  2,  3, 

    3,  4,  2,      2,  1,  4,

    4,  1,  0,      0,  4,  3
  ]);

};

function loadTexture(url) {
  const texture = state.gl.createTexture();
  const image = new Image();
  image.src = url;
  if ((new URL(url, window.location.href)).origin !== window.location.origin) image.crossOrigin = ""; 
  image.crossOrigin = ""; 

  image.onload = function() {
    state.gl.bindTexture(state.gl.TEXTURE_2D, texture);
    state.gl.texImage2D(state.gl.TEXTURE_2D, 0, state.gl.RGBA, state.gl.RGBA, state.gl.UNSIGNED_BYTE, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) state.gl.generateMipmap(state.gl.TEXTURE_2D);   
    else {
      state.gl.texParameteri(state.gl.TEXTURE_2D, state.gl.TEXTURE_WRAP_S, state.gl.CLAMP_TO_EDGE);
      state.gl.texParameteri(state.gl.TEXTURE_2D, state.gl.TEXTURE_WRAP_T, state.gl.CLAMP_TO_EDGE);
      state.gl.texParameteri(state.gl.TEXTURE_2D, state.gl.TEXTURE_MIN_FILTER, state.gl.LINEAR);
    }
  };
  state.gl.bindTexture(state.gl.TEXTURE_2D, null);

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function saveImage(e){
  state.gl.preserveDrawingBuffer = true;
  render();
  e.href = state.canvas.toDataURL();
  e.download = "webglPicture.png";
  state.gl.preserveDrawingBuffer = false;
}


function loadNewTexture(event) {
  var reader = new FileReader();
  reader.onload = function(){
    const newTexture = document.createElement("img");
    newTexture.width = 50;
    newTexture.height = 50;
    newTexture.src = reader.result;
    newTexture.addEventListener("click", ()=>{changeTextureto(newTexture.src)});
    document.getElementById("Textures").appendChild(newTexture);
  }
  reader.readAsDataURL(event.target.files[0]);
}

function spawnNewObject(e){
  state.objects.push(e);
  state.selectedObject = state.objects[state.objects.length-1]; 
}

function renderWireframe(e){
  state._renderWireframe = e
}

function changeFov(e){
  const fieldOfView = e * Math.PI / 180;
  const aspect = state.gl.canvas.clientWidth / state.gl.canvas.clientHeight;
  mat4.perspective(state.pm,fieldOfView, aspect, 0.1, 100);
  mat4.lookAt(state.vm,
    vec3.fromValues(0,0,-10),
    vec3.fromValues(0,0,0),
    vec3.fromValues(0,1,0)
  );
}

function changeCamSens(e){
  state.camSensitivity = e
}

function changeTextureto(e){
  if(state.selectedObject != null) state.selectedObject.texture = loadTexture(e);
  render();
}

function rotateCamera(e){
  if (e.movementX != 0) mat4.rotateY(state.pm, state.pm, e.movementX*state.camSensitivity*0.15);  
  if (e.movementY != 0) mat4.rotateX(state.pm, state.pm, e.movementY*state.camSensitivity*0.15);  
}

function moveCamera(e){
  mat4.translate(state.pm, state.pm, [e.movementX*state.camSensitivity,-e.movementY*state.camSensitivity,0]);  
}

function zoomCamera(e){
  mat4.translate(state.pm,state.pm,[0,0,-e.deltaY*state.camSensitivity]);
}

function rotateObj(rotation, direction){
  if(state.selectedObject != null)  mat4.rotate(state.selectedObject.mm, state.selectedObject.mm, rotation, direction);   
}

function scaleObj(x,y,z){
  state.selectedObject.size[0] += x;
  state.selectedObject.size[1] += y;
  state.selectedObject.size[2] += z;
}

function moveObj(x,y){
  if(state.selectedObject != null)  mat4.translate(state.selectedObject.mm,state.selectedObject.mm,[x,y,0]);
}

function removeObj(){
  for (var i=0; i<state.objects.length; i++) {
    if(state.objects[i].id == state.selectedObject.id){
      state.objects.splice(i, 1);
      return;
    }
  }
}

function initProgram() {
  state.canvas = document.querySelector('#glcanvas');
  state.gl = state.canvas.getContext('webgl');
  
  state.program = initShaderProgram(vsSource, fsSource);

  state.uMVPMatrix = state.gl.getUniformLocation(state.program, 'uMVPMatrix');
  state.vm = mat4.create();
  state.pm = mat4.create(); 
  state.mvp = mat4.create();
  state.texture = state.gl.getUniformLocation(state.program, 'uTexture');
  state.uSelectColor = state.gl.getUniformLocation(state.program, 'uSelectColor');
  state.uNormalMatrix = state.gl.getUniformLocation(state.program, 'uNormalMatrix');
  state.uScale = state.gl.getUniformLocation(state.program, 'u_scale');
  clearGl();
}

function initShaderProgram(vShader, fShader){
  const vertexShader = loadShader(state.gl.VERTEX_SHADER, vShader);
  const fragmentShader = loadShader(state.gl.FRAGMENT_SHADER, fShader);

  const shaderProgram = state.gl.createProgram();
  state.gl.attachShader(shaderProgram, vertexShader);
  state.gl.attachShader(shaderProgram, fragmentShader);
  state.gl.linkProgram(shaderProgram);

  if (!state.gl.getProgramParameter(shaderProgram, state.gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + state.gl.getProgramInfoLog(shaderProgram));
    return null;
  }


  shaderProgram.renderBuffers = function(obj) {

    var indexBuffer = state.gl.createBuffer();
    var attributes = state.gl.getProgramParameter(state.program, state.gl.ACTIVE_ATTRIBUTES);

    for (var i=0; i<attributes; i++) {

      var name = state.gl.getActiveAttrib(state.program, i).name;

      var objAttribute = obj.attributes[name];
      var buffer = state.gl.createBuffer();

      state.gl.bindBuffer(state.gl.ARRAY_BUFFER, buffer);
      state.gl.bufferData(state.gl.ARRAY_BUFFER, objAttribute.bufferData, state.gl.STATIC_DRAW);

      var attr = state.gl.getAttribLocation(shaderProgram, name);

      state.gl.enableVertexAttribArray(attr);
      state.gl.vertexAttribPointer(
        attr,
        objAttribute.size,
        state.gl.FLOAT,
        false,
        objAttribute.bufferData.BYTES_PER_ELEMENT*obj.stride,
        objAttribute.bufferData.BYTES_PER_ELEMENT*objAttribute.offset
      );
    }
    if (obj.indices) {
      state.gl.bindBuffer(state.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      state.gl.bufferData(state.gl.ELEMENT_ARRAY_BUFFER, obj.indices, state.gl.STATIC_DRAW);
    }
    if(obj.texture){
      state.gl.activeTexture(state.gl.TEXTURE0);
      state.gl.bindTexture(state.gl.TEXTURE_2D, obj.texture);
      state.gl.uniform1i(state.texture, 0);
    }
    if(obj.uSelectColor) state.gl.uniform4fv(state.uSelectColor,obj.uSelectColor);
    if(obj.normalMatrix) state.gl.uniformMatrix4fv(state.uNormalMatrix,false, obj.normalMatrix);
    if(obj.size) state.gl.uniform3fv(state.uScale, obj.size);
  }


  return shaderProgram;
}

function loadShader(type, source) {
  const shader = state.gl.createShader(type);
  state.gl.shaderSource(shader, source);
  state.gl.compileShader(shader);
  if (!state.gl.getShaderParameter(shader, state.gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + state.gl.getShaderInfoLog(shader));
    state.gl.deleteShader(shader);
    return null;
  }
  return shader;
}


function initEvents(){
  
  onkeydown = onkeyup = function(e){
      state.keys[e.keyCode] = e.type == 'keydown';
      if(state.keys[87]) moveObj(0,0.1); //w
      if(state.keys[83]) moveObj(0,-0.1); //s 
      if(state.keys[65]) moveObj(0.1,0); //d
      if(state.keys[68]) moveObj(-0.1,0); //a

      if(state.keys[37]) rotateObj(-0.05,[0,1,0]); // up
      if(state.keys[39]) rotateObj(0.05,[0,1,0]); // down
      if(state.keys[38]) rotateObj(-0.05,[1,0,0]); // right
      if(state.keys[40]) rotateObj(0.05,[1,0,0]); // left

      if(state.keys[46]) removeObj(); // delete
  }
  state.canvas.addEventListener('contextmenu', function(e){
    e.preventDefault();
  }, false);
  state.canvas.addEventListener('mousedown', e => {
    e.preventDefault();
    state.mouseKeys[e.button] = true;
    if(e.button == 1 ) state.allow_moveCamera = true; // middle click
    if(e.button == 2 ) state.allow_rotateCamera = true; // right click
    if(e.button == 0 ){
      for (var i=0; i<state.objects.length; i++) state.objects[i].uSelectColor[0] = 1.0;
      render();
      
      var x,y,rect = e.target.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = rect.bottom - e.clientY;
      
      var pixels = new Uint8Array(4);

      state.gl.readPixels(x, y, 1, 1, state.gl.RGBA, state.gl.UNSIGNED_BYTE, pixels);

      for (var i=0; i<state.objects.length; i++){
        if (state.objects[i].uSelectColor[1] == (pixels[0]/255).toFixed(2)) {
          state.selectedObject = state.objects[i];   
          state.objectSelected_click = true;     
        }
        state.objects[i].uSelectColor[0] = 0.0;
      }
    }


  },false);
  document.addEventListener('mouseup', e => {
    state.mouseKeys[e.button] = false;
    if(e.button == 1 ) state.allow_moveCamera = false; // middle click
    if(e.button == 2) state.allow_rotateCamera = false; // right click
    state.objectSelected_click = false;
  },false);
  document.addEventListener('mousemove', e => {
    if(state.allow_moveCamera) moveCamera(e);
    if(state.allow_rotateCamera) rotateCamera(e);
    
    if(state.keys[84] && state.mouseKeys[0]){
      if(state.keys[16]){
        var unif = e.movementX*state.camSensitivity;
        scaleObj(unif,unif,unif);
      }
      else{
        scaleObj(e.movementX*state.camSensitivity,-e.movementY*state.camSensitivity,0);
      }
      return;
    }
    if(state.objectSelected_click) moveObj(-e.movementX*0.03,-e.movementY*0.03);
  },false);
  state.canvas.onwheel = (e)=>{
    e.preventDefault();
    zoomCamera(e);
  } 
}

function clearGl(){
  state.gl.clearColor(0.9, 0.9, 0.9, 1.0);
  state.gl.clearDepth(1.0);    
  state.gl.clear(state.gl.COLOR_BUFFER_BIT | state.gl.DEPTH_BUFFER_BIT);
  state.gl.enable(state.gl.DEPTH_TEST);
  state.gl.depthFunc(state.gl.LEQUAL);   
  state.gl.useProgram(state.program); 
}

function render() {
  clearGl();
  for (var i=0;i<state.objects.length;i++) {
    var obj = state.objects[i];
    state.program.renderBuffers(obj);

    var n = obj.indices.length;
    mat4.copy(state.mvp, state.pm);
    mat4.multiply(state.mvp, state.mvp, state.vm);
    mat4.multiply(state.mvp, state.mvp, obj.mm);
    state.gl.uniformMatrix4fv(state.uMVPMatrix, false, state.mvp);

    if (state._renderWireframe) state.gl.drawElements(state.gl.LINES, n, state.gl.UNSIGNED_BYTE, 0);
    else state.gl.drawElements(state.gl.TRIANGLES, n, state.gl.UNSIGNED_BYTE, 0);
  }
}

function startRender(){
  render();
  requestAnimationFrame(startRender);
}

function main(){
  initProgram();
  initEvents();
  
  changeFov(45);
  mat4.translate(state.pm,state.pm,[0,0,-15]);

  var cube = new Cube();
  spawnNewObject(cube);

  requestAnimationFrame(startRender);
}
main();