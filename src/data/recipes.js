// src/data/recipes.js
export const recipeData = [
    // Focaccias
    {
      id: 'classic-rosemary-6',
      title: 'Classic Rosemary & Sea Salt',
      category: 'Personal (6")',
      time: '48 hr fermentation',
      price: '$12',
      image: '/api/placeholder/400/250',
      pdf: 'cards/classic-rosemary.pdf',
      description: 'Our signature focaccia with fresh rosemary',
      text: 'Our most beloved focaccia features fragrant fresh rosemary, coarse sea salt, and our premium olive oil.',
      servings: '1-2 people'
    },
    {
      id: 'garden-herb-8',
      title: 'Garden Herb Medley',
      category: 'Classic (8")',
      time: '48 hr fermentation',
      price: '$18',
      image: '/api/placeholder/400/250',
      pdf: 'cards/garden-herb.pdf',
      text: 'A celebration of fresh herbs from local gardens.',
      servings: '2-4 people'
    },
    {
      id: 'tomato-olive-10',
      title: 'Heirloom Tomato & Olive',
      category: 'Family (10")',
      time: '48 hr fermentation',
      price: '$25',
      image: '/api/placeholder/400/250',
      pdf: 'cards/tomato-olive.pdf',
      text: 'Sweet cherry tomatoes paired with briny Kalamata olives.',
      servings: '4-6 people'
    },
    {
      id: 'harvest-apple-8',
      title: 'Harvest Apple & Caramelized Onion',
      category: 'Seasonal',
      time: '48 hr fermentation',
      price: '$20',
      image: '/api/placeholder/400/250',
      pdf: 'cards/harvest-apple.pdf',
      text: 'A fall favorite featuring local apples and sweet onions.',
      availability: 'September - November',
      servings: '2-4 people'
    },
    {
      id: 'spring-asparagus-10',
      title: 'Spring Asparagus & Lemon',
      category: 'Seasonal',
      time: '48 hr fermentation',
      price: '$28',
      image: '/api/placeholder/400/250',
      pdf: 'cards/spring-asparagus.pdf',
      text: 'Celebrate spring with tender local asparagus and bright lemon.',
      availability: 'April - June',
      servings: '4-6 people'
    },
    {
      id: 'fig-prosciutto-8',
      title: 'Fig, Prosciutto & Arugula',
      category: 'Artisan',
      time: '48 hr fermentation',
      price: '$22',
      image: '/api/placeholder/400/250',
      pdf: 'cards/fig-prosciutto.pdf',
      text: 'An elegant combination of sweet figs and savory prosciutto.',
      servings: '2-4 people'
    },
    {
      id: 'garden-art-custom',
      title: 'Garden Art Focaccia',
      category: 'Custom Art',
      time: '48 hr fermentation',
      price: 'Starting at $35',
      image: '/api/placeholder/400/250',
      pdf: 'cards/garden-art.pdf',
      text: 'Transform your focaccia into edible art with vegetable designs.',
      servings: 'Varies by size'
    },
    {
      id: 'morning-glory-6',
      title: 'Morning Glory',
      category: 'Breakfast',
      time: '48 hr fermentation',
      price: '$14',
      image: '/api/placeholder/400/250',
      pdf: 'cards/morning-glory.pdf',
      text: 'Everything bagel inspired focaccia perfect for breakfast.',
      servings: '1-2 people'
    },
    // Spreads
    {
      id: 'rosemary-hummus',
      title: 'Rosemary White Bean Hummus',
      category: 'Spreads',
      time: '8 oz jar',
      price: '$8',
      image: '/api/placeholder/400/250',
      pdf: 'cards/rosemary-hummus.pdf',
      text: 'Creamy cannellini beans with fresh rosemary from our garden.'
    }
  ];
  
  export const categories = [
    'All',
    'Personal (6")',
    'Classic (8")',
    'Family (10")',
    'Seasonal',
    'Artisan',
    'Custom Art',
    'Breakfast',
    'Spreads'
  ];