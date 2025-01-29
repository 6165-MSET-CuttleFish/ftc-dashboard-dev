package org.firstinspires.ftc.teamcode;

import com.acmerobotics.dashboard.config.Config;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotorEx;

@Config
@TeleOp(name="Motor Test", group="Simple Testing")
public class MotorTest extends LinearOpMode {

    public static String name = "br";
    public static double power = 0;
    DcMotorEx motor;
    String lastName = name;
    @Override
    public void runOpMode() throws InterruptedException {
        motor = hardwareMap.get(DcMotorEx.class, name);
        waitForStart();
        while (opModeIsActive()) {
            motor.setPower(power);
            if (!lastName.equals(name)) {
                motor.setPower(0);
                motor = hardwareMap.get(DcMotorEx.class, name);
                lastName = name;
            }
        }
    }
}
