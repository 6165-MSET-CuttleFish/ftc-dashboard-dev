package com.acmerobotics.dashboard.hardware;

import static com.acmerobotics.dashboard.config.reflection.ReflectionConfig.createVariableFromDouble;

import com.acmerobotics.dashboard.CustomVariableConsumer;
import com.acmerobotics.dashboard.DashboardCore;
import com.acmerobotics.dashboard.config.variable.ConfigVariable;
import com.acmerobotics.dashboard.config.variable.CustomVariable;
import com.qualcomm.robotcore.eventloop.opmode.OpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorEx;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.hardware.HardwareDevice;
import com.qualcomm.robotcore.hardware.Servo;

@TeleOp(name = "HardwareOpMode", group = "Dashboard")
public class HardwareOpMode extends OpMode {
    DashboardCore core;
    OpMode opMode;

    public HardwareOpMode(DashboardCore core) {
        this.core = core;
        this.opMode = this;
        System.out.println("HardwareOpMode constructed");
    }

    @Override
    public void init() {

    }

    @Override
    public void init_loop() {
        System.out.println("HardwareOpMode init_loop running");
        core.withHardwareRoot(new CustomVariableConsumer() {
            @Override
            public void accept(CustomVariable hardwareRoot) {
                if (opMode.hardwareMap != null) {
                    setHardware(hardwareRoot);
                    addHardware(hardwareRoot);
                }
            }
        });
    }

    @Override
    public void loop() {
        System.out.println("HardwareOpMode loop running");
        core.withHardwareRoot(new CustomVariableConsumer() {
            @Override
            public void accept(CustomVariable hardwareRoot) {
                if (opMode.hardwareMap != null) {
                    setHardware(hardwareRoot);
                    addHardware(hardwareRoot);
                }
            }
        });
    }

    private void setHardware(CustomVariable hardwareRoot) {
        CustomVariable motorsVar = (CustomVariable) hardwareRoot.getVariable("Motors");
        if (motorsVar != null) {
            for (DcMotorSimple motor : opMode.hardwareMap.getAll(DcMotorSimple.class)) {
                DcMotorEx motorEx = (DcMotorEx) motor;
                String motorName = getDeviceName(motorEx);
                if (motorName == null) continue;
                CustomVariable motorVar = (CustomVariable) motorsVar.getVariable(motorName);
                if (motorVar != null) {
                    ConfigVariable<?> powerVar = motorVar.getVariable("Power");
                    ConfigVariable<?> targetPosVar = motorVar.getVariable("Target Position");
                    if (powerVar != null) {
                        double power = (double) powerVar.getValue();
                        motorEx.setPower(power);
                    }
                    if (targetPosVar != null) {
                        int position = (int) Math.round((double) targetPosVar.getValue());
                        try {
                            motorEx.setTargetPosition(position);
                            motorEx.setMode(DcMotor.RunMode.RUN_TO_POSITION);
                        } catch (Exception e) {
                            System.out.println("Error setting target position for motor " + motorName + ": " + e);
                        }
                    }
                }
            }
        }

        CustomVariable servosVar = (CustomVariable) hardwareRoot.getVariable("Servos");
        if (servosVar != null) {
            for (Servo servo : opMode.hardwareMap.getAll(Servo.class)) {
                String servoName = getDeviceName(servo);
                if (servoName == null) continue;
                CustomVariable servoVar = (CustomVariable) servosVar.getVariable(servoName);
                if (servoVar != null) {
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
            String deviceName = getDeviceName(motorEx);
            if (deviceName == null) continue;

            String connectionInfo = motorEx.getController().getConnectionInfo();
            String hubType = extractHubType(connectionInfo);

            motorVar.putVariable("Power", createVariableFromDouble(motorEx.getPower()));
            motorVar.putVariable("Current Position", createVariableFromDouble(motorEx.getCurrentPosition()));
            motorVar.putVariable("Target Position", createVariableFromDouble(motorEx.getTargetPosition()));
            motorVar.putVariable("Current", createVariableFromDouble(motorEx.getCurrent(org.firstinspires.ftc.robotcore.external.navigation.CurrentUnit.AMPS)));
            motorVar.putVariable(hubType + " Port", createVariableFromDouble(motorEx.getPortNumber()));

            motors.putVariable(deviceName, motorVar);
        }
        hardwareRoot.putVariable("Motors", motors);

        CustomVariable servos = new CustomVariable();
        for (Servo servo : opMode.hardwareMap.getAll(Servo.class)) {
            CustomVariable servoVar = new CustomVariable();
            String deviceName = getDeviceName(servo);
            if (deviceName == null) continue;

            String connectionInfo = servo.getController().getConnectionInfo();
            String hubType = extractHubType(connectionInfo);

            servoVar.putVariable("Position", createVariableFromDouble(servo.getPosition()));
            servoVar.putVariable(hubType + " Port", createVariableFromDouble(servo.getPortNumber()));
            servos.putVariable(deviceName, servoVar);
        }
        hardwareRoot.putVariable("Servos", servos);
    }

    private String getDeviceName(Object device) {
        try {
            if (!(device instanceof HardwareDevice)) {
                return null;
            }
            java.util.Set<String> names = opMode.hardwareMap.getNamesOf((HardwareDevice) device);
            if (!names.isEmpty()) {
                return names.iterator().next();
            }
        } catch (Exception e) {
            System.out.println("Error obtaining device name: " + e);
        }
        return null;
    }

    private String extractHubType(String connectionInfo) {
        String result = connectionInfo;
        for (int i = 0; i < result.length(); i++) {
            if (Character.isDigit(result.charAt(i))) {
                result = result.substring(i);
                break;
            }
        }
        if (result.equals("173")) {
            return "Control Hub";
        } else {
            return "Expansion Hub " + result;
        }
    }
}
