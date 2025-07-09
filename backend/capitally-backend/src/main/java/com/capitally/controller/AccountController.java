package com.capitally.controller;

import com.capitally.model.request.AccountRequestDTO;
import com.capitally.model.response.AccountResponseDTO;
import com.capitally.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
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
            @RequestParam(required = false) String type,
            @RequestParam(required = false) BigDecimal minBalance,
            @RequestParam(required = false) BigDecimal maxBalance
    ) {
        return ResponseEntity.ok(accountService.getAccounts(userId, name, type, minBalance, maxBalance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponseDTO> putAccount(@PathVariable BigInteger id, @RequestBody AccountRequestDTO dto) {
        return ResponseEntity.ok(accountService.putAccount(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable BigInteger id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}