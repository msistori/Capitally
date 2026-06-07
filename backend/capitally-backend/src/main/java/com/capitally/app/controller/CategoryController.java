package com.capitally.app.controller;

import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.request.CategoryRequestDTO;
import com.capitally.app.model.response.CategoryResponseDTO;
import com.capitally.app.service.CategoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.util.List;

@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
@Tag(name = "Category", description = "API crud per Category")
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponseDTO> postCategory(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestBody CategoryRequestDTO input
    ) {
        input.setUserId(user.getId());
        CategoryResponseDTO response = categoryService.postCategory(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDTO>> getCategories(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) String macroCategory,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String iconName
            ) {
        return ResponseEntity.ok(categoryService.getCategories(macroCategory, category, iconName, user.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDTO> putCategory(
            @AuthenticationPrincipal UserPrincipal user,
            @PathVariable BigInteger id,
            @RequestBody CategoryRequestDTO dto
    ) {
        dto.setUserId(user.getId());
        return ResponseEntity.ok(categoryService.putCategory(user.getId(), id, dto));
    }

    @DeleteMapping()
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) BigInteger categoryId,
            @RequestParam(required = false) String macroCategory,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String iconName
    ) {
        categoryService.deleteCategory(user.getId(), categoryId, macroCategory, category, iconName);
        return ResponseEntity.noContent().build();
    }
}
