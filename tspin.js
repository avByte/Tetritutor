// -------------------- T-SPIN MODE --------------------

// Canvas
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20,20);

const scoreElem = document.getElementById('score');
const levelElem = document.getElementById('level');

// Board
const boardWidth = 10;
const boardHeight = 20;
let board = Array.from({length:boardHeight},()=>Array(boardWidth).fill(0));

// Colors
const colors = [ null, '#FF00FF', '#FFFFFF' ]; // 1=T, 2=garbage

// Preset garbage
const presetBoard = [
  ...Array(17).fill(Array(boardWidth).fill(0)),
  [0,0,0,0,2,2,0,0,0,0],
  [0,0,0,0,0,2,2,0,0,0],
  [2,2,2,0,2,2,2,2,2,2]
];

// Player
const player = { pos:{x:0,y:0}, matrix:null, matrixType:'T' };
let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;

// -------------------- PIECES --------------------
function createPiece(type){
  if(type==='T') return [[0,1,0],[1,1,1],[0,0,0]];
}

// -------------------- DRAW --------------------
function drawMatrix(matrix, offset){
  matrix.forEach((row,y)=>{
    row.forEach((value,x)=>{
      if(value!==0){
        if(y+offset.y<0) return; // skip above board
        context.fillStyle = colors[value];
        context.fillRect(x+offset.x,y+offset.y,1,1);
        context.strokeStyle='#000';
        context.lineWidth=0.05;
        context.strokeRect(x+offset.x,y+offset.y,1,1);
      }
    });
  });
}

function drawGrid(){
  context.strokeStyle='#333';
  context.lineWidth=0.05;
  for(let x=0;x<=boardWidth;x++){
    context.beginPath();
    context.moveTo(x,0);
    context.lineTo(x,boardHeight);
    context.stroke();
  }
  for(let y=0;y<=boardHeight;y++){
    context.beginPath();
    context.moveTo(0,y);
    context.lineTo(boardWidth,y);
    context.stroke();
  }
}

function drawGhost(){
  const ghost={pos:{x:player.pos.x,y:player.pos.y},matrix:player.matrix};
  while(!collide(ghost)) ghost.pos.y++;
  ghost.pos.y--;
  drawMatrix(ghost.matrix,ghost.pos);
}

function draw(){
  context.fillStyle='#000';
  context.fillRect(0,0,canvas.width,canvas.height);
  drawGrid();
  drawMatrix(board,{x:0,y:0});
  drawGhost();
  drawMatrix(player.matrix,player.pos);
  scoreElem.innerText=0;
  levelElem.innerText=1;
}

// -------------------- COLLISION & MERGE --------------------
function collide(p){
  const m=p.matrix; const o=p.pos;
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x]!==0){
        if(y+o.y<0) continue;
        if(board[y+o.y] && board[y+o.y][x+o.x]!==0) return true;
      }
    }
  }
  return false;
}

function merge(){
  player.matrix.forEach((row,y)=>{
    row.forEach((value,x)=>{
      if(value!==0){
        board[y+player.pos.y][x+player.pos.x]=value;
      }
    });
  });
}

// -------------------- RESET --------------------
function playerReset(){
  for(let y=0;y<boardHeight;y++)
    for(let x=0;x<boardWidth;x++)
      board[y][x]=presetBoard[y][x];

  player.matrixType='T';
  player.matrix=createPiece('T');
  player.pos.y=-1;
  player.pos.x=Math.floor(boardWidth/2)-1;
}

// -------------------- ROTATION --------------------
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
  while(collide(player)){
    player.pos.x+=offset;
    offset=-(offset+(offset>0?1:-1));
    if(offset>player.matrix[0].length){rotate(player.matrix,-dir);player.pos.x=pos;return;}
  }
}

// -------------------- SWEEP & T-SPIN --------------------
function arenaSweep(){
  const tSpin=checkTSpin();
  let full=0;
  for(let y=boardHeight-1;y>=0;y--){
    if(board[y].every(v=>v!==0)){
      full++;
      board.splice(y,1);
      board.unshift(Array(boardWidth).fill(0));
      y++;
    }
  }
  if(tSpin){
    alert("Perfect!");
    playerReset();
  } else if(full>0){
    playerReset();
  }
}

function checkTSpin(){
  const x=player.pos.x; const y=player.pos.y;
  let corners=0;
  [[x,y],[x+2,y],[x,y+2],[x+2,y+2]].forEach(([cx,cy])=>{
    if(cy>=boardHeight||cx<0||cx>=boardWidth||board[cy][cx]!==0) corners++;
  });
  return corners>=3;
}

// -------------------- MOVE --------------------
function playerMove(dir){
  player.pos.x+=dir;
  if(collide(player)) player.pos.x-=dir;
}

function playerDrop(){
  player.pos.y++;
  if(collide(player)){
    player.pos.y--;
    merge();
    arenaSweep();
    playerReset();
    dropCounter=0;
  }
}

// -------------------- INPUT --------------------
document.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft') playerMove(-1);
  else if(event.key==='ArrowRight') playerMove(1);
  else if(event.key==='ArrowDown') playerDrop();
  else if(event.key==='ArrowUp') playerRotate(1);
  else if(event.key==='z') playerRotate(-1);
});

// -------------------- UPDATE --------------------
function update(time=0){
  const delta=time-lastTime;
  lastTime=time;
  dropCounter+=delta;
  if(dropCounter>dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

// -------------------- INIT --------------------
playerReset();
update();
