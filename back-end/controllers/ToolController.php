<?php
// =====================================================================
// Daleel AI - Tool Controller (Search, Filter, Detail, Favorites & Submissions)
// =====================================================================

class ToolController {

    /**
     * Retrieves AI tools based on keyword query and filters.
     * Incorporates the Weighted Ranking Algorithm.
     * 
     * @param array $filters Query params: ['q', 'category', 'pricing', 'language', 'gdpr', 'api', 'mobile']
     */
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
            // Base Select Query with Sub-scores for the Weighted Ranking Algorithm
            // Relevance (35%), User Rating (25%), Freshness (20%), Popularity (20%)
            $sql = "
                SELECT t.*, 
                       -- 1. Relevance Score (NLP, name or description matching)
                       (CASE 
                           WHEN :q1 = '' THEN 80
                           WHEN t.name = :q2 THEN 100 
                           WHEN t.name LIKE :q3 THEN 85
                           WHEN t.short_description LIKE :q4 THEN 60
                           WHEN t.long_description LIKE :q5 THEN 30
                           ELSE 0 
                        END) as score_relevance,
                       
                       -- 2. User Rating Score (average rating out of 5 mapped to 100)
                       (t.average_rating * 20) as score_rating,
                       
                       -- 3. Freshness Score (exponential decay based on days since added)
                       (100 * EXP(-0.005 * GREATEST(DATEDIFF(NOW(), t.created_at), 0))) as score_freshness,
                       
                       -- 4. Popularity Score (clicks logs + favorites counts scaled to 100)
                       (LEAST(
                           (COALESCE((SELECT COUNT(*) FROM clicks_logs WHERE tool_id = t.id), 0) + 
                            COALESCE((SELECT COUNT(*) FROM favorites WHERE tool_id = t.id), 0) * 4) * 5, 
                           100
                       )) as score_popularity
                FROM ai_tools t
                WHERE t.status = 'approved'
            ";

            // Track query parameters
            $params = [
                'q1' => $q, 'q2' => $q, 'q3' => '%' . $q . '%', 'q4' => '%' . $q . '%', 'q5' => '%' . $q . '%'
            ];

