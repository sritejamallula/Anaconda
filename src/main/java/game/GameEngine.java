package game;

import animals.FaunaManager;
import audio.SoundManager;
import levels.LevelData;
import levels.LevelManager;
import save.SaveManager;
import snake.Anaconda;
import snake.SnakeRenderer;
import ui.*;
import world.World;

import java.awt.*;
import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;

/**
 * Central game coordinator managing physics updates, rendering pipeline,
 * state machine transitions, camera tracking, and user input dispatch.
 */
public class GameEngine {
    private GameState state = GameState.MAIN_MENU;
    private GameState previousState = GameState.MAIN_MENU;

    // Characters & Environment
    private Anaconda anaconda;
    private final SnakeRenderer snakeRenderer = new SnakeRenderer();
    private World world;
    private final FaunaManager faunaManager = new FaunaManager();
    private final LevelManager levelManager = new LevelManager();
    private Camera camera;

    // UI Systems
    private final GameHUD gameHUD = new GameHUD();
    private final MiniMap miniMap = new MiniMap(1170, 610, 85);
    private final PreyCollectionPanel preyPanel = new PreyCollectionPanel();
    private final ThermalVisionRenderer thermalRenderer = new ThermalVisionRenderer();
    private final MainMenu mainMenu;
    private final PauseMenu pauseMenu;
    private final LevelCompleteOverlay levelOverlay;
    private final FieldGuideModal fieldGuideModal;
    private final LevelSelectMenu levelSelectMenu;

    // Controls & State
    private boolean keyUp, keyDown, keyLeft, keyRight;
    private boolean thermalVisionActive = false;
    private double waterRippleTimer = 0.0;

    public GameEngine(int screenW, int screenH) {
        this.camera = new Camera(screenW, screenH);
        this.mainMenu = new MainMenu(screenW, screenH);
        this.pauseMenu = new PauseMenu(screenW, screenH);
        this.levelOverlay = new LevelCompleteOverlay(screenW, screenH);
        this.fieldGuideModal = new FieldGuideModal(screenW, screenH);
        this.levelSelectMenu = new LevelSelectMenu(screenW, screenH);
        initLevel(1);
    }

    public void initLevel(int levelNumber) {
        levelManager.loadLevel(levelNumber);
        LevelData data = levelManager.getCurrentLevelData();

        this.world = new World(data.worldSize);
        this.world.setupLevel(data.island, data.river, data.obstacles, data.portal);

        this.faunaManager.clear();
        for (var prey : data.initialFauna) {
            this.faunaManager.addPrey(prey);
        }

        if (anaconda == null) {
            this.anaconda = new Anaconda(data.startX, data.startY, data.startAngle);
        } else {
            this.anaconda.resetForNewLevel(data.startX, data.startY, data.startAngle);
        }

        camera.setImmediatePosition(data.startX, data.startY);
    }

    public void update(double dt) {
        // Enforce 60 FPS delta cap to avoid large jumps
        dt = Math.min(0.05, dt);

        switch (state) {
            case MAIN_MENU:
                mainMenu.update(dt);
                break;

            case LEVEL_SELECT:
                break;

            case CONTROLS_MODAL:
                break;

            case PAUSED:
                pauseMenu.update();
                break;

            case LEVEL_TRANSITION:
            case VICTORY:
                levelOverlay.update(dt);
                break;

            case PLAYING:
            case HUNTING_CINEMATIC:
                updateGameplay(dt);
                break;
        }
    }

    private void updateGameplay(double dt) {
        // 1. Process Movement Inputs & Target Heading
        double dx = 0;
        double dy = 0;
        if (keyLeft) dx -= 1.0;
        if (keyRight) dx += 1.0;
        if (keyUp) dy -= 1.0;
        if (keyDown) dy += 1.0;

        if (dx != 0 || dy != 0) {
            double targetAngle = Math.atan2(dy, dx);
            anaconda.setSteerDirection(targetAngle);
        }

        // 2. Check Water vs Land Locomotion
        boolean inWater = world.isInWater(anaconda.getX(), anaconda.getY());

        // 3. Update Anaconda
        anaconda.update(dt, inWater);

        // 4. Update Camera Tracking
        camera.update(anaconda.getX(), anaconda.getY(), anaconda.getHeading(), anaconda.getSpeed(), dt);

        // 5. Water Ripple Trail when swimming
        if (inWater) {
            waterRippleTimer += dt;
            if (waterRippleTimer > 0.18) {
                world.getAtmosphericEffects().addRipple(anaconda.getX(), anaconda.getY(), anaconda.getBaseRadius() * 2.2);
                waterRippleTimer = 0.0;
            }
        }

        // 6. Update World Atmosphere & River
        world.update(dt);

        // 7. Update Fauna & Predation
        faunaManager.update(dt, anaconda, world, camera);

        // 8. Update Radar Minimap
        miniMap.update(dt);

        // 9. Check Level Objectives & River Crossing Portal
        int eatenInLevel = anaconda.getPreyEatenLevel();
        LevelData curData = levelManager.getCurrentLevelData();
        boolean objectiveMet = levelManager.isObjectiveCompleted(eatenInLevel);

        if (world.getExitPortal() != null) {
            world.getExitPortal().setUnlocked(objectiveMet);

            // Check if player reaches the unlocked river crossing portal
            if (world.getExitPortal().isTriggered(anaconda.getX(), anaconda.getY(), anaconda.getBaseRadius())) {
                SoundManager.getInstance().playLevelComplete();
                // Award level completion bonus
                SaveManager.getInstance().recordGameResults(
                        anaconda.getScore() + 1000,
                        anaconda.getPreyEatenTotal(),
                        levelManager.getCurrentLevelIndex() + 1
                );
                if (levelManager.getCurrentLevelIndex() >= 5) {
                    state = GameState.VICTORY;
                } else {
                    state = GameState.LEVEL_TRANSITION;
                }
            }
        }
    }

    public void render(Graphics2D g, int screenW, int screenH) {
        camera.setViewportSize(screenW, screenH);

        switch (state) {
            case MAIN_MENU:
                mainMenu.render(g, screenW, screenH);
                break;

            case LEVEL_SELECT:
                levelSelectMenu.render(g, screenW, screenH);
                break;

            case CONTROLS_MODAL:
                if (previousState == GameState.MAIN_MENU) {
                    mainMenu.render(g, screenW, screenH);
                } else {
                    renderGameScene(g, screenW, screenH);
                }
                fieldGuideModal.render(g, screenW, screenH);
                break;

            case PLAYING:
            case HUNTING_CINEMATIC:
                renderGameScene(g, screenW, screenH);
                break;

            case PAUSED:
                renderGameScene(g, screenW, screenH);
                pauseMenu.render(g, screenW, screenH);
                break;

            case LEVEL_TRANSITION:
            case VICTORY:
                renderGameScene(g, screenW, screenH);
                levelOverlay.render(
                        g,
                        levelManager.getCurrentLevelIndex(),
                        levelManager.getCurrentLevelData().name,
                        anaconda.getScore(),
                        anaconda.getTotalLengthMeters(),
                        anaconda.getGrowthStage(),
                        (state == GameState.VICTORY),
                        screenW, screenH
                );
                break;
        }
    }

    private void renderGameScene(Graphics2D g, int screenW, int screenH) {
        // 1. World Background (Rivers, Islands, Lower Atmospheric ripples, Obstacles)
        world.renderBackground(g, camera);

        // 2. Fauna (Living prey species)
        faunaManager.render(g, camera, anaconda);

        // 3. Photorealistic Anaconda
        snakeRenderer.render(g, anaconda, camera);

        // 4. World Foreground (Canopy god-rays, morning mist, butterflies, spores)
        world.renderForeground(g, camera);

        // 5. Thermal Vision Post-Processing (If active)
        if (thermalVisionActive) {
            thermalRenderer.render(g, camera, faunaManager.getActivePrey(), screenW, screenH);
        }

        // 6. Tactical HUD Overlay
        LevelData data = levelManager.getCurrentLevelData();
        boolean portalUnlocked = (world.getExitPortal() != null && world.getExitPortal().isUnlocked());
        gameHUD.render(
                g, anaconda,
                data.levelNumber, data.name,
                anaconda.getPreyEatenLevel(), data.requiredPreyQuota,
                portalUnlocked, SaveManager.getInstance().getHighScore()
        );

        // 7. Tactical Bio-Radar Minimap
        miniMap.render(g, anaconda, world, faunaManager.getActivePrey());

        // 8. Fauna Collection Roster Panel
        preyPanel.render(g, faunaManager);
    }

    // ==========================================
    // INPUT HANDLING
    // ==========================================

    public void handleKeyPressed(int keyCode) {
        switch (keyCode) {
            case KeyEvent.VK_W:
            case KeyEvent.VK_UP:
                keyUp = true;
                break;
            case KeyEvent.VK_S:
            case KeyEvent.VK_DOWN:
                keyDown = true;
                break;
            case KeyEvent.VK_A:
            case KeyEvent.VK_LEFT:
                keyLeft = true;
                break;
            case KeyEvent.VK_D:
            case KeyEvent.VK_RIGHT:
                keyRight = true;
                break;

            case KeyEvent.VK_SHIFT:
                if (anaconda != null) anaconda.setSprinting(true);
                break;

            case KeyEvent.VK_SPACE:
                if (state == GameState.PLAYING && anaconda != null) {
                    anaconda.startStrike();
                    SoundManager.getInstance().playStrike();
                }
                break;

            case KeyEvent.VK_T:
                thermalVisionActive = !thermalVisionActive;
                SoundManager.getInstance().playAlert();
                break;

            case KeyEvent.VK_M:
                SoundManager.getInstance().toggleMute();
                break;

            case KeyEvent.VK_P:
            case KeyEvent.VK_ESCAPE:
                if (state == GameState.PLAYING) {
                    state = GameState.PAUSED;
                } else if (state == GameState.PAUSED) {
                    state = GameState.PLAYING;
                } else if (state == GameState.CONTROLS_MODAL) {
                    state = previousState;
                }
                break;

            case KeyEvent.VK_H:
            case KeyEvent.VK_F1:
                if (state != GameState.CONTROLS_MODAL) {
                    previousState = state;
                    state = GameState.CONTROLS_MODAL;
                } else {
                    state = previousState;
                }
                break;
        }
    }

