package com.capitally.app.controller;

import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.request.ChangePasswordRequestDTO;
import com.capitally.app.model.request.UpdateUserRequestDTO;
import com.capitally.app.model.response.UserDataExportResponseDTO;
import com.capitally.app.model.response.UserResponseDTO;
import com.capitally.app.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/users", "/api/users"})
@Tag(name = "User", description = "API crud per User")
public class UserController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> me(Authentication auth) {
        return ResponseEntity.ok(service.me(auth));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponseDTO> updateProfile(Authentication auth, @RequestBody UpdateUserRequestDTO req) {
        return ResponseEntity.ok(service.updateProfile(auth, req));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(Authentication auth, @RequestBody ChangePasswordRequestDTO req) {
        service.changePassword(auth, req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/export")
    public ResponseEntity<UserDataExportResponseDTO> exportData(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(service.exportData(user.getId()));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteData(@AuthenticationPrincipal UserPrincipal user) {
        service.deleteData(user.getId());
        return ResponseEntity.noContent().build();
    }
}
