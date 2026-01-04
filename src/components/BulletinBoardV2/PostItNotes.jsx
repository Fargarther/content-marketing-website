/**
 * PostItNotes component - Renders draggable post-it note decorations
 */

import React from 'react';
import { PostItWrapper, PostItText } from './styles';

function PostItNotes({ postIts, onPointerDown, onAnimationEnd }) {
  return (
    <>
      {postIts.map(postIt => (
        <PostItWrapper
          key={postIt.id}
          $width={postIt.width}
          $height={postIt.height}
          $color={postIt.color}
          $falling={postIt.falling}
          $throwX={postIt.throwX}
          $throwY={postIt.throwY}
          $spinAmount={postIt.spinAmount}
          $fallDuration={postIt.fallDuration}
          $zIndex={postIt.zIndex || 5}
          style={{
            '--x': `${postIt.x}px`,
            '--y': `${postIt.y}px`,
            '--r': `${postIt.rotate}deg`,
          }}
          onPointerDown={postIt.falling ? undefined : (e) => onPointerDown(e, postIt.id, 'postit')}
          onAnimationEnd={() => {
            if (postIt.falling) {
              onAnimationEnd?.(postIt.id);
            }
          }}
        >
          <PostItText
            $font={postIt.font}
            $style={postIt.style}
            $weight={postIt.weight}
            $fontSize={postIt.fontSize}
            $textRotate={postIt.textRotate}
          >
            {postIt.text}
          </PostItText>
        </PostItWrapper>
      ))}
    </>
  );
}

export default React.memo(PostItNotes);
