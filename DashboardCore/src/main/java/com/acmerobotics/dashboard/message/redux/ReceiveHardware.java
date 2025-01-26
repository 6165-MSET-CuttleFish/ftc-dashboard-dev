package com.acmerobotics.dashboard.message.redux;

import com.acmerobotics.dashboard.message.Message;
import com.acmerobotics.dashboard.message.MessageType;

public class ReceiveHardware extends Message {
    private String hardwareJson;

    public ReceiveHardware(String hardwareJson) {
        super(MessageType.RECEIVE_HARDWARE);
        this.hardwareJson = hardwareJson;
    }

    public String getHardwareJson() {
        return hardwareJson;
    }
}

