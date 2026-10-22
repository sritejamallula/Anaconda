package snake;

import game.Camera;
import game.GameConfig;

import java.awt.*;
import java.awt.geom.*;
import java.util.List;

/**
 * Photorealistic 2D/2.5D rendering engine for the green anaconda (Eunectes murinus).
 * Renders continuous scaled anatomy, signature dorsal blotches, lateral yellow ocelli,
 * wet specular clearcoat, dynamic jaw unhinging, fangs, and flickering tongue.
 */
public class SnakeRenderer {

    public void render(Graphics2D g2, Anaconda anaconda, Camera camera) {
        List<SnakeSegment> segments = anaconda.getSegments();
        if (segments.isEmpty()) return;

        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        // 1. Render Ground Shadow for entire snake (from tail to head)
        for (int i = segments.size() - 1; i >= 0; i--) {
            SnakeSegment seg = segments.get(i);
            Point2D.Double screen = camera.worldToScreen(seg.getX() + 6.0, seg.getY() + 8.0);
            double r = seg.getCurrentRadius() * camera.getZoom();
            g.setColor(new Color(0, 0, 0, seg.isSubmerged() ? 30 : 65));
            g.fill(new Ellipse2D.Double(screen.x - r, screen.y - r * 0.85, r * 2, r * 1.7));
        }

        // 2. Render Body Segments (from tail to head for correct depth layering)
        for (int i = segments.size() - 1; i >= 0; i--) {
            SnakeSegment seg = segments.get(i);
            renderBodySegment(g, seg, camera, i, segments.size());
        }

        // 3. Render Anatomically Sculpted Head
        renderHead(g, anaconda, camera);

        g.dispose();
    }

    private void renderBodySegment(Graphics2D g, SnakeSegment seg, Camera camera, int index, int totalSegments) {
        Point2D.Double screen = camera.worldToScreen(seg.getX(), seg.getY());
        double r = seg.getCurrentRadius() * camera.getZoom();
        double angle = seg.getAngle();

        AffineTransform oldTx = g.getTransform();
        g.translate(screen.x, screen.y);
        g.rotate(angle);

        // A. Segment Base Gradient (Dorsal Olive to Flank Dark Olive)
        RadialGradientPaint bodyGrad = new RadialGradientPaint(
                new Point2D.Float(0, (float) -r * 0.35f),
                (float) (r * 1.35),
                new float[]{0.0f, 0.65f, 1.0f},
                new Color[]{
                        new Color(102, 132, 54),                 // Bright dorsal olive
                        GameConfig.ANACONDA_BASE_OLIVE,          // Base olive
                        new Color(36, 48, 20)                    // Dark muscular flank
                }
        );
        g.setPaint(bodyGrad);
        g.fill(new Ellipse2D.Double(-r * 0.95, -r, r * 1.9, r * 2.0));

        // B. Signature Dark Oval Blotches (Dorsal Markings)
        // Staggered pattern every 2 segments
        if (index % 2 == 0) {
            g.setColor(GameConfig.ANACONDA_DARK_BLOTCH);
            double blotchW = r * 0.85;
            double blotchH = r * 1.1;
            g.fill(new Ellipse2D.Double(-blotchW * 0.5, -blotchH * 0.5, blotchW, blotchH));
        }

        // C. Lateral Yellow Ocelli Spots (Side rings on flank)
        if (index % 3 == 0) {
            // Right flank spot
            g.setColor(GameConfig.ANACONDA_OCELLI_YELLOW);
            g.fillOval((int) (r * 0.45), (int) (r * 0.55), (int) (r * 0.4), (int) (r * 0.35));
            g.setColor(GameConfig.ANACONDA_DARK_BLOTCH);
            g.fillOval((int) (r * 0.55), (int) (r * 0.62), (int) (r * 0.2), (int) (r * 0.2));

            // Left flank spot
            g.setColor(GameConfig.ANACONDA_OCELLI_YELLOW);
            g.fillOval((int) (-r * 0.85), (int) (r * 0.55), (int) (r * 0.4), (int) (r * 0.35));
            g.setColor(GameConfig.ANACONDA_DARK_BLOTCH);
            g.fillOval((int) (-r * 0.75), (int) (r * 0.62), (int) (r * 0.2), (int) (r * 0.2));
        }

        // D. Wet Specular Sheen (High-gloss moisture highlight on top of scales)
        g.setColor(GameConfig.ANACONDA_WET_SHEEN);
        g.fill(new Ellipse2D.Double(-r * 0.35, -r * 0.75, r * 0.7, r * 0.45));

        // E. Submerged Water Effect (If swimming, overlay translucent river caustics)
        if (seg.isSubmerged()) {
            g.setColor(new Color(24, 88, 104, 75));
            g.fill(new Ellipse2D.Double(-r, -r, r * 2, r * 2));
        }

        g.setTransform(oldTx);
    }

