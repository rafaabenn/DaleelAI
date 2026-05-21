<?php
// =====================================================================
// Daleel AI - Database Connection Configuration (MySQL ONLY)
// =====================================================================

class DB {
    private static $host = '127.0.0.1';
    private static $db = 'daleel_ai';
    private static $user = 'root';
    private static $pass = ''; // Standard default for XAMPP / Localhost Wamp
    private static $charset = 'utf8mb4';
    private static $pdo = null;

    /**
     * Establishes and returns a PDO connection to the MySQL database.
     * Implements a singleton pattern to reuse the connection instance.
     */
    public static function connect() {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $dsn = "mysql:host=" . self::$host . ";dbname=" . self::$db . ";charset=" . self::$charset;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            self::$pdo = new PDO($dsn, self::$user, self::$pass, $options);
            return self::$pdo;
        } catch (\PDOException $e) {
            // Handle connection error gracefully by outputting a detailed JSON response
            header('Content-Type: application/json');
            header('Access-Control-Allow-Origin: *');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Impossible de se connecter à la base de données MySQL. Veuillez vous assurer que le serveur MySQL est démarré et que la base de données "daleel_ai" a été importée avec le fichier "database.sql". Détails : ' . $e->getMessage()
            ]);
            exit;
        }
    }
}
