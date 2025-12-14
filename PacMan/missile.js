class Missile extends Vehicle {
  constructor(x, y, target) {
    super(x, y);
    this.maxSpeed = 8;
    this.maxForce = 0.5;
    this.r = 8;
    this.target = target;
    this.trail = [];
    this.trailMaxLength = 15;
    this.alive = true;
  }

  update() {
    // Ajouter la position actuelle à la traînée
    this.trail.push(this.pos.copy());
    if (this.trail.length > this.trailMaxLength) {
      this.trail.shift();
    }

    // Appeler la méthode update du parent (Vehicle)
    super.update();
  }

  show() {
    // Dessiner la traînée
    push();
    noFill();
    for (let i = 0; i < this.trail.length; i++) {
      let alpha = map(i, 0, this.trail.length, 0, 255);
      let size = map(i, 0, this.trail.length, 2, this.r * 2);
      stroke(255, 255, 0, alpha);
      strokeWeight(3);
      if (i > 0) {
        line(this.trail[i-1].x, this.trail[i-1].y, this.trail[i].x, this.trail[i].y);
      }
    }
    pop();

    // Dessiner le missile
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    
    // Corps du missile
    fill(255, 255, 0);
    stroke(255, 200, 0);
    strokeWeight(2);
    triangle(this.r, 0, -this.r, -this.r/2, -this.r, this.r/2);
    
    // Flamme à l'arrière
    fill(255, 100, 0, 200);
    noStroke();
    let flameSize = random(this.r * 0.5, this.r * 0.8);
    triangle(-this.r, -flameSize/2, -this.r, flameSize/2, -this.r - flameSize, 0);
    
    // Point lumineux à l'avant
    fill(255);
    noStroke();
    circle(this.r - 2, 0, 4);
    
    pop();
  }

  // Vérifier si le missile touche sa cible
  hits(target) {
    let d = p5.Vector.dist(this.pos, target.pos);
    return d < this.r + target.r;
  }

  // Vérifier si le missile est hors écran
  isOffScreen() {
    return (this.pos.x < -50 || this.pos.x > width + 50 || 
            this.pos.y < -50 || this.pos.y > height + 50);
  }
}
