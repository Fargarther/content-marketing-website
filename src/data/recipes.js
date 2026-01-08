// src/data/recipes.js
export const recipeData = [
    // Focaccias
    {
      id: 'architectural-00-semolina',
      title: 'Focaccia',
      category: 'Artisan',
      time: '24-48 hr fermentation',
      price: '$24',
      image: 'https://images.unsplash.com/photo-1711805064484-a77096f599a6?auto=format&fit=crop&w=400&h=250&q=80',
      pdf: 'cards/architectural-00-semolina.pdf',
      description: 'Defined crumb, crisp base, supple interior for next-day service.',
      text: 'Designed for toppings and slicing, with a crisp fried base and a soft, structured crumb.',
      servings: '2-4 people',
      ingredients: [
        '425 g 00 flour',
        '60 g fine semolina rimacinata',
        '15 g instant potato flakes',
        '380 g water (hold back 35 g)',
        '2 g instant yeast',
        '10 g fine salt',
        '25 g olive oil (in dough)',
        '4 Tbsp olive oil (pan)'
      ],
      instructions: [
        'Autolyse: mix flours and potato flakes with 345 g water until no dry flour remains. Rest 30-45 minutes.',
        'Add yeast and remaining water: sprinkle yeast, add 35 g water gradually, squeeze and fold. Rest 10 minutes.',
        'Add salt and olive oil: pinch and fold until fully incorporated. Dough should be soft and slightly tacky.',
        'Coil folds: perform 3 folds over 90 minutes, spaced 30 minutes apart.',
        'Cold ferment: cover and refrigerate 24-48 hours.',
        'Pan: oil a 9 x 13 inch dark metal pan, add dough, flip to coat, rest 20 minutes, stretch to corners.',
        'Final proof: rest 90-150 minutes at room temp until swollen and jiggly with bubbles under the surface.',
        'Dimple: heat oven to 450 F / 232 C, oil fingertips, press dimples to near the pan.',
        'Bake 22-26 minutes until deep golden with a crisp base. Cool 10 minutes before cutting.'
      ]
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
