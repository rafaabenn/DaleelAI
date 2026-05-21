<?php
// =====================================================================
// Daleel AI - Auth Controller (User Registration & Login API)
// =====================================================================

class AuthController {

    /**
     * Registers a new user.
     * Default role is "Utilisateur Inscrit" (role_id = 2)
     * 
     * @param array $data Input data: ['username', 'email', 'password']
     */
    public static function register($data) {
        $username = isset($data['username']) ? trim($data['username']) : '';
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        // Validate basic inputs
        if (empty($username) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires (pseudo, email, mot de passe).']);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Format d\'adresse email invalide.']);
            return;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 6 caractères.']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Check if username already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Ce pseudonyme est déjà utilisé.']);
                return;
            }

            // Check if email already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Cette adresse email est déjà enregistrée.']);
                return;
            }

            // Hash password securely
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

            // Insert new registered user
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, 2)");
            $stmt->execute([$username, $email, $hashedPassword]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Votre compte universitaire a été créé avec succès ! Connectez-vous maintenant.'
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de l\'inscription : ' . $e->getMessage()]);
        }
    }

    /**
     * Authenticates a user and delivers a signed JWT token.
     * 
     * @param array $data Input data: ['email', 'password']
     */
    public static function login($data) {
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? $data['password'] : '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez saisir votre email et votre mot de passe.']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Retrieve user profile along with role details
            $stmt = $pdo->prepare("
                SELECT u.*, r.name as role_name 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.email = ?
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password'])) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Adresse email ou mot de passe incorrect.']);
                return;
            }

            // Create JWT Session Payload
            $payload = [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'role_id' => (int)$user['role_id'],
                'role_name' => $user['role_name'],
                'exp' => time() + (3600 * 24) // Expire token in 24 hours
            ];

            $token = JWT::encode($payload);

            echo json_encode([
                'success' => true,
                'message' => 'Connexion réussie ! Bienvenue sur Daleel AI.',
                'token' => $token,
                'user' => [
                    'id' => $payload['id'],
                    'username' => $payload['username'],
                    'email' => $payload['email'],
                    'role_id' => $payload['role_id'],
                    'role_name' => $payload['role_name']
                ]
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la connexion : ' . $e->getMessage()]);
        }
    }
}
