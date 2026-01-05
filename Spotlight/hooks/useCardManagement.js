// src/components/Home/Spotlight/hooks/useCardManagement.js
import { useState, useCallback } from 'react';
import { getRandomRotation, getPinColor } from '../utils/helpers';

const useCardManagement = (recipeData) => {
  const [cards, setCards] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});

  // Initialize cards
  useState(() => {
    if (cards.length === 0 && recipeData.length > 0) {
      const initialCards = recipeData.slice(0, 3).map((recipe, index) => {
        // Use custom text if provided, otherwise use the template
        const detailedText = recipe.text || `${recipe.title} is a delightful ${recipe.category.toLowerCase()} recipe that takes ${recipe.time.toLowerCase()} to prepare. This recipe combines traditional techniques with modern flavors, creating a dish that's both comforting and sophisticated. Perfect for ${recipe.category === 'Main' ? 'dinner parties' : recipe.category === 'Dessert' ? 'special occasions' : 'any meal'}.`;
        
        return {
          id: index + 1,
          recipeId: recipe.id,
          title: recipe.title,
          category: recipe.category,
          time: recipe.time,
          text: detailedText,
          image: recipe.image || '/api/placeholder/300/300',
          imageAlt: `${recipe.title} - finished dish`,
          ingredients: recipe.ingredients || [
            "2 cups all-purpose flour", 
            "1 cup granulated sugar", 
            "1/2 cup unsalted butter", 
            "2 large eggs", 
            "1 cup milk",
            "1 tsp baking powder",
            "1/2 tsp salt",
            "1 tsp vanilla extract"
          ],
          instructions: recipe.instructions || [
            "Preheat oven to 350°F (175°C).",
            "In a large bowl, mix the flour, sugar, baking powder, and salt.",
            "In another bowl, cream the butter until smooth, then add eggs one at a time.",
            "Gradually add the dry ingredients to the wet mixture, alternating with milk.",
            "Add vanilla extract and mix until just combined.",
            "Pour into prepared pan and bake for 25-30 minutes or until a toothpick comes out clean.",
            "Allow to cool before serving."
          ],
          zIndex: index + 1,
          rotate: getRandomRotation(),
          pinColor: getPinColor(),
          pinTop: `${5 + Math.random() * 15}px`,
          pinLeft: `${10 + Math.random() * 80}%`
        };
      });
      
      setCards(initialCards);
      setNextId(initialCards.length + 1);
      
      // Load ratings and comments
      const savedRatings = {};
      const savedComments = {};
      initialCards.forEach(card => {
        const savedRating = localStorage.getItem(`bulletin_rating_${card.recipeId}`);
        savedRatings[card.id] = savedRating ? parseInt(savedRating) : 0;
        
        const savedCommentsData = localStorage.getItem(`bulletin_comments_${card.recipeId}`);
        savedComments[card.id] = savedCommentsData ? JSON.parse(savedCommentsData) : [];
      });
      setRatings(savedRatings);
      setComments(savedComments);
    }
  });

  const handleRating = useCallback((cardId, recipeId, value) => {
    localStorage.setItem(`bulletin_rating_${recipeId}`, value);
    setRatings(prevRatings => ({
      ...prevRatings,
      [cardId]: value
    }));
  }, []);

  const handleAddComment = useCallback((cardId, recipeId, comment) => {
    setComments(prevComments => {
      const cardComments = prevComments[cardId] || [];
      const updatedComments = [...cardComments, comment];
      
      // Save to localStorage
      localStorage.setItem(`bulletin_comments_${recipeId}`, JSON.stringify(updatedComments));
      
      return {
        ...prevComments,
        [cardId]: updatedComments
      };
    });
  }, []);

  const addNewCard = useCallback(() => {
    if (recipeData.length < nextId) return null;
    
    const recipe = recipeData[nextId - 1];
    // Use custom text if provided, otherwise use the template
    const detailedText = recipe.text || `${recipe.title} is a delightful ${recipe.category.toLowerCase()} recipe that takes ${recipe.time.toLowerCase()} to prepare. This recipe combines traditional techniques with modern flavors, creating a dish that's both comforting and sophisticated. Perfect for ${recipe.category === 'Main' ? 'dinner parties' : recipe.category === 'Dessert' ? 'special occasions' : 'any meal'}.`;
    
    const newCard = {
      id: nextId,
      recipeId: recipe.id,
      title: recipe.title,
      category: recipe.category,
      time: recipe.time,
      text: detailedText,
      image: recipe.image || '/api/placeholder/300/300',
      imageAlt: `${recipe.title} - finished dish`,
      ingredients: recipe.ingredients || ["Default ingredients..."],
      instructions: recipe.instructions || ["Default instructions..."],
      zIndex: Math.max(...cards.map(c => c.zIndex), 0) + 1,
      rotate: getRandomRotation(),
      pinColor: getPinColor(),
      pinTop: `${5 + Math.random() * 15}px`,
      pinLeft: `${10 + Math.random() * 80}%`
    };
    
    setCards(prevCards => [...prevCards, newCard]);
    
    const savedRating = localStorage.getItem(`bulletin_rating_${recipe.id}`);
    setRatings(prevRatings => ({
      ...prevRatings,
      [nextId]: savedRating ? parseInt(savedRating) : 0
    }));
    
    const savedComments = localStorage.getItem(`bulletin_comments_${recipe.id}`);
    setComments(prevComments => ({
      ...prevComments,
      [nextId]: savedComments ? JSON.parse(savedComments) : []
    }));
    
    setNextId(prevId => prevId + 1);
    
    return newCard;
  }, [cards, nextId, recipeData]);

  const clearAllCards = useCallback(() => {
    setCards([]);
    setRatings({});
    setComments({});
    setNextId(1);
  }, []);

  const updateCardRotations = useCallback(() => {
    setCards(prevCards => 
      prevCards.map(card => ({
        ...card,
        rotate: getRandomRotation(),
        pinTop: `${5 + Math.random() * 15}px`,
        pinLeft: `${10 + Math.random() * 80}%`
      }))
    );
  }, []);

  const addRecipeFromData = useCallback((recipe) => {
    // Use custom text if provided, otherwise use the template
    const detailedText = recipe.text || `${recipe.title} is a delightful ${recipe.category.toLowerCase()} recipe that takes ${recipe.time.toLowerCase()} to prepare. This recipe combines traditional techniques with modern flavors, creating a dish that's both comforting and sophisticated. Perfect for ${recipe.category === 'Main' ? 'dinner parties' : recipe.category === 'Dessert' ? 'special occasions' : 'any meal'}.`;
    
    const newCard = {
      id: nextId,
      recipeId: recipe.id,
      title: recipe.title,
      category: recipe.category,
      time: recipe.time,
      text: detailedText,
      image: recipe.image || '/api/placeholder/300/300',
      imageAlt: `${recipe.title} - finished dish`,
      ingredients: recipe.ingredients || ["Default ingredients..."],
      instructions: recipe.instructions || ["Default instructions..."],
      zIndex: Math.max(...cards.map(c => c.zIndex), 0) + 1,
      rotate: getRandomRotation(),
      pinColor: getPinColor(),
      pinTop: `${5 + Math.random() * 15}px`,
      pinLeft: `${10 + Math.random() * 80}%`
    };
    
    setCards(prevCards => [...prevCards, newCard]);
    
    const savedRating = localStorage.getItem(`bulletin_rating_${recipe.id}`);
    setRatings(prevRatings => ({
      ...prevRatings,
      [nextId]: savedRating ? parseInt(savedRating) : 0
    }));
    
    const savedComments = localStorage.getItem(`bulletin_comments_${recipe.id}`);
    setComments(prevComments => ({
      ...prevComments,
      [nextId]: savedComments ? JSON.parse(savedComments) : []
    }));
    
    setNextId(prevId => prevId + 1);
    
    return newCard;
  }, [cards, nextId]);

  return {
    cards,
    setCards,
    ratings,
    comments,
    handleRating,
    handleAddComment,
    addNewCard,
    clearAllCards,
    updateCardRotations,
    addRecipeFromData
  };
};

export default useCardManagement;