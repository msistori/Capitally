package com.capitally.mapper;

import com.capitally.core.entity.AccountEntity;
import com.capitally.model.request.AccountRequestDTO;
import com.capitally.model.response.AccountResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccountMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "currency.code", target = "currency")
    AccountResponseDTO mapAccountEntityToDTO(AccountEntity entity);

    @Mapping(source = "userId", target = "user.id")
    @Mapping(source = "currency", target = "currency.code")
    AccountEntity mapAccountDTOToEntity(AccountRequestDTO dto);
}