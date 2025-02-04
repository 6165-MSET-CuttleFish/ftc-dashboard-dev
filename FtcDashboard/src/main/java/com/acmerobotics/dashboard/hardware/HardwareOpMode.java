package com.acmerobotics.dashboard.hardware;

import static com.acmerobotics.dashboard.config.reflection.ReflectionConfig.createVariableFromValue;

import com.acmerobotics.dashboard.CustomVariableConsumer;
import com.acmerobotics.dashboard.DashboardCore;
import com.acmerobotics.dashboard.FtcDashboard;
import com.acmerobotics.dashboard.config.Config;
import com.acmerobotics.dashboard.config.variable.ConfigVariable;
import com.acmerobotics.dashboard.config.variable.CustomVariable;
import com.qualcomm.robotcore.eventloop.opmode.OpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotorEx;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.hardware.HardwareDevice;
import com.qualcomm.robotcore.hardware.Servo;

@Config
@TeleOp(name = "HardwareOpMode", group = "Dashboard")
public class HardwareOpMode extends OpMode {
    public static DcMotorEx.RunMode runMode = DcMotorEx.RunMode.RUN_WITHOUT_ENCODER;
    private final DashboardCore core;
    private final OpMode opMode;

    public HardwareOpMode() {
        this.core = FtcDashboard.getInstance().core;
        this.opMode = this;
    }

    @Override
    public void init() {
        core.withHardwareRoot(new CustomVariableConsumer() {
            @Override
            public void accept(CustomVariable hardwareRoot) {
                if (opMode.hardwareMap != null) {
                    initHardware(hardwareRoot);
                }
            }
        });
    }

