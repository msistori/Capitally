package com.capitally.controller;

import com.capitally.model.request.CurrencyRequestDTO;
import com.capitally.model.response.CurrencyResponseDTO;
import com.capitally.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/currency")
@RequiredArgsConstructor
public class CurrencyController {

    private final CurrencyService currencyService;

    @PostMapping
    public ResponseEntity<CurrencyResponseDTO> saveCurrency(@RequestBody CurrencyRequestDTO input) {
        CurrencyResponseDTO response = currencyService.saveCurrency(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<CurrencyResponseDTO>> getCurrencies(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code
    ) {
        return ResponseEntity.ok(currencyService.getCurrencies(name, code));
    }

    @PutMapping("/{code}")
    public ResponseEntity<CurrencyResponseDTO> putCurrency(@PathVariable String code, @RequestBody CurrencyRequestDTO dto) {
        return ResponseEntity.ok(currencyService.putCurrency(code, dto));
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> deleteCurrency(@PathVariable String code) {
        currencyService.deleteCurrency(code);
        return ResponseEntity.noContent().build();
    }
}