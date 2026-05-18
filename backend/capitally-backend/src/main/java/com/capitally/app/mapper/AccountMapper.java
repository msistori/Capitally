package com.capitally.app.mapper;

import com.capitally.app.core.entity.AccountEntity;
import com.capitally.app.model.request.AccountRequestDTO;
import com.capitally.app.model.response.AccountResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccountMapper {
    @Mapping(source = "user.id", target = "userId")
    AccountResponseDTO mapAccountEntityToDTO(AccountEntity entity);

    @Mapping(source = "userId", target = "user.id")
    AccountEntity mapAccountDTOToEntity(AccountRequestDTO dto);
}