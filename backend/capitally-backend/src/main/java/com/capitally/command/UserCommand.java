package com.capitally.command;

import com.capitally.core.entity.UserEntity;
import com.capitally.core.repository.UserRepository;
import com.capitally.mapper.UserMapper;
import com.capitally.model.request.UserRequestDTO;
import com.capitally.model.response.UserResponseDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

import static com.capitally.utils.CapitallyUtils.addIfNotNull;
import static com.capitally.utils.CapitallyUtils.buildLikePredicate;

@Component
@RequiredArgsConstructor
public class UserCommand {

    private final UserMapper userMapper;
    private final UserRepository userRepository;

    public UserResponseDTO postUser(UserRequestDTO input) {
        UserEntity userEntity = userMapper.mapUserDTOToEntity(input);
        return userMapper.mapUserEntityToDTO(userRepository.save(userEntity));
    }

    public List<UserResponseDTO> getUsers(String name, String email) {
        Specification<UserEntity> spec = buildSpecification(name, email);
        return userRepository.findAll(spec).stream()
                .map(userMapper::mapUserEntityToDTO)
                .toList();
    }

    public UserResponseDTO putUser(BigInteger id, UserRequestDTO dto) {
        UserEntity existing = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        existing.setName(dto.getName());
        existing.setEmail(dto.getEmail());
        existing.setPassword(dto.getPassword());

        return userMapper.mapUserEntityToDTO(userRepository.save(existing));
    }

    public void deleteUser(BigInteger id) {
        userRepository.deleteById(id);
    }

    private Specification<UserEntity> buildSpecification(String name, String email) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addIfNotNull(predicates, name, () -> buildLikePredicate(cb, root.get("name"), name));
            addIfNotNull(predicates, email, () -> buildLikePredicate(cb, root.get("email"), email));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}