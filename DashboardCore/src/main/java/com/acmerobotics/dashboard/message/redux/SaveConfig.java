package com.acmerobotics.dashboard.message.redux;

import com.acmerobotics.dashboard.config.variable.CustomVariable;
import com.acmerobotics.dashboard.config.variable.ConfigVariable;
import com.acmerobotics.dashboard.message.Message;
import com.acmerobotics.dashboard.message.MessageType;
import java.util.HashMap;
import java.util.Map;

public class SaveConfig extends Message {
    private CustomVariable configDiff;

    public SaveConfig(CustomVariable fullConfig) {
        super(MessageType.SAVE_CONFIG);
        this.configDiff = filterModifiedVariables(fullConfig);
    }

    private CustomVariable filterModifiedVariables(CustomVariable fullConfig) {
        Map<String, ConfigVariable> modifiedVars = new HashMap<>();
        for (Map.Entry<String, ConfigVariable> entry : fullConfig.entrySet()) {
            if (entry.getValue().isModified()) {
                modifiedVars.put(entry.getKey(), entry.getValue());
            }
        }
        return new CustomVariable(modifiedVars);
    }

    public CustomVariable getConfigDiff() {
        return configDiff;
    }
}
