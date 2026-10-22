package animals;

import game.Camera;

import java.awt.*;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Path2D;
import java.awt.geom.Point2D;

/**
 * Amazon Tree Frog (Osteocephalus taurinus).
 * Shoreline amphibious prey with realistic jumping/hopping animations and bulging eyes.
 */
public class FrogPrey extends Prey {
    private double hopCycle;
    private boolean isHopping;
    private double hopProgress;

    public FrogPrey(double x, double y) {
        super(x, y, PreyType.TREE_FROG);
        this.hopCycle = Math.random() * 2.0;
        this.isHopping = false;
        this.hopProgress = 0.0;
    }

    @Override
    public void updateAnimation(double dt) {
        hopCycle += dt;
        double triggerTime = (state == PreyState.FLEEING) ? 0.6 : 2.2;

        if (hopCycle > triggerTime) {
            isHopping = true;
            hopProgress += dt * 3.5;
            if (hopProgress >= 1.0) {
                isHopping = false;
                hopProgress = 0.0;
                hopCycle = 0.0;
            }
        }
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

        // Hop elevation offset
        double hopHeight = isHopping ? Math.sin(hopProgress * Math.PI) * 12.0 * zoom : 0.0;
        double legExtension = isHopping ? Math.sin(hopProgress * Math.PI) : 0.0;

        // Ground shadow
        g.setColor(new Color(0, 0, 0, (int) Math.max(15, 60 - hopHeight * 3)));
        double shadowScale = Math.max(0.7, 1.0 - hopHeight * 0.03);
        g.fill(new Ellipse2D.Double(-r * shadowScale, -r * 0.8 * shadowScale + 6, r * 2.0 * shadowScale, r * 1.6 * shadowScale));

        // Shift rendering up during hop
        g.translate(0, -hopHeight);

        // Hind Legs
        g.setColor(new Color(55, 140, 40));
        g.setStroke(new BasicStroke((float) (3.2 * zoom), BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));

        // Left leg
        Path2D leftLeg = new Path2D.Double();
        leftLeg.moveTo(-r * 0.4, -r * 0.5);
        leftLeg.lineTo(-r * (0.8 + legExtension * 0.5), -r * (1.1 - legExtension * 0.3));
        leftLeg.lineTo(-r * (1.1 + legExtension * 0.8), -r * 0.4);
        g.draw(leftLeg);

        // Right leg
        Path2D rightLeg = new Path2D.Double();
        rightLeg.moveTo(-r * 0.4, r * 0.5);
        rightLeg.lineTo(-r * (0.8 + legExtension * 0.5), r * (1.1 - legExtension * 0.3));
        rightLeg.lineTo(-r * (1.1 + legExtension * 0.8), r * 0.4);
        g.draw(rightLeg);

        // Forelimbs
        g.draw(new java.awt.geom.Line2D.Double(r * 0.3, -r * 0.4, r * 0.5, -r * 0.8));
        g.draw(new java.awt.geom.Line2D.Double(r * 0.3, r * 0.4, r * 0.5, r * 0.8));

        // Frog Body (Plump amphibious torso)
        RadialGradientPaint frogSkin = new RadialGradientPaint(
                new Point2D.Float(0f, 0f),
                (float) (r * 1.3),
                new float[]{0.0f, 0.7f, 1.0f},
                new Color[]{new Color(110, 215, 65), new Color(60, 160, 42), new Color(28, 88, 20)}
        );
        g.setPaint(frogSkin);
        g.fill(new Ellipse2D.Double(-r * 0.8, -r * 0.75, r * 1.7, r * 1.5));

        // Mottled spots on back
        g.setColor(new Color(30, 85, 20, 180));
        g.fillOval((int) (-r * 0.2), (int) (-r * 0.35), (int) (r * 0.35), (int) (r * 0.3));
        g.fillOval((int) (-r * 0.4), (int) (r * 0.1), (int) (r * 0.3), (int) (r * 0.25));

        // Bulging Eyes
        renderEye(g, r * 0.45, -r * 0.55, r * 0.3);
        renderEye(g, r * 0.45, r * 0.55, r * 0.3);

        g.dispose();
    }

    private void renderEye(Graphics2D g, double cx, double cy, double eyeR) {
        // Eye socket
        g.setColor(new Color(35, 95, 25));
        g.fill(new Ellipse2D.Double(cx - eyeR, cy - eyeR, eyeR * 2, eyeR * 2));
        // Golden iris
        g.setColor(new Color(245, 195, 45));
        g.fill(new Ellipse2D.Double(cx - eyeR * 0.8, cy - eyeR * 0.8, eyeR * 1.6, eyeR * 1.6));
        // Horizontal slit pupil
        g.setColor(Color.BLACK);
        g.fill(new Ellipse2D.Double(cx - eyeR * 0.7, cy - eyeR * 0.25, eyeR * 1.4, eyeR * 0.5));
    }
}
