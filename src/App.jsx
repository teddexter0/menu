/* eslint-disable react-hooks/purity */
import React, { useState } from 'react';
import { RefreshCw, ShoppingCart, Calendar, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const MenuPlanner = () => {
  const [menus, setMenus] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [planDuration, setPlanDuration] = useState('week'); // 'week' or 'month'
  const [expandedWeeks, setExpandedWeeks] = useState([0]);

  // Food categories with flexibility rules
  const foods = {
    breakfastItems: ['pancakes', 'omelet', 'muffins', 'bacon', 'sausages', 'french toast', 'cereal'],
    breakfastDrinks: ['tea', 'coffee', 'juice', 'milk', 'porridge'], // Porridge IS a beverage!
    
    proteins: {
      fish: { meals: ['lunch', 'dinner'], weight: 1 },
      chicken: { meals: ['lunch', 'dinner'], weight: 1 },
      meat: { meals: ['lunch', 'dinner'], weight: 1 },
      'minced meat': { meals: ['lunch', 'dinner'], weight: 1 },
      meatballs: { meals: ['lunch', 'dinner'], weight: 1 },
      omena: { meals: ['lunch', 'dinner'], weight: 1},
      eggs: { meals: ['breakfast', 'lunch', 'dinner'], weight: 1 },
    },
    
    legumes: ['beans', 'ndengu', 'lentils', 'peas'],
    carbs: ['rice', 'ugali', 'chapati', 'spaghetti', 'pilau'],
    vegetables: ['spinach', 'cabbage', 'kales'],
    desserts: ['fruit salad', 'ice cream', 'fruits', 'yogurt', 'mala'],
  };

  const pickRandom = (array, avoid = []) => {
    const available = array.filter(item => !avoid.slice(-4).includes(item));
    const sourceArray = available.length === 0 ? array : available;
    return sourceArray[Math.floor(Math.random() * sourceArray.length)];
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const generateBreakfast = (used) => {
    const recentBreakfast = used.slice(-6);
    
    // Pick one food item (or nothing if just beverage)
    const main = pickRandom(foods.breakfastItems, recentBreakfast);
    
    // ALWAYS pick ONE beverage (tea/coffee/juice/milk/porridge)
    const drink = pickRandom(foods.breakfastDrinks, recentBreakfast);
    
    // Cereal MUST have milk specifically
    if (main === 'cereal') {
      return {
        items: [main, 'milk'],
        description: `${capitalize(main)} with milk`,
      };
    }
    
    // All other items get paired with the random drink
    return {
      items: [main, drink],
      description: `${capitalize(main)} with ${drink}`,
    };
  };

  const generateMeal = (mealType, used, usedProteinsToday = []) => {
    const recentMeals = used.slice(-8);
    const isLegumeDay = Math.random() > 0.6;
    
    let protein;
    if (isLegumeDay) {
      protein = pickRandom(foods.legumes, recentMeals);
    } else {
      // Get available proteins (excluding what was used today)
      const available = Object.entries(foods.proteins)
        .filter(([name, config]) => 
          config.meals.includes(mealType) && !usedProteinsToday.includes(name)
        )
        .map(([name]) => name);
      
      protein = available.length > 0 
        ? pickRandom(available, recentMeals) 
        : pickRandom(Object.keys(foods.proteins), recentMeals);
    }
    
    const carb = pickRandom(foods.carbs, recentMeals);
    const veg = pickRandom(foods.vegetables, recentMeals);
    
    // Dessert: 70% fruits, 30% other desserts (more for dinner)
    const shouldHaveDessert = mealType === 'dinner' ? Math.random() > 0.3 : Math.random() > 0.5;
    const dessert = shouldHaveDessert 
      ? (Math.random() > 0.7 ? pickRandom(['ice cream', 'yogurt', 'mala'], recentMeals) : 'fruits')
      : null;
    
    return {
      items: [protein, carb, veg],
      dessert: dessert,
      description: `${capitalize(protein)}, ${carb}, ${veg}${dessert ? ` • ${capitalize(dessert)}` : ''}`,
    };
  };

  const generateShoppingList = (menuList) => {
    const items = {};
    
    menuList.forEach(menu => {
      [...menu.breakfast.items, ...menu.lunch.items, ...menu.dinner.items].forEach(item => {
        items[item] = (items[item] || 0) + 1;
      });
      
      if (menu.lunch.dessert) items[menu.lunch.dessert] = (items[menu.lunch.dessert] || 0) + 1;
      if (menu.dinner.dessert) items[menu.dinner.dessert] = (items[menu.dinner.dessert] || 0) + 1;
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
        category: 'Breakfast Items',
        items: Object.keys(items).filter(i => 
          foods.breakfastItems.includes(i) || foods.breakfastDrinks.includes(i)
        ).map(i => `${i} (${items[i]}x)`)
      },
      {
        category: 'Desserts & Treats',
        items: Object.keys(items).filter(i => 
          foods.desserts.includes(i)
        ).map(i => `${i} (${items[i]}x)`)
      }
    ];

    setShoppingList(list.filter(section => section.items.length > 0));
  };

  const generateMenu = (duration = planDuration) => {
    const days = duration === 'week' ? 7 : 28;
    const newMenus = [];
    const usedRecently = [...mealHistory];

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let day = 0; day < days; day++) {
      const usedProteinsToday = [];
      
      const breakfast = generateBreakfast(usedRecently);
      const lunch = generateMeal('lunch', usedRecently, usedProteinsToday);
      
      // Track lunch protein so dinner doesn't repeat it
      if (!foods.legumes.includes(lunch.items[0])) {
        usedProteinsToday.push(lunch.items[0]);
      }
      
      const dinner = generateMeal('dinner', usedRecently, usedProteinsToday);
      
      const dayMenu = {
        day: dayNames[day % 7],
        weekNumber: Math.floor(day / 7) + 1,
        breakfast,
        lunch,
        dinner,
      };
      
      newMenus.push(dayMenu);
      
      usedRecently.push(
        ...dayMenu.breakfast.items,
        ...dayMenu.lunch.items,
        ...dayMenu.dinner.items
      );
    }

    setMenus(newMenus);
    setMealHistory(usedRecently.slice(-30));
    generateShoppingList(newMenus);
    setExpandedWeeks([0]);
  };

  const regenerateMeal = (dayIndex, mealType) => {
    const newMenus = [...menus];
    const usedProteinsToday = [];
    
    if (mealType === 'breakfast') {
      newMenus[dayIndex].breakfast = generateBreakfast(mealHistory);
    } else {
      // If regenerating lunch, don't use dinner's protein
      if (mealType === 'lunch' && !foods.legumes.includes(newMenus[dayIndex].dinner.items[0])) {
        usedProteinsToday.push(newMenus[dayIndex].dinner.items[0]);
      }
      // If regenerating dinner, don't use lunch's protein
      if (mealType === 'dinner' && !foods.legumes.includes(newMenus[dayIndex].lunch.items[0])) {
        usedProteinsToday.push(newMenus[dayIndex].lunch.items[0]);
      }
      
      newMenus[dayIndex][mealType] = generateMeal(mealType, mealHistory, usedProteinsToday);
    }
    
    setMenus(newMenus);
    generateShoppingList(newMenus);
  };

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev => 
      prev.includes(weekNum) 
        ? prev.filter(w => w !== weekNum)
        : [...prev, weekNum]
    );
  };

  // Initialize on first render
  if (!initialized) {
    setInitialized(true);
    setTimeout(() => generateMenu('week'), 0);
  }

  // Group menus by week
  const menusByWeek = planDuration === 'month' 
    ? Array.from({ length: 4 }, (_, i) => ({
        weekNumber: i + 1,
        days: menus.slice(i * 7, (i + 1) * 7)
      }))
    : [{ weekNumber: 1, days: menus }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-500" />
            Smart Menu Planner
          </h1>
          <p className="text-gray-600">Balanced meals • No protein repeats • Household ready</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPlanDuration('week');
                generateMenu('week');
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                planDuration === 'week'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-orange-200'
              }`}
            >
              1 Week Plan
            </button>
            <button
              onClick={() => {
                setPlanDuration('month');
                generateMenu('month');
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                planDuration === 'month'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-orange-200'
              }`}
            >
              1 Month Plan
            </button>
          </div>
          <button
            onClick={() => generateMenu()}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
          >
            <RefreshCw size={20} />
            Regenerate Menu
          </button>
        </div>

        {/* Menu Grid by Week */}
        {menusByWeek.map((week) => (
          <div key={week.weekNumber} className="mb-6">
            {planDuration === 'month' && (
              <button
                onClick={() => toggleWeek(week.weekNumber - 1)}
                className="w-full bg-white rounded-xl shadow-md p-4 mb-4 flex items-center justify-between hover:shadow-lg transition-all"
              >
                <h2 className="text-2xl font-bold text-gray-800">Week {week.weekNumber}</h2>
                {expandedWeeks.includes(week.weekNumber - 1) ? (
                  <ChevronUp className="text-gray-600" />
                ) : (
                  <ChevronDown className="text-gray-600" />
                )}
              </button>
            )}
            
            {(planDuration === 'week' || expandedWeeks.includes(week.weekNumber - 1)) && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {week.days.map((menu, dayIndex) => {
                  const actualIndex = (week.weekNumber - 1) * 7 + dayIndex;
                  return (
                    <div key={actualIndex} className="bg-white rounded-xl shadow-lg p-5 border-2 border-orange-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="text-orange-500" size={20} />
                        <h3 className="text-xl font-bold text-gray-800">{menu.day}</h3>
                      </div>

                      {/* Breakfast */}
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-orange-600 text-sm">🌅 Breakfast</h4>
                          <button
                            onClick={() => regenerateMeal(actualIndex, 'breakfast')}
                            className="text-gray-500 hover:text-orange-500"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                        <p className="text-gray-700 text-xs">{menu.breakfast.description}</p>
                      </div>

                      {/* Lunch */}
                      <div className="mb-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-green-600 text-sm">☀️ Lunch</h4>
                          <button
                            onClick={() => regenerateMeal(actualIndex, 'lunch')}
                            className="text-gray-500 hover:text-green-500"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                        <p className="text-gray-700 text-xs">{menu.lunch.description}</p>
                      </div>

                      {/* Dinner */}
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-blue-600 text-sm">🌙 Dinner</h4>
                          <button
                            onClick={() => regenerateMeal(actualIndex, 'dinner')}
                            className="text-gray-500 hover:text-blue-500"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                        <p className="text-gray-700 text-xs">{menu.dinner.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Shopping List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="text-green-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Shopping List ({planDuration === 'week' ? '1 Week' : '1 Month'})</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="mt-6 bg-orange-100 rounded-xl p-4">
          <p className="text-gray-700 text-sm">
            💡 <strong>Meal Tips:</strong> Each meal has exactly 3 balanced components (protein/carb/vegetable). 
            Proteins never repeat on the same day. Desserts (mostly fruits) come after main meals. 
            Breakfast always includes one of three drinks: tea, coffee, or juice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuPlanner;