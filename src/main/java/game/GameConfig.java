package game;

import java.awt.Color;
import java.awt.Font;

/**
 * Global configuration constants for the Realistic Anaconda Survival Game.
 * Configured for 60 FPS gameplay, authentic Amazonian color palettes, and realistic physics.
 */
public final class GameConfig {
    private GameConfig() {} // Prevent instantiation

    // Window & Display Settings
    public static final String GAME_TITLE = "Realistic Anaconda: Amazon Rainforest Survival";
    public static final int DEFAULT_WINDOW_WIDTH = 1280;
    public static final int DEFAULT_WINDOW_HEIGHT = 720;
    public static final int TARGET_FPS = 60;
    public static final long FRAME_TIME_NANOS = 1_000_000_000L / TARGET_FPS;

    // Anaconda Physics & Movement
    public static final double BASE_SLITHER_SPEED = 180.0;    // Pixels per second
    public static final double WATER_SPEED_MULTIPLIER = 1.35; // Anacondas are faster and more agile swimmers!
    public static final double SPRINT_MULTIPLIER = 1.75;      // Slither burst
    public static final double STAMINA_CONSUMPTION_RATE = 28.0; // Per second during sprint
    public static final double STAMINA_RECOVERY_RATE = 16.0;    // Per second while resting
    public static final double TURN_RATE = 3.6;               // Radians per second
    public static final double STRIKE_SPEED = 460.0;          // Fast lunge speed
    public static final double STRIKE_RANGE = 95.0;           // Proximity required to initiate strike
    public static final double STRIKE_DURATION = 0.35;        // Seconds for lunging strike

    // Snake Spine & Segment Spacing
    public static final double SEGMENT_SPACING = 14.0;        // Arc-length distance between segments (px)
    public static final int INITIAL_SEGMENT_COUNT = 24;       // Starting juvenile length
    public static final double INITIAL_BASE_RADIUS = 12.0;    // Starting juvenile width (px)
    public static final int MAX_SEGMENTS = 90;                // Apex titan maximum segments

    // Amazon Color Palette
    public static final Color COLOR_RIVER_DEEP = new Color(14, 52, 62);
    public static final Color COLOR_RIVER_SHALLOW = new Color(32, 95, 102);
    public static final Color COLOR_RIVER_HIGHLIGHT = new Color(68, 168, 172, 90);
    public static final Color COLOR_MUD_SHORE = new Color(74, 52, 34);
    public static final Color COLOR_JUNGLE_SOIL = new Color(38, 56, 24);
    public static final Color COLOR_JUNGLE_FOLIAGE_DARK = new Color(20, 48, 16);
    public static final Color COLOR_JUNGLE_FOLIAGE_LIGHT = new Color(52, 110, 38);
    public static final Color COLOR_CANOPY_SUNLIGHT = new Color(255, 248, 200, 35);
    public static final Color COLOR_RIVER_MIST = new Color(200, 230, 240, 25);

    // Anaconda Color Scheme (Realistic Eunectes murinus)
    public static final Color ANACONDA_BASE_OLIVE = new Color(74, 94, 38);
    public static final Color ANACONDA_DARK_BLOTCH = new Color(24, 30, 16);
    public static final Color ANACONDA_OCELLI_YELLOW = new Color(205, 165, 55);
    public static final Color ANACONDA_BELLY_CREAM = new Color(200, 192, 140);
    public static final Color ANACONDA_WET_SHEEN = new Color(255, 255, 255, 55);
    public static final Color ANACONDA_EYE_AMBER = new Color(225, 160, 30);
    public static final Color ANACONDA_TONGUE_DARK = new Color(70, 20, 20);

    // Thermal Pit Vision Palette
    public static final Color THERMAL_BG = new Color(8, 16, 42);
    public static final Color THERMAL_WATER = new Color(4, 32, 70);
    public static final Color THERMAL_COLD_FOLIAGE = new Color(15, 45, 65);
    public static final Color THERMAL_PREY_CORE = new Color(255, 240, 60);
    public static final Color THERMAL_PREY_OUTER = new Color(255, 60, 20);

    // Typography
    public static final Font FONT_TITLE = new Font("SansSerif", Font.BOLD, 32);
    public static final Font FONT_SUBTITLE = new Font("SansSerif", Font.BOLD, 20);
    public static final Font FONT_HUD = new Font("SansSerif", Font.BOLD, 14);
    public static final Font FONT_HUD_SMALL = new Font("SansSerif", Font.PLAIN, 12);
    public static final Font FONT_RADAR = new Font("Monospaced", Font.BOLD, 11);
}