    public void handleKeyReleased(int keyCode) {
        switch (keyCode) {
            case KeyEvent.VK_W:
            case KeyEvent.VK_UP:
                keyUp = false;
                break;
            case KeyEvent.VK_S:
            case KeyEvent.VK_DOWN:
                keyDown = false;
                break;
            case KeyEvent.VK_A:
            case KeyEvent.VK_LEFT:
                keyLeft = false;
                break;
            case KeyEvent.VK_D:
            case KeyEvent.VK_RIGHT:
                keyRight = false;
                break;

            case KeyEvent.VK_SHIFT:
                if (anaconda != null) anaconda.setSprinting(false);
                break;
        }
    }

    public void handleMouseMove(int mx, int my) {
        if (state == GameState.MAIN_MENU) {
            mainMenu.handleMouseMove(mx, my);
        } else if (state == GameState.PAUSED) {
            pauseMenu.handleMouseMove(mx, my);
        } else if (state == GameState.LEVEL_TRANSITION || state == GameState.VICTORY) {
            levelOverlay.handleMouseMove(mx, my);
        } else if (state == GameState.CONTROLS_MODAL) {
            fieldGuideModal.handleMouseMove(mx, my);
        } else if (state == GameState.LEVEL_SELECT) {
            levelSelectMenu.handleMouseMove(mx, my);
        }
    }

    public void handleMouseClick(MouseEvent e) {
        int mx = e.getX();
        int my = e.getY();

        if (state == GameState.MAIN_MENU) {
            MainMenu.MenuAction action = mainMenu.handleMouseClick(mx, my);
            switch (action) {
                case START_GAME:
                    initLevel(1);
                    state = GameState.PLAYING;
                    break;
                case OPEN_LEVEL_SELECT:
                    state = GameState.LEVEL_SELECT;
                    break;
                case OPEN_CONTROLS:
                    previousState = state;
                    state = GameState.CONTROLS_MODAL;
                    break;
                case TOGGLE_AUDIO:
                    break;
                case EXIT:
                    System.exit(0);
                    break;
                case NONE:
                    break;
            }
        } else if (state == GameState.LEVEL_SELECT) {
            int selected = levelSelectMenu.handleMouseClick(mx, my);
            if (selected > 0) {
                initLevel(selected);
                state = GameState.PLAYING;
            } else if (selected == 0) {
                state = GameState.MAIN_MENU;
            }
        } else if (state == GameState.PAUSED) {
            PauseMenu.PauseAction action = pauseMenu.handleMouseClick(mx, my);
            switch (action) {
                case RESUME:
                    state = GameState.PLAYING;
                    break;
                case RESTART:
                    initLevel(levelManager.getCurrentLevelIndex());
                    state = GameState.PLAYING;
                    break;
                case TOGGLE_AUDIO:
                    break;
                case MAIN_MENU:
                    state = GameState.MAIN_MENU;
                    break;
                case NONE:
                    break;
            }
        } else if (state == GameState.LEVEL_TRANSITION || state == GameState.VICTORY) {
            LevelCompleteOverlay.LevelOverlayAction action = levelOverlay.handleMouseClick(mx, my);
            switch (action) {
                case ADVANCE_LEVEL:
                    if (state == GameState.VICTORY) {
                        initLevel(1);
                        state = GameState.PLAYING;
                    } else if (levelManager.advanceToNextLevel()) {
                        initLevel(levelManager.getCurrentLevelIndex());
                        state = GameState.PLAYING;
                    }
                    break;
                case RETURN_TO_MENU:
                    state = GameState.MAIN_MENU;
                    break;
                case NONE:
                    break;
            }
        } else if (state == GameState.CONTROLS_MODAL) {
            if (fieldGuideModal.handleMouseClick(mx, my)) {
                state = previousState;
            }
        } else if (state == GameState.PLAYING) {
            // Left click initiates fast strike
            if (e.getButton() == MouseEvent.BUTTON1 && anaconda != null) {
                anaconda.startStrike();
                SoundManager.getInstance().playStrike();
            }
        }
    }

    public GameState getState() { return state; }
    public void setState(GameState state) { this.state = state; }
    public Anaconda getAnaconda() { return anaconda; }
    public World getWorld() { return world; }
    public FaunaManager getFaunaManager() { return faunaManager; }
    public LevelManager getLevelManager() { return levelManager; }
}
