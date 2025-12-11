let pacman;
let ghosts = [];
let fruits = [];
let obstacles = [];
let walls = [];
let score = 0;
let fruitScore = 0;
let hasMissile = false;

let pacmanImg;

// Timer pour changer les murs
let wallChangeTimer = 0;
let wallChangeDuration = 180; // 3 secondes à 60fps

function preload() {
  pacmanImg = loadImage('assets/pacman.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Créer Pacman
  pacman = new Vehicle(width/2, height/2);
  pacman.maxSpeed = 5;
  pacman.maxForce = 0.3;
  pacman.r = 15;
  pacman.color = "yellow";
  
  // Créer 4 ghosts avec différentes couleurs
  let colors = ["red", "pink", "cyan", "orange"];
  for(let i = 0; i < 4; i++) {
    let ghost = new Vehicle(random(width), random(height));
    ghost.maxSpeed = 3;
    ghost.maxForce = 0.2;
    ghost.r = 15;
    ghost.color = colors[i];
    ghost.detectionRadius = 150;
    ghosts.push(ghost);
  }
  
  // Créer fruits
  for(let i = 0; i < 30; i++) {
    fruits.push(createVector(random(50, width-50), random(50, height-50)));
  }
  
  // Générer murs aléatoires
  generateWalls();
}

// Générer un labyrinthe structuré
function generateWalls() {
  walls = [];
  obstacles = [];
  
  let cellSize = 80;
  let cols = floor(width / cellSize);
  let rows = floor(height / cellSize);
  
  // Créer une grille de labyrinthe
  // Murs horizontaux
  for(let i = 1; i < rows; i++) {
    for(let j = 0; j < cols; j++) {
      if(random() < 0.4) { // 40% de chance de mur
        walls.push(new Wall(
          j * cellSize,
          i * cellSize - 10,
          cellSize - 5,
          20
        ));
      }
    }
  }
  
  // Murs verticaux
  for(let i = 0; i < rows; i++) {
    for(let j = 1; j < cols; j++) {
      if(random() < 0.4) { // 40% de chance de mur
        walls.push(new Wall(
          j * cellSize - 10,
          i * cellSize,
          20,
          cellSize - 5
        ));
      }
    }
  }
  
  // Bordures du labyrinthe
  // Haut
  walls.push(new Wall(0, 0, width, 20));
  // Bas
  walls.push(new Wall(0, height - 20, width, 20));
  // Gauche
  walls.push(new Wall(0, 0, 20, height));
  // Droite
  walls.push(new Wall(width - 20, 0, 20, height));
  
  // Quelques obstacles circulaires au centre des cellules
  for(let i = 0; i < 5; i++) {
    obstacles.push(new Obstacle(
      random(100, width - 100),
      random(100, height - 100),
      random(15, 25),
      "purple"
    ));
  }
}

function draw() {
  background(0);
  
  // Timer pour changer les murs
  wallChangeTimer++;
  if(wallChangeTimer >= wallChangeDuration) {
    generateWalls();
    wallChangeTimer = 0;
  }
  
  // Cible = position de la souris
  let target = createVector(mouseX, mouseY);
  
  // === PACMAN BEHAVIOR ===
  // Arrive à la souris
  let arriveForce = pacman.arrive(target);
  pacman.applyForce(arriveForce);
  
  // Éviter les murs rectangulaires
  for(let wall of walls) {
    if(wall.hits(pacman)) {
      // Repousser du mur
      let pushBack = p5.Vector.sub(pacman.pos, wall.pos);
      pushBack.setMag(pacman.maxSpeed);
      pacman.applyForce(pushBack);
    }
  }
  
  // Éviter les obstacles circulaires
  let avoidForce = pacman.avoidCorrige(obstacles);
  avoidForce.mult(3);
  pacman.applyForce(avoidForce);
  
  // Éviter les bords
  let boundaryForce = pacman.avoidBoundaries();
  boundaryForce.mult(2);
  pacman.applyForce(boundaryForce);
  
  pacman.update();
  
  // Contraindre Pacman dans l'écran (ne peut PAS sortir)
  pacman.pos.x = constrain(pacman.pos.x, pacman.r, width - pacman.r);
  pacman.pos.y = constrain(pacman.pos.y, pacman.r, height - pacman.r);
  
  // Dessiner Pacman avec image
  push();
  translate(pacman.pos.x, pacman.pos.y);
  rotate(pacman.vel.heading());
  imageMode(CENTER);
  image(pacmanImg, 0, 0, pacman.r * 2.5, pacman.r * 2.5);
  pop();
  
  // === GHOSTS BEHAVIOR ===
  for(let i = ghosts.length - 1; i >= 0; i--) {
    let ghost = ghosts[i];
    let d = p5.Vector.dist(ghost.pos, pacman.pos);
    
    // Si pacman proche -> PURSUE, sinon WANDER
    if(d < ghost.detectionRadius) {
      let pursueForce = ghost.pursue(pacman);
      pursueForce.mult(1.5);
      ghost.applyForce(pursueForce);
    } else {
      let wanderForce = ghost.wander();
      ghost.applyForce(wanderForce);
    }
    
    // SEPARATE des autres ghosts
    let separateForce = ghost.separate(ghosts);
    separateForce.mult(0.8);
    ghost.applyForce(separateForce);
    
    // Éviter les murs rectangulaires
    for(let wall of walls) {
      if(wall.hits(ghost)) {
        // Repousser du mur
        let pushBack = p5.Vector.sub(ghost.pos, wall.pos);
        pushBack.setMag(ghost.maxSpeed);
        ghost.applyForce(pushBack);
      }
    }
    
    // Éviter les obstacles circulaires
    let ghostAvoid = ghost.avoidCorrige(obstacles);
    ghostAvoid.mult(3);
    ghost.applyForce(ghostAvoid);
    
    // Éviter les bords
    let ghostBoundary = ghost.avoidBoundaries();
    ghostBoundary.mult(2);
    ghost.applyForce(ghostBoundary);
    
    ghost.update();
    
    // Contraindre Ghost dans l'écran (ne peut PAS sortir)
    ghost.pos.x = constrain(ghost.pos.x, ghost.r, width - ghost.r);
    ghost.pos.y = constrain(ghost.pos.y, ghost.r, height - ghost.r);
    
    // Dessiner ghost
    fill(ghost.color);
    noStroke();
    circle(ghost.pos.x, ghost.pos.y, ghost.r * 2);
    
    // Yeux du ghost
    fill(255);
    circle(ghost.pos.x - 5, ghost.pos.y - 3, 6);
    circle(ghost.pos.x + 5, ghost.pos.y - 3, 6);
    fill(0);
    circle(ghost.pos.x - 5, ghost.pos.y - 3, 3);
    circle(ghost.pos.x + 5, ghost.pos.y - 3, 3);
    
    // Zone de détection (debug)
    if(d < ghost.detectionRadius) {
      noFill();
      stroke(255, 0, 0, 100);
      strokeWeight(2);
      circle(ghost.pos.x, ghost.pos.y, ghost.detectionRadius * 2);
    }
    
    // Si ghost touche pacman -> GAME OVER
    if(d < pacman.r + ghost.r) {
      noLoop();
      fill(255, 0, 0);
      textSize(64);
      textAlign(CENTER, CENTER);
      text("GAME OVER!", width/2, height/2);
      textSize(24);
      text("Score: " + score, width/2, height/2 + 50);
      textSize(20);
      fill(100, 200, 255);
      text("Click to Play Again", width/2, height/2 + 100);
      return;
    }
  }
  
  // === FRUITS ===
  for(let i = fruits.length - 1; i >= 0; i--) {
    let fruit = fruits[i];
    fill(0, 255, 0);
    noStroke();
    circle(fruit.x, fruit.y, 10);
    
    // Si pacman mange fruit
    let d = p5.Vector.dist(pacman.pos, fruit);
    if(d < pacman.r) {
      fruits.splice(i, 1);
      score += 10;
      fruitScore++;
      
      // 5 fruits = missile
      if(fruitScore >= 5) {
        hasMissile = true;
        fruitScore = 0;
      }
    }
  }
  
  // === MURS RECTANGULAIRES ===
  for(let wall of walls) {
    wall.show();
  }
  
  // === OBSTACLES (MURS) ===
  for(let obstacle of obstacles) {
    obstacle.show();
  }
  
  // === UI ===
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT);
  text("Score: " + score, 20, 30);
  text("Fruits: " + fruitScore + "/5", 20, 60);
  
  if(hasMissile) {
    fill(255, 255, 0);
    text("MISSILE READY! Click to fire!", 20, 90);
  }
  
  // Timer murs
  let timeLeft = (wallChangeDuration - wallChangeTimer) / 60;
  fill(100, 200, 255);
  text("Walls change in: " + timeLeft.toFixed(1) + "s", 20, 120);
  
  // VICTOIRE - Tous les ghosts tués
  if(ghosts.length === 0) {
    noLoop();
    fill(0, 255, 0);
    textSize(64);
    textAlign(CENTER, CENTER);
    text("YOU WIN!", width/2, height/2);
    textSize(24);
    text("All Ghosts Eliminated!", width/2, height/2 + 50);
    text("Final Score: " + score, width/2, height/2 + 80);
    textSize(20);
    fill(100, 200, 255);
    text("Click to Play Again", width/2, height/2 + 120);
  }
}

