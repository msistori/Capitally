package com.capitally.controller;

import com.capitally.command.CurrencyCommand;
import com.capitally.model.request.CurrencyRequestDTO;
import com.capitally.model.response.CurrencyResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyCommand currencyCommand;

    @PostMapping
    public ResponseEntity<CurrencyResponseDTO> saveCurrency(@RequestBody CurrencyRequestDTO input) {
        CurrencyResponseDTO response = currencyCommand.saveCurrency(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<CurrencyResponseDTO>> getCurrencies(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code
    ) {
        return ResponseEntity.ok(currencyCommand.getCurrencies(name, code));
    }

    @PutMapping("/{code}")
    public ResponseEntity<CurrencyResponseDTO> putCurrency(@PathVariable String code, @RequestBody CurrencyRequestDTO dto) {
        return ResponseEntity.ok(currencyCommand.putCurrency(code, dto));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> deleteCurrency(@PathVariable String code) {
        currencyCommand.deleteCurrency(code);
        return ResponseEntity.noContent().build();
    }
}