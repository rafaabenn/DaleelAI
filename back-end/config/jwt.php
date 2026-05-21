<?php
// =====================================================================
// Daleel AI - JSON Web Token (JWT) Helper Utility (Native SHA256)
// =====================================================================

class JWT {
    // Academic platform secure secret signature key
    private static $secret = 'daleel_ai_secret_key_2026_academic_platform_987654321';

    /**
     * Encodes a payload into a stateless JWT token.
     * 
     * @param array $payload The associative array to encode.
     * @return string The signed JWT token.
     */
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Decodes and validates a JWT token.
     * Checks signature match and expiration status.
     * 
     * @param string $token The JWT token.
     * @return array|null The decoded payload array on success, or null on validation failure.
     */
    public static function decode($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        $header = json_decode(self::base64UrlDecode($parts[0]), true);
        $payload = json_decode(self::base64UrlDecode($parts[1]), true);
        $signature = self::base64UrlDecode($parts[2]);

        if (!$header || !$payload) {
            return null;
        }

        // Validate signature integrity
        $validSignature = hash_hmac('sha256', $parts[0] . "." . $parts[1], self::$secret, true);
        if (!hash_equals($signature, $validSignature)) {
            return null;
        }

        // Validate token expiration date
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Helper method to base64Url encode.
     */
    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    /**
     * Helper method to base64Url decode.
     */
    private static function base64UrlDecode($data) {
        $urlDecoded = str_replace(['-', '_'], ['+', '/'], $data);
        $remainder = strlen($urlDecoded) % 4;
        if ($remainder) {
            $urlDecoded .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode($urlDecoded);
    }
}
