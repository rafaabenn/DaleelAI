-- =====================================================================
-- DALEEL AI DATABASE SCHEMA (MySQL)
-- Conçu selon la méthode Merise (MCD -> MLD -> MPD)
-- Comprend exactement 15 tables avec contraintes d'intégrité référentielle
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `daleel_ai` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `daleel_ai`;

-- Désactiver temporairement les clés étrangères pour éviter les conflits de création
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist
DROP TABLE IF EXISTS `clicks_logs`;
DROP TABLE IF EXISTS `moderation_logs`;
DROP TABLE IF EXISTS `submission_attempts`;
DROP TABLE IF EXISTS `chatbot_messages`;
DROP TABLE IF EXISTS `chatbot_conversations`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `tool_languages`;
DROP TABLE IF EXISTS `tool_pricing`;
DROP TABLE IF EXISTS `tool_categories`;
DROP TABLE IF EXISTS `ai_tools`;
DROP TABLE IF EXISTS `languages`;
DROP TABLE IF EXISTS `pricing_models`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

-- 1. Table `roles`
CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table `users`
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table `categories`
CREATE TABLE `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `icon` VARCHAR(50) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table `pricing_models`
CREATE TABLE `pricing_models` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table `languages`
CREATE TABLE `languages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(10) NOT NULL UNIQUE,
    `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table `ai_tools`
CREATE TABLE `ai_tools` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `slug` VARCHAR(100) NOT NULL UNIQUE,
    `short_description` VARCHAR(255) NOT NULL,
    `long_description` TEXT NOT NULL,
    `website_url` VARCHAR(255) NOT NULL,
    `trial_url` VARCHAR(255) NULL,
    `logo_url` VARCHAR(255) NULL,
    `gdpr_compliant` TINYINT(1) DEFAULT 0,
    `has_api` TINYINT(1) DEFAULT 0,
    `has_mobile_app` TINYINT(1) DEFAULT 0,
    `status` ENUM('pending', 'approved', 'rejected', 'processing') DEFAULT 'pending',
    `submitted_by` INT NULL,
    `average_rating` DECIMAL(3,2) DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tool_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table `tool_categories`
CREATE TABLE `tool_categories` (
    `tool_id` INT NOT NULL,
    `category_id` INT NOT NULL,
    PRIMARY KEY (`tool_id`, `category_id`),
    CONSTRAINT `fk_tc_tool` FOREIGN KEY (`tool_id`) REFERENCES `ai_tools` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tc_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Table `tool_pricing`
CREATE TABLE `tool_pricing` (
    `tool_id` INT NOT NULL,
    `pricing_id` INT NOT NULL,
    PRIMARY KEY (`tool_id`, `pricing_id`),
    CONSTRAINT `fk_tp_tool` FOREIGN KEY (`tool_id`) REFERENCES `ai_tools` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tp_pricing` FOREIGN KEY (`pricing_id`) REFERENCES `pricing_models` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Table `tool_languages`
CREATE TABLE `tool_languages` (
    `tool_id` INT NOT NULL,
    `language_id` INT NOT NULL,
    PRIMARY KEY (`tool_id`, `language_id`),
    CONSTRAINT `fk_tl_tool` FOREIGN KEY (`tool_id`) REFERENCES `ai_tools` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tl_language` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Table `favorites`
CREATE TABLE `favorites` (
    `user_id` INT NOT NULL,
    `tool_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `tool_id`),
    CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fav_tool` FOREIGN KEY (`tool_id`) REFERENCES `ai_tools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Table `notifications`
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `tool_id` INT NULL,
    `type` ENUM('submission_status', 'system', 'admin_message') NOT NULL DEFAULT 'submission_status',
    `message` TEXT NOT NULL,
    `status` ENUM('unread', 'read') NOT NULL DEFAULT 'unread',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notification_tool` FOREIGN KEY (`tool_id`) REFERENCES `ai_tools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Table `reviews`
CREATE TABLE `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `tool_id` INT NOT NULL,
    `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `comment` TEXT NOT NULL,
    `status` ENUM('approved', 'flagged', 'hidden') DEFAULT 'approved',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_review_tool` FOREIGN KEY (`tool_id`) REFERENCES `ai_tools` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Table `chatbot_conversations`
CREATE TABLE `chatbot_conversations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Table `chatbot_messages`
CREATE TABLE `chatbot_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `conversation_id` INT NOT NULL,
    `sender` ENUM('user', 'assistant') NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_msg_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chatbot_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Table `moderation_logs`
CREATE TABLE `moderation_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `admin_id` INT NOT NULL,
    `target_type` ENUM('tool', 'review') NOT NULL,
    `target_id` INT NOT NULL,
    `action` ENUM('approve', 'reject', 'flag', 'hide') NOT NULL,
    `comment` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_mod_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Table `submission_attempts`
