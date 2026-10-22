package animals;

import game.Camera;

import java.awt.*;
import java.awt.geom.*;

/**
 * Forest Spiny Rat (Proechimys guyannensis).
 * Agile ground forager with scurry animations, twitching ears, and a sinuous tail.
 */
public class RatPrey extends Prey {
    private double scurryPhase;

    public RatPrey(double x, double y) {
        super(x, y, PreyType.SPINY_RAT);
        this.scurryPhase = Math.random() * Math.PI;
    }

    @Override
    public void updateAnimation(double dt) {
        scurryPhase += dt * 16.0;
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
        g.setColor(new Color(0, 0, 0, 65));
        g.fill(new Ellipse2D.Double(-r * 1.1, -r * 0.55 + 5, r * 2.3, r * 1.1));

        // Long sinuous tail
        double tailWave = Math.sin(scurryPhase * 0.4) * (r * 0.35);
        Path2D tail = new Path2D.Double();
        tail.moveTo(-r * 1.1, 0);
        tail.curveTo(-r * 1.7, tailWave, -r * 2.2, -tailWave, -r * 2.8, tailWave * 0.6);
        g.setColor(new Color(175, 135, 105));
        g.setStroke(new BasicStroke((float) (1.8 * zoom), BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g.draw(tail);

        // Furry Body (Agouti brown gradient)
        GradientPaint furGrad = new GradientPaint(
                (float) -r, 0, new Color(130, 85, 45),
                (float) r, 0, new Color(190, 145, 95)
        );
        g.setPaint(furGrad);
        g.fill(new Ellipse2D.Double(-r * 1.1, -r * 0.65, r * 2.2, r * 1.3));

        // Tapered Head / Snout
        Path2D head = new Path2D.Double();
        head.moveTo(r * 0.6, -r * 0.45);
        head.lineTo(r * 1.5, 0); // Snout tip
        head.lineTo(r * 0.6, r * 0.45);
        head.closePath();
        g.fill(head);

        // Pink Nose tip
        g.setColor(new Color(230, 140, 140));
        g.fillOval((int) (r * 1.4), (int) (-r * 0.12), (int) (r * 0.25), (int) (r * 0.25));

        // Rounded Ears
        g.setColor(new Color(180, 120, 100));
        g.fillOval((int) (r * 0.4), (int) (-r * 0.65), (int) (r * 0.35), (int) (r * 0.35));
        g.fillOval((int) (r * 0.4), (int) (r * 0.3), (int) (r * 0.35), (int) (r * 0.35));

        // Dark Beady Eyes
        g.setColor(Color.BLACK);
        g.fillOval((int) (r * 0.9), (int) (-r * 0.35), (int) (r * 0.22), (int) (r * 0.22));
        g.fillOval((int) (r * 0.9), (int) (r * 0.13), (int) (r * 0.22), (int) (r * 0.22));

        // Whiskers (Fine sensory hairs)
        g.setColor(new Color(230, 230, 230, 180));
        g.setStroke(new BasicStroke(1.0f));
        g.draw(new Line2D.Double(r * 1.35, -r * 0.1, r * 1.8, -r * 0.5));
        g.draw(new Line2D.Double(r * 1.35, r * 0.1, r * 1.8, r * 0.5));

        g.dispose();
    }
}
