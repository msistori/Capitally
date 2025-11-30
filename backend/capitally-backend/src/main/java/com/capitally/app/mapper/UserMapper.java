package com.capitally.app.mapper;

import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.model.request.UserRequestDTO;
import com.capitally.app.model.response.UserResponseDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponseDTO mapUserEntityToDTO(UserEntity entity);

    UserEntity mapUserDTOToEntity(UserRequestDTO dto);
}