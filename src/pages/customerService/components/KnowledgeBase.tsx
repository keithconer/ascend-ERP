// src/pages/customerService/components/KnowledgeBase.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  helpful_count: number;
  not_helpful_count: number;
  is_published: boolean;
  created_at: string;
}

const KnowledgeBase: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const categories = ['All', 'Account', 'Inventory', 'Technical', 'Billing'];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error: any) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (articleId: string, isHelpful: boolean) => {
    try {
      // Record feedback
      await supabase
        .from('article_feedback')
        .insert({
          article_id: articleId,
          customer_id: 'anonymous', // In real app, use actual customer ID
          is_helpful: isHelpful
        });

      // Update article helpful counts
      const article = articles.find(a => a.id === articleId);
      if (article) {
        const updateField = isHelpful ? 'helpful_count' : 'not_helpful_count';
        const newCount = article[updateField] + 1;
        
        await supabase
          .from('kb_articles')
          .update({ [updateField]: newCount })
          .eq('id', articleId);

        // Update local state
        setArticles(articles.map(a => 
          a.id === articleId 
            ? { ...a, [updateField]: newCount }
            : a
        ));
        
        if (selectedArticle?.id === articleId) {
          setSelectedArticle({ ...selectedArticle, [updateField]: newCount });
        }
      }

      toast({
        title: "Thank you!",
        description: "Your feedback has been recorded",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to record feedback",
        variant: "destructive",
      });
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setSelectedArticle(null)}
          className="mb-4"
        >
          ← Back to Articles
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>{selectedArticle.title}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">{selectedArticle.category}</Badge>
              {selectedArticle.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-6">
              <p className="whitespace-pre-wrap">{selectedArticle.content}</p>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Was this article helpful?</h4>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(selectedArticle.id, true)}
                  className="flex items-center gap-1"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes ({selectedArticle.helpful_count})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeedback(selectedArticle.id, false)}
                  className="flex items-center gap-1"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No ({selectedArticle.not_helpful_count})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Knowledge Base</h2>
        <p className="text-muted-foreground">Find answers to common questions and issues</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No articles found. Try adjusting your search or filters.
          </div>
        ) : (
          filteredArticles.map(article => (
            <Card 
              key={article.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">{article.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {article.content}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {article.helpful_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      {article.not_helpful_count}
                    </span>
                  </div>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;