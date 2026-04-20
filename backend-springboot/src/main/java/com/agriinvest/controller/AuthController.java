package com.agriinvest.controller;

import java.util.Map;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.service.AuthService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record OtpRequest(@NotBlank String target) {}

    public record OtpVerifyRequest(@NotBlank String otpId, @NotBlank String otp) {}

    public record RegisterRequest(@NotBlank String name,
                                  @NotBlank @Email String email,
                                  @NotBlank String phone,
                                  @NotBlank String password,
                                  @NotBlank String role,
                                  @NotBlank String otpId,
                                  @NotBlank String otp) {}

    public record LoginRequest(@NotBlank String identifier,
                               @NotBlank String password,
                               @NotBlank String otpId,
                               @NotBlank String otp) {}

    @PostMapping("/request-otp")
    public Map<String, String> requestOtp(@Valid @RequestBody OtpRequest request) {
        return authService.requestOtp(request.target());
    }

    @PostMapping("/verify-otp")
    public Map<String, String> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return authService.verifyOtp(request.otpId(), request.otp());
    }

    @PostMapping("/register")
    public Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(
                request.name(),
                request.email(),
                request.phone(),
                request.password(),
                request.role(),
                request.otpId(),
                request.otp()
        );
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.identifier(), request.password(), request.otpId(), request.otp());
    }
}
