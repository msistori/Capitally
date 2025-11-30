package com.capitally.app.core.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "capitally.security")
public record SecurityGeneralProperties(
        String logoutSuccessUrl,
        String loginSuccessUrl,
        String loginFailureUrl
) {}
