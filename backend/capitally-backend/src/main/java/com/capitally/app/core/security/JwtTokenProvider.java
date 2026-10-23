package com.capitally.app.core.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;

import java.math.BigInteger;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

public class JwtTokenProvider {
    private final Key key;
    private final long validityMillis;

    public JwtTokenProvider(String secret, long validityMillis) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        if (validityMillis <= 0 || validityMillis > 900000) {
            throw new IllegalArgumentException("Access token validity must be between 1 and 900000 milliseconds");
        }
        this.validityMillis = validityMillis;
    }

    public String generate(BigInteger userId, String subject, Set<String> roles, UUID sessionId, Instant sessionExpiry) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(validityMillis);
        if (sessionExpiry.isBefore(expiresAt)) expiresAt = sessionExpiry;
        return Jwts.builder()
                .setId(String.valueOf(userId))
                .setSubject(subject)
                .claim("roles", String.join(",", roles))
                .claim("sid", sessionId.toString())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiresAt))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }
}
