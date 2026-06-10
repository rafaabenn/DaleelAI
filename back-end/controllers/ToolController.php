<?php
// =====================================================================
// Daleel AI - Tool Controller
// =====================================================================

class ToolController {

    public static function getTools($filters) {
        $q = isset($filters['q']) ? trim($filters['q']) : '';
        $category_slug = isset($filters['category']) ? trim($filters['category']) : '';
        $pricing_id = isset($filters['pricing']) ? (int)$filters['pricing'] : 0;
        $language_id = isset($filters['language']) ? (int)$filters['language'] : 0;
        $gdpr = isset($filters['gdpr']) && $filters['gdpr'] === '1' ? 1 : 0;
        $api = isset($filters['api']) && $filters['api'] === '1' ? 1 : 0;
        $mobile = isset($filters['mobile']) && $filters['mobile'] === '1' ? 1 : 0;

        $pdo = DB::connect();

        try {
            $sql = "
                SELECT t.*,
                    (CASE
                        WHEN :q1 = '' THEN 80
                        WHEN t.name = :q2 THEN 100
                        WHEN t.name LIKE :q3 THEN 85
                        WHEN t.short_description LIKE :q4 THEN 60
                        WHEN t.long_description LIKE :q5 THEN 30
                        ELSE 0
                    END) AS score_relevance,
                    (t.average_rating * 20) AS score_rating,
                    (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) AS score_freshness,
                    (LEAST(
                        (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) +
                         COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5,
                        100
                    )) AS score_popularity
                FROM ai_tools t
                WHERE t.status = 'approved'
            ";

            $params = [
                'q1' => $q,
                'q2' => $q,
                'q3' => '%' . $q . '%',
                'q4' => '%' . $q . '%',
                'q5' => '%' . $q . '%'
            ];

            if ($category_slug !== '') {
                $sql .= " AND t.id IN (
                    SELECT tc.tool_id
                    FROM tool_categories tc
                    JOIN categories c ON c.id = tc.category_id
                    WHERE c.slug = :category_slug
                )";
                $params['category_slug'] = $category_slug;
            }

            if ($pricing_id > 0) {
                $sql .= " AND t.id IN (SELECT tool_id FROM tool_pricing WHERE pricing_id = :pricing_id)";
                $params['pricing_id'] = $pricing_id;
            }

            if ($language_id > 0) {
                $sql .= " AND t.id IN (SELECT tool_id FROM tool_languages WHERE language_id = :language_id)";
                $params['language_id'] = $language_id;
            }

            if ($gdpr) {
                $sql .= " AND t.gdpr_compliant = 1";
            }
            if ($api) {
                $sql .= " AND t.has_api = 1";
            }
            if ($mobile) {
                $sql .= " AND t.has_mobile_app = 1";
            }

            $sql .= "
                ORDER BY (
                    score_relevance * 0.35 +
                    score_rating * 0.25 +
                    score_freshness * 0.20 +
                    score_popularity * 0.20
                ) DESC, t.name ASC
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $tools = $stmt->fetchAll();

            foreach ($tools as &$tool) {
                self::attachGlobalScore($tool);
                $tool['categories'] = self::getToolCategories($pdo, (int)$tool['id']);
                $tool['pricings'] = self::getToolPricings($pdo, (int)$tool['id']);
                $tool['languages'] = self::getToolLanguages($pdo, (int)$tool['id']);
            }

            echo json_encode(['success' => true, 'count' => count($tools), 'tools' => $tools]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la recherche : ' . $e->getMessage()]);
        }
    }

