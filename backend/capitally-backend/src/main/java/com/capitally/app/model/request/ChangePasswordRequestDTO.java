package com.capitally.app.model.request;

public record ChangePasswordRequestDTO(String currentPassword, String newPassword) {}
