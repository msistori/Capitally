package com.capitally.app.model.request;

import com.capitally.app.core.enums.UserRoleEnum;
import lombok.Data;

import java.util.List;

@Data
public class UserRequestDTO {
    private String username;
    private String email;
    private String password;
    private boolean enabled;
    private List<UserRoleEnum> roles;
}