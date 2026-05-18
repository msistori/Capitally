package com.capitally.app.core.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

@ConfigurationProperties(prefix = "capitally.security.paths")
public record SecurityPathsProperties(
  List<String> permitAll,
  String publicGet,
  String authenticated
) {}