// Tirer le missile ou Restart
function mousePressed() {
  // Si jeu terminé -> Restart
  if(!isLooping()) {
    restartGame();
    return;
  }
  
  if(hasMissile && ghosts.length > 0) {
    // Trouve le ghost le plus proche
    let closest = ghosts[0];
    let minDist = Infinity;
    
    for(let ghost of ghosts) {
      let d = p5.Vector.dist(pacman.pos, ghost.pos);
      if(d < minDist) {
        minDist = d;
        closest = ghost;
      }
    }
    
    // Tue le ghost
    let index = ghosts.indexOf(closest);
    ghosts.splice(index, 1);
    hasMissile = false;
    score += 100;
    
    // Ajouter 5 fruits bonus
    for(let i = 0; i < 5; i++) {
      fruits.push(createVector(random(50, width-50), random(50, height-50)));
    }
  }
}

// Recommencer le jeu
function restartGame() {
  // Réinitialiser toutes les variables
  score = 0;
  fruitScore = 0;
  hasMissile = false;
  wallChangeTimer = 0;
  
  // Recréer Pacman
  pacman = new Vehicle(width/2, height/2);
  pacman.maxSpeed = 5;
  pacman.maxForce = 0.3;
  pacman.r = 15;
  pacman.color = "yellow";
  
  // Recréer ghosts
  ghosts = [];
  let colors = ["red", "pink", "cyan", "orange"];
  for(let i = 0; i < 4; i++) {
    let ghost = new Vehicle(random(width), random(height));
    ghost.maxSpeed = 3;
    ghost.maxForce = 0.2;
    ghost.r = 15;
    ghost.color = colors[i];
    ghost.detectionRadius = 150;
    ghosts.push(ghost);
  }
  
  // Recréer fruits
  fruits = [];
  for(let i = 0; i < 30; i++) {
    fruits.push(createVector(random(50, width-50), random(50, height-50)));
  }
  
  // Regénérer labyrinthe
  generateWalls();
  
  // Relancer le jeu
  loop();
}