package com.capitally.controller;

import com.capitally.command.CategoryCommand;
import com.capitally.core.enums.CategoryType;
import com.capitally.model.request.CategoryRequestDTO;
import com.capitally.model.response.CategoryResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryCommand categoryCommand;

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> postCategory(@RequestBody CategoryRequestDTO input) {
        CategoryResponseDTO response = categoryCommand.postCategory(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getCategories(
            @RequestParam(required = false) String macrocategory,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) CategoryType categoryType
    ) {
        return ResponseEntity.ok(categoryCommand.getCategories(macrocategory, category, categoryType));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> putCategory(@PathVariable BigInteger id, @RequestBody CategoryRequestDTO dto) {
        return ResponseEntity.ok(categoryCommand.putCategory(id, dto));
    }
}