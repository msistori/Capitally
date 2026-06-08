package com.capitally.app.model.response;

import java.math.BigInteger;
import java.util.Set;

public record UserResponseDTO(BigInteger id, String username, String email, Set<String> roles, boolean enabled, boolean passwordChangeRequired) {}
