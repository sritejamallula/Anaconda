package ui;

import assets.AssetLoader;
import audio.SoundManager;
import game.GameConfig;
import save.SaveManager;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;

/**
 * Amazon rainforest themed main menu with button interaction, high score presentation,
 * level select entry, and audio controls.
 */
public class MainMenu {
    public enum MenuAction {
        NONE,
        START_GAME,
        OPEN_LEVEL_SELECT,
        OPEN_CONTROLS,
        TOGGLE_AUDIO,
        EXIT
    }

    private final Rectangle[] buttonBounds = new Rectangle[5];
    private final String[] buttonLabels = {
            "START SURVIVAL",
            "LEVEL SELECT",
            "FIELD GUIDE & CONTROLS",
            "AUDIO: ON",
            "EXIT"
    };
    private int hoveredButton = -1;
    private double animTime = 0.0;

    public MainMenu(int screenW, int screenH) {
        layoutButtons(screenW, screenH);
    }

    public void layoutButtons(int screenW, int screenH) {
        int btnW = 320;
        int btnH = 46;
        int startY = 320;
        int spacing = 60;

        for (int i = 0; i < buttonBounds.length; i++) {
            int bx = (screenW - btnW) / 2;
            int by = startY + i * spacing;
            buttonBounds[i] = new Rectangle(bx, by, btnW, btnH);
        }
    }

    public void update(double dt) {
        animTime += dt;
        buttonLabels[3] = SoundManager.getInstance().isMuted() ? "AUDIO: MUTED [M]" : "AUDIO: ON [M]";
    }

    public void handleMouseMove(int mx, int my) {
        hoveredButton = -1;
        for (int i = 0; i < buttonBounds.length; i++) {
            if (buttonBounds[i].contains(mx, my)) {
                hoveredButton = i;
                break;
            }
        }
    }

    public MenuAction handleMouseClick(int mx, int my) {
        for (int i = 0; i < buttonBounds.length; i++) {
            if (buttonBounds[i].contains(mx, my)) {
                SoundManager.getInstance().playAlert();
                switch (i) {
                    case 0: return MenuAction.START_GAME;
                    case 1: return MenuAction.OPEN_LEVEL_SELECT;
                    case 2: return MenuAction.OPEN_CONTROLS;
                    case 3:
                        SoundManager.getInstance().toggleMute();
                        return MenuAction.TOGGLE_AUDIO;
                    case 4: return MenuAction.EXIT;
                }
            }
        }
        return MenuAction.NONE;
    }

    public void render(Graphics2D g2, int screenW, int screenH) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // 1. Background image (flooded forest / anaconda model concept art if available)
        BufferedImage bg = AssetLoader.getInstance().getImage("marajo_island");
        if (bg == null) bg = AssetLoader.getInstance().getImage("flooded_forest");
        if (bg != null) {
            g.drawImage(bg, 0, 0, screenW, screenH, null);
            // Dark gradient overlay for readability
            GradientPaint overlay = new GradientPaint(
                    0, 0, new Color(8, 20, 12, 190),
                    0, screenH, new Color(4, 12, 8, 230)
            );
            g.setPaint(overlay);
            g.fillRect(0, 0, screenW, screenH);
        } else {
            // Procedural deep jungle background
            GradientPaint grad = new GradientPaint(
                    0, 0, new Color(14, 42, 20),
                    0, screenH, new Color(4, 16, 10)
            );
            g.setPaint(grad);
            g.fillRect(0, 0, screenW, screenH);
        }

        // 2. Animated Title Banner
        double wave = Math.sin(animTime * 1.5) * 4.0;
        g.setFont(GameConfig.FONT_TITLE);
        String title = "REALISTIC ANACONDA";
        FontMetrics fm = g.getFontMetrics();
        int titleX = (screenW - fm.stringWidth(title)) / 2;
        int titleY = (int) (140 + wave);

        // Title drop shadow
        g.setColor(new Color(0, 0, 0, 180));
        g.drawString(title, titleX + 3, titleY + 3);

        // Radiant golden-green title gradient
        GradientPaint titleGrad = new GradientPaint(
                titleX, titleY - 25, new Color(175, 235, 90),
                titleX, titleY, new Color(110, 185, 45)
        );
        g.setPaint(titleGrad);
        g.drawString(title, titleX, titleY);

        // Subtitle
        g.setFont(GameConfig.FONT_SUBTITLE);
        String sub = "AMAZON RAINFOREST SURVIVAL";
        FontMetrics fmSub = g.getFontMetrics();
        int subX = (screenW - fmSub.stringWidth(sub)) / 2;
        g.setColor(new Color(230, 240, 220));
        g.drawString(sub, subX, titleY + 36);

        g.setFont(GameConfig.FONT_HUD_SMALL);
        String species = "Eunectes murinus Apex Predator Simulator";
        FontMetrics fmSp = g.getFontMetrics();
        g.setColor(new Color(170, 205, 150));
        g.drawString(species, (screenW - fmSp.stringWidth(species)) / 2, titleY + 62);

        // 3. Interactive Menu Buttons
        for (int i = 0; i < buttonBounds.length; i++) {
            Rectangle b = buttonBounds[i];
            boolean hovered = (i == hoveredButton);

            // Button Fill
            if (hovered) {
                g.setColor(new Color(55, 130, 60, 235));
            } else {
                g.setColor(new Color(20, 48, 26, 210));
            }
            g.fill(new RoundRectangle2D.Double(b.x, b.y, b.width, b.height, 14, 14));

            // Button Border
            g.setColor(hovered ? new Color(140, 255, 110) : new Color(70, 120, 60));
            g.setStroke(new BasicStroke(hovered ? 2.2f : 1.4f));
            g.draw(new RoundRectangle2D.Double(b.x, b.y, b.width, b.height, 14, 14));

            // Button Text
            g.setFont(GameConfig.FONT_HUD);
            g.setColor(hovered ? Color.WHITE : new Color(225, 240, 215));
            FontMetrics fmBtn = g.getFontMetrics();
            int tx = b.x + (b.width - fmBtn.stringWidth(buttonLabels[i])) / 2;
            int ty = b.y + (b.height + fmBtn.getAscent() - fmBtn.getDescent()) / 2;
            g.drawString(buttonLabels[i], tx, ty);
        }

        // 4. Persistent High Score & Stats
        SaveManager save = SaveManager.getInstance();
        g.setFont(GameConfig.FONT_HUD_SMALL);
        g.setColor(new Color(190, 220, 180));
        String stats = String.format("HIGH SCORE: %,d  |  PREY DEVOURED: %,d  |  UNLOCKED: LEVEL %d/5",
                save.getHighScore(), save.getTotalPreyDevoured(), save.getHighestUnlockedLevel());
        FontMetrics fmSt = g.getFontMetrics();
        g.drawString(stats, (screenW - fmSt.stringWidth(stats)) / 2, screenH - 30);

        g.dispose();
    }
}
