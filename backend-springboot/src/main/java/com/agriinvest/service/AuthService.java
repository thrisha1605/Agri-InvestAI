package com.agriinvest.service;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.agriinvest.model.OtpSession;
import com.agriinvest.model.PartnerProfile;
import com.agriinvest.model.User;
import com.agriinvest.repository.OtpSessionRepository;
import com.agriinvest.repository.PartnerProfileRepository;
import com.agriinvest.repository.UserRepository;
import com.agriinvest.repository.WalletAccountRepository;
import com.agriinvest.security.AuthTokenService;

import jakarta.validation.ValidationException;

@Service
public class AuthService {

    private static final Pattern PHONE = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern PASSWORD = Pattern.compile("^(?=.*[A-Z])(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@#$%^&+=!]{6,}$");
    private static final Duration OTP_VALIDITY = Duration.ofMinutes(5);

    private final UserRepository userRepository;
    private final OtpSessionRepository otpSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final WalletAccountRepository walletAccountRepository;
    private final PartnerProfileRepository partnerProfileRepository;
    private final AuthTokenService authTokenService;

    public AuthService(UserRepository userRepository,
                       OtpSessionRepository otpSessionRepository,
                       PasswordEncoder passwordEncoder,
                       WalletAccountRepository walletAccountRepository,
                       PartnerProfileRepository partnerProfileRepository,
                       AuthTokenService authTokenService) {
        this.userRepository = userRepository;
        this.otpSessionRepository = otpSessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.walletAccountRepository = walletAccountRepository;
        this.partnerProfileRepository = partnerProfileRepository;
        this.authTokenService = authTokenService;
    }

    public Map<String, String> requestOtp(String target) {
        String normalizedTarget = normalizeTarget(target);
        String otpId = UUID.randomUUID().toString();
        String otp = String.valueOf((int) (Math.random() * 900000) + 100000);

        otpSessionRepository.save(new OtpSession(otpId, normalizedTarget, otp, Instant.now()));

        System.out.println("OTP for " + normalizedTarget + ": " + otp);

        Map<String, String> response = new HashMap<>();
        response.put("otpId", otpId);
        response.put("otp", otp);
        response.put("message", "OTP sent successfully");
        return response;
    }

    public Map<String, String> verifyOtp(String otpId, String otp) {
        validateOtpSession(otpId, otp);
        return Map.of("message", "OTP verified successfully");
    }

    public Map<String, Object> register(String name, String email, String phone,
                                        String password, String role, String otpId, String otp) {
        String normalizedName = name == null ? "" : name.trim();
        String normalizedEmail = normalizeEmail(email);
        String normalizedPhone = normalizePhone(phone);
        String normalizedRole = normalizeRole(role);

        if (normalizedName.isBlank()) {
            throw new ValidationException("Name is required");
        }

        if (!PASSWORD.matcher(password).matches()) {
            throw new ValidationException("Weak password");
        }

        OtpSession otpSession = validateOtpSession(otpId, otp);
        ensureOtpBelongsToUser(otpSession, normalizedPhone, normalizedEmail);

        boolean exists = userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()
                || userRepository.findByPhone(normalizedPhone).isPresent();

        if (exists) {
            throw new ValidationException("User already exists");
        }

        User user = new User(
                UUID.randomUUID().toString(),
                normalizedName,
                normalizedEmail,
                normalizedPhone,
                passwordEncoder.encode(password),
                normalizedRole
        );

        userRepository.save(user);
        initializePartnerProfileIfNeeded(user);
        otpSessionRepository.deleteById(otpSession.getId());

        return authSuccess("Registration successful", user);
    }

    public Map<String, Object> login(String identifier, String password, String otpId, String otp) {
        String normalizedIdentifier = normalizeTarget(identifier);
        OtpSession otpSession = validateOtpSession(otpId, otp);

        User user = findUserByIdentifier(normalizedIdentifier)
                .orElseThrow(() -> new ValidationException("User not found"));

        ensureOtpBelongsToUser(otpSession, user.getPhone(), user.getEmail());

        if (!matchesPassword(user, password)) {
            throw new ValidationException("Wrong password");
        }

        otpSessionRepository.deleteById(otpSession.getId());
        return authSuccess("Login successful", user);
    }

