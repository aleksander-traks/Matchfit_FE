/*
  # Add Performance Indexes

  1. Indexes Added
    - `client_profiles` table
      - Composite index on (training_experience, weight_goal) for similarity searches
      - Index on goals using GIN for array searches
      - Index on created_at for time-based queries
    
    - `match_results` table
      - Composite index on (client_profile_id, match_score DESC) for sorted queries
      - Index on expert_id for reverse lookups
    
    - `experts` table
      - Index on id (already exists as primary key, but ensuring it's optimized)
  
  2. Purpose
    - Speed up cache similarity searches
    - Optimize match result queries with sorting
    - Improve dashboard data retrieval
    - Enable faster expert lookups
*/

-- Index on client_profiles for cache similarity searches
CREATE INDEX IF NOT EXISTS idx_client_profiles_training_experience 
  ON client_profiles(training_experience);

CREATE INDEX IF NOT EXISTS idx_client_profiles_goals 
  ON client_profiles USING GIN(goals);

CREATE INDEX IF NOT EXISTS idx_client_profiles_created_at 
  ON client_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_profiles_weight_goal 
  ON client_profiles(weight_goal);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_client_profiles_training_weight 
  ON client_profiles(training_experience, weight_goal);

-- Optimize match_results queries
CREATE INDEX IF NOT EXISTS idx_match_results_profile_score 
  ON match_results(client_profile_id, match_score DESC);

CREATE INDEX IF NOT EXISTS idx_match_results_expert_id 
  ON match_results(expert_id);

CREATE INDEX IF NOT EXISTS idx_match_results_created_at 
  ON match_results(created_at DESC);

-- Optimize experts table queries
CREATE INDEX IF NOT EXISTS idx_experts_specialization 
  ON experts(specialization);

-- Optimize selected_trainers lookups
CREATE INDEX IF NOT EXISTS idx_selected_trainers_profile_id 
  ON selected_trainers(client_profile_id);

CREATE INDEX IF NOT EXISTS idx_selected_trainers_expert_id 
  ON selected_trainers(expert_id);