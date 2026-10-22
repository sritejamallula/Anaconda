package animals;

import game.Camera;

import java.awt.*;
import java.awt.geom.*;

/**
 * Capybara (Hydrochoerus hydrochaeris).
 * Semi-aquatic mega-rodent of the Amazon basin with barrel-shaped body,
 * blunt square muzzle, ear twitching, and swimming capabilities.
 */
public class CapybaraPrey extends Prey {
    private double walkPhase;

    public CapybaraPrey(double x, double y) {
        super(x, y, PreyType.CAPYBARA);
        this.walkPhase = Math.random() * Math.PI;
    }

    @Override
    public void updateAnimation(double dt) {
        double rate = (state == PreyState.FLEEING) ? 12.0 : 4.0;
        walkPhase += dt * rate;
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
        g.setColor(new Color(0, 0, 0, 75));
        g.fill(new Ellipse2D.Double(-r * 1.1, -r * 0.7 + 7, r * 2.3, r * 1.4));

        // Walking leg offsets
        double legOffset = Math.sin(walkPhase) * (r * 0.25);
        g.setColor(new Color(110, 70, 35));
        g.setStroke(new BasicStroke((float) (5.5 * zoom), BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        // Hind feet
        g.draw(new Line2D.Double(-r * 0.6, -r * 0.65, -r * 0.6 - legOffset, -r * 0.95));
        g.draw(new Line2D.Double(-r * 0.6, r * 0.65, -r * 0.6 + legOffset, r * 0.95));
        // Forefeet
        g.draw(new Line2D.Double(r * 0.5, -r * 0.6, r * 0.5 + legOffset, -r * 0.9));
        g.draw(new Line2D.Double(r * 0.5, r * 0.6, r * 0.5 - legOffset, r * 0.9));

        // Sturdy Barrel Body (Reddish-brown agouti coat)
        RadialGradientPaint furGrad = new RadialGradientPaint(
                new Point2D.Float(0f, 0f),
                (float) (r * 1.4),
                new float[]{0.0f, 0.7f, 1.0f},
                new Color[]{new Color(185, 125, 70), new Color(135, 85, 42), new Color(85, 50, 22)}
        );
        g.setPaint(furGrad);
        g.fill(new RoundRectangle2D.Double(-r * 1.1, -r * 0.75, r * 2.2, r * 1.5, r * 0.6, r * 0.6));

        // Signature Blunt Boxy Head
        Path2D head = new Path2D.Double();
        head.moveTo(r * 0.6, -r * 0.55);
        head.lineTo(r * 1.55, -r * 0.45); // Top muzzle
        head.lineTo(r * 1.65, 0);          // Snout tip
        head.lineTo(r * 1.55, r * 0.45);  // Bottom muzzle
        head.lineTo(r * 0.6, r * 0.55);
        head.closePath();

        GradientPaint headGrad = new GradientPaint(
                (float) (r * 0.6), 0, new Color(155, 100, 52),
                (float) (r * 1.6), 0, new Color(115, 70, 32)
        );
        g.setPaint(headGrad);
        g.fill(head);

        // Dark wide nostrils
        g.setColor(new Color(40, 25, 15));
        g.fillOval((int) (r * 1.48), (int) (-r * 0.22), (int) (r * 0.16), (int) (r * 0.16));
        g.fillOval((int) (r * 1.48), (int) (r * 0.06), (int) (r * 0.16), (int) (r * 0.16));

        // Small High-set Eyes
        g.setColor(Color.BLACK);
        g.fillOval((int) (r * 1.05), (int) (-r * 0.45), (int) (r * 0.22), (int) (r * 0.22));
        g.fillOval((int) (r * 1.05), (int) (r * 0.23), (int) (r * 0.22), (int) (r * 0.22));
        g.setColor(Color.WHITE);
        g.fillOval((int) (r * 1.08), (int) (-r * 0.42), (int) (r * 0.08), (int) (r * 0.08));
        g.fillOval((int) (r * 1.08), (int) (r * 0.26), (int) (r * 0.08), (int) (r * 0.08));

        // Small Rounded Ears
        g.setColor(new Color(105, 65, 30));
        g.fillOval((int) (r * 0.5), (int) (-r * 0.68), (int) (r * 0.3), (int) (r * 0.28));
        g.fillOval((int) (r * 0.5), (int) (r * 0.4), (int) (r * 0.3), (int) (r * 0.28));

        g.dispose();
    }
}
