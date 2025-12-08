let target, vehicle;

// la fonction setup est appelée une fois au démarrage du programme par p5.js
function setup() {
  // on crée un canvas de 800px par 800px
  createCanvas(windowWidth, windowHeight);

  // On crée un véhicule à la position (100, 100)
  vehicle = new Vehicle(100, 100);

  // TODO: créer un tableau de véhicules en global
  // ajouter nb vehicules au tableau dans une boucle
  // avec une position random dans le canvas
  tableVehicles = vehicle.tableVehicle(8);
  // La cible est un vecteur avec une position aléatoire dans le canvas
  // dirigée par la souris ensuite dans draw()
  target = createVector(random(width), random(height));
   vitesseMaxSlider = createSlider(1,20,10,1);
   vitesseMaxSlider.position(920,10);
   vitesseMaxSlider.size(80);
   let labelVitesseMax = createDiv('Vitesse Max');
   labelVitesseMax.position(810, 10);
   labelVitesseMax.style('color', 'White');
   labelVitesseMax.style('font-size', '20px');


    forceMaxSlider = createSlider(0.05,2,0.1,0.01);
    forceMaxSlider.position(920,40);
    forceMaxSlider.size(80);
    let labelforceMax = createDiv('Force Max');
    labelforceMax.position(810, 40);
    labelforceMax.style('color', 'White');
    labelforceMax.style('font-size', '20px');
}

  // la fonction draw est appelée en boucle par p5.js, 60 fois par seconde par défaut
  // Le canvas est effacé automatiquement avant chaque appel à draw
  function draw() {
    // fond noir pour le canvas
    background(0);

    // A partir de maintenant toutes les formes pleines seront en rouge
    fill("red");
    // pas de contours pour les formes.
    noStroke();

    // mouseX et mouseY sont des variables globales de p5.js, elles correspondent à la position de la souris
    // on les stocke dans un vecteur pour pouvoir les utiliser avec la méthode seek (un peu plus loin)
    // du vehicule
    target.x = mouseX;
    target.y = mouseY;

    // Dessine un cercle de rayon 32px à la position de la souris
    // la couleur de remplissage est rouge car on a appelé fill(255, 0, 0) plus haut
    // pas de contours car on a appelé noStroke() plus haut
    circle(target.x, target.y, 32);

    // je déplace et dessine le véhicule
    //vehicle.applyBehaviors(target);
    //vehicle.update();

    // TODO :au lieu d'afficher un seul véhicule
    // faire une boucle pour afficher plusieurs véhicules
   tableVehicles.forEach(vehicle => {
      vehicle.maxSpeed = vitesseMaxSlider.value();
      vehicle.maxForce = forceMaxSlider.value();
      vehicle.applyBehaviors(target);
      vehicle.update();
      vehicle.show();
      vehicle.edges();
   })
    // Si le vehicule sort de l'écran
    // TODO : appeler la méthode edges() du véhicule
  
    // On dessine le véhicule
  

   
    
  };

