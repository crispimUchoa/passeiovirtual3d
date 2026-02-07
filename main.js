var gl;
var prog;

var keys = {};

// posição da câmera
var camPos = [0, 1.5, 6];

// rotação da câmera
var yaw = 0;
var pitch = 0;

// sensibilidade do mouse
var mouseSensitivity = 0.002;

// sistema de pulo / gravidade
var playerY = 1.5;
var velocityY = 0;

// pulo mais alto e gravidade menor
var gravity = -0.004;
var jumpStrength = 0.28;

var isGrounded = true;

var lastTime = 0;

var texFloor;
var texWall;
var texGato = null;
var texCachorro = null;

var objects = [];

var lightAngle = 0;

function getGL(canvas)
{
    var gl = canvas.getContext("webgl");
    if(gl) return gl;

    gl = canvas.getContext("experimental-webgl");
    if(gl) return gl;

    alert("Contexto WebGL inexistente!");
    return false;
}

function createShader(gl, shaderType, shaderSrc)
{
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSrc);
    gl.compileShader(shader);

    if(gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        return shader;

    alert("Erro shader: " + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vtxShader, fragShader)
{
    var prog = gl.createProgram();
    gl.attachShader(prog, vtxShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);

    if(gl.getProgramParameter(prog, gl.LINK_STATUS))
        return prog;

    alert("Erro program: " + gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
}

// Configura texturas e repetição do Tiling ----------------------------------

// verifica se número é potência de 2
function isPowerOf2(value)
{
    return (value & (value - 1)) === 0;
}

// próximo POT
function nextPowerOf2(value)
{
    return Math.pow(2, Math.ceil(Math.log(value) / Math.log(2)));
}

// converte imagem NPOT para POT usando canvas
function convertToPOT(image)
{
    if(isPowerOf2(image.width) && isPowerOf2(image.height))
        return image;

    let potW = nextPowerOf2(image.width);
    let potH = nextPowerOf2(image.height);

    let canvas = document.createElement("canvas");
    canvas.width = potW;
    canvas.height = potH;

    let ctx = canvas.getContext("2d");

    // desenha esticando para caber no canvas POT
    ctx.drawImage(image, 0, 0, potW, potH);

    return canvas;
}

// textura procedural xadrez
function createCheckerTexture(size, color1, color2)
{
    let canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    let ctx = canvas.getContext("2d");

    let block = size / 8;

    for(let y=0; y<8; y++){
        for(let x=0; x<8; x++){
            ctx.fillStyle = ((x+y)%2==0) ? color1 : color2;
            ctx.fillRect(x*block, y*block, block, block);
        }
    }

    return canvas;
}

// envia imagem/canvas pra GPU como textura
function uploadTexture(image, repeat)
{
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // cria textura temporária (1 pixel branco)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255])
    );

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    let isPOT = isPowerOf2(image.width) && isPowerOf2(image.height);

    if(isPOT)
    {
        gl.generateMipmap(gl.TEXTURE_2D);

        if(repeat)
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        else
        {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    else
    {
        // se NÃO for POT, não pode mipmap nem REPEAT
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    return tex;
}

// carrega textura de arquivo (jpg/png/avif)
function loadTextureFromFile(src, repeat, callback)
{
    let img = new Image();
    img.crossOrigin = "";

    img.onload = () => {
        let finalImg = img;

        // se quiser repeat, converte pra POT para habilitar REPEAT
        if(repeat)
            finalImg = convertToPOT(img);

        let tex = uploadTexture(finalImg, repeat);
        callback(tex);
    };

    img.onerror = () => {
        console.error("Erro ao carregar textura:", src);
    };

    img.src = src;
}


// cubo manual (posição + normal + UV)
function createCube(size, t=1)
{
    let s = size/2;
    let tv = 1
    let v = [

        -s,-s, s,   0,0,1,   0,0,
         s,-s, s,   0,0,1,   t,0,
         s, s, s,   0,0,1,   t,tv,

        -s,-s, s,   0,0,1,   0,0,
         s, s, s,   0,0,1,   t,tv,
        -s, s, s,   0,0,1,   0,tv,

        -s,-s,-s,   0,0,-1,  t,0,
        -s, s,-s,   0,0,-1,  t,tv,
         s, s,-s,   0,0,-1,  0,tv,

        -s,-s,-s,   0,0,-1,  t,0,
         s, s,-s,   0,0,-1,  0,tv,
         s,-s,-s,   0,0,-1,  0,0,

        -s,-s,-s,  -1,0,0,   0,0,
        -s,-s, s,  -1,0,0,   t,0,
        -s, s, s,  -1,0,0,   t,tv,

        -s,-s,-s,  -1,0,0,   0,0,
        -s, s, s,  -1,0,0,   t,tv,
        -s, s,-s,  -1,0,0,   0,tv,

         s,-s,-s,   1,0,0,   t,0,
         s, s, s,   1,0,0,   0,tv,
         s,-s, s,   1,0,0,   0,0,

         s,-s,-s,   1,0,0,   t,0,
         s, s,-s,   1,0,0,   t,tv,
         s, s, s,   1,0,0,   0,tv,

        -s, s,-s,   0,1,0,   0,tv,
        -s, s, s,   0,1,0,   0,0,
         s, s, s,   0,1,0,   t,0,

        -s, s,-s,   0,1,0,   0,tv,
         s, s, s,   0,1,0,   t,0,
         s, s,-s,   0,1,0,  t,tv,

        -s,-s,-s,   0,-1,0,  0,0,
         s,-s, s,   0,-1,0,  t,t,
        -s,-s, s,   0,-1,0,  0,t,

        -s,-s,-s,   0,-1,0,  0,0,
         s,-s,-s,   0,-1,0,  t,0,
         s,-s, s,   0,-1,0,  t,t
    ];

    return new Float32Array(v);
}

// plano no eixo XZ (chão) com UVs grandes pra repetir bastante
function createPlane(width, depth)
{
    let w = width/2;
    let d = depth/2;

    // quanto maior, mais repete
    let tileFactor = 12;

    let v = [
        -w,0,-d,   0,1,0,   0,0,
         w,0,-d,   0,1,0,   tileFactor,0,
         w,0, d,   0,1,0,   tileFactor,tileFactor,

        -w,0,-d,   0,1,0,   0,0,
         w,0, d,   0,1,0,   tileFactor,tileFactor,
        -w,0, d,   0,1,0,   0,tileFactor
    ];

    return new Float32Array(v);
}

function createObject(vertices, useTexture, texture, solidColor)
{
    let obj = {};

    obj.vertexCount = vertices.length / 8;

    obj.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    obj.useTexture = useTexture;
    obj.texture = texture;
    obj.solidColor = solidColor || [1,1,1];

    obj.model = math.identity4();

    return obj;
}

function setupKeyboard()
{
    window.addEventListener("keydown", (e)=>{
        keys[e.key.toLowerCase()] = true;

        if(e.code === "Space" && isGrounded){
            velocityY = jumpStrength;
            isGrounded = false;
        }
    });

    window.addEventListener("keyup", (e)=>{
        keys[e.key.toLowerCase()] = false;
    });
}

// mouse FPS com pointer lock
function setupMouse(canvas)
{
    canvas.addEventListener("click", ()=>{
        canvas.requestPointerLock();
    });

    document.addEventListener("mousemove", (e)=>{
        if(document.pointerLockElement !== canvas) return;

        let dx = e.movementX;
        let dy = e.movementY;

        // Movimento Horizontal
        yaw -= dx * mouseSensitivity;

        // Movimento vertical
        pitch -= dy * mouseSensitivity;

        let limit = Math.PI/2 - 0.05;
        if(pitch > limit) pitch = limit;
        if(pitch < -limit) pitch = -limit;
    });
}

// Função que inicializa o jogo ---------------------------------------
function init()
{
    var canvas = document.getElementById("glcanvas1");

    gl = getGL(canvas);
    if(!gl) return;

    let vtxSrc = document.getElementById("vertex-shader").text;
    let fragSrc = document.getElementById("frag-shader").text;

    let vtxShader = createShader(gl, gl.VERTEX_SHADER, vtxSrc);
    let fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSrc);

    prog = createProgram(gl, vtxShader, fragShader);
    gl.useProgram(prog);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.05, 0.05, 0.08, 1);
    gl.enable(gl.DEPTH_TEST);

    setupKeyboard();
    setupMouse(canvas);

    // carregar texturas reais (tilemap)
    loadTextureFromFile("grama.jpg", true, (tex)=>{
        texFloor = tex;
        trySetupScene();
    });

    loadTextureFromFile("tijolo.jpg", true, (tex)=>{
        texWall = tex;
        trySetupScene();
    });

    // carregar texturas de cubos
    loadTextureFromFile("gato.jpg", false, (tex)=>{
        texGato = tex;
        trySetupScene();
    });

    loadTextureFromFile("cachorro.png", false, (tex)=>{
        texCachorro = tex;
        trySetupScene();
    });

    requestAnimationFrame(draw);
}

function trySetupScene()
{
    if(!texGato || !texCachorro || !texFloor || !texWall) return;
    if(objects.length > 0) return;

    setupScene();
}

// Configura a cena --------------------------------------------------------------
function setupScene()
{
    // chão
    let floorVerts = createPlane(30, 30);
    let floor = createObject(floorVerts, true, texFloor, null);
    objects.push(floor);

    let wallCubeVerts = createCube(1, 4);

    // parede esquerda
    let wall1 = createObject(wallCubeVerts, true, texWall, null);
    wall1.model = math.multiply4(math.translate(-8, 1.5, 0), math.scale(0.5, 3, 15));
    objects.push(wall1);

    // parede direita
    let wall2 = createObject(wallCubeVerts, true, texWall, null);
    wall2.model = math.multiply4(math.translate(8, 1.5, 0), math.scale(0.5, 3, 15));
    objects.push(wall2);

    // parede fundo
    let wall3 = createObject(wallCubeVerts, true, texWall, null);
    wall3.model = math.multiply4(math.translate(0, 1.5, -8), math.scale(16, 3, 0.5));
    objects.push(wall3);

    // cubo verde
    let cubeSolid = createObject(createCube(1), false, null, [0.1, 0.8, 0.2]);
    cubeSolid.model = math.multiply4(math.translate(2, 0.5, 2), math.scale(1,1,1));
    objects.push(cubeSolid);

    // cubo vermelho animado
    let cubeAnim = createObject(createCube(1), false, null, [0.9, 0.2, 0.2]);
    cubeAnim.isAnimated = true;
    cubeAnim.basePos = [-2, 1.0, 0];
    objects.push(cubeAnim);

    // coluna
    let pillar = createObject(createCube(1), true, texWall, null);
    pillar.model = math.multiply4(math.translate(0, 1.5, 3), math.scale(1,3,1));
    objects.push(pillar);

    // cubo gato
    let cubeGato = createObject(createCube(1), true, texGato, null);
    cubeGato.model = math.multiply4(math.translate(4, 0.5, 0), math.scale(1,1,1));
    objects.push(cubeGato);

    // cubo cachorro
    let cubeDog = createObject(createCube(1), true, texCachorro, null);
    cubeDog.model = math.multiply4(math.translate(-4, 0.5, 2), math.scale(1,1,1));
    objects.push(cubeDog);
}

// Atualiza camera -----------------------------------------
function updateCamera(dt)
{
    let speed = 3.0;
    if(keys["shift"]) speed = 6.0;

    let move = speed * dt;

    let forward = [
        Math.sin(yaw),
        0,
        Math.cos(yaw)
    ];

    let right = [
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    ];

    if(keys["w"]) {
        camPos[0] += forward[0] * move;
        camPos[2] += forward[2] * move;
    }
    if(keys["s"]) {
        camPos[0] -= forward[0] * move;
        camPos[2] -= forward[2] * move;
    }
    if(keys["a"]) {
        camPos[0] -= right[0] * move;
        camPos[2] -= right[2] * move;
    }
    if(keys["d"]) {
        camPos[0] += right[0] * move;
        camPos[2] += right[2] * move;
    }

    // gravidade
    velocityY += gravity;
    playerY += velocityY;

    if(playerY <= 1.5){
        playerY = 1.5;
        velocityY = 0;
        isGrounded = true;
    }

    camPos[1] = playerY;
}

function draw(time)
{
    time *= 0.001;

    let dt = time - lastTime;
    lastTime = time;

    updateCamera(dt);

    lightAngle += dt;
    let lightPos = [
        Math.cos(lightAngle) * 6,
        4.0,
        Math.sin(lightAngle) * 6
    ];

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let aspect = gl.canvas.width / gl.canvas.height;
    let proj = math.perspective(60 * Math.PI/180.0, aspect, 0.1, 200);

    let lookDir = [
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch)
    ];

    let target = [
        camPos[0] + lookDir[0],
        camPos[1] + lookDir[1],
        camPos[2] + lookDir[2]
    ];

    let view = math.lookAt(camPos, target, [0,1,0]);

    gl.uniformMatrix4fv(gl.getUniformLocation(prog, "u_view"), false, new Float32Array(view));
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, "u_proj"), false, new Float32Array(proj));

    gl.uniform3fv(gl.getUniformLocation(prog, "u_lightPos"), new Float32Array(lightPos));
    gl.uniform3fv(gl.getUniformLocation(prog, "u_lightColor"), new Float32Array([1,1,1]));
    gl.uniform3fv(gl.getUniformLocation(prog, "u_camPos"), new Float32Array(camPos));

    let posLoc = gl.getAttribLocation(prog, "position");
    let normLoc = gl.getAttribLocation(prog, "normal");
    let texLoc = gl.getAttribLocation(prog, "texCoord");

    for(let obj of objects)
    {
        let model = obj.model;

        if(obj.isAnimated)
        {
            let y = obj.basePos[1] + Math.sin(time*2.0)*0.5;
            let rot = math.rotateY(time * 2.0);

            let T = math.translate(obj.basePos[0], y, obj.basePos[2]);
            model = math.multiply4(T, rot);
        }

        gl.uniformMatrix4fv(gl.getUniformLocation(prog, "u_model"), false, new Float32Array(model));

        gl.uniform1i(gl.getUniformLocation(prog, "u_useTexture"), obj.useTexture ? 1 : 0);

        if(obj.useTexture)
        {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, obj.texture);
            gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);
        }
        else
        {
            gl.uniform3fv(gl.getUniformLocation(prog, "u_solidColor"), new Float32Array(obj.solidColor));
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buf);

        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 8*4, 0);

        gl.enableVertexAttribArray(normLoc);
        gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 8*4, 3*4);

        gl.enableVertexAttribArray(texLoc);
        gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 8*4, 6*4);

        gl.drawArrays(gl.TRIANGLES, 0, obj.vertexCount);
    }

    requestAnimationFrame(draw);
}
