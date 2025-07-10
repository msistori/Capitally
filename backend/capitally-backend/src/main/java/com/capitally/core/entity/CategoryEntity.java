package com.capitally.core.entity;

import com.capitally.core.enums.CategoryTypeEnum;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigInteger;

@EqualsAndHashCode(callSuper = true)
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
    private BigInteger id;

    @Enumerated(EnumType.STRING)
    private CategoryTypeEnum categoryType;

    private String macroCategory;
    private String category;
}