    private OtpSession validateOtpSession(String otpId, String otp) {
        OtpSession otpSession = otpSessionRepository.findById(otpId)
                .orElseThrow(() -> new ValidationException("Invalid OTP request"));

        if (otpSession.getCreatedAt() == null
                || otpSession.getCreatedAt().isBefore(Instant.now().minus(OTP_VALIDITY))) {
            otpSessionRepository.deleteById(otpSession.getId());
            throw new ValidationException("OTP expired. Please request a new OTP");
        }

        if (!otpSession.getOtp().equals(otp)) {
            throw new ValidationException("Invalid OTP");
        }

        return otpSession;
    }

    private void ensureOtpBelongsToUser(OtpSession otpSession, String phone, String email) {
        String target = otpSession.getTarget();
        if (target.equals(phone) || target.equals(email)) {
            return;
        }

        throw new ValidationException("OTP does not match the provided phone or email");
    }

    private Optional<User> findUserByIdentifier(String identifier) {
        if (PHONE.matcher(identifier).matches()) {
            return userRepository.findByPhone(identifier);
        }

        return userRepository.findByEmailIgnoreCase(identifier);
    }

    private boolean matchesPassword(User user, String rawPassword) {
        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        try {
            if (passwordEncoder.matches(rawPassword, storedPassword)) {
                return true;
            }
        } catch (IllegalArgumentException exception) {
            // Older records may still store plain-text passwords. Fall back below and
            // upgrade them to BCrypt after a successful login.
        }

        if (storedPassword.equals(rawPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }

    private Map<String, Object> authSuccess(String message, User user) {
        double walletBalance = walletAccountRepository.findById(user.getId())
                .map(account -> Math.round(account.getBalance() * 100.0) / 100.0)
                .orElse(0.0);

        String token = authTokenService.createToken(user.getId());
        Map<String, Object> userPayload = new LinkedHashMap<>();
        userPayload.put("id", safeString(user.getId()));
        userPayload.put("name", safeString(user.getName()));
        userPayload.put("email", safeString(user.getEmail()));
        userPayload.put("phone", safeString(user.getPhone()));
        userPayload.put("role", safeString(user.getRole()));
        userPayload.put("verified", true);
        userPayload.put("walletBalance", walletBalance);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        response.put("token", token);
        response.put("user", userPayload);
        return response;
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private void initializePartnerProfileIfNeeded(User user) {
        if (!"AGRI_PARTNER".equalsIgnoreCase(user.getRole())) {
            return;
        }

        partnerProfileRepository.findById(user.getId()).orElseGet(() -> {
            PartnerProfile profile = new PartnerProfile();
            profile.setUserId(user.getId());
            profile.setHeadline("");
            profile.setBio("");
            profile.setExperienceYears(0);
            profile.setSkills(java.util.List.of());
            profile.setDistricts(java.util.List.of());
            profile.setAadhaarNumber("");
            profile.setAadhaarFileName("");
            profile.setCertificateFileNames(java.util.List.of());
            profile.setAdditionalDocumentNames(java.util.List.of());
            profile.setBankProofFileName("");
            profile.setUpiId("");
            profile.setPaytmNumber("");
            profile.setPhotoDataUrl("");
            profile.setAdminRemarks("");
            profile.setCompletionPercent(0);
            profile.setReadyForProjects(false);
            profile.setUpdatedAt(Instant.now());
            return partnerProfileRepository.save(profile);
        });
    }

    private String normalizeTarget(String target) {
        if (target == null) {
            throw new ValidationException("Phone or email is required");
        }

        String trimmed = target.trim();
        if (trimmed.isBlank()) {
            throw new ValidationException("Phone or email is required");
        }

        if (PHONE.matcher(trimmed).matches()) {
            return trimmed;
        }

        if (EMAIL.matcher(trimmed).matches()) {
            return trimmed.toLowerCase();
        }

        throw new ValidationException("Enter a valid Indian phone number or email");
    }

    private String normalizeEmail(String email) {
        String normalized = normalizeTarget(email);
        if (!EMAIL.matcher(normalized).matches()) {
            throw new ValidationException("Invalid email address");
        }
        return normalized;
    }

    private String normalizePhone(String phone) {
        String normalized = normalizeTarget(phone);
        if (!PHONE.matcher(normalized).matches()) {
            throw new ValidationException("Invalid Indian phone");
        }
        return normalized;
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            throw new ValidationException("Role is required");
        }

        String normalized = role.trim().toUpperCase();
        if (!normalized.equals("FARMER")
                && !normalized.equals("INVESTOR")
                && !normalized.equals("AGRI_PARTNER")
                && !normalized.equals("ADMIN")) {
            throw new ValidationException("Invalid role");
        }

        return normalized;
    }
}
