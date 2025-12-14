let pacman;
let miniPacman; // Petit Pacman qui suit le grand
let ghosts = [];
let fruits = [];
let walls = [];
let missiles = []; // Missiles actifs
let score = 0;
let fruitScore = 0;
let hasMissile = false;
let hasPet = false; // Flag pour savoir si on joue avec le mini pacman
let gameStarted = false; // Flag pour savoir si le jeu a commencé

let pacmanImg;
let miniPacmanImg;

// Maze globals (populated by generateWalls)
let mazeCells = null;
let mazeCols = 0;
let mazeRows = 0;
let mazeCellSize = 0;
let mazeOffsetX = 0;
let mazeOffsetY = 0;

function preload() {
  pacmanImg = loadImage('assets/pacman.png');
  miniPacmanImg = loadImage('assets/minipacman.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop(); // On ne lance pas le jeu avant que le menu soit fermé
}

// Fonction appelée depuis le menu HTML pour démarrer le jeu
function startGame(withPet) {
  hasPet = withPet;
  gameStarted = true;
  
  // Masquer le menu
  document.getElementById('menuScreen').classList.add('hidden');
  
  // Créer Pacman dans une zone sûre (centre avec marge)
  pacman = new Vehicle(width/2, height/2);
  pacman.maxSpeed = 5;
  pacman.maxForce = 0.3;
  pacman.r = 15;
  pacman.color = "yellow";
  // S'assurer que Pacman est bien dans les limites
  pacman.pos.x = constrain(pacman.pos.x, 80, width - 80);
  pacman.pos.y = constrain(pacman.pos.y, 80, height - 80);
  
  // Créer Mini Pacman uniquement si l'option est activée
  if(hasPet) {
    miniPacman = new Vehicle(width/2, height/2);
    miniPacman.maxSpeed = 4;
    miniPacman.maxForce = 0.25;
    miniPacman.r = 10;
    miniPacman.color = "orange";
    // S'assurer que Mini Pacman est bien dans les limites
    miniPacman.pos.x = constrain(miniPacman.pos.x, 80, width - 80);
    miniPacman.pos.y = constrain(miniPacman.pos.y, 80, height - 80);
  }
  
  // Créer 4 ghosts avec différentes couleurs dans des zones sûres
  let colors = ["red", "pink", "cyan", "orange"];
  for(let i = 0; i < 4; i++) {
    let ghost = new Vehicle(
      random(100, width - 100), 
      random(100, height - 100)
    );
    // S'assurer que les ghosts ne commencent pas trop près de Pacman
    while(dist(ghost.pos.x, ghost.pos.y, pacman.pos.x, pacman.pos.y) < 200) {
      ghost.pos.x = random(100, width - 100);
      ghost.pos.y = random(100, height - 100);
    }
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
      lifespan: random(180, 420)
    });
  }
  
  // Générer murs
  generateWalls();

  // Place entities on maze cell centers so they're not inside walls
  if (mazeCells) {
    // Place Pacman in the center cell
    let ci = floor(mazeCols / 2);
    let cj = floor(mazeRows / 2);
    pacman.pos.x = mazeOffsetX + ci * mazeCellSize + mazeCellSize / 2;
    pacman.pos.y = mazeOffsetY + cj * mazeCellSize + mazeCellSize / 2;
    pacman.vel = createVector(1, 0);

    // Place miniPacman just behind Pacman if enabled
    if (hasPet && miniPacman) {
      miniPacman.pos.x = pacman.pos.x - mazeCellSize / 2;
      miniPacman.pos.y = pacman.pos.y;
      miniPacman.vel = createVector(0.5, 0);
    }

    // Place ghosts in four corners of the maze (cell centers)
    let ghostSpawns = [
      {i:1,j:1},
      {i:mazeCols-2,j:1},
      {i:1,j:mazeRows-2},
      {i:mazeCols-2,j:mazeRows-2}
    ];
    for (let g = 0; g < ghosts.length; g++) {
      let s = ghostSpawns[g % ghostSpawns.length];
      ghosts[g].pos.x = mazeOffsetX + s.i * mazeCellSize + mazeCellSize / 2;
      ghosts[g].pos.y = mazeOffsetY + s.j * mazeCellSize + mazeCellSize / 2;
      ghosts[g].vel = p5.Vector.random2D().mult(0.5);
    }
  }
  
  // Démarrer la boucle de jeu
  loop();
}

