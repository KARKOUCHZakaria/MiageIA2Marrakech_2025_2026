let pursuer;
let targets = [];
let sliderVitesseMaxCible;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Poursuiveur
  pursuer = new Vehicle(random(width), random(height));
  pursuer.maxSpeed = 4;
  pursuer.maxForce = 0.2;
  pursuer.vel = createVector(2, 4)

  // Cible
  target = new Target(random(width), random(height));
  target.maxSpeed = 3;
  target.maxForce = 1;

  // Si on veut plus tard plusieurs cibles
  targets.push(target);
}

let oldMousePos;

function draw() {
  background(0);

  // pursuer = le véhicule poursuiveur, il vise un point devant la cible
  target = targets[0];

  let force = pursuer.pursuePerfect(target);
  //let force = pursuer.pursuePerfect(target);
  pursuer.applyForce(force);


  // déplacement et dessin du véhicule et de la target
  pursuer.update();
  pursuer.edges();
  pursuer.show();

  // on déplace et on dessine toutes les targets
  targets.forEach(target => {
    // lorsque la target atteint un bord du canvas elle ré-apparait de l'autre côté
    target.edges();

    // TODO : si le poursuiveur est à moins de target.rayonDetection
    // alors la target s'évade (evade = fuite avec prédiction) du
    // poursuiveur

    
    // mettre en commentaire la ligne suivante
    // si cible controlée à la souris
    target.update();
    target.show();
  });
}
