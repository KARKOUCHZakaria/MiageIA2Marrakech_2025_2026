class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);

    // On lui donne une vitesse et une direction initiales aléatoires
    this.vel = createVector(random(-10, 10), random(-10, 10));

    setInterval(() => {
      // On change la vitesse et la direction toutes les 500ms
      this.vel = createVector(random(-10, 10), random(-10, 10));
    }, 1000);
  }

  show() {
    // Bonne pratique : sauvegarde du contexte graphique
    // le contexte graphique est l'ensemble des paramètres
    // qui définissent comment on dessine (couleur de remplissage,
    // couleur du trait, épaisseur du trait, position du repère de 
    // référence, etc.
    push();

    // On dessine la cible comme un cercle rouge sans contour
    fill("red");
    noStroke();
    circle(this.pos.x, this.pos.y, 100);
    // Avant de terminer on restaure le contexte graphique
    pop();
  }

  
}