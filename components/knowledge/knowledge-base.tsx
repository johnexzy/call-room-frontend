"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Star } from 'lucide-react';
import { apiClient } from "@/lib/api-client";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  helpful: number;
}

export function KnowledgeBase() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [searchQuery, selectedCategory]);

  const loadArticles = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await apiClient.get(`/knowledge-base?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markHelpful = async (articleId: string) => {
    try {
      await apiClient.post(`/knowledge-base/${articleId}/helpful`, {});
      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, helpful: article.helpful + 1 }
          : article
      ));
    } catch (error) {
      console.error('Failed to mark article as helpful:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Knowledge Base
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          >
            Clear
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['General', 'Technical', 'Billing', 'Security', 'Features'].map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(
                selectedCategory === category ? null : category
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{article.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => markHelpful(article.id)}
                  >
                    <Star className="h-4 w-4" />
                    <span>{article.helpful}</span>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {article.content}
                </p>
                <div className="flex flex-wrap gap-1">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-muted rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(article.lastUpdated).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-12 bg-muted rounded mb-2" />
                    <div className="flex gap-1">
                      <div className="h-6 w-16 bg-muted rounded" />
                      <div className="h-6 w-16 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && articles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No articles found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 