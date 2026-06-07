package com.capitally.app.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "dev")
public class DevUsersProperties {
    private List<UserDef> users;

    public List<UserDef> getUsers() { return users; }
    public void setUsers(List<UserDef> users) { this.users = users; }

    public static class UserDef {
        private String username;
        private String email;
        private String password;
        private List<String> roles;
        private boolean enabled = true;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
    }
}
