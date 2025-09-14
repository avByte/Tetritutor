// ------------------------- CANVAS SETUP -------------------------
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCanvas = document.getElementById('next');
let nextCtx = null;
if (nextCanvas) {
  nextCtx = nextCanvas.getContext('2d');
  nextCtx.scale(20, 20);
}

const holdCanvas = document.getElementById('hold');
let holdCtx = null;
if (holdCanvas) {
  holdCtx = holdCanvas.getContext('2d');
  holdCtx.scale(20, 20);
}


const scoreElem = document.getElementById('score');
const levelElem = document.getElementById('level');

//Tetronimo colours
const colors = [
  null,
  '#fa90e8', //T
  '#FDFD96', //O
  '#F1b978', //L
  '#2E5984', //J
  '#b4e0d1', //I
  '#98FB98', //S
  '#D9544D', //Z
  '#FFFFFF', //Garbage
];

//Board
const board = createMatrix(10, 20);

function createMatrix(w,h){
  const matrix = [];
  while(h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

//Pieces
function createPiece(type){
  if(type==='T') return [[0,0,0],[1,1,1],[0,1,0]];
  if(type==='O') return [[2,2],[2,2]];
  if(type==='L') return [[0,3,0],[0,3,0],[0,3,3]];
  if(type==='J') return [[0,4,0],[0,4,0],[4,4,0]];
  if(type==='I') return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
  if(type==='S') return [[0,6,6],[6,6,0],[0,0,0]];
  if(type==='Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

//Draw
function drawMatrix(matrix, offset, ctx=context){
  matrix.forEach((row,y)=>{
    row.forEach((value,x)=>{
      if(value!==0){
        ctx.fillStyle = colors[value];
        ctx.fillRect(x+offset.x, y+offset.y, 1, 1);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.05;
        ctx.strokeRect(x+offset.x, y+offset.y,1,1);
      }
    });
  });
}

function drawGrid(ctx, width, height){
  ctx.strokeStyle='#333';
  ctx.lineWidth=0.05;
  
  for(let x=0; x<=width; x++){
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for(let y=0; y<=height; y++){
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}


//Ghost block
function drawGhost(player){
  const ghost = {pos:{x:player.pos.x, y:player.pos.y}, matrix:player.matrix};
  while(!collide(board,ghost)) ghost.pos.y++;
  ghost.pos.y--;
  ghost.matrix.forEach((row,y)=>{
    row.forEach((value,x)=>{
      if(value!==0){
        context.fillStyle = colors[value]+'55';
        context.fillRect(x+ghost.pos.x, y+ghost.pos.y,1,1);
        context.strokeStyle='#555';
        context.lineWidth=0.05;
        context.strokeRect(x+ghost.pos.x, y+ghost.pos.y,1,1);
      }
    });
  });
}

//Merge & Collision
function merge(board,player){
  player.matrix.forEach((row,y)=>{
    row.forEach((value,x)=>{
      if(value!==0) board[y+player.pos.y][x+player.pos.x]=value;
    });
  });
}

function collide(board,player){
  const m=player.matrix;
  const o=player.pos;
  for(let y=0;y<m.length;y++)
    for(let x=0;x<m[y].length;x++)
      if(m[y][x]!==0&&(board[y+o.y]&&board[y+o.y][x+o.x])!==0)
        return true;
  return false;
}

//Scoring
let score=0, level=1, linesCleared=0, lastClear=0, lastTSpin=false;
let dropInterval=1000;

function boardSweep(tSpin=false){
  let rowCount=0;
  outer: for(let y=board.length-1;y>=0;--y){
    for(let x=0;x<board[y].length;x++)
      if(board[y][x]===0) continue outer;
    board.splice(y,1);
    board.unshift(new Array(board[0].length).fill(0));
    rowCount++;
    y++;
  }
  lastClear = rowCount;
  if(rowCount>0){
    linesCleared += rowCount;
    const pointsTable = [0,40,100,300,1200];
    let points = pointsTable[rowCount];
    if(tSpin) points*=2;
    score += points*level;
    level = Math.floor(linesCleared/10)+1;
    dropInterval = Math.max(100,1000-(level-1)*100);
    updateScore();
  }
  return rowCount;
}

function updateScore(){
  scoreElem.innerText=score;
  levelElem.innerText=level;
}

//Draw loop
function draw(){
  // Fill only the board area
  context.fillStyle = '#000';
  context.fillRect(0,0,board[0].length,board.length);
  
  drawGrid(context, board[0].length, board.length);
  drawMatrix(board, {x:0, y:0});
  drawGhost(player);
  drawMatrix(player.matrix, player.pos);

  //Next piece
  nextCtx.fillStyle='#000';
  nextCtx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
  drawMatrix(createPiece(next[0]),{x:1,y:1},nextCtx);

  //Hold piece
  holdCtx.fillStyle='#000';
  holdCtx.fillRect(0,0,holdCanvas.width,holdCanvas.height);
  if(hold) drawMatrix(createPiece(hold),{x:1,y:1},holdCtx);

  //Line clear flash
  if(lastClear>0){
    context.fillStyle='rgba(255,255,255,0.3)';
    for(let i=0;i<lastClear;i++){
      context.fillRect(0,board.length-lastClear+i,board[0].length,1);
    }
    if(lastTSpin){
      context.fillStyle='rgba(255,0,255,0.5)';
      context.font='0.5px Arial';
      context.fillText('T-SPIN!',1,2);
    }
    lastClear=0;
    lastTSpin=false;
  }
}

//Update loop
let dropCounter=0, lastTime=0;
function update(time=0){
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if(dropCounter>dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

//Player actions
function playerDrop(){
  player.pos.y++;
  if(collide(board,player)){
    player.pos.y--;
    lastTSpin = checkTSpin(player);
    merge(board,player);
    boardSweep(lastTSpin);
    playerReset();
    holdUsed=false;
  }
  dropCounter=0;
}

function playerHardDrop(){
  while(!collide(board,player)) player.pos.y++;
  player.pos.y--;
  lastTSpin = checkTSpin(player);
  merge(board,player);
  boardSweep(lastTSpin);
  playerReset();
  holdUsed=false;
  dropCounter=0;
}

function playerMove(dir){
  player.pos.x+=dir;
  if(collide(board,player)) player.pos.x-=dir;
}

//Rotations
function rotate(matrix,dir){
  for(let y=0;y<matrix.length;y++)
    for(let x=0;x<y;x++)
      [matrix[x][y],matrix[y][x]]=[matrix[y][x],matrix[x][y]];
  if(dir>0) matrix.forEach(row=>row.reverse());
  else matrix.reverse();
}

function playerRotate(dir){
  const pos=player.pos.x;
  let offset=1;
  rotate(player.matrix,dir);
  while(collide(board,player)){
    player.pos.x+=offset;
    offset=-(offset+(offset>0?1:-1));
    if(offset>player.matrix[0].length){rotate(player.matrix,-dir);player.pos.x=pos;return;}
  }
}

//T-Spin
function checkTSpin(player){
  if(player.matrixType!=='T') return false;
  let corners=0;
  const x=player.pos.x; const y=player.pos.y;
  [[x,y],[x+2,y],[x,y+2],[x+2,y+2]].forEach(([cx,cy])=>{
    if(cy>=board.length||cx<0||cx>=board[0].length||board[cy][cx]!==0) corners++;
  });
  return corners>=3;
}

//7-Bag
let bag = [];
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j = Math.floor(Math.random()* (i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
  return array;
}
function refillBag(){ bag = shuffle(['T','J','L','I','S','Z','O']); }
function getNextPiece(){
  if(bag.length===0) refillBag();
  return bag.pop();
}

//Reset board
let next = [], hold=null, holdUsed=false;

const player = {pos:{x:0,y:0}, matrix:null, matrixType:null};

function playerReset(){
  // Pull the next piece from the next queue
  if(next.length === 0) next.push(getNextPiece());
  player.matrixType = next.shift();
  player.matrix = createPiece(player.matrixType);
  player.pos.y = 0;
  player.pos.x = ((board[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);

  // Refill next queue to always have at least 1 piece for preview
  while(next.length < 1) next.push(getNextPiece());

  if(collide(board, player)){
    arena.forEach(row=>row.fill(0));
    score = 0;
    linesCleared = 0;
    level = 1;
    dropInterval = 1000;
    updateScore();
  }
}


//Hold
function playerHold(){
  if(!holdUsed){
    if(hold){
      [hold,player.matrixType] = [player.matrixType, hold];
      player.matrix = createPiece(player.matrixType);
      player.pos.y=0;
      player.pos.x=((board[0].length/2)|0)-((player.matrix[0].length/2)|0);
    }else{
      hold = player.matrixType;
      playerReset();
    }
    holdUsed=true;
  }
}

//Controls
document.addEventListener('keydown',event=>{
  if(event.keyCode===37) playerMove(-1);
  else if(event.keyCode===39) playerMove(1);
  else if(event.keyCode===40) playerDrop();
  else if(event.keyCode===81) playerRotate(-1);
  else if(event.keyCode===87||event.keyCode===38) playerRotate(1);
  else if(event.keyCode===32) playerHardDrop();
  else if(event.keyCode===16) playerHold();
});

function toggleMenu() {
  const menu = document.getElementById('menuDropdown');
  menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
}

function resetGame() {
  //Clear arena
  arena.forEach(row => row.fill(0));

  //Reset score and level
  score = 0;
  level = 1;
  linesCleared = 0;
  dropInterval = 1000;
  updateScore();

  //Reset hold and next
  hold = null;
  holdUsed = false;
  next = [];

  //Refill bag and next queue
  bag = [];
  refillBag();
  next.push(getNextPiece());

  //Reset player
  playerReset();

  //Hide menu if open
  const menu = document.getElementById('menuDropdown');
  if(menu) menu.style.display = 'none';
}


//Run game
playerReset();
update();
