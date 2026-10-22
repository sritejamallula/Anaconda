package audio;

import javax.sound.sampled.*;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

/**
 * Robust Java Sound API audio engine.
 * Provides a built-in procedural synthesizer generating realistic rainforest ambience,
 * strikes, constrictions, water splashes, and feeding gulps out-of-the-box,
 * alongside optional external .wav asset playback.
 */
public class SoundManager {
    private static SoundManager instance;
    private final Map<String, Clip> clipCache = new HashMap<>();
    private boolean muted = false;
    private float masterVolume = 0.85f;
    private Clip ambientLoopClip;

    private SoundManager() {
        initProceduralSounds();
        startAmbientSoundscape();
    }

    public static synchronized SoundManager getInstance() {
        if (instance == null) {
            instance = new SoundManager();
        }
        return instance;
    }

    public void setMuted(boolean muted) {
        this.muted = muted;
        if (ambientLoopClip != null) {
            if (muted) ambientLoopClip.stop();
            else ambientLoopClip.loop(Clip.LOOP_CONTINUOUSLY);
        }
    }

    public boolean isMuted() {
        return muted;
    }

    public void toggleMute() {
        setMuted(!muted);
    }

    /**
     * Synthesizes and pre-caches realistic procedural sound effects.
     */
    private void initProceduralSounds() {
        clipCache.put("strike", createClip(synthesizeStrikeSound()));
        clipCache.put("constrict", createClip(synthesizeConstrictionSound()));
        clipCache.put("gulp", createClip(synthesizeGulpSound()));
        clipCache.put("splash", createClip(synthesizeSplashSound()));
        clipCache.put("level_complete", createClip(synthesizeVictorySound()));
        clipCache.put("alert", createClip(synthesizeAlertSound()));
    }

    private void startAmbientSoundscape() {
        try {
            byte[] ambientData = synthesizeRainforestAmbience();
            ambientLoopClip = createClip(ambientData);
            if (ambientLoopClip != null && !muted) {
                ambientLoopClip.loop(Clip.LOOP_CONTINUOUSLY);
            }
        } catch (Exception ignored) {}
    }

    public void playStrike() { playClip("strike"); }
    public void playConstrict() { playClip("constrict"); }
    public void playGulp() { playClip("gulp"); }
    public void playSplash() { playClip("splash"); }
    public void playLevelComplete() { playClip("level_complete"); }
    public void playAlert() { playClip("alert"); }

    private void playClip(String key) {
        if (muted) return;
        Clip clip = clipCache.get(key);
        if (clip != null) {
            if (clip.isRunning()) clip.stop();
            clip.setFramePosition(0);
            clip.start();
        }
    }

    private Clip createClip(byte[] audioData) {
        if (audioData == null || audioData.length == 0) return null;
        try {
            AudioFormat format = new AudioFormat(22050, 16, 1, true, false);
            AudioInputStream ais = new AudioInputStream(new ByteArrayInputStream(audioData), format, audioData.length / 2);
            Clip clip = AudioSystem.getClip();
            clip.open(ais);
            return clip;
        } catch (Exception e) {
            return null;
        }
    }

    // ==========================================
    // PROCEDURAL AUDIO SYNTHESIZERS
    // ==========================================

    /**
     * Fast striking whip/lunge sound.
     */
    private byte[] synthesizeStrikeSound() {
        int sampleRate = 22050;
        int numSamples = (int) (sampleRate * 0.32);
        byte[] buffer = new byte[numSamples * 2];

        for (int i = 0; i < numSamples; i++) {
            double t = (double) i / sampleRate;
            double freq = 420.0 * (1.0 - t / 0.32) + 80.0;
            double env = Math.exp(-t * 14.0);
            double sample = Math.sin(2 * Math.PI * freq * t) * env;
            // Add subtle noise
            sample += (Math.random() - 0.5) * 0.25 * env;

            short val = (short) (sample * 28000);
            buffer[i * 2] = (byte) (val & 0xFF);
            buffer[i * 2 + 1] = (byte) ((val >> 8) & 0xFF);
        }
        return buffer;
    }

    /**
     * Tightening constriction struggle sound.
     */
    private byte[] synthesizeConstrictionSound() {
        int sampleRate = 22050;
        int numSamples = (int) (sampleRate * 0.65);
        byte[] buffer = new byte[numSamples * 2];

        for (int i = 0; i < numSamples; i++) {
            double t = (double) i / sampleRate;
            double freq = 90.0 + Math.sin(t * 18.0) * 25.0;
            double env = Math.sin((t / 0.65) * Math.PI);
            double sample = Math.sin(2 * Math.PI * freq * t) * env * 0.7;
            sample += (Math.random() - 0.5) * 0.35 * env;

            short val = (short) (sample * 24000);
            buffer[i * 2] = (byte) (val & 0xFF);
            buffer[i * 2 + 1] = (byte) ((val >> 8) & 0xFF);
        }
        return buffer;
    }

    /**
     * Aquatic swallowing / gulp sound.
     */
    private byte[] synthesizeGulpSound() {
        int sampleRate = 22050;
        int numSamples = (int) (sampleRate * 0.42);
        byte[] buffer = new byte[numSamples * 2];

        for (int i = 0; i < numSamples; i++) {
            double t = (double) i / sampleRate;
            double freq = 260.0 - 180.0 * (t / 0.42); // Frequency drop
            double env = Math.sin((t / 0.42) * Math.PI);
            double sample = Math.sin(2 * Math.PI * freq * t) * env;

            short val = (short) (sample * 26000);
            buffer[i * 2] = (byte) (val & 0xFF);
            buffer[i * 2 + 1] = (byte) ((val >> 8) & 0xFF);
        }
        return buffer;
    }

    /**
     * Water ripple / splash sound.
     */
    private byte[] synthesizeSplashSound() {
        int sampleRate = 22050;
        int numSamples = (int) (sampleRate * 0.38);
        byte[] buffer = new byte[numSamples * 2];

        for (int i = 0; i < numSamples; i++) {
            double t = (double) i / sampleRate;
            double env = Math.exp(-t * 9.0);
            double noise = (Math.random() - 0.5) * 2.0;
            double sample = noise * env * 0.6;

            short val = (short) (sample * 22000);
            buffer[i * 2] = (byte) (val & 0xFF);
            buffer[i * 2 + 1] = (byte) ((val >> 8) & 0xFF);
        }
        return buffer;
    }

    /**
     * Triumphant rainforest victory fanfare.
     */
    private byte[] synthesizeVictorySound() {
        int sampleRate = 22050;
        int numSamples = (int) (sampleRate * 0.95);
        byte[] buffer = new byte[numSamples * 2];

        double[] notes = {330.0, 392.0, 523.25, 659.25}; // E, G, C, E
        for (int i = 0; i < numSamples; i++) {
            double t = (double) i / sampleRate;
            int noteIdx = Math.min(notes.length - 1, (int) (t / 0.22));
            double freq = notes[noteIdx];
            double env = 1.0 - (t / 0.95);
            double sample = Math.sin(2 * Math.PI * freq * t) * env * 0.65;

            short val = (short) (sample * 24000);
            buffer[i * 2] = (byte) (val & 0xFF);
            buffer[i * 2 + 1] = (byte) ((val >> 8) & 0xFF);
        }
        return buffer;
    }

    private byte[] synthesizeAlertSound() {
        int sampleRate = 22050;
        int numSamples = (int) (sampleRate * 0.25);
        byte[] buffer = new byte[numSamples * 2];

        for (int i = 0; i < numSamples; i++) {
            double t = (double) i / sampleRate;
            double sample = Math.sin(2 * Math.PI * 880.0 * t) * Math.exp(-t * 12.0) * 0.4;
            short val = (short) (sample * 20000);
            buffer[i * 2] = (byte) (val & 0xFF);
            buffer[i * 2 + 1] = (byte) ((val >> 8) & 0xFF);
        }
        return buffer;
    }

    /**
     * Ambient 3-second continuous loop: rainforest wind, cicadas, and gentle river flowing.
     */
    private byte[] synthesizeRainforestAmbience() {
        int sampleRate = 22050;
        int numSamples = sampleRate * 3;
        byte[] buffer = new byte[numSamples * 2];

        for (int i = 0; i < numSamples; i++) {
            double t = (double) i / sampleRate;
            // 1. Gentle low river white noise
            double riverNoise = (Math.random() - 0.5) * 0.08;
            // 2. High cicada trill
            double cicada = Math.sin(2 * Math.PI * 4400.0 * t) * (0.04 + 0.03 * Math.sin(2 * Math.PI * 8.0 * t));
            // 3. Gentle jungle breeze modulation
            double breeze = Math.sin(2 * Math.PI * 0.35 * t) * 0.04;

            double sample = riverNoise + cicada + breeze;
            short val = (short) (sample * 16000);
            buffer[i * 2] = (byte) (val & 0xFF);
            buffer[i * 2 + 1] = (byte) ((val >> 8) & 0xFF);
        }
        return buffer;
    }
}
