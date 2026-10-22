package ui;

import audio.SoundManager;
import game.GameConfig;

import java.awt.*;
import java.awt.geom.RoundRectangle2D;

/**
 * Pause Menu overlay offering Resume, Restart Level, Audio Toggle, and Main Menu navigation.
 */
public class PauseMenu {
    public enum PauseAction {
        NONE,
        RESUME,
        RESTART,
        TOGGLE_AUDIO,
        MAIN_MENU
    }

    private final Rectangle[] buttonBounds = new Rectangle[4];
    private final String[] buttonLabels = {
            "RESUME SURVIVAL",
            "RESTART LEVEL",
            "AUDIO: ON",
            "RETURN TO MENU"
    };
    private int hoveredButton = -1;

    public PauseMenu(int screenW, int screenH) {
        layoutButtons(screenW, screenH);
    }

    public void layoutButtons(int screenW, int screenH) {
        int btnW = 280;
        int btnH = 44;
        int startY = 280;
        int spacing = 58;

        for (int i = 0; i < buttonBounds.length; i++) {
            int bx = (screenW - btnW) / 2;
            int by = startY + i * spacing;
            buttonBounds[i] = new Rectangle(bx, by, btnW, btnH);
        }
    }

    public void update() {
        buttonLabels[2] = SoundManager.getInstance().isMuted() ? "AUDIO: MUTED [M]" : "AUDIO: ON [M]";
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

    public PauseAction handleMouseClick(int mx, int my) {
        for (int i = 0; i < buttonBounds.length; i++) {
            if (buttonBounds[i].contains(mx, my)) {
                SoundManager.getInstance().playAlert();
                switch (i) {
                    case 0: return PauseAction.RESUME;
                    case 1: return PauseAction.RESTART;
                    case 2:
                        SoundManager.getInstance().toggleMute();
                        return PauseAction.TOGGLE_AUDIO;
                    case 3: return PauseAction.MAIN_MENU;
                }
            }
        }
        return PauseAction.NONE;
    }

    public void render(Graphics2D g2, int screenW, int screenH) {
        Graphics2D g = (Graphics2D) g2.create();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Dark dimming backdrop
        g.setColor(new Color(6, 16, 10, 200));
        g.fillRect(0, 0, screenW, screenH);

        // Center card container
        int cardW = 380;
        int cardH = 340;
        int cardX = (screenW - cardW) / 2;
        int cardY = 210;

        g.setColor(new Color(16, 36, 22, 240));
        g.fill(new RoundRectangle2D.Double(cardX, cardY, cardW, cardH, 18, 18));
        g.setColor(new Color(70, 140, 60));
        g.setStroke(new BasicStroke(2.0f));
        g.draw(new RoundRectangle2D.Double(cardX, cardY, cardW, cardH, 18, 18));

        // Header Title
        g.setFont(GameConfig.FONT_TITLE);
        g.setColor(new Color(140, 230, 95));
        String title = "PAUSED";
        FontMetrics fm = g.getFontMetrics();
        g.drawString(title, (screenW - fm.stringWidth(title)) / 2, cardY + 50);

        // Buttons
        for (int i = 0; i < buttonBounds.length; i++) {
            Rectangle b = buttonBounds[i];
            boolean hovered = (i == hoveredButton);

            g.setColor(hovered ? new Color(55, 125, 60) : new Color(24, 52, 30));
            g.fill(new RoundRectangle2D.Double(b.x, b.y, b.width, b.height, 12, 12));

            g.setColor(hovered ? new Color(130, 255, 100) : new Color(65, 115, 55));
            g.setStroke(new BasicStroke(hovered ? 2.0f : 1.2f));
            g.draw(new RoundRectangle2D.Double(b.x, b.y, b.width, b.height, 12, 12));

            g.setFont(GameConfig.FONT_HUD);
            g.setColor(hovered ? Color.WHITE : new Color(220, 235, 210));
            FontMetrics fmBtn = g.getFontMetrics();
            int tx = b.x + (b.width - fmBtn.stringWidth(buttonLabels[i])) / 2;
            int ty = b.y + (b.height + fmBtn.getAscent() - fmBtn.getDescent()) / 2;
            g.drawString(buttonLabels[i], tx, ty);
        }

        g.dispose();
    }
}
