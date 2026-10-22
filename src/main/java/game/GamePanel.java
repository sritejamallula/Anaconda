package game;

import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

/**
 * Double-buffered Swing drawing canvas and input dispatcher.
 * Drives the 60 FPS update and render cycle.
 */
public class GamePanel extends JPanel implements KeyListener, MouseListener, MouseMotionListener {
    private final GameEngine engine;
    private final Timer gameTimer;
    private long lastTimeNanos;

    public GamePanel(int width, int height) {
        setPreferredSize(new Dimension(width, height));
        setBackground(Color.BLACK);
        setFocusable(true);
        setDoubleBuffered(true);

        this.engine = new GameEngine(width, height);
        this.lastTimeNanos = System.nanoTime();

        addKeyListener(this);
        addMouseListener(this);
        addMouseMotionListener(this);

        // 60 FPS Swing Timer Loop
        int delayMs = 1000 / GameConfig.TARGET_FPS;
        this.gameTimer = new Timer(delayMs, (ActionEvent e) -> {
            long now = System.nanoTime();
            double dt = (now - lastTimeNanos) / 1_000_000_000.0;
            lastTimeNanos = now;

            engine.update(dt);
            repaint();
        });
    }

    public void start() {
        lastTimeNanos = System.nanoTime();
        gameTimer.start();
        requestFocusInWindow();
    }

    public void stop() {
        gameTimer.stop();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g;
        engine.render(g2, getWidth(), getHeight());
    }

    // ==========================================
    // INPUT DISPATCH
    // ==========================================

    @Override
    public void keyPressed(KeyEvent e) {
        engine.handleKeyPressed(e.getKeyCode());
    }

    @Override
    public void keyReleased(KeyEvent e) {
        engine.handleKeyReleased(e.getKeyCode());
    }

    @Override
    public void keyTyped(KeyEvent e) {}

    @Override
    public void mouseMoved(MouseEvent e) {
        engine.handleMouseMove(e.getX(), e.getY());
    }

    @Override
    public void mouseDragged(MouseEvent e) {
        engine.handleMouseMove(e.getX(), e.getY());
    }

    @Override
    public void mouseClicked(MouseEvent e) {
        engine.handleMouseClick(e);
    }

    @Override
    public void mousePressed(MouseEvent e) {}

    @Override
    public void mouseReleased(MouseEvent e) {}

    @Override
    public void mouseEntered(MouseEvent e) {}

    @Override
    public void mouseExited(MouseEvent e) {}

    public GameEngine getEngine() {
        return engine;
    }
}
