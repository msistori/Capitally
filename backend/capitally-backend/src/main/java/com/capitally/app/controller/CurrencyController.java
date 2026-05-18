package com.capitally.app.controller;

import com.capitally.app.model.request.CurrencyRequestDTO;
import com.capitally.app.model.response.CurrencyResponseDTO;
import com.capitally.app.service.CurrencyService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/currency")
@RequiredArgsConstructor
@Tag(name = "Currency", description = "API crud per Currency")
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