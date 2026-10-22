import animals.FishPrey;
import animals.FrogPrey;
import animals.Prey;
import animals.PreyType;
import game.GameConfig;
import levels.LevelData;
import levels.LevelManager;
import save.SaveManager;
import snake.Anaconda;
import snake.SnakePath;
import snake.SnakeSegment;
import snake.SwallowingBulge;
import world.Island;
import world.Obstacle;
import world.River;
import world.RiverCrossingPortal;

import java.util.List;

/**
 * Automated Verification Test Suite for Realistic Anaconda Mini Project.
 * Validates path-following mathematics, collision algorithms, single-consumption rule,
 * digestion bolus propagation, level progression, and save serialization.
 */
public class GameVerificationTest {
    private static int testsRun = 0;
    private static int testsPassed = 0;

    public static void main(String[] args) {
        System.out.println("===================================================================");
        System.out.println(" RUNNING AUTOMATED GAME VERIFICATION TESTS");
        System.out.println("===================================================================");

        testSnakePathSampling();
        testAnacondaLocomotionAndGrowth();
        testSwallowingBulgePropagation();
        testPreyCollisionAndSingleConsumption();
        testLevelProgressionAndRiverCrossing();
        testSaveManagerPersistence();
        testFullEngineSimulationAndRender();

        System.out.println("===================================================================");
        System.out.printf(" TEST RESULTS: %d / %d PASSED\n", testsPassed, testsRun);
        System.out.println("===================================================================");

        if (testsPassed != testsRun) {
            System.err.println("FAILED: Some tests did not pass!");
            System.exit(1);
        } else {
            System.out.println("SUCCESS: All verification tests passed flawlessly!");
        }
    }

    private static void assertTrue(String testName, boolean condition) {
        testsRun++;
        if (condition) {
            testsPassed++;
            System.out.printf("  [PASS] %s\n", testName);
        } else {
            System.err.printf("  [FAIL] %s\n", testName);
        }
    }

    private static void testSnakePathSampling() {
        System.out.println("\n[Test Suite 1: Snake Path Trail & Sampling Mathematics]");
        SnakePath path = new SnakePath(0, 0, 0, 300);

        // Record a series of head movements
        path.recordHead(10, 0, 0);
        path.recordHead(20, 0, 0);
        path.recordHead(30, 0, 0);

        SnakePath.SampleResult sample0 = path.sampleAtDistance(0);
        assertTrue("Sample at 0px matches head position", Math.abs(sample0.x - 30.0) < 0.001);

        SnakePath.SampleResult sample15 = path.sampleAtDistance(15);
        assertTrue("Sample at 15px interpolates correctly behind head", sample15.x < 30.0 && sample15.x > 0.0);

        SnakePath.SampleResult sample100 = path.sampleAtDistance(100);
        assertTrue("Sample at 100px tracks historical spine accurately", sample100.x < sample15.x);
    }

    private static void testAnacondaLocomotionAndGrowth() {
        System.out.println("\n[Test Suite 2: Anaconda Anatomical Growth & Mechanics]");
        Anaconda anaconda = new Anaconda(100, 100, 0);

        assertTrue("Initial segment count is 24", anaconda.getSegments().size() == GameConfig.INITIAL_SEGMENT_COUNT);
        assertTrue("Initial growth stage is 1 (Juvenile)", anaconda.getGrowthStage() == 1);
        assertTrue("Initial score is 0", anaconda.getScore() == 0);

        // Update locomotion
        double initialX = anaconda.getX();
        anaconda.update(0.1, false);
        assertTrue("Anaconda slithers forward over time", anaconda.getX() > initialX);

        // Swallowing prey
        int initialSegs = anaconda.getSegments().size();
        double initialRadius = anaconda.getBaseRadius();
        anaconda.swallowPrey(PreyType.TREE_FROG.nutrition, PreyType.TREE_FROG.sizeMultiplier, PreyType.TREE_FROG.pointValue);

        assertTrue("Segment count increases after swallowing", anaconda.getSegments().size() > initialSegs);
        assertTrue("Base radius (girth) increases after nutrition intake", anaconda.getBaseRadius() > initialRadius);
        assertTrue("Score increases by prey value", anaconda.getScore() == PreyType.TREE_FROG.pointValue);
        assertTrue("Prey eaten count increments", anaconda.getPreyEatenTotal() == 1);
    }

