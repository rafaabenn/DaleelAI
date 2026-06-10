<?php
// =====================================================================
// Daleel AI - Gateway and REST API Router (Front Controller)
// =====================================================================

// Enable error reporting for debug (disable in production)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Setup HTTP CORS headers for frontend integration
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Authorization');

// Handle preflight OPTIONS requests gracefully
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load Core Config and Security Files
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/jwt.php';

// Parse JSON input payloads in raw request body
$input_data = [];
$raw_input = file_get_contents('php://input');
if (!empty($raw_input)) {
    $decoded = json_decode($raw_input, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        $input_data = $decoded;
    }
}

// Fallback for form-data or urlencoded payloads (e.g. from n8n or Postman)
if (empty($input_data) && !empty($_POST)) {
    $input_data = $_POST;
}

// Extract the request route based on URL path
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalize path: find where '/api/' starts to handle subdirectories automatically
$api_pos = strpos($path, '/api/');
$route = ($api_pos !== false) ? substr($path, $api_pos) : $path;
$route = rtrim($route, '/'); // Strip trailing slashes

$method = $_SERVER['REQUEST_METHOD'];

// Helper to authenticate JWT tokens from header and return user profile
function authenticate() {
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (empty($authHeader)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Accès refusé. Token manquant.']);
        exit;
    }

    // Header format: "Bearer <token>"
    $token = null;
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    }

    if (!$token) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Format de token invalide.']);
        exit;
    }

    $decoded = JWT::decode($token);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token invalide ou expiré.']);
        exit;
    }

    return $decoded; // Returns payload: ['id' => X, 'username' => Y, 'email' => Z, 'role_id' => W]
}

// Helper to require administrator permissions
function requireAdmin($user) {
    if ((int)$user['role_id'] !== 1) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Permissions insuffisantes. Rôle administrateur requis.']);
        exit;
    }
}

// REST Route Matching and Dispatching
switch ($route) {
    // -----------------------------------------------------------------
    // AUTHENTICATION ROUTES
    // -----------------------------------------------------------------
    case '/api/auth/register':
        if ($method === 'POST') {
            require_once __DIR__ . '/controllers/AuthController.php';
            AuthController::register($input_data);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/auth/login':
        if ($method === 'POST') {
            require_once __DIR__ . '/controllers/AuthController.php';
            AuthController::login($input_data);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/auth/profile':
        if ($method === 'GET') {
            $user = authenticate();
            echo json_encode(['success' => true, 'user' => $user]);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    // -----------------------------------------------------------------
    // AI TOOLS PUBLIC & USER ROUTES
    // -----------------------------------------------------------------
    case '/api/tools':
        if ($method === 'GET') {
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::getTools($_GET);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    case '/api/tools/filters':
        if ($method === 'GET') {
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::getFilters();
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    case '/api/tools/detail':
        if ($method === 'GET') {
            require_once __DIR__ . '/controllers/ToolController.php';
            $tool_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            // Optionnel : ID utilisateur pour savoir si c'est favori
            $user_id = 0;
            try {
                $user = authenticate();
                $user_id = $user['id'];
            } catch (Exception $e) {
                // Silencieusement ignoré pour les visiteurs
            }
            ToolController::getToolDetail($tool_id, $user_id);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    case '/api/tools/submit':
        if ($method === 'POST') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::submitTool($input_data, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/tools/my-submissions':
        if ($method === 'GET') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::getMySubmissions($user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'MÃ©thode non autorisÃ©e. GET requis.']);
        }
        break;

    case '/api/tools/resubmit':
        if ($method === 'POST') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::resubmitTool($input_data, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'MÃ©thode non autorisÃ©e. POST requis.']);
        }
        break;

        case '/api/tools/update-status':
    if ($method === 'POST') {
        require_once __DIR__ . '/controllers/ToolController.php';
        ToolController::updateStatus($input_data);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
    }
    break;

    case '/api/tools/favorite':
        if ($method === 'POST') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            $tool_id = isset($input_data['tool_id']) ? (int)$input_data['tool_id'] : 0;
            ToolController::toggleFavorite($tool_id, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/tools/favorites':
        if ($method === 'GET') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::getFavorites($user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    case '/api/tools/review':
        if ($method === 'POST') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::submitReview($input_data, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/notifications':
        if ($method === 'GET') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::getNotifications($user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    case '/api/notifications/read':
        if ($method === 'POST') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::markNotificationRead($input_data, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    // -----------------------------------------------------------------
    // ACADEMIC CHATBOT ROUTES
    // -----------------------------------------------------------------
    case '/api/chatbot':
        if ($method === 'POST') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ChatbotController.php';
            ChatbotController::sendMessage($input_data, $user['id']);
        } else if ($method === 'GET') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ChatbotController.php';
            ChatbotController::getConversations($user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
        }
        break;

    case '/api/chatbot/history':
        if ($method === 'GET') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ChatbotController.php';
            $conv_id = isset($_GET['conversation_id']) ? (int)$_GET['conversation_id'] : 0;
            ChatbotController::getMessages($conv_id, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    // -----------------------------------------------------------------
    // ADMINISTRATOR BACK-OFFICE ROUTES
    // -----------------------------------------------------------------
    case '/api/admin/stats':
        if ($method === 'GET') {
            $user = authenticate();
            requireAdmin($user);
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::getStats();
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    case '/api/admin/submissions':
        if ($method === 'GET') {
            $user = authenticate();
            requireAdmin($user);
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::getSubmissions();
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    case '/api/admin/submissions/validate':
        if ($method === 'POST') {
            $user = authenticate();
            requireAdmin($user);
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::validateSubmission($input_data, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/admin/reviews':
        if ($method === 'GET') {
            $user = authenticate();
            requireAdmin($user);
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::getReviews();
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. GET requis.']);
        }
        break;

    case '/api/admin/reviews/moderate':
        if ($method === 'POST') {
            $user = authenticate();
            requireAdmin($user);
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::moderateReview($input_data, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/admin/tools/create':
        if ($method === 'POST') {
            $user = authenticate();
            requireAdmin($user);
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::createTool($input_data, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/admin/tools/update':
        if ($method === 'POST') {
            $user = authenticate();
            requireAdmin($user);
            require_once __DIR__ . '/controllers/AdminController.php';
            AdminController::updateTool($input_data, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    case '/api/admin/tools/delete':
        if ($method === 'POST') {
            $user = authenticate();
            requireAdmin($user);
            require_once __DIR__ . '/controllers/AdminController.php';
            $tool_id = isset($input_data['id']) ? (int)$input_data['id'] : 0;
            AdminController::deleteTool($tool_id, $user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée. POST requis.']);
        }
        break;

    // -----------------------------------------------------------------
    // PERSONALISATION ROUTES
    // -----------------------------------------------------------------
    case '/api/tools/click':
        if ($method === 'POST') {
            $tool_id = isset($input_data['tool_id']) ? (int)$input_data['tool_id'] : 0;
            $user_id = 0;
            try { $u = authenticate(); $user_id = $u['id']; } catch (Exception $e) {}
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::logClick($tool_id, $user_id);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
        }
        break;

    case '/api/tools/recommended':
        if ($method === 'GET') {
            $user = authenticate();
            require_once __DIR__ . '/controllers/ToolController.php';
            ToolController::getRecommended($user['id']);
        } else {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
        }
        break;

    // -----------------------------------------------------------------
    // FALLBACK
    // -----------------------------------------------------------------
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Ressource non trouvée. Route demandée : ' . $route
        ]);
        break;
}
