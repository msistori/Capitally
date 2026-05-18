package com.capitally.app.mapper;

import com.capitally.app.core.entity.CategoryEntity;
import com.capitally.app.model.request.CategoryRequestDTO;
import com.capitally.app.model.response.CategoryResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    @Mapping(source = "user.id", target = "userId")
    CategoryResponseDTO mapCategoryEntityToDTO(CategoryEntity entity);

    @Mapping(source = "userId", target = "user.id")
    CategoryEntity mapCategoryDTOToEntity(CategoryRequestDTO dto);

}