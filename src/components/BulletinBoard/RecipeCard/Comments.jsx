// src/components/Home/Spotlight/RecipeCard/Comments.jsx
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

const CommentsContainer = styled.div`
  padding: 12px;
  font-family: 'Courier New', monospace;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 400px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(210, 190, 150, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(166, 124, 82, 0.5);
    border-radius: 3px;
  }
`;

const CommentsHeader = styled.h4`
  font-size: 14px;
  color: #59483b;
  margin: 0 0 8px 0;
  font-weight: bold;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 4px 8px;
  border: 1px solid ${props => props.$active ? '#b38c42' : 'rgba(200, 180, 120, 0.5)'};
  background: ${props => props.$active ? '#b38c42' : 'rgba(255, 254, 245, 0.5)'};
  color: ${props => props.$active ? '#fff' : '#8a7248'};
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#a67c37' : 'rgba(200, 180, 120, 0.2)'};
    border-color: #b38c42;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid rgba(200, 180, 120, 0.5);
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #59483b;
  background: rgba(255, 254, 245, 0.8);
  margin-bottom: 8px;
  
  &:focus {
    outline: none;
    border-color: #b38c42;
  }
  
  &::placeholder {
    color: #a09080;
  }
`;

const CommentsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const Comment = styled.div`
  background: rgba(245, 240, 220, 0.5);
  padding: 8px;
  border-radius: 4px;
  border: 1px solid rgba(200, 180, 120, 0.3);
  animation: ${props => props.$isNew ? 'fadeIn 0.3s ease' : 'none'};
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CommentAuthor = styled.div`
  font-size: 11px;
  font-weight: bold;
  color: #8a7248;
  margin-bottom: 4px;
`;

const CommentText = styled.div`
  font-size: 12px;
  color: #59483b;
  line-height: 1.4;
`;

const CommentTime = styled.div`
  font-size: 10px;
  color: #a09080;
  margin-top: 4px;
  font-style: italic;
`;

const NoComments = styled.div`
  font-size: 12px;
  color: #8a7248;
  font-style: italic;
  padding: 12px 0;
  text-align: center;
`;

const CommentForm = styled.form`
  border-top: 1px solid rgba(200, 180, 120, 0.3);
  padding-top: 12px;
  margin-top: auto;
`;

const CommentInput = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(200, 180, 120, 0.5);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #59483b;
  background: rgba(255, 254, 245, 0.8);
  resize: none;
  min-height: 60px;
  
  &:focus {
    outline: none;
    border-color: #b38c42;
  }
  
  &::placeholder {
    color: #a09080;
  }
`;

const SubmitButton = styled.button`
  background: #b38c42;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: #a67c37;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const CommentCounter = styled.div`
  font-size: 10px;
  color: #8a7248;
  text-align: right;
  margin-bottom: 4px;
`;

const Comments = ({ comments, onAddComment, recipeTitle }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, today, week, month
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest
  const [searchQuery, setSearchQuery] = useState('');
  const [newCommentIds, setNewCommentIds] = useState(new Set());
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedComment = newComment.trim();
    if (!trimmedComment) return;
    
    setIsSubmitting(true);
    
    // Generate anonymous username
    const adjectives = ['Happy', 'Hungry', 'Curious', 'Friendly', 'Creative', 'Eager', 'Jolly', 'Clever'];
    const nouns = ['Chef', 'Baker', 'Foodie', 'Cook', 'Gourmet', 'Taster', 'Critic', 'Artist'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 100);
    const username = `${randomAdjective}${randomNoun}${randomNumber}`;
    
    const comment = {
      id: Date.now(),
      author: username,
      text: trimmedComment,
      timestamp: new Date().toISOString()
    };
    
    onAddComment(comment);
    setNewComment('');
    
    // Track new comment for animation
    setNewCommentIds(prev => new Set([...prev, comment.id]));
    setTimeout(() => {
      setNewCommentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(comment.id);
        return newSet;
      });
    }, 500);
    
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 300);
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  // Filter and sort comments
  const filteredAndSortedComments = useMemo(() => {
    let filtered = [...comments];
    
    // Apply time filter
    const now = new Date();
    if (filterType === 'today') {
      filtered = filtered.filter(comment => {
        const commentDate = new Date(comment.timestamp);
        return commentDate.toDateString() === now.toDateString();
      });
    } else if (filterType === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(comment => {
        const commentDate = new Date(comment.timestamp);
        return commentDate >= weekAgo;
      });
    } else if (filterType === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(comment => {
        const commentDate = new Date(comment.timestamp);
        return commentDate >= monthAgo;
      });
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comment => 
        comment.text.toLowerCase().includes(query) ||
        comment.author.toLowerCase().includes(query)
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  }, [comments, filterType, sortOrder, searchQuery]);
  
  return (
    <CommentsContainer>
      <CommentsHeader>Community Comments</CommentsHeader>
      
      <SearchInput
        type="text"
        placeholder="Search comments..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <FilterContainer>
        <FilterButton
          $active={filterType === 'all'}
          onClick={() => setFilterType('all')}
        >
          All Time
        </FilterButton>
        <FilterButton
          $active={filterType === 'today'}
          onClick={() => setFilterType('today')}
        >
          Today
        </FilterButton>
        <FilterButton
          $active={filterType === 'week'}
          onClick={() => setFilterType('week')}
        >
          This Week
        </FilterButton>
        <FilterButton
          $active={filterType === 'month'}
          onClick={() => setFilterType('month')}
        >
          This Month
        </FilterButton>
        <FilterButton
          $active={sortOrder === 'newest'}
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
        >
          {sortOrder === 'newest' ? '↓ Newest' : '↑ Oldest'}
        </FilterButton>
      </FilterContainer>
      
      <CommentCounter>
        {filteredAndSortedComments.length} of {comments.length} comments
      </CommentCounter>
      
      {filteredAndSortedComments.length === 0 ? (
        <NoComments>
          {comments.length === 0 
            ? 'Be the first to comment on this recipe!' 
            : 'No comments match your filters.'}
        </NoComments>
      ) : (
        <CommentsList>
          {filteredAndSortedComments.map(comment => (
            <Comment 
              key={comment.id} 
              $isNew={newCommentIds.has(comment.id)}
            >
              <CommentAuthor>{comment.author}</CommentAuthor>
              <CommentText>{comment.text}</CommentText>
              <CommentTime>{formatTime(comment.timestamp)}</CommentTime>
            </Comment>
          ))}
        </CommentsList>
      )}
      
      <CommentForm onSubmit={handleSubmit}>
        <CommentInput
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={`Share your thoughts about ${recipeTitle}...`}
          maxLength={200}
          disabled={isSubmitting}
        />
        <SubmitButton type="submit" disabled={!newComment.trim() || isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </SubmitButton>
      </CommentForm>
    </CommentsContainer>
  );
};

export default Comments;