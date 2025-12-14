let pacman;
let miniPacman; // Petit Pacman qui suit le grand
let ghosts = [];
let fruits = [];
let obstacles = [];
let walls = [];
let score = 0;
let fruitScore = 0;
let hasMissile = false;

let pacmanImg;
let miniPacmanImg;

// Timer pour changer les murs
let wallChangeTimer = 0;
let wallChangeDuration = 600; // 10 secondes à 60fps

function preload() {
  pacmanImg = loadImage('assets/pacman.png');
  miniPacmanImg = loadImage('assets/minipacman.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Créer Pacman
  pacman = new Vehicle(width/2, height/2);
  pacman.maxSpeed = 5;
  pacman.maxForce = 0.3;
  pacman.r = 15;
  pacman.color = "yellow";
  
  // Créer Mini Pacman (suit le grand Pacman)
  // Code inspiré de 2-PursueEvade/sketch.js
  // Start at the same position as pacman
  miniPacman = new Vehicle(width/2, height/2);
  miniPacman.maxSpeed = 4;
  miniPacman.maxForce = 0.25;
  miniPacman.r = 10;
  miniPacman.color = "orange";
  
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
  
  // Créer fruits avec durée de vie
  for(let i = 0; i < 30; i++) {
    fruits.push({
      pos: createVector(random(50, width-50), random(50, height-50)),
      lifespan: random(180, 420) // Durée de vie entre 3 et 7 secondes (à 60fps)
    });
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
  
  // Quelques obstacles circulaires stratégiquement placés
  for(let i = 0; i < 8; i++) {
    obstacles.push(new Obstacle(
      random(100, width - 100),
      random(100, height - 100),
      random(20, 35),
      "purple"
    ));
  }
}

// La fonction draw est appelée en boucle par p5.js, 60 fois par seconde par défaut
function draw() {
  // Fond noir pour le canvas
  background(0);
  
  // Incrémenter le timer pour changer les murs
  wallChangeTimer++;
  if(wallChangeTimer >= wallChangeDuration) {
    generateWalls();
    wallChangeTimer = 0;
  }
  
  // La cible est la position de la souris (pour le comportement arrive)
  let target = createVector(mouseX, mouseY);
  
  // ============================================
  // === COMPORTEMENT DU PACMAN (principal) ===
  // ============================================
  
  // Comportement "arrive" : se dirige vers la souris et ralentit en approchant
  let arriveForce = pacman.arrive(target);
  pacman.applyForce(arriveForce);
  
  // Éviter les murs rectangulaires (collision avec les murs)
  for(let wall of walls) {
    if(wall.hits(pacman)) {
      // Calculer une force de répulsion depuis le mur
      let pushBack = p5.Vector.sub(pacman.pos, wall.pos);
      pushBack.setMag(pacman.maxSpeed);
      pacman.applyForce(pushBack);
    }
  }
  
  // Éviter les obstacles circulaires (comportement d'évitement)
  let avoidForce = pacman.avoidCorrige(obstacles);
  avoidForce.mult(3);
  pacman.applyForce(avoidForce);
  
  // Éviter les bords du canvas (force de répulsion)
  let boundaryForce = pacman.avoidBoundaries();
  boundaryForce.mult(2);
  pacman.applyForce(boundaryForce);
  
  // Mettre à jour la position, vitesse et accélération du pacman
  pacman.update();
  
  // Contraindre la position du Pacman dans l'écran (ne peut PAS sortir)
  pacman.pos.x = constrain(pacman.pos.x, pacman.r, width - pacman.r);
  pacman.pos.y = constrain(pacman.pos.y, pacman.r, height - pacman.r);
  
  // Dessiner le Pacman avec l'image chargée
  // On utilise push/pop pour ne pas affecter les autres dessins
  push();
  translate(pacman.pos.x, pacman.pos.y);
  // Rotation selon la direction du vecteur vitesse
  rotate(pacman.vel.heading());
  imageMode(CENTER);
  image(pacmanImg, 0, 0, pacman.r * 2.5, pacman.r * 2.5);
  pop();
  
  // ============================================
  // === COMPORTEMENT DU MINI PACMAN (suiveur) ===
  // ============================================
  
  // Comportement "leader-follower" : le mini pacman suit le grand pacman
  // en maintenant une petite distance derrière lui
  let followDistance = 40; // Distance de suivi en pixels
  let d = p5.Vector.dist(miniPacman.pos, pacman.pos);
  
  if(d > followDistance) {
    // Si trop loin, utiliser le comportement "arrive" pour se rapprocher
    // et ralentir en approchant de la distance de suivi
    let arriveForce = miniPacman.arrive(pacman.pos);
    arriveForce.mult(1.5);
    miniPacman.applyForce(arriveForce);
  } else {
    // Si assez proche, appliquer une force de freinage
    // pour maintenir la distance sans dépasser
    let vel = miniPacman.vel.copy();
    vel.mult(-0.5); // Force de freinage
    miniPacman.applyForce(vel);
  }
  
  // Éviter les murs rectangulaires
  for(let wall of walls) {
    if(wall.hits(miniPacman)) {
      let pushBack = p5.Vector.sub(miniPacman.pos, wall.pos);
      pushBack.setMag(miniPacman.maxSpeed);
      miniPacman.applyForce(pushBack);
    }
  }
  
  // Éviter les obstacles circulaires
  let miniAvoidForce = miniPacman.avoidCorrige(obstacles);
  miniAvoidForce.mult(3);
  miniPacman.applyForce(miniAvoidForce);
  
  // Éviter les bords du canvas
  let miniBoundaryForce = miniPacman.avoidBoundaries();
  miniBoundaryForce.mult(2);
  miniPacman.applyForce(miniBoundaryForce);
  
  // Mettre à jour la position du mini pacman
  miniPacman.update();
  
  // Contraindre Mini Pacman dans l'écran
  miniPacman.pos.x = constrain(miniPacman.pos.x, miniPacman.r, width - miniPacman.r);
  miniPacman.pos.y = constrain(miniPacman.pos.y, miniPacman.r, height - miniPacman.r);
  
  // Dessiner le Mini Pacman avec l'image (sans rotation pour garder l'image droite)
  push();
  translate(miniPacman.pos.x, miniPacman.pos.y);
  // Pas de rotation - on garde l'image toujours droite
  imageMode(CENTER);
  image(miniPacmanImg, 0, 0, miniPacman.r * 2.5, miniPacman.r * 2.5);
  pop();
  
  // Le Mini Pacman peut aussi manger les fruits
  for(let i = fruits.length - 1; i >= 0; i--) {
    let fruit = fruits[i];
    let d = p5.Vector.dist(miniPacman.pos, fruit.pos);
    if(d < miniPacman.r) {
      // Faire réapparaître le fruit à une nouvelle position
      fruit.pos.x = random(50, width-50);
      fruit.pos.y = random(50, height-50);
      fruit.lifespan = random(180, 420);
      score += 5; // Moins de points que le grand Pacman
    }
  }
  
  // ============================================
  // === COMPORTEMENT DES FANTÔMES (ennemis) ===
  // ============================================
  for(let i = ghosts.length - 1; i >= 0; i--) {
    let ghost = ghosts[i];
    // Calculer la distance entre le ghost et pacman
    let d = p5.Vector.dist(ghost.pos, pacman.pos);
    
    // Si pacman est dans le rayon de détection -> comportement "pursue"
    // Sinon -> comportement "wander" (errance aléatoire)
    if(d < ghost.detectionRadius) {
      // Comportement "pursue" : poursuivre le pacman
      let pursueForce = ghost.pursue(pacman);
      pursueForce.mult(1.5);
      ghost.applyForce(pursueForce);
    } else {
      // Comportement "wander" : déplacement aléatoire naturel
      let wanderForce = ghost.wander();
      ghost.applyForce(wanderForce);
    }
    
    // Comportement "separate" : séparation des autres ghosts pour éviter l'entassement
    let separateForce = ghost.separate(ghosts);
    separateForce.mult(0.8);
    ghost.applyForce(separateForce);
    
    // Éviter les murs rectangulaires
    for(let wall of walls) {
      if(wall.hits(ghost)) {
        // Calculer une force de répulsion depuis le mur
        let pushBack = p5.Vector.sub(ghost.pos, wall.pos);
        pushBack.setMag(ghost.maxSpeed);
        ghost.applyForce(pushBack);
      }
    }
    
    // Éviter les obstacles circulaires
    let ghostAvoid = ghost.avoidCorrige(obstacles);
    ghostAvoid.mult(3);
    ghost.applyForce(ghostAvoid);
    
    // Éviter les bords du canvas
    let ghostBoundary = ghost.avoidBoundaries();
    ghostBoundary.mult(2);
    ghost.applyForce(ghostBoundary);
    
    // Mettre à jour la position du ghost
    ghost.update();
    
    // Contraindre le Ghost dans l'écran (ne peut PAS sortir)
    ghost.pos.x = constrain(ghost.pos.x, ghost.r, width - ghost.r);
    ghost.pos.y = constrain(ghost.pos.y, ghost.r, height - ghost.r);
    
    // Dessiner le ghost avec sa couleur
    fill(ghost.color);
    noStroke();
    circle(ghost.pos.x, ghost.pos.y, ghost.r * 2);
    
    // Dessiner les yeux du ghost
    fill(255);
    circle(ghost.pos.x - 5, ghost.pos.y - 3, 6);
    circle(ghost.pos.x + 5, ghost.pos.y - 3, 6);
    fill(0);
    circle(ghost.pos.x - 5, ghost.pos.y - 3, 3);
    circle(ghost.pos.x + 5, ghost.pos.y - 3, 3);
    
    // Afficher la zone de détection (mode debug)
    if(d < ghost.detectionRadius) {
      noFill();
      stroke(255, 0, 0, 100);
      strokeWeight(2);
      circle(ghost.pos.x, ghost.pos.y, ghost.detectionRadius * 2);
    }
    
    // Détecter la collision entre ghost et pacman -> GAME OVER
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
    
    // Détecter la collision entre ghost et mini pacman -> GAME OVER aussi
    let dMini = p5.Vector.dist(ghost.pos, miniPacman.pos);
    if(dMini < miniPacman.r + ghost.r) {
      noLoop();
      fill(255, 0, 0);
      textSize(64);
      textAlign(CENTER, CENTER);
      text("GAME OVER!", width/2, height/2);
      textSize(24);
      text("Mini Pacman was caught!", width/2, height/2 + 50);
      text("Score: " + score, width/2, height/2 + 80);
      textSize(20);
      fill(100, 200, 255);
      text("Click to Play Again", width/2, height/2 + 120);
      return;
    }
  }
  
  // ============================================
  // === GESTION DES FRUITS ===
  // ============================================
  for(let i = fruits.length - 1; i >= 0; i--) {
    let fruit = fruits[i];
    
    // Décrémenter la durée de vie du fruit
    fruit.lifespan--;
    
    // Si la durée de vie est écoulée, faire réapparaître le fruit ailleurs
    if(fruit.lifespan <= 0) {
      fruit.pos.x = random(50, width-50);
      fruit.pos.y = random(50, height-50);
      fruit.lifespan = random(180, 420); // Nouvelle durée de vie aléatoire
    }
    
    // Effet de clignotement quand le fruit va disparaître (dernière seconde)
    let isBlinking = fruit.lifespan < 60 && frameCount % 10 < 5;
    
    if(!isBlinking) {
      // Dessiner le fruit avec gradient du vert vers le rouge selon la durée de vie
      // Plus le fruit est vieux, plus il devient rouge
      let lifePercent = fruit.lifespan / 420; // Pourcentage de vie restante
      let r = map(lifePercent, 0, 1, 255, 0); // Rouge augmente quand vie diminue
      let g = map(lifePercent, 0, 1, 0, 255); // Vert diminue quand vie diminue
      fill(r, g, 0);
      noStroke();
      circle(fruit.pos.x, fruit.pos.y, 10);
    }
    
    // Vérifier si pacman mange le fruit
    let d = p5.Vector.dist(pacman.pos, fruit.pos);
    if(d < pacman.r) {
      // Faire réapparaître le fruit à une nouvelle position
      fruit.pos.x = random(50, width-50);
      fruit.pos.y = random(50, height-50);
      fruit.lifespan = random(180, 420);
      
      score += 10;
      fruitScore++;
      
      // Si 5 fruits mangés -> obtenir un missile
      if(fruitScore >= 5) {
        hasMissile = true;
        fruitScore = 0;
      }
    }
  }
  
  // ============================================
  // === AFFICHAGE DES MURS ET OBSTACLES ===
  // ============================================
  
  // Dessiner tous les murs rectangulaires
  for(let wall of walls) {
    wall.show();
  }
  
  // Dessiner tous les obstacles circulaires
  for(let obstacle of obstacles) {
    obstacle.show();
  }
  
  // ============================================
  // === INTERFACE UTILISATEUR (UI) ===
  // ============================================
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT);
  text("Score: " + score, 20, 30);
  text("Fruits: " + fruitScore + "/5", 20, 60);
  
  // Afficher l'état du missile s'il est disponible
  if(hasMissile) {
    fill(255, 255, 0);
    text("MISSILE READY! Click to fire!", 20, 90);
    
    // Dessiner une cible sur le ghost le plus proche
    if(ghosts.length > 0) {
      // Trouver le ghost le plus proche
      let closest = ghosts[0];
      let minDist = Infinity;
      
      for(let ghost of ghosts) {
        let d = p5.Vector.dist(pacman.pos, ghost.pos);
        if(d < minDist) {
          minDist = d;
          closest = ghost;
        }
      }
      
      // Dessiner un réticule de visée sur le ghost cible
      noFill();
      stroke(255, 255, 0);
      strokeWeight(3);
      circle(closest.pos.x, closest.pos.y, closest.r * 3);
      // Croix du réticule
      line(closest.pos.x - 20, closest.pos.y, closest.pos.x + 20, closest.pos.y);
      line(closest.pos.x, closest.pos.y - 20, closest.pos.x, closest.pos.y + 20);
    }
  }
  
  // Afficher le temps restant avant changement des murs
  let timeLeft = (wallChangeDuration - wallChangeTimer) / 60;
  fill(100, 200, 255);
  text("Walls change in: " + timeLeft.toFixed(1) + "s", 20, 120);
  
  // Indicateur du mode debug
  if(Vehicle.debug) {
    fill(255, 0, 255);
    text("DEBUG MODE (Press D to toggle)", 20, 150);
  } else {
    fill(150);
    textSize(16);
    text("Press D for debug mode", 20, 150);
  }
  
  // ============================================
  // === ÉCRAN DE VICTOIRE ===
  // ============================================
  // Si tous les ghosts sont éliminés -> VICTOIRE
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
    
    // Ajouter 5 fruits bonus avec durée de vie
    for(let i = 0; i < 5; i++) {
      fruits.push({
        pos: createVector(random(50, width-50), random(50, height-50)),
        lifespan: random(180, 420)
      });
    }
    
    console.log("Missile fired! Ghost eliminated!");
  } else if(!hasMissile && ghosts.length > 0) {
    console.log("No missile! Collect 5 fruits to get one.");
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
  
  // Recréer Mini Pacman
  miniPacman = new Vehicle(width/2, height/2);
  miniPacman.maxSpeed = 4;
  miniPacman.maxForce = 0.25;
  miniPacman.r = 10;
  miniPacman.color = "orange";
  
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
  
  // Recréer fruits avec durée de vie
  fruits = [];
  for(let i = 0; i < 30; i++) {
    fruits.push({
      pos: createVector(random(50, width-50), random(50, height-50)),
      lifespan: random(180, 420)
    });
  }
  
  // Regénérer labyrinthe
  generateWalls();
  
  // Relancer le jeu
  loop();
}

// Gestion des touches pour le debug
function keyPressed() {
  if (key === 'd' || key === 'D') {
    Vehicle.debug = !Vehicle.debug;
  }
  
  // Spacebar to fire missile
  if (key === ' ' && hasMissile && ghosts.length > 0 && isLooping()) {
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
    
    // Ajouter 5 fruits bonus avec durée de vie
    for(let i = 0; i < 5; i++) {
      fruits.push({
        pos: createVector(random(50, width-50), random(50, height-50)),
        lifespan: random(180, 420)
      });
    }
    
    console.log("Missile fired with SPACEBAR! Ghost eliminated!");
  }
}