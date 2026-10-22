package animals;

import game.Camera;

import java.awt.*;
import java.awt.geom.*;

/**
 * Hoatzin Amazon Bird (Opisthocomus hoazin).
 * Signature Amazonian river bird with spiky crest feathers, blue facial skin,
 * red eyes, and dynamic wing flapping animations.
 */
public class BirdPrey extends Prey {
    private double flapPhase;

    public BirdPrey(double x, double y) {
        super(x, y, PreyType.HOATZIN_BIRD);
        this.flapPhase = Math.random() * Math.PI;
    }

    @Override
    public void updateAnimation(double dt) {
        double rate = (state == PreyState.FLEEING) ? 18.0 : 4.0;
        flapPhase += dt * rate;
    }

    @Override
    public void render(Graphics2D g2, Camera camera) {
        if (!alive) return;

        Point2D.Double screen = camera.worldToScreen(x, y);
        double zoom = camera.getZoom();
        double r = collisionRadius * zoom;

        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.translate(screen.x, screen.y);
        g.rotate(heading);

        // Ground shadow
        g.setColor(new Color(0, 0, 0, 50));
        g.fill(new Ellipse2D.Double(-r * 1.0, -r * 0.6 + 6, r * 2.2, r * 1.2));

        // Animated Wings Flapping
        double wingSpread = Math.sin(flapPhase) * (r * 0.7);
        g.setColor(new Color(125, 75, 35));

        // Left wing
        Path2D leftWing = new Path2D.Double();
        leftWing.moveTo(0, -r * 0.4);
        leftWing.lineTo(-r * 0.6, -r * (1.2 + wingSpread * 0.5));
        leftWing.lineTo(-r * 0.9, -r * 0.3);
        leftWing.closePath();
        g.fill(leftWing);

        // Right wing
        Path2D rightWing = new Path2D.Double();
        rightWing.moveTo(0, r * 0.4);
        rightWing.lineTo(-r * 0.6, r * (1.2 + wingSpread * 0.5));
        rightWing.lineTo(-r * 0.9, r * 0.3);
        rightWing.closePath();
        g.fill(rightWing);

        // Fan Tail
        Path2D tail = new Path2D.Double();
        tail.moveTo(-r * 0.8, -r * 0.35);
        tail.lineTo(-r * 1.7, -r * 0.6);
        tail.lineTo(-r * 1.8, 0);
        tail.lineTo(-r * 1.7, r * 0.6);
        tail.lineTo(-r * 0.8, r * 0.35);
        tail.closePath();
        g.setColor(new Color(90, 50, 25));
        g.fill(tail);

        // Torso / Body (Bronze & Chestnut plumage)
        RadialGradientPaint bodyPlumage = new RadialGradientPaint(
                new Point2D.Float(0f, 0f),
                (float) (r * 1.2),
                new float[]{0.0f, 0.7f, 1.0f},
                new Color[]{new Color(210, 140, 55), new Color(150, 85, 35), new Color(80, 45, 18)}
        );
        g.setPaint(bodyPlumage);
        g.fill(new Ellipse2D.Double(-r * 0.85, -r * 0.55, r * 1.7, r * 1.1));

        // Distinct Head with Spiky Feathery Crest
        Path2D crest = new Path2D.Double();
        crest.moveTo(r * 0.5, -r * 0.2);
        crest.lineTo(r * 0.2, -r * 0.75);
        crest.lineTo(r * 0.6, -r * 0.3);
        crest.lineTo(r * 0.5, -r * 0.9);
        crest.lineTo(r * 0.8, -r * 0.2);
        crest.closePath();
        g.setColor(new Color(230, 160, 40));
        g.fill(crest);

        // Blue facial skin (Signature Hoatzin trait)
        g.setColor(new Color(60, 150, 230));
        g.fillOval((int) (r * 0.7), (int) (-r * 0.35), (int) (r * 0.5), (int) (r * 0.7));

        // Red Eye
        g.setColor(new Color(220, 30, 30));
        g.fillOval((int) (r * 0.85), (int) (-r * 0.25), (int) (r * 0.22), (int) (r * 0.22));
        g.fillOval((int) (r * 0.85), (int) (r * 0.05), (int) (r * 0.22), (int) (r * 0.22));
        g.setColor(Color.BLACK);
        g.fillOval((int) (r * 0.92), (int) (-r * 0.18), (int) (r * 0.1), (int) (r * 0.1));
        g.fillOval((int) (r * 0.92), (int) (r * 0.12), (int) (r * 0.1), (int) (r * 0.1));

        // Beak
        Path2D beak = new Path2D.Double();
        beak.moveTo(r * 1.15, -r * 0.18);
        beak.lineTo(r * 1.6, 0);
        beak.lineTo(r * 1.15, r * 0.18);
        beak.closePath();
        g.setColor(new Color(60, 50, 40));
        g.fill(beak);

        g.dispose();
    }
}
