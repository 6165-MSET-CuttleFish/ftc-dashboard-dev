package com.acmerobotics.dashboard.hardware;

import static com.acmerobotics.dashboard.config.reflection.ReflectionConfig.createVariableFromDouble;

import com.acmerobotics.dashboard.CustomVariableConsumer;
import com.acmerobotics.dashboard.DashboardCore;
import com.acmerobotics.dashboard.config.variable.ConfigVariable;
import com.acmerobotics.dashboard.config.variable.CustomVariable;
import com.qualcomm.robotcore.eventloop.opmode.Disabled;
import com.qualcomm.robotcore.eventloop.opmode.OpMode;
import com.qualcomm.robotcore.eventloop.opmode.OpModeManagerImpl;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorEx;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.hardware.Servo;

import org.firstinspires.ftc.robotcore.external.navigation.CurrentUnit;
import org.firstinspires.ftc.robotcore.internal.opmode.RegisteredOpModes;

public class HardwareOpMode extends OpModeManagerImpl.DefaultOpMode {
    DashboardCore core;
    OpMode opMode;
    public HardwareOpMode(DashboardCore core) {
        this.core = core;
        this.opMode = this;
        System.out.println("constructed");
    }

    @Override
    public void init_loop() {
        System.out.println("running1");
        core.withHardwareRoot(new CustomVariableConsumer() {
            @Override
            public void accept(CustomVariable hardwareRoot) {
                setHardware(hardwareRoot);
                addHardware(hardwareRoot);
            }
        });
    }

    @Override
    public void loop() {
        System.out.println("running2");
        core.withHardwareRoot(new CustomVariableConsumer() {
            @Override
            public void accept(CustomVariable hardwareRoot) {
                setHardware(hardwareRoot);
                addHardware(hardwareRoot);
            }
        });
    }

//    public boolean checkState(OpMode opMode) {
//        return !(opMode instanceof OpModeManagerImpl.DefaultOpMode);
//    }

    private void setHardware(CustomVariable hardwareRoot) {
        CustomVariable motorsVar = (CustomVariable) hardwareRoot.getVariable("Motors");
        if (motorsVar != null) {
            for (DcMotorSimple motor : opMode.hardwareMap.getAll(DcMotorSimple.class)) {
                DcMotorEx motorEx = (DcMotorEx) motor;
                String motorName = opMode.hardwareMap.getNamesOf(motorEx).iterator().next();
                CustomVariable motorVar = (CustomVariable) motorsVar.getVariable(motorName);
                if (motorVar != null) {
                    ConfigVariable<?> powerVar = motorVar.getVariable("Power");
                    ConfigVariable<?> positionVar = motorVar.getVariable("Target Position");
                    if (powerVar != null) {
                        double power = (double) powerVar.getValue();
                        motorEx.setPower(power);
                    }
                    if (positionVar != null) {
                        int position = (int) Math.round((double) positionVar.getValue());
                        motorEx.setTargetPosition(position);
                        motorEx.setMode(DcMotor.RunMode.RUN_TO_POSITION);
                    }
                }
            }
        }

        // Retrieve the "Servos" custom variable group
        CustomVariable servosVar = (CustomVariable) hardwareRoot.getVariable("Servos");
        if (servosVar != null) {
            for (Servo servo : opMode.hardwareMap.getAll(Servo.class)) {
                // Find the servo's name in the hardware map
                String servoName = servo.getDeviceName();
                CustomVariable servoVar = (CustomVariable) servosVar.getVariable(servoName);
                if (servoVar != null) {
                    // Retrieve the position variable and set it, if present
                    ConfigVariable<?> positionVar = servoVar.getVariable("Position");
                    if (positionVar != null) {
                        double position = (double) positionVar.getValue();
                        servo.setPosition(position);
                    }
                }
            }
        }

    }

    private void addHardware(CustomVariable hardwareRoot) {
        CustomVariable motors = new CustomVariable();

        for (DcMotorSimple motor : opMode.hardwareMap.getAll(DcMotorSimple.class)) {
            CustomVariable motorVar = new CustomVariable();
            DcMotorEx motorEx = (DcMotorEx) motor;

            String s = opMode.hardwareMap.getNamesOf(motorEx).toArray()[0].toString() + motorEx.getController().getConnectionInfo();

            for (int i = 0; i < s.length(); i++) {
                if (Character.isDigit(s.charAt(i))) {
                    s = s.substring(i);
                }
            }

            if (s.equals("173")) {
                s = "Control Hub";
            } else {
                s = "Expansion Hub " + s;
            }

            motorVar.putVariable("Power", createVariableFromDouble(motorEx.getPower()));
            motorVar.putVariable("Current Position", createVariableFromDouble(motorEx.getCurrentPosition()));
            motorVar.putVariable("Target Position", createVariableFromDouble(motorEx.getTargetPosition()));
            motorVar.putVariable("Current", createVariableFromDouble(motorEx.getCurrent(CurrentUnit.AMPS)));
            motorVar.putVariable(s + " Port", createVariableFromDouble(motorEx.getPortNumber()));

            motors.putVariable(opMode.hardwareMap.getNamesOf(motorEx).toArray()[0].toString(), motorVar);
        }


        motors.putVariable("test motor", createVariableFromDouble(23424.433));

        hardwareRoot.putVariable("Motors", motors);

        CustomVariable servos = new CustomVariable();


        for (Servo servo : opMode.hardwareMap.getAll(Servo.class)) {
            CustomVariable servoVar = new CustomVariable();

            String s = opMode.hardwareMap.getNamesOf(servo).toArray()[0].toString() + servo.getController().getConnectionInfo();

            for (int i = 0; i < s.length(); i++) {
                if (Character.isDigit(s.charAt(i))) {
                    s = s.substring(i);
                }
            }

            if (s.equals("173")) {
                s = "Control Hub";
            } else {
                s = "Expansion Hub " + s;
            }

            servoVar.putVariable("Position", createVariableFromDouble(servo.getPosition()));
            servoVar.putVariable(s + " Port", createVariableFromDouble(servo.getPortNumber()));

            servos.putVariable(opMode.hardwareMap.getNamesOf(servo).toArray()[0].toString(), servoVar);
        }



        servos.putVariable("test servo", createVariableFromDouble(5757.099));

        hardwareRoot.putVariable("Servos", servos);
    }

}