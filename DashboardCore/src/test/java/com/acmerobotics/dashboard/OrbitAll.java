package com.acmerobotics.dashboard;


import com.acmerobotics.dashboard.config.ValueProvider;
import com.acmerobotics.dashboard.telemetry.TelemetryPacket;
import com.acmerobotics.dashboard.testopmode.TestOpMode;

/*
 * Demonstration of the dashboard's field overlay display capabilities.
 */

public class OrbitAll extends TestOpMode {
    TestDashboardInstance dashboard;
    public double timestart = -1000;
    public static double[] ORBITAL_FREQUENCY = {0.1, 0.05, 0.15};

    public static double[] ORBITAL_RADIUS = {50, 60, 40};
    public static double RADIUS = 4;
    public OrbitAll() {
        super("Orbit All");
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
        double time = (System.currentTimeMillis() / 1000d) - timestart;

        double[] bx = new double[3];
        double[] by = new double[3];

        for (int i = 0; i < 3; i++) {
            bx[i] = ORBITAL_RADIUS[i] * Math.cos(2 * Math.PI * ORBITAL_FREQUENCY[i] * time);
            by[i] = ORBITAL_RADIUS[i] * Math.sin(2 * Math.PI * ORBITAL_FREQUENCY[i] * time);

        }

        TelemetryPacket packet = new TelemetryPacket();
        packet.fieldOverlay()
                .setStrokeWidth(1)
                .setStroke("black")
                .strokeCircle(bx[0], by[0], RADIUS)
                .strokeCircle(bx[1], by[1], RADIUS)
                .strokeCircle(bx[2], by[2], RADIUS);

        dashboard.sendTelemetryPacket(packet);
        Thread.sleep(10);
    }
}
