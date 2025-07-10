package com.capitally.controller;

import com.capitally.core.enums.CategoryTypeEnum;
import com.capitally.model.request.CategoryRequestDTO;
import com.capitally.model.response.CategoryResponseDTO;
import com.capitally.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> postCategory(@RequestBody CategoryRequestDTO input) {
        CategoryResponseDTO response = categoryService.postCategory(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getCategories(
            @RequestParam(required = false) String macroCategory,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) CategoryTypeEnum categoryType
    ) {
        return ResponseEntity.ok(categoryService.getCategories(macroCategory, category, categoryType));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> putCategory(@PathVariable BigInteger id, @RequestBody CategoryRequestDTO dto) {
        return ResponseEntity.ok(categoryService.putCategory(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable BigInteger id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}