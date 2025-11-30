package com.capitally.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

@ConfigurationProperties(prefix = "capitally.sas")
public record OAuthClientProperties(
  String issuer,
  Client client
) {
  public String clientId() { return client.id(); }
  public String clientSecret() { return client.secret(); }
  public String redirectUri() { return client.redirectUri(); }
  public String postLogoutUri() { return client.postLogoutUri(); }
  public List<String> scopes() {
    if (client.scopes() == null || client.scopes().isBlank()) return List.of("openid","profile","email","offline_access");
    return Arrays.stream(client.scopes().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
  }

  public record Client(
    String id,
    String secret,
    String redirectUri,
    String postLogoutUri,
    String scopes
  ) {}
}
