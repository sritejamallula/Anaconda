package animals;

import audio.SoundManager;
import game.Camera;
import snake.Anaconda;

import java.awt.*;
import java.awt.geom.Point2D;

/**
 * Multi-stage predation and feeding cinematic state machine:
 * 1. Fast Strike / Lunge with fangs bared
 * 2. Constriction coils wrapping around prey
 * 3. 140° lower-jaw unhinging and swallowing sequence
 * 4. Completion: digestion bulge dispatch, length/thickness growth, and score awarding.
 */
public class HuntingSequence {
    public enum Phase {
        INACTIVE,
        STRIKE,
        CONSTRICTION,
        SWALLOWING,
        COMPLETED
    }

    private Phase phase;
    private Prey targetPrey;
    private double timer;
    private double phaseDuration;
    private double preyX, preyY;
    private double strikeStartX, strikeStartY;

    public HuntingSequence() {
        this.phase = Phase.INACTIVE;
        this.targetPrey = null;
        this.timer = 0.0;
    }

    public void startHunting(Prey prey, Anaconda anaconda) {
        this.targetPrey = prey;
        this.phase = Phase.STRIKE;
        this.timer = 0.0;
        this.phaseDuration = 0.28; // Strike lunge duration
        this.preyX = prey.getX();
        this.preyY = prey.getY();
        this.strikeStartX = anaconda.getX();
        this.strikeStartY = anaconda.getY();

        anaconda.startStrike();
        SoundManager.getInstance().playStrike();
    }

    public boolean isActive() {
        return phase != Phase.INACTIVE && phase != Phase.COMPLETED;
    }

    public void update(double dt, Anaconda anaconda, Camera camera) {
        if (!isActive() || targetPrey == null) return;

        timer += dt;

        switch (phase) {
            case STRIKE:
                camera.setTargetZoom(1.30); // Cinematic focus zoom
                if (timer >= phaseDuration) {
                    // Check if prey requires constriction
                    boolean requiresConstriction = (targetPrey.getType().sizeMultiplier >= 1.0);
                    if (requiresConstriction) {
                        phase = Phase.CONSTRICTION;
                        timer = 0.0;
                        phaseDuration = 0.85; // Constriction wrap time
                        SoundManager.getInstance().playConstrict();
                    } else {
                        // Small prey goes directly to swallowing
                        phase = Phase.SWALLOWING;
                        timer = 0.0;
                        phaseDuration = 0.95;
                        SoundManager.getInstance().playGulp();
                    }
                }
                break;

            case CONSTRICTION:
                camera.setTargetZoom(1.38);
                if (timer >= phaseDuration) {
                    phase = Phase.SWALLOWING;
                    timer = 0.0;
                    phaseDuration = 1.15; // Swallowing time
                    SoundManager.getInstance().playGulp();
                }
                break;

            case SWALLOWING:
                camera.setTargetZoom(1.22);
                if (timer >= phaseDuration) {
                    // Finish feeding
                    finishFeeding(anaconda);
                    phase = Phase.COMPLETED;
                    camera.setTargetZoom(1.0); // Reset camera zoom
                }
                break;

            case COMPLETED:
            case INACTIVE:
                break;
        }
    }

    private void finishFeeding(Anaconda anaconda) {
        if (targetPrey != null && targetPrey.catchAndConsume()) {
            PreyType type = targetPrey.getType();
            anaconda.swallowPrey(type.nutrition, type.sizeMultiplier, type.pointValue);
        }
    }

    public void render(Graphics2D g2, Camera camera, Anaconda anaconda) {
        if (!isActive() || targetPrey == null) return;

        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        Point2D.Double snakeScreen = camera.worldToScreen(anaconda.getX(), anaconda.getY());
        double zoom = camera.getZoom();

        if (phase == Phase.CONSTRICTION) {
            // Draw muscular constriction coils looping tightly around the prey
            double coilPhase = (timer / phaseDuration) * Math.PI * 4;
            double coilRadius = targetPrey.getCollisionRadius() * zoom * (1.3 - (timer / phaseDuration) * 0.35);

            g.setColor(new Color(60, 80, 30, 220));
            g.setStroke(new BasicStroke((float) (anaconda.getBaseRadius() * zoom * 1.6), BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            g.drawOval(
                    (int) (snakeScreen.x - coilRadius),
                    (int) (snakeScreen.y - coilRadius * 0.75),
                    (int) (coilRadius * 2),
                    (int) (coilRadius * 1.5)
            );
        } else if (phase == Phase.SWALLOWING) {
            // Prey being progressively drawn into the anaconda's unhinged mouth
            double ingestProgress = timer / phaseDuration; // 0.0 -> 1.0
            double scale = Math.max(0.05, 1.0 - ingestProgress * 0.85);

            // Render diminishing prey silhouette sliding into jaws
            Point2D.Double preyScreen = camera.worldToScreen(preyX, preyY);
            double lerpX = preyScreen.x + (snakeScreen.x - preyScreen.x) * ingestProgress;
            double lerpY = preyScreen.y + (snakeScreen.y - preyScreen.y) * ingestProgress;

            g.translate(lerpX, lerpY);
            g.scale(scale, scale);
            g.setColor(new Color(40, 25, 15, (int) ((1.0 - ingestProgress) * 220)));
            double pr = targetPrey.getCollisionRadius() * zoom;
            g.fillOval((int) -pr, (int) -pr, (int) (pr * 2), (int) (pr * 2));
        }

        g.dispose();
    }

    public void reset() {
        this.phase = Phase.INACTIVE;
        this.targetPrey = null;
        this.timer = 0.0;
    }

    public Phase getPhase() { return phase; }
    public Prey getTargetPrey() { return targetPrey; }
}
