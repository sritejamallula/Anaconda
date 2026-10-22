package animals;

import game.Camera;

import java.awt.*;
import java.awt.geom.*;

/**
 * Amazon Emerald Catfish (Corydoras splendens).
 * Aquatic prey swimming with undulating tail and pectoral fins in river channels.
 */
public class FishPrey extends Prey {
    private double finWave;

    public FishPrey(double x, double y) {
        super(x, y, PreyType.EMERALD_CATFISH);
    }

    @Override
    public void updateAnimation(double dt) {
        finWave += dt * 10.0;
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

        // Water drop shadow
        g.setColor(new Color(0, 0, 0, 45));
        g.fill(new Ellipse2D.Double(-r * 0.9, -r * 0.5 + 4, r * 2.2, r * 1.0));

        // Tail fin undulating
        double tailWave = Math.sin(finWave) * (r * 0.45);
        Path2D tail = new Path2D.Double();
        tail.moveTo(-r * 0.9, 0);
        tail.lineTo(-r * 1.8, -r * 0.7 + tailWave);
        tail.lineTo(-r * 1.5, tailWave * 0.5);
        tail.lineTo(-r * 1.8, r * 0.7 + tailWave);
        tail.closePath();
        g.setColor(new Color(40, 150, 160, 200));
        g.fill(tail);

        // Fish Body (Torpedo shape with metallic emerald sheen)
        Path2D body = new Path2D.Double();
        body.moveTo(r * 1.3, 0);                          // Snout
        body.curveTo(r * 0.6, -r * 0.7, -r * 0.5, -r * 0.6, -r * 1.0, 0); // Top back
        body.curveTo(-r * 0.5, r * 0.6, r * 0.6, r * 0.7, r * 1.3, 0);    // Belly back to snout
        body.closePath();

        GradientPaint fishGrad = new GradientPaint(
                0, (float) (-r * 0.5), new Color(48, 175, 140),
                0, (float) (r * 0.5), new Color(20, 85, 95)
        );
        g.setPaint(fishGrad);
        g.fill(body);

        // Metallic scale sheen
        g.setColor(new Color(200, 255, 230, 110));
        g.fill(new Ellipse2D.Double(-r * 0.2, -r * 0.4, r * 0.9, r * 0.45));

        // Dark lateral dots
        g.setColor(new Color(15, 45, 45, 160));
        g.fillOval((int) (-r * 0.3), (int) (-r * 0.15), (int) (r * 0.25), (int) (r * 0.25));
        g.fillOval((int) (r * 0.1), (int) (-r * 0.15), (int) (r * 0.25), (int) (r * 0.25));

        // Eyes
        g.setColor(new Color(255, 220, 40));
        g.fillOval((int) (r * 0.75), (int) (-r * 0.45), (int) (r * 0.35), (int) (r * 0.35));
        g.fillOval((int) (r * 0.75), (int) (r * 0.15), (int) (r * 0.35), (int) (r * 0.35));
        g.setColor(Color.BLACK);
        g.fillOval((int) (r * 0.85), (int) (-r * 0.35), (int) (r * 0.18), (int) (r * 0.18));
        g.fillOval((int) (r * 0.85), (int) (r * 0.25), (int) (r * 0.18), (int) (r * 0.18));

        // Sensory Barbels / Whiskers
        g.setColor(new Color(170, 220, 210, 220));
        g.setStroke(new BasicStroke(1.2f));
        g.draw(new Line2D.Double(r * 1.25, -r * 0.2, r * 1.7, -r * 0.5));
        g.draw(new Line2D.Double(r * 1.25, r * 0.2, r * 1.7, r * 0.5));

        g.dispose();
    }
}
