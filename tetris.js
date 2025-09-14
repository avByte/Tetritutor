const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
nextCtx.scale(20, 20);

const holdCanvas = document.getElementById('hold');
const holdCtx = holdCanvas.getContext('2d');
holdCtx.scale(20, 20);

const scoreElem = document.getElementById('score');
const levelElem = document.getElementById('level');

const colors = [
  null,
  '#FF00FF', //T-piece
  '#FFFF00', //I-piece
  '#FFA500', //L-piece
  '#00008B', //J-piece
  '#ADD8E6', //O-piece
  '#32CD32', //S-piece
  '#FF0000', //Z-piece
];


const arena = createMatrix(12, 20);

function createMatrix(w, h) {
  const matrix = [];
  while (h--) matrix.push(new Array(w).fill(0));
  return matrix;
}

function createPiece(type) {
  if (type === 'T') return [[0,0,0],[1,1,1],[0,1,0]];
  if (type === 'O') return [[2,2],[2,2]];
  if (type === 'L') return [[0,3,0],[0,3,0],[0,3,3]];
  if (type === 'J') return [[0,4,0],[0,4,0],[4,4,0]];
  if (type === 'I') return [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]];
  if (type === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
  if (type === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

function drawMatrix(matrix, offset, ctx=context){
  matrix.forEach((row,y)=>row.forEach((value,x)=>{
    if(value!==0){
      ctx.fillStyle = colors[value];
      ctx.fillRect(x+offset.x, y+offset.y,1,1);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.05;
      ctx.strokeRect(x+offset.x, y+offset.y,1,1);
    }
  }));
}

function drawGrid(ctx, width, height){
  ctx.strokeStyle='#333';
  ctx.lineWidth=0.05;
  for(let x=0;x<=width;x++){
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,height);
    ctx.stroke();
  }
  for(let y=0;y<=height;y++){
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(width,y);
    ctx.stroke();
  }
}

function drawGhost(player){
  const ghost={pos:{x:player.pos.x,y:player.pos.y},matrix:player.matrix};
  while(!collide(arena,ghost)) ghost.pos.y++;
  ghost.pos.y--;
  ghost.matrix.forEach((row,y)=>row.forEach((value,x)=>{
    if(value!==0){
      context.fillStyle = colors[value]+'55';
      context.fillRect(x+ghost.pos.x,y+ghost.pos.y,1,1);
      context.strokeStyle='#555';
      context.lineWidth=0.05;
      context.strokeRect(x+ghost.pos.x,y+ghost.pos.y,1,1);
    }
  }));
}

function merge(arena,player){
  player.matrix.forEach((row,y)=>row.forEach((value,x)=>{
    if(value!==0) arena[y+player.pos.y][x+player.pos.x]=value;
  }));
}

function collide(arena,player){
  const m=player.matrix; const o=player.pos;
  for(let y=0;y<m.length;y++)
    for(let x=0;x<m[y].length;x++)
      if(m[y][x]!==0&&(arena[y+o.y]&&arena[y+o.y][x+o.x])!==0) return true;
  return false;
}

let score=0;
let level=1;
let linesCleared=0;
let lastClear=0;
let lastTSpin=false;
let dropInterval=1000;

function arenaSweep(tSpin=false){
  let rowCount=0;
  outer: for(let y=arena.length-1;y>=0;--y){
    for(let x=0;x<arena[y].length;x++)
      if(arena[y][x]===0) continue outer;
    const row=arena.splice(y,1)[0].fill(0);
    arena.unshift(row);
    y++;
    rowCount++;
  }
  lastClear=rowCount;
  if(rowCount>0){
    linesCleared+=rowCount;
    const pointsTable=[0,40,100,300,1200];
    let points=pointsTable[rowCount];
    if(tSpin) points*=2;
    score+=points*level;
    level=Math.floor(linesCleared/10)+1;
    dropInterval=Math.max(100,1000-(level-1)*100);
    updateScore();
  }
  return rowCount;
}

function updateScore(){
  scoreElem.innerText=score;
  levelElem.innerText=level;
}

function draw(){
  context.fillStyle='#000';
  context.fillRect(0,0,canvas.width,canvas.height);
  drawGrid(context,arena[0].length,arena.length);
  drawMatrix(arena,{x:0,y:0});
  drawGhost(player);
  drawMatrix(player.matrix,player.pos);

  // Next piece
  nextCtx.fillStyle='#000';
  nextCtx.fillRect(0,0,nextCanvas.width,nextCanvas.height);
  drawMatrix(createPiece(next[0]),{x:1,y:1},nextCtx);

  // Hold piece
  holdCtx.fillStyle='#000';
  holdCtx.fillRect(0,0,holdCanvas.width,holdCanvas.height);
  if(hold) drawMatrix(createPiece(hold),{x:1,y:1},holdCtx);

  // Line clear flash
  if(lastClear>0){
    context.fillStyle='rgba(255,255,255,0.3)';
    for(let i=0;i<lastClear;i++){
      context.fillRect(0,arena.length-lastClear+i,arena[0].length,1);
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

let dropCounter=0;
let lastTime=0;
function update(time=0){
  const deltaTime=time-lastTime;
  lastTime=time;
  dropCounter+=deltaTime;
  if(dropCounter>dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

function playerDrop(){
  player.pos.y++;
  if(collide(arena,player)){
    player.pos.y--;
    lastTSpin=checkTSpin(player);
    merge(arena,player);
    arenaSweep(lastTSpin);
    playerReset();
    holdUsed=false;
  }
  dropCounter=0;
}

function playerHardDrop(){
  while(!collide(arena,player)) player.pos.y++;
  player.pos.y--;
  lastTSpin=checkTSpin(player);
  merge(arena,player);
  arenaSweep(lastTSpin);
  playerReset();
  holdUsed=false;
  dropCounter=0;
}

function playerMove(dir){
  player.pos.x+=dir;
  if(collide(arena,player)) player.pos.x-=dir;
}

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
  while(collide(arena,player)){
    player.pos.x+=offset;
    offset=-(offset+(offset>0?1:-1));
    if(offset>player.matrix[0].length){rotate(player.matrix,-dir);player.pos.x=pos;return;}
  }
}

function checkTSpin(player){
  if(player.matrixType!=='T') return false;
  let corners=0;
  const x=player.pos.x; const y=player.pos.y;
  [[x,y],[x+2,y],[x,y+2],[x+2,y+2]].forEach(([cx,cy])=>{
    if(cy>=arena.length||cx<0||cx>=arena[0].length||arena[cy][cx]!==0) corners++;
  });
  return corners>=3;
}

function playerReset(){
  const pieces='TJLOSZI';
  if(next.length===0) next.push(pieces[(pieces.length*Math.random())|0]);
  player.matrixType=next.shift();
  player.matrix=createPiece(player.matrixType);
  next.push(pieces[(pieces.length*Math.random())|0]);
  player.pos.y=0;
  player.pos.x=((arena[0].length/2)|0)-((player.matrix[0].length/2)|0);
  if(collide(arena,player)){
    arena.forEach(row=>row.fill(0));
    score=0; linesCleared=0; level=1; dropInterval=1000;
    updateScore();
  }
}

let hold=null;
let holdUsed=false;
let next=[];

const player={pos:{x:0,y:0},matrix:null,matrixType:null};
const pieces='TJLOSZI';
player.matrixType=pieces[(pieces.length*Math.random())|0];
player.matrix=createPiece(player.matrixType);
player.pos.y=0;
player.pos.x=((arena[0].length/2)|0)-((player.matrix[0].length/2)|0);
next.push(pieces[(pieces.length*Math.random())|0]);

function playerHold(){
  if(!holdUsed){
    if(hold){
      [hold,player.matrixType]=[player.matrixType,hold];
      player.matrix=createPiece(player.matrixType);
      player.pos.y=0;
      player.pos.x=((arena[0].length/2)|0)-((player.matrix[0].length/2)|0);
    }else{
      hold=player.matrixType;
      playerReset();
    }
    holdUsed=true;
  }
}

document.addEventListener('keydown',event=>{
  if(event.keyCode===37) playerMove(-1);
  else if(event.keyCode===39) playerMove(1);
  else if(event.keyCode===40){playerDrop();}
  else if(event.keyCode===81) playerRotate(-1);
  else if(event.keyCode===87||event.keyCode===38) playerRotate(1);
  else if(event.keyCode===32) playerHardDrop();
  else if(event.keyCode===16) playerHold();
});

update();
