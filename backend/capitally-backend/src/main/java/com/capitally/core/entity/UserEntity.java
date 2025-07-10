package com.capitally.core.entity;

import jakarta.persistence.*;
import lombok.*;

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
    private BigInteger id;

    private String name;
    private String email;
    private String password;

    @OneToMany(mappedBy = "user")
    private List<AccountEntity> accountEntities;
}