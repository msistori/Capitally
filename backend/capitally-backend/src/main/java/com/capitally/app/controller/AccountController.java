package com.capitally.app.controller;

import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.request.AccountRequestDTO;
import com.capitally.app.model.response.AccountResponseDTO;
import com.capitally.app.service.AccountService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
@Tag(name = "Account", description = "API crud per Account")
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountResponseDTO> postAccount(@RequestBody AccountRequestDTO input) {
        AccountResponseDTO response = accountService.postAccount(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AccountResponseDTO>> getAccounts(
            @RequestParam(required = false) BigInteger userId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) BigDecimal minBalance,
            @RequestParam(required = false) BigDecimal maxBalance
    ) {
        return ResponseEntity.ok(accountService.getAccounts(userId, name, minBalance, maxBalance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponseDTO> putAccount(@PathVariable BigInteger id, @RequestBody AccountRequestDTO dto) {
        return ResponseEntity.ok(accountService.putAccount(id, dto));
    }

    @DeleteMapping()
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) BigInteger accountId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) BigDecimal initialBalance
    ) {
        accountService.deleteAccount(user.getId(), accountId, name, initialBalance);
        return ResponseEntity.noContent().build();
    }
}