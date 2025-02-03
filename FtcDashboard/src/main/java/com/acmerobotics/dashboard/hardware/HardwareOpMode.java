package com.acmerobotics.dashboard.hardware;

import static com.acmerobotics.dashboard.config.reflection.ReflectionConfig.createVariableFromClass;
import static com.acmerobotics.dashboard.config.reflection.ReflectionConfig.createVariableFromValue;

import com.acmerobotics.dashboard.CustomVariableConsumer;
import com.acmerobotics.dashboard.DashboardCore;
import com.acmerobotics.dashboard.FtcDashboard;
import com.acmerobotics.dashboard.config.Config;
import com.acmerobotics.dashboard.config.reflection.ReflectionConfig;
import com.acmerobotics.dashboard.config.variable.ConfigVariable;
import com.acmerobotics.dashboard.config.variable.CustomVariable;
import com.qualcomm.robotcore.eventloop.opmode.OpMode;
import com.qualcomm.robotcore.eventloop.opmode.TeleOp;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.DcMotorEx;
import com.qualcomm.robotcore.hardware.DcMotorSimple;
import com.qualcomm.robotcore.hardware.HardwareDevice;
import com.qualcomm.robotcore.hardware.Servo;

@Config
@TeleOp(name = "HardwareOpMode", group = "Dashboard")
public class HardwareOpMode extends OpMode {
    private final DashboardCore core;
    private final OpMode opMode;
    public static DcMotorEx.RunMode runMode = DcMotorEx.RunMode.RUN_WITHOUT_ENCODER;
    public HardwareOpMode() {
        this.core = FtcDashboard.getInstance().core;
        this.opMode = this;
        System.out.println("HardwareOpMode constructed");
    }

    @Override
    public void init() {
        System.out.println("HardwareOpMode init run");
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
    public void init_loop(){
        System.out.println("HardwareOpMode init_loop running");
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

    @Override
    public void loop() {
        System.out.println("HardwareOpMode loop running");
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
            motor.setMode(runMode);

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
            motorVar.putVariable("Current", createVariableFromValue(
                motor.getCurrent(org.firstinspires.ftc.robotcore.external.navigation.CurrentUnit.AMPS)));
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
                stateUpdate.putVariable("Current Position",
                    createVariableFromValue(motorEx.getCurrentPosition()));
                stateUpdate.putVariable("Current",
                    createVariableFromValue(motorEx.getCurrent(
                        org.firstinspires.ftc.robotcore.external.navigation.CurrentUnit.AMPS)));

                CustomVariable existingConfig = (CustomVariable) motorsVar.getVariable(deviceName);
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