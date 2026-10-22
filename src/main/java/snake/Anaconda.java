package snake;

import game.GameConfig;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Complete character model for the realistic green anaconda (Eunectes murinus).
 * Handles biomechanical movement, water vs land locomotion, spine path sampling,
 * progressive growth, stamina, and strike mechanics.
 */
public class Anaconda {
    // Spatial & Kinematic State
    private double x;
    private double y;
    private double heading;          // Current motion heading (radians)
    private double targetHeading;    // Heading requested by player steering
    private double speed;
    private double currentTurnRate;
    private double wavePhase;        // Sinusoidal lateral undulation phase
    private boolean isSprinting;
    private boolean isUnderwater;

    // Spine & Segments
    private final List<SnakeSegment> segments = new ArrayList<>();
    private final SnakePath path;
    private double segmentSpacing;
    private double baseRadius;

    // Growth & Progression
    private int growthStage;         // 1 (Juvenile) to 5 (Apex Titan)
    private int preyEatenTotal;
    private int preyEatenLevel;
    private double totalLengthMeters; // Display metric

    // Vital Stats
    private double health;
    private double maxHealth;
    private double stamina;
    private double maxStamina;
    private double hunger;           // 0 to 100
    private int score;

    // Strike & Hunting State
    private boolean isStriking;
    private double strikeTimer;
    private double jawOpenProgress;  // 0.0 (closed) to 1.0 (140 deg wide open)

    // Tongue & Digestion
    private double tongueTimer;
    private boolean tongueVisible;
    private final List<SwallowingBulge> bulges = new ArrayList<>();

    public Anaconda(double startX, double startY, double startAngle) {
        this.x = startX;
        this.y = startY;
        this.heading = startAngle;
        this.targetHeading = startAngle;
        this.speed = GameConfig.BASE_SLITHER_SPEED;
        this.currentTurnRate = GameConfig.TURN_RATE;
        this.wavePhase = 0.0;
        this.isSprinting = false;
        this.isUnderwater = false;

        this.growthStage = 1;
        this.preyEatenTotal = 0;
        this.preyEatenLevel = 0;
        this.totalLengthMeters = 1.8; // Initial juvenile length

        this.health = 100.0;
        this.maxHealth = 100.0;
        this.stamina = 100.0;
        this.maxStamina = 100.0;
        this.hunger = 70.0;
        this.score = 0;

        this.isStriking = false;
        this.strikeTimer = 0.0;
        this.jawOpenProgress = 0.0;

        this.tongueTimer = 0.0;
        this.tongueVisible = false;

        this.segmentSpacing = GameConfig.SEGMENT_SPACING;
        this.baseRadius = GameConfig.INITIAL_BASE_RADIUS;

        double initialTotalLength = GameConfig.INITIAL_SEGMENT_COUNT * segmentSpacing;
        this.path = new SnakePath(startX, startY, startAngle, initialTotalLength);

        // Initialize segments with natural anatomical taper
        for (int i = 0; i < GameConfig.INITIAL_SEGMENT_COUNT; i++) {
            double dist = i * segmentSpacing;
            double radius = calculateTaperedRadius(i, GameConfig.INITIAL_SEGMENT_COUNT, baseRadius);
            segments.add(new SnakeSegment(startX, startY, startAngle, radius, dist));
        }
        recalculateSegmentPositions();
    }

    /**
     * Calculates the anatomical thickness profile for a segment along the anaconda's spine.
     * Profile: Narrower neck -> thick muscular midbody -> graceful taper to slender tail tip.
     */
    private double calculateTaperedRadius(int index, int totalSegments, double baseR) {
        double t = (double) index / Math.max(1, totalSegments - 1); // 0 (neck) to 1 (tail tip)

        if (t < 0.12) {
            // Neck connection
            return baseR * (0.85 + (t / 0.12) * 0.20); // 0.85 -> 1.05
        } else if (t < 0.50) {
            // Muscular midsection
            double midT = (t - 0.12) / 0.38;
            return baseR * (1.05 + Math.sin(midT * Math.PI) * 0.15); // Peak at ~1.20
        } else {
            // Smooth taper toward the tail
            double tailT = (t - 0.50) / 0.50;
            return baseR * (1.05 * (1.0 - Math.pow(tailT, 1.2)) + 0.18 * Math.pow(tailT, 1.2));
        }
    }

