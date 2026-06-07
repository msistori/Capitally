package com.capitally.app.core.enums.converters;

import com.capitally.app.core.enums.UserRoleEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class UserRoleEnumListConverter implements AttributeConverter<List<UserRoleEnum>, String> {

    @Override
    public String convertToDatabaseColumn(List<UserRoleEnum> attribute) {
        return attribute == null ? null :
                attribute.stream().map(Enum::name).collect(Collectors.joining(","));
    }

    @Override
    public List<UserRoleEnum> convertToEntityAttribute(String dbData) {
        return dbData == null ? Collections.emptyList() :
                Arrays.stream(dbData.split(","))
                        .map(UserRoleEnum::valueOf)
                        .toList();
    }
}