    public static function getFilters() {
        $pdo = DB::connect();

        try {
            $pricings = $pdo->query("SELECT * FROM pricing_models ORDER BY id")->fetchAll();

            echo json_encode([
                'success' => true,
                'categories' => $pdo->query("SELECT * FROM categories ORDER BY name")->fetchAll(),
                'pricing_models' => $pricings,
                'pricings' => $pricings,
                'languages' => $pdo->query("SELECT * FROM languages ORDER BY name")->fetchAll()
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de charger les filtres : ' . $e->getMessage()]);
        }
    }

    public static function getToolDetail($tool_id, $user_id = 0) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant d outil invalide.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("
                SELECT t.*,
                    80 AS score_relevance,
                    (t.average_rating * 20) AS score_rating,
                    (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) AS score_freshness,
                    (LEAST(
                        (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) +
                         COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5,
                        100
                    )) AS score_popularity
                FROM ai_tools t
                WHERE t.id = ? AND t.status = 'approved'
            ");
            $stmt->execute([$tool_id]);
            $tool = $stmt->fetch();

            if (!$tool) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Outil introuvable ou non publie.']);
                return;
            }

            self::attachGlobalScore($tool);
            $tool['categories'] = self::getToolCategories($pdo, $tool_id);
            $tool['pricings'] = self::getToolPricings($pdo, $tool_id);
            $tool['languages'] = self::getToolLanguages($pdo, $tool_id);

            $rev_stmt = $pdo->prepare("
                SELECT r.*, u.username
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                WHERE r.tool_id = ? AND r.status = 'approved'
                ORDER BY r.created_at DESC
            ");
            $rev_stmt->execute([$tool_id]);
            $tool['reviews'] = $rev_stmt->fetchAll();

            $tool['is_favorited'] = false;
            if ($user_id > 0) {
                $fav_stmt = $pdo->prepare("SELECT 1 FROM favorites WHERE user_id = ? AND tool_id = ?");
                $fav_stmt->execute([$user_id, $tool_id]);
                $tool['is_favorited'] = (bool)$fav_stmt->fetch();
            }

            echo json_encode(['success' => true, 'tool' => $tool]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la recuperation des details : ' . $e->getMessage()]);
        }
    }

    public static function submitTool($data, $user_id) {
        $name = isset($data['name']) ? trim($data['name']) : '';
        $short_desc = isset($data['short_description']) ? trim($data['short_description']) : '';
        $long_desc = isset($data['long_description']) ? trim($data['long_description']) : (isset($data['full_description']) ? trim($data['full_description']) : '');
        $website_url = isset($data['website_url']) ? trim($data['website_url']) : '';
        $trial_url = isset($data['trial_url']) ? trim($data['trial_url']) : '';
        $logo_url = isset($data['logo_url']) ? trim($data['logo_url']) : '';
        $gdpr = isset($data['gdpr_compliant']) && $data['gdpr_compliant'] ? 1 : 0;
        $api = isset($data['has_api']) && $data['has_api'] ? 1 : 0;
        $mobile = isset($data['has_mobile_app']) && $data['has_mobile_app'] ? 1 : 0;
        $categories = isset($data['categories']) ? $data['categories'] : (isset($data['category_id']) ? [$data['category_id']] : []);
        $pricings = isset($data['pricings']) ? $data['pricings'] : (isset($data['pricing_model_id']) ? [$data['pricing_model_id']] : []);
        $languages = isset($data['languages']) ? $data['languages'] : [];

        $pdo = DB::connect();
        self::ensureSubmissionAttemptsTable($pdo);
        $attemptKey = self::buildAttemptKey($user_id, $website_url, $name);

        try {
            $blocked = self::getActiveAttemptBlock($pdo, $attemptKey);
            if ($blocked) {
                http_response_code(429);
                echo json_encode([
                    'success' => false,
                    'status' => 'rejected',
                    'message' => 'Soumission rejetee definitivement pendant 1h apres 3 echecs. Vous pourrez reessayer apres ' . $blocked['rejected_until'] . '.',
                    'attempts' => (int)$blocked['attempts_count'],
                    'rejected_until' => $blocked['rejected_until']
                ]);
                return;
            }

            if ($name === '' || $short_desc === '' || $long_desc === '' || $website_url === '') {
                self::failSubmissionAttempt($pdo, $attemptKey, $user_id, $website_url, $name, 'Veuillez remplir les champs obligatoires : nom, descriptions et URL du site.');
                return;
            }

            $dup = $pdo->prepare("SELECT id FROM ai_tools WHERE LOWER(name) = LOWER(?) OR website_url = ?");
            $dup->execute([$name, $website_url]);
            if ($dup->fetch()) {
                self::failSubmissionAttempt($pdo, $attemptKey, $user_id, $website_url, $name, 'Cet outil existe deja dans la base de donnees avec le meme nom ou la meme URL.');
                return;
            }

            $validation = self::runAutoValidation($name, $website_url, $short_desc, $long_desc);
            if (!$validation['passed']) {
                self::failSubmissionAttempt($pdo, $attemptKey, $user_id, $website_url, $name, $validation['error']);
                return;
            }

            $initialStatus = $validation['auto_approve'] ? 'approved' : 'pending';
            $slug = self::generateUniqueSlug($pdo, $name);

            $pdo->beginTransaction();

            $ins = $pdo->prepare("
                INSERT INTO ai_tools
                    (name, slug, short_description, long_description,
                     website_url, trial_url, logo_url,
                     gdpr_compliant, has_api, has_mobile_app,
                     status, submitted_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $ins->execute([
                $name,
                $slug,
                $short_desc,
                $long_desc,
                $website_url,
                $trial_url !== '' ? $trial_url : $website_url,
                $logo_url,
                $gdpr,
                $api,
                $mobile,
                $initialStatus,
                $user_id
            ]);

            $tool_id = (int)$pdo->lastInsertId();
            self::insertToolRelations($pdo, $tool_id, 'tool_categories', 'category_id', $categories);
            self::insertToolRelations($pdo, $tool_id, 'tool_pricing', 'pricing_id', $pricings);
            self::insertToolRelations($pdo, $tool_id, 'tool_languages', 'language_id', $languages);
            self::clearSubmissionAttempt($pdo, $attemptKey);

            $notifMessage = $initialStatus === 'approved'
                ? "Felicitations ! Votre outil '$name' a ete automatiquement approuve et publie."
                : "Votre outil '$name' est bien enregistre. Il est en attente d examen par un administrateur.";
            $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, ?, 'submission_status', ?)");
            $notifStmt->execute([$user_id, $tool_id, $notifMessage]);

            if ($initialStatus === 'pending') {
                $adminStmt = $pdo->query("SELECT id FROM users WHERE role_id = 1");
                $adminNotif = $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, ?, 'admin_message', ?)");
                foreach ($adminStmt->fetchAll() as $admin) {
                    $adminNotif->execute([$admin['id'], $tool_id, "Nouvelle soumission d outil en attente : '$name'."]);
                }
            }

            $pdo->commit();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => $initialStatus === 'approved'
                    ? 'Outil automatiquement approuve et publie.'
                    : 'Soumission recue. L outil est en attente de validation administrateur.',
                'tool_id' => $tool_id,
                'status' => $initialStatus,
                'notification' => $notifMessage,
                'validation' => $validation
            ]);
        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la soumission : ' . $e->getMessage()]);
        }
    }