    public void update(double dt, boolean inWater) {
        this.isUnderwater = inWater;

        // 1. Update Stamina & Sprinting
        if (isSprinting && stamina > 5.0) {
            stamina = Math.max(0.0, stamina - GameConfig.STAMINA_CONSUMPTION_RATE * dt);
            if (stamina <= 0.0) isSprinting = false;
        } else {
            isSprinting = false;
            stamina = Math.min(maxStamina, stamina + GameConfig.STAMINA_RECOVERY_RATE * dt);
        }

        // 2. Determine Speed (Water agility bonus + Sprint burst)
        double currentBaseSpeed = GameConfig.BASE_SLITHER_SPEED;
        if (isUnderwater) {
            currentBaseSpeed *= GameConfig.WATER_SPEED_MULTIPLIER;
        }
        if (isSprinting) {
            currentBaseSpeed *= GameConfig.SPRINT_MULTIPLIER;
        }

        // 3. Strike Mechanics
        if (isStriking) {
            strikeTimer -= dt;
            speed = GameConfig.STRIKE_SPEED;
            jawOpenProgress = Math.min(1.0, jawOpenProgress + dt * 4.0);
            if (strikeTimer <= 0.0) {
                isStriking = false;
            }
        } else {
            speed = currentBaseSpeed;
            jawOpenProgress = Math.max(0.0, jawOpenProgress - dt * 2.5);
        }

        // 4. Smooth Heading Steering (Angular Clamping)
        double angleDiff = targetHeading - heading;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

        double maxTurn = currentTurnRate * dt;
        if (Math.abs(angleDiff) <= maxTurn) {
            heading = targetHeading;
        } else {
            heading += Math.signum(angleDiff) * maxTurn;
        }

        // 5. Lateral Muscular Undulation (Realistic Sinuous Wave Motion)
        wavePhase += (speed / segmentSpacing) * 1.8 * dt;
        double waveAmplitude = isUnderwater ? 0.045 : 0.075; // Sinuous wave angle
        double effectiveHeading = heading + Math.sin(wavePhase) * waveAmplitude;

        // 6. Integrate Position
        x += Math.cos(effectiveHeading) * speed * dt;
        y += Math.sin(effectiveHeading) * speed * dt;

        // 7. Record Path & Update Segments
        path.recordHead(x, y, effectiveHeading);
        recalculateSegmentPositions();

        // 8. Update Digestion Bulges
        Iterator<SwallowingBulge> it = bulges.iterator();
        while (it.hasNext()) {
            SwallowingBulge b = it.next();
            b.update(dt);
            if (b.isCompleted()) {
                it.remove();
            }
        }

        // Apply bulges to segment radii
        for (SnakeSegment seg : segments) {
            double extraRadius = 0.0;
            for (SwallowingBulge b : bulges) {
                extraRadius += b.getExpansionAt(seg.getDistanceFromHead());
            }
            seg.setCurrentRadius(seg.getBaseRadius() + extraRadius);
            seg.setSubmerged(isUnderwater);
        }

        // 9. Tongue Flicking Animation
        tongueTimer += dt;
        if (tongueTimer > 2.8) {
            tongueVisible = true;
            if (tongueTimer > 3.3) {
                tongueVisible = false;
                tongueTimer = 0.0;
            }
        }

        // 10. Hunger decay
        hunger = Math.max(0.0, hunger - dt * 0.4);
    }

    private void recalculateSegmentPositions() {
        for (int i = 0; i < segments.size(); i++) {
            SnakeSegment seg = segments.get(i);
            double dist = (i + 1) * segmentSpacing;
            seg.setDistanceFromHead(dist);
            SnakePath.SampleResult sample = path.sampleAtDistance(dist);
            seg.updatePosition(sample.x, sample.y, sample.angle);
        }
        path.prune(segments.size() * segmentSpacing);
    }

    /**
     * Initiates a fast lunging strike toward prey.
     */
    public void startStrike() {
        if (!isStriking && stamina >= 10.0) {
            isStriking = true;
            strikeTimer = GameConfig.STRIKE_DURATION;
            stamina = Math.max(0.0, stamina - 12.0);
        }
    }

