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

public class JwtTokenProvider {
    private final Key key;
    private final long validityMillis;

    public JwtTokenProvider(String secret, long validityMillis) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.validityMillis = validityMillis;
    }

    public String generate(BigInteger userId, String subject, Set<String> roles) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setId(String.valueOf(userId))
                .setSubject(subject)
                .claim("roles", String.join(",", roles))
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusMillis(validityMillis)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
    }
}
