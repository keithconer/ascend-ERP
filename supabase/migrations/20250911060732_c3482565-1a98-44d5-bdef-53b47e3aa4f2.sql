-- Add missing tables for complete Customer Service module

-- Knowledge Base Articles table for Self-Service Portal
CREATE TABLE public.kb_articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SLA Rules table
CREATE TABLE public.sla_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    priority TEXT NOT NULL,
    response_time_hours INTEGER NOT NULL,
    resolution_time_hours INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer Communication History table
CREATE TABLE public.customer_communications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    communication_type TEXT NOT NULL, -- 'email', 'chat', 'phone', 'internal'
    direction TEXT NOT NULL, -- 'inbound', 'outbound'
    subject TEXT,
    content TEXT NOT NULL,
    agent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Article Feedback table
CREATE TABLE public.article_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES public.kb_articles(id) ON DELETE CASCADE,
    customer_id TEXT,
    is_helpful BOOLEAN NOT NULL,
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allowing all operations for now - can be restricted later)
CREATE POLICY "Allow all operations on kb_articles" ON public.kb_articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sla_rules" ON public.sla_rules FOR ALL USING (true) WITH CHECK (true);  
CREATE POLICY "Allow all operations on customer_communications" ON public.customer_communications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on article_feedback" ON public.article_feedback FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_kb_articles_updated_at
    BEFORE UPDATE ON public.kb_articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sla_rules_updated_at
    BEFORE UPDATE ON public.sla_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SLA rules
INSERT INTO public.sla_rules (priority, response_time_hours, resolution_time_hours) VALUES
('Low', 24, 72),
('Medium', 8, 24),
('High', 2, 8);

-- Insert sample knowledge base articles
INSERT INTO public.kb_articles (title, content, category, tags, is_published, created_by) VALUES
('How to reset your password', 'To reset your password, go to the login page and click "Forgot Password"...', 'Account', ARRAY['password', 'login', 'account'], true, 'Admin'),
('Troubleshooting login issues', 'If you are having trouble logging in, please check...', 'Account', ARRAY['login', 'troubleshooting'], true, 'Admin'),
('How to update your profile', 'To update your profile information, navigate to Settings...', 'Account', ARRAY['profile', 'settings'], true, 'Admin'),
('Common inventory questions', 'Here are answers to frequently asked inventory questions...', 'Inventory', ARRAY['inventory', 'stock'], true, 'Admin');