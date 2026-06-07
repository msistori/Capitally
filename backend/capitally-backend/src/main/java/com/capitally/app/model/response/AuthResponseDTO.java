package com.capitally.app.model.response;

import java.util.Set;

public record AuthResponseDTO(String token, String tokenType, String username, String email, Set<String> roles) {}
