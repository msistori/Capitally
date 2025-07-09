package com.capitally.controller;

import com.capitally.model.request.UserRequestDTO;
import com.capitally.model.response.UserResponseDTO;
import com.capitally.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponseDTO> postUser(@RequestBody UserRequestDTO input) {
        UserResponseDTO response = userService.postUser(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email
    ) {
        return ResponseEntity.ok(userService.getUsers(name, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> putUser(@PathVariable BigInteger id, @RequestBody UserRequestDTO dto) {
        return ResponseEntity.ok(userService.putUser(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable BigInteger id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}