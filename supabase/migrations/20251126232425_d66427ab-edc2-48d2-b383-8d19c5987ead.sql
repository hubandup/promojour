
-- Add campaign_id column to publication_history table
ALTER TABLE public.publication_history
ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_publication_history_campaign_id ON public.publication_history(campaign_id);

-- Create index for campaign + date queries
CREATE INDEX idx_publication_history_campaign_published ON public.publication_history(campaign_id, published_at);
