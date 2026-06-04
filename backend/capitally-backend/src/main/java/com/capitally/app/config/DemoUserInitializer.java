package com.capitally.app.config;

import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.enums.UserRoleEnum;
import com.capitally.app.core.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@Profile("demo")
public class DemoUserInitializer {
    @Bean
    CommandLineRunner seedDemo(UserRepository repo, PasswordEncoder pe) {
        return args -> {
            repo.findByUsername("demo").orElseGet(() -> {
                UserEntity u = UserEntity.builder()
                        .username("demo")
                        .email("demo@capitally.local")
                        .password(pe.encode("demo123!"))
                        .enabled(true)
                        .roles(List.of(UserRoleEnum.USER, UserRoleEnum.DEMO))
                        .build();
                return repo.save(u);
            });
        };
    }
}
