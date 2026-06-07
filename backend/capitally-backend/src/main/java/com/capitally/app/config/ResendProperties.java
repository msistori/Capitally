package com.capitally.app.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "resend")
public class ResendProperties {
    private String apiKey;
    private String from;
    private String host = "https://api.resend.com";
    private int forgotPasswordDailyLimit = 50;
    private int forgotPasswordMonthlyLimit = 500;
}
