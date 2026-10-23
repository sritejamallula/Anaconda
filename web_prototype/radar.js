// Tactical Bio-Radar HUD mini-map renderer
class RadarHUD {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.sweepAngle = 0;
    this.radarRange = 120; // 120 meters in-world
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : null;
    const w = (rect && rect.width > 20) ? rect.width : 160;
    const h = (rect && rect.height > 20) ? rect.height : 160;
    this.canvas.width = w * (window.devicePixelRatio || 1);
    this.canvas.height = h * (window.devicePixelRatio || 1);
  }

  render(snake, entities, boss) {
    if (!this.ctx || !snake) return;
    try {
      const ctx = this.ctx;
      const width = Math.max(80, this.canvas.width || 160);
      const height = Math.max(80, this.canvas.height || 160);
      const center = width / 2;
      const radius = Math.max(20, center - 8);

      ctx.clearRect(0, 0, width, height);

      // Save state
      ctx.save();
      
      // Circular clip
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();

      // Dark bio-holographic background
      const bgGrad = ctx.createRadialGradient(center, center, Math.min(5, radius * 0.2), center, center, radius);
      bgGrad.addColorStop(0, '#041c0f');
      bgGrad.addColorStop(0.7, '#021208');
      bgGrad.addColorStop(1, '#010804');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid Rings
    ctx.strokeStyle = 'rgba(50, 190, 100, 0.22)';
    ctx.lineWidth = 1.2;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(center, center, (radius / 3) * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(center, center - radius);
    ctx.lineTo(center, center + radius);
    ctx.moveTo(center - radius, center);
    ctx.lineTo(center + radius, center);
    ctx.stroke();

    // Rotating Sweep beam
    this.sweepAngle = (this.sweepAngle + 0.035) % (Math.PI * 2);
    const sweepGrad = ctx.createLinearGradient(
      center, center,
      center + Math.cos(this.sweepAngle) * radius,
      center + Math.sin(this.sweepAngle) * radius
    );
    sweepGrad.addColorStop(0, 'rgba(85, 255, 153, 0.45)');
    sweepGrad.addColorStop(1, 'rgba(0, 230, 118, 0.0)');

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, this.sweepAngle - 0.35, this.sweepAngle);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    // World to Radar Coordinate transform
    const snakePos = snake.getHeadPosition();
    const scale = radius / this.radarRange;

    const toRadar = (worldX, worldZ) => {
      const dx = (worldX - snakePos.x) * scale;
      const dz = (worldZ - snakePos.z) * scale;
      return {
        x: center + dx,
        y: center + dz,
        dist: Math.sqrt(dx * dx + dz * dz)
      };
    };

    // Draw Entities
    if (entities && entities.length > 0) {
      for (const ent of entities) {
        if (!ent.isAlive) continue;
        const pos = ent.getPosition();
        const rp = toRadar(pos.x, pos.z);
        if (rp.dist > radius - 4) continue;

        ctx.save();
        if (ent.type === 'insect') {
          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, 2.0, 0, Math.PI * 2);
          ctx.fill();
        } else if (ent.type === 'frog') {
          ctx.fillStyle = '#00ff66';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (ent.type === 'rat') {
          ctx.fillStyle = '#66ffcc';
          ctx.shadowColor = '#66ffcc';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, 2.8, 0, Math.PI * 2);
          ctx.fill();
        } else if (ent.type === 'capybara') {
          ctx.fillStyle = '#ffea00';
          ctx.shadowColor = '#ffea00';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, 4.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (ent.type === 'caiman') {
          ctx.fillStyle = '#ff9100';
          ctx.shadowColor = '#ff9100';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(rp.x, rp.y - 4);
          ctx.lineTo(rp.x + 3.5, rp.y + 4);
          ctx.lineTo(rp.x - 3.5, rp.y + 4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Draw Boss
    if (boss && boss.isAlive) {
      const bPos = boss.getPosition();
      const rp = toRadar(bPos.x, bPos.z);
      if (rp.dist <= radius - 4) {
        ctx.save();
        // Pulsing danger circle
        const pulse = Math.sin(Date.now() * 0.008) * 3 + 7;
        ctx.strokeStyle = 'rgba(255, 30, 30, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Boss skull diamond
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(rp.x, rp.y - 6);
        ctx.lineTo(rp.x + 6, rp.y);
        ctx.lineTo(rp.x, rp.y + 6);
        ctx.lineTo(rp.x - 6, rp.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // Draw Anaconda Body segments on Radar
    const pts = snake.spinePoints || snake.segments;
    if (pts && pts.length > 0) {
      ctx.strokeStyle = 'rgba(85, 255, 153, 0.65)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) {
        const p = pts[i].position || pts[i];
        const segP = toRadar(p.x, p.z);
        if (i === 0) ctx.moveTo(segP.x, segP.y);
        else ctx.lineTo(segP.x, segP.y);
      }
      ctx.stroke();
    }

    // Draw Anaconda Head Icon (Center Arrow)
    ctx.save();
    ctx.translate(center, center);
    const heading = snake.getHeadingAngle();
    ctx.rotate(heading);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#55ff99';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();

    // If digesting, show internal bulge indicator
    if (snake.hasDigestingPrey && snake.hasDigestingPrey()) {
      ctx.fillStyle = '#ffab00';
      ctx.beginPath();
      ctx.arc(0, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // Restore clip
    } catch (err) {
      console.warn('RadarHUD error:', err);
    }
  }
}

window.RadarHUD = RadarHUD;