    public static function getMySubmissions($user_id) {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("
                SELECT *
                FROM ai_tools
                WHERE submitted_by = ? AND status IN ('pending', 'processing', 'rejected')
                ORDER BY updated_at DESC
            ");
            $stmt->execute([$user_id]);
            $submissions = $stmt->fetchAll();

            foreach ($submissions as &$submission) {
                $submission['category_ids'] = self::getRelationIds($pdo, 'tool_categories', 'category_id', (int)$submission['id']);
                $submission['pricing_ids'] = self::getRelationIds($pdo, 'tool_pricing', 'pricing_id', (int)$submission['id']);
                $submission['language_ids'] = self::getRelationIds($pdo, 'tool_languages', 'language_id', (int)$submission['id']);
            }

            echo json_encode(['success' => true, 'submissions' => $submissions]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de recuperer vos soumissions : ' . $e->getMessage()]);
        }
    }

    public static function resubmitTool($data, $user_id) {
        $tool_id = isset($data['tool_id']) ? (int)$data['tool_id'] : 0;
        $name = isset($data['name']) ? trim($data['name']) : '';
        $short_desc = isset($data['short_description']) ? trim($data['short_description']) : '';
        $long_desc = isset($data['long_description']) ? trim($data['long_description']) : (isset($data['full_description']) ? trim($data['full_description']) : '');
        $website_url = isset($data['website_url']) ? trim($data['website_url']) : '';
        $trial_url = isset($data['trial_url']) ? trim($data['trial_url']) : '';
        $logo_url = isset($data['logo_url']) ? trim($data['logo_url']) : '';
        $gdpr = isset($data['gdpr_compliant']) && $data['gdpr_compliant'] ? 1 : 0;
        $api = isset($data['has_api']) && $data['has_api'] ? 1 : 0;
        $mobile = isset($data['has_mobile_app']) && $data['has_mobile_app'] ? 1 : 0;
        $categories = isset($data['categories']) ? $data['categories'] : (isset($data['category_id']) ? [$data['category_id']] : []);
        $pricings = isset($data['pricings']) ? $data['pricings'] : (isset($data['pricing_model_id']) ? [$data['pricing_model_id']] : []);
        $languages = isset($data['languages']) ? $data['languages'] : [];

        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Soumission a corriger introuvable.']);
            return;
        }

        $pdo = DB::connect();
        self::ensureSubmissionAttemptsTable($pdo);
        $attemptKey = self::buildCorrectionAttemptKey($user_id, $tool_id);

        try {
            $toolStmt = $pdo->prepare("SELECT id, name FROM ai_tools WHERE id = ? AND submitted_by = ? AND status = 'processing'");
            $toolStmt->execute([$tool_id, $user_id]);
            $existingTool = $toolStmt->fetch();

            if (!$existingTool) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Aucune soumission en correction ne correspond a votre compte.']);
                return;
            }

            $blocked = self::getActiveAttemptBlock($pdo, $attemptKey);
            if ($blocked) {
                http_response_code(429);
                echo json_encode([
                    'success' => false,
                    'status' => 'rejected',
                    'message' => 'Correction bloquee pendant 1h apres 3 echecs. Vous pourrez reessayer apres ' . $blocked['rejected_until'] . '.',
                    'attempts' => (int)$blocked['attempts_count'],
                    'rejected_until' => $blocked['rejected_until']
                ]);
                return;
            }

            if ($name === '' || $short_desc === '' || $long_desc === '' || $website_url === '') {
                self::failSubmissionAttempt($pdo, $attemptKey, $user_id, $website_url, $name, 'Veuillez remplir les champs obligatoires : nom, descriptions et URL du site.');
                return;
            }

            $dup = $pdo->prepare("SELECT id FROM ai_tools WHERE (LOWER(name) = LOWER(?) OR website_url = ?) AND id <> ?");
            $dup->execute([$name, $website_url, $tool_id]);
            if ($dup->fetch()) {
                self::failSubmissionAttempt($pdo, $attemptKey, $user_id, $website_url, $name, 'Cet outil existe deja dans la base de donnees avec le meme nom ou la meme URL.');
                return;
            }

            $validation = self::runAutoValidation($name, $website_url, $short_desc, $long_desc);
            if (!$validation['passed']) {
                self::failSubmissionAttempt($pdo, $attemptKey, $user_id, $website_url, $name, $validation['error']);
                return;
            }

            $newStatus = $validation['auto_approve'] ? 'approved' : 'pending';
            $slug = self::generateUniqueSlugForTool($pdo, $name, $tool_id);

            $pdo->beginTransaction();

            $upd = $pdo->prepare("
                UPDATE ai_tools
                SET name = ?, slug = ?, short_description = ?, long_description = ?,
                    website_url = ?, trial_url = ?, logo_url = ?,
                    gdpr_compliant = ?, has_api = ?, has_mobile_app = ?, status = ?
                WHERE id = ? AND submitted_by = ?
            ");
            $upd->execute([
                $name,
                $slug,
                $short_desc,
                $long_desc,
                $website_url,
                $trial_url !== '' ? $trial_url : $website_url,
                $logo_url,
                $gdpr,
                $api,
                $mobile,
                $newStatus,
                $tool_id,
                $user_id
            ]);

            self::replaceToolRelations($pdo, $tool_id, 'tool_categories', 'category_id', $categories);
            self::replaceToolRelations($pdo, $tool_id, 'tool_pricing', 'pricing_id', $pricings);
            self::replaceToolRelations($pdo, $tool_id, 'tool_languages', 'language_id', $languages);
            self::clearSubmissionAttempt($pdo, $attemptKey);

            $notifMessage = $newStatus === 'approved'
                ? "Votre correction pour '$name' a ete validee automatiquement et l outil est publie."
                : "Votre correction pour '$name' a ete envoyee a l administrateur.";
            $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, ?, 'submission_status', ?)");
            $notifStmt->execute([$user_id, $tool_id, $notifMessage]);

            if ($newStatus === 'pending') {
                $adminStmt = $pdo->query("SELECT id FROM users WHERE role_id = 1");
                $adminNotif = $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, ?, 'admin_message', ?)");
                foreach ($adminStmt->fetchAll() as $admin) {
                    $adminNotif->execute([$admin['id'], $tool_id, "Correction envoyee pour l outil : '$name'."]);
                }
            }

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => $newStatus === 'approved'
                    ? 'Correction validee automatiquement. Outil publie.'
                    : 'Correction recue. L outil retourne en attente de validation administrateur.',
                'tool_id' => $tool_id,
                'status' => $newStatus,
                'validation' => $validation
            ]);
        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la correction : ' . $e->getMessage()]);
        }
    }

    public static function updateStatus($data) {
        $tool_id = isset($data['tool_id']) ? (int)$data['tool_id'] : 0;
        $status = isset($data['status']) ? trim($data['status']) : '';
        $allowedStatuses = ['pending', 'approved', 'rejected', 'processing'];

        if ($tool_id <= 0 || !in_array($status, $allowedStatuses, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Donnees invalides. Statut attendu : pending, approved, rejected ou processing.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $toolStmt = $pdo->prepare("SELECT name, submitted_by FROM ai_tools WHERE id = ?");
            $toolStmt->execute([$tool_id]);
            $tool = $toolStmt->fetch();

            $stmt = $pdo->prepare("UPDATE ai_tools SET status = ? WHERE id = ?");
            $stmt->execute([$status, $tool_id]);

            if ($tool && !empty($tool['submitted_by'])) {
                $notificationMessage = "Le statut de votre soumission '" . $tool['name'] . "' est maintenant : " . $status . ".";
                $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, tool_id, type, message) VALUES (?, ?, 'submission_status', ?)");
                $notifStmt->execute([$tool['submitted_by'], $tool_id, $notificationMessage]);
            }

            echo json_encode(['success' => true, 'message' => "Statut mis a jour : $status", 'tool_id' => $tool_id, 'status' => $status]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function getNotifications($user_id) {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT n.* FROM notifications n WHERE n.user_id = ? ORDER BY n.created_at DESC");
            $stmt->execute([$user_id]);
            echo json_encode(['success' => true, 'notifications' => $stmt->fetchAll()]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de recuperer les notifications : ' . $e->getMessage()]);
        }
    }

    public static function markNotificationRead($data, $user_id) {
        $notification_id = isset($data['notification_id']) ? (int)$data['notification_id'] : 0;
        if ($notification_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant de notification invalide.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("UPDATE notifications SET status = 'read' WHERE id = ? AND user_id = ?");
            $stmt->execute([$notification_id, $user_id]);
            echo json_encode(['success' => true, 'message' => 'Notification marquee comme lue.']);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de mettre a jour la notification : ' . $e->getMessage()]);
        }
    }

    public static function toggleFavorite($tool_id, $user_id) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant d outil manquant.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT 1 FROM favorites WHERE user_id = ? AND tool_id = ?");
            $stmt->execute([$user_id, $tool_id]);

            if ($stmt->fetch()) {
                $del_stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND tool_id = ?");
                $del_stmt->execute([$user_id, $tool_id]);
                echo json_encode(['success' => true, 'is_favorited' => false, 'message' => 'Retire de vos favoris.']);
            } else {
                $add_stmt = $pdo->prepare("INSERT INTO favorites (user_id, tool_id) VALUES (?, ?)");
                $add_stmt->execute([$user_id, $tool_id]);
                echo json_encode(['success' => true, 'is_favorited' => true, 'message' => 'Ajoute a vos favoris avec succes.']);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification des favoris : ' . $e->getMessage()]);
        }
    }

    public static function getFavorites($user_id) {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("
                SELECT t.*
                FROM ai_tools t
                JOIN favorites f ON t.id = f.tool_id
                WHERE f.user_id = ? AND t.status = 'approved'
                ORDER BY f.created_at DESC
            ");
            $stmt->execute([$user_id]);
            $tools = $stmt->fetchAll();

            foreach ($tools as &$tool) {
                $tool['categories'] = self::getToolCategories($pdo, (int)$tool['id']);
            }

            echo json_encode(['success' => true, 'tools' => $tools]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de recuperer les favoris : ' . $e->getMessage()]);
        }
    }

    public static function submitReview($data, $user_id) {
        $tool_id = isset($data['tool_id']) ? (int)$data['tool_id'] : 0;
        $rating = isset($data['rating']) ? (int)$data['rating'] : 0;
        $comment = isset($data['comment']) ? trim($data['comment']) : '';

        if ($tool_id <= 0 || $rating < 1 || $rating > 5 || $comment === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez saisir une note de 1 a 5 et un commentaire.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT id FROM reviews WHERE user_id = ? AND tool_id = ?");
            $stmt->execute([$user_id, $tool_id]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Vous avez deja evalue cet outil.']);
                return;
            }

            $pdo->beginTransaction();

            $ins_stmt = $pdo->prepare("INSERT INTO reviews (user_id, tool_id, rating, comment, status) VALUES (?, ?, ?, ?, 'approved')");
            $ins_stmt->execute([$user_id, $tool_id, $rating, $comment]);

            $calc_stmt = $pdo->prepare("SELECT AVG(rating) AS avg_rating FROM reviews WHERE tool_id = ? AND status = 'approved'");
            $calc_stmt->execute([$tool_id]);
            $res = $calc_stmt->fetch();
            $avg = $res['avg_rating'] !== null ? round((float)$res['avg_rating'], 2) : 0.00;

            $upd_stmt = $pdo->prepare("UPDATE ai_tools SET average_rating = ? WHERE id = ?");
            $upd_stmt->execute([$avg, $tool_id]);

            $pdo->commit();

            echo json_encode(['success' => true, 'message' => 'Merci pour votre evaluation. Votre avis a ete publie.', 'average_rating' => $avg]);
        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la soumission de l avis : ' . $e->getMessage()]);
        }
    }

    public static function runAutoValidation(string $name, string $website_url, string $short_desc, string $long_desc): array {
        if (!filter_var($website_url, FILTER_VALIDATE_URL)) {
            return self::validationError('Format URL invalide. Exemple attendu : https://monoutil.com.');
        }

        $scheme = strtolower((string)parse_url($website_url, PHP_URL_SCHEME));
        if (!in_array($scheme, ['http', 'https'], true)) {
            return self::validationError('L URL doit commencer par http:// ou https://.');
        }

        $urlStatus = self::checkUrlReachability($website_url);
        if (!$urlStatus['reachable']) {
            return self::validationError('URL inaccessible. Le site doit repondre avec un code HTTP 200, 301, 302, 403 ou 405.');
        }

        $shortLength = mb_strlen($short_desc);
        if ($shortLength < 20 || $shortLength > 250) {
            return self::validationError('Description courte invalide : elle doit contenir entre 20 et 250 caracteres.');
        }

        if (mb_strlen($long_desc) < 80) {
            return self::validationError('Description longue insuffisante : minimum 80 caracteres.');
        }

        if (self::containsPlaceholderText($name . ' ' . $short_desc . ' ' . $long_desc)) {
            return self::validationError('Texte placeholder detecte : lorem, ipsum, todo, test, azerty, qwerty, xxx, aaa ou repetitions abusives.');
        }

        if (!self::isValidToolName($name)) {
            return self::validationError('Nom invalide : il doit contenir au moins 2 lettres alphabetiques et ne pas etre une repetition abusive.');
        }

        $domainCheck = self::isNameCoherentWithDomain($name, $website_url);

        return [
            'passed' => true,
            'auto_approve' => $domainCheck['matched'],
            'status' => $domainCheck['matched'] ? 'approved' : 'pending',
            'message' => $domainCheck['matched']
                ? 'Validation automatique reussie : le nom est coherent avec le domaine.'
                : 'Validation automatique reussie, mais la coherence nom/domaine doit etre verifiee par un administrateur.',
            'url_http_code' => $urlStatus['http_code'],
            'domain_check' => $domainCheck
        ];
    }

    private static function validationError($message): array {
        return ['passed' => false, 'auto_approve' => false, 'status' => 'rejected', 'error' => $message];
    }

    private static function checkUrlReachability($url): array {
        $allowedCodes = [200, 301, 302, 403, 405];
        $result = ['reachable' => false, 'http_code' => 0, 'error' => null];

        if (!function_exists('curl_init')) {
            $headers = @get_headers($url, 1);
            if (is_array($headers) && isset($headers[0]) && preg_match('/\s(\d{3})\s/', $headers[0], $matches)) {
                $code = (int)$matches[1];
                $result['http_code'] = $code;
                $result['reachable'] = in_array($code, $allowedCodes, true);
            } else {
                $result['error'] = 'Impossible de lire les en-tetes HTTP.';
            }
            return $result;
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_NOBODY => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_USERAGENT => 'DaleelAI-Validator/1.0'
        ]);

        curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        $result['http_code'] = $code;
        $result['error'] = $error ?: null;
        $result['reachable'] = in_array($code, $allowedCodes, true);
        return $result;
    }

    private static function containsPlaceholderText($text): bool {
        $patterns = [
            '/\b(lorem|ipsum|dolor|sit\s+amet)\b/i',
            '/\b(todo|fixme|placeholder|changeme|dummy)\b/i',
            '/\b(test|testing|testtest)\b/i',
            '/(azerty|qwerty|asdf|qwer|zxcv|qsdf|hjkl|uiop)/i',
            '/\b(xxx+|aaa+|bbb+|ccc+|zzz+)\b/i',
            '/(.)\1{4,}/u'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        $words = preg_split('/\s+/', $text);
        foreach ($words as $word) {
            if (mb_strlen($word) > 35 && !filter_var($word, FILTER_VALIDATE_URL)) {
                return true;
            }
        }

        return false;
    }

    private static function isValidToolName($name): bool {
        if (preg_match_all('/[a-zA-Z]/', $name) < 2) {
            return false;
        }

        if (preg_match('/(.)\1{3,}/u', $name)) {
            return false;
        }

        $normalized = preg_replace('/[^a-zA-Z0-9]/', '', strtolower($name));
        if ($normalized === '' || preg_match('/^(.)\1+$/', $normalized)) {
            return false;
        }

        return true;
    }

    private static function isNameCoherentWithDomain($name, $url): array {
        $trustedDomains = ['openai.com', 'google.com', 'microsoft.com', 'anthropic.com'];
        $host = strtolower((string)parse_url($url, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host);

        foreach ($trustedDomains as $trustedDomain) {
            if ($host === $trustedDomain || substr($host, -strlen('.' . $trustedDomain)) === '.' . $trustedDomain) {
                return ['matched' => true, 'reason' => 'Domaine connu accepte automatiquement.', 'domain' => $host];
            }
        }

        $domainText = preg_replace('/[^a-z0-9]+/i', ' ', $host);
        $tokens = preg_split('/[^a-z0-9]+/i', strtolower($name), -1, PREG_SPLIT_NO_EMPTY);
        $ignored = ['ai', 'ia', 'app', 'tool', 'tools', 'by', 'the', 'for', 'assistant'];

        foreach ($tokens as $token) {
            if (strlen($token) < 3 || in_array($token, $ignored, true)) {
                continue;
            }

            if (strpos($domainText, $token) !== false) {
                return ['matched' => true, 'reason' => "Le mot '$token' du nom apparait dans le domaine.", 'domain' => $host];
            }
        }

        return ['matched' => false, 'reason' => 'Aucun mot significatif du nom ne figure dans le domaine.', 'domain' => $host];
    }

    private static function ensureSubmissionAttemptsTable($pdo): void {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS submission_attempts (
                attempt_key CHAR(32) PRIMARY KEY,
                user_id INT NOT NULL,
                website_url VARCHAR(255) NOT NULL,
                tool_name VARCHAR(100) NOT NULL,
                attempts_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
                last_error VARCHAR(500) NULL,
                rejected_until DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_submission_attempts_user (user_id),
                INDEX idx_submission_attempts_rejected_until (rejected_until)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $columns = self::getSubmissionAttemptColumns($pdo);
        $missingColumns = [
            'attempt_key' => "ALTER TABLE submission_attempts ADD COLUMN attempt_key CHAR(32) NULL",
            'user_id' => "ALTER TABLE submission_attempts ADD COLUMN user_id INT NULL",
            'website_url' => "ALTER TABLE submission_attempts ADD COLUMN website_url VARCHAR(255) NULL",
            'tool_name' => "ALTER TABLE submission_attempts ADD COLUMN tool_name VARCHAR(100) NULL",
            'attempts_count' => "ALTER TABLE submission_attempts ADD COLUMN attempts_count TINYINT UNSIGNED NOT NULL DEFAULT 0",
            'last_error' => "ALTER TABLE submission_attempts ADD COLUMN last_error VARCHAR(500) NULL",
            'rejected_until' => "ALTER TABLE submission_attempts ADD COLUMN rejected_until DATETIME NULL",
            'created_at' => "ALTER TABLE submission_attempts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            'updated_at' => "ALTER TABLE submission_attempts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ];

        foreach ($missingColumns as $column => $sql) {
            if (!in_array($column, $columns, true)) {
                $pdo->exec($sql);
            }
        }

        self::ensureSubmissionAttemptIndex($pdo, 'idx_submission_attempts_key', 'attempt_key', true);
        self::ensureSubmissionAttemptIndex($pdo, 'idx_submission_attempts_user', 'user_id', false);
        self::ensureSubmissionAttemptIndex($pdo, 'idx_submission_attempts_rejected_until', 'rejected_until', false);
    }

    private static function getSubmissionAttemptColumns($pdo): array {
        $stmt = $pdo->query("SHOW COLUMNS FROM submission_attempts");
        $columns = [];

        foreach ($stmt->fetchAll() as $column) {
            $columns[] = $column['Field'];
        }

        return $columns;
    }

    private static function ensureSubmissionAttemptIndex($pdo, $indexName, $columnName, $unique): void {
        $stmt = $pdo->prepare("SHOW INDEX FROM submission_attempts WHERE Key_name = ?");
        $stmt->execute([$indexName]);

        if ($stmt->fetch()) {
            return;
        }

        $type = $unique ? 'UNIQUE INDEX' : 'INDEX';
        $pdo->exec("ALTER TABLE submission_attempts ADD $type $indexName ($columnName)");
    }

    private static function buildAttemptKey($user_id, $website_url, $name): string {
        return md5((int)$user_id . '|' . strtolower(trim($website_url)) . '|' . strtolower(trim($name)));
    }

    private static function buildCorrectionAttemptKey($user_id, $tool_id): string {
        return md5((int)$user_id . '|correction|' . (int)$tool_id);
    }

    private static function getActiveAttemptBlock($pdo, $attemptKey) {
        $stmt = $pdo->prepare("SELECT attempts_count, rejected_until FROM submission_attempts WHERE attempt_key = ?");
        $stmt->execute([$attemptKey]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        if (!empty($row['rejected_until']) && strtotime($row['rejected_until']) > time()) {
            return $row;
        }

        if (!empty($row['rejected_until']) && strtotime($row['rejected_until']) <= time()) {
            self::clearSubmissionAttempt($pdo, $attemptKey);
        }

        return null;
    }

    private static function failSubmissionAttempt($pdo, $attemptKey, $user_id, $website_url, $name, $message): void {
        $stmt = $pdo->prepare("SELECT attempts_count FROM submission_attempts WHERE attempt_key = ?");
        $stmt->execute([$attemptKey]);
        $row = $stmt->fetch();
        $attempts = $row ? ((int)$row['attempts_count'] + 1) : 1;
        $rejectedUntilSql = $attempts >= 3 ? 'DATE_ADD(NOW(), INTERVAL 1 HOUR)' : 'NULL';

        $sql = "
            INSERT INTO submission_attempts
                (attempt_key, user_id, website_url, tool_name, attempts_count, last_error, rejected_until)
            VALUES
                (?, ?, ?, ?, ?, ?, $rejectedUntilSql)
            ON DUPLICATE KEY UPDATE
                attempts_count = VALUES(attempts_count),
                last_error = VALUES(last_error),
                rejected_until = $rejectedUntilSql,
                website_url = VALUES(website_url),
                tool_name = VALUES(tool_name)
        ";
        $upsert = $pdo->prepare($sql);
        $upsert->execute([$attemptKey, $user_id, $website_url, $name, $attempts, $message]);

        if ($attempts >= 3) {
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'status' => 'rejected',
                'message' => 'Soumission rejetee definitivement pendant 1h apres 3 echecs. Derniere erreur : ' . $message,
                'attempts' => $attempts,
                'rejected_until_minutes' => 60
            ]);
            return;
        }

        http_response_code(400);
        echo json_encode([
            'success' => false,
            'status' => 'rejected',
            'message' => $message,
            'attempts' => $attempts,
            'remaining_attempts' => 3 - $attempts
        ]);
    }

    private static function clearSubmissionAttempt($pdo, $attemptKey): void {
        $stmt = $pdo->prepare("DELETE FROM submission_attempts WHERE attempt_key = ?");
        $stmt->execute([$attemptKey]);
    }

    private static function generateUniqueSlug($pdo, $name): string {
        $base = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $name), '-'));
        if ($base === '') {
            $base = 'outil';
        }

        $slug = $base;
        $counter = 2;
        $stmt = $pdo->prepare("SELECT 1 FROM ai_tools WHERE slug = ?");

        while (true) {
            $stmt->execute([$slug]);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = $base . '-' . $counter;
            $counter++;
        }
    }

    private static function generateUniqueSlugForTool($pdo, $name, $tool_id): string {
        $base = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $name), '-'));
        if ($base === '') {
            $base = 'outil';
        }

        $slug = $base;
        $counter = 2;
        $stmt = $pdo->prepare("SELECT 1 FROM ai_tools WHERE slug = ? AND id <> ?");

        while (true) {
            $stmt->execute([$slug, $tool_id]);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = $base . '-' . $counter;
            $counter++;
        }
    }

    private static function insertToolRelations($pdo, $tool_id, $table, $column, $values): void {
        if (empty($values) || !is_array($values)) {
            return;
        }

        $allowed = [
            'tool_categories' => 'category_id',
            'tool_pricing' => 'pricing_id',
            'tool_languages' => 'language_id'
        ];

        if (!isset($allowed[$table]) || $allowed[$table] !== $column) {
            return;
        }

        $stmt = $pdo->prepare("INSERT INTO $table (tool_id, $column) VALUES (?, ?)");
        foreach ($values as $value) {
            $id = (int)$value;
            if ($id > 0) {
                $stmt->execute([$tool_id, $id]);
            }
        }
    }

    private static function replaceToolRelations($pdo, $tool_id, $table, $column, $values): void {
        $allowed = [
            'tool_categories' => 'category_id',
            'tool_pricing' => 'pricing_id',
            'tool_languages' => 'language_id'
        ];

        if (!isset($allowed[$table]) || $allowed[$table] !== $column) {
            return;
        }

        $delete = $pdo->prepare("DELETE FROM $table WHERE tool_id = ?");
        $delete->execute([$tool_id]);
        self::insertToolRelations($pdo, $tool_id, $table, $column, $values);
    }

    private static function getRelationIds($pdo, $table, $column, $tool_id): array {
        $allowed = [
            'tool_categories' => 'category_id',
            'tool_pricing' => 'pricing_id',
            'tool_languages' => 'language_id'
        ];

        if (!isset($allowed[$table]) || $allowed[$table] !== $column) {
            return [];
        }

        $stmt = $pdo->prepare("SELECT $column FROM $table WHERE tool_id = ?");
        $stmt->execute([$tool_id]);
        return array_map('intval', array_column($stmt->fetchAll(), $column));
    }

    private static function attachGlobalScore(array &$tool): void {
        $tool['score_relevance'] = isset($tool['score_relevance']) ? (float)$tool['score_relevance'] : 0.0;
        $tool['score_rating'] = isset($tool['score_rating']) ? (float)$tool['score_rating'] : 0.0;
        $tool['score_freshness'] = isset($tool['score_freshness']) ? (float)$tool['score_freshness'] : 0.0;
        $tool['score_popularity'] = isset($tool['score_popularity']) ? (float)$tool['score_popularity'] : 0.0;
        $tool['global_score'] = round(
            ($tool['score_relevance'] * 0.35) +
            ($tool['score_rating'] * 0.25) +
            ($tool['score_freshness'] * 0.20) +
            ($tool['score_popularity'] * 0.20),
            1
        );
    }

    private static function getToolCategories($pdo, $tool_id): array {
        $stmt = $pdo->prepare("
            SELECT c.*
            FROM categories c
            JOIN tool_categories tc ON c.id = tc.category_id
            WHERE tc.tool_id = ?
            ORDER BY c.name
        ");
        $stmt->execute([$tool_id]);
        return $stmt->fetchAll();
    }

    private static function getToolPricings($pdo, $tool_id): array {
        $stmt = $pdo->prepare("
            SELECT p.*
            FROM pricing_models p
            JOIN tool_pricing tp ON p.id = tp.pricing_id
            WHERE tp.tool_id = ?
            ORDER BY p.id
        ");
        $stmt->execute([$tool_id]);
        return $stmt->fetchAll();
    }

    private static function getToolLanguages($pdo, $tool_id): array {
        $stmt = $pdo->prepare("
            SELECT l.*
            FROM languages l
            JOIN tool_languages tl ON l.id = tl.language_id
            WHERE tl.tool_id = ?
            ORDER BY l.name
        ");
        $stmt->execute([$tool_id]);
        return $stmt->fetchAll();
    }

    public static function logClick($tool_id, $user_id) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID outil invalide.']);
            return;
        }
        $pdo = DB::connect();
        try {
            $stmt = $pdo->prepare("INSERT INTO clicks_logs (tool_id, user_id, action_type) VALUES (?, ?, 'click')");
            $stmt->execute([$tool_id, $user_id > 0 ? $user_id : null]);
            echo json_encode(['success' => true]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    public static function getRecommended($user_id) {
        $pdo = DB::connect();
        try {
            // Top catégories : favoris (poids 3) + clics des 30 derniers jours (poids 1)
            $catStmt = $pdo->prepare("
                SELECT category_id, SUM(w) AS total_weight
                FROM (
                    SELECT tc.category_id, 3 AS w
                    FROM favorites f
                    JOIN tool_categories tc ON tc.tool_id = f.tool_id
                    WHERE f.user_id = :uid1
                    UNION ALL
                    SELECT tc.category_id, 1 AS w
                    FROM clicks_logs cl
                    JOIN tool_categories tc ON tc.tool_id = cl.tool_id
                    WHERE cl.user_id = :uid2
                    AND cl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                ) interactions
                GROUP BY category_id
                ORDER BY total_weight DESC
                LIMIT 3
            ");
            $catStmt->execute([':uid1' => $user_id, ':uid2' => $user_id]);
            $topCategories = $catStmt->fetchAll();

            if (empty($topCategories)) {
                echo json_encode(['success' => true, 'tools' => [], 'has_profile' => false]);
                return;
            }

            $categoryIds = array_column($topCategories, 'category_id');
            $placeholders = implode(',', array_fill(0, count($categoryIds), '?'));
            $params = array_merge($categoryIds, [$user_id]);

            $toolStmt = $pdo->prepare("
                SELECT DISTINCT t.*,
                    80 AS score_relevance,
                    (t.average_rating * 20) AS score_rating,
                    (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) AS score_freshness,
                    (LEAST(
                        (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) +
                         COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5,
                        100
                    )) AS score_popularity
                FROM ai_tools t
                JOIN tool_categories tc ON tc.tool_id = t.id
                WHERE t.status = 'approved'
                AND tc.category_id IN ($placeholders)
                AND t.id NOT IN (
                    SELECT tool_id FROM favorites WHERE user_id = ?
                )
                ORDER BY (
                    (t.average_rating * 20) * 0.40 +
                    (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) * 0.30 +
                    (LEAST(
                        (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) +
                         COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5,
                        100
                    )) * 0.30
                ) DESC
                LIMIT 6
            ");
            $toolStmt->execute($params);
            $tools = $toolStmt->fetchAll();

            foreach ($tools as &$tool) {
                self::attachGlobalScore($tool);
                $tool['categories'] = self::getToolCategories($pdo, (int)$tool['id']);
                $tool['pricings']   = self::getToolPricings($pdo, (int)$tool['id']);
                $tool['languages']  = self::getToolLanguages($pdo, (int)$tool['id']);
                $tool['is_favorited'] = false;
            }

            echo json_encode([
                'success'              => true,
                'tools'                => $tools,
                'has_profile'          => true,
                'based_on_categories'  => count($topCategories)
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
}
