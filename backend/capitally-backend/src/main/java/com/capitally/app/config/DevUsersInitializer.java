package com.capitally.app.config;

import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.enums.UserRoleEnum;
import com.capitally.app.core.repository.UserRepository;
import com.capitally.app.service.DefaultCategoryService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@Profile("dev")
@EnableConfigurationProperties(DevUsersProperties.class)
public class DevUsersInitializer {
    @Bean
    CommandLineRunner seedUsers(DevUsersProperties props, UserRepository repo, PasswordEncoder pe, DefaultCategoryService defaultCategoryService) {
        return args -> {
            if (props.getUsers() == null) return;
            for (DevUsersProperties.UserDef u : props.getUsers()) {
                repo.findByUsername(u.getUsername()).orElseGet(() -> {
                    List<UserRoleEnum> roles = u.getRoles() == null
                            ? List.of(UserRoleEnum.USER)
                            : u.getRoles().stream().map(UserRoleEnum::valueOf).toList();
                    UserEntity ent = UserEntity.builder()
                            .username(u.getUsername())
                            .email(u.getEmail())
                            .password(pe.encode(u.getPassword()))
                            .enabled(u.isEnabled())
                            .roles(roles)
                            .build();
                    UserEntity saved = repo.save(ent);
                    defaultCategoryService.createForUser(saved, null);
                    return saved;
                });
            }
        };
    }
}