    @Override
    public void init_loop() {
        core.withHardwareRoot(new CustomVariableConsumer() {
            @Override
            public void accept(CustomVariable hardwareRoot) {
                if (opMode.hardwareMap != null) {
                    setHardware(hardwareRoot);
                    updateHardware(hardwareRoot);
                }
            }
        });
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void loop() {
        core.withHardwareRoot(new CustomVariableConsumer() {
            @Override
            public void accept(CustomVariable hardwareRoot) {
                if (opMode.hardwareMap != null) {
                    setHardware(hardwareRoot);
                    updateHardware(hardwareRoot);
                }
            }
        });
    }

    private void setHardware(CustomVariable hardwareRoot) {
        updateMotorsFromConfig(hardwareRoot);
        updateServosFromConfig(hardwareRoot);
    }

    private void updateMotorsFromConfig(CustomVariable hardwareRoot) {
        CustomVariable motorsVar = (CustomVariable) hardwareRoot.getVariable("Motors");
        if (motorsVar != null) {
            for (DcMotorSimple motor : opMode.hardwareMap.getAll(DcMotorSimple.class)) {
                DcMotorEx motorEx = (DcMotorEx) motor;
                String motorName = getDeviceName(motorEx);
                if (motorName == null) continue;

                CustomVariable motorVar = (CustomVariable) motorsVar.getVariable(motorName);
                if (motorVar != null) {
                    applyMotorConfiguration(motorEx, motorVar);
                }
            }
        }
    }

    private void applyMotorConfiguration(DcMotorEx motor, CustomVariable config) {
        ConfigVariable<?> runModeVar = config.getVariable("Run Mode");
        motor.setMode((DcMotorEx.RunMode) runModeVar.getValue());

        ConfigVariable<?> powerVar = config.getVariable("Power");
        if (powerVar != null) {
            motor.setPower((double) powerVar.getValue());
        }

        ConfigVariable<?> targetPosVar = config.getVariable("Target Position");
        if (targetPosVar != null) {
            try {
                motor.setTargetPosition((int) targetPosVar.getValue());
            } catch (Exception e) {
                System.out.println("Error setting target position: " + e);
            }
        }
    }

    private void initHardware(CustomVariable hardwareRoot) {
        initializeMotorVariables(hardwareRoot);
        initializeServoVariables(hardwareRoot);
    }

    private void initializeMotorVariables(CustomVariable hardwareRoot) {
        CustomVariable motors = new CustomVariable();
        for (DcMotorSimple motor : opMode.hardwareMap.getAll(DcMotorSimple.class)) {
            DcMotorEx motorEx = (DcMotorEx) motor;
            String deviceName = getDeviceName(motorEx);
            if (deviceName == null) continue;

            CustomVariable motorVar = createMotorVariable(motorEx);
            motors.putVariable(deviceName, motorVar);
        }
        hardwareRoot.putVariable("Motors", motors);
    }

    private CustomVariable createMotorVariable(DcMotorEx motor) {
        CustomVariable motorVar = new CustomVariable();
        String connectionInfo = motor.getController().getConnectionInfo();
        String hubType = extractHubType(connectionInfo);

        motorVar.putVariable("Power", createVariableFromValue(motor.getPower()));
        motorVar.putVariable("Current Position", createVariableFromValue(motor.getCurrentPosition()));
        motorVar.putVariable("Target Position", createVariableFromValue(motor.getTargetPosition()));
        motorVar.putVariable("Run Mode", createVariableFromValue(runMode));
        motorVar.putVariable("Current", createVariableFromValue(motor.getCurrent(org.firstinspires.ftc.robotcore.external.navigation.CurrentUnit.AMPS)));
        motorVar.putVariable(hubType + " Port", createVariableFromValue(motor.getPortNumber()));

        return motorVar;
    }

    private void updateHardware(CustomVariable hardwareRoot) {
        updateMotorStateVariables(hardwareRoot);
        updateServoStateVariables(hardwareRoot);
    }

    private void updateMotorStateVariables(CustomVariable hardwareRoot) {
        CustomVariable motorsVar = (CustomVariable) hardwareRoot.getVariable("Motors");
        if (motorsVar == null) return;

        for (DcMotorSimple motor : opMode.hardwareMap.getAll(DcMotorSimple.class)) {
            DcMotorEx motorEx = (DcMotorEx) motor;
            String deviceName = getDeviceName(motorEx);
            if (deviceName == null) continue;

            CustomVariable stateUpdate = new CustomVariable();
            stateUpdate.putVariable("Current Position", createVariableFromValue(motorEx.getCurrentPosition()));
            stateUpdate.putVariable("Current", createVariableFromValue(motorEx.getCurrent(org.firstinspires.ftc.robotcore.external.navigation.CurrentUnit.AMPS)));

            CustomVariable existingConfig = (CustomVariable) motorsVar.getVariable(deviceName);
            if (existingConfig != null) {
                existingConfig.update(stateUpdate);
            }
        }
    }

    private void updateServosFromConfig(CustomVariable hardwareRoot) {
        CustomVariable servosVar = (CustomVariable) hardwareRoot.getVariable("Servos");
        if (servosVar != null) {
            for (Servo servo : opMode.hardwareMap.getAll(Servo.class)) {
                String servoName = getDeviceName(servo);
                if (servoName == null) continue;

                CustomVariable servoVar = (CustomVariable) servosVar.getVariable(servoName);
                if (servoVar != null) {
                    applyServoConfiguration(servo, servoVar);
                }
            }
        }
    }

    private void applyServoConfiguration(Servo servo, CustomVariable config) {
        ConfigVariable<?> positionVar = config.getVariable("Position");
        if (positionVar != null) {
            servo.setPosition((double) positionVar.getValue());
        }
    }

    private void initializeServoVariables(CustomVariable hardwareRoot) {
        CustomVariable servos = new CustomVariable();
        for (Servo servo : opMode.hardwareMap.getAll(Servo.class)) {
            String deviceName = getDeviceName(servo);
            if (deviceName == null) continue;

            CustomVariable servoVar = createServoVariable(servo);
            servos.putVariable(deviceName, servoVar);
        }
        hardwareRoot.putVariable("Servos", servos);
    }

    private CustomVariable createServoVariable(Servo servo) {
        CustomVariable servoVar = new CustomVariable();
        String connectionInfo = servo.getController().getConnectionInfo();
        String hubType = extractHubType(connectionInfo);

        servoVar.putVariable("Position", createVariableFromValue(servo.getPosition()));
        servoVar.putVariable(hubType + " Port", createVariableFromValue(servo.getPortNumber()));

        return servoVar;
    }

    private void updateServoStateVariables(CustomVariable hardwareRoot) {
        CustomVariable servosVar = (CustomVariable) hardwareRoot.getVariable("Servos");
        if (servosVar == null) return;

        for (Servo servo : opMode.hardwareMap.getAll(Servo.class)) {
            String deviceName = getDeviceName(servo);
            if (deviceName == null) continue;

            CustomVariable stateUpdate = new CustomVariable();
            stateUpdate.putVariable("Position", createVariableFromValue(servo.getPosition()));

            CustomVariable existingConfig = (CustomVariable) servosVar.getVariable(deviceName);
            if (existingConfig != null) {
                existingConfig.update(stateUpdate);
            }
        }
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