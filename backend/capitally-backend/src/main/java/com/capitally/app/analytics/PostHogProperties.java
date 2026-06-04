package com.capitally.app.analytics;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "analytics.posthog")
public class PostHogProperties {
    private boolean frontendEnabled;
    private boolean serverEnabled;
    private boolean sessionReplayEnabled;
    private String apiKey;
    private String host = "https://eu.i.posthog.com";
}