// Générer un labyrinthe structuré et esthétique
function generateWalls() {
  walls = [];

  // Compute a grid that fills the available canvas while keeping corridors reasonably wide.
  let margin = 20; // minimal outer margin
  let minCell = 80; // minimum corridor cell size (controls corridor width)

  // Determine number of columns/rows we can fit using the minimum cell size
  let cols = max(3, floor((width - margin * 2) / minCell));
  let rows = max(3, floor((height - margin * 2) / minCell));

  // Recompute exact cell size so the grid fills the available space evenly
  let cellW = floor((width - margin * 2) / cols);
  let cellH = floor((height - margin * 2) / rows);
  let cell = min(cellW, cellH);

  // Center the maze on the canvas
  let totalW = cell * cols;
  let totalH = cell * rows;
  let offsetX = floor((width - totalW) / 2);
  let offsetY = floor((height - totalH) / 2);

  // Wall thickness relative to cell size
  let wallThickness = max(8, floor(cell * 0.12));

  // Build cell grid
  let cells = [];
  for (let i = 0; i < cols; i++) {
    cells[i] = [];
    for (let j = 0; j < rows; j++) {
      cells[i][j] = { visited: false, walls: [true, true, true, true] }; // top,right,bottom,left
    }
  }

  // Recursive backtracker (iterative)
  let stack = [];
  let cx = 0, cy = 0;
  cells[cx][cy].visited = true;

  while (true) {
    // find neighbors
    let neighbors = [];
    if (cy > 0 && !cells[cx][cy - 1].visited) neighbors.push({ nx: cx, ny: cy - 1, dir: 0, opp: 2 });
    if (cx < cols - 1 && !cells[cx + 1][cy].visited) neighbors.push({ nx: cx + 1, ny: cy, dir: 1, opp: 3 });
    if (cy < rows - 1 && !cells[cx][cy + 1].visited) neighbors.push({ nx: cx, ny: cy + 1, dir: 2, opp: 0 });
    if (cx > 0 && !cells[cx - 1][cy].visited) neighbors.push({ nx: cx - 1, ny: cy, dir: 3, opp: 1 });

    if (neighbors.length > 0) {
      let n = neighbors[floor(random(neighbors.length))];
      // remove wall between
      cells[cx][cy].walls[n.dir] = false;
      cells[n.nx][n.ny].walls[n.opp] = false;
      stack.push({ x: cx, y: cy });
      cx = n.nx; cy = n.ny;
      cells[cx][cy].visited = true;
    } else if (stack.length > 0) {
      let p = stack.pop();
      cx = p.x; cy = p.y;
    } else {
      break;
    }
  }

  // Convert cell walls to Wall objects
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let x = offsetX + i * cell;
      let y = offsetY + j * cell;
      let w = cells[i][j].walls;
      // top
      if (w[0]) walls.push(new Wall(x, y - wallThickness/2, cell + wallThickness, wallThickness));
      // right
      if (w[1]) walls.push(new Wall(x + cell - wallThickness/2, y, wallThickness, cell + 0));
      // bottom
      if (w[2]) walls.push(new Wall(x, y + cell - wallThickness/2, cell + wallThickness, wallThickness));
      // left
      if (w[3]) walls.push(new Wall(x - wallThickness/2, y, wallThickness, cell + 0));
    }
  }

  // Add outer border
  let borderThickness = wallThickness * 2;
  walls.push(new Wall(0, 0, width, borderThickness));
  walls.push(new Wall(0, height - borderThickness, width, borderThickness));
  walls.push(new Wall(0, 0, borderThickness, height));
  walls.push(new Wall(width - borderThickness, 0, borderThickness, height));

  // Expose maze grid for spawn placement
  mazeCells = cells;
  mazeCols = cols;
  mazeRows = rows;
  mazeCellSize = cell;
  mazeOffsetX = offsetX;
  mazeOffsetY = offsetY;
}

