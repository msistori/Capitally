package com.capitally.mapper;

import com.capitally.core.entity.CategoryEntity;
import com.capitally.model.request.CategoryRequestDTO;
import com.capitally.model.response.CategoryResponseDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    CategoryResponseDTO mapCategoryEntityToDTO(CategoryEntity entity);

    CategoryEntity mapCategoryDTOToEntity(CategoryRequestDTO dto);

}