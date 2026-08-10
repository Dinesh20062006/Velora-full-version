package com.velora.auth.config;

import com.velora.auth.common.RoleType;
import com.velora.auth.entity.Role;
import com.velora.auth.entity.User;
import com.velora.auth.repository.RoleRepository;
import com.velora.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JdbcTemplate jdbcTemplate) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        fixDatabaseSchema();

        Role userRole = findOrCreateRole(RoleType.ROLE_USER, "User Role");
        Role policeRole = findOrCreateRole(RoleType.ROLE_POLICE, "Police Role");
        Role adminRole = findOrCreateRole(RoleType.ROLE_ADMIN, "Admin Role");

        // Seed Demo Users
        createDemoUserIfAbsent("user@velora.app", "9876543210", "Registered User", "Password@123", userRole);
        createDemoUserIfAbsent("police@velora.app", "9999911111", "Insp. Rajesh Kumar", "Password@123", policeRole);
        createDemoUserIfAbsent("admin@velora.app", "8888899999", "System Administrator", "Password@123", adminRole);
    }

    private void fixDatabaseSchema() {
        String[] alterStatements = {
            "ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL",
            "ALTER TABLE users MODIFY COLUMN mobile_number VARCHAR(20) NULL",
            "ALTER TABLE users MODIFY COLUMN phone_number VARCHAR(20) NULL"
        };
        for (String sql : alterStatements) {
            try {
                jdbcTemplate.execute(sql);
                log.info("Applied schema fix: {}", sql);
            } catch (Exception e) {
                log.debug("Schema fix note ({}): {}", sql, e.getMessage());
            }
        }
    }

    private Role findOrCreateRole(RoleType roleType, String description) {
        return roleRepository.findByName(roleType).orElseGet(() -> {
            Role role = new Role();
            role.setName(roleType);
            role.setDescription(description);
            return roleRepository.save(role);
        });
    }

    private void createDemoUserIfAbsent(String email, String phone, String name, String password, Role role) {
        try {
            User user = userRepository.findByEmail(email)
                    .or(() -> userRepository.findByPhoneNumber(phone))
                    .orElse(null);

            if (user == null) {
                user = new User();
                user.setEmail(email);
                user.setPhoneNumber(phone);
                user.setFullName(name);
                user.setPasswordHash(passwordEncoder.encode(password));
                user.setRole(role);
                user.setEnabled(true);
                user.setLocked(false);
                userRepository.save(user);
            } else {
                user.setRole(role);
                user.setEnabled(true);
                user.setPasswordHash(passwordEncoder.encode(password));
                userRepository.save(user);
            }
        } catch (Exception e) {
            log.warn("Could not seed demo user {}: {}", email, e.getMessage());
        }
    }
}
