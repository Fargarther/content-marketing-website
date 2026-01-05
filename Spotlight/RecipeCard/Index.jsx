// src/components/Home/Spotlight/RecipeCard/Index.jsx
import React, { useState, useEffect } from 'react';
import { 
  CardContainer, 
  RecipeCardWrapper, 
  CardSide, 
  FlipIndicator,
  ExpandButton,
  CommentsButton,
  CommentsSection,
  ExpandedContent,
  ExpandedSection,
  PinButton
} from '../styles/RecipeCard.styles';
import CardFront from './CardFront';
import CardBack from './CardBack';
import Comments from './Comments';
import { playFlipSound } from '../utils/helpers';

// Camera icon component
const CameraIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

const RecipeCard = ({
  card,
  position,
  isDragging,
  isNew,
  rating,
  comments,
  isPinned,
  boardWidth,
  onMouseDown,
  onRatingChange,
  onAddComment,
  onExpand,
  onPinToggle,
  onCommentsToggle,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsPosition, setCommentsPosition] = useState('right');
  
  // Calculate if comments should appear on left or right
  useEffect(() => {
    if (showComments && boardWidth) {
      // Card width (325px) + margin (13px) + comments width (280px) + gap (20px) + some buffer
      const totalWidthNeeded = 325 + 13 + 280 + 20 + 50;
      const spaceOnRight = boardWidth - position.x;
      
      if (spaceOnRight < totalWidthNeeded) {
        setCommentsPosition('left');
      } else {
        setCommentsPosition('right');
      }
    }
  }, [showComments, position.x, boardWidth]);
  
  const toggleFlip = (e) => {
    e.stopPropagation();
    playFlipSound();
    setIsFlipped(!isFlipped);
  };
  
  const togglePin = (e) => {
    e.stopPropagation();
    
    // Play pin sound effect
    try {
      const pinSound = new Audio("data:audio/wav;base64,UklGRiQBAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQABAADw/wAACAAIAPj/AAD4/wAA+P8AAAAAAAAAAAAAAAD4/wAA+P8AAPj/AAAAAAAA+P8AAPj/AAD4/wAACAAIABAAEAAQABAAEAAQAAgACAAIAAgACAAIAAgACAAAAAAAAAAAAAAA+P8AAPj/AAD4/wAA+P8AAPj/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
      pinSound.volume = 0.3;
      pinSound.play();
    } catch (e) {
      // Audio not supported
    }
    
    if (onPinToggle) {
      onPinToggle(card.id);
    }
  };
  
  const toggleExpand = (e) => {
    e.stopPropagation();
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    // When expanding, only flip to front if needed (keep comments open)
    if (newExpandedState) {
      setIsFlipped(false);
    }
    // Notify parent component of expansion state change
    if (onExpand) {
      onExpand(newExpandedState);
    }
  };
  
  const toggleComments = (e) => {
    e.stopPropagation();
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    // Notify parent component when comments are toggled
    if (onCommentsToggle) {
      onCommentsToggle(card.id, newShowComments);
    }
  };
  
  const handleAddComment = (comment) => {
    if (onAddComment) {
      onAddComment(comment);
    }
  };
  
  const commentCount = comments?.length || 0;
  
  return (
    <CardContainer
      className={isNew ? 'new-card' : ''}
      $isDragging={isDragging}
      $isExpanded={isExpanded}
      $isPinned={isPinned}
      $showComments={showComments}
      $rotate={card.rotate}
      $x={position.x}
      $y={position.y}
      $zIndex={card.zIndex}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
    >
      <PinButton
        className="pin-button"
        onClick={togglePin}
        $isPinned={isPinned}
        $pinColor={card.pinColor}
        $pinTop={card.pinTop}
        $pinLeft={card.pinLeft}
        title={isPinned ? "Unpin card" : "Pin card in place"}
      />
      
      <ExpandButton 
        className="expand-button"
        onClick={toggleExpand}
        $isExpanded={isExpanded}
        title={isExpanded ? "Collapse card" : "Expand card"}
      >
        {isExpanded ? '▼' : '▶'}
      </ExpandButton>
      
      <CommentsButton
        className="comments-button"
        onClick={toggleComments}
        $hasComments={commentCount > 0}
        title="View/add comments"
      >
        💬 {commentCount > 0 && <span>{commentCount}</span>}
      </CommentsButton>
      
      <RecipeCardWrapper 
        $isFlipped={isFlipped && !isExpanded}
        $isExpanded={isExpanded}
      >
        {!isExpanded ? (
          <>
            <CardSide>
              <CardFront
                title={card.title}
                category={card.category}
                time={card.time}
                text={card.text}
                rating={rating}
                onRatingChange={onRatingChange}
              />
              <FlipIndicator 
                className="flip-indicator" 
                title="View recipe photo"
                onClick={toggleFlip}
              >
                <CameraIcon />
              </FlipIndicator>
            </CardSide>
            
            <CardSide $back>
              <CardBack
                title={card.title}
                image={card.image}
                imageAlt={card.imageAlt}
                category={card.category}
              />
              <FlipIndicator 
                className="flip-indicator"
                title="Back to recipe details"
                onClick={toggleFlip}
              >
                <CameraIcon />
              </FlipIndicator>
            </CardSide>
          </>
        ) : (
          <ExpandedContent>
            <CardFront
              title={card.title}
              category={card.category}
              time={card.time}
              text={card.text}
              rating={rating}
              onRatingChange={onRatingChange}
              expanded
            />
            <ExpandedSection>
              <h4>Ingredients</h4>
              <ul>
                {Array.isArray(card.ingredients) && card.ingredients.map((ingredient, i) => (
                  <li key={i} style={{
                    marginBottom: '4px',
                    fontSize: '14px',
                    paddingLeft: '16px',
                    position: 'relative',
                    fontFamily: 'Courier New, monospace',
                    color: '#59483b'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      color: '#8a7248'
                    }}>•</span>
                    {ingredient}
                  </li>
                ))}
              </ul>
            </ExpandedSection>
            <ExpandedSection>
              <h4>Instructions</h4>
              <ol style={{ paddingLeft: '20px' }}>
                {Array.isArray(card.instructions) && card.instructions.map((step, i) => (
                  <li key={i} style={{
                    marginBottom: '6px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    fontFamily: 'Courier New, monospace',
                    color: '#59483b'
                  }}>
                    {step}
                  </li>
                ))}
              </ol>
            </ExpandedSection>
          </ExpandedContent>
        )}
      </RecipeCardWrapper>
      
      {showComments && (
        <CommentsSection 
          $position={commentsPosition}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <Comments
            comments={comments || []}
            onAddComment={handleAddComment}
            recipeTitle={card.title}
          />
        </CommentsSection>
      )}
    </CardContainer>
  );
};

export default RecipeCard;