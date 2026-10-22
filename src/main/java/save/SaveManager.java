package save;

import java.io.*;
import java.util.Properties;

/**
 * Local persistent data manager for high scores, unlocked levels, and preferences.
 * Implements resilient file I/O with automatic fallback defaults.
 */
public class SaveManager {
    private static SaveManager instance;
    private static final String SAVE_FILE = "save_data.dat";

    private int highScore = 0;
    private int highestUnlockedLevel = 1;
    private int totalPreyDevoured = 0;
    private boolean muted = false;

    private SaveManager() {
        load();
    }

    public static synchronized SaveManager getInstance() {
        if (instance == null) {
            instance = new SaveManager();
        }
        return instance;
    }

    public synchronized void load() {
        File file = new File(SAVE_FILE);
        if (!file.exists()) {
            return; // Use defaults
        }

        Properties props = new Properties();
        try (FileInputStream in = new FileInputStream(file)) {
            props.load(in);
            this.highScore = Integer.parseInt(props.getProperty("highScore", "0"));
            this.highestUnlockedLevel = Integer.parseInt(props.getProperty("highestUnlockedLevel", "1"));
            this.totalPreyDevoured = Integer.parseInt(props.getProperty("totalPreyDevoured", "0"));
            this.muted = Boolean.parseBoolean(props.getProperty("muted", "false"));
        } catch (Exception ignored) {
            // Defaults preserved
        }
    }

    public synchronized void save() {
        Properties props = new Properties();
        props.setProperty("highScore", String.valueOf(highScore));
        props.setProperty("highestUnlockedLevel", String.valueOf(highestUnlockedLevel));
        props.setProperty("totalPreyDevoured", String.valueOf(totalPreyDevoured));
        props.setProperty("muted", String.valueOf(muted));

        try (FileOutputStream out = new FileOutputStream(SAVE_FILE)) {
            props.store(out, "Realistic Anaconda: Amazon Survival Save Data");
        } catch (IOException ignored) {}
    }

    public synchronized void recordGameResults(int score, int preyEaten, int levelReached) {
        if (score > highScore) {
            highScore = score;
        }
        totalPreyDevoured += preyEaten;
        if (levelReached > highestUnlockedLevel) {
            highestUnlockedLevel = Math.min(5, levelReached);
        }
        save();
    }

    public int getHighScore() { return highScore; }
    public int getHighestUnlockedLevel() { return highestUnlockedLevel; }
    public int getTotalPreyDevoured() { return totalPreyDevoured; }
    public boolean isMuted() { return muted; }
    public void setMuted(boolean muted) { this.muted = muted; save(); }
}
