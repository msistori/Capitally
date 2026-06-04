package com.capitally.app.controller;

import com.capitally.app.analytics.AnalyticsConsent;
import com.capitally.app.analytics.PostHogAnalyticsService;
import com.capitally.app.analytics.PostHogProperties;
import com.capitally.app.core.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping({"/analytics", "/api/analytics"})
@RequiredArgsConstructor
public class AnalyticsController {
    private final PostHogProperties postHogProperties;
    private final PostHogAnalyticsService analyticsService;

    @GetMapping("/config")
    public AnalyticsConfigResponse config() {
        boolean enabled = StringUtils.hasText(postHogProperties.getApiKey());

        return new AnalyticsConfigResponse(
                enabled,
                enabled ? postHogProperties.getApiKey() : null,
                postHogProperties.getHost(),
                postHogProperties.isSessionReplayEnabled()
        );
    }

    @PostMapping("/capture")
    public ResponseEntity<Void> capture(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader,
            @RequestBody AnalyticsCaptureRequest request
    ) {
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                request.event(),
                request.properties()
        );
        return ResponseEntity.noContent().build();
    }

    public record AnalyticsConfigResponse(
            boolean enabled,
            String apiKey,
            String host,
            boolean sessionReplayEnabled
    ) {}

    public record AnalyticsCaptureRequest(
            String event,
            Map<String, Object> properties
    ) {}
}
