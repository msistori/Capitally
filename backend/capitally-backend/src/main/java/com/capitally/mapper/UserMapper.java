package com.capitally.mapper;

import com.capitally.core.entity.UserEntity;
import com.capitally.model.request.UserRequestDTO;
import com.capitally.model.response.UserResponseDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponseDTO mapUserEntityToDTO(UserEntity entity);

    UserEntity mapUserDTOToEntity(UserRequestDTO dto);
}