    private void renderHead(Graphics2D g, Anaconda anaconda, Camera camera) {
        Point2D.Double screen = camera.worldToScreen(anaconda.getX(), anaconda.getY());
        double heading = anaconda.getHeading();
        double zoom = camera.getZoom();
        double r = anaconda.getBaseRadius() * zoom * 1.15;
        double jawOpen = anaconda.getJawOpenProgress();

        AffineTransform oldTx = g.getTransform();
        g.translate(screen.x, screen.y);
        g.rotate(heading);

        // 1. Flickering Forked Tongue (extends from snout when active)
        if (anaconda.isTongueVisible() && jawOpen < 0.2) {
            renderForkedTongue(g, r);
        }

        // 2. Head Shape Geometry (Broad flattened wedge contour)
        Path2D headPath = new Path2D.Double();
        headPath.moveTo(-r * 0.9, -r * 0.75);           // Back left neck
        headPath.curveTo(-r * 0.2, -r * 0.95, r * 0.6, -r * 0.75, r * 1.45, -r * 0.35); // Left jaw to snout
        headPath.lineTo(r * 1.6, 0.0);                   // Snout tip
        headPath.lineTo(r * 1.45, r * 0.35);             // Snout to right jaw
        headPath.curveTo(r * 0.6, r * 0.75, -r * 0.2, r * 0.95, -r * 0.9, r * 0.75);   // Right jaw to neck
        headPath.closePath();

        // Shaded Head Base Gradient
        RadialGradientPaint headGrad = new RadialGradientPaint(
                new Point2D.Float((float) (r * 0.4), 0f),
                (float) (r * 1.6),
                new float[]{0.0f, 0.7f, 1.0f},
                new Color[]{
                        new Color(112, 142, 60),
                        GameConfig.ANACONDA_BASE_OLIVE,
                        new Color(30, 40, 18)
                }
        );
        g.setPaint(headGrad);
        g.fill(headPath);

        // Outer contour stroke
        g.setColor(new Color(24, 34, 14));
        g.setStroke(new BasicStroke(1.4f));
        g.draw(headPath);

        // 3. Post-Ocular Dark Eye Stripe (Signature Anaconda Trait)
        g.setColor(new Color(16, 20, 10));
        g.setStroke(new BasicStroke(2.6f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        g.draw(new Line2D.Double(r * 0.45, -r * 0.52, -r * 0.7, -r * 0.68));
        g.draw(new Line2D.Double(r * 0.45, r * 0.52, -r * 0.7, r * 0.68));

        // 4. Amber Eyes with Vertical Slit Pupils
        renderEye(g, r * 0.52, -r * 0.48, r * 0.22);
        renderEye(g, r * 0.52, r * 0.48, r * 0.22);

        // 5. Nostrils (Positioned atop the snout for aquatic breathing)
        g.setColor(new Color(20, 24, 14));
        g.fillOval((int) (r * 1.25), (int) (-r * 0.18), (int) (r * 0.12), (int) (r * 0.12));
        g.fillOval((int) (r * 1.25), (int) (r * 0.06), (int) (r * 0.12), (int) (r * 0.12));

        // 6. Dynamic Lower Jaw Unhinging (Swallowing / Striking Animation)
        if (jawOpen > 0.05) {
            renderUnhingedMouth(g, r, jawOpen);
        }

        // 7. Head Wet Clearcoat Specular Sheen
        g.setColor(new Color(255, 255, 255, 60));
        g.fill(new Ellipse2D.Double(r * 0.1, -r * 0.35, r * 0.9, r * 0.7));

        // Submerged tint if underwater
        if (anaconda.isUnderwater()) {
            g.setColor(new Color(24, 88, 104, 75));
            g.fill(headPath);
        }

        g.setTransform(oldTx);
    }

    private void renderEye(Graphics2D g, double cx, double cy, double eyeR) {
        // Dark eye socket
        g.setColor(new Color(15, 18, 12));
        g.fill(new Ellipse2D.Double(cx - eyeR, cy - eyeR, eyeR * 2, eyeR * 2));

        // Radiant amber/bronze iris
        g.setColor(GameConfig.ANACONDA_EYE_AMBER);
        g.fill(new Ellipse2D.Double(cx - eyeR * 0.85, cy - eyeR * 0.85, eyeR * 1.7, eyeR * 1.7));

        // Vertical slit pupil (Reptilian predator)
        g.setColor(Color.BLACK);
        g.fill(new Ellipse2D.Double(cx - eyeR * 0.2, cy - eyeR * 0.75, eyeR * 0.4, eyeR * 1.5));

        // Specular eye reflection dot
        g.setColor(Color.WHITE);
        g.fillOval((int) (cx + eyeR * 0.2), (int) (cy - eyeR * 0.4), (int) (eyeR * 0.35), (int) (eyeR * 0.35));
    }

    private void renderForkedTongue(Graphics2D g, double r) {
        g.setColor(GameConfig.ANACONDA_TONGUE_DARK);
        g.setStroke(new BasicStroke(2.2f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));

        double startX = r * 1.55;
        double mainEnd = startX + r * 0.75;

        // Central tongue shaft
        g.draw(new Line2D.Double(startX, 0, mainEnd, 0));

        // Forked tips
        g.draw(new Line2D.Double(mainEnd, 0, mainEnd + r * 0.4, -r * 0.28));
        g.draw(new Line2D.Double(mainEnd, 0, mainEnd + r * 0.4, r * 0.28));
    }

    private void renderUnhingedMouth(Graphics2D g, double r, double jawOpen) {
        // Reddish-pink throat interior
        g.setColor(new Color(138, 38, 38, (int) (jawOpen * 230)));
        Path2D mouth = new Path2D.Double();
        mouth.moveTo(r * 0.5, -r * 0.45 * jawOpen);
        mouth.lineTo(r * 1.5, -r * 0.2 * jawOpen);
        mouth.lineTo(r * 1.6, 0);
        mouth.lineTo(r * 1.5, r * 0.2 * jawOpen);
        mouth.lineTo(r * 0.5, r * 0.45 * jawOpen);
        mouth.closePath();
        g.fill(mouth);

        // Recurved Fangs (Needle-sharp inward curving fangs)
        g.setColor(new Color(245, 245, 230));
        g.setStroke(new BasicStroke(1.8f));
        // Upper left fang
        g.draw(new Line2D.Double(r * 1.25, -r * 0.3 * jawOpen, r * 1.1, -r * 0.05));
        // Upper right fang
        g.draw(new Line2D.Double(r * 1.25, r * 0.3 * jawOpen, r * 1.1, r * 0.05));
    }
}
