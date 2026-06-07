package com.capitally.app.core.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigInteger;

@Entity
@Table(name = "t_category")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryEntity extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "category_seq")
    @SequenceGenerator(name = "category_seq", sequenceName = "categories_id_seq", allocationSize = 1)
    @JdbcTypeCode(SqlTypes.BIGINT)
    private BigInteger id;

    private String macroCategory;
    private String category;
    private String iconName;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;
}
