package com.capitally.app.analytics;

import org.springframework.stereotype.Component;

@Component
public class AnalyticsConsent {
    public static final String HEADER_NAME = "X-Analytics-Consent";

    public boolean isGranted(String value) {
        return "true".equalsIgnoreCase(value);
    }
}
