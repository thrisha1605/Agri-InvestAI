package com.agriinvest.controller;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.service.InvestmentService;
import com.agriinvest.service.PaymentService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final String DEFAULT_PLACEHOLDER_KEY = "rzp_test_xxxxx";
    private static final String DEFAULT_PLACEHOLDER_SECRET = "xxxxxxxxxx";
    private static final String SAMPLE_DOCS_KEY = "rzp_test_1DP5mmOlF5G5ag";

    @Autowired
    private InvestmentService investmentService;

    @Autowired
    private PaymentService paymentService;

    @Value("${razorpay.key:rzp_test_xxxxx}")
    private String key;

    @Value("${razorpay.secret:xxxxxxxxxx}")
    private String secret;

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> data) {
        try {
            ResponseEntity<Map<String, String>> configError = validateRazorpayConfig();
            if (configError != null) {
                return configError;
            }

            Object amountValue = data.get("amount");
            int amount;
            if (amountValue instanceof Number) {
                amount = ((Number) amountValue).intValue();
            } else {
                amount = Integer.parseInt(String.valueOf(amountValue));
            }

            if (amount <= 0) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Amount must be greater than zero.");
                return ResponseEntity.badRequest().body(error);
            }

            JSONObject options = new JSONObject();
            options.put("amount", amount * 100);
            options.put("currency", "INR");
            options.put("receipt", "txn_" + System.currentTimeMillis());

            RazorpayClient client = new RazorpayClient(key, secret);
            Order order = client.orders.create(options);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            response.put("key", key);

            return ResponseEntity.ok(response);
        } catch (Exception exception) {
            Map<String, String> error = new HashMap<>();
            error.put("message", buildOrderCreationErrorMessage(exception));
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> payload) {
        String paymentId = payload.get("razorpay_payment_id");
        String orderId = payload.get("razorpay_order_id");
        String signature = payload.get("razorpay_signature");
        String userId = payload.get("userId");
        String projectId = payload.get("projectId");

        try {
            double amount = Double.parseDouble(payload.get("amount"));

            boolean isValid = verifySignature(orderId, paymentId, signature);
            if (!isValid) {
                paymentService.savePayment(
                        userId,
                        projectId,
                        amount,
                        orderId,
                        paymentId,
                        signature,
                        "FAILED",
                        "Payment signature verification failed.",
                        false
                );

                Map<String, String> error = new HashMap<>();
                error.put("message", "Payment verification failed!");
                return ResponseEntity.badRequest().body(error);
            }

            Map<String, Object> investmentResult =
                    investmentService.invest(userId, projectId, amount, "ONLINE");

            paymentService.savePayment(
                    userId,
                    projectId,
                    amount,
                    orderId,
                    paymentId,
                    signature,
                    "SUCCESS",
                    "Payment verified and investment created successfully.",
                    true
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Payment Successful");
            response.put("paymentId", paymentId);
            response.put("investment", investmentResult);
            return ResponseEntity.ok(response);
        } catch (Exception exception) {
            if (orderId != null && !orderId.isBlank()) {
                try {
                    paymentService.savePayment(
                            userId,
                            projectId,
                            parseAmount(payload.get("amount")),
                            orderId,
                            paymentId,
                            signature,
                            "FAILED",
                            "Payment verification error: " + exception.getMessage(),
                            false
                    );
                } catch (Exception ignored) {
                    // Ignore secondary persistence errors so the original payment error can be returned.
                }
            }

            Map<String, String> error = new HashMap<>();
            error.put("message", "Payment verification error: " + exception.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String data = orderId + "|" + paymentId;

            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKey =
                    new javax.crypto.spec.SecretKeySpec(secret.getBytes(), "HmacSHA256");

            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes());
            String generatedSignature = bytesToHex(hash);
            return generatedSignature.equals(signature);
        } catch (Exception exception) {
            return false;
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(2 * bytes.length);

        for (byte value : bytes) {
            String converted = Integer.toHexString(0xff & value);
            if (converted.length() == 1) {
                hex.append('0');
            }
            hex.append(converted);
        }

        return hex.toString();
    }

    private ResponseEntity<Map<String, String>> validateRazorpayConfig() {
        String normalizedKey = key == null ? "" : key.trim();
        String normalizedSecret = secret == null ? "" : secret.trim();

        if (normalizedKey.isBlank() || normalizedSecret.isBlank()) {
            return configError("Razorpay is not configured. Set RAZORPAY_KEY and RAZORPAY_SECRET, then restart the backend.");
        }

        if (DEFAULT_PLACEHOLDER_KEY.equals(normalizedKey)
                || DEFAULT_PLACEHOLDER_SECRET.equals(normalizedSecret)
                || SAMPLE_DOCS_KEY.equals(normalizedKey)
                || normalizedKey.contains("xxxxx")) {
            return configError("Razorpay is using placeholder credentials. Replace them with your real test or live keys, then restart the backend.");
        }

        if (!normalizedKey.startsWith("rzp_test_") && !normalizedKey.startsWith("rzp_live_")) {
            return configError("Razorpay key format looks invalid. It should start with rzp_test_ or rzp_live_.");
        }

        return null;
    }

    private ResponseEntity<Map<String, String>> configError(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("message", message);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private String buildOrderCreationErrorMessage(Exception exception) {
        String message = exception.getMessage();
        if (message != null && message.toLowerCase().contains("authentication failed")) {
            return "Razorpay authentication failed. Check that razorpay.key and razorpay.secret are correct and from the same mode (both test or both live).";
        }

        return "Error creating order: " + (message == null ? "Unknown error" : message);
    }

    private double parseAmount(String value) {
        if (value == null || value.isBlank()) {
            return 0.0;
        }

        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException exception) {
            return 0.0;
        }
    }
}