-- Compteur local des echecs de validation automatique des soumissions.
CREATE TABLE `submission_attempts` (
    `attempt_key` CHAR(32) PRIMARY KEY,
    `user_id` INT NOT NULL,
    `website_url` VARCHAR(255) NOT NULL,
    `tool_name` VARCHAR(100) NOT NULL,
    `attempts_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `last_error` VARCHAR(500) NULL,
    `rejected_until` DATETIME NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_submission_attempts_user` (`user_id`),
    INDEX `idx_submission_attempts_rejected_until` (`rejected_until`),
    CONSTRAINT `fk_submission_attempt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Table `clicks_logs`
CREATE TABLE `clicks_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tool_id` INT NOT NULL,
    `user_id` INT NULL,
    `action_type` ENUM('click', 'trial_click') DEFAULT 'click',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_click_tool` FOREIGN KEY (`tool_id`) REFERENCES `ai_tools` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_click_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Réactiver le contrôle des clés étrangères
SET FOREIGN_KEY_CHECKS = 1;


-- =====================================================================
-- SEED DATA INSERTION (JEU DE DONNÉES DÉMO)
-- =====================================================================

-- Insertion des Rôles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'Administrateur', 'Accès complet au back-office, CRUD d\'outils et modération'),
(2, 'Utilisateur Inscrit', 'Accès aux favoris, avis, chatbot et soumissions d\'outils');

