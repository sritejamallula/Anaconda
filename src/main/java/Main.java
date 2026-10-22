import assets.AssetLoader;
import game.GameConfig;
import game.GamePanel;
import save.SaveManager;

import javax.swing.*;
import java.awt.image.BufferedImage;

/**
 * Main application entry point for the Realistic Anaconda Survival Game.
 * Configures the desktop window, launches the 60 FPS graphics pipeline,
 * and handles clean shutdown hooks.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("===================================================================");
        System.out.println(" REALISTIC ANACONDA: AMAZON RAINFOREST SURVIVAL");
        System.out.println(" Java Swing & Java2D Mini Project");
        System.out.println("===================================================================");
        System.out.println("[Init] Booting Amazon simulation engine...");
        System.out.println("[Init] Java Runtime: " + System.getProperty("java.version") + " (" + System.getProperty("java.vendor") + ")");
        System.out.println("[Init] Operating System: " + System.getProperty("os.name"));

        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame(GameConfig.GAME_TITLE);
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setResizable(true);

            // Set Application Window Icon
            BufferedImage icon = AssetLoader.getInstance().getImage("anaconda_model");
            if (icon == null) {
                icon = AssetLoader.getInstance().getImage("scale_pattern");
            }
            if (icon != null) {
                frame.setIconImage(icon);
            }

            // Create Canvas Panel
            GamePanel panel = new GamePanel(GameConfig.DEFAULT_WINDOW_WIDTH, GameConfig.DEFAULT_WINDOW_HEIGHT);
            frame.getContentPane().add(panel);
            frame.pack();
            frame.setLocationRelativeTo(null); // Center on screen
            frame.setVisible(true);

            // Start 60 FPS game loop
            panel.start();
            System.out.println("[Engine] Game window launched successfully at 60 FPS.");
            System.out.println("[Controls] Press 'H' in-game for Wildlife Field Guide & Controls.");

            // Register clean shutdown hook for saving high scores
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("[Save] Persisting player expedition records...");
                SaveManager.getInstance().save();
                System.out.println("[Engine] Shutdown complete. Thank you for playing!");
            }));
        });
    }
}
