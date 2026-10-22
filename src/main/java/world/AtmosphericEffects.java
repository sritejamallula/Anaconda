package world;

import game.Camera;
import game.GameConfig;

import java.awt.*;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Path2D;
import java.awt.geom.Point2D;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

/**
 * Atmospheric visual effects: canopy god-rays (sun shafts), drifting rainforest mist,
 * floating pollen spores, water ripples, and ambient tropical butterflies.
 */
public class AtmosphericEffects {
    public static class SporeParticle {
        double x, y;
        double vx, vy;
        double radius;
        double alpha;
        double life;
        double maxLife;

        public SporeParticle(double x, double y) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.4) * 18.0;
            this.vy = (Math.random() - 0.3) * 12.0;
            this.radius = 1.5 + Math.random() * 2.5;
            this.maxLife = 4.0 + Math.random() * 5.0;
            this.life = this.maxLife;
            this.alpha = 0.4 + Math.random() * 0.4;
        }

        public void update(double dt) {
            x += vx * dt;
            y += vy * dt;
            life -= dt;
        }
    }

    public static class Butterfly {
        double x, y;
        double targetX, targetY;
        double heading;
        double wingPhase;
        Color color;

        public Butterfly(double x, double y) {
            this.x = x;
            this.y = y;
            this.targetX = x + (Math.random() - 0.5) * 300;
            this.targetY = y + (Math.random() - 0.5) * 300;
            this.heading = Math.random() * Math.PI * 2;
            this.wingPhase = Math.random() * Math.PI * 2;
            Color[] colors = {
                    new Color(40, 160, 240),  // Morpho blue
                    new Color(250, 180, 20),  // Amber swallowtail
                    new Color(230, 70, 40)    // Scarlet postman
            };
            this.color = colors[new Random().nextInt(colors.length)];
        }

        public void update(double dt) {
            wingPhase += dt * 14.0;
            double dx = targetX - x;
            double dy = targetY - y;
            double dist = Math.hypot(dx, dy);

            if (dist < 30) {
                targetX += (Math.random() - 0.5) * 400;
                targetY += (Math.random() - 0.5) * 400;
            }

            double desiredHeading = Math.atan2(dy, dx);
            heading += (desiredHeading - heading) * 0.08;
            double speed = 45.0;
            x += Math.cos(heading) * speed * dt;
            y += Math.sin(heading) * speed * dt;
        }
    }

    public static class WaterRipple {
        public double x, y;
        public double radius;
        public double maxRadius;
        public double alpha;

        public WaterRipple(double x, double y, double maxRadius) {
            this.x = x;
            this.y = y;
            this.radius = 4.0;
            this.maxRadius = maxRadius;
            this.alpha = 0.7;
        }

        public void update(double dt) {
            radius += dt * 28.0;
            alpha = Math.max(0.0, 0.7 * (1.0 - (radius / maxRadius)));
        }

        public boolean isExpired() {
            return radius >= maxRadius || alpha <= 0.02;
        }
    }

    private final List<SporeParticle> spores = new ArrayList<>();
    private final List<Butterfly> butterflies = new ArrayList<>();
    private final List<WaterRipple> ripples = new ArrayList<>();
    private double time = 0.0;
    private final double worldSize;

    public AtmosphericEffects(double worldSize) {
        this.worldSize = worldSize;
        // Seed initial spores
        for (int i = 0; i < 40; i++) {
            spores.add(new SporeParticle((Math.random() - 0.5) * worldSize, (Math.random() - 0.5) * worldSize));
        }
        // Seed butterflies
        for (int i = 0; i < 6; i++) {
            butterflies.add(new Butterfly((Math.random() - 0.5) * (worldSize * 0.7), (Math.random() - 0.5) * (worldSize * 0.7)));
        }
    }

    public void addRipple(double x, double y, double maxRadius) {
        if (ripples.size() < 60) {
            ripples.add(new WaterRipple(x, y, maxRadius));
        }
    }

    public void update(double dt) {
        time += dt;

        // Update spores
        Iterator<SporeParticle> spIt = spores.iterator();
        while (spIt.hasNext()) {
            SporeParticle sp = spIt.next();
            sp.update(dt);
            if (sp.life <= 0) {
                spIt.remove();
            }
        }
        while (spores.size() < 40) {
            spores.add(new SporeParticle((Math.random() - 0.5) * worldSize, (Math.random() - 0.5) * worldSize));
        }

        // Update butterflies
        for (Butterfly b : butterflies) {
            b.update(dt);
        }

        // Update ripples
        Iterator<WaterRipple> ripIt = ripples.iterator();
        while (ripIt.hasNext()) {
            WaterRipple r = ripIt.next();
            r.update(dt);
            if (r.isExpired()) {
                ripIt.remove();
            }
        }
    }

    public void renderUnderEntities(Graphics2D g2, Camera camera) {
        // Render water ripples
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        for (WaterRipple rip : ripples) {
            Point2D.Double screen = camera.worldToScreen(rip.x, rip.y);
            double r = rip.radius * camera.getZoom();
            g.setColor(new Color(180, 240, 255, (int) (rip.alpha * 160)));
            g.setStroke(new BasicStroke((float) (1.8 * camera.getZoom())));
            g.draw(new Ellipse2D.Double(screen.x - r, screen.y - r * 0.6, r * 2, r * 1.2));
        }
        g.dispose();
    }

    public void renderOverEntities(Graphics2D g2, Camera camera) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        int viewW = camera.getViewportWidth();
        int viewH = camera.getViewportHeight();

        // 1. Canopy Sunlight Shafts (God-Rays filtering through canopy)
        double pulse = 0.5 + 0.5 * Math.sin(time * 0.8);
        int rayAlpha = (int) (18 + pulse * 14);
        g.setColor(new Color(255, 250, 210, rayAlpha));

        int[] rayOffsets = {-200, 100, 450, 800, 1150};
        for (int rx : rayOffsets) {
            Path2D ray = new Path2D.Double();
            ray.moveTo(rx, 0);
            ray.lineTo(rx + 140, 0);
            ray.lineTo(rx - 60 + 260, viewH);
            ray.lineTo(rx - 60, viewH);
            ray.closePath();
            g.fill(ray);
        }

        // 2. Drifting Spores / Pollen
        for (SporeParticle sp : spores) {
            Point2D.Double screen = camera.worldToScreen(sp.x, sp.y);
            if (screen.x >= 0 && screen.x <= viewW && screen.y >= 0 && screen.y <= viewH) {
                int a = (int) (sp.alpha * (sp.life / sp.maxLife) * 180);
                g.setColor(new Color(245, 255, 210, Math.max(0, Math.min(255, a))));
                double r = sp.radius * camera.getZoom();
                g.fill(new Ellipse2D.Double(screen.x - r, screen.y - r, r * 2, r * 2));
            }
        }

        // 3. Ambient Butterflies Fluttering
        for (Butterfly b : butterflies) {
            Point2D.Double screen = camera.worldToScreen(b.x, b.y);
            if (screen.x >= -30 && screen.x <= viewW + 30 && screen.y >= -30 && screen.y <= viewH + 30) {
                double wingSpread = Math.abs(Math.sin(b.wingPhase)) * 8.0 * camera.getZoom();
                g.setColor(b.color);
                g.fillOval((int) (screen.x - wingSpread), (int) (screen.y - 4), (int) (wingSpread * 2), 8);
                // Body
                g.setColor(Color.BLACK);
                g.fillRect((int) (screen.x - 1), (int) (screen.y - 5), 2, 10);
            }
        }

        // 4. River Morning Mist Drifting
        double mistDrift = (time * 12.0) % viewW;
        g.setColor(GameConfig.COLOR_RIVER_MIST);
        g.fillOval((int) (-viewW * 0.2 + mistDrift), (int) (viewH * 0.6), (int) (viewW * 0.8), 120);

        g.dispose();
    }
}
