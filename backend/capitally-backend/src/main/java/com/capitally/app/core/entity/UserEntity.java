package com.capitally.app.core.entity;

import com.capitally.app.core.enums.UserRoleEnum;
import com.capitally.app.core.enums.converters.UserRoleEnumListConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigInteger;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "t_user")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "user_seq", allocationSize = 1)
    @JdbcTypeCode(SqlTypes.BIGINT)
    private BigInteger id;

    private String username;
    private String email;
    private String password;
    private boolean enabled;

    @Convert(converter = UserRoleEnumListConverter.class)
    private List<UserRoleEnum> roles;

    @OneToMany(mappedBy = "user")
    private List<AccountEntity> accountEntities;
}