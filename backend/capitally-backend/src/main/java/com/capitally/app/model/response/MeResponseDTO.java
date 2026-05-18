package com.capitally.app.model.response;

import java.math.BigInteger;
import java.util.Set;

public record MeResponseDTO(BigInteger id, String username, String email, Set<String> roles) {}
