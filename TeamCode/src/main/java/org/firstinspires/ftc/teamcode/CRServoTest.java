package org.firstinspires.ftc.teamcode;

import com.acmerobotics.dashboard.config.Config;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.CRServo;
import com.qualcomm.robotcore.hardware.ColorSensor;

@TeleOp(name="CRServo Test", group="Simple Testing")
@Config
public class CRServoTest extends LinearOpMode {
    public static String name = "br";
    public static double power = 0;
    ColorSensor colorSensor;
    CRServo cr_servo;
    String lastName = name; // store so you know if name changes
    @Override
    public void runOpMode() throws InterruptedException {
        cr_servo = hardwareMap.get(CRServo.class, name);
        colorSensor = hardwareMap.get(ColorSensor.class, "colorSensor");
        waitForStart();
        while (opModeIsActive()) {
            cr_servo.setPower(power);
            if (!lastName.equals(name)) {

                cr_servo = hardwareMap.get(CRServo.class, name);
                lastName = name;
            }
        }
    }
}
