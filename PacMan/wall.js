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
    // Gradient effect pour les murs
    // Couleur principale: bleu foncé avec dégradé
    fill(30, 60, 150);
    stroke(80, 120, 255);
    strokeWeight(3);
    rect(this.x, this.y, this.w, this.h, 5); // coins arrondis
    
    // Ajouter une bordure intérieure pour effet 3D
    noFill();
    stroke(100, 150, 255, 150);
    strokeWeight(2);
    rect(this.x + 2, this.y + 2, this.w - 4, this.h - 4, 3);
    
    // Effet de brillance
    fill(120, 160, 255, 80);
    noStroke();
    rect(this.x + 3, this.y + 3, this.w / 3, this.h / 4, 2);
    pop();
  }
  
  // Vérifie si un véhicule touche le mur
  hits(vehicle) {
    return (vehicle.pos.x + vehicle.r > this.x &&
            vehicle.pos.x - vehicle.r < this.x + this.w &&
            vehicle.pos.y + vehicle.r > this.y &&
            vehicle.pos.y - vehicle.r < this.y + this.h);
  }
  
  // Calcule la distance la plus proche entre le véhicule et le mur
  distanceToVehicle(vehicle) {
    let closestX = constrain(vehicle.pos.x, this.x, this.x + this.w);
    let closestY = constrain(vehicle.pos.y, this.y, this.y + this.h);
    let distance = dist(vehicle.pos.x, vehicle.pos.y, closestX, closestY);
    return distance;
  }
  
  // Vérifie si le véhicule est proche du mur (dans une zone de détection)
  isNear(vehicle, detectionRadius) {
    return this.distanceToVehicle(vehicle) < detectionRadius;
  }

  // Résout la collision en déplaçant le véhicule hors du mur et en ajustant sa vitesse
  resolveCollision(vehicle) {
    // point le plus proche sur le rectangle
    let closestX = constrain(vehicle.pos.x, this.x, this.x + this.w);
    let closestY = constrain(vehicle.pos.y, this.y, this.y + this.h);

    // vecteur depuis le point le plus proche jusqu'au véhicule
    let overlap = createVector(vehicle.pos.x - closestX, vehicle.pos.y - closestY);
    let d = overlap.mag();

    // si le centre est exactement sur l'arête intérieure (d === 0), pousser selon la plus petite distance
    if (d === 0) {
      let dxLeft = abs(vehicle.pos.x - this.x);
      let dxRight = abs(vehicle.pos.x - (this.x + this.w));
      let dyTop = abs(vehicle.pos.y - this.y);
      let dyBottom = abs(vehicle.pos.y - (this.y + this.h));
      let minDist = min(dxLeft, dxRight, dyTop, dyBottom);
      if (minDist === dxLeft) overlap = createVector(1, 0);
      else if (minDist === dxRight) overlap = createVector(-1, 0);
      else if (minDist === dyTop) overlap = createVector(0, 1);
      else overlap = createVector(0, -1);
      d = 1;
    }

    // penetration depth: how far inside the wall the vehicle center is
    let penetration = max(0, vehicle.r - d);
    if (penetration > 0) {
      let normal = overlap.copy().normalize();

      // Push minimally so vehicle is just outside wall (smooth, not teleport)
      vehicle.pos.x += normal.x * (penetration + 0.1);
      vehicle.pos.y += normal.y * (penetration + 0.1);

      // Tangent direction to allow sliding along the wall
      let tangent = createVector(-normal.y, normal.x);

      // Remove velocity component pointing into the wall
      let vAlong = vehicle.vel.dot(normal);
      if (vAlong < 0) {
        vehicle.vel.sub(normal.copy().mult(vAlong));
      }

      // Add a small tangential nudge to encourage sliding through passages
      vehicle.vel.add(tangent.mult(0.2 * vehicle.maxSpeed));

      // Moderate damping to avoid jitter but keep movement fluid
      vehicle.vel.mult(0.6);

      // Clear acceleration to prevent oscillation
      if (vehicle.acc) vehicle.acc.set(0, 0);

      // Apply a small steering force along the tangent to move away from the wall over time
      if (vehicle.applyForce) {
        let pushForce = tangent.copy().mult(vehicle.maxSpeed * 0.25);
        vehicle.applyForce(pushForce);
      }
    }
  }
}