            // Join Category filter if specified
            if (!empty($category_slug)) {
                $sql .= " AND t.id IN (
                    SELECT tc.tool_id FROM tool_categories tc 
                    JOIN categories c ON tc.category_id = c.id 
                    WHERE c.slug = :category_slug
                )";
                $params['category_slug'] = $category_slug;
            }

            // Join Pricing filter if specified
            if ($pricing_id > 0) {
                $sql .= " AND t.id IN (
                    SELECT tp.tool_id FROM tool_pricing tp WHERE tp.pricing_id = :pricing_id
                )";
                $params['pricing_id'] = $pricing_id;
            }

            // Join Language filter if specified
            if ($language_id > 0) {
                $sql .= " AND t.id IN (
                    SELECT tl.tool_id FROM tool_languages tl WHERE tl.language_id = :language_id
                )";
                $params['language_id'] = $language_id;
            }

            // GDPR Compliance filter
            if ($gdpr === 1) {
                $sql .= " AND t.gdpr_compliant = 1";
            }

            // API availability filter
            if ($api === 1) {
                $sql .= " AND t.has_api = 1";
            }

            // Mobile App availability filter
            if ($mobile === 1) {
                $sql .= " AND t.has_mobile_app = 1";
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $tools = $stmt->fetchAll();

            // Calculate final Weighted Score dynamically in PHP for extreme precision
            // Score = W_rel * S_rel + W_rat * S_rat + W_fre * S_fre + W_pop * S_pop
            foreach ($tools as &$tool) {
                $tool['score_relevance'] = (float)$tool['score_relevance'];
                $tool['score_rating'] = (float)$tool['score_rating'];
                $tool['score_freshness'] = (float)$tool['score_freshness'];
                $tool['score_popularity'] = (float)$tool['score_popularity'];

                $global_score = ($tool['score_relevance'] * 0.35) + 
                                ($tool['score_rating'] * 0.25) + 
                                ($tool['score_freshness'] * 0.20) + 
                                ($tool['score_popularity'] * 0.20);
                
                $tool['global_score'] = round($global_score, 1);

                // Fetch auxiliary data for frontend cards: Categories, Pricings, Languages
                // 1. Categories
                $cat_stmt = $pdo->prepare("
                    SELECT c.name, c.slug, c.icon 
                    FROM categories c 
                    JOIN tool_categories tc ON c.id = tc.category_id 
                    WHERE tc.tool_id = ?
                ");
                $cat_stmt->execute([$tool['id']]);
                $tool['categories'] = $cat_stmt->fetchAll();

                // 2. Pricings
                $price_stmt = $pdo->prepare("
                    SELECT p.name 
                    FROM pricing_models p 
                    JOIN tool_pricing tp ON p.id = tp.pricing_id 
                    WHERE tp.tool_id = ?
                ");
                $price_stmt->execute([$tool['id']]);
                $tool['pricings'] = $price_stmt->fetchAll();

                // 3. Languages
                $lang_stmt = $pdo->prepare("
                    SELECT l.code, l.name 
                    FROM languages l 
                    JOIN tool_languages tl ON l.id = tl.language_id 
                    WHERE tl.tool_id = ?
                ");
                $lang_stmt->execute([$tool['id']]);
                $tool['languages'] = $lang_stmt->fetchAll();
            }

            // Sort tools descending by global_score
            usort($tools, function($a, $b) {
                return $b['global_score'] <=> $a['global_score'];
            });

            echo json_encode([
                'success' => true,
                'count' => count($tools),
                'tools' => $tools
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la recherche : ' . $e->getMessage()]);
        }
    }

    /**
     * Gets all filters for the Sidebar (Categories, Pricings, Languages)
     */
    public static function getFilters() {
        $pdo = DB::connect();

        try {
            $categories = $pdo->query("SELECT * FROM categories ORDER BY name ASC")->fetchAll();
            $pricings = $pdo->query("SELECT * FROM pricing_models")->fetchAll();
            $languages = $pdo->query("SELECT * FROM languages ORDER BY name ASC")->fetchAll();

            echo json_encode([
                'success' => true,
                'categories' => $categories,
                'pricing_models' => $pricings,
                'languages' => $languages
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur de chargement des filtres : ' . $e->getMessage()]);
        }
    }

    /**
     * Retrieves detailed information of a single AI tool.
     * Logs click telemetry for popularity ranking.
     */
    public static function getToolDetail($tool_id, $user_id = 0) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant d\'outil manquant ou incorrect.']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Log click event (anonymous or authenticated) to feed Popularity algorithm
            $log_stmt = $pdo->prepare("INSERT INTO clicks_logs (tool_id, user_id, action_type) VALUES (?, ?, 'click')");
            $log_stmt->execute([$tool_id, $user_id > 0 ? $user_id : null]);

            // Fetch AI tool
            $stmt = $pdo->prepare("SELECT * FROM ai_tools WHERE id = ? AND status = 'approved'");
            $stmt->execute([$tool_id]);
            $tool = $stmt->fetch();

            if (!$tool) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Outil d\'IA introuvable ou en attente d\'approbation.']);
                return;
            }

            // Fetch linked categories
            $cat_stmt = $pdo->prepare("
                SELECT c.* FROM categories c 
                JOIN tool_categories tc ON c.id = tc.category_id 
                WHERE tc.tool_id = ?
            ");
            $cat_stmt->execute([$tool_id]);
            $tool['categories'] = $cat_stmt->fetchAll();

            // Fetch pricing models
            $price_stmt = $pdo->prepare("
                SELECT p.* FROM pricing_models p 
                JOIN tool_pricing tp ON p.id = tp.pricing_id 
                WHERE tp.tool_id = ?
            ");
            $price_stmt->execute([$tool_id]);
            $tool['pricings'] = $price_stmt->fetchAll();

            // Fetch languages
            $lang_stmt = $pdo->prepare("
                SELECT l.* FROM languages l 
                JOIN tool_languages tl ON l.id = tl.language_id 
                WHERE tl.tool_id = ?
            ");
            $lang_stmt->execute([$tool_id]);
            $tool['languages'] = $lang_stmt->fetchAll();

            // Fetch approved user reviews
            $rev_stmt = $pdo->prepare("
                SELECT r.*, u.username 
                FROM reviews r 
                JOIN users u ON r.user_id = u.id 
                WHERE r.tool_id = ? AND r.status = 'approved'
                ORDER BY r.created_at DESC
            ");
            $rev_stmt->execute([$tool_id]);
            $tool['reviews'] = $rev_stmt->fetchAll();

            // Check if favorited by user
            $tool['is_favorited'] = false;
            if ($user_id > 0) {
                $fav_stmt = $pdo->prepare("SELECT 1 FROM favorites WHERE user_id = ? AND tool_id = ?");
                $fav_stmt->execute([$user_id, $tool_id]);
                if ($fav_stmt->fetch()) {
                    $tool['is_favorited'] = true;
                }
            }

            echo json_encode([
                'success' => true,
                'tool' => $tool
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la récupération des détails : ' . $e->getMessage()]);
        }
    }

    /**
     * Submits a new AI tool.
     * Prevents duplicates by verifying tool name and website URL.
     */
    public static function submitTool($data, $user_id) {
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
            echo json_encode(['success' => false, 'message' => 'Veuillez remplir les champs obligatoires (nom, descriptions, URL site).']);
            return;
        }

        $pdo = DB::connect();

        try {
            // STRICT DUPLICATE CHECK: Verify by Name OR website_url
            $dup_stmt = $pdo->prepare("SELECT id, name FROM ai_tools WHERE name = ? OR website_url = ?");
            $dup_stmt->execute([$name, $website_url]);
            $duplicate = $dup_stmt->fetch();

            if ($duplicate) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'message' => "L'outil '{$duplicate['name']}' ou cette URL de site web est déjà référencé dans notre base de données."
                ]);
                return;
            }

            // Create unique slug
            $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));

            // Begin transaction for relational safety
            $pdo->beginTransaction();

            // Insert into ai_tools (default status = 'pending')
            $ins_stmt = $pdo->prepare("
                INSERT INTO ai_tools (name, slug, short_description, long_description, website_url, trial_url, logo_url, gdpr_compliant, has_api, has_mobile_app, status, submitted_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            ");
            $ins_stmt->execute([
                $name, $slug, $short_desc, $long_desc, $website_url, 
                !empty($trial_url) ? $trial_url : $website_url, 
                !empty($logo_url) ? $logo_url : 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=250', 
                $gdpr, $api, $mobile, $user_id
            ]);

            $tool_id = $pdo->lastInsertId();

            // Map Categories
            if (!empty($categories)) {
                $cat_stmt = $pdo->prepare("INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)");
                foreach ($categories as $cat_id) {
                    $cat_stmt->execute([$tool_id, (int)$cat_id]);
                }
            }

            // Map Pricing Models
            if (!empty($pricings)) {
                $prc_stmt = $pdo->prepare("INSERT INTO tool_pricing (tool_id, pricing_id) VALUES (?, ?)");
                foreach ($pricings as $prc_id) {
                    $prc_stmt->execute([$tool_id, (int)$prc_id]);
                }
            }

            // Map Languages
            if (!empty($languages)) {
                $lng_stmt = $pdo->prepare("INSERT INTO tool_languages (tool_id, language_id) VALUES (?, ?)");
                foreach ($languages as $lng_id) {
                    $lng_stmt->execute([$tool_id, (int)$lng_id]);
                }
            }

            // Commit transaction
            $pdo->commit();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'L\'outil a été soumis avec succès ! Il sera examiné et validé par un administrateur sous peu.'
            ]);

        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la soumission : ' . $e->getMessage()]);
        }
    }

    /**
     * Toggles favorite status for a registered user.
     */
    public static function toggleFavorite($tool_id, $user_id) {
        if ($tool_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Identifiant d\'outil manquant.']);
            return;
        }

        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("SELECT 1 FROM favorites WHERE user_id = ? AND tool_id = ?");
            $stmt->execute([$user_id, $tool_id]);
            $is_fav = $stmt->fetch();

            if ($is_fav) {
                // Remove
                $del_stmt = $pdo->prepare("DELETE FROM favorites WHERE user_id = ? AND tool_id = ?");
                $del_stmt->execute([$user_id, $tool_id]);
                echo json_encode(['success' => true, 'is_favorited' => false, 'message' => 'Retiré de vos favoris.']);
            } else {
                // Add
                $add_stmt = $pdo->prepare("INSERT INTO favorites (user_id, tool_id) VALUES (?, ?)");
                $add_stmt->execute([$user_id, $tool_id]);
                echo json_encode(['success' => true, 'is_favorited' => true, 'message' => 'Ajouté à vos favoris avec succès !']);
            }

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la modification des favoris : ' . $e->getMessage()]);
        }
    }

    /**
     * Retrieves favorite tools of the logged-in user.
     */
    public static function getFavorites($user_id) {
        $pdo = DB::connect();

        try {
            $stmt = $pdo->prepare("
                SELECT t.* FROM ai_tools t 
                JOIN favorites f ON t.id = f.tool_id 
                WHERE f.user_id = ? AND t.status = 'approved'
                ORDER BY f.created_at DESC
            ");
            $stmt->execute([$user_id]);
            $tools = $stmt->fetchAll();

            foreach ($tools as &$tool) {
                // Retrieve simple category tags
                $cat_stmt = $pdo->prepare("
                    SELECT c.name FROM categories c 
                    JOIN tool_categories tc ON c.id = tc.category_id 
                    WHERE tc.tool_id = ?
                ");
                $cat_stmt->execute([$tool['id']]);
                $tool['categories'] = $cat_stmt->fetchAll();
            }

            echo json_encode([
                'success' => true,
                'tools' => $tools
            ]);

        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Impossible de récupérer les favoris : ' . $e->getMessage()]);
        }
    }

    /**
     * Submits a user review and recalculates average_rating for the tool.
     */
    public static function submitReview($data, $user_id) {
        $tool_id = isset($data['tool_id']) ? (int)$data['tool_id'] : 0;
        $rating = isset($data['rating']) ? (int)$data['rating'] : 0;
        $comment = isset($data['comment']) ? trim($data['comment']) : '';

        if ($tool_id <= 0 || $rating < 1 || $rating > 5 || empty($comment)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez saisir une note (1 à 5 étoiles) et un commentaire écrit.']);
            return;
        }

        $pdo = DB::connect();

        try {
            // Check if user already reviewed this tool
            $stmt = $pdo->prepare("SELECT id FROM reviews WHERE user_id = ? AND tool_id = ?");
            $stmt->execute([$user_id, $tool_id]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Vous avez déjà évalué cet outil. Vous ne pouvez soumettre qu\'un seul avis par outil.']);
                return;
            }

            $pdo->beginTransaction();

            // Insert review
            $ins_stmt = $pdo->prepare("INSERT INTO reviews (user_id, tool_id, rating, comment, status) VALUES (?, ?, ?, ?, 'approved')");
            $ins_stmt->execute([$user_id, $tool_id, $rating, $comment]);

            // Recalculate average rating
            $calc_stmt = $pdo->prepare("SELECT AVG(rating) as avg_rating FROM reviews WHERE tool_id = ? AND status = 'approved'");
            $calc_stmt->execute([$tool_id]);
            $res = $calc_stmt->fetch();
            $avg = $res['avg_rating'] !== null ? round((float)$res['avg_rating'], 2) : 0.00;

            // Update average rating on tool
            $upd_stmt = $pdo->prepare("UPDATE ai_tools SET average_rating = ? WHERE id = ?");
            $upd_stmt->execute([$avg, $tool_id]);

            $pdo->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Merci pour votre évaluation ! Votre avis a été publié.',
                'average_rating' => $avg
            ]);

        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Erreur serveur lors de la soumission de l\'avis : ' . $e->getMessage()]);
        }
    }
}
