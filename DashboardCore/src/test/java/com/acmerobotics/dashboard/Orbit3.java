package com.acmerobotics.dashboard;

import com.acmerobotics.dashboard.telemetry.TelemetryPacket;
import com.acmerobotics.dashboard.testopmode.TestOpMode;

/*
 * Demonstration of the dashboard's field overlay display capabilities.
 */

public class Orbit3 extends TestOpMode {
    TestDashboardInstance dashboard;
    double timestart = -1;
    public static double ORBITAL_FREQUENCY = 0.15;
    public static double SPIN_FREQUENCY = 0.5;

    public static double ORBITAL_RADIUS = 40;
    public static double SIDE_LENGTH = 10;
    public Orbit3() {
        super("Orbit Green");
    }
    private static void rotatePoints(double[] xPoints, double[] yPoints, double angle) {
        for (int i = 0; i < xPoints.length; i++) {
            double x = xPoints[i];
            double y = yPoints[i];
            xPoints[i] = x * Math.cos(angle) - y * Math.sin(angle);
            yPoints[i] = x * Math.sin(angle) + y * Math.cos(angle);
        }
    }

    @Override
    protected void init() {
        dashboard = TestDashboardInstance.getInstance();
        timestart = -1000;
    }

    @Override
    protected void loop() throws InterruptedException {
        if (timestart < 0){
            timestart = System.currentTimeMillis() / 1000d;
        }
        double time = System.currentTimeMillis() / 1000d - timestart;

        double bx = ORBITAL_RADIUS * Math.cos(2 * Math.PI * ORBITAL_FREQUENCY * time);
        double by = ORBITAL_RADIUS * Math.sin(2 * Math.PI * ORBITAL_FREQUENCY * time);
        double l = SIDE_LENGTH / 2;

        double[] bxPoints = {l, -l, -l, l};
        double[] byPoints = {l, l, -l, -l};
        rotatePoints(bxPoints, byPoints, 2 * Math.PI * SPIN_FREQUENCY * time);
        for (int i = 0; i < 4; i++) {
            bxPoints[i] += bx;
            byPoints[i] += by;
        }

        TelemetryPacket packet = new TelemetryPacket();
        packet.fieldOverlay()
                .setStrokeWidth(1)
                .setStroke("goldenrod")
                .strokeCircle(0, 0, ORBITAL_RADIUS)
                .setFill("green")
                .fillPolygon(bxPoints, byPoints);
        dashboard.sendTelemetryPacket(packet);
        Thread.sleep(10);
    }
}
