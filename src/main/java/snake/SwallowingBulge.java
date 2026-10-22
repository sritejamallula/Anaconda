package snake;

/**
 * Represents a dynamic food bolus/swallowing bulge that travels down the anaconda's body
 * after swallowing prey, expanding segments realistically as it passes through the digestive tract.
 */
public class SwallowingBulge {
    private double currentDistance; // Current distance from head (px)
    private final double maxAmplitude;    // Peak radius enlargement (px)
    private final double halfWidth;       // Half-extent of bulge along spine (px)
    private final double speed;           // Propagation speed down the spine (px/sec)
    private final double maxDistance;     // Total body length to traverse
    private boolean completed;

    public SwallowingBulge(double maxAmplitude, double halfWidth, double speed, double maxDistance) {
        this.currentDistance = 0.0;
        this.maxAmplitude = maxAmplitude;
        this.halfWidth = halfWidth;
        this.speed = speed;
        this.maxDistance = maxDistance;
        this.completed = false;
    }

    public void update(double dt) {
        if (completed) return;
        currentDistance += speed * dt;
        if (currentDistance > maxDistance + halfWidth) {
            completed = true;
        }
    }

    /**
     * Calculates the radius expansion for a segment at a specific distance from the head.
     * Uses a smooth cosine bell curve.
     */
    public double getExpansionAt(double segmentDist) {
        if (completed) return 0.0;
        double distDiff = Math.abs(segmentDist - currentDistance);
        if (distDiff > halfWidth) return 0.0;

        // Cosine bell curve: peak at 1.0 when diff = 0, falling to 0 at halfWidth
        double t = distDiff / halfWidth;
        return maxAmplitude * 0.5 * (1.0 + Math.cos(t * Math.PI));
    }

    public boolean isCompleted() {
        return completed;
    }

    public double getCurrentDistance() {
        return currentDistance;
    }
}
