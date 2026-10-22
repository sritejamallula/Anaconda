package animals;

import game.Camera;
import snake.Anaconda;
import world.World;

import java.awt.Graphics2D;
import java.util.*;

/**
 * Manages the Amazonian fauna ecosystem for each level:
 * spawning, AI updates, predator-prey spatial partitioning, and collection statistics.
 */
public class FaunaManager {
    private final List<Prey> activePrey = new ArrayList<>();
    private final Map<PreyType, Integer> totalSpawnedCounts = new EnumMap<>(PreyType.class);
    private final Map<PreyType, Integer> eatenCounts = new EnumMap<>(PreyType.class);
    private final HuntingSequence huntingSequence = new HuntingSequence();

    public FaunaManager() {
        clear();
    }

    public void clear() {
        activePrey.clear();
        totalSpawnedCounts.clear();
        eatenCounts.clear();
        huntingSequence.reset();
        for (PreyType type : PreyType.values()) {
            totalSpawnedCounts.put(type, 0);
            eatenCounts.put(type, 0);
        }
    }

    public void addPrey(Prey prey) {
        activePrey.add(prey);
        PreyType type = prey.getType();
        totalSpawnedCounts.put(type, totalSpawnedCounts.getOrDefault(type, 0) + 1);
    }

    public void update(double dt, Anaconda anaconda, World world, Camera camera) {
        // If a hunting sequence is actively playing, update the cinematic
        if (huntingSequence.isActive()) {
            huntingSequence.update(dt, anaconda, camera);
            if (!huntingSequence.isActive() && huntingSequence.getTargetPrey() != null) {
                // Update eaten statistics
                PreyType type = huntingSequence.getTargetPrey().getType();
                eatenCounts.put(type, eatenCounts.getOrDefault(type, 0) + 1);
            }
            return;
        }

        double headX = anaconda.getX();
        double headY = anaconda.getY();
        double headRadius = anaconda.getBaseRadius() * 1.25;

        // Update all living prey
        for (Prey prey : activePrey) {
            if (!prey.isAlive()) continue;

            prey.update(dt, headX, headY, world);

            // Check collision with anaconda's head
            if (prey.checkCollision(headX, headY, headRadius)) {
                // Trigger hunting sequence
                huntingSequence.startHunting(prey, anaconda);
                break;
            }
        }
    }

    public void render(Graphics2D g, Camera camera, Anaconda anaconda) {
        for (Prey prey : activePrey) {
            if (prey.isAlive()) {
                prey.render(g, camera);
            }
        }

        // Render hunting cinematic effects (coils, swallowing animation)
        if (huntingSequence.isActive()) {
            huntingSequence.render(g, camera, anaconda);
        }
    }

    public List<Prey> getActivePrey() {
        return activePrey;
    }

    public HuntingSequence getHuntingSequence() {
        return huntingSequence;
    }

    public int getRemainingCount(PreyType type) {
        int spawned = totalSpawnedCounts.getOrDefault(type, 0);
        int eaten = eatenCounts.getOrDefault(type, 0);
        return Math.max(0, spawned - eaten);
    }

    public int getEatenCount(PreyType type) {
        return eatenCounts.getOrDefault(type, 0);
    }

    public int getTotalRemaining() {
        int total = 0;
        for (Prey p : activePrey) {
            if (p.isAlive()) total++;
        }
        return total;
    }

    public int getTotalEaten() {
        int total = 0;
        for (int count : eatenCounts.values()) {
            total += count;
        }
        return total;
    }
}
