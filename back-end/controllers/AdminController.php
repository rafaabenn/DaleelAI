<?php
// =====================================================================
// Daleel AI - Admin Controller (Back-Office Dashboard, CRUD & Moderation)
// =====================================================================

class AdminController {

    /**
     * Compiles global statistics for the Administrator Dashboard KPIs.
     */
    public static function getStats() {
        $pdo = DB::connect();

        try {
            // KPIs
            $totalTools = (int)$pdo->query("SELECT COUNT(*) FROM ai_tools WHERE status = 'approved'")->fetchColumn();
            $pendingSubmissions = (int)$pdo->query("SELECT COUNT(*) FROM ai_tools WHERE status = 'pending'")->fetchColumn();
            $totalReviews = (int)$pdo->query("SELECT COUNT(*) FROM reviews WHERE status = 'approved'")->fetchColumn();
            $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role_id = 2")->fetchColumn();

            // 1. Popular Tools (Most Favorited)
            $popularTools = $pdo->query("
                SELECT t.id, t.name, t.average_rating, COUNT(f.user_id) as favorites_count 
                FROM ai_tools t 
                LEFT JOIN favorites f ON t.id = f.tool_id 
                WHERE t.status = 'approved' 
                GROUP BY t.id 
                ORDER BY favorites_count DESC 
                LIMIT 5
            ")->fetchAll();

            // 2. Click Telemetry Graph Data (Clicks in the last 7 days)
            $telemetry = $pdo->query("
                SELECT DATE(created_at) as click_date, COUNT(*) as click_count 
                FROM clicks_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY click_date ASC
            ")->fetchAll();

            // 3. Category Distribution
            $distribution = $pdo->query("
                SELECT c.name, COUNT(tc.tool_id) as count 
                FROM categories c 
                LEFT JOIN tool_categories tc ON c.id = tc.category_id 
                GROUP BY c.id
            ")->fetchAll();

            echo json_encode([
                'success' => true,
                'stats' => [
                    'total_tools' => $totalTools,
                    'pending_submissions' => $pendingSubmissions,
                    'total_reviews' => $totalReviews,
                    'total_users' => $totalUsers
                ],
                'popular_tools' => $popularTools,
                'telemetry' => $telemetry,
                'category_distribution' => $distribution
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de compiler les statistiques : ' . $e->getMessage()]);
        }
    }

    /**
     * Retrieves all pending tool submissions.
     */
    public static function getSubmissions() {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("
                SELECT t.*, u.username as submitted_by_username, u.email as submitted_by_email 
                FROM ai_tools t 
                LEFT JOIN users u ON t.submitted_by = u.id 
                WHERE t.status = 'pending' 
                ORDER BY t.created_at ASC
            ");
            $stmt->execute();
            $submissions = $stmt->fetchAll();

            foreach ($submissions as &$sub) {
                // Fetch proposed categories
                $cat_stmt = $pdo->prepare("
                    SELECT c.name FROM categories c 
                    JOIN tool_categories tc ON c.id = tc.category_id 
                    WHERE tc.tool_id = ?
                ");
                $cat_stmt->execute([$sub['id']]);
                $sub['categories'] = $cat_stmt->fetchAll();

                // Fetch pricing models
                $price_stmt = $pdo->prepare("
                    SELECT p.name FROM pricing_models p 
                    JOIN tool_pricing tp ON p.id = tp.pricing_id 
                    WHERE tp.tool_id = ?
                ");
                $price_stmt->execute([$sub['id']]);
                $sub['pricings'] = $price_stmt->fetchAll();
            }

            echo json_encode([
                'success' => true,
                'submissions' => $submissions
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des soumissions : ' . $e->getMessage()]);
        }
    }

    /**
     * Validates (Approves) or Rejects a user submitted AI tool.
     */
    public static function validateSubmission($data, $admin_id) {
        $tool_id = isset($data['tool_id']) ? (int)$data['tool_id'] : 0;
        $action = isset($data['action']) ? trim($data['action']) : ''; // 'approve' or 'reject'
        $comment = isset($data['comment']) ? trim($data['comment']) : '';

        if ($tool_id <= 0 || !in_array($action, ['approve', 'reject'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiants ou action de validation non spécifiés.']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Check if tool actually exists and is pending
            $stmt = $pdo->prepare("SELECT id, name FROM ai_tools WHERE id = ? AND status = 'pending'");
            $stmt->execute([$tool_id]);
            $tool = $stmt->fetch();

            if (!$tool) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Soumission d\'outil introuvable ou déjà traitée.']);
                return;
            }

            $newStatus = ($action === 'approve') ? 'approved' : 'rejected';
            $logAction = ($action === 'approve') ? 'approve' : 'reject';

            $pdo->beginTransaction();

            // 1. Update status
            $upd_stmt = $pdo->prepare("UPDATE ai_tools SET status = ? WHERE id = ?");
            $upd_stmt->execute([$newStatus, $tool_id]);

            // 2. Log in moderation_logs
            $log_stmt = $pdo->prepare("
                INSERT INTO moderation_logs (admin_id, target_type, target_id, action, comment) 
                VALUES (?, 'tool', ?, ?, ?)
            ");
            $log_stmt->execute([$admin_id, $tool_id, $logAction, $comment]);

            $pdo->commit();

            $msg = ($action === 'approve') 
                ? "L'outil '{$tool['name']}' a été validé et est désormais visible par tous les utilisateurs !" 
                : "La soumission de l'outil '{$tool['name']}' a été rejetée avec succès.";

            echo json_encode([
                'success' => true,
                'message' => $msg
            ]);

        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la validation : ' . $e->getMessage()]);
        }
    }

    /**
     * Retrieves all user reviews for moderation.
     */
    public static function getReviews() {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->query("
                SELECT r.*, u.username as reviewer_username, u.email as reviewer_email, t.name as tool_name 
                FROM reviews r 
                JOIN users u ON r.user_id = u.id 
                JOIN ai_tools t ON r.tool_id = t.id 
                ORDER BY r.created_at DESC
            ");
            $reviews = $stmt->fetchAll();

            echo json_encode([
                'success' => true,
                'reviews' => $reviews
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement des avis : ' . $e->getMessage()]);
        }
    }

    /**
     * Moderates (Approves or Hides) a user review comment.
     */
    public static function moderateReview($data, $admin_id) {
        $review_id = isset($data['review_id']) ? (int)$data['review_id'] : 0;
        $action = isset($data['action']) ? trim($data['action']) : ''; // 'approve' or 'hide'
        $comment = isset($data['comment']) ? trim($data['comment']) : '';

        if ($review_id <= 0 || !in_array($action, ['approve', 'hide'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiants ou action de modération invalides.']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Find review to get tool_id
            $stmt = $pdo->prepare("SELECT id, tool_id FROM reviews WHERE id = ?");
            $stmt->execute([$review_id]);
            $review = $stmt->fetch();

            if (!$review) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Avis utilisateur introuvable.']);
                return;
            }

            $newStatus = ($action === 'approve') ? 'approved' : 'hidden';
            $logAction = ($action === 'approve') ? 'approve' : 'hide';

            $pdo->beginTransaction();

            // 1. Update review status
            $upd_stmt = $pdo->prepare("UPDATE reviews SET status = ? WHERE id = ?");
            $upd_stmt->execute([$newStatus, $review_id]);

            // 2. Log in moderation logs
            $log_stmt = $pdo->prepare("
                INSERT INTO moderation_logs (admin_id, target_type, target_id, action, comment) 
                VALUES (?, 'review', ?, ?, ?)
            ");
            $log_stmt->execute([$admin_id, $review_id, $logAction, $comment]);

            // 3. Recalculate tool average rating
            $calc_stmt = $pdo->prepare("SELECT AVG(rating) as avg_rating FROM reviews WHERE tool_id = ? AND status = 'approved'");
            $calc_stmt->execute([$review['tool_id']]);
            $res = $calc_stmt->fetch();
            $avg = $res['avg_rating'] !== null ? round((float)$res['avg_rating'], 2) : 0.00;

            // 4. Update average rating on tool
            $upd_tool_stmt = $pdo->prepare("UPDATE ai_tools SET average_rating = ? WHERE id = ?");
            $upd_tool_stmt->execute([$avg, $review['tool_id']]);

            $pdo->commit();

            $msg = ($action === 'approve') 
                ? "L'avis a été approuvé avec succès et est visible en ligne." 
                : "L'avis a été masqué (modéré) avec succès. La note globale de l'outil a été recalculée.";

            echo json_encode([
                'success' => true,
                'message' => $msg,
                'new_average_rating' => $avg
            ]);

        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur de modération : ' . $e->getMessage()]);
        }
    }

    /**
     * CRUD: Creates a tool directly (bypass submission, immediate approved status).
     */
    public static function createTool($data, $admin_id) {
        $name = isset($data['name']) ? trim($data['name']) : '';
        $short_desc = isset($data['short_description']) ? trim($data['short_description']) : '';
        $long_desc = isset($data['long_description']) ? trim($data['long_description']) : '';
        $website_url = isset($data['website_url']) ? trim($data['website_url']) : '';
        $trial_url = isset($data['trial_url']) ? trim($data['trial_url']) : '';
        $logo_url = isset($data['logo_url']) ? trim($data['logo_url']) : '';
        $gdpr = isset($data['gdpr_compliant']) && $data['gdpr_compliant'] ? 1 : 0;
        $api = isset($data['has_api']) && $data['has_api'] ? 1 : 0;
        $mobile = isset($data['has_mobile_app']) && $data['has_mobile_app'] ? 1 : 0;
        
        $categories = isset($data['categories']) ? $data['categories'] : []; // Array of IDs
        $pricings = isset($data['pricings']) ? $data['pricings'] : []; // Array of IDs
        $languages = isset($data['languages']) ? $data['languages'] : []; // Array of IDs

        if (empty($name) || empty($short_desc) || empty($long_desc) || empty($website_url)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants (nom, descriptions, URL site).']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Check duplicates
            $dup_stmt = $pdo->prepare("SELECT id FROM ai_tools WHERE name = ? OR website_url = ?");
            $dup_stmt->execute([$name, $website_url]);
            if ($dup_stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Un outil avec ce nom ou cette URL existe déjà.']);
                return;
            }

            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));

            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO ai_tools (name, slug, short_description, long_description, website_url, trial_url, logo_url, gdpr_compliant, has_api, has_mobile_app, status, submitted_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)
            ");
            $stmt->execute([
                $name, $slug, $short_desc, $long_desc, $website_url,
                !empty($trial_url) ? $trial_url : $website_url,
                !empty($logo_url) ? $logo_url : 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=250',
                $gdpr, $api, $mobile, $admin_id
            ]);

            $tool_id = $pdo->lastInsertId();

            // Save associations
            foreach ($categories as $cat_id) {
                $pdo->prepare("INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)")->execute([$tool_id, (int)$cat_id]);
            }
            foreach ($pricings as $prc_id) {
                $pdo->prepare("INSERT INTO tool_pricing (tool_id, pricing_id) VALUES (?, ?)")->execute([$tool_id, (int)$prc_id]);
            }
            foreach ($languages as $lng_id) {
                $pdo->prepare("INSERT INTO tool_languages (tool_id, language_id) VALUES (?, ?)")->execute([$tool_id, (int)$lng_id]);
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => "L'outil '{$name}' a été créé avec succès par l'administrateur."
            ]);

        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur de création : ' . $e->getMessage()]);
        }
    }

    /**
     * CRUD: Updates an existing AI tool.
     */
    public static function updateTool($data, $admin_id) {
        $id = isset($data['id']) ? (int)$data['id'] : 0;
        $name = isset($data['name']) ? trim($data['name']) : '';
        $short_desc = isset($data['short_description']) ? trim($data['short_description']) : '';
        $long_desc = isset($data['long_description']) ? trim($data['long_description']) : '';
        $website_url = isset($data['website_url']) ? trim($data['website_url']) : '';
        $trial_url = isset($data['trial_url']) ? trim($data['trial_url']) : '';
        $logo_url = isset($data['logo_url']) ? trim($data['logo_url']) : '';
        $gdpr = isset($data['gdpr_compliant']) && $data['gdpr_compliant'] ? 1 : 0;
        $api = isset($data['has_api']) && $data['has_api'] ? 1 : 0;
        $mobile = isset($data['has_mobile_app']) && $data['has_mobile_app'] ? 1 : 0;
        
        $categories = isset($data['categories']) ? $data['categories'] : []; // Array of IDs
        $pricings = isset($data['pricings']) ? $data['pricings'] : []; // Array of IDs
        $languages = isset($data['languages']) ? $data['languages'] : []; // Array of IDs

        if ($id <= 0 || empty($name) || empty($short_desc) || empty($long_desc) || empty($website_url)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Champs obligatoires manquants pour la modification.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT id FROM ai_tools WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Outil d\'IA introuvable.']);
                return;
            }

            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));

            $pdo->beginTransaction();

            // Update main record
            $upd = $pdo->prepare("
                UPDATE ai_tools 
                SET name = ?, slug = ?, short_description = ?, long_description = ?, website_url = ?, trial_url = ?, logo_url = ?, gdpr_compliant = ?, has_api = ?, has_mobile_app = ? 
                WHERE id = ?
            ");
            $upd->execute([
                $name, $slug, $short_desc, $long_desc, $website_url, $trial_url, $logo_url, $gdpr, $api, $mobile, $id
            ]);

            // Re-map categories
            $pdo->prepare("DELETE FROM tool_categories WHERE tool_id = ?")->execute([$id]);
            foreach ($categories as $cat_id) {
                $pdo->prepare("INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)")->execute([$id, (int)$cat_id]);
            }

            // Re-map pricings
            $pdo->prepare("DELETE FROM tool_pricing WHERE tool_id = ?")->execute([$id]);
            foreach ($pricings as $prc_id) {
                $pdo->prepare("INSERT INTO tool_pricing (tool_id, pricing_id) VALUES (?, ?)")->execute([$id, (int)$prc_id]);
            }

            // Re-map languages
            $pdo->prepare("DELETE FROM tool_languages WHERE tool_id = ?")->execute([$id]);
            foreach ($languages as $lng_id) {
                $pdo->prepare("INSERT INTO tool_languages (tool_id, language_id) VALUES (?, ?)")->execute([$id, (int)$lng_id]);
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => "L'outil '{$name}' a été mis à jour avec succès par l'administrateur."
            ]);

        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur de modification : ' . $e->getMessage()]);
        }
    }

    /**
     * CRUD: Deletes a tool and cascades all its associations.
     */
    public static function deleteTool($tool_id, $admin_id) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant d\'outil manquant.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT name FROM ai_tools WHERE id = ?");
            $stmt->execute([$tool_id]);
            $tool = $stmt->fetch();

            if (!$tool) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Outil d\'IA introuvable.']);
                return;
            }

            // Delete tool (foreign keys are configured ON DELETE CASCADE for associations, reviews, and logs)
            $del = $pdo->prepare("DELETE FROM ai_tools WHERE id = ?");
            $del->execute([$tool_id]);

            echo json_encode([
                'success' => true,
                'message' => "L'outil '{$tool['name']}' et toutes ses données associées (favoris, avis, logs) ont été supprimés définitivement."
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur de suppression : ' . $e->getMessage()]);
        }
    }
}
