package com.acmerobotics.dashboard;


import com.acmerobotics.dashboard.config.ValueProvider;
import com.acmerobotics.dashboard.telemetry.TelemetryPacket;
import com.acmerobotics.dashboard.testopmode.TestOpMode;

/*
 * Demonstration of the dashboard's field overlay display capabilities.
 */

public class OrbitOverload extends TestOpMode {
    TestDashboardInstance dashboard;
    public double timestart = -1000;
    public static double MAX_ORBIT_FREQUENCY = .5;
    public static double MIN_ORBIT_FREQUENCY = 2;

    public static double SPIN_FREQUENCY = 1;

    public static double MAX_ORBITAL_RADIUS = 75;
    public static double MIN_ORBITAL_RADIUS = 5;

    public static double SIDE_LENGTH = 5;

    public static int ORBITS = 20;
    public OrbitOverload() {
        super("Orbit Overload");
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

        TelemetryPacket packet = new TelemetryPacket();

        for (int n = 0; n < ORBITS; n++) {
            double radius = (MIN_ORBITAL_RADIUS + n * (MAX_ORBITAL_RADIUS-MIN_ORBITAL_RADIUS)/ORBITS);
            double frequency = MAX_ORBIT_FREQUENCY - n * (MAX_ORBIT_FREQUENCY-MIN_ORBIT_FREQUENCY)/ORBITS;
            double bx =  radius * Math.cos(2 * Math.PI * frequency * time);
            double by = radius * Math.sin(2 * Math.PI * frequency * time);
            double l = SIDE_LENGTH / 2;

            double[] bxPoints = {l, -l, -l, l};
            double[] byPoints = {l, l, -l, -l};
            rotatePoints(bxPoints, byPoints, 2 * Math.PI * SPIN_FREQUENCY * time);
            for (int i = 0; i < 4; i++) {
                bxPoints[i] += bx;
                byPoints[i] += by;
            }


            packet.fieldOverlay()
                    .setStrokeWidth(1)
                    .setFill("black")
                    .fillPolygon(bxPoints, byPoints);

        }
        dashboard.sendTelemetryPacket(packet);
    }
}
