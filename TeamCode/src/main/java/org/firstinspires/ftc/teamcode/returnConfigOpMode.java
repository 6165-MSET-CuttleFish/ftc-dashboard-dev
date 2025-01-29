package org.firstinspires.ftc.teamcode;

import com.acmerobotics.dashboard.FtcDashboard;
import com.acmerobotics.dashboard.telemetry.MultipleTelemetry;
import com.acmerobotics.dashboard.telemetry.TelemetryPacket;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.hardware.Servo;

@TeleOp
public class returnConfigOpMode extends LinearOpMode {

    MultipleTelemetry tel;
    @Override
    public void runOpMode() throws InterruptedException {
        tel = new MultipleTelemetry(telemetry, FtcDashboard.getInstance().getTelemetry());
        waitForStart();

        while (opModeIsActive()) {
            for (DcMotorSimple motor: hardwareMap.getAll(DcMotorSimple.class)) {
                tel.addData(motor.getDeviceName(), "");
            }
            for (Servo servo: hardwareMap.getAll(Servo.class)) {
                tel.addData(servo.getDeviceName(), "");
            }

            tel.addLine("________");
            tel.update();
        }

    }
}
