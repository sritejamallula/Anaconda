package animals;

import game.Camera;

import java.awt.*;
import java.awt.geom.*;

/**
 * Amazonian Caiman (Spectacled Caiman & Titan Black Caiman).
 * Heavy armored crocodilian predator with osteoderm scutes, serrated tail,
 * bony orbital ridge, and dangerous river dominance.
 */
public class CaimanPrey extends Prey {
    private double tailPhase;
    private final boolean isBlackCaiman;

    public CaimanPrey(double x, double y, boolean isBlackCaiman) {
        super(x, y, isBlackCaiman ? PreyType.BLACK_CAIMAN : PreyType.SPECTACLED_CAIMAN);
        this.isBlackCaiman = isBlackCaiman;
        this.tailPhase = Math.random() * Math.PI;
    }

    @Override
    public void updateAnimation(double dt) {
        double rate = (state == PreyState.FLEEING) ? 10.0 : 3.5;
        tailPhase += dt * rate;
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
        g.fill(new Ellipse2D.Double(-r * 1.5, -r * 0.6 + 6, r * 3.4, r * 1.2));

        // Muscular Serrated Tail
        double tailWave = Math.sin(tailPhase) * (r * 0.45);
        Path2D tail = new Path2D.Double();
        tail.moveTo(-r * 0.8, -r * 0.45);
        tail.curveTo(-r * 1.6, -r * 0.35 + tailWave * 0.5, -r * 2.3, tailWave, -r * 3.0, tailWave * 1.2);
        tail.curveTo(-r * 2.3, tailWave + r * 0.1, -r * 1.6, r * 0.35 + tailWave * 0.5, -r * 0.8, r * 0.45);
        tail.closePath();

        Color baseColor = isBlackCaiman ? new Color(32, 38, 30) : new Color(74, 96, 52);
        Color scuteColor = isBlackCaiman ? new Color(18, 22, 16) : new Color(42, 58, 32);

        g.setColor(baseColor);
        g.fill(tail);

        // Tail serrations (keeled osteoderm crests)
        g.setColor(scuteColor);
        g.setStroke(new BasicStroke((float) (2.5 * zoom)));
        for (double tx = -r * 1.0; tx > -r * 2.6; tx -= r * 0.3) {
            double tw = Math.sin(tailPhase + (tx / r)) * (r * 0.4);
            g.draw(new Line2D.Double(tx, -r * 0.2 + tw, tx - r * 0.1, -r * 0.55 + tw));
        }

        // Armored Torso with Scute Ridges
        GradientPaint caimanGrad = new GradientPaint(
                0, (float) (-r * 0.6), baseColor.brighter(),
                0, (float) (r * 0.6), baseColor.darker()
        );
        g.setPaint(caimanGrad);
        g.fill(new Ellipse2D.Double(-r * 0.9, -r * 0.65, r * 2.0, r * 1.3));

        // Armored Dorsal Scutes (Rows of raised scales)
        g.setColor(scuteColor);
        for (double sx = -r * 0.6; sx < r * 0.7; sx += r * 0.3) {
            g.fillRect((int) sx, (int) (-r * 0.35), (int) (r * 0.2), (int) (r * 0.2));
            g.fillRect((int) sx, (int) (r * 0.15), (int) (r * 0.2), (int) (r * 0.2));
        }

        // Heavy Crocodilian Head & Snout
        Path2D head = new Path2D.Double();
        head.moveTo(r * 0.7, -r * 0.55);
        head.lineTo(r * 1.8, -r * 0.28); // Tapered upper snout
        head.lineTo(r * 2.1, 0);          // Snout tip
        head.lineTo(r * 1.8, r * 0.28);  // Tapered lower snout
        head.lineTo(r * 0.7, r * 0.55);
        head.closePath();

        g.setPaint(caimanGrad);
        g.fill(head);

        // Bony ridge between eyes ("Spectacles")
        g.setColor(new Color(190, 160, 60, 200));
        g.setStroke(new BasicStroke((float) (1.8 * zoom)));
        g.draw(new Line2D.Double(r * 1.0, -r * 0.35, r * 1.0, r * 0.35));

        // Reptilian Yellow Eyes with Slit Pupils
        renderCaimanEye(g, r * 1.05, -r * 0.38, r * 0.24);
        renderCaimanEye(g, r * 1.05, r * 0.38, r * 0.24);

        // Snout Nostril Pits
        g.setColor(Color.BLACK);
        g.fillOval((int) (r * 1.9), (int) (-r * 0.16), (int) (r * 0.14), (int) (r * 0.14));
        g.fillOval((int) (r * 1.9), (int) (r * 0.04), (int) (r * 0.14), (int) (r * 0.14));

        g.dispose();
    }

    private void renderCaimanEye(Graphics2D g, double cx, double cy, double eyeR) {
        g.setColor(new Color(20, 25, 18));
        g.fill(new Ellipse2D.Double(cx - eyeR, cy - eyeR, eyeR * 2, eyeR * 2));
        g.setColor(new Color(235, 180, 40));
        g.fill(new Ellipse2D.Double(cx - eyeR * 0.8, cy - eyeR * 0.8, eyeR * 1.6, eyeR * 1.6));
        g.setColor(Color.BLACK);
        g.fill(new Ellipse2D.Double(cx - eyeR * 0.25, cy - eyeR * 0.75, eyeR * 0.5, eyeR * 1.5));
    }
}