    private static void testSwallowingBulgePropagation() {
        System.out.println("\n[Test Suite 3: Swallowing Bulge & Digestion Mechanics]");
        SwallowingBulge bulge = new SwallowingBulge(10.0, 40.0, 50.0, 300.0);

        // At t = 0, bulge is centered at head (distance 0)
        double expansionAtHead = bulge.getExpansionAt(0.0);
        double expansionAtTail = bulge.getExpansionAt(200.0);
        assertTrue("Peak expansion is centered at distance 0 initially", expansionAtHead > 8.0);
        assertTrue("Zero expansion at tail initially", expansionAtTail == 0.0);

        // Advance time: bulge should travel down the body
        bulge.update(2.0); // Moved 100px down
        assertTrue("Bulge moves down spine (current distance ~100px)", Math.abs(bulge.getCurrentDistance() - 100.0) < 1.0);
        assertTrue("Expansion now present at 100px", bulge.getExpansionAt(100.0) > 8.0);
        assertTrue("Expansion at head is now 0", bulge.getExpansionAt(0.0) == 0.0);
    }

    private static void testPreyCollisionAndSingleConsumption() {
        System.out.println("\n[Test Suite 4: Prey Spatial Collision & Single Consumption]");
        FrogPrey frog = new FrogPrey(200, 200);

        assertTrue("Frog is initially alive", frog.isAlive());
        assertTrue("Frog is not devoured initially", !frog.isDevoured());

        // Collision check
        assertTrue("Detects collision within radius", frog.checkCollision(200, 200, 15));
        assertTrue("No collision when distant", !frog.checkCollision(500, 500, 15));

        // Single Consumption Rule: Catching prey once succeeds
        boolean firstCatch = frog.catchAndConsume();
        assertTrue("First catch succeeds", firstCatch);
        assertTrue("Frog is marked dead", !frog.isAlive());
        assertTrue("Frog is marked devoured", frog.isDevoured());

        // Catching the same prey again MUST fail
        boolean secondCatch = frog.catchAndConsume();
        assertTrue("Second catch fails (Single-consumption rule enforced)", !secondCatch);
    }

    private static void testLevelProgressionAndRiverCrossing() {
        System.out.println("\n[Test Suite 5: Level Progression & River Crossing Events]");
        LevelManager manager = new LevelManager();

        assertTrue("Starts at Level 1", manager.getCurrentLevelIndex() == 1);
        LevelData lvl1 = manager.getCurrentLevelData();
        assertTrue("Level 1 required quota is 3 prey", lvl1.requiredPreyQuota == 3);

        // Objective check
        assertTrue("Objective not completed with 2 prey", !manager.isObjectiveCompleted(2));
        assertTrue("Objective completed with 3 prey", manager.isObjectiveCompleted(3));
        assertTrue("Objective completed with 4 prey", manager.isObjectiveCompleted(4));

        // Advance level
        boolean advanced = manager.advanceToNextLevel();
        assertTrue("Level advances to 2", advanced && manager.getCurrentLevelIndex() == 2);
        assertTrue("Highest unlocked level updated to 2", manager.getHighestUnlockedLevel() == 2);
    }

    private static void testSaveManagerPersistence() {
        System.out.println("\n[Test Suite 6: SaveManager File Serialization]");
        SaveManager save = SaveManager.getInstance();

        int testScore = 15400;
        save.recordGameResults(testScore, 12, 3);

        assertTrue("High score recorded correctly", save.getHighScore() >= testScore);
        assertTrue("Highest unlocked level at least 3", save.getHighestUnlockedLevel() >= 3);

        // Re-load from disk to verify actual serialization
        save.load();
        assertTrue("Data successfully re-read from disk", save.getHighScore() >= testScore);
    }

    private static void testFullEngineSimulationAndRender() {
        System.out.println("\n[Test Suite 7: Full GameEngine Simulation & 60 FPS Frame Rendering]");
        try {
            game.GameEngine engine = new game.GameEngine(1280, 720);
            engine.setState(game.GameState.PLAYING);

            java.awt.image.BufferedImage canvas = new java.awt.image.BufferedImage(1280, 720, java.awt.image.BufferedImage.TYPE_INT_ARGB);
            java.awt.Graphics2D g2 = canvas.createGraphics();

            // Simulate 60 frames of gameplay
            for (int i = 0; i < 60; i++) {
                if (i == 10) engine.handleKeyPressed(java.awt.event.KeyEvent.VK_RIGHT);
                if (i == 20) engine.handleKeyPressed(java.awt.event.KeyEvent.VK_SHIFT);
                if (i == 30) engine.handleKeyPressed(java.awt.event.KeyEvent.VK_SPACE);
                if (i == 40) engine.handleKeyPressed(java.awt.event.KeyEvent.VK_T);

                engine.update(0.016);
                engine.render(g2, 1280, 720);
            }
            g2.dispose();

            assertTrue("GameEngine simulated and rendered 60 frames with 0 errors", true);
            assertTrue("Anaconda survived and moved during simulation", engine.getAnaconda().getX() != 0.0);
        } catch (Exception e) {
            e.printStackTrace();
            assertTrue("GameEngine simulation threw exception: " + e.getMessage(), false);
        }
    }
}
