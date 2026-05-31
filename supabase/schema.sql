-- ============================================================
-- IkoBuild Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Projects
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  framework   TEXT DEFAULT 'React',
  prompt      TEXT,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'deployed', 'archived', 'error')),
  slug        TEXT UNIQUE,
  deploy_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status  ON projects(status);
CREATE INDEX idx_projects_slug    ON projects(slug);

-- ============================================================
-- Project Files
-- ============================================================
CREATE TABLE IF NOT EXISTS project_files (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  path        TEXT NOT NULL,
  content     TEXT DEFAULT '',
  type        TEXT DEFAULT 'text',
  size_bytes  INTEGER GENERATED ALWAYS AS (octet_length(content)) STORED,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, path)
);

CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_path       ON project_files(path);

-- ============================================================
-- Project Prompts / Chat History
-- ============================================================
CREATE TABLE IF NOT EXISTS project_prompts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT NOT NULL,
  model       TEXT,
  tokens_used INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_prompts_project_id ON project_prompts(project_id);

-- ============================================================
-- Deployments
-- ============================================================
CREATE TABLE IF NOT EXISTS deployments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT DEFAULT 'ikobuild' CHECK (type IN ('ikobuild', 'zip', 'custom', 'vercel')),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'deployed', 'failed')),
  url         TEXT,
  domain      TEXT,
  ssl_active  BOOLEAN DEFAULT FALSE,
  build_logs  TEXT,
  deployed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_user_id    ON deployments(user_id);

-- ============================================================
-- Project Versions
-- ============================================================
CREATE TABLE IF NOT EXISTS project_versions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  label       TEXT,
  snapshot    JSONB,  -- Full file snapshot
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);

-- ============================================================
-- Templates
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  category    TEXT,
  emoji       TEXT,
  framework   TEXT DEFAULT 'React',
  prompt      TEXT,
  preview_url TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  uses_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed built-in templates
INSERT INTO templates (name, slug, description, category, emoji, framework, prompt) VALUES
  ('School Management', 'school-management', 'Students, attendance, exams, teachers', 'Education', '🏫', 'Full-Stack', 'Build a complete school management system with student registration, attendance tracking, exam management, teacher dashboard, and parent portal.'),
  ('Hospital System', 'hospital-system', 'Patients, doctors, appointments', 'Healthcare', '🏥', 'React', 'Build a hospital management system with patient records, doctor scheduling, appointment booking, and medical history tracking.'),
  ('E-Commerce', 'ecommerce', 'Products, cart, payments', 'Commerce', '🛒', 'Next.js', 'Build a full-featured e-commerce platform with product catalog, shopping cart, Stripe payments, order management, and admin dashboard.'),
  ('CRM Platform', 'crm', 'Leads, contacts, deals', 'Business', '💼', 'React', 'Build a CRM with lead tracking, contact management, deal pipeline, email integration, and analytics dashboard.'),
  ('SACCO Management', 'sacco', 'Members, loans, savings', 'Finance', '🏦', 'Full-Stack', 'Build a SACCO management system with member registration, loan processing, savings tracking, and financial reporting.'),
  ('Church Management', 'church', 'Members, events, tithes', 'Non-profit', '⛪', 'React', 'Build a church management system with member database, event planning, tithe tracking, and communication tools.'),
  ('Inventory System', 'inventory', 'Stock, orders, suppliers', 'Operations', '📦', 'React', 'Build an inventory management system with stock tracking, purchase orders, supplier management, and reporting.'),
  ('Task Manager', 'task-manager', 'Projects, tasks, teams', 'Productivity', '✅', 'React', 'Build a project management tool like Trello with boards, tasks, team assignments, deadlines, and progress tracking.'),
  ('Blog Platform', 'blog', 'Posts, comments, SEO', 'Content', '📝', 'Next.js', 'Build a blog platform with post editor, categories, comments, SEO optimization, and newsletter subscription.'),
  ('Portfolio Builder', 'portfolio', 'Projects, skills, contact', 'Personal', '🎨', 'React', 'Build a stunning portfolio website with project showcase, skills section, contact form, and dark/light mode.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan              TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer   TEXT,
  stripe_sub_id     TEXT,
  current_period_end TIMESTAMPTZ,
  projects_limit    INTEGER DEFAULT 3,
  ai_requests_limit INTEGER DEFAULT 50,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Usage Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  action      TEXT NOT NULL, -- 'generate', 'chat', 'deploy', 'download'
  model       TEXT,
  tokens_in   INTEGER DEFAULT 0,
  tokens_out  INTEGER DEFAULT 0,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id    ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs     ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users own their projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Project files policies
CREATE POLICY "Users own project files" ON project_files
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Project prompts policies
CREATE POLICY "Users own project prompts" ON project_prompts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Deployments policies
CREATE POLICY "Users own deployments" ON deployments
  FOR ALL USING (auth.uid() = user_id);

-- Versions policies
CREATE POLICY "Users own project versions" ON project_versions
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Subscriptions policies
CREATE POLICY "Users own their subscription" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users own usage logs" ON usage_logs
  FOR ALL USING (auth.uid() = user_id);

-- Templates are public to read
CREATE POLICY "Templates are public" ON templates
  FOR SELECT USING (is_public = TRUE);

-- ============================================================
-- Triggers: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