// La fonction draw est appelée en boucle par p5.js, 60 fois par seconde par défaut
function draw() {
  // Si le jeu n'a pas encore commencé, afficher un écran d'attente
  if(!gameStarted) {
    background(26, 26, 46);
    return;
  }
  
  // Fond sombre avec un léger dégradé
  background(10, 10, 30);
  
  // La cible est la position de la souris (pour le comportement arrive)
  let target = createVector(mouseX, mouseY);
  
  // ============================================
  // === COMPORTEMENT DU PACMAN (principal) ===
  // ============================================
  
  // Comportement "arrive" : se dirige vers la souris et ralentit en approchant
  let arriveForce = pacman.arrive(target);
  arriveForce.mult(2.2); // Give arrival higher priority so Pacman follows the mouse
  pacman.applyForce(arriveForce);
  
  // Éviter les murs AVANT la collision (comportement préventif)
  let wallAvoidForce = pacman.avoidWalls(walls);
  if(wallAvoidForce.mag() > 0) {
    // Reduce avoidance influence for Pacman so it doesn't override player input
    wallAvoidForce.mult(0.9);
    // Limit to a reasonable steering so arrival remains dominant
    wallAvoidForce.limit(pacman.maxForce * 1.2);
    pacman.applyForce(wallAvoidForce);
  }
  
  // Gestion de collision réactive (si déjà en contact)
  for(let wall of walls) {
    if(wall.hits(pacman)) {
      wall.resolveCollision(pacman);
    }
  }
  
  // Éviter les bords du canvas
  let boundaryForce = pacman.avoidBoundaries();
  boundaryForce.mult(1.5);
  pacman.applyForce(boundaryForce);
  
  // Mettre à jour la position, vitesse et accélération du pacman
  pacman.update();

  // Ensure Pacman has a minimum motion (avoid getting stuck stationary)
  if (pacman.vel.mag() < 0.2) {
    pacman.vel = createVector(0.5, 0);
  }
  
  // Contraindre la position du Pacman dans l'écran (ne peut PAS sortir)
  pacman.pos.x = constrain(pacman.pos.x, pacman.r, width - pacman.r);
  pacman.pos.y = constrain(pacman.pos.y, pacman.r, height - pacman.r);
  
  // Dessiner le Pacman avec l'image chargée
  // On utilise push/pop pour ne pas affecter les autres dessins
  push();
  translate(pacman.pos.x, pacman.pos.y);
  // Rotation selon la direction du vecteur vitesse
  // Seulement si Pacman bouge pour éviter les rotations bizarres
  if(pacman.vel.mag() > 0.1) {
    rotate(pacman.vel.heading());
  }
  imageMode(CENTER);
  image(pacmanImg, 0, 0, pacman.r * 2.5, pacman.r * 2.5);
  pop();
  
  // ============================================
  // === COMPORTEMENT DU MINI PACMAN (suiveur) ===
  // ============================================
  
  if(hasPet) {
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
  
    // Éviter les murs (comportement préventif)
    let miniWallAvoid = miniPacman.avoidWalls(walls);
    if(miniWallAvoid.mag() > 0) {
      miniWallAvoid.mult(3);
      miniPacman.applyForce(miniWallAvoid);
    }
    
    // Gestion de collision réactive
    for(let wall of walls) {
      if(wall.hits(miniPacman)) {
        wall.resolveCollision(miniPacman);
      }
    }
    
    // Éviter les bords du canvas
    let miniBoundaryForce = miniPacman.avoidBoundaries();
    miniBoundaryForce.mult(3);
    miniPacman.applyForce(miniBoundaryForce);
    
    // Mettre à jour la position du mini pacman
    miniPacman.update();
    
    // Contraindre Mini Pacman dans l'écran
    miniPacman.pos.x = constrain(miniPacman.pos.x, miniPacman.r, width - miniPacman.r);
    miniPacman.pos.y = constrain(miniPacman.pos.y, miniPacman.r, height - miniPacman.r);

    // Ensure mini pacman moves if stuck
    if (miniPacman.vel.mag() < 0.05) {
      miniPacman.vel = p5.Vector.random2D().mult(0.5);
    }
    
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
    
    // Éviter les murs (comportement préventif)
    let ghostWallAvoid = ghost.avoidWalls(walls);
    if(ghostWallAvoid.mag() > 0) {
      ghostWallAvoid.mult(2.5);
      ghost.applyForce(ghostWallAvoid);
    }
    
    // Gestion de collision réactive
    for(let wall of walls) {
      if(wall.hits(ghost)) {
        wall.resolveCollision(ghost);
      }
    }
    
    // Éviter les bords du canvas
    let ghostBoundary = ghost.avoidBoundaries();
    ghostBoundary.mult(5);
    ghost.applyForce(ghostBoundary);
    
    // Mettre à jour la position du ghost
    ghost.update();

    // Ensure ghost moves if it became stationary
    if (ghost.vel.mag() < 0.05) {
      ghost.vel = p5.Vector.random2D().mult(0.6);
    }
    
    // Contraindre fortement le Ghost dans l'écran
    ghost.pos.x = constrain(ghost.pos.x, ghost.r + 30, width - ghost.r - 30);
    ghost.pos.y = constrain(ghost.pos.y, ghost.r + 30, height - ghost.r - 30);
    
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
    
    // Détecter la collision entre ghost et mini pacman -> GAME OVER aussi (seulement si on a un pet)
    if(hasPet) {
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
  // === GESTION DES MISSILES ===
  // ============================================
  for(let i = missiles.length - 1; i >= 0; i--) {
    let missile = missiles[i];
    
    // Appliquer le comportement pursue vers la cible (hérité de Vehicle)
    let pursueForce = missile.pursue(missile.target);
    pursueForce.mult(1.5);
    missile.applyForce(pursueForce);
    
    // Éviter les murs
    let missileWallAvoid = missile.avoidWalls(walls);
    if(missileWallAvoid.mag() > 0) {
      missileWallAvoid.mult(4); // Force forte pour éviter les murs
      missile.applyForce(missileWallAvoid);
    }
    
    // Collision avec les murs - détruire le missile
    for(let wall of walls) {
      if(wall.hits(missile)) {
        missiles.splice(i, 1);
        break;
      }
    }
    
    if(i >= missiles.length) continue; // Si missile détruit, passer au suivant
    
    // Mettre à jour et afficher le missile
    missile.update();
    missile.show();
    
    // Vérifier si le missile touche sa cible
    if(missile.hits(missile.target)) {
      // Éliminer le ghost
      let ghostIndex = ghosts.indexOf(missile.target);
      if(ghostIndex !== -1) {
        ghosts.splice(ghostIndex, 1);
        score += 100;
        
        // Effet d'explosion
        for(let j = 0; j < 8; j++) {
          fruits.push({
            pos: createVector(
              missile.target.pos.x + random(-30, 30),
              missile.target.pos.y + random(-30, 30)
            ),
            lifespan: random(180, 420)
          });
        }
      }
      missiles.splice(i, 1);
    } else if(missile.isOffScreen()) {
      // Supprimer le missile s'il sort de l'écran
      missiles.splice(i, 1);
    }
  }
  
  // ============================================
  // === AFFICHAGE DES MURS ===
  // ============================================
  
  // Dessiner tous les murs rectangulaires avec style amélioré
  for(let wall of walls) {
    wall.show();
  }
  
  // ============================================
  // === INTERFACE UTILISATEUR (UI) ===
  // ============================================
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT);
  text("Score: " + score, 20, 40);
  text("Fruits: " + fruitScore + "/5", 20, 70);
  if(hasPet) {
    fill(255, 165, 0);
    text("🐾 Pet Mode", 20, 100);
  }
  
  // Afficher l'état du missile s'il est disponible
  if(hasMissile) {
    fill(255, 255, 0);
    let yPos = hasPet ? 130 : 100;
    text("MISSILE READY! Click to fire!", 20, yPos);
    
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
  
  // (Wall change timer removed — walls are static in this version)
  
  // Indicateur du mode debug
  let debugYPos = hasPet ? 190 : 160;
  if(hasMissile) debugYPos += 30;
  if(Vehicle.debug) {
    fill(255, 0, 255);
    text("DEBUG MODE (Press D to toggle)", 20, debugYPos);
  } else {
    fill(150);
    textSize(16);
    text("Press D for debug mode", 20, debugYPos);
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
  // Si jeu terminé -> Retour au menu
  if(!isLooping()) {
    returnToMenu();
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
    
    // Créer et lancer le missile avec comportement pursue
    let missile = new Missile(pacman.pos.x, pacman.pos.y, closest);
    missiles.push(missile);
    hasMissile = false;
    
    console.log("Missile launched with pursue behavior!");
  } else if(!hasMissile && ghosts.length > 0) {
    console.log("No missile! Collect 5 fruits to get one.");
  }
}

// Retourner au menu principal
function returnToMenu() {
  gameStarted = false;
  hasPet = false;
  score = 0;
  fruitScore = 0;
  hasMissile = false;
  wallChangeTimer = 0;
  ghosts = [];
  fruits = [];
  walls = [];
  missiles = [];
  
  // Afficher le menu
  document.getElementById('menuScreen').classList.remove('hidden');
  noLoop();
}

// Recommencer le jeu avec les mêmes paramètres
function restartGame() {
  // Réinitialiser toutes les variables
  score = 0;
  fruitScore = 0;
  hasMissile = false;
  wallChangeTimer = 0;
  
  // Recréer Pacman dans une zone sûre
  pacman = new Vehicle(width/2, height/2);
  pacman.maxSpeed = 5;
  pacman.maxForce = 0.3;
  pacman.r = 15;
  pacman.color = "yellow";
  pacman.pos.x = constrain(pacman.pos.x, 80, width - 80);
  pacman.pos.y = constrain(pacman.pos.y, 80, height - 80);
  
  // Recréer Mini Pacman uniquement si mode pet activé
  if(hasPet) {
    miniPacman = new Vehicle(width/2, height/2);
    miniPacman.maxSpeed = 4;
    miniPacman.maxForce = 0.25;
    miniPacman.r = 10;
    miniPacman.color = "orange";
    miniPacman.pos.x = constrain(miniPacman.pos.x, 80, width - 80);
    miniPacman.pos.y = constrain(miniPacman.pos.y, 80, height - 80);
  }
  
  // Recréer ghosts dans des zones sûres
  ghosts = [];
  let colors = ["red", "pink", "cyan", "orange"];
  for(let i = 0; i < 4; i++) {
    let ghost = new Vehicle(
      random(100, width - 100), 
      random(100, height - 100)
    );
    // S'assurer que les ghosts ne commencent pas trop près de Pacman
    while(dist(ghost.pos.x, ghost.pos.y, pacman.pos.x, pacman.pos.y) < 200) {
      ghost.pos.x = random(100, width - 100);
      ghost.pos.y = random(100, height - 100);
    }
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
    
    // Créer et lancer le missile avec comportement pursue
    let missile = new Missile(pacman.pos.x, pacman.pos.y, closest);
    missiles.push(missile);
    hasMissile = false;
    
    console.log("Missile launched with SPACEBAR using pursue behavior!");
  }
}