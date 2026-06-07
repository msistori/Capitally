package com.capitally.app.analytics;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.math.BigInteger;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostHogAnalyticsService {
    private final PostHogProperties properties;
    private final AnalyticsConsent analyticsConsent;

    public void captureIfConsented(
            String consentHeader,
            BigInteger userId,
            AnalyticsEvent event,
            Map<String, Object> eventProperties
    ) {
        captureIfConsented(consentHeader, userId, event.getEventName(), eventProperties);
    }

    public void captureIfConsented(
            String consentHeader,
            BigInteger userId,
            String eventName,
            Map<String, Object> eventProperties
    ) {
        if (!properties.isServerEnabled() || !analyticsConsent.isGranted(consentHeader) || userId == null) {
            return;
        }

        if (!StringUtils.hasText(properties.getApiKey()) || !StringUtils.hasText(eventName)) {
            return;
        }

        Map<String, Object> payload = Map.of(
                "api_key", properties.getApiKey(),
                "event", eventName,
                "distinct_id", userId.toString(),
                "properties", sanitizedProperties(eventProperties)
        );

        CompletableFuture.runAsync(() -> send(payload));
    }

    private void send(Map<String, Object> payload) {
        try {
            RestClient.create(properties.getHost())
                    .post()
                    .uri("/capture/")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            log.debug("PostHog capture failed", ex);
        }
    }

    private Map<String, Object> sanitizedProperties(Map<String, Object> eventProperties) {
        Map<String, Object> sanitized = new LinkedHashMap<>();
        sanitized.put("$lib", "capitally-backend");
        sanitized.put("$ip", null);
        sanitized.put("captured_at", Instant.now().toString());

        if (eventProperties == null || eventProperties.isEmpty()) {
            return sanitized;
        }

        eventProperties.forEach((key, value) -> {
            if (StringUtils.hasText(key) && value != null) {
                sanitized.put(key, value);
            }
        });

        return sanitized;
    }
}
