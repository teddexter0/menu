/* eslint-disable react-hooks/purity */
import React, { useState } from 'react';
import { RefreshCw, ShoppingCart, Calendar, Sparkles } from 'lucide-react';

const MenuPlanner = () => {
  const [menus, setMenus] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Food categories with flexibility rules
  const foods = {
    // BREAKFAST ONLY items (eggs is flexible and allowed everywhere)
    breakfastOnly: ['pancakes', 'omelet', 'muffins', 'bacon', 'sausages', 'french toast', 'omena', 'cereal', 'porridge', 'milk'],
    
    // Flexible proteins (can be lunch/dinner, EGGS can be anywhere)
    proteins: {
      fish: { meals: ['lunch', 'dinner'], weight: 1 },
      chicken: { meals: ['lunch', 'dinner'], weight: 1 },
      meat: { meals: ['lunch', 'dinner'], weight: 1 },
      'minced meat': { meals: ['lunch', 'dinner'], weight: 1 },
      meatballs: { meals: ['lunch', 'dinner'], weight: 1 },
      eggs: { meals: ['breakfast', 'lunch', 'dinner'], weight: 1 }, // ONLY flexible item!
    },
    
    legumes: ['beans', 'ndengu', 'lentils', 'peas'],
    carbs: ['rice', 'ugali', 'chapati', 'pasta', 'pilau'],
    vegetables: ['spinach', 'cabbage', 'kales'],
    extras: ['milk', 'fruits', 'maziwa mala'],
  };

  const pickRandom = (array, avoid = []) => {
    const available = array.filter(item => !avoid.slice(-4).includes(item));
    const sourceArray = available.length === 0 ? array : available;
    return sourceArray[Math.floor(Math.random() * sourceArray.length)];
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const generateBreakfast = (used) => {
    const recentBreakfast = used.slice(-6);
    const shouldCombo = Math.random() > 0.4;
    
    if (shouldCombo) {
      const proteins = ['bacon', 'sausages', 'omelet', 'omena'];
      const carbs = ['pancakes', 'french toast', 'muffins'];
      
      const protein = pickRandom(proteins, recentBreakfast);
      const carb = pickRandom(carbs, recentBreakfast);
      
      return {
        items: [protein, carb, 'milk', 'fruits'],
        description: `${capitalize(protein)} with ${carb}`,
      };
    } else {
      const singles = ['cereal', 'porridge', 'pancakes', 'french toast'];
      const main = pickRandom(singles, recentBreakfast);
      
      return {
        items: [main, 'milk', 'fruits'],
        description: `${capitalize(main)} with milk`,
      };
    }
  };

  const generateMeal = (mealType, used) => {
    const recentMeals = used.slice(-8);
    const isLegumeDay = Math.random() > 0.6;
    
    let protein;
    if (isLegumeDay) {
      protein = pickRandom(foods.legumes, recentMeals);
    } else {
      const available = Object.entries(foods.proteins)
        .filter(([, config]) => config.meals.includes(mealType))
        .map(([name]) => name);
      protein = pickRandom(available, recentMeals);
    }
    
    const carb = pickRandom(foods.carbs, recentMeals);
    const veg = pickRandom(foods.vegetables, recentMeals);
    
    const extras = mealType === 'dinner' && Math.random() > 0.7 
      ? ['maziwa mala'] 
      : [];
    
    return {
      items: [protein, carb, veg, ...extras],
      description: `${capitalize(protein)} with ${carb} and ${veg}${extras.length ? ' + maziwa mala' : ''}`,
    };
  };

  const generateShoppingList = (menuList) => {
    const items = {};
    
    menuList.forEach(menu => {
      [...menu.breakfast.items, ...menu.lunch.items, ...menu.dinner.items].forEach(item => {
        items[item] = (items[item] || 0) + 1;
      });
    });

    const list = [
      { category: 'Fresh Daily', items: ['milk', 'fruits', 'vegetables (spinach/cabbage/kales)'] },
      { 
        category: 'Proteins Needed', 
        items: Object.keys(items).filter(i => 
          ['fish', 'chicken', 'meat', 'minced meat', 'meatballs', 'omena', 'eggs'].includes(i)
        ).map(i => `${i} (${items[i]}x)`)
      },
      { 
        category: 'Carbs & Staples', 
        items: Object.keys(items).filter(i => 
          foods.carbs.includes(i) || foods.legumes.includes(i)
        ).map(i => `${i} (${items[i]}x)`)
      },
      {
        category: 'Check Stock',
        items: ['cereal', 'porridge oats', 'bacon', 'sausages', 'maziwa mala']
      }
    ];

    setShoppingList(list);
  };

  const generateMenu = () => {
    const newMenus = [];
    const usedRecently = [...mealHistory];

    for (let day = 0; day < 3; day++) {
      const dayMenu = {
        day: ['Today', 'Tomorrow', 'Day After'][day],
        breakfast: generateBreakfast(usedRecently),
        lunch: generateMeal('lunch', usedRecently),
        dinner: generateMeal('dinner', usedRecently),
      };
      
      newMenus.push(dayMenu);
      
      usedRecently.push(
        ...dayMenu.breakfast.items,
        ...dayMenu.lunch.items,
        ...dayMenu.dinner.items
      );
    }

    setMenus(newMenus);
    setMealHistory(usedRecently.slice(-15));
    generateShoppingList(newMenus);
  };

  const regenerateMeal = (dayIndex, mealType) => {
    const newMenus = [...menus];
    if (mealType === 'breakfast') {
      newMenus[dayIndex].breakfast = generateBreakfast(mealHistory);
    } else {
      newMenus[dayIndex][mealType] = generateMeal(mealType, mealHistory);
    }
    setMenus(newMenus);
    generateShoppingList(newMenus);
  };

  // Initialize on first render
  if (!initialized) {
    setInitialized(true);
    setTimeout(() => generateMenu(), 0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-500" />
            Smart Menu Planner
          </h1>
          <p className="text-gray-600">No more monotonous meals • Household ready</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={generateMenu}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <RefreshCw size={20} />
            Generate New Menu
          </button>
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {menus.map((menu, dayIndex) => (
            <div key={dayIndex} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-800">{menu.day}</h2>
              </div>

              {/* Breakfast */}
              <div className="mb-4 p-4 bg-yellow-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-orange-600">🌅 Breakfast</h3>
                  <button
                    onClick={() => regenerateMeal(dayIndex, 'breakfast')}
                    className="text-gray-500 hover:text-orange-500"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p className="text-gray-700 text-sm">{menu.breakfast.description}</p>
              </div>

              {/* Lunch */}
              <div className="mb-4 p-4 bg-green-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-green-600">☀️ Lunch</h3>
                  <button
                    onClick={() => regenerateMeal(dayIndex, 'lunch')}
                    className="text-gray-500 hover:text-green-500"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p className="text-gray-700 text-sm">{menu.lunch.description}</p>
              </div>

              {/* Dinner */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-blue-600">🌙 Dinner</h3>
                  <button
                    onClick={() => regenerateMeal(dayIndex, 'dinner')}
                    className="text-gray-500 hover:text-blue-500"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p className="text-gray-700 text-sm">{menu.dinner.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Shopping List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="text-green-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Shopping List</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {shoppingList.map((section, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-700 mb-3">{section.category}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-orange-100 rounded-xl p-4 text-center">
          <p className="text-gray-700 text-sm">
            💡 <strong>Daily Shopping Tip:</strong> Buy fresh proteins based on today's menu. Check stock for breakfast staples & legumes weekly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuPlanner;