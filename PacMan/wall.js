class Wall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // Pour compatibilité avec avoidCorrige, on ajoute pos et r
    this.pos = createVector(x + w/2, y + h/2);
    this.r = max(w, h) / 2;
  }

  show() {
    push();
    fill(0, 0, 255);
    stroke(100, 100, 255);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h);
    pop();
  }
  
  // Vérifie si un véhicule touche le mur
  hits(vehicle) {
    return (vehicle.pos.x + vehicle.r > this.x &&
            vehicle.pos.x - vehicle.r < this.x + this.w &&
            vehicle.pos.y + vehicle.r > this.y &&
            vehicle.pos.y - vehicle.r < this.y + this.h);
  }
}
