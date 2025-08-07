package com.capitally.mapper;

import com.capitally.core.entity.CategoryEntity;
import com.capitally.model.request.CategoryRequestDTO;
import com.capitally.model.response.CategoryResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    @Mapping(source = "user.id", target = "userId")
    CategoryResponseDTO mapCategoryEntityToDTO(CategoryEntity entity);

    @Mapping(source = "userId", target = "user.id")
    CategoryEntity mapCategoryDTOToEntity(CategoryRequestDTO dto);

}