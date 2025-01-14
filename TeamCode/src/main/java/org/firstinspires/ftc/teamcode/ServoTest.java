package org.firstinspires.ftc.teamcode;

import com.acmerobotics.dashboard.config.Config;
import com.qualcomm.hardware.lynx.LynxModule;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.Servo;

import org.firstinspires.ftc.robotcore.external.navigation.CurrentUnit;

@Config
@TeleOp(name = "Servo Test", group = "Simple Testing")
public class ServoTest extends LinearOpMode {
    public static String name = "br";
    public static double position = 0;
    Servo servo;
    String lastName = name;

    @Override
    public void runOpMode() throws InterruptedException {
        servo = hardwareMap.get(Servo.class, name);

        waitForStart();
        while (opModeIsActive()) {
            servo.setPosition(position);
            if (!lastName.equals(name)) {
                servo = hardwareMap.get(Servo.class, name);
                lastName = name;
            }
            for (LynxModule module: hardwareMap.getAll(LynxModule.class)) {
                module.getGpioBusCurrent(CurrentUnit.AMPS);
            }
        }
    }
}
