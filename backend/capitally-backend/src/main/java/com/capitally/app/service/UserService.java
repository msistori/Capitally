package com.capitally.app.service;

import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.repository.AccountRepository;
import com.capitally.app.core.repository.CategoryRepository;
import com.capitally.app.core.repository.TransactionRepository;
import com.capitally.app.core.repository.UserRepository;
import com.capitally.app.mapper.AccountMapper;
import com.capitally.app.mapper.CategoryMapper;
import com.capitally.app.mapper.TransactionMapper;
import com.capitally.app.model.request.ChangePasswordRequestDTO;
import com.capitally.app.model.request.UpdateUserRequestDTO;
import com.capitally.app.model.response.UserDataExportResponseDTO;
import com.capitally.app.model.response.UserResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigInteger;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository repo;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final AccountMapper accountMapper;
    private final CategoryMapper categoryMapper;
    private final TransactionMapper transactionMapper;
    private final PasswordEncoder passwordEncoder;
    private final CategoryVisibilityService categoryVisibilityService;

    public UserService(
            UserRepository repo,
            AccountRepository accountRepository,
            CategoryRepository categoryRepository,
            TransactionRepository transactionRepository,
            AccountMapper accountMapper,
            CategoryMapper categoryMapper,
            TransactionMapper transactionMapper,
            PasswordEncoder passwordEncoder,
            CategoryVisibilityService categoryVisibilityService
    ) {
        this.repo = repo;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.accountMapper = accountMapper;
        this.categoryMapper = categoryMapper;
        this.transactionMapper = transactionMapper;
        this.passwordEncoder = passwordEncoder;
        this.categoryVisibilityService = categoryVisibilityService;
    }

    @Transactional(readOnly = true)
    public UserResponseDTO me(Authentication auth) {
        UserEntity u = repo.findByUsername(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return toResponse(u);
    }

    @Transactional
    public UserResponseDTO updateProfile(Authentication auth, UpdateUserRequestDTO req) {
        UserEntity u = repo.findByUsername(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.username() != null && !Objects.equals(req.username(), u.getUsername())) {
            if (repo.findByUsername(req.username()).isPresent()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username_taken");
            u.setUsername(req.username().trim());
        }
        if (req.email() != null && !Objects.equals(req.email(), u.getEmail())) {
            if (repo.findByEmail(req.email()).isPresent()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email_taken");
            u.setEmail(req.email().trim().toLowerCase());
        }
        return toResponse(repo.save(u));
    }

    @Transactional
    public void changePassword(Authentication auth, ChangePasswordRequestDTO req) {
        UserEntity u = repo.findByUsername(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!passwordEncoder.matches(req.currentPassword(), u.getPassword())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_current_password");
        u.setPassword(passwordEncoder.encode(req.newPassword()));
        u.setPasswordChangeRequired(false);
        repo.save(u);
    }

    @Transactional(readOnly = true)
    public UserDataExportResponseDTO exportData(BigInteger userId) {
        UserEntity user = findById(userId);
        return new UserDataExportResponseDTO(
                toResponse(user),
                accountRepository.findByUserId(userId).stream()
                        .map(accountMapper::mapAccountEntityToDTO)
                        .toList(),
                categoryVisibilityService.visibleCategories(categoryRepository.findByUser_Id(userId)).stream()
                        .map(categoryMapper::mapCategoryEntityToDTO)
                        .toList(),
                transactionRepository.findAll((root, query, cb) -> cb.equal(root.get("user").get("id"), userId)).stream()
                        .map(transactionMapper::mapTransactionEntityToDTO)
                        .toList()
        );
    }

    @Transactional
    public void deleteData(BigInteger userId) {
        UserEntity user = findById(userId);
        transactionRepository.deleteByUser_Id(userId);
        accountRepository.deleteByUser_Id(userId);
        categoryRepository.deleteByUser_Id(userId);
        repo.delete(user);
    }

    private UserEntity findById(BigInteger userId) {
        return repo.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private UserResponseDTO toResponse(UserEntity u) {
        Set<String> roles = u.getRoles() == null ? Set.of() : u.getRoles().stream().map(Enum::name).collect(Collectors.toSet());
        return new UserResponseDTO(u.getId(), u.getUsername(), u.getEmail(), roles, u.isEnabled(), u.isPasswordChangeRequired());
    }
}