-- Insertion des Utilisateurs
-- Le mot de passe haché ci-dessous correspond à "password123" (généré via bcrypt $2y$10$...)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role_id`) VALUES
(1, 'admin_daleel', 'admin@daleel.ai', '$2y$10$x24eZ69gfByNrhnLf9JuVOZn0fn5oNnlawdvMS9j861ql2c5M0bnG', 1),
(2, 'yassine_student', 'yassine@univ.ma', '$2y$10$x24eZ69gfByNrhnLf9JuVOZn0fn5oNnlawdvMS9j861ql2c5M0bnG', 2),
(3, 'academic_user', 'academic@daleel.ai', '$2y$10$x24eZ69gfByNrhnLf9JuVOZn0fn5oNnlawdvMS9j861ql2c5M0bnG', 2);

-- Insertion des Catégories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `icon`) VALUES
(1, 'Traitement du Langage Naturel', 'nlp', 'Génération de texte, traduction, résumé et assistants conversationnels.', 'MessageSquare'),
(2, 'Vision par Ordinateur', 'computer-vision', 'Génération d\'images, édition de vidéos, détection d\'objets et design.', 'Image'),
(3, 'Développement & Code', 'development', 'Génération de code, complétion automatique et assistants de programmation.', 'Code'),
(4, 'Productivité & Recherche', 'productivity', 'Prise de note intelligente, automatisation et organisation du travail.', 'Cpu'),
(5, 'Audio & Synthèse Vocale', 'audio', 'Clonage de voix, transcription audio et création musicale par IA.', 'Music');

-- Insertion des Modèles Économiques (Pricing Models)
INSERT INTO `pricing_models` (`id`, `name`, `description`) VALUES
(1, 'Gratuit', 'Accès libre et sans frais à l\'intégralité ou la majeure partie des fonctionnalités.'),
(2, 'Freemium', 'Gratuit pour les fonctionnalités de base, option payante pour aller plus loin.'),
(3, 'Payant', 'Nécessite obligatoirement un abonnement ou achat de crédits dès le départ.'),
(4, 'Essai Gratuit', 'Offre une période d\'essai gratuite complète avant obligation de paiement.');

-- Insertion des Langues
INSERT INTO `languages` (`id`, `code`, `name`) VALUES
(1, 'fr', 'Français'),
(2, 'en', 'Anglais'),
(3, 'ar', 'Arabe'),
(4, 'es', 'Espagnol');

-- Insertion des Outils d'IA (ai_tools)
-- Données réelles pour rendre l'expérience riche et concrète
INSERT INTO `ai_tools` (`id`, `name`, `slug`, `short_description`, `long_description`, `website_url`, `trial_url`, `logo_url`, `gdpr_compliant`, `has_api`, `has_mobile_app`, `status`, `submitted_by`, `average_rating`) VALUES
(1, 'ChatGPT', 'chatgpt', 'L\'agent conversationnel pionnier développé par OpenAI.', 'ChatGPT est un modèle linguistique de pointe conçu pour converser, générer des textes créatifs, écrire et déboguer du code, et répondre de façon structurée à toutes vos questions académiques et professionnelles.', 'https://chatgpt.com', 'https://chatgpt.com', 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', 1, 1, 1, 'approved', 1, 4.67),
(2, 'Midjourney', 'midjourney', 'Générateur d\'images artistiques à partir de prompts textuels.', 'Midjourney est un laboratoire de recherche indépendant qui produit un outil d\'intelligence artificielle propriétaire permettant de générer des images extrêmement détaillées et artistiques à partir de descriptions textuelles.', 'https://www.midjourney.com', 'https://www.midjourney.com', 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Midjourney_Emblem.png', 0, 0, 0, 'approved', 1, 4.50),
(3, 'Claude AI', 'claude-ai', 'L\'assistant IA hautement éthique avec une immense fenêtre contextuelle.', 'Claude est une IA de nouvelle génération conçue par Anthropic, axée sur la sécurité, l\'analyse approfondie de documents complexes, la rédaction de résumés académiques et le codage avancé.', 'https://claude.ai', 'https://claude.ai', 'https://cdn.brandfetch.io/idw4e7O863/theme/dark/logo.svg', 1, 1, 1, 'approved', 1, 4.80),
(4, 'DeepL', 'deepl', 'Traducteur automatique d\'une précision exceptionnelle basé sur les réseaux neuronaux.', 'DeepL est le traducteur automatique le plus précis au monde. Il utilise des réseaux de neurones convolutionnels avancés pour traduire des textes académiques et des documents entiers dans plus de 30 langues.', 'https://www.deepl.com', 'https://www.deepl.com/translator', 'https://upload.wikimedia.org/wikipedia/commons/e/e0/DeepL_Logo.svg', 1, 1, 1, 'approved', 2, 4.90),
(5, 'GitHub Copilot', 'github-copilot', 'Votre copilote de programmation intégré directement à votre éditeur.', 'GitHub Copilot utilise l\'IA OpenAI Codex pour suggérer du code en temps réel directement dans votre IDE. Il comprend le contexte de votre projet pour générer des lignes, des fonctions ou des tests unitaires complets.', 'https://github.com/features/copilot', 'https://github.com/features/copilot', 'https://upload.wikimedia.org/wikipedia/commons/9/90/Octicons-mark-github.svg', 1, 1, 0, 'approved', 2, 4.35),
(6, 'Suno AI', 'suno-ai', 'Générateur de musique réaliste et complète à partir d\'idées textuelles.', 'Suno AI permet à n\'importe qui de générer des chansons complètes comprenant la voix, l\'instrumentation et les paroles en quelques secondes à partir d\'une simple description en langage naturel.', 'https://suno.com', 'https://suno.com', 'https://cdn.brandfetch.io/idsiJpLq9H/theme/dark/logo.svg', 1, 0, 0, 'approved', 3, 4.00),
(7, 'Jasper AI', 'jasper-ai', 'Plateforme de création de contenu optimisée pour le marketing et l\'académique.', 'Jasper est un outil de rédaction assisté par IA qui aide à rédiger des articles de blog, des e-mails marketing et des synthèses de recherche en adaptant le ton de voix aux besoins spécifiques de l\'utilisateur.', 'https://www.jasper.ai', 'https://www.jasper.ai/free-trial', 'https://cdn.brandfetch.io/id2Jj2ZzC2/theme/dark/logo.svg', 1, 1, 0, 'approved', 3, 3.80),
-- Outil en attente de soumission pour tester la validation admin
(8, 'v0 by Vercel', 'v0-by-vercel', 'Générateur d\'interfaces React/HTML interactives à partir de simples prompts.', 'v0 est un système d\'IA générative développé par Vercel qui produit du code de composants UI prêt pour la production (React, Tailwind CSS, shadcn/ui) à partir d\'instructions textuelles.', 'https://v0.dev', 'https://v0.dev', 'https://cdn.brandfetch.io/idx73H8XoK/theme/dark/logo.svg', 1, 0, 0, 'pending', 2, 0.00);

-- Table associative Outils <-> Catégories (`tool_categories`)
INSERT INTO `tool_categories` (`tool_id`, `category_id`) VALUES
(1, 1), -- ChatGPT -> NLP
(1, 4), -- ChatGPT -> Productivité
(2, 2), -- Midjourney -> Vision
(3, 1), -- Claude AI -> NLP
(3, 4), -- Claude AI -> Productivité
(4, 1), -- DeepL -> NLP
(5, 3), -- GitHub Copilot -> Code
(6, 5), -- Suno AI -> Audio
(7, 1), -- Jasper AI -> NLP
(8, 3); -- v0 -> Code

-- Table associative Outils <-> Modèles Économiques (`tool_pricing`)
INSERT INTO `tool_pricing` (`tool_id`, `pricing_id`) VALUES
(1, 2), -- ChatGPT -> Freemium
(2, 3), -- Midjourney -> Payant
(3, 2), -- Claude AI -> Freemium
(4, 2), -- DeepL -> Freemium
(5, 4), -- GitHub Copilot -> Essai Gratuit
(6, 2), -- Suno AI -> Freemium
(7, 4), -- Jasper AI -> Essai Gratuit
(8, 2); -- v0 -> Freemium

-- Table associative Outils <-> Langues (`tool_languages`)
INSERT INTO `tool_languages` (`tool_id`, `language_id`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), -- ChatGPT -> fr, en, ar, es
(2, 2),                         -- Midjourney -> en
(3, 1), (3, 2), (3, 4),         -- Claude AI -> fr, en, es
(4, 1), (4, 2), (4, 4),         -- DeepL -> fr, en, es
(5, 2),                         -- GitHub Copilot -> en
(6, 1), (6, 2),                 -- Suno AI -> fr, en
(7, 1), (7, 2), (7, 4),         -- Jasper AI -> fr, en, es
(8, 2);                         -- v0 -> en

-- Insertion des Favoris de démo
INSERT INTO `favorites` (`user_id`, `tool_id`) VALUES
(2, 1), -- yassine aime ChatGPT
(2, 3), -- yassine aime Claude AI
(2, 4), -- yassine aime DeepL
(3, 3), -- academic_user aime Claude AI
(3, 5); -- academic_user aime Copilot

-- Insertion des Avis de démo
INSERT INTO `reviews` (`user_id`, `tool_id`, `rating`, `comment`, `status`) VALUES
(2, 1, 5, 'Incroyablement utile pour structurer mon plan de mémoire universitaire. Répond instantanément !', 'approved'),
(3, 1, 4, 'Un très bon assistant d\'écriture, bien qu\'il faille parfois vérifier la véracité des références citées.', 'approved'),
(2, 3, 5, 'Claude est excellent pour résumer mes PDF de recherche scientifique. Son ton est très naturel et rigoureux.', 'approved'),
(2, 4, 5, 'La traduction la plus naturelle possible. Idéal pour traduire mes articles du français vers l\'anglais académique.', 'approved'),
(3, 5, 4, 'Un gain de temps indéniable au quotidien pour le codage de mes simulations mathématiques.', 'approved'),
(3, 2, 4, 'Superbes visuels pour mes présentations scolaires, mais la prise en main via Discord est parfois déroutante.', 'approved'),
(2, 6, 4, 'Génération musicale bluffante, génial pour créer des ambiances sonores de fond.', 'approved'),
(3, 7, 3, 'Outil correct pour le copywriting, mais un peu cher pour des étudiants après la période d\'essai.', 'approved');

-- Insertion de l'historique du Chatbot de démo
INSERT INTO `chatbot_conversations` (`id`, `user_id`, `title`) VALUES
(1, 2, 'Recherche d\'outil NLP gratuit');

INSERT INTO `chatbot_messages` (`conversation_id`, `sender`, `message`) VALUES
(1, 'user', 'Bonjour, je cherche un outil gratuit ou freemium qui m\'aide à traduire mes devoirs de recherche en anglais avec une grande précision.'),
(1, 'assistant', 'Bonjour Yassine ! Pour votre besoin de traduction académique de haute précision, je vous recommande vivement **DeepL**. C\'est un outil freemium disponible en Français et en Anglais qui utilise des réseaux neuronaux avancés. Vous pouvez aussi consulter **ChatGPT** ou **Claude AI** pour reformuler le texte traduit.');

-- Insertion des Logs de modération de démo
INSERT INTO `moderation_logs` (`admin_id`, `target_type`, `target_id`, `action`, `comment`) VALUES
(1, 'tool', 1, 'approve', 'Outil ChatGPT validé automatiquement pour le lancement de la plateforme.'),
(1, 'tool', 4, 'approve', 'Validation de la soumission de DeepL proposée par yassine_student.');

-- Insertion des Clics de popularité (Clicks Logs)
INSERT INTO `clicks_logs` (`tool_id`, `user_id`, `action_type`, `created_at`) VALUES
-- ChatGPT a bcp de clics
(1, 2, 'click', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 3, 'click', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, NULL, 'click', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 2, 'trial_click', DATE_SUB(NOW(), INTERVAL 1 DAY)),
-- Claude AI est populaire
(3, 2, 'click', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(3, 3, 'click', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, NULL, 'click', DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- DeepL a des clics
(4, 2, 'click', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
(4, NULL, 'trial_click', DATE_SUB(NOW(), INTERVAL 1 DAY)),
-- Copilot
(5, 3, 'click', DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- Suno
(6, NULL, 'click', DATE_SUB(NOW(), INTERVAL 5 DAY));
