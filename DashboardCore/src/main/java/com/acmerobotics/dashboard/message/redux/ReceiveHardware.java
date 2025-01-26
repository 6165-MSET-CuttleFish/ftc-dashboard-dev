package com.acmerobotics.dashboard.message.redux;

import com.acmerobotics.dashboard.config.variable.CustomVariable;
import com.acmerobotics.dashboard.message.Message;
import com.acmerobotics.dashboard.message.MessageType;

public class ReceiveHardware extends Message {
    private final CustomVariable var;

    public ReceiveHardware(CustomVariable var) {
        super(MessageType.RECEIVE_HARDWARE);
        this.var = var;
    }

    public CustomVariable getVar() {
        return var;
    }
}

