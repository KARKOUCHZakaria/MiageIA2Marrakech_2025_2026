let target, vehicle;
let vehicles = [];
let nbVehicles = 100;
// sliders
let vitesseMaxSlider;
let forceMaxSlider

// la fonction setup est appelée une fois au démarrage du programme par p5.js
function setup() {
  // on crée un canvas de 800px par 800px
  createCanvas(windowWidth, windowHeight);

  // On crée un véhicule à la position (100, 100)
  //vehicle = new Vehicle(100, 100);

  // TODO: créer un tableau de véhicules en global
  // ajouter nb vehicules au tableau dans une boucle
  // avec une position random dans le canvas

  // La cible est un vecteur avec une position aléatoire dans le canvas
  // dirigée par la souris ensuite dans draw()
  target = createVector(random(width), random(height));
}

  // la fonction draw est appelée en boucle par p5.js, 60 fois par seconde par défaut
  // Le canvas est effacé automatiquement avant chaque appel à draw
  function draw() {
    // fond noir pour le canvas
    background("black");

    // A partir de maintenant toutes les formes pleines seront en rouge
    fill("red");
    // pas de contours pour les formes.
    noStroke();

    // mouseX et mouseY sont des variables globales de p5.js, elles correspondent à la position de la souris
    // on les stocke dans un vecteur pour pouvoir les utiliser avec la méthode seek (un peu plus loin)
    // du vehicule
    //target.x = mouseX;
    //target.y = mouseY;

    // Dessine un cercle de rayon 32px à la position de la souris
    // la couleur de remplissage est rouge car on a appelé fill(255, 0, 0) plus haut
    // pas de contours car on a appelé noStroke() plus haut
    //circle(target.x, target.y, 32);

    // On dessine la cible instance de Target. C'est un Vehicle
    // donc elle a une position, une vitesse, une accélération
    target.show();
    target.update();
    target.edges();

    vehicles.forEach(vehicle => {
      // On change la vitesse max du véhicule avec la 
      // valeur du slider
      vehicle.maxSpeed = vitesseMaxSlider.value();
      // On change la force max du véhicule avec la 
      // valeur du slider
      vehicle.maxForce = forceMaxSlider.value();

    // je déplace et dessine le véhicule
    vehicle.applyBehaviors(target);
    vehicle.update();

    // TODO :au lieu d'afficher un seul véhicule
    // faire une boucle pour afficher plusieurs véhicules

    // Si le vehicule sort de l'écran
    // TODO : appeler la méthode edges() du véhicule

    // On dessine le véhicule
    vehicle.show();
  };

