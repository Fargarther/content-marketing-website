export const recipeTrayCategories = [
  { key: 'breads', label: 'Breads' },
  { key: 'salads', label: 'Salads' },
  { key: 'soups', label: 'Soups' },
  { key: 'sweets', label: 'Sweets' },
  { key: 'savory', label: 'Savory' }
];

export const recipeTrayData = [
  {
    id: 'breads-architectural-00',
    title: 'Focaccia',
    category: 'Breads',
    time: '24-48 hr',
    text: 'Defined crumb, crisp base, and supple interior built for toppings.',
    image: 'https://images.unsplash.com/photo-1711805064484-a77096f599a6?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['vegan', 'dairy-free'],
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
      'Autolyse flours and potato flakes with 345 g water for 30-45 minutes.',
      'Add yeast and remaining water, then rest 10 minutes.',
      'Add salt and olive oil, then perform 3 coil folds over 90 minutes.',
      'Cold ferment 24-48 hours, then pan, proof, dimple, and bake at 450 F.'
    ]
  },
  {
    id: 'breads-sourdough-pan-01',
    title: 'Sourdough Pan Loaf',
    category: 'Breads',
    time: '12 hr',
    text: 'Crackly crust and soft crumb sized for sandwiches.',
    image: 'https://images.unsplash.com/photo-1620921592619-652411a0d01a?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['vegan', 'dairy-free'],
    ingredients: [
      '350 g bread flour',
      '100 g whole wheat flour',
      '300 g water',
      '80 g active starter',
      '9 g fine salt',
      '10 g olive oil'
    ],
    instructions: [
      'Mix flours, water, starter, and oil until shaggy; rest 30 minutes.',
      'Add salt and perform 3 stretch-and-folds over 90 minutes.',
      'Bulk ferment until 60-70% risen, about 4-6 hours at room temp.',
      'Shape and place in a greased pan; proof 2-3 hours until domed.',
      'Bake at 425 F for 35-40 minutes, tenting if needed.'
    ]
  },
  {
    id: 'breads-seeded-rye-02',
    title: 'Seeded Rye Crackers',
    category: 'Breads',
    time: '1 hr',
    text: 'Thin, snappy rye crackers with sesame and caraway.',
    image: 'https://plus.unsplash.com/premium_photo-1726001349369-4c09003fcd2e?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['vegan', 'dairy-free'],
    ingredients: [
      '120 g rye flour',
      '40 g all-purpose flour',
      '20 g sesame seeds',
      '1 tsp caraway seeds',
      '1/2 tsp flaky salt',
      '2 Tbsp olive oil',
      '80 g water'
    ],
    instructions: [
      'Mix dry ingredients, then stir in oil and water to form a stiff dough.',
      'Rest dough 15 minutes, then roll between parchment until very thin.',
      'Transfer to a sheet, dock with a fork, and sprinkle extra salt.',
      'Bake at 375 F for 15-18 minutes until crisp and browned.'
    ]
  },
  {
    id: 'salads-citrus-kale-00',
    title: 'Citrus Kale Crunch',
    category: 'Salads',
    time: '20 min',
    text: 'Bright kale, oranges, and pepitas with lemon vinaigrette.',
    image: 'https://plus.unsplash.com/premium_photo-1700676963593-f49ac2365498?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['vegan', 'gluten-free'],
    ingredients: [
      '1 bunch lacinato kale, thinly sliced',
      '1 orange, segmented',
      '1/3 cup toasted pepitas',
      '1/4 cup shaved fennel',
      '2 Tbsp olive oil',
      '1 Tbsp lemon juice',
      '1 tsp maple syrup',
      'pinch of salt'
    ],
    instructions: [
      'Massage kale with a pinch of salt and 1 Tbsp olive oil for 1-2 minutes.',
      'Whisk remaining olive oil, lemon juice, and maple syrup for dressing.',
      'Toss kale with fennel and oranges, then drizzle with dressing.',
      'Finish with pepitas and a final squeeze of citrus.'
    ]
  },
  {
    id: 'salads-farro-beet-01',
    title: 'Warm Farro Beet Salad',
    category: 'Salads',
    time: '45 min',
    text: 'Chewy farro, roasted beets, and goat cheese with herbs.',
    image: 'https://images.unsplash.com/photo-1653107510942-65c40093b90f?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['vegetarian'],
    ingredients: [
      '1 cup farro',
      '2 medium beets',
      '2 oz goat cheese',
      '2 Tbsp chopped parsley',
      '2 Tbsp olive oil',
      '1 Tbsp red wine vinegar',
      '1 tsp Dijon mustard',
      'salt and pepper'
    ],
    instructions: [
      'Roast beets at 400 F for 35-40 minutes, then peel and dice.',
      'Simmer farro in salted water for 25-30 minutes; drain.',
      'Whisk olive oil, vinegar, mustard, salt, and pepper for dressing.',
      'Toss warm farro with beets, dressing, parsley, and goat cheese.'
    ]
  },
  {
    id: 'soups-smoky-tomato-00',
    title: 'Smoky Tomato Bisque',
    category: 'Soups',
    time: '50 min',
    text: 'Roasted tomatoes blended with basil and a touch of cream.',
    image: 'https://images.unsplash.com/photo-1673646961345-045592136147?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['vegetarian', 'gluten-free'],
    ingredients: [
      '2 lb ripe tomatoes, halved',
      '1 yellow onion, sliced',
      '3 cloves garlic',
      '2 Tbsp olive oil',
      '2 cups vegetable stock',
      '1/4 cup heavy cream',
      '1 tsp smoked paprika',
      'handful of basil',
      'salt and pepper'
    ],
    instructions: [
      'Roast tomatoes, onion, and garlic at 425 F for 25 minutes.',
      'Blend roasted vegetables with stock and smoked paprika until smooth.',
      'Simmer 10 minutes, then stir in cream and basil.',
      'Season with salt and pepper before serving.'
    ]
  },
  {
    id: 'soups-ginger-lentil-01',
    title: 'Ginger Lentil Soup',
    category: 'Soups',
    time: '1 hr',
    text: 'Red lentils, ginger, and coconut for a cozy vegan bowl.',
    image: 'https://images.unsplash.com/photo-1648455320791-a667c8aab7e4?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['vegan', 'gluten-free'],
    ingredients: [
      '1 cup red lentils',
      '1 Tbsp grated ginger',
      '1 Tbsp tomato paste',
      '1 carrot, diced',
      '1 celery stalk, diced',
      '1 Tbsp curry powder',
      '3 cups vegetable stock',
      '1 cup coconut milk',
      '1 Tbsp lime juice'
    ],
    instructions: [
      'Saute carrot, celery, and ginger until softened.',
      'Stir in curry powder and tomato paste for 1 minute.',
      'Add lentils and stock; simmer 25 minutes until creamy.',
      'Stir in coconut milk and finish with lime juice.'
    ]
  },
  {
    id: 'sweets-olive-oil-citrus-00',
    title: 'Olive Oil Citrus Cake',
    category: 'Sweets',
    time: '1 hr 10 min',
    text: 'Tender crumb with olive oil and a bright citrus glaze.',
    image: 'https://plus.unsplash.com/premium_photo-1716918178946-5922b4e8645d?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['dairy-free'],
    ingredients: [
      '1 1/2 cups all-purpose flour',
      '1 cup sugar',
      '1/2 cup olive oil',
      '3 eggs',
      '1/2 cup orange juice',
      '1 Tbsp orange zest',
      '1 tsp baking powder',
      '1/2 tsp salt',
      '1/2 cup powdered sugar'
    ],
    instructions: [
      'Whisk flour, sugar, baking powder, and salt in a bowl.',
      'Whisk eggs, olive oil, juice, and zest in a second bowl.',
      'Combine wet and dry, then pour into a greased 8-inch pan.',
      'Bake at 350 F for 35-40 minutes until set.',
      'Whisk powdered sugar with 1-2 Tbsp juice and drizzle over cake.'
    ]
  },
  {
    id: 'sweets-maple-pecan-01',
    title: 'Maple Pecan Bars',
    category: 'Sweets',
    time: '45 min',
    text: 'Buttery shortbread base with a maple-pecan topping.',
    image: 'https://images.unsplash.com/photo-1733154507446-d1cd9841c5f7?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['vegetarian'],
    ingredients: [
      '1 cup all-purpose flour',
      '1/3 cup powdered sugar',
      '1/2 cup butter',
      '1 egg',
      '1/2 cup maple syrup',
      '1 cup chopped pecans',
      '1/2 tsp vanilla extract',
      'pinch of salt'
    ],
    instructions: [
      'Mix flour, powdered sugar, salt, and butter; press into a pan.',
      'Bake base at 350 F for 15 minutes.',
      'Whisk egg, maple syrup, vanilla, and pecans; spread over base.',
      'Bake 20-25 minutes until set; cool before slicing.'
    ]
  },
  {
    id: 'savory-miso-salmon-00',
    title: 'Miso-Glazed Salmon',
    category: 'Savory',
    time: '25 min',
    text: 'Sweet-salty miso glaze with a quick broil finish.',
    image: 'https://images.unsplash.com/photo-1684815595429-cf46bff6294f?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['dairy-free', 'gluten-free'],
    ingredients: [
      '4 salmon fillets',
      '2 Tbsp white miso',
      '1 Tbsp tamari',
      '1 Tbsp honey',
      '1 tsp rice vinegar',
      '1 tsp sesame oil',
      'sliced scallions'
    ],
    instructions: [
      'Whisk miso, tamari, honey, vinegar, and sesame oil.',
      'Brush glaze on salmon and rest 10 minutes.',
      'Bake at 425 F for 10-12 minutes.',
      'Broil 1-2 minutes to caramelize, then top with scallions.'
    ]
  },
  {
    id: 'savory-herb-chicken-01',
    title: 'Herb Roasted Chicken Thighs',
    category: 'Savory',
    time: '1 hr',
    text: 'Crisp skin with lemony herbs and pan juices.',
    image: 'https://plus.unsplash.com/premium_photo-1729611735489-fd5de207149e?auto=format&fit=crop&w=400&h=250&q=80',
    dietary: ['dairy-free', 'gluten-free'],
    ingredients: [
      '6 bone-in chicken thighs',
      '1 lemon, sliced',
      '2 Tbsp olive oil',
      '2 tsp minced garlic',
      '1 tsp dried oregano',
      '1 tsp dried thyme',
      '1/2 tsp paprika',
      'salt and pepper'
    ],
    instructions: [
      'Toss chicken with oil, garlic, herbs, paprika, salt, and pepper.',
      'Arrange with lemon slices on a sheet pan.',
      'Roast at 425 F for 35-40 minutes until crisp and cooked through.',
      'Rest 5 minutes before serving.'
    ]
  }
];