    /**
     * Swallows prey: adds score, nutrition, triggers growth, and creates a traveling swallowing bulge.
     */
    public void swallowPrey(double nutrition, double preySizeMultiplier, int pointValue) {
        score += pointValue;
        preyEatenTotal++;
        preyEatenLevel++;
        hunger = Math.min(100.0, hunger + nutrition * 0.5);

        // Spawn traveling digestion bulge down the body
        double bulgeAmplitude = baseRadius * 0.55 * Math.min(2.0, preySizeMultiplier);
        double bulgeLength = segmentSpacing * 3.5 * Math.max(1.0, preySizeMultiplier);
        double bulgeSpeed = 48.0; // px/sec
        double totalBodyLength = segments.size() * segmentSpacing;
        bulges.add(new SwallowingBulge(bulgeAmplitude, bulgeLength, bulgeSpeed, totalBodyLength));

        // Add growth segments
        int segmentsToAdd = (int) Math.max(2, Math.round(nutrition * 0.12 * preySizeMultiplier));
        for (int i = 0; i < segmentsToAdd; i++) {
            if (segments.size() < GameConfig.MAX_SEGMENTS) {
                int newIdx = segments.size();
                double dist = (newIdx + 1) * segmentSpacing;
                double r = calculateTaperedRadius(newIdx, segments.size() + 1, baseRadius);
                SnakeSegment last = segments.get(segments.size() - 1);
                segments.add(new SnakeSegment(last.getX(), last.getY(), last.getAngle(), r, dist));
            }
        }

        // Increase girth progressively
        baseRadius = Math.min(26.0, baseRadius + 0.18 * preySizeMultiplier);

        // Update all segments with new tapered profile
        for (int i = 0; i < segments.size(); i++) {
            double r = calculateTaperedRadius(i, segments.size(), baseRadius);
            segments.get(i).setBaseRadius(r);
        }

        // Update length metric
        totalLengthMeters = 1.8 + (segments.size() - GameConfig.INITIAL_SEGMENT_COUNT) * 0.18;

        // Update Growth Stage
        updateGrowthStage();
    }

    private void updateGrowthStage() {
        if (segments.size() >= 70) {
            growthStage = 5; // Apex Titan (12m+)
        } else if (segments.size() >= 54) {
            growthStage = 4; // Giant Adult (9m)
        } else if (segments.size() >= 40) {
            growthStage = 3; // Adult (6.5m)
        } else if (segments.size() >= 30) {
            growthStage = 2; // Sub-Adult (4m)
        } else {
            growthStage = 1; // Juvenile (2m)
        }
    }

    public void setSteerDirection(double targetAngle) {
        this.targetHeading = targetAngle;
    }

    public void setSprinting(boolean sprinting) {
        this.isSprinting = sprinting;
    }

    public void resetForNewLevel(double startX, double startY, double startAngle) {
        this.x = startX;
        this.y = startY;
        this.heading = startAngle;
        this.targetHeading = startAngle;
        this.preyEatenLevel = 0;
        this.isStriking = false;
        this.bulges.clear();
        path.reset(startX, startY, startAngle, segments.size() * segmentSpacing);
        recalculateSegmentPositions();
    }

    // Getters
    public double getX() { return x; }
    public double getY() { return y; }
    public double getHeading() { return heading; }
    public double getSpeed() { return speed; }
    public List<SnakeSegment> getSegments() { return segments; }
    public boolean isUnderwater() { return isUnderwater; }
    public boolean isStriking() { return isStriking; }
    public double getJawOpenProgress() { return jawOpenProgress; }
    public boolean isTongueVisible() { return tongueVisible; }
    public int getGrowthStage() { return growthStage; }
    public int getPreyEatenTotal() { return preyEatenTotal; }
    public int getPreyEatenLevel() { return preyEatenLevel; }
    public double getTotalLengthMeters() { return totalLengthMeters; }
    public double getHealth() { return health; }
    public double getMaxHealth() { return maxHealth; }
    public double getStamina() { return stamina; }
    public double getMaxStamina() { return maxStamina; }
    public double getHunger() { return hunger; }
    public int getScore() { return score; }
    public double getBaseRadius() { return baseRadius; }
